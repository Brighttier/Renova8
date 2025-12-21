import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { GrantTokensParams, DebitTokensParams, CreditTransaction } from "../types";
import { TRIAL_DURATION_DAYS } from "../config";

/**
 * Get Firestore instance
 * Lazy initialization to ensure admin is initialized first
 */
const getDb = () => admin.firestore();

/**
 * Grant tokens to a user (atomic Firestore transaction)
 *
 * Used for:
 * - Initial signup bonus (INITIAL_GRANT)
 * - Stripe purchase top-ups (PURCHASE_TOP_UP)
 * - Manual adjustments by admin (MANUAL_ADJUSTMENT)
 *
 * @param params - Grant parameters including userId, tokens, type, and optional metadata
 * @returns The new token balance after the grant
 * @throws Error if user is not found
 */
export async function grantTokens(params: GrantTokensParams): Promise<number> {
  const db = getDb();
  const userRef = db.collection("users").doc(params.userId);
  const txnRef = userRef.collection("creditTransactions").doc();

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error(`User not found: ${params.userId}`);
    }

    const currentBalance = userDoc.data()?.tokenBalance || 0;
    const newBalance = currentBalance + params.tokens;

    // Update user balance
    transaction.update(userRef, {
      tokenBalance: newBalance,
      updatedAt: Timestamp.now(),
    });

    // Create transaction record
    const txnData: Omit<CreditTransaction, "id"> & { id: string } = {
      id: txnRef.id,
      userId: params.userId,
      type: params.type,
      tokens: params.tokens, // Positive for grants
      description: params.description,
      stripePaymentIntentId: params.stripePaymentIntentId,
      stripeEventId: params.stripeEventId,
      balanceAfter: newBalance,
      createdAt: Timestamp.now(),
    };

    transaction.set(txnRef, txnData);

    return newBalance;
  });
}

/**
 * Debit tokens from a user (atomic Firestore transaction)
 *
 * Used for AI usage debits. The transaction will fail if the user
 * doesn't have enough tokens.
 *
 * @param params - Debit parameters including userId, tokens, description, and feature
 * @returns The new token balance after the debit
 * @throws Error with message "INSUFFICIENT_CREDITS" if balance is too low
 * @throws Error if user is not found
 */
export async function debitTokens(params: DebitTokensParams): Promise<number> {
  const db = getDb();
  const userRef = db.collection("users").doc(params.userId);
  const txnRef = userRef.collection("creditTransactions").doc();

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error(`User not found: ${params.userId}`);
    }

    const userData = userDoc.data();
    const currentBalance = userData?.tokenBalance || 0;
    const isTrialUser = userData?.isTrialUser || false;
    const trialEndsAt = userData?.trialEndsAt;

    // Check if trial has expired for trial users
    if (isTrialUser && trialEndsAt) {
      const trialEndDate = trialEndsAt.toDate();
      const now = new Date();

      if (now > trialEndDate) {
        // Trial expired - zero out tokens and mark as non-trial
        transaction.update(userRef, {
          tokenBalance: 0,
          isTrialUser: false,
          updatedAt: Timestamp.now(),
        });
        throw new Error("TRIAL_EXPIRED");
      }
    }

    if (currentBalance < params.tokens) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    const newBalance = currentBalance - params.tokens;

    // Update user balance
    transaction.update(userRef, {
      tokenBalance: newBalance,
      updatedAt: Timestamp.now(),
    });

    // Create transaction record
    const txnData: Omit<CreditTransaction, "id"> & { id: string } = {
      id: txnRef.id,
      userId: params.userId,
      type: "USAGE_DEBIT",
      tokens: -params.tokens, // Negative for debits
      description: params.description,
      balanceAfter: newBalance,
      createdAt: Timestamp.now(),
    };

    transaction.set(txnRef, txnData);

    return newBalance;
  });
}

/**
 * Check a user's current token balance
 *
 * @param userId - The user's Firebase UID
 * @returns The current token balance (0 if user not found)
 */
export async function checkBalance(userId: string): Promise<number> {
  const db = getDb();
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return 0;
  }

  return userDoc.data()?.tokenBalance || 0;
}

/**
 * Get recent credit transactions for a user
 *
 * @param userId - The user's Firebase UID
 * @param limit - Maximum number of transactions to return (default: 20)
 * @returns Array of credit transactions, newest first
 */
export async function getTransactions(
  userId: string,
  limit: number = 20
): Promise<CreditTransaction[]> {
  const db = getDb();

  const snapshot = await db
    .collection("users")
    .doc(userId)
    .collection("creditTransactions")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
    } as CreditTransaction;
  });
}

/**
 * Check if a user has sufficient balance for an operation
 *
 * @param userId - The user's Firebase UID
 * @param requiredTokens - Minimum tokens required
 * @returns True if user has sufficient balance
 */
export async function hasSufficientBalance(
  userId: string,
  requiredTokens: number
): Promise<boolean> {
  const balance = await checkBalance(userId);
  return balance >= requiredTokens;
}

/**
 * Initialize a new user with their starting balance
 * This is typically called by the onUserCreate auth trigger
 *
 * @param userId - The user's Firebase UID
 * @param email - The user's email
 * @param displayName - The user's display name
 * @param initialTokens - Starting token balance
 * @returns The initial token balance
 */
export async function initializeUser(
  userId: string,
  email: string,
  displayName: string | undefined,
  initialTokens: number
): Promise<number> {
  const db = getDb();
  const userRef = db.collection("users").doc(userId);
  const txnRef = userRef.collection("creditTransactions").doc();
  const now = Timestamp.now();

  // Calculate trial end date (14 days from now)
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);
  const trialEndsAt = Timestamp.fromDate(trialEndDate);

  // Use batch for atomic writes
  const batch = db.batch();

  // Create user document with trial fields and default plan
  batch.set(userRef, {
    id: userId,
    email: email,
    displayName: displayName || "",
    tokenBalance: initialTokens,
    isTrialUser: true,
    trialEndsAt: trialEndsAt,
    // Default plan settings
    currentPlan: "free",
    hostingSlots: 0,
    hostingSlotsUsed: 0,
    hostingType: "static",
    maintenanceEnabled: false,
    maintenanceSites: [],
    createdAt: now,
    updatedAt: now,
  });

  // Create initial grant transaction
  batch.set(txnRef, {
    id: txnRef.id,
    userId: userId,
    type: "INITIAL_GRANT",
    tokens: initialTokens,
    description: `Free trial! ${initialTokens} tokens for ${TRIAL_DURATION_DAYS} days.`,
    balanceAfter: initialTokens,
    createdAt: now,
  });

  await batch.commit();

  return initialTokens;
}

/**
 * Get user document
 *
 * @param userId - The user's Firebase UID
 * @returns User data or null if not found
 */
export async function getUser(userId: string) {
  const db = getDb();
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data();
}

/**
 * Update user's Stripe customer ID
 *
 * @param userId - The user's Firebase UID
 * @param stripeCustomerId - The Stripe customer ID
 */
export async function updateStripeCustomerId(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const db = getDb();
  await db.collection("users").doc(userId).update({
    stripeCustomerId,
    updatedAt: Timestamp.now(),
  });
}
