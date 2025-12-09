import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { Timestamp } from "firebase-admin/firestore";
import { computeGeminiCostUSD, convertCostToUserTokens } from "./pricing";
import { debitTokens, checkBalance } from "./credits";
import { GeminiCallParams, GeminiCallResult } from "../types";
import { MINIMUM_BALANCE_FOR_CALL } from "../config";

/**
 * Lazy-initialized Gemini client
 */
let genAIClient: GoogleGenerativeAI | null = null;

/**
 * Get or create Gemini AI client
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAIClient) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY environment variable is not set. " +
        "Please set it in your Firebase Functions configuration."
      );
    }

    genAIClient = new GoogleGenerativeAI(apiKey);
  }

  return genAIClient;
}

/**
 * Get Firestore instance
 */
const getDb = () => admin.firestore();

/**
 * Call Gemini API with automatic credit tracking and deduction
 *
 * This function:
 * 1. Checks if user has sufficient credits
 * 2. Makes the Gemini API call
 * 3. Calculates the cost based on actual token usage
 * 4. Debits tokens atomically from user's balance
 * 5. Logs the usage for analytics
 *
 * @param params - Gemini call parameters
 * @returns Result with generated text and usage info
 * @throws Error with "INSUFFICIENT_CREDITS" if user doesn't have enough tokens
 */
export async function callGeminiWithCredits(
  params: GeminiCallParams
): Promise<GeminiCallResult> {
  const {
    userId,
    modelKey,
    prompt,
    feature,
    systemInstruction,
    maxOutputTokens = 8192,
  } = params;

  // 1. Pre-flight balance check
  const currentBalance = await checkBalance(userId);

  if (currentBalance < MINIMUM_BALANCE_FOR_CALL) {
    functions.logger.warn(
      `User ${userId} has insufficient balance: ${currentBalance} < ${MINIMUM_BALANCE_FOR_CALL}`
    );
    throw new Error("INSUFFICIENT_CREDITS");
  }

  // 2. Initialize Gemini model
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: modelKey,
    systemInstruction: systemInstruction,
    generationConfig: {
      maxOutputTokens,
    },
  });

  // 3. Make the API call
  functions.logger.info(
    `Calling Gemini ${modelKey} for user ${userId}, feature: ${feature}`
  );

  const startTime = Date.now();
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const elapsedMs = Date.now() - startTime;

  // 4. Get token usage from response metadata
  const usageMetadata = response.usageMetadata;
  const inputTokens = usageMetadata?.promptTokenCount || 0;
  const outputTokens = usageMetadata?.candidatesTokenCount || 0;
  const contextTokens = inputTokens + outputTokens;

  functions.logger.info(
    `Gemini response received in ${elapsedMs}ms. Tokens: ${inputTokens} in / ${outputTokens} out`
  );

  // 5. Calculate cost and tokens to debit
  const costUSD = computeGeminiCostUSD(modelKey, inputTokens, outputTokens);
  const tokensToDebit = convertCostToUserTokens(
    modelKey,
    costUSD,
    undefined,
    contextTokens
  );

  functions.logger.info(
    `Cost: $${costUSD.toFixed(6)}, Tokens to debit: ${tokensToDebit}`
  );

  // 6. Debit tokens atomically
  let newBalance: number;
  try {
    newBalance = await debitTokens({
      userId,
      tokens: tokensToDebit,
      description: `${feature}: ${inputTokens} in / ${outputTokens} out`,
      feature,
    });
  } catch (error: any) {
    // If debit fails due to insufficient credits, still log but don't charge
    if (error.message === "INSUFFICIENT_CREDITS") {
      functions.logger.error(
        `User ${userId} ran out of credits during call (race condition)`
      );
      throw error;
    }
    throw error;
  }

  // 7. Log usage for analytics
  const db = getDb();
  const logRef = db
    .collection("users")
    .doc(userId)
    .collection("geminiUsageLogs")
    .doc();

  await logRef.set({
    id: logRef.id,
    userId,
    modelKey,
    inputTokens,
    outputTokens,
    contextTokens,
    costUSD,
    debitedTokens: tokensToDebit,
    feature,
    requestId: logRef.id, // Use doc ID as request ID
    createdAt: Timestamp.now(),
  });

  functions.logger.info(
    `User ${userId} debited ${tokensToDebit} tokens. New balance: ${newBalance}`
  );

  return {
    text,
    inputTokens,
    outputTokens,
    tokensDebited: tokensToDebit,
    newBalance,
  };
}

/**
 * Estimate the cost of a Gemini call without actually making it
 * Useful for showing users estimated costs before confirming
 *
 * @param modelKey - The Gemini model to use
 * @param estimatedInputTokens - Estimated input tokens
 * @param estimatedOutputTokens - Estimated output tokens
 * @returns Estimated cost in tokens
 */
export function estimateCallCost(
  modelKey: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  const costUSD = computeGeminiCostUSD(
    modelKey,
    estimatedInputTokens,
    estimatedOutputTokens
  );
  return convertCostToUserTokens(modelKey, costUSD);
}

/**
 * Parse JSON safely from Gemini response
 * Handles common issues like markdown code blocks
 *
 * @param text - Raw text from Gemini
 * @returns Parsed JSON or null if parsing fails
 */
export function safeParseJSON<T = any>(text: string): T | null {
  try {
    // First, try direct parse
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue to other strategies
      }
    }

    // Try to find JSON object/array in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Continue
      }
    }

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // Give up
      }
    }

    functions.logger.warn("Failed to parse JSON from Gemini response");
    return null;
  }
}

/**
 * Generate structured JSON output from Gemini
 * Wraps the prompt with JSON instructions and parses the response
 *
 * @param params - Gemini call parameters (prompt should describe the JSON structure needed)
 * @returns Parsed JSON result with usage info
 */
export async function generateStructuredJSON<T = any>(
  params: GeminiCallParams
): Promise<{ data: T | null; tokensDebited: number; newBalance: number }> {
  // Wrap prompt with JSON instructions
  const jsonPrompt = `${params.prompt}

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanation, markdown formatting, or code blocks. Just the raw JSON object/array.`;

  const result = await callGeminiWithCredits({
    ...params,
    prompt: jsonPrompt,
  });

  const data = safeParseJSON<T>(result.text);

  return {
    data,
    tokensDebited: result.tokensDebited,
    newBalance: result.newBalance,
  };
}
