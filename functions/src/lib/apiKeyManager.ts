/**
 * API Key Manager
 *
 * Handles API key rotation and selection based on configured strategy.
 * Supports round-robin, failover, and usage-based rotation.
 */

import * as functions from "firebase-functions";
import {
  getPlatformAPISettings,
  recordApiKeyUsage,
  updatePlatformAPISettings,
  ApiKeyConfig,
} from "./platformSettings";

export interface KeySelectionResult {
  key: string;
  keyIndex: number;
  keyId: string;
  keyName: string;
}

export interface KeyFailureResult {
  success: boolean;
  newKey?: string;
  newKeyIndex?: number;
  error?: string;
}

/**
 * Get the next API key based on rotation strategy
 */
export async function getNextApiKey(): Promise<KeySelectionResult | null> {
  const settings = await getPlatformAPISettings();
  const activeKeys = settings.geminiApiKeys.filter((k) => k.isActive);

  if (activeKeys.length === 0) {
    functions.logger.warn("No active API keys configured");
    return null;
  }

  let selectedKey: ApiKeyConfig;
  let selectedIndex: number;

  switch (settings.rotationStrategy) {
    case "round-robin":
      selectedIndex = settings.currentKeyIndex % activeKeys.length;
      selectedKey = activeKeys[selectedIndex];

      // Update index for next call
      await updateCurrentKeyIndex(
        (settings.currentKeyIndex + 1) % settings.geminiApiKeys.length
      );
      break;

    case "failover":
      // Always use the first active key
      selectedIndex = 0;
      selectedKey = activeKeys[0];
      break;

    case "usage-based":
      // Select key with lowest daily usage
      const sortedByUsage = [...activeKeys].sort(
        (a, b) => a.usageCount - b.usageCount
      );
      selectedKey = sortedByUsage[0];
      selectedIndex = activeKeys.indexOf(selectedKey);
      break;

    default:
      selectedIndex = 0;
      selectedKey = activeKeys[0];
  }

  // Check if key has hit its daily limit
  if (selectedKey.dailyLimit && selectedKey.usageCount >= selectedKey.dailyLimit) {
    functions.logger.warn(
      `API key ${selectedKey.name} has reached daily limit`,
      {
        keyId: selectedKey.id,
        limit: selectedKey.dailyLimit,
        usage: selectedKey.usageCount,
      }
    );

    // Try to find another key that hasn't hit its limit
    const availableKeys = activeKeys.filter(
      (k) => !k.dailyLimit || k.usageCount < k.dailyLimit
    );

    if (availableKeys.length === 0) {
      functions.logger.error("All API keys have reached their daily limits");
      return null;
    }

    selectedKey = availableKeys[0];
    selectedIndex = activeKeys.indexOf(selectedKey);
  }

  // Find the actual index in the full array (not just active keys)
  const actualIndex = settings.geminiApiKeys.findIndex(
    (k) => k.id === selectedKey.id
  );

  return {
    key: selectedKey.key,
    keyIndex: actualIndex,
    keyId: selectedKey.id,
    keyName: selectedKey.name,
  };
}

/**
 * Record successful API key usage
 */
export async function recordKeySuccess(keyIndex: number): Promise<void> {
  await recordApiKeyUsage(keyIndex);
}

/**
 * Handle API key failure - rotate to next available key
 */
export async function handleKeyFailure(
  failedKeyIndex: number
): Promise<KeyFailureResult> {
  const settings = await getPlatformAPISettings();

  functions.logger.warn("API key failure detected", {
    failedKeyIndex,
    keyId: settings.geminiApiKeys[failedKeyIndex]?.id,
    keyName: settings.geminiApiKeys[failedKeyIndex]?.name,
  });

  // Find next active key
  const activeKeys = settings.geminiApiKeys.filter(
    (k, idx) => k.isActive && idx !== failedKeyIndex
  );

  if (activeKeys.length === 0) {
    functions.logger.error("No alternative API keys available after failure");
    return {
      success: false,
      error: "No alternative API keys available",
    };
  }

  // Select the next key based on strategy
  let nextKey: ApiKeyConfig;

  switch (settings.rotationStrategy) {
    case "failover":
      // Use the next active key in order
      nextKey = activeKeys[0];
      break;

    case "usage-based":
      // Use the key with lowest usage
      nextKey = activeKeys.sort((a, b) => a.usageCount - b.usageCount)[0];
      break;

    default:
      // Round-robin: just pick the next one
      nextKey = activeKeys[0];
  }

  const newIndex = settings.geminiApiKeys.findIndex((k) => k.id === nextKey.id);

  // Update current key index
  await updateCurrentKeyIndex(newIndex);

  functions.logger.info("Rotated to new API key after failure", {
    newKeyIndex: newIndex,
    newKeyId: nextKey.id,
    newKeyName: nextKey.name,
  });

  return {
    success: true,
    newKey: nextKey.key,
    newKeyIndex: newIndex,
  };
}

/**
 * Update the current key index
 */
async function updateCurrentKeyIndex(newIndex: number): Promise<void> {
  await updatePlatformAPISettings(
    { currentKeyIndex: newIndex },
    "system"
  );
}

/**
 * Check if any API keys are configured and active
 */
export async function hasActiveApiKeys(): Promise<boolean> {
  const settings = await getPlatformAPISettings();
  return settings.geminiApiKeys.some((k) => k.isActive);
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyStats(): Promise<{
  totalKeys: number;
  activeKeys: number;
  totalUsageToday: number;
  totalUsageAllTime: number;
  keyStats: Array<{
    id: string;
    name: string;
    isActive: boolean;
    usageToday: number;
    totalUsage: number;
    dailyLimit?: number;
    percentUsed?: number;
  }>;
}> {
  const settings = await getPlatformAPISettings();

  const keyStats = settings.geminiApiKeys.map((k) => ({
    id: k.id,
    name: k.name,
    isActive: k.isActive,
    usageToday: k.usageCount,
    totalUsage: k.totalUsage,
    dailyLimit: k.dailyLimit,
    percentUsed: k.dailyLimit
      ? Math.round((k.usageCount / k.dailyLimit) * 100)
      : undefined,
  }));

  return {
    totalKeys: settings.geminiApiKeys.length,
    activeKeys: settings.geminiApiKeys.filter((k) => k.isActive).length,
    totalUsageToday: settings.geminiApiKeys.reduce(
      (sum, k) => sum + k.usageCount,
      0
    ),
    totalUsageAllTime: settings.geminiApiKeys.reduce(
      (sum, k) => sum + k.totalUsage,
      0
    ),
    keyStats,
  };
}

/**
 * Validate an API key format (basic check)
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Gemini API keys typically start with "AI" and are 39 chars
  // But we'll be flexible and just check for reasonable length
  if (!key || typeof key !== "string") return false;
  if (key.length < 20 || key.length > 100) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(key)) return false;
  return true;
}
