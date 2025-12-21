/**
 * Sentry Error Monitoring for Cloud Functions
 *
 * Initializes Sentry for error tracking, performance monitoring,
 * and custom metrics in Firebase Cloud Functions.
 *
 * IMPORTANT: This file should be imported at the very top of index.ts
 * before any other imports to ensure Sentry captures all errors.
 */

import * as Sentry from "@sentry/node";

// Track initialization state
let isInitialized = false;

// Lazy initialize Sentry to avoid deployment timeouts
function ensureSentryInitialized(): void {
  if (isInitialized) return;

  const SENTRY_DSN = process.env.SENTRY_DSN ||
    "https://e78f31a9581e25f4714ef445909c50fd@o4510573422313472.ingest.us.sentry.io/4510573760348160";

  Sentry.init({
    dsn: SENTRY_DSN,

    // Release tracking for better Jira/Teams integration
    release: process.env.SENTRY_RELEASE || "renovatemysite-functions@1.0.0",
    environment: process.env.SENTRY_ENVIRONMENT || "production",

    // Send default PII data (IP address, etc.) for better debugging
    sendDefaultPii: true,

    // Performance monitoring sample rate
    tracesSampleRate: 0.2,

    // Server-side settings
    serverName: "firebase-functions",

    // Attach stack traces to all messages
    attachStacktrace: true,

    // Capture 100% of errors
    sampleRate: 1.0,

    // Initial tags for routing to Jira/Teams
    initialScope: {
      tags: {
        service: "functions",
        team: "platform",
      },
    },

    // Integrations
    integrations: [
      // HTTP integration for tracking outbound requests
      Sentry.httpIntegration(),
    ],

    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Skip expected errors like rate limiting
      if (error && typeof error === "object" && "code" in error) {
        const code = (error as any).code;
        if (code === "functions/resource-exhausted") {
          return null;
        }
      }

      return event;
    },
  });

  isInitialized = true;
  console.log("Sentry initialized for Cloud Functions");
}

// Initialize lazily on first function execution, not during deployment
// This prevents deployment timeouts

/**
 * Initialize or re-initialize Sentry
 */
export function initSentry(): void {
  ensureSentryInitialized();
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string): void {
  ensureSentryInitialized();
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  ensureSentryInitialized();
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
): void {
  ensureSentryInitialized();
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
  });
}

/**
 * Capture an exception with additional context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id: string; email?: string };
  }
): void {
  ensureSentryInitialized();
  if (context?.user) {
    Sentry.setUser(context.user);
  }

  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
): void {
  ensureSentryInitialized();
  Sentry.captureMessage(message, level);
}

/**
 * Start a transaction span for performance monitoring
 */
export function startSpan(name: string, op?: string): Sentry.Span | undefined {
  ensureSentryInitialized();
  return Sentry.startInactiveSpan({
    name,
    op: op || "function",
  });
}

/**
 * Track a metric (logged as breadcrumb since metrics API varies by SDK version)
 */
export function trackMetric(
  name: string,
  value: number,
  unit?: string,
  tags?: Record<string, string>
): void {
  ensureSentryInitialized();
  // Use breadcrumbs as a fallback for metrics tracking
  // This ensures compatibility across Sentry SDK versions
  Sentry.addBreadcrumb({
    category: "metric",
    message: `${name}: ${value}${unit ? ` ${unit}` : ""}`,
    data: { name, value, unit, ...tags },
    level: "info",
  });
}

/**
 * Increment a counter metric (logged as breadcrumb)
 */
export function incrementCounter(
  name: string,
  value: number = 1,
  tags?: Record<string, string>
): void {
  ensureSentryInitialized();
  Sentry.addBreadcrumb({
    category: "counter",
    message: `${name}: +${value}`,
    data: { name, value, ...tags },
    level: "info",
  });
}

/**
 * Flush pending events before function terminates
 * Should be called before returning from a function
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!isInitialized) return true; // Nothing to flush if not initialized
  return Sentry.flush(timeout);
}

// Re-export Sentry for advanced usage
export { Sentry };
