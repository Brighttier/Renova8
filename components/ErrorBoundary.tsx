/**
 * Error Boundary Component
 *
 * Catches React errors and displays a user-friendly fallback UI.
 * Integrates with Sentry for error reporting.
 */

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
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Report to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Log to console in development
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
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F6F0]">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-2xl shadow-lg border border-[#EFEBE4] p-8 text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h1
                className="text-2xl font-bold text-[#4A4A4A] mb-2"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Something went wrong
              </h1>

              {/* Description */}
              <p className="text-gray-600 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                We apologize for the inconvenience. Our team has been notified and is working on a fix.
              </p>

              {/* Error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReportIssue}
                  className="px-6 py-3 border-2 border-[#D4AF37] text-[#D4AF37] rounded-xl font-semibold hover:bg-[#D4AF37] hover:text-white transition-all duration-200"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Report Issue
                </button>
              </div>

              {/* Support Link */}
              <p className="mt-6 text-sm text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Need help?{' '}
                <a href="mailto:support@renovatemy.site" className="text-[#D4AF37] hover:underline">
                  Contact Support
                </a>
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
