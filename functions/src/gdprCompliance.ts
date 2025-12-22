/**
 * GDPR Compliance Cloud Functions
 *
 * Provides user data rights as required by GDPR:
 * - exportUserData: Export all user data in JSON format (Right to Access/Portability)
 * - deleteUserAccount: Delete all user data (Right to Erasure)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Collections that contain user data
const USER_DATA_COLLECTIONS = [
  "users",
  "transactions",
  "websites",
  "supportTickets",
  "customers", // CRM customers owned by user
];

interface ExportDataResponse {
  success: boolean;
  data: {
    user: Record<string, unknown> | null;
    transactions: Record<string, unknown>[];
    websites: Record<string, unknown>[];
    supportTickets: Record<string, unknown>[];
    customers: Record<string, unknown>[];
  };
  exportedAt: string;
  message: string;
}

interface DeleteAccountResponse {
  success: boolean;
  deletedCollections: string[];
  message: string;
}

/**
 * Export all user data (GDPR Right to Access / Right to Portability)
 *
 * Returns a JSON object containing all data associated with the user.
 * This includes: profile, transactions, websites, support tickets, and CRM customers.
 *
 * @requires Authentication - User must be logged in
 */
export const exportUserData = functions.https.onCall(
  async (data, context): Promise<ExportDataResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to export your data."
      );
    }

    const userId = context.auth.uid;

    try {
      functions.logger.info(`Starting data export for user ${userId}`);

      // 1. Get user profile
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.exists
        ? sanitizeForExport(userDoc.data() as Record<string, unknown>)
        : null;

      // 2. Get transactions
      const transactionsSnapshot = await db
        .collection("transactions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
      const transactions = transactionsSnapshot.docs.map((doc) =>
        sanitizeForExport({ id: doc.id, ...doc.data() })
      );

      // 3. Get websites
      const websitesSnapshot = await db
        .collection("websites")
        .where("userId", "==", userId)
        .get();
      const websites = websitesSnapshot.docs.map((doc) =>
        sanitizeForExport({ id: doc.id, ...doc.data() })
      );

      // 4. Get support tickets
      const ticketsSnapshot = await db
        .collection("supportTickets")
        .where("userId", "==", userId)
        .get();
      const supportTickets = ticketsSnapshot.docs.map((doc) =>
        sanitizeForExport({ id: doc.id, ...doc.data() })
      );

      // 5. Get CRM customers (owned by this user)
      const customersSnapshot = await db
        .collection("customers")
        .where("ownerId", "==", userId)
        .get();
      const customers = customersSnapshot.docs.map((doc) =>
        sanitizeForExport({ id: doc.id, ...doc.data() })
      );

      functions.logger.info(
        `Data export complete for user ${userId}: ${transactions.length} transactions, ${websites.length} websites, ${supportTickets.length} tickets, ${customers.length} customers`
      );

      return {
        success: true,
        data: {
          user: userData,
          transactions,
          websites,
          supportTickets,
          customers,
        },
        exportedAt: new Date().toISOString(),
        message: "Your data has been exported successfully.",
      };
    } catch (error: any) {
      functions.logger.error(`Error exporting data for user ${userId}:`, error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to export your data. Please try again or contact support."
      );
    }
  }
);

/**
 * Delete user account and all associated data (GDPR Right to Erasure)
 *
 * This permanently deletes:
 * - User profile
 * - All transactions
 * - All published websites
 * - All support tickets
 * - All CRM customers
 * - Firebase Auth account
 *
 * @requires Authentication - User must be logged in
 */
export const deleteUserAccount = functions.https.onCall(
  async (data, context): Promise<DeleteAccountResponse> => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to delete your account."
      );
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email || "unknown";
    const confirmPhrase = data?.confirmPhrase;

    // Require confirmation phrase for safety
    if (confirmPhrase !== "DELETE MY ACCOUNT") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Please type 'DELETE MY ACCOUNT' to confirm account deletion."
      );
    }

    try {
      functions.logger.warn(
        `Starting account deletion for user ${userId} (${userEmail})`
      );

      const deletedCollections: string[] = [];
      const batch = db.batch();
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500;

      // Helper to commit batch if needed
      const commitBatchIfNeeded = async () => {
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
        }
      };

      // 1. Delete transactions
      const transactionsSnapshot = await db
        .collection("transactions")
        .where("userId", "==", userId)
        .get();
      for (const doc of transactionsSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        await commitBatchIfNeeded();
      }
      if (transactionsSnapshot.size > 0) deletedCollections.push("transactions");

      // 2. Delete websites
      const websitesSnapshot = await db
        .collection("websites")
        .where("userId", "==", userId)
        .get();
      for (const doc of websitesSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        await commitBatchIfNeeded();
      }
      if (websitesSnapshot.size > 0) deletedCollections.push("websites");

      // 3. Delete support tickets
      const ticketsSnapshot = await db
        .collection("supportTickets")
        .where("userId", "==", userId)
        .get();
      for (const doc of ticketsSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        await commitBatchIfNeeded();
      }
      if (ticketsSnapshot.size > 0) deletedCollections.push("supportTickets");

      // 4. Delete CRM customers
      const customersSnapshot = await db
        .collection("customers")
        .where("ownerId", "==", userId)
        .get();
      for (const doc of customersSnapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        await commitBatchIfNeeded();
      }
      if (customersSnapshot.size > 0) deletedCollections.push("customers");

      // 5. Delete user document
      const userRef = db.collection("users").doc(userId);
      batch.delete(userRef);
      deletedCollections.push("users");

      // Commit remaining batch operations
      if (batchCount > 0) {
        await batch.commit();
      }

      // 6. Delete Firebase Auth account
      try {
        await admin.auth().deleteUser(userId);
        functions.logger.info(`Firebase Auth account deleted for ${userId}`);
      } catch (authError: any) {
        // Log but don't fail - user data is already deleted
        functions.logger.error(
          `Failed to delete Auth account for ${userId}:`,
          authError
        );
      }

      functions.logger.warn(
        `Account deletion complete for user ${userId}: ${deletedCollections.join(", ")}`
      );

      return {
        success: true,
        deletedCollections,
        message:
          "Your account and all associated data have been permanently deleted.",
      };
    } catch (error: any) {
      functions.logger.error(`Error deleting account for user ${userId}:`, error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to delete your account. Please contact support for assistance."
      );
    }
  }
);

/**
 * Sanitize data for export by converting Firestore Timestamps to ISO strings
 * and removing internal fields
 */
function sanitizeForExport(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip internal fields
    if (key.startsWith("_") || key === "passwordHash") {
      continue;
    }

    // Convert Firestore Timestamps to ISO strings
    if (value && typeof value === "object" && "toDate" in value) {
      sanitized[key] = (value as admin.firestore.Timestamp).toDate().toISOString();
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeForExport(item as Record<string, unknown>)
          : item
      );
    } else if (value && typeof value === "object") {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForExport(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
