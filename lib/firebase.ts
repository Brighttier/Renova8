/**
 * Firebase Configuration and Initialization
 *
 * This module initializes Firebase and exports:
 * - Firebase Auth instance
 * - Firestore instance
 * - Cloud Functions callables
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
  Functions,
} from "firebase/functions";

// ============================================
// Firebase Configuration
// ============================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ============================================
// Initialize Firebase
// ============================================

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

// Only initialize Firebase if config is present
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

if (hasConfig) {
  // Check if Firebase is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} else {
  console.warn("Firebase not configured. Running in demo mode without authentication.");
}

// ============================================
// Connect to Emulators in Development
// ============================================

const USE_EMULATORS = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true";

if (USE_EMULATORS && hasConfig && auth && db && functions) {
  console.log("🔧 Connecting to Firebase emulators...");

  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("✅ Connected to Firebase emulators");
  } catch (error) {
    console.warn("Failed to connect to emulators:", error);
  }
}

// ============================================
// Export Firebase Instances
// ============================================

export { app, auth, db, functions };

// ============================================
// Cloud Function Types
// ============================================

export interface GetCreditsResponse {
  tokenBalance: number;
  isTrialUser: boolean;
  trialEndsAt?: string;
  trialDaysRemaining?: number;
  transactions: Array<{
    id: string;
    type: string;
    tokens: number;
    description?: string;
    createdAt: string;
    balanceAfter: number;
  }>;
}

export interface CreateCheckoutRequest {
  packId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
}

export interface GeminiChatRequest {
  prompt: string;
  modelKey?: string;
  feature?: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
}

export interface GeminiChatResponse {
  text: string;
  tokensUsed: number;
  tokenBalance: number;
}

// GDPR Compliance Types
export interface ExportUserDataResponse {
  success: boolean;
  data: {
    user: Record<string, unknown> | null;
    transactions: Record<string, unknown>[];
    websites: Record<string, unknown>[];
    supportTickets: Record<string, unknown>[];
    customers: Record<string, unknown>[];
  };
  exportedAt: string;
  message: string;
}

export interface DeleteAccountRequest {
  confirmPhrase: string; // Must be "DELETE MY ACCOUNT"
}

export interface DeleteAccountResponse {
  success: boolean;
  deletedCollections: string[];
  message: string;
}

// ============================================
// Cloud Function Callables
// ============================================

// Create dummy callables that throw helpful errors when Firebase isn't configured
const createDummyCallable = <TReq, TRes>(name: string) => {
  return (() => {
    throw new Error(`Firebase not configured. Cannot call ${name}. Please set up Firebase credentials.`);
  }) as unknown as ReturnType<typeof httpsCallable<TReq, TRes>>;
};

/**
 * Get user's credit balance and recent transactions
 */
export const getCredits = functions
  ? httpsCallable<void, GetCreditsResponse>(functions, "getCredits")
  : createDummyCallable<void, GetCreditsResponse>("getCredits");

/**
 * Create a Stripe Checkout session for purchasing tokens
 */
export const createTokenCheckout = functions
  ? httpsCallable<CreateCheckoutRequest, CreateCheckoutResponse>(functions, "createTokenCheckout")
  : createDummyCallable<CreateCheckoutRequest, CreateCheckoutResponse>("createTokenCheckout");

/**
 * Call Gemini AI with automatic credit deduction
 */
export const geminiChat = functions
  ? httpsCallable<GeminiChatRequest, GeminiChatResponse>(functions, "geminiChat")
  : createDummyCallable<GeminiChatRequest, GeminiChatResponse>("geminiChat");

// ============================================
// GDPR Compliance Functions
// ============================================

/**
 * Export all user data (GDPR Right to Access / Right to Portability)
 */
export const exportUserData = functions
  ? httpsCallable<void, ExportUserDataResponse>(functions, "exportUserData")
  : createDummyCallable<void, ExportUserDataResponse>("exportUserData");

/**
 * Delete user account and all data (GDPR Right to Erasure)
 */
export const deleteUserAccount = functions
  ? httpsCallable<DeleteAccountRequest, DeleteAccountResponse>(functions, "deleteUserAccount")
  : createDummyCallable<DeleteAccountRequest, DeleteAccountResponse>("deleteUserAccount");

// ============================================
// Helper Functions
// ============================================

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId
  );
}

/**
 * Get the current Firebase project ID
 */
export function getProjectId(): string | undefined {
  return firebaseConfig.projectId;
}
