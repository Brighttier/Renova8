/**
 * Platform Settings Library
 *
 * Manages platform-wide API configuration stored in Firestore.
 * Handles API keys, rate limits, and token settings.
 */

import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Types
export type ApiKeyRotationStrategy = "round-robin" | "failover" | "usage-based";

export interface ApiKeyConfig {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  usageCount: number;
  totalUsage: number;
  lastUsed: number;
  dailyLimit?: number;
  addedAt: number;
  addedBy: string;
}

export interface RateLimitConfig {
  enabled: boolean;
  globalRequestsPerMinute: number;
  perUserRequestsPerMinute: number;
  perUserRequestsPerDay: number;
}

export interface TokenLimitConfig {
  initialSignupTokens: number;
  maxTokensPerUser: number;
  minBalanceForCall: number;
  profitMargin: number;
}

export interface PlatformAPISettings {
  geminiApiKeys: ApiKeyConfig[];
  currentKeyIndex: number;
  rotationStrategy: ApiKeyRotationStrategy;
  rateLimits: RateLimitConfig;
  tokenLimits: TokenLimitConfig;
  updatedAt: number;
  updatedBy: string;
}

// Default settings
const DEFAULT_SETTINGS: PlatformAPISettings = {
  geminiApiKeys: [],
  currentKeyIndex: 0,
  rotationStrategy: "round-robin",
  rateLimits: {
    enabled: false,
    globalRequestsPerMinute: 60,
    perUserRequestsPerMinute: 10,
    perUserRequestsPerDay: 1000,
  },
  tokenLimits: {
    initialSignupTokens: 2000,
    maxTokensPerUser: 0,
    minBalanceForCall: 10,
    profitMargin: 0.45,
  },
  updatedAt: Date.now(),
  updatedBy: "system",
};

// Firestore collection/document paths
const SETTINGS_COLLECTION = "platform_config";
const API_SETTINGS_DOC = "api_settings";

// Get Firestore instance
const getDb = () => admin.firestore();

/**
 * Get current platform API settings
 */
export async function getPlatformAPISettings(): Promise<PlatformAPISettings> {
  const db = getDb();
  const doc = await db
    .collection(SETTINGS_COLLECTION)
    .doc(API_SETTINGS_DOC)
    .get();

  if (!doc.exists) {
    // Initialize with defaults if not exists
    await initializePlatformSettings();
    return { ...DEFAULT_SETTINGS, updatedAt: Date.now() };
  }

  return doc.data() as PlatformAPISettings;
}

/**
 * Initialize platform settings with defaults
 */
export async function initializePlatformSettings(): Promise<void> {
  const db = getDb();
  const docRef = db.collection(SETTINGS_COLLECTION).doc(API_SETTINGS_DOC);

  const doc = await docRef.get();
  if (!doc.exists) {
    await docRef.set({
      ...DEFAULT_SETTINGS,
      updatedAt: Date.now(),
      updatedBy: "system",
    });
  }
}

/**
 * Update platform API settings
 */
export async function updatePlatformAPISettings(
  updates: Partial<PlatformAPISettings>,
  updatedBy: string
): Promise<PlatformAPISettings> {
  const db = getDb();
  const docRef = db.collection(SETTINGS_COLLECTION).doc(API_SETTINGS_DOC);

  // Get current settings
  const current = await getPlatformAPISettings();

  // Merge updates
  const newSettings: PlatformAPISettings = {
    ...current,
    ...updates,
    updatedAt: Date.now(),
    updatedBy,
  };

  await docRef.set(newSettings);

  // Log audit trail
  await logSettingsChange(current, newSettings, updatedBy);

  return newSettings;
}

/**
 * Add a new API key
 */
export async function addApiKey(
  key: string,
  name: string,
  addedBy: string
): Promise<ApiKeyConfig> {
  const settings = await getPlatformAPISettings();

  const newKey: ApiKeyConfig = {
    id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    key,
    name,
    isActive: true,
    usageCount: 0,
    totalUsage: 0,
    lastUsed: 0,
    addedAt: Date.now(),
    addedBy,
  };

  const updatedKeys = [...settings.geminiApiKeys, newKey];

  await updatePlatformAPISettings(
    { geminiApiKeys: updatedKeys },
    addedBy
  );

  return newKey;
}

/**
 * Remove an API key
 */
export async function removeApiKey(
  keyId: string,
  removedBy: string
): Promise<void> {
  const settings = await getPlatformAPISettings();

  const updatedKeys = settings.geminiApiKeys.filter((k) => k.id !== keyId);

  // Adjust current index if needed
  let newIndex = settings.currentKeyIndex;
  if (newIndex >= updatedKeys.length) {
    newIndex = Math.max(0, updatedKeys.length - 1);
  }

  await updatePlatformAPISettings(
    {
      geminiApiKeys: updatedKeys,
      currentKeyIndex: newIndex,
    },
    removedBy
  );
}

/**
 * Update an API key (toggle active, update name, etc.)
 */
export async function updateApiKey(
  keyId: string,
  updates: Partial<Pick<ApiKeyConfig, "name" | "isActive" | "dailyLimit">>,
  updatedBy: string
): Promise<void> {
  const settings = await getPlatformAPISettings();

  const updatedKeys = settings.geminiApiKeys.map((k) =>
    k.id === keyId ? { ...k, ...updates } : k
  );

  await updatePlatformAPISettings(
    { geminiApiKeys: updatedKeys },
    updatedBy
  );
}

/**
 * Record API key usage
 */
export async function recordApiKeyUsage(keyIndex: number): Promise<void> {
  const db = getDb();
  const docRef = db.collection(SETTINGS_COLLECTION).doc(API_SETTINGS_DOC);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);
    if (!doc.exists) return;

    const settings = doc.data() as PlatformAPISettings;
    if (keyIndex < 0 || keyIndex >= settings.geminiApiKeys.length) return;

    settings.geminiApiKeys[keyIndex].usageCount += 1;
    settings.geminiApiKeys[keyIndex].totalUsage += 1;
    settings.geminiApiKeys[keyIndex].lastUsed = Date.now();

    transaction.update(docRef, {
      geminiApiKeys: settings.geminiApiKeys,
    });
  });
}

/**
 * Reset daily usage counts (call this at midnight via scheduler)
 */
export async function resetDailyUsageCounts(): Promise<void> {
  const settings = await getPlatformAPISettings();

  const resetKeys = settings.geminiApiKeys.map((k) => ({
    ...k,
    usageCount: 0,
  }));

  const db = getDb();
  await db.collection(SETTINGS_COLLECTION).doc(API_SETTINGS_DOC).update({
    geminiApiKeys: resetKeys,
  });
}

/**
 * Update rate limit settings
 */
export async function updateRateLimits(
  rateLimits: Partial<RateLimitConfig>,
  updatedBy: string
): Promise<void> {
  const settings = await getPlatformAPISettings();

  await updatePlatformAPISettings(
    {
      rateLimits: { ...settings.rateLimits, ...rateLimits },
    },
    updatedBy
  );
}

/**
 * Update token limit settings
 */
export async function updateTokenLimits(
  tokenLimits: Partial<TokenLimitConfig>,
  updatedBy: string
): Promise<void> {
  const settings = await getPlatformAPISettings();

  await updatePlatformAPISettings(
    {
      tokenLimits: { ...settings.tokenLimits, ...tokenLimits },
    },
    updatedBy
  );
}

/**
 * Update rotation strategy
 */
export async function updateRotationStrategy(
  strategy: ApiKeyRotationStrategy,
  updatedBy: string
): Promise<void> {
  await updatePlatformAPISettings({ rotationStrategy: strategy }, updatedBy);
}

/**
 * Log settings changes for audit trail
 */
async function logSettingsChange(
  before: PlatformAPISettings,
  after: PlatformAPISettings,
  changedBy: string
): Promise<void> {
  const db = getDb();

  // Create audit log entry
  await db.collection("platform_audit_logs").add({
    type: "api_settings_change",
    changedBy,
    timestamp: Timestamp.now(),
    changes: {
      before: sanitizeSettingsForLog(before),
      after: sanitizeSettingsForLog(after),
    },
  });
}

/**
 * Sanitize settings for logging (mask API keys)
 */
function sanitizeSettingsForLog(settings: PlatformAPISettings): any {
  return {
    ...settings,
    geminiApiKeys: settings.geminiApiKeys.map((k) => ({
      ...k,
      key: maskApiKey(k.key),
    })),
  };
}

/**
 * Mask API key for display (show last 4 chars)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "****";
  return `${"*".repeat(key.length - 4)}${key.slice(-4)}`;
}

/**
 * Get settings with masked API keys (safe for frontend)
 */
export async function getPlatformAPISettingsMasked(): Promise<PlatformAPISettings> {
  const settings = await getPlatformAPISettings();

  return {
    ...settings,
    geminiApiKeys: settings.geminiApiKeys.map((k) => ({
      ...k,
      key: maskApiKey(k.key),
    })),
  };
}
