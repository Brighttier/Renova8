# Sentry Error Monitoring - Standard Operating Procedure (SOP)

## Purpose

This SOP provides step-by-step instructions for implementing Sentry error monitoring across React frontend applications and Firebase Cloud Functions backends. Follow this guide to achieve consistent monitoring patterns across all company projects.

**Estimated Time:** 2-4 hours for full implementation

**Prerequisites:**
- Sentry account with organization access
- Admin access to the project repository
- Firebase project configured (for backend)
- Node.js 18+ installed

---

# PART A: SENTRY PROJECT SETUP

## Step 1: Create Sentry Projects

1. Log in to [sentry.io](https://sentry.io)
2. Go to **Settings > Projects > Create Project**
3. Create TWO projects:
   - **Frontend**: Select "React" platform → Name: `{project-name}-frontend`
   - **Backend**: Select "Node.js" platform → Name: `{project-name}-functions`
4. Copy the DSN for each project (Settings > Projects > {project} > Client Keys)

**Example DSN format:**
```
https://abc123xyz@o1234567890.ingest.us.sentry.io/1234567890123456
```

---

# PART B: FRONTEND IMPLEMENTATION

## Step 2: Install Frontend Packages

```bash
# Required packages
npm install @sentry/react

# Optional: Source maps upload for readable stack traces
npm install --save-dev @sentry/vite-plugin @sentry/cli
```

---

## Step 3: Create Entry Point Initialization

**Modify `index.tsx`** - Initialize Sentry BEFORE React renders:

```typescript
import React from 'react';
import ReactDOM, { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';

// Initialize Sentry BEFORE React renders
Sentry.init({
  dsn: "YOUR_FRONTEND_DSN_HERE",  // Replace with actual DSN

  // Release tracking for Jira/Teams integration
  release: import.meta.env.VITE_APP_VERSION || "{project-name}-frontend@1.0.0",
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "development",

  // Send PII for debugging (user IP, etc.)
  sendDefaultPii: true,

  // Performance monitoring (lower in prod to reduce costs)
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

  // Service tags for issue routing
  initialScope: {
    tags: {
      service: "frontend",
      team: "platform",  // Change to your team name
    },
  },
});

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Step 4: Create Sentry Service Module

**Create `services/sentry.ts`**:

```typescript
/**
 * Sentry Error Monitoring Service
 */
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry (alternative method using env vars)
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    sendDefaultPii: true,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter browser extension errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message;
        if (message.includes('extension') || message.includes('Extension')) {
          return null;
        }
      }
      return event;
    },

    debug: import.meta.env.DEV,
  });
}

/**
 * Set user context (call on login)
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
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({ category, message, data, level });
}

/**
 * Capture an exception with context
 */
export function captureError(
  error: Error,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
): void {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Show user feedback dialog
 */
export function showFeedbackDialog(): void {
  const eventId = Sentry.lastEventId();
  if (eventId) {
    Sentry.showReportDialog({ eventId });
  }
}

export { Sentry };
```

---

## Step 5: Create Error Boundary Component

**Create `components/ErrorBoundary.tsx`**:

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Sentry, showFeedbackDialog } from '../services/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Report to Sentry
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });

    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReportIssue = (): void => {
    showFeedbackDialog();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. Our team has been notified.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={this.handleReload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
                  Try Again
                </button>
                <button onClick={this.handleReportIssue}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-600 hover:text-white">
                  Report Issue
                </button>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                Need help? <a href="mailto:support@company.com" className="text-blue-600 hover:underline">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## Step 6: Update App.tsx

**Modify `App.tsx`**:

```typescript
import * as Sentry from '@sentry/react';
import ErrorBoundary from './components/ErrorBoundary';

// Inside your App component, add user tracking:
useEffect(() => {
  if (user) {
    Sentry.setUser({
      id: user.uid,
      email: user.email || undefined,
      username: user.displayName || undefined,
    });
  } else {
    Sentry.setUser(null);
  }
}, [user]);

// Wrap your app with ErrorBoundary:
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

---

## Step 7: Configure Vite for Source Maps

**Modify `vite.config.ts`**:

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Only use Sentry plugin in production when auth token is available
  const sentryPlugin = mode === 'production' && env.SENTRY_AUTH_TOKEN
    ? sentryVitePlugin({
        org: env.SENTRY_ORG || 'your-org',
        project: env.SENTRY_PROJECT || 'your-project-frontend',
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: ['**/*.map'],
        },
        telemetry: false,
      })
    : null;

  return {
    plugins: [react(), sentryPlugin].filter(Boolean),
    build: {
      sourcemap: true,  // Required for Sentry
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
  };
});
```

---

## Step 8: Add Test Button (Temporary)

**Add to App.tsx for testing** (remove after verification):

```typescript
function SentryTestButton() {
  return (
    <button
      onClick={() => { throw new Error('Test Sentry Error!'); }}
      className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 z-50"
    >
      Test Sentry Error
    </button>
  );
}

// Add inside your App return:
<SentryTestButton />
```

---

# PART C: BACKEND IMPLEMENTATION (Firebase Cloud Functions)

## Step 9: Install Backend Packages

```bash
cd functions
npm install @sentry/node
```

---

## Step 10: Create Backend Sentry Module

**Create `functions/src/sentry.ts`**:

```typescript
/**
 * Sentry Error Monitoring for Cloud Functions
 */
import * as Sentry from "@sentry/node";

// Initialize on module import (serverless pattern)
const SENTRY_DSN = process.env.SENTRY_DSN ||
  "YOUR_BACKEND_DSN_HERE";  // Replace with actual DSN

Sentry.init({
  dsn: SENTRY_DSN,
  release: process.env.SENTRY_RELEASE || "{project-name}-functions@1.0.0",
  environment: process.env.SENTRY_ENVIRONMENT || "production",
  sendDefaultPii: true,
  tracesSampleRate: 0.2,
  serverName: "firebase-functions",
  attachStacktrace: true,
  sampleRate: 1.0,

  initialScope: {
    tags: {
      service: "functions",
      team: "platform",
    },
  },

  integrations: [Sentry.httpIntegration()],

  beforeSend(event, hint) {
    const error = hint.originalException;
    // Skip rate limiting errors
    if (error && typeof error === "object" && "code" in error) {
      if ((error as any).code === "functions/resource-exhausted") {
        return null;
      }
    }
    return event;
  },
});

console.log("Sentry initialized for Cloud Functions");

export function initSentry(): void {
  console.log("Sentry already initialized");
}

export function setSentryUser(userId: string, email?: string): void {
  Sentry.setUser({ id: userId, email });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
): void {
  Sentry.addBreadcrumb({ category, message, data, level });
}

export function captureError(
  error: Error,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown>; user?: { id: string; email?: string } }
): void {
  if (context?.user) Sentry.setUser(context.user);
  Sentry.captureException(error, { tags: context?.tags, extra: context?.extra });
}

export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

export function trackMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
  Sentry.addBreadcrumb({
    category: "metric",
    message: `${name}: ${value}${unit ? ` ${unit}` : ""}`,
    data: { name, value, unit, ...tags },
    level: "info",
  });
}

export function incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
  Sentry.addBreadcrumb({
    category: "counter",
    message: `${name}: +${value}`,
    data: { name, value, ...tags },
    level: "info",
  });
}

export { Sentry };
```

---

## Step 11: Create Function Wrapper Utility

**Create `functions/src/utils/sentryWrapper.ts`**:

```typescript
import {
  initSentry, setSentryUser, clearSentryUser, captureError,
  addBreadcrumb, flushSentry, incrementCounter, trackMetric, Sentry,
} from "../sentry";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

/**
 * Wrap a callable function with Sentry monitoring
 */
export function withSentry<T, R>(
  functionName: string,
  handler: (request: CallableRequest<T>) => Promise<R>
): (request: CallableRequest<T>) => Promise<R> {
  return async (request: CallableRequest<T>): Promise<R> => {
    initSentry();
    const startTime = Date.now();

    if (request.auth?.uid) {
      setSentryUser(request.auth.uid, request.auth.token.email);
    }

    addBreadcrumb("function", `Invoking ${functionName}`, {
      functionName,
      hasAuth: !!request.auth,
    });

    try {
      const result = await Sentry.startSpan(
        { name: functionName, op: "function.callable" },
        async () => handler(request)
      );

      incrementCounter("function.success", 1, { function: functionName });
      return result;
    } catch (error) {
      incrementCounter("function.error", 1, { function: functionName });

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
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      trackMetric("function.duration", duration, "millisecond", { function: functionName });
      clearSentryUser();
      await flushSentry();
    }
  };
}

/**
 * Track external API calls
 */
export async function trackExternalCall<T>(
  service: string,
  operation: string,
  call: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  addBreadcrumb("external_api", `Calling ${service}.${operation}`, { service, operation });

  try {
    const result = await Sentry.startSpan(
      { name: `${service}.${operation}`, op: "operation" },
      call
    );
    trackMetric("external_api.latency", Date.now() - startTime, "millisecond", { service, operation });
    return result;
  } catch (error) {
    incrementCounter("external_api.error", 1, { service, operation });
    throw error;
  }
}

function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const sanitized = { ...data } as Record<string, unknown>;
  const sensitiveKeys = ["password", "token", "secret", "apiKey", "api_key", "authorization"];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}
```

---

## Step 12: Update Functions Entry Point

**Modify `functions/src/index.ts`** - Import Sentry FIRST:

```typescript
// IMPORTANT: Import Sentry FIRST before any other imports
import "./sentry";

// Then import everything else
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { withSentry, trackExternalCall } from "./utils/sentryWrapper";
// ... other imports

// Example function with Sentry wrapper:
export const myFunction = onCall(
  { cors: true },
  withSentry("myFunction", async (request) => {
    // Your function logic
    return { success: true };
  })
);

// Example tracking external API:
const result = await trackExternalCall("stripe", "checkout.create", async () => {
  return stripe.checkout.sessions.create({ ... });
});
```

---

# PART D: ENVIRONMENT CONFIGURATION

## Step 13: Set Up Environment Variables

**Frontend `.env.example`**:
```bash
# Sentry Error Monitoring
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0

# Source Maps Upload (CI/CD only)
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project-frontend
```

**Firebase Secrets** (for Cloud Functions):
```bash
# Set secrets via Firebase CLI
firebase functions:secrets:set SENTRY_DSN
# Enter: https://xxx@xxx.ingest.sentry.io/xxx

firebase functions:secrets:set SENTRY_ENVIRONMENT
# Enter: production

firebase functions:secrets:set SENTRY_RELEASE
# Enter: your-project-functions@1.0.0
```

---

# PART E: INTEGRATIONS (Dashboard Configuration)

## Step 14: Jira Integration

**No code required - Dashboard configuration only**

### Setup Process:
1. Go to **Sentry Settings > Integrations > Jira**
2. Click "Add Installation" and complete OAuth flow
3. Select your Jira instance and authorize
4. Map Sentry projects to Jira projects

### Configuration Options:
| Feature | Description |
|---------|-------------|
| **Issue Creation** | Create Jira tickets directly from Sentry errors |
| **Bidirectional Sync** | Comments, assignees, and status sync between platforms |
| **Auto-Resolution** | When you resolve in Sentry, Jira ticket auto-updates |

### Recommended Alert Rules for Jira:
| Condition | Action |
|-----------|--------|
| New issue in production | Create Jira ticket (High priority) |
| Error affects >100 users | Create Jira ticket + assign on-call |
| Payment/Stripe errors | Create Jira ticket immediately |

### Permissions Required:
- **Sentry**: Owner, Manager, or Admin role
- **Jira**: Administrator permissions

---

## Step 15: Microsoft Teams Integration

**No code required - Dashboard configuration only**

### Setup Process:
1. Go to **Sentry Settings > Integrations > Microsoft Teams**
2. Click "Teams Marketplace" to install the Sentry app
3. **Important**: Select the specific channel (don't just click "Open")
4. Complete setup in Sentry
5. First interaction: Link your identity when prompted

### Configuration - Alert Rules:
Go to **Alerts > Create Alert** and configure:

| Alert Type | Channel | Condition |
|------------|---------|-----------|
| Production Errors | #incidents | New error in production |
| Error Spike | #incidents | 10x normal rate in 1 hour |
| Payment Errors | #payments-alerts | Tag: service=stripe |
| Performance Issues | #dev-alerts | P95 latency > 5 seconds |

### Interactive Features from Teams:
- Resolve issues directly from Teams
- Archive issues
- Assign issues to team members
- All changes sync back to Sentry

### Best Practices:
- Set **action intervals** to prevent alert fatigue (e.g., once per hour per issue)
- Use **environment filters** (production alerts only to #incidents)
- Create **ownership rules** for auto-assignment

---

## Step 16: Configure Alert Routing Strategy

### Combined Jira + MS Teams Strategy:

| Severity | MS Teams Action | Jira Action |
|----------|-----------------|-------------|
| **Critical** (payments, auth) | Immediate alert to #incidents | Auto-create High priority ticket |
| **High** (production errors) | Alert to #incidents | Auto-create Medium priority ticket |
| **Medium** (staging errors) | Alert to #dev-alerts | Manual ticket creation |
| **Low** (warnings) | No alert | No ticket |

### Ownership Rules (Settings > Ownership):
```
# Route payment errors to payments team
tags.service:stripe payments-team@company.com

# Route frontend errors to frontend team
path:components/* frontend-team@company.com
path:services/* frontend-team@company.com

# Route function errors to backend team
path:functions/* backend-team@company.com
```

---

# PART F: DEPLOYMENT & TESTING

## Step 17: Deploy

```bash
# Build and deploy frontend
npm run build
firebase deploy --only hosting

# Build and deploy functions
cd functions
npm run build
firebase deploy --only functions
```

---

## Step 18: Verify Integration

### Frontend Testing:
1. Open your app in the browser
2. Click the **Test Sentry Error** button (red button, bottom-right)
3. Go to [sentry.io](https://sentry.io) → Your Project → Issues
4. Verify the error appears with:
   - Stack trace pointing to TypeScript source
   - User context (if logged in)
   - Service tag: `frontend`

### Backend Testing:
1. Trigger a function error (e.g., call a function with invalid data)
2. Check Sentry for the error with:
   - Function name in tags
   - User context
   - Service tag: `functions`

### Browser Console Test:
```javascript
// Run in browser console
throw new Error("Manual Sentry Test");
```

---

## Step 19: Post-Verification Cleanup

After confirming Sentry works:

1. **Remove SentryTestButton** from App.tsx
2. **Update sample rates** for production:
   - `tracesSampleRate: 0.1` (10% of transactions)
   - `replaysSessionSampleRate: 0.1` (10% of sessions)
3. **Set up source map uploads** in CI/CD pipeline

---

# PART G: QUICK REFERENCE

## Files Summary

| File | Purpose |
|------|---------|
| `index.tsx` | Frontend Sentry initialization (MUST be first) |
| `services/sentry.ts` | Frontend helper functions |
| `components/ErrorBoundary.tsx` | React error boundary with fallback UI |
| `functions/src/sentry.ts` | Backend Sentry initialization |
| `functions/src/utils/sentryWrapper.ts` | Function wrapper for monitoring |
| `vite.config.ts` | Source maps upload configuration |

## Key Patterns

### Capture an Error (Frontend)
```typescript
import { captureError } from './services/sentry';
captureError(error, { tags: { feature: 'checkout' } });
```

### Capture an Error (Backend)
```typescript
import { captureError } from '../sentry';
captureError(error, { tags: { service: 'stripe' } });
```

### Add Breadcrumb (Both)
```typescript
addBreadcrumb('user_action', 'Clicked checkout button', { cartId: '123' });
```

### Wrap Cloud Function
```typescript
export const myFunction = onCall(
  { cors: true },
  withSentry("myFunction", async (request) => {
    // Your logic
  })
);
```

### Track External API
```typescript
const result = await trackExternalCall("stripe", "createCheckout", async () => {
  return stripe.checkout.sessions.create({ ... });
});
```

---

# PART H: TROUBLESHOOTING

## Common Issues

### 1. Errors not appearing in Sentry
- Verify DSN is correct
- Check `beforeSend` isn't filtering your error
- Ensure `Sentry.flush()` is called before function terminates (backend)

### 2. Source maps not working
- Verify `SENTRY_AUTH_TOKEN` is set in CI/CD
- Check `sourcemap: true` in vite.config.ts
- Ensure release version matches between build and Sentry

### 3. User context missing
- Call `Sentry.setUser()` after authentication
- Clear with `Sentry.setUser(null)` on logout

### 4. Performance data not appearing
- Check `tracesSampleRate` is > 0
- Verify browser tracing integration is added

### 5. Firebase Functions cold start errors
- Import Sentry at top of index.ts (before other imports)
- Use auto-init pattern (initialize on module load)

---

# APPENDIX: CHECKLIST

## Implementation Checklist

### Sentry Project Setup
- [ ] Created Sentry account
- [ ] Created frontend project
- [ ] Created backend project
- [ ] Copied both DSNs

### Frontend
- [ ] Installed @sentry/react
- [ ] Installed @sentry/vite-plugin (optional)
- [ ] Updated index.tsx with Sentry.init()
- [ ] Created services/sentry.ts
- [ ] Created components/ErrorBoundary.tsx
- [ ] Updated App.tsx with ErrorBoundary
- [ ] Updated App.tsx with Sentry.setUser()
- [ ] Updated vite.config.ts for source maps
- [ ] Added .env variables
- [ ] Tested with SentryTestButton
- [ ] Removed SentryTestButton after verification

### Backend
- [ ] Installed @sentry/node in functions/
- [ ] Created functions/src/sentry.ts
- [ ] Created functions/src/utils/sentryWrapper.ts
- [ ] Updated functions/src/index.ts to import sentry first
- [ ] Set Firebase secrets for SENTRY_DSN
- [ ] Deployed functions
- [ ] Tested error capture

### Integrations
- [ ] Configured Jira integration
- [ ] Configured MS Teams integration
- [ ] Created alert rules
- [ ] Set up ownership rules
- [ ] Tested notifications

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Based on:** RenovateMySite implementation
