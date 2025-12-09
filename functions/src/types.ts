import { Timestamp } from "firebase-admin/firestore";

// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  displayName?: string;
  stripeCustomerId?: string;
  tokenBalance: number;
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

export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  priceUSD: number;
  stripePriceId: string;
  stripeProductId: string;
  modelKey: string;
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
  transactions: CreditTransaction[];
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
