/**
 * Rate Limiter
 *
 * Enforces rate limits on API requests at both global and per-user levels.
 * Uses Firestore for tracking request counts with sliding window approach.
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getPlatformAPISettings } from "./platformSettings";

// Get Firestore instance
const getDb = () => admin.firestore();

// Collection for rate limit tracking
const RATE_LIMIT_COLLECTION = "rate_limits";

export interface RateLimitCheck {
  allowed: boolean;
  retryAfter?: number; // Seconds until next allowed request
  reason?: string;
  remaining?: {
    perMinute: number;
    perDay: number;
  };
}

export interface UserUsage {
  userId: string;
  requestsLastMinute: number;
  requestsToday: number;
  lastRequestAt: number;
  minuteWindowStart: number;
  dayWindowStart: number;
}

/**
 * Check if a request is allowed under rate limits
 */
export async function checkRateLimit(userId: string): Promise<RateLimitCheck> {
  const settings = await getPlatformAPISettings();

  // If rate limiting is disabled, always allow
  if (!settings.rateLimits.enabled) {
    return { allowed: true };
  }

  const now = Date.now();

  // Get user's current usage
  const usage = await getUserUsage(userId);

  // Check per-user minute limit
  if (usage.requestsLastMinute >= settings.rateLimits.perUserRequestsPerMinute) {
    const retryAfter = Math.ceil(
      (usage.minuteWindowStart + 60 * 1000 - now) / 1000
    );

    functions.logger.info("Per-minute rate limit exceeded", {
      userId,
      limit: settings.rateLimits.perUserRequestsPerMinute,
      current: usage.requestsLastMinute,
    });

    return {
      allowed: false,
      retryAfter: Math.max(1, retryAfter),
      reason: "Rate limit exceeded. Please wait a moment before trying again.",
    };
  }

  // Check per-user daily limit
  if (usage.requestsToday >= settings.rateLimits.perUserRequestsPerDay) {
    functions.logger.info("Daily rate limit exceeded", {
      userId,
      limit: settings.rateLimits.perUserRequestsPerDay,
      current: usage.requestsToday,
    });

    return {
      allowed: false,
      reason:
        "Daily request limit reached. Your limit will reset at midnight UTC.",
    };
  }

  // Check global limit
  const globalUsage = await getGlobalUsage();
  if (globalUsage.requestsLastMinute >= settings.rateLimits.globalRequestsPerMinute) {
    functions.logger.warn("Global rate limit exceeded", {
      limit: settings.rateLimits.globalRequestsPerMinute,
      current: globalUsage.requestsLastMinute,
    });

    return {
      allowed: false,
      retryAfter: 5,
      reason: "Platform is experiencing high traffic. Please try again shortly.",
    };
  }

  // Calculate remaining requests
  const remaining = {
    perMinute:
      settings.rateLimits.perUserRequestsPerMinute - usage.requestsLastMinute,
    perDay: settings.rateLimits.perUserRequestsPerDay - usage.requestsToday,
  };

  return {
    allowed: true,
    remaining,
  };
}

/**
 * Record a request for rate limiting purposes
 */
export async function recordRequest(userId: string): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const startOfDay = getStartOfDay(now);

  // Update user's usage
  const userRef = db.collection(RATE_LIMIT_COLLECTION).doc(`user_${userId}`);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);
    const data = doc.exists ? (doc.data() as UserUsage) : null;

    const oneMinuteAgo = now - 60 * 1000;

    // Calculate new values
    let requestsLastMinute = 1;
    let requestsToday = 1;
    let minuteWindowStart = now;
    let dayWindowStart = startOfDay;

    if (data) {
      // Reset minute counter if window has passed
      if (data.minuteWindowStart && data.minuteWindowStart > oneMinuteAgo) {
        requestsLastMinute = data.requestsLastMinute + 1;
        minuteWindowStart = data.minuteWindowStart;
      }

      // Reset daily counter if new day
      if (data.dayWindowStart && data.dayWindowStart >= startOfDay) {
        requestsToday = data.requestsToday + 1;
        dayWindowStart = data.dayWindowStart;
      }
    }

    transaction.set(userRef, {
      userId,
      requestsLastMinute,
      requestsToday,
      lastRequestAt: now,
      minuteWindowStart,
      dayWindowStart,
    });
  });

  // Update global usage
  await recordGlobalRequest();
}

/**
 * Get user's current usage stats
 */
async function getUserUsage(userId: string): Promise<UserUsage> {
  const db = getDb();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const startOfDay = getStartOfDay(now);

  const doc = await db
    .collection(RATE_LIMIT_COLLECTION)
    .doc(`user_${userId}`)
    .get();

  if (!doc.exists) {
    return {
      userId,
      requestsLastMinute: 0,
      requestsToday: 0,
      lastRequestAt: 0,
      minuteWindowStart: now,
      dayWindowStart: startOfDay,
    };
  }

  const data = doc.data() as UserUsage;

  // Check if windows have reset
  let requestsLastMinute = data.requestsLastMinute;
  let requestsToday = data.requestsToday;

  // Reset minute counter if window has passed
  if (!data.minuteWindowStart || data.minuteWindowStart <= oneMinuteAgo) {
    requestsLastMinute = 0;
  }

  // Reset daily counter if new day
  if (!data.dayWindowStart || data.dayWindowStart < startOfDay) {
    requestsToday = 0;
  }

  return {
    ...data,
    requestsLastMinute,
    requestsToday,
  };
}

/**
 * Get global usage stats
 */
async function getGlobalUsage(): Promise<{ requestsLastMinute: number }> {
  const db = getDb();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  const doc = await db
    .collection(RATE_LIMIT_COLLECTION)
    .doc("global_usage")
    .get();

  if (!doc.exists) {
    return { requestsLastMinute: 0 };
  }

  const data = doc.data() as {
    requestsLastMinute: number;
    windowStart: number;
  };

  // Reset if window has passed
  if (!data.windowStart || data.windowStart <= oneMinuteAgo) {
    return { requestsLastMinute: 0 };
  }

  return { requestsLastMinute: data.requestsLastMinute };
}

/**
 * Record a global request
 */
async function recordGlobalRequest(): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  const globalRef = db.collection(RATE_LIMIT_COLLECTION).doc("global_usage");

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(globalRef);
    const data = doc.exists
      ? (doc.data() as { requestsLastMinute: number; windowStart: number })
      : null;

    let requestsLastMinute = 1;
    let windowStart = now;

    if (data && data.windowStart > oneMinuteAgo) {
      requestsLastMinute = data.requestsLastMinute + 1;
      windowStart = data.windowStart;
    }

    transaction.set(globalRef, {
      requestsLastMinute,
      windowStart,
    });
  });
}

/**
 * Get start of current day (midnight UTC)
 */
function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get rate limit stats for a user (for display)
 */
export async function getUserRateLimitStats(userId: string): Promise<{
  requestsLastMinute: number;
  requestsToday: number;
  limits: {
    perMinute: number;
    perDay: number;
  };
  remaining: {
    perMinute: number;
    perDay: number;
  };
}> {
  const settings = await getPlatformAPISettings();
  const usage = await getUserUsage(userId);

  return {
    requestsLastMinute: usage.requestsLastMinute,
    requestsToday: usage.requestsToday,
    limits: {
      perMinute: settings.rateLimits.perUserRequestsPerMinute,
      perDay: settings.rateLimits.perUserRequestsPerDay,
    },
    remaining: {
      perMinute: Math.max(
        0,
        settings.rateLimits.perUserRequestsPerMinute - usage.requestsLastMinute
      ),
      perDay: Math.max(
        0,
        settings.rateLimits.perUserRequestsPerDay - usage.requestsToday
      ),
    },
  };
}

/**
 * Clean up old rate limit documents (run periodically)
 */
export async function cleanupOldRateLimitDocs(): Promise<number> {
  const db = getDb();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const snapshot = await db
    .collection(RATE_LIMIT_COLLECTION)
    .where("lastRequestAt", "<", oneDayAgo)
    .limit(500)
    .get();

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    // Don't delete global usage doc
    if (doc.id !== "global_usage") {
      batch.delete(doc.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    functions.logger.info(`Cleaned up ${count} old rate limit documents`);
  }

  return count;
}
