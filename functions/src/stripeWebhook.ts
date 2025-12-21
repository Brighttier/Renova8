import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { verifyWebhookSignature, getStripe } from "./lib/stripe";
import { grantTokens } from "./lib/credits";
import { SUBSCRIPTION_PLANS, HOSTING_LIMITS } from "./config";
import Stripe from "stripe";

const db = admin.firestore();

/**
 * HTTP function: Handle Stripe webhook events
 *
 * This endpoint receives events from Stripe and processes them:
 * - checkout.session.completed: Grants tokens to user after successful payment
 *
 * Features:
 * - Signature verification for security
 * - Idempotency via processedStripeEvents collection
 * - Graceful error handling (returns 200 to prevent Stripe retries on logic errors)
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  // Get Stripe signature
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    functions.logger.error("Missing Stripe signature header");
    res.status(400).send("Missing signature");
    return;
  }

  // Verify webhook signature
  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(req.rawBody, signature);
  } catch (error: any) {
    functions.logger.error("Webhook signature verification failed:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  functions.logger.info(`Received Stripe event: ${event.type} (${event.id})`);

  // Check for idempotency - have we already processed this event?
  const eventRef = db.collection("processedStripeEvents").doc(event.id);
  const existingEvent = await eventRef.get();

  if (existingEvent.exists) {
    functions.logger.info(`Event ${event.id} already processed, skipping`);
    res.status(200).send("Already processed");
    return;
  }

  // Process the event based on type
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event);
        break;
      }

      case "payment_intent.succeeded": {
        // Optional: Could use this for additional tracking
        functions.logger.info(
          `Payment intent succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`
        );
        break;
      }

      case "payment_intent.payment_failed": {
        // Log failed payments for monitoring
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        functions.logger.warn(
          `Payment failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message}`
        );
        break;
      }

      // Subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleSubscriptionUpdate(event);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionCanceled(event);
        break;
      }

      case "invoice.paid": {
        // Handle subscription renewal - grant monthly credits
        await handleInvoicePaid(event);
        break;
      }

      case "invoice.payment_failed": {
        // Log failed invoice payments
        const invoice = event.data.object as Stripe.Invoice;
        functions.logger.warn(
          `Invoice payment failed: ${invoice.id}, subscription: ${invoice.subscription}`
        );
        break;
      }

      default:
        functions.logger.info(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await eventRef.set({
      eventId: event.id,
      eventType: event.type,
      processedAt: Timestamp.now(),
      paymentIntentId: (event.data.object as any).payment_intent || null,
      userId: (event.data.object as any).metadata?.userId || null,
    });

    res.status(200).send("OK");
  } catch (error: any) {
    functions.logger.error(`Error processing event ${event.id}:`, error);

    // Still return 200 to prevent Stripe from retrying
    // We log the error for manual investigation
    res.status(200).send("Error logged");
  }
});

/**
 * Handle checkout.session.completed event
 * Grants tokens to the user after successful payment
 */
async function handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  functions.logger.info(
    `Processing checkout session: ${session.id}, payment status: ${session.payment_status}`
  );

  // Only process paid sessions
  if (session.payment_status !== "paid") {
    functions.logger.info(`Session ${session.id} not paid, skipping token grant`);
    return;
  }

  // Extract metadata
  const userId = session.metadata?.userId;
  const packId = session.metadata?.packId;
  const tokens = parseInt(session.metadata?.tokens || "0", 10);

  if (!userId) {
    functions.logger.error(`Missing userId in session metadata: ${session.id}`);
    return;
  }

  if (!tokens || tokens <= 0) {
    functions.logger.error(
      `Invalid token count in session metadata: ${session.id}, tokens: ${session.metadata?.tokens}`
    );
    return;
  }

  // Grant tokens to user
  try {
    const newBalance = await grantTokens({
      userId,
      tokens,
      type: "PURCHASE_TOP_UP",
      description: `Purchased ${packId || "token"} pack (${tokens.toLocaleString()} tokens)`,
      stripePaymentIntentId: session.payment_intent as string,
      stripeEventId: event.id,
    });

    functions.logger.info(
      `Granted ${tokens} tokens to user ${userId}. New balance: ${newBalance}`
    );
  } catch (error: any) {
    functions.logger.error(
      `Failed to grant tokens to user ${userId}:`,
      error.message
    );

    // Check if this is a duplicate grant (race condition)
    if (error.message?.includes("unique constraint")) {
      functions.logger.info("Duplicate grant detected, likely race condition");
      return;
    }

    throw error;
  }
}

/**
 * Handle subscription created/updated events
 * Updates user's plan, hosting slots, and subscription status
 */
async function handleSubscriptionUpdate(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  functions.logger.info(
    `Processing subscription update: ${subscription.id}, status: ${subscription.status}`
  );

  // Get user ID from subscription metadata
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by Stripe customer ID
    const customerId = subscription.customer as string;
    const usersSnapshot = await db
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      functions.logger.error(
        `No user found for subscription ${subscription.id}, customer: ${customerId}`
      );
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    await updateUserSubscription(userDoc.id, subscription);
    return;
  }

  await updateUserSubscription(userId, subscription);
}

/**
 * Update user document with subscription details
 */
async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const userRef = db.collection("users").doc(userId);
  const subscriptionRef = db.collection("subscriptions").doc(subscription.id);

  // Get pack ID from subscription metadata
  const packId = subscription.metadata?.packId;

  // Determine plan and hosting slots from pack
  let currentPlan: "free" | "beginner" | "agency50" = "free";
  let hostingSlots = 0;
  let hostingType: "static" | "dynamic" = "static";

  if (packId === "agency50") {
    currentPlan = "agency50";
    hostingSlots = HOSTING_LIMITS.agency50;
    hostingType = SUBSCRIPTION_PLANS.agency50.dynamicHosting ? "dynamic" : "static";
  } else if (packId === "beginner") {
    currentPlan = "beginner";
    hostingSlots = HOSTING_LIMITS.beginner;
  }

  // Map Stripe subscription status
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    trialing: "trialing",
    incomplete: "pending",
    incomplete_expired: "canceled",
    unpaid: "past_due",
    paused: "canceled",
  };
  const subscriptionStatus = statusMap[subscription.status] || subscription.status;

  // Update user document
  const updateData: Record<string, any> = {
    subscriptionId: subscription.id,
    subscriptionStatus,
    currentPlan,
    hostingType,
    updatedAt: Timestamp.now(),
  };

  // Only update hosting slots if subscription is active
  if (subscription.status === "active" || subscription.status === "trialing") {
    updateData.hostingSlots = hostingSlots;
    // Mark user as non-trial once they have a subscription
    updateData.isTrialUser = false;
  }

  await userRef.update(updateData);

  // Create/update subscription document
  const subscriptionData = {
    id: subscription.id,
    userId,
    stripeCustomerId: subscription.customer as string,
    planId: packId || "unknown",
    status: subscriptionStatus,
    currentPeriodStart: Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: Timestamp.now(),
  };

  // Use set with merge to create or update
  await subscriptionRef.set(subscriptionData, { merge: true });

  // Add createdAt only if it's a new subscription
  const existingSubscription = await subscriptionRef.get();
  if (!existingSubscription.exists || !existingSubscription.data()?.createdAt) {
    await subscriptionRef.update({
      createdAt: Timestamp.now(),
    });
  }

  functions.logger.info(
    `Updated subscription for user ${userId}: plan=${currentPlan}, status=${subscriptionStatus}, slots=${hostingSlots}`
  );
}

/**
 * Handle subscription canceled/deleted event
 * Resets user to free plan
 */
async function handleSubscriptionCanceled(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  functions.logger.info(`Processing subscription cancellation: ${subscription.id}`);

  // Get user ID from subscription metadata or customer lookup
  let userId = subscription.metadata?.userId;

  if (!userId) {
    const customerId = subscription.customer as string;
    const usersSnapshot = await db
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      functions.logger.error(
        `No user found for canceled subscription ${subscription.id}`
      );
      return;
    }

    userId = usersSnapshot.docs[0].id;
  }

  // Update user to free plan, but preserve existing hosting slots used
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  // If user is using hosted sites, we don't remove slots immediately
  // They can keep existing sites but can't add new ones
  await userRef.update({
    subscriptionId: null,
    subscriptionStatus: "canceled",
    currentPlan: "free",
    // Don't reset hostingSlots to 0 immediately - let them keep existing sites
    // New sites will be blocked by checking plan status
    updatedAt: Timestamp.now(),
  });

  // Update subscription document
  const subscriptionRef = db.collection("subscriptions").doc(subscription.id);
  await subscriptionRef.update({
    status: "canceled",
    canceledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  functions.logger.info(
    `Subscription canceled for user ${userId}. Previous hosting slots: ${userData?.hostingSlots || 0}`
  );
}

/**
 * Handle invoice.paid event
 * Grants monthly credits for subscription renewals
 */
async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  // Only process subscription invoices
  if (!invoice.subscription) {
    functions.logger.info(`Invoice ${invoice.id} is not a subscription invoice, skipping`);
    return;
  }

  // Skip if this is the first invoice (handled by checkout.session.completed)
  if (invoice.billing_reason === "subscription_create") {
    functions.logger.info(
      `Invoice ${invoice.id} is initial subscription, handled by checkout event`
    );
    return;
  }

  functions.logger.info(
    `Processing subscription renewal invoice: ${invoice.id}, reason: ${invoice.billing_reason}`
  );

  // Get subscription details to find user and pack
  const stripe = getStripe();
  const subscriptionId = invoice.subscription as string;

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    functions.logger.error(`Failed to retrieve subscription ${subscriptionId}:`, error);
    return;
  }

  // Get user ID from subscription metadata
  let userId = subscription.metadata?.userId;
  const packId = subscription.metadata?.packId;

  if (!userId) {
    // Fallback: Find user by customer ID
    const customerId = subscription.customer as string;
    const usersSnapshot = await db
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      functions.logger.error(
        `No user found for invoice ${invoice.id}, customer: ${customerId}`
      );
      return;
    }

    userId = usersSnapshot.docs[0].id;
  }

  // Determine credits to grant based on pack
  let creditsToGrant = 0;
  if (packId === "agency50") {
    creditsToGrant = SUBSCRIPTION_PLANS.agency50.credits; // 5000
  }

  if (creditsToGrant <= 0) {
    functions.logger.info(
      `No credits to grant for invoice ${invoice.id}, packId: ${packId}`
    );
    return;
  }

  // Grant credits
  try {
    const newBalance = await grantTokens({
      userId,
      tokens: creditsToGrant,
      type: "PURCHASE_TOP_UP",
      description: `Monthly subscription renewal - ${packId} (${creditsToGrant.toLocaleString()} credits)`,
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeEventId: event.id,
    });

    functions.logger.info(
      `Granted ${creditsToGrant} credits to user ${userId} for subscription renewal. New balance: ${newBalance}`
    );
  } catch (error: any) {
    functions.logger.error(
      `Failed to grant credits to user ${userId} for invoice ${invoice.id}:`,
      error.message
    );
    throw error;
  }

  // Update user's billing cycle
  const userRef = db.collection("users").doc(userId);
  await userRef.update({
    billingCycleStart: Timestamp.fromMillis(subscription.current_period_start * 1000),
    nextBillingDate: Timestamp.fromMillis(subscription.current_period_end * 1000),
    updatedAt: Timestamp.now(),
  });
}
