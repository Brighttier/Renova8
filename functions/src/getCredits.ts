import * as functions from "firebase-functions";
import { getTransactions, getUser } from "./lib/credits";
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
      // Get user data including trial status
      const userData = await getUser(userId);
      const tokenBalance = userData?.tokenBalance || 0;
      const isTrialUser = userData?.isTrialUser || false;
      const trialEndsAt = userData?.trialEndsAt;

      // Calculate days remaining in trial
      let trialDaysRemaining: number | undefined;
      let trialEndsAtISO: string | undefined;

      if (isTrialUser && trialEndsAt) {
        const trialEndDate = trialEndsAt.toDate();
        trialEndsAtISO = trialEndDate.toISOString();
        const now = new Date();
        const msRemaining = trialEndDate.getTime() - now.getTime();
        trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      }

      // Get recent transactions
      const limit = data?.limit || MAX_TRANSACTIONS_RETURNED;
      const transactions = await getTransactions(userId, limit);

      // Convert Timestamps to ISO strings for JSON serialization
      const serializedTransactions = transactions.map((txn) => ({
        ...txn,
        createdAt: txn.createdAt?.toDate?.()?.toISOString() || null,
      }));

      functions.logger.info(
        `User ${userId} fetched credits: ${tokenBalance} tokens, trial: ${isTrialUser}, ${serializedTransactions.length} transactions`
      );

      return {
        tokenBalance,
        isTrialUser,
        trialEndsAt: trialEndsAtISO,
        trialDaysRemaining,
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
