import React from 'react';
import ReactDOM, { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';

// Initialize Sentry BEFORE React renders
Sentry.init({
  dsn: "https://b5a5573944c723fbdc95bee71bbd0e98@o4510573422313472.ingest.us.sentry.io/4510573749796864",

  // Release tracking for better Jira/Teams integration
  release: import.meta.env.VITE_APP_VERSION || "renovatemysite-frontend@1.0.0",
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "development",

  // GDPR Compliance: Do NOT send PII data (IP address, user agent, etc.)
  sendDefaultPii: false,

  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

  // Initial tags for routing
  initialScope: {
    tags: {
      service: "frontend",
      team: "platform",
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