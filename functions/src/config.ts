import { TokenPackConfig, ModelPricing } from "./types";

// ============================================
// Initial Signup Configuration
// ============================================

/**
 * Number of credits granted to new users upon signup (free trial)
 * $2 worth for testing (100 credits at $0.02/credit)
 */
export const INITIAL_SIGNUP_CREDITS = 100;

/**
 * Trial duration in days - trial credits expire after this period
 */
export const TRIAL_DURATION_DAYS = 14;

/**
 * Credits per dollar - 1 credit = $0.02
 */
export const CREDITS_PER_DOLLAR = 50;

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
 * Available packs for purchase
 * Based on team monetization strategy
 */
export const TOKEN_PACKS: Record<string, TokenPackConfig> = {
  // One-time purchase - Entry level
  beginner: {
    id: "beginner",
    name: "Beginner Pack",
    tokens: 1_000,  // 1,000 credits = $20 value
    modelKey: "gemini-3-pro-preview",
  },
  // Credit top-up
  topup_1000: {
    id: "topup_1000",
    name: "Credit Top-up",
    tokens: 1_000,  // 1,000 credits = $20
    modelKey: "gemini-3-pro-preview",
  },
  // Agency subscription (monthly)
  agency50: {
    id: "agency50",
    name: "Agency 50",
    tokens: 5_000,  // 5,000 credits/month
    modelKey: "gemini-3-pro-preview",
  },
};

// ============================================
// Hosting Configuration
// ============================================

/**
 * Hosting slots per plan
 */
export const HOSTING_LIMITS = {
  free: 0,
  beginner: 3,       // 1-3 static sites
  agency50: 50,      // Up to 50 static sites
};

/**
 * Subscription plans
 */
export const SUBSCRIPTION_PLANS = {
  beginner: {
    id: "beginner",
    name: "Beginner Pack",
    priceUSD: 20.00,
    type: "one-time" as const,
    credits: 1000,
    hostingSlots: 3,
    hostingType: "static" as const,
  },
  agency50: {
    id: "agency50",
    name: "Agency 50",
    priceUSD: 199.00,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    credits: 5000,        // Monthly allocation
    hostingSlots: 50,
    hostingType: "static" as const,
    dynamicHosting: true,
  },
  maintenance: {
    id: "maintenance",
    name: "Managed Maintenance",
    priceUSD: 50.00,
    type: "subscription" as const,
    billingPeriod: "monthly" as const,
    managedSites: 5,
  },
};

// ============================================
// Credit Costs per Action (Token Markup Strategy)
// ============================================

/**
 * Credit costs per action
 * Based on team pricing strategy with 84-98% profit margins
 * 1 Credit = $0.02 (50 credits per dollar)
 *
 * Pricing:
 * - Lead Discovery: $0.20 (10 credits) - 92% margin
 * - Brand Analysis: $0.10 (5 credits) - 98% margin
 * - Visual Pitch: $1.50 (75 credits) - 84% margin (highest revenue driver)
 * - Copywriting: $0.05 (2 credits) - 98% margin
 * - Site Build: $2.50 (125 credits) - 90% margin
 * - Voice Bot: $0.50/min (25 credits) - 98% margin
 */
export const CREDIT_COSTS = {
  // Lead & Research
  lead_discovery: 10,       // $0.20 - Google Search + Gemini Flash
  brand_analysis: 5,        // $0.10 - Gemini 2.5 Flash

  // Content Generation
  visual_pitch: 75,         // $1.50 - Nano Banana Pro (highest margin driver!)
  copywriting: 2,           // $0.05 - Gemini 2.5 Flash
  pitch_email: 3,           // $0.06 - Gemini 2.5 Flash

  // Website
  website_concept: 15,      // $0.30 - Concept generation
  site_build: 125,          // $2.50 - Gemini 3 Pro (full site)
  site_edit: 10,            // $0.20 - Minor edits

  // Media
  image_generation: 75,     // $1.50 - Nano Banana Pro
  video_generation: 100,    // $2.00 - Video generation

  // AI Assistance
  voice_bot_minute: 25,     // $0.50/min - Flash Audio
  chat_message: 2,          // $0.04 - Gemini 2.5 Flash

  // Marketing
  marketing_strategy: 10,   // $0.20 - Strategy generation
};

/**
 * Legacy reference (deprecated - use CREDIT_COSTS)
 */
export const FEATURE_CREDIT_ESTIMATES = CREDIT_COSTS;

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
