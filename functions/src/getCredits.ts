import * as functions from "firebase-functions";
import { checkBalance, getTransactions } from "./lib/credits";
import { GetCreditsResponse } from "./types";
import { MAX_TRANSACTIONS_RETURNED } from "./config";

/**
 * Callable function: Get user's credit balance and recent transactions
 *
 * Returns:
 * - tokenBalance: Current token balance
 * - transactions: Recent credit transactions (newest first)
 *
 * @requires Authentication - User must be logged in
 */
export const getCredits = functions.https.onCall(
  async (data, context): Promise<GetCreditsResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to view your credits."
      );
    }

    const userId = context.auth.uid;

    try {
      // Get current balance
      const tokenBalance = await checkBalance(userId);

      // Get recent transactions
      const limit = data?.limit || MAX_TRANSACTIONS_RETURNED;
      const transactions = await getTransactions(userId, limit);

      // Convert Timestamps to ISO strings for JSON serialization
      const serializedTransactions = transactions.map((txn) => ({
        ...txn,
        createdAt: txn.createdAt?.toDate?.()?.toISOString() || null,
      }));

      functions.logger.info(
        `User ${userId} fetched credits: ${tokenBalance} tokens, ${serializedTransactions.length} transactions`
      );

      return {
        tokenBalance,
        transactions: serializedTransactions as any,
      };
    } catch (error: any) {
      functions.logger.error(
        `Error fetching credits for user ${userId}:`,
        error
      );

      throw new functions.https.HttpsError(
        "internal",
        "Failed to fetch credit information. Please try again."
      );
    }
  }
);
