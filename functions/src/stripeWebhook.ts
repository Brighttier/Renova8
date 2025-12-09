import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { verifyWebhookSignature } from "./lib/stripe";
import { grantTokens } from "./lib/credits";
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
