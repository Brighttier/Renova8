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
const isConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
);

if (isConfigured) {
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
  console.warn("⚠️ Firebase is not configured. Auth features will be disabled.");
  console.warn("   Add Firebase config to your .env file to enable authentication.");
}

// ============================================
// Connect to Emulators in Development
// ============================================

const USE_EMULATORS = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true";

if (USE_EMULATORS && isConfigured && auth && db && functions) {
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

// ============================================
// Cloud Function Callables
// ============================================

/**
 * Get user's credit balance and recent transactions
 */
export const getCredits = httpsCallable<void, GetCreditsResponse>(
  functions,
  "getCredits"
);

/**
 * Create a Stripe Checkout session for purchasing tokens
 */
export const createTokenCheckout = httpsCallable<
  CreateCheckoutRequest,
  CreateCheckoutResponse
>(functions, "createTokenCheckout");

/**
 * Call Gemini AI with automatic credit deduction
 */
export const geminiChat = httpsCallable<GeminiChatRequest, GeminiChatResponse>(
  functions,
  "geminiChat"
);

// ============================================
// Helper Functions
// ============================================

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain
  );
}

/**
 * Get the current Firebase project ID
 */
export function getProjectId(): string | undefined {
  return firebaseConfig.projectId;
}
