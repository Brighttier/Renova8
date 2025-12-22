/**
 * Sentry Error Monitoring Service
 *
 * Initializes Sentry for error tracking, performance monitoring,
 * and session replay in the React frontend.
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error monitoring
 * Must be called before React renders
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',

    // GDPR Compliance: Do NOT send PII data (IP address, user agent, etc.)
    sendDefaultPii: false,

    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out non-critical errors
    beforeSend(event, hint) {
      // Ignore errors from browser extensions
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message;
        if (message.includes('extension') || message.includes('Extension')) {
          return null;
        }
      }
      return event;
    },

    // Enable debug in development
    debug: import.meta.env.DEV,
  });

  console.log('Sentry initialized for environment:', import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development');
}

/**
 * Set user context for error tracking
 * Call this when user logs in
 */
export function setSentryUser(user: { id: string; email?: string; displayName?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.displayName,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * Use to track user actions leading up to an error
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
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
  }
): void {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.captureMessage(message, level);
}

/**
 * Show user feedback dialog
 * Call after an error to get user context
 */
export function showFeedbackDialog(): void {
  const eventId = Sentry.lastEventId();
  if (eventId) {
    Sentry.showReportDialog({ eventId });
  }
}

// Export Sentry for advanced usage
export { Sentry };
