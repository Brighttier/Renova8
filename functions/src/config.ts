import { TokenPackConfig, ModelPricing } from "./types";

// ============================================
// Initial Signup Configuration
// ============================================

/**
 * Number of tokens granted to new users upon signup
 */
export const INITIAL_SIGNUP_TOKENS = 2000;

// ============================================
// Profit Margin Configuration
// ============================================

/**
 * Default profit margin (45%) applied to Gemini API costs
 * This ensures we make 40-50% profit after paying Gemini's API costs
 */
export const DEFAULT_MARGIN = 0.45;

// ============================================
// Gemini Model Pricing
// ============================================

/**
 * Gemini 3.0 Pro pricing per 1M tokens
 * Tiered based on context length
 */
export const GEMINI_PRICING: Record<string, ModelPricing> = {
  "gemini-3-pro-preview": {
    tiers: [
      {
        // Context length up to 200,000 tokens
        maxContextTokens: 200_000,
        inputPer1M: 2.0,   // USD per 1M input tokens
        outputPer1M: 12.0, // USD per 1M output tokens
      },
      {
        // Context length > 200,000 tokens
        maxContextTokens: null, // No upper bound
        inputPer1M: 4.0,   // USD per 1M input tokens
        outputPer1M: 18.0, // USD per 1M output tokens
      },
    ],
  },
  // Gemini 2.5 Flash - faster, cheaper option
  "gemini-2.5-flash": {
    tiers: [
      {
        maxContextTokens: null,
        inputPer1M: 0.075,
        outputPer1M: 0.30,
      },
    ],
  },
  // Gemini 2.5 Flash Preview (for leads/maps)
  "gemini-2.5-flash-preview": {
    tiers: [
      {
        maxContextTokens: null,
        inputPer1M: 0.075,
        outputPer1M: 0.30,
      },
    ],
  },
};

// ============================================
// Token Pack Configuration
// ============================================

/**
 * Available token packs for purchase
 * Prices are calculated based on Gemini costs + margin
 */
export const TOKEN_PACKS: Record<string, TokenPackConfig> = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    tokens: 5_000,
    modelKey: "gemini-3-pro-preview",
  },
  pro: {
    id: "pro",
    name: "Pro Pack",
    tokens: 25_000,
    modelKey: "gemini-3-pro-preview",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Pack",
    tokens: 100_000,
    modelKey: "gemini-3-pro-preview",
  },
};

// ============================================
// Feature Credit Costs (Legacy/Reference)
// ============================================

/**
 * Approximate credit costs per feature
 * These are reference values - actual costs are computed from Gemini token usage
 */
export const FEATURE_CREDIT_ESTIMATES = {
  lead_search: 5,
  brand_analysis: 5,
  pitch_email: 3,
  website_concept: 10,
  website_build: 15,
  image_generation: 10,
  video_generation: 20,
  marketing_strategy: 5,
  chat: 2,
};

// ============================================
// URLs Configuration
// ============================================

/**
 * Default URLs for Stripe checkout redirects
 */
export const DEFAULT_SUCCESS_URL = "https://renova8.app/settings?checkout=success";
export const DEFAULT_CANCEL_URL = "https://renova8.app/settings?checkout=canceled";

// ============================================
// Rate Limiting Configuration
// ============================================

/**
 * Minimum token balance required to make a Gemini call
 * Prevents users from making calls they can't afford
 */
export const MINIMUM_BALANCE_FOR_CALL = 10;

/**
 * Maximum transactions to return in getCredits response
 */
export const MAX_TRANSACTIONS_RETURNED = 50;
