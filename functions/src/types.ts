import { Timestamp } from "firebase-admin/firestore";

// ============================================
// User & Authentication Types
// ============================================

export type UserPlan = "free" | "beginner" | "agency50";
export type HostingType = "static" | "dynamic";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  stripeCustomerId?: string;
  tokenBalance: number;
  isTrialUser: boolean;
  trialEndsAt?: Timestamp;

  // Subscription & Plan
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  currentPlan: UserPlan;

  // Hosting
  hostingSlots: number;
  hostingSlotsUsed: number;
  hostingType: HostingType;

  // Maintenance add-on
  maintenanceEnabled: boolean;
  maintenanceSites: string[]; // Website IDs under maintenance

  // Billing cycle
  billingCycleStart?: Timestamp;
  nextBillingDate?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Credit Transaction Types
// ============================================

export type CreditTransactionType =
  | "INITIAL_GRANT"
  | "PURCHASE_TOP_UP"
  | "USAGE_DEBIT"
  | "MANUAL_ADJUSTMENT";

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  tokens: number; // positive for grants, negative for debits
  description?: string;
  stripePaymentIntentId?: string;
  stripeEventId?: string;
  balanceAfter: number;
  createdAt: Timestamp;
}

// ============================================
// Gemini Usage Types
// ============================================

export interface GeminiUsageLog {
  id: string;
  userId: string;
  modelKey: string;
  inputTokens: number;
  outputTokens: number;
  contextTokens: number;
  costUSD: number;
  debitedTokens: number;
  feature: string;
  requestId?: string;
  createdAt: Timestamp;
}

// ============================================
// Token Pack Types
// ============================================

export type PackType = "one-time" | "subscription";
export type BillingPeriod = "monthly" | "yearly";

export interface TokenPack {
  id: string;
  name: string;
  credits: number;
  priceUSD: number;
  stripePriceId: string;
  stripeProductId: string;
  type: PackType;
  billingPeriod?: BillingPeriod;
  hostingSlots: number;
  hostingType: HostingType;
  dynamicHosting?: boolean;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TokenPackConfig {
  id: string;
  name: string;
  tokens: number;
  modelKey: string;
}

// ============================================
// Subscription Types
// ============================================

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: "agency50" | "maintenance";
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Stripe Event Types
// ============================================

export interface ProcessedStripeEvent {
  eventId: string;
  eventType: string;
  processedAt: Timestamp;
  paymentIntentId?: string;
  userId?: string;
}

// ============================================
// Pricing Types
// ============================================

export interface PricingTier {
  maxContextTokens: number | null;
  inputPer1M: number;
  outputPer1M: number;
}

export interface ModelPricing {
  tiers: PricingTier[];
}

// ============================================
// API Request/Response Types
// ============================================

export interface GetCreditsResponse {
  tokenBalance: number;
  isTrialUser: boolean;
  trialEndsAt?: string; // ISO string
  trialDaysRemaining?: number;
  transactions: CreditTransaction[];
  // Plan & Subscription
  currentPlan: UserPlan;
  subscriptionStatus?: SubscriptionStatus;
  // Hosting
  hostingSlots: number;
  hostingSlotsUsed: number;
}

export interface CreateCheckoutRequest {
  packId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
}

export interface GeminiChatRequest {
  prompt: string;
  modelKey?: string;
  feature?: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
}

export interface GeminiChatResponse {
  text: string;
  tokensUsed: number;
  tokenBalance: number;
}

// ============================================
// Internal Types
// ============================================

export interface GrantTokensParams {
  userId: string;
  tokens: number;
  type: "INITIAL_GRANT" | "PURCHASE_TOP_UP" | "MANUAL_ADJUSTMENT";
  description?: string;
  stripePaymentIntentId?: string;
  stripeEventId?: string;
}

export interface DebitTokensParams {
  userId: string;
  tokens: number;
  description: string;
  feature: string;
}

export interface GeminiCallParams {
  userId: string;
  modelKey: string;
  prompt: string;
  feature: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
}

export interface GeminiCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  tokensDebited: number;
  newBalance: number;
}
