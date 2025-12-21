import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry, Sentry } from './services/sentry';
import App from './App';

// Initialize Sentry BEFORE React renders
initSentry();

// Global error handlers for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  if (error) {
    Sentry.captureException(error, {
      extra: { message, source, lineno, colno },
    });
  }
  return false;
};

// Global handler for unhandled promise rejections
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  Sentry.captureException(event.reason, {
    tags: { type: 'unhandledrejection' },
  });
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);