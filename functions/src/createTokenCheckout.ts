import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { TOKEN_PACKS, DEFAULT_SUCCESS_URL, DEFAULT_CANCEL_URL, HOSTING_LIMITS } from "./config";
import { getOrCreateCustomer, createCheckoutSession, CheckoutMode } from "./lib/stripe";
import { getUser, updateStripeCustomerId } from "./lib/credits";
import { CreateCheckoutRequest, CreateCheckoutResponse } from "./types";

const db = admin.firestore();

/**
 * Callable function: Create a Stripe Checkout Session for purchasing credits or subscriptions
 *
 * Request body:
 * - packId: string - The pack to purchase ("beginner", "topup_1000", "agency50")
 * - successUrl?: string - URL to redirect after successful payment
 * - cancelUrl?: string - URL to redirect if user cancels
 *
 * Returns:
 * - checkoutUrl: string - URL to redirect user to Stripe Checkout
 *
 * @requires Authentication - User must be logged in
 */
export const createTokenCheckout = functions.https.onCall(
  async (data: CreateCheckoutRequest, context): Promise<CreateCheckoutResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to purchase credits."
      );
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    if (!userEmail) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Your account does not have an email address. Please update your profile."
      );
    }

    // Validate pack ID
    const { packId, successUrl, cancelUrl } = data;

    if (!packId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Pack ID is required."
      );
    }

    const packConfig = TOKEN_PACKS[packId];

    if (!packConfig) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid pack ID: ${packId}. Available packs: ${Object.keys(TOKEN_PACKS).join(", ")}`
      );
    }

    try {
      // Get or create user document
      let user = await getUser(userId);

      // Get Stripe customer ID
      let stripeCustomerId = user?.stripeCustomerId;

      if (!stripeCustomerId) {
        stripeCustomerId = await getOrCreateCustomer(userId, userEmail);
        await updateStripeCustomerId(userId, stripeCustomerId);
        functions.logger.info(
          `Created/linked Stripe customer ${stripeCustomerId} for user ${userId}`
        );
      }

      // Get token pack configuration from Firestore
      const packDoc = await db.collection("tokenPacks").doc(packId).get();

      if (!packDoc.exists) {
        functions.logger.error(`Token pack ${packId} not found in Firestore`);
        throw new functions.https.HttpsError(
          "not-found",
          "Token pack configuration not found. Please contact support."
        );
      }

      const packData = packDoc.data();
      const stripePriceId = packData?.stripePriceId;

      if (!stripePriceId) {
        functions.logger.error(`Token pack ${packId} has no Stripe price ID`);
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Token pack is not configured for purchase. Please contact support."
        );
      }

      // Determine checkout mode based on pack type
      const isSubscription = packData?.type === "subscription";
      const mode: CheckoutMode = isSubscription ? "subscription" : "payment";

      // Get hosting slots for this pack
      const hostingSlots = packData?.hostingSlots || HOSTING_LIMITS[packId as keyof typeof HOSTING_LIMITS] || 0;

      // Create checkout session
      const checkoutUrl = await createCheckoutSession({
        customerId: stripeCustomerId,
        priceId: stripePriceId,
        userId,
        packId,
        tokens: packConfig.tokens,
        successUrl: successUrl || DEFAULT_SUCCESS_URL,
        cancelUrl: cancelUrl || DEFAULT_CANCEL_URL,
        mode,
        hostingSlots,
      });

      functions.logger.info(
        `Created ${mode} checkout session for user ${userId}, pack ${packId} (${packConfig.tokens} credits, ${hostingSlots} hosting slots)`
      );

      return { checkoutUrl };
    } catch (error: any) {
      functions.logger.error(
        `Error creating checkout for user ${userId}:`,
        error
      );

      // Re-throw HttpsErrors as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        "Failed to create checkout session. Please try again."
      );
    }
  }
);
