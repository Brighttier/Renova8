/**
 * Renova8 Firebase Cloud Functions
 *
 * This module exports all Cloud Functions for the Renova8 Stripe payment system.
 *
 * Functions:
 * - onUserCreate: Auth trigger - Initialize new users with starting tokens
 * - getCredits: Callable - Get user's credit balance and transactions
 * - createTokenCheckout: Callable - Create Stripe Checkout session
 * - stripeWebhook: HTTP - Handle Stripe webhook events
 * - geminiChat: Callable - AI chat with automatic credit deduction
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
// This must happen before importing other modules that use Firestore
admin.initializeApp();

// Export all Cloud Functions
export { onUserCreate } from "./onUserCreate";
export { getCredits } from "./getCredits";
export { createTokenCheckout } from "./createTokenCheckout";
export { stripeWebhook } from "./stripeWebhook";
export { geminiChat } from "./geminiChat";
