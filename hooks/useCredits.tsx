/**
 * Credits Management Hook
 *
 * Provides real-time credit balance tracking and purchase functionality.
 * Uses Firestore real-time listeners for instant balance updates.
 */

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  db,
  getCredits as getCreditsFunction,
  createTokenCheckout,
  GetCreditsResponse,
  isFirebaseConfigured,
} from "../lib/firebase";
import { useAuth } from "./useAuth";

// ============================================
// Types
// ============================================

export interface Transaction {
  id: string;
  type: string;
  tokens: number;
  description?: string;
  createdAt: string;
  balanceAfter: number;
}

export interface UseCreditsReturn {
  // State
  credits: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  // Methods
  refreshCredits: () => Promise<void>;
  purchaseTokens: (packId: string) => Promise<void>;
  clearError: () => void;
}

// ============================================
// Hook
// ============================================

export function useCredits(): UseCreditsReturn {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for credit balance
  useEffect(() => {
    // If Firebase is not configured, use demo mode with free credits
    if (!isFirebaseConfigured() || !db) {
      setCredits(100); // Demo mode: give 100 free credits
      setLoading(false);
      return;
    }

    if (!user) {
      setCredits(0);
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Set up real-time listener on user document
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCredits(data?.tokenBalance || 0);
        } else {
          // User document doesn't exist yet (might be creating)
          setCredits(0);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to credits:", err);
        setError("Failed to load credit balance. Please refresh the page.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch full credit details including transactions
  const refreshCredits = useCallback(async () => {
    // Demo mode: no real credit fetching
    if (!isFirebaseConfigured() || !db || !getCreditsFunction) {
      return;
    }

    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getCreditsFunction();
      const data = result.data as GetCreditsResponse;

      setCredits(data.tokenBalance);
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error("Error fetching credits:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Purchase token pack
  const purchaseTokens = useCallback(
    async (packId: string) => {
      if (!user) {
        throw new Error("You must be logged in to purchase tokens.");
      }

      setError(null);

      try {
        const result = await createTokenCheckout({
          packId,
          successUrl: `${window.location.origin}/settings?checkout=success`,
          cancelUrl: `${window.location.origin}/settings?checkout=canceled`,
        });

        const data = result.data;

        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } catch (err: any) {
        console.error("Error creating checkout:", err);
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      }
    },
    [user]
  );

  return {
    credits,
    transactions,
    loading,
    error,
    refreshCredits,
    purchaseTokens,
    clearError,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract user-friendly error message from Firebase error
 */
function getErrorMessage(err: any): string {
  // Check for Firebase Functions error
  if (err?.code) {
    switch (err.code) {
      case "functions/unauthenticated":
        return "Please log in to continue.";
      case "functions/permission-denied":
        return "You don't have permission to perform this action.";
      case "functions/not-found":
        return "The requested resource was not found.";
      case "functions/resource-exhausted":
        return "Insufficient credits. Please top up your balance.";
      case "functions/invalid-argument":
        return err.message || "Invalid request. Please try again.";
      case "functions/internal":
        return "An internal error occurred. Please try again later.";
      default:
        break;
    }
  }

  // Check for network errors
  if (err?.message?.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  // Default message
  return err?.message || "An error occurred. Please try again.";
}

// ============================================
// Export
// ============================================

export default useCredits;
