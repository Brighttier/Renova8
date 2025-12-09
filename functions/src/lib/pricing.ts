import { GEMINI_PRICING, DEFAULT_MARGIN } from "../config";
import { PricingTier } from "../types";

/**
 * Get the appropriate pricing tier based on model and context length
 *
 * @param modelKey - The Gemini model identifier (e.g., "gemini-3-pro-preview")
 * @param contextTokens - Total tokens in context (input + output)
 * @returns The pricing tier with inputPer1M and outputPer1M rates
 * @throws Error if modelKey is not found in GEMINI_PRICING
 */
export function getGeminiTierPricing(
  modelKey: string,
  contextTokens: number
): PricingTier {
  const config = GEMINI_PRICING[modelKey];

  if (!config) {
    // Default to gemini-3-pro-preview pricing if model not found
    console.warn(`Unknown modelKey: ${modelKey}, defaulting to gemini-3-pro-preview`);
    const defaultConfig = GEMINI_PRICING["gemini-3-pro-preview"];
    return defaultConfig.tiers[0];
  }

  // Find the appropriate tier based on context length
  const tier = config.tiers.find(
    (t) => t.maxContextTokens === null || contextTokens <= t.maxContextTokens
  );

  // Fallback to the last tier if none match
  return tier ?? config.tiers[config.tiers.length - 1];
}

/**
 * Calculate the raw Gemini API cost in USD for a given usage
 *
 * @param modelKey - The Gemini model identifier
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @returns The raw cost in USD (before margin)
 */
export function computeGeminiCostUSD(
  modelKey: string,
  inputTokens: number,
  outputTokens: number
): number {
  const contextTokens = inputTokens + outputTokens;
  const tier = getGeminiTierPricing(modelKey, contextTokens);

  // Convert per-1M rates to actual costs
  const inputCost = (inputTokens / 1_000_000) * tier.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * tier.outputPer1M;

  return inputCost + outputCost;
}

/**
 * Calculate the user-facing price per 1K tokens (with margin)
 *
 * This uses a blended rate assuming roughly 50/50 input/output usage,
 * which is a reasonable approximation for most AI interactions.
 *
 * @param modelKey - The Gemini model identifier
 * @param margin - Profit margin (default: 45%)
 * @param options - Optional context token estimate for tier selection
 * @returns Price per 1K user tokens in USD
 */
export function computeUserPricePer1KTokens(
  modelKey: string,
  margin: number = DEFAULT_MARGIN,
  options?: { contextTokensEstimate?: number }
): number {
  const contextTokens = options?.contextTokensEstimate ?? 50_000;
  const tier = getGeminiTierPricing(modelKey, contextTokens);

  // Convert per-1M to per-1K
  const inputPer1K = tier.inputPer1M / 1000;
  const outputPer1K = tier.outputPer1M / 1000;

  // Blended cost (assume 50/50 input/output ratio)
  const blendedCostPer1K = (inputPer1K + outputPer1K) / 2;

  // Apply margin: price = cost * (1 + margin)
  const userPricePer1K = blendedCostPer1K * (1 + margin);

  return userPricePer1K;
}

/**
 * Calculate the USD price for a token pack
 *
 * @param modelKey - The Gemini model identifier (cost basis)
 * @param tokensInPack - Number of tokens in the pack
 * @param margin - Profit margin (default: 45%)
 * @returns The pack price in USD
 */
export function computePackPriceUSD(
  modelKey: string,
  tokensInPack: number,
  margin: number = DEFAULT_MARGIN
): number {
  const pricePer1K = computeUserPricePer1KTokens(modelKey, margin);
  return (tokensInPack / 1000) * pricePer1K;
}

/**
 * Convert a raw Gemini cost to user tokens to debit
 *
 * This is the inverse of the pricing calculation - given what we paid,
 * how many user tokens should we deduct?
 *
 * @param modelKey - The Gemini model identifier
 * @param costUSD - The raw Gemini API cost in USD
 * @param margin - Profit margin (default: 45%)
 * @param contextTokens - Optional context tokens for tier selection
 * @returns Number of user tokens to debit (rounded up)
 */
export function convertCostToUserTokens(
  modelKey: string,
  costUSD: number,
  margin: number = DEFAULT_MARGIN,
  contextTokens?: number
): number {
  const userPricePer1K = computeUserPricePer1KTokens(modelKey, margin, {
    contextTokensEstimate: contextTokens,
  });

  // tokens = (cost / pricePer1K) * 1000
  const rawTokens = (costUSD / userPricePer1K) * 1000;

  // Round up to ensure we never lose money on a call
  return Math.ceil(rawTokens);
}

/**
 * Estimate minimum tokens required for a Gemini call
 *
 * This is a rough estimate used for pre-flight balance checks.
 * Actual usage will vary based on response length.
 *
 * @param modelKey - The Gemini model identifier
 * @param estimatedInputTokens - Estimated input token count
 * @param estimatedOutputTokens - Estimated output token count (default: 1000)
 * @returns Estimated tokens to debit
 */
export function estimateRequiredTokens(
  modelKey: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number = 1000
): number {
  const estimatedCost = computeGeminiCostUSD(
    modelKey,
    estimatedInputTokens,
    estimatedOutputTokens
  );
  return convertCostToUserTokens(modelKey, estimatedCost);
}

/**
 * Format token price for display
 *
 * @param tokens - Number of tokens
 * @param modelKey - The Gemini model identifier
 * @param margin - Profit margin (default: 45%)
 * @returns Formatted price string (e.g., "$4.99")
 */
export function formatPackPrice(
  tokens: number,
  modelKey: string,
  margin: number = DEFAULT_MARGIN
): string {
  const price = computePackPriceUSD(modelKey, tokens, margin);
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate suggested retail prices for token packs
 * These are "nice" prices rounded up from the computed price
 */
export function getSuggestedRetailPrice(computedPrice: number): number {
  // Round up to nearest $0.99 or $4.99 threshold
  if (computedPrice < 5) {
    return 4.99;
  } else if (computedPrice < 15) {
    return 14.99;
  } else if (computedPrice < 25) {
    return 19.99;
  } else if (computedPrice < 50) {
    return 49.99;
  } else if (computedPrice < 80) {
    return 79.99;
  } else {
    return Math.ceil(computedPrice / 10) * 10 - 0.01;
  }
}
