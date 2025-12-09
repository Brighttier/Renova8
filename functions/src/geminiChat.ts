import * as functions from "firebase-functions";
import { callGeminiWithCredits } from "./lib/gemini";
import { GeminiChatRequest, GeminiChatResponse } from "./types";

/**
 * Callable function: Chat with Gemini AI with automatic credit deduction
 *
 * Request body:
 * - prompt: string - The prompt to send to Gemini
 * - modelKey?: string - The model to use (default: "gemini-3-pro-preview")
 * - feature?: string - Feature name for tracking (default: "chat")
 * - systemInstruction?: string - Optional system instruction
 * - maxOutputTokens?: number - Maximum output tokens (default: 8192)
 *
 * Returns:
 * - text: string - The generated response
 * - tokensUsed: number - Tokens debited from balance
 * - tokenBalance: number - New token balance after deduction
 *
 * @requires Authentication - User must be logged in
 * @throws RESOURCE_EXHAUSTED if user has insufficient credits
 */
export const geminiChat = functions.https.onCall(
  async (data: GeminiChatRequest, context): Promise<GeminiChatResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to use AI features."
      );
    }

    const userId = context.auth.uid;

    // Validate request
    const {
      prompt,
      modelKey = "gemini-3-pro-preview",
      feature = "chat",
      systemInstruction,
      maxOutputTokens,
    } = data;

    if (!prompt || typeof prompt !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Prompt is required and must be a string."
      );
    }

    if (prompt.length > 100000) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Prompt is too long. Maximum length is 100,000 characters."
      );
    }

    // Validate model key
    const allowedModels = [
      "gemini-3-pro-preview",
      "gemini-2.5-flash",
      "gemini-2.5-flash-preview",
    ];

    if (!allowedModels.includes(modelKey)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid model: ${modelKey}. Allowed models: ${allowedModels.join(", ")}`
      );
    }

    try {
      functions.logger.info(
        `User ${userId} calling ${modelKey} for feature: ${feature}`
      );

      const result = await callGeminiWithCredits({
        userId,
        modelKey,
        prompt,
        feature,
        systemInstruction,
        maxOutputTokens,
      });

      return {
        text: result.text,
        tokensUsed: result.tokensDebited,
        tokenBalance: result.newBalance,
      };
    } catch (error: any) {
      functions.logger.error(
        `Gemini call failed for user ${userId}:`,
        error.message
      );

      // Handle specific error types
      if (error.message === "INSUFFICIENT_CREDITS") {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Insufficient credits. Please top up your balance to continue using AI features."
        );
      }

      // Handle Gemini API errors
      if (error.message?.includes("API key")) {
        throw new functions.https.HttpsError(
          "internal",
          "AI service configuration error. Please contact support."
        );
      }

      if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "AI service is temporarily unavailable. Please try again in a few moments."
        );
      }

      if (error.message?.includes("safety")) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Your request was blocked by safety filters. Please modify your prompt."
        );
      }

      // Generic error
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate response. Please try again."
      );
    }
  }
);
