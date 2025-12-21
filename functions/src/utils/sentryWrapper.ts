/**
 * Sentry Wrapper Utilities for Cloud Functions
 *
 * Provides higher-order functions to wrap Cloud Functions
 * with automatic Sentry error tracking and performance monitoring.
 */

import {
  initSentry,
  setSentryUser,
  clearSentryUser,
  captureError,
  addBreadcrumb,
  flushSentry,
  incrementCounter,
  trackMetric,
  Sentry,
} from "../sentry";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

/**
 * Wrap a callable function with Sentry monitoring
 *
 * @example
 * export const myFunction = onCall(
 *   { cors: true },
 *   withSentry("myFunction", async (request) => {
 *     // Your function logic
 *     return { success: true };
 *   })
 * );
 */
export function withSentry<T, R>(
  functionName: string,
  handler: (request: CallableRequest<T>) => Promise<R>
): (request: CallableRequest<T>) => Promise<R> {
  return async (request: CallableRequest<T>): Promise<R> => {
    // Initialize Sentry if not already done
    initSentry();

    const startTime = Date.now();

    // Set user context if authenticated
    if (request.auth?.uid) {
      setSentryUser(request.auth.uid, request.auth.token.email);
    }

    // Add breadcrumb for function invocation
    addBreadcrumb("function", `Invoking ${functionName}`, {
      functionName,
      hasAuth: !!request.auth,
    });

    try {
      // Execute the handler within a Sentry context
      const result = await Sentry.startSpan(
        {
          name: functionName,
          op: "function.callable",
        },
        async () => {
          return handler(request);
        }
      );

      // Track success metric
      incrementCounter("function.success", 1, { function: functionName });

      return result;
    } catch (error) {
      // Track error metric
      incrementCounter("function.error", 1, { function: functionName });

      // Capture the exception with context
      if (error instanceof Error) {
        captureError(error, {
          tags: {
            function: functionName,
            errorType: error instanceof HttpsError ? "HttpsError" : "Error",
          },
          extra: {
            requestData: sanitizeData(request.data),
            userId: request.auth?.uid,
          },
        });
      }

      // Re-throw the error for proper function response
      throw error;
    } finally {
      // Track execution time
      const duration = Date.now() - startTime;
      trackMetric("function.duration", duration, "millisecond", {
        function: functionName,
      });

      // Clear user context
      clearSentryUser();

      // Flush Sentry before function terminates
      await flushSentry();
    }
  };
}

/**
 * Wrap a specific operation with a Sentry span
 *
 * @example
 * const result = await withSpan("stripe.createCheckout", async () => {
 *   return stripe.checkout.sessions.create({ ... });
 * });
 */
export async function withSpan<T>(
  name: string,
  operation: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  try {
    return await Sentry.startSpan(
      {
        name,
        op: "operation",
      },
      async (span) => {
        try {
          const result = await operation();
          if (span) {
            span.setStatus({ code: 1, message: "ok" });
          }
          return result;
        } catch (error) {
          if (span) {
            span.setStatus({ code: 2, message: "error" });
          }
          throw error;
        }
      }
    );
  } catch (error) {
    // Capture error with tags
    if (error instanceof Error) {
      Sentry.captureException(error, { tags });
    }
    throw error;
  }
}

/**
 * Sanitize request data to avoid sending sensitive information
 */
function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sanitized = { ...data } as Record<string, unknown>;

  // List of sensitive keys to redact
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "authorization",
    "creditCard",
    "ssn",
  ];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Track an external API call with Sentry
 *
 * @example
 * const session = await trackExternalCall(
 *   "stripe",
 *   "checkout.sessions.create",
 *   () => stripe.checkout.sessions.create({ ... })
 * );
 */
export async function trackExternalCall<T>(
  service: string,
  operation: string,
  call: () => Promise<T>
): Promise<T> {
  const spanName = `${service}.${operation}`;
  const startTime = Date.now();

  addBreadcrumb("external_api", `Calling ${spanName}`, { service, operation });

  try {
    const result = await withSpan(spanName, call, { service, operation });

    // Track latency
    const duration = Date.now() - startTime;
    trackMetric("external_api.latency", duration, "millisecond", {
      service,
      operation,
    });

    return result;
  } catch (error) {
    // Track failure
    incrementCounter("external_api.error", 1, { service, operation });
    throw error;
  }
}
