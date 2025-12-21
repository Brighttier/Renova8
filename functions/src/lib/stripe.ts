import Stripe from "stripe";
import * as functions from "firebase-functions";

/**
 * Stripe client instance
 * Uses the secret key from environment variables
 */
let stripeClient: Stripe | null = null;

/**
 * Get or create Stripe client instance
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY environment variable is not set. " +
        "Please set it in your Firebase Functions configuration."
      );
    }

    stripeClient = new Stripe(secretKey, {
      // Use the latest API version supported by Stripe SDK v14
      apiVersion: "2024-11-20.acacia" as any,
      typescript: true,
    });
  }

  return stripeClient;
}

/**
 * Get or create a Stripe customer for a user
 *
 * If the user already has a Stripe customer ID, we verify it exists.
 * If not, we create a new customer and return its ID.
 *
 * @param userId - Firebase user ID (used as metadata)
 * @param email - User's email address
 * @param existingCustomerId - Optional existing Stripe customer ID
 * @returns Stripe customer ID
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  existingCustomerId?: string
): Promise<string> {
  const stripe = getStripe();

  // If we have an existing customer ID, verify it
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return existingCustomerId;
      }
    } catch (error) {
      // Customer doesn't exist, create a new one
      functions.logger.warn(
        `Existing customer ${existingCustomerId} not found, creating new one`
      );
    }
  }

  // Check if customer with this email already exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    functions.logger.info(`Found existing Stripe customer for ${email}: ${customer.id}`);
    return customer.id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      firebaseUserId: userId,
    },
  });

  functions.logger.info(`Created new Stripe customer for ${email}: ${customer.id}`);
  return customer.id;
}

/**
 * Checkout mode types
 */
export type CheckoutMode = "payment" | "subscription";

/**
 * Parameters for creating a checkout session
 */
interface CreateCheckoutSessionParams {
  customerId: string;
  priceId: string;
  userId: string;
  packId: string;
  tokens: number;
  successUrl: string;
  cancelUrl: string;
  mode: CheckoutMode;
  hostingSlots?: number;
}

/**
 * Create a Stripe Checkout Session for purchasing tokens or subscriptions
 *
 * @param params - Checkout session parameters
 * @returns The checkout session URL
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: params.mode,
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: params.userId,
      packId: params.packId,
      tokens: params.tokens.toString(),
      hostingSlots: (params.hostingSlots || 0).toString(),
    },
    // Subscription metadata stored on the subscription object
    ...(params.mode === "subscription" && {
      subscription_data: {
        metadata: {
          userId: params.userId,
          packId: params.packId,
          tokens: params.tokens.toString(),
          hostingSlots: (params.hostingSlots || 0).toString(),
        },
      },
    }),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    // Allow promotion codes
    allow_promotion_codes: true,
    // Collect billing address for receipts
    billing_address_collection: "auto",
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  functions.logger.info(
    `Created ${params.mode} checkout session ${session.id} for user ${params.userId}, pack ${params.packId}`
  );

  return session.url;
}

/**
 * Cancel a Stripe subscription
 *
 * @param subscriptionId - Stripe subscription ID
 * @param cancelAtPeriodEnd - If true, cancel at end of billing period; if false, cancel immediately
 * @returns Updated subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Get a Stripe subscription by ID
 *
 * @param subscriptionId - Stripe subscription ID
 * @returns Subscription object or null if not found
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    functions.logger.error(`Failed to retrieve subscription ${subscriptionId}:`, error);
    return null;
  }
}

/**
 * Verify a Stripe webhook signature
 *
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Verified Stripe event
 * @throws Error if signature verification fails
 */
export function verifyWebhookSignature(
  payload: Buffer | string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET environment variable is not set. " +
      "Please set it in your Firebase Functions configuration."
    );
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get a Stripe Price by ID
 *
 * @param priceId - Stripe Price ID
 * @returns Price object or null if not found
 */
export async function getPrice(priceId: string): Promise<Stripe.Price | null> {
  const stripe = getStripe();

  try {
    return await stripe.prices.retrieve(priceId);
  } catch (error) {
    functions.logger.error(`Failed to retrieve price ${priceId}:`, error);
    return null;
  }
}

/**
 * Create a Stripe Product and Price for a token pack
 * (Admin utility - typically used once during setup)
 *
 * @param name - Product name
 * @param tokens - Number of tokens in pack
 * @param priceUSD - Price in USD
 * @returns Object with productId and priceId
 */
export async function createProductAndPrice(
  name: string,
  tokens: number,
  priceUSD: number
): Promise<{ productId: string; priceId: string }> {
  const stripe = getStripe();

  // Create product
  const product = await stripe.products.create({
    name,
    description: `${tokens.toLocaleString()} AI tokens for Renova8`,
    metadata: {
      tokens: tokens.toString(),
    },
  });

  // Create price (in cents)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(priceUSD * 100),
    currency: "usd",
    metadata: {
      tokens: tokens.toString(),
    },
  });

  functions.logger.info(
    `Created Stripe product ${product.id} with price ${price.id} for ${name}`
  );

  return {
    productId: product.id,
    priceId: price.id,
  };
}

/**
 * Get customer's payment methods
 *
 * @param customerId - Stripe customer ID
 * @returns Array of payment methods
 */
export async function getPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return paymentMethods.data;
}

/**
 * Get customer's billing history
 *
 * @param customerId - Stripe customer ID
 * @param limit - Maximum number of charges to return
 * @returns Array of charges
 */
export async function getBillingHistory(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Charge[]> {
  const stripe = getStripe();

  const charges = await stripe.charges.list({
    customer: customerId,
    limit,
  });

  return charges.data;
}
