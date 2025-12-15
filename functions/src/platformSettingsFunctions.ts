/**
 * Platform Settings Cloud Functions
 *
 * Callable functions for managing platform API settings.
 * Requires admin authentication and appropriate permissions.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  getPlatformAPISettingsMasked,
  addApiKey,
  removeApiKey,
  updateApiKey,
  updateRateLimits,
  updateTokenLimits,
  updateRotationStrategy,
  ApiKeyRotationStrategy,
  RateLimitConfig,
  TokenLimitConfig,
} from "./lib/platformSettings";
import { isValidApiKeyFormat, getApiKeyStats } from "./lib/apiKeyManager";

// Get Firestore instance
const getDb = () => admin.firestore();

/**
 * Verify the caller is an authenticated admin with settings.edit permission
 */
async function verifyAdminPermission(
  context: functions.https.CallableContext
): Promise<{ adminId: string; email: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to access platform settings"
    );
  }

  const adminId = context.auth.uid;

  // Check if user is a platform admin
  const adminDoc = await getDb()
    .collection("platform_admins")
    .doc(adminId)
    .get();

  if (!adminDoc.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only platform administrators can access these settings"
    );
  }

  const adminData = adminDoc.data();

  // Check if admin is active
  if (!adminData?.isActive) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Your admin account is inactive"
    );
  }

  // Check for settings.edit permission or super_admin role
  const hasPermission =
    adminData.isSuperAdmin ||
    adminData.permissions?.includes("settings.edit") ||
    adminData.permissions?.includes("settings.view");

  if (!hasPermission) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to access platform settings"
    );
  }

  return { adminId, email: adminData.email };
}

/**
 * Check if admin can edit (not just view)
 */
async function verifyEditPermission(
  context: functions.https.CallableContext
): Promise<{ adminId: string; email: string }> {
  const admin = await verifyAdminPermission(context);

  const adminDoc = await getDb()
    .collection("platform_admins")
    .doc(admin.adminId)
    .get();
  const adminData = adminDoc.data();

  const canEdit =
    adminData?.isSuperAdmin ||
    adminData?.permissions?.includes("settings.edit");

  if (!canEdit) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to edit platform settings"
    );
  }

  return admin;
}

// ============================================
// Cloud Functions
// ============================================

/**
 * Get Platform API Settings
 *
 * Returns current platform settings with API keys masked.
 */
export const getPlatformSettings = functions.https.onCall(
  async (_data, context) => {
    await verifyAdminPermission(context);

    try {
      const settings = await getPlatformAPISettingsMasked();
      const stats = await getApiKeyStats();

      return {
        success: true,
        settings,
        stats,
      };
    } catch (error) {
      functions.logger.error("Failed to get platform settings", { error });
      throw new functions.https.HttpsError(
        "internal",
        "Failed to load platform settings"
      );
    }
  }
);

/**
 * Add API Key
 *
 * Adds a new Gemini API key to the rotation pool.
 */
export const addPlatformApiKey = functions.https.onCall(
  async (data: { key: string; name: string }, context) => {
    const admin = await verifyEditPermission(context);

    const { key, name } = data;

    // Validate inputs
    if (!key || !name) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "API key and name are required"
      );
    }

    if (!isValidApiKeyFormat(key)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid API key format"
      );
    }

    if (name.length < 1 || name.length > 50) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name must be between 1 and 50 characters"
      );
    }

    try {
      const newKey = await addApiKey(key, name, admin.adminId);

      functions.logger.info("API key added", {
        keyId: newKey.id,
        keyName: name,
        addedBy: admin.email,
      });

      return {
        success: true,
        keyId: newKey.id,
        message: `API key "${name}" added successfully`,
      };
    } catch (error) {
      functions.logger.error("Failed to add API key", { error });
      throw new functions.https.HttpsError(
        "internal",
        "Failed to add API key"
      );
    }
  }
);

/**
 * Remove API Key
 */
export const removePlatformApiKey = functions.https.onCall(
  async (data: { keyId: string }, context) => {
    const admin = await verifyEditPermission(context);

    const { keyId } = data;

    if (!keyId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Key ID is required"
      );
    }

    try {
      await removeApiKey(keyId, admin.adminId);

      functions.logger.info("API key removed", {
        keyId,
        removedBy: admin.email,
      });

      return {
        success: true,
        message: "API key removed successfully",
      };
    } catch (error) {
      functions.logger.error("Failed to remove API key", { error });
      throw new functions.https.HttpsError(
        "internal",
        "Failed to remove API key"
      );
    }
  }
);

/**
 * Update API Key
 */
export const updatePlatformApiKey = functions.https.onCall(
  async (
    data: {
      keyId: string;
      updates: { name?: string; isActive?: boolean; dailyLimit?: number };
    },
    context
  ) => {
    const admin = await verifyEditPermission(context);

    const { keyId, updates } = data;

    if (!keyId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Key ID is required"
      );
    }

    // Validate updates
    if (updates.name && (updates.name.length < 1 || updates.name.length > 50)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name must be between 1 and 50 characters"
      );
    }

    if (updates.dailyLimit !== undefined && updates.dailyLimit < 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Daily limit must be a positive number"
      );
    }

    try {
      await updateApiKey(keyId, updates, admin.adminId);

      functions.logger.info("API key updated", {
        keyId,
        updates,
        updatedBy: admin.email,
      });

      return {
        success: true,
        message: "API key updated successfully",
      };
    } catch (error) {
      functions.logger.error("Failed to update API key", { error });
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update API key"
      );
    }
  }
);

/**
 * Update Rotation Strategy
 */
export const updateApiKeyRotationStrategy = functions.https.onCall(
  async (data: { strategy: ApiKeyRotationStrategy }, context) => {
    const admin = await verifyEditPermission(context);

    const { strategy } = data;

    const validStrategies: ApiKeyRotationStrategy[] = [
      "round-robin",
      "failover",
      "usage-based",
    ];

    if (!validStrategies.includes(strategy)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid rotation strategy"
      );
    }

    try {
      await updateRotationStrategy(strategy, admin.adminId);

      functions.logger.info("Rotation strategy updated", {
        strategy,
        updatedBy: admin.email,
      });

      return {
        success: true,
        message: `Rotation strategy updated to "${strategy}"`,
      };
    } catch (error) {
      functions.logger.error("Failed to update rotation strategy", { error });
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update rotation strategy"
      );
    }
  }
);

/**
 * Update Rate Limits
 */
export const updatePlatformRateLimits = functions.https.onCall(
  async (data: { rateLimits: Partial<RateLimitConfig> }, context) => {
    const admin = await verifyEditPermission(context);

    const { rateLimits } = data;

    // Validate rate limits
    if (
      rateLimits.globalRequestsPerMinute !== undefined &&
      rateLimits.globalRequestsPerMinute < 1
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Global requests per minute must be at least 1"
      );
    }

    if (
      rateLimits.perUserRequestsPerMinute !== undefined &&
      rateLimits.perUserRequestsPerMinute < 1
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Per-user requests per minute must be at least 1"
      );
    }

    if (
      rateLimits.perUserRequestsPerDay !== undefined &&
      rateLimits.perUserRequestsPerDay < 1
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Per-user requests per day must be at least 1"
      );
    }

    try {
      await updateRateLimits(rateLimits, admin.adminId);

      functions.logger.info("Rate limits updated", {
        rateLimits,
        updatedBy: admin.email,
      });

      return {
        success: true,
        message: "Rate limits updated successfully",
      };
    } catch (error) {
      functions.logger.error("Failed to update rate limits", { error });
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update rate limits"
      );
    }
  }
);

/**
 * Update Token Limits
 */
export const updatePlatformTokenLimits = functions.https.onCall(
  async (data: { tokenLimits: Partial<TokenLimitConfig> }, context) => {
    const admin = await verifyEditPermission(context);

    const { tokenLimits } = data;

    // Validate token limits
    if (
      tokenLimits.initialSignupTokens !== undefined &&
      tokenLimits.initialSignupTokens < 0
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Initial signup tokens must be a positive number"
      );
    }

    if (
      tokenLimits.maxTokensPerUser !== undefined &&
      tokenLimits.maxTokensPerUser < 0
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Max tokens per user must be a positive number (or 0 for unlimited)"
      );
    }

    if (
      tokenLimits.minBalanceForCall !== undefined &&
      tokenLimits.minBalanceForCall < 0
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Minimum balance for call must be a positive number"
      );
    }

    if (
      tokenLimits.profitMargin !== undefined &&
      (tokenLimits.profitMargin < 0 || tokenLimits.profitMargin > 1)
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Profit margin must be between 0 and 1"
      );
    }

    try {
      await updateTokenLimits(tokenLimits, admin.adminId);

      functions.logger.info("Token limits updated", {
        tokenLimits,
        updatedBy: admin.email,
      });

      return {
        success: true,
        message: "Token limits updated successfully",
      };
    } catch (error) {
      functions.logger.error("Failed to update token limits", { error });
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update token limits"
      );
    }
  }
);
