/**
 * Firebase Authentication Hook
 *
 * Provides authentication state and methods throughout the app.
 * Wrap your app with AuthProvider to use this hook.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";

// ============================================
// Types
// ============================================

interface AuthContextType {
  // State
  user: User | null;
  loading: boolean;
  error: string | null;

  // Methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  clearError: () => void;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Firebase is configured
  const firebaseEnabled = isFirebaseConfigured();

  // Listen to auth state changes
  useEffect(() => {
    // If Firebase isn't configured, just set loading to false and run in demo mode
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseEnabled]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    if (!firebaseEnabled || !auth) {
      setError("Firebase not configured. Authentication is unavailable.");
      throw new Error("Firebase not configured");
    }

    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [firebaseEnabled]);

  // Sign up with email/password
  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!firebaseEnabled || !auth) {
        setError("Firebase not configured. Authentication is unavailable.");
        throw new Error("Firebase not configured");
      }

      setError(null);
      setLoading(true);

      try {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update display name if provided
        if (displayName && credential.user) {
          await updateProfile(credential.user, { displayName });
        }
      } catch (err: any) {
        const message = getAuthErrorMessage(err.code);
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [firebaseEnabled]
  );

  // Sign out
  const signOut = useCallback(async () => {
    if (!firebaseEnabled || !auth) {
      // In demo mode, just clear the user (no-op)
      return;
    }

    setError(null);

    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      const message = "Failed to sign out. Please try again.";
      setError(message);
      throw new Error(message);
    }
  }, [firebaseEnabled]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    if (!firebaseEnabled || !auth) {
      setError("Firebase not configured. Authentication is unavailable.");
      throw new Error("Firebase not configured");
    }

    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [firebaseEnabled]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    if (!firebaseEnabled || !auth) {
      setError("Firebase not configured. Authentication is unavailable.");
      throw new Error("Firebase not configured");
    }

    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw new Error(message);
    }
  }, [firebaseEnabled]);

  // Update user profile
  const updateUserProfile = useCallback(
    async (displayName: string) => {
      setError(null);

      if (!user) {
        throw new Error("No user logged in");
      }

      try {
        await updateProfile(user, { displayName });
        // Force refresh to get updated user object
        setUser({ ...user, displayName } as User);
      } catch (err: any) {
        const message = "Failed to update profile. Please try again.";
        setError(message);
        throw new Error(message);
      }
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled. Please contact support.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up first.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "An error occurred. Please try again.";
  }
}

// ============================================
// Export Types
// ============================================

export type { AuthContextType };
