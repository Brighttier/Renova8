/**
 * Renova8 Firebase Cloud Functions
 *
 * This module exports all Cloud Functions for the Renova8 platform.
 *
 * Functions:
 * - onUserCreate: Auth trigger - Initialize new users with starting tokens
 * - getCredits: Callable - Get user's credit balance and transactions
 * - createTokenCheckout: Callable - Create Stripe Checkout session
 * - stripeWebhook: HTTP - Handle Stripe webhook events
 * - geminiChat: Callable - AI chat with automatic credit deduction
 *
 * Website Publishing Functions:
 * - publishWebsite: Callable - Deploy website to Firebase Hosting
 * - updateWebsite: Callable - Update existing published website
 * - getUserWebsites: Callable - Get all user's published websites
 * - deleteWebsite: Callable - Delete a published website
 *
 * Custom Domain Functions:
 * - setupCustomDomain: Callable - Initiate custom domain setup
 * - checkDomainStatus: Callable - Check domain verification status
 * - verifyDomain: Callable - Verify DNS configuration
 * - removeCustomDomain: Callable - Remove custom domain from website
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
// This must happen before importing other modules that use Firestore
admin.initializeApp();

// Export Core Cloud Functions
export { onUserCreate } from "./onUserCreate";
export { getCredits } from "./getCredits";
export { createTokenCheckout } from "./createTokenCheckout";
export { stripeWebhook } from "./stripeWebhook";
export { geminiChat } from "./geminiChat";

// Export Website Publishing Functions
export {
  publishWebsite,
  updateWebsite,
  getUserWebsites,
  deleteWebsite,
} from "./publishWebsite";

// Export Custom Domain Functions
export {
  setupCustomDomain,
  checkDomainStatus,
  verifyDomain,
  removeCustomDomain,
} from "./setupCustomDomain";

// Export Platform Settings Functions (Admin)
export {
  getPlatformSettings,
  addPlatformApiKey,
  removePlatformApiKey,
  updatePlatformApiKey,
  updateApiKeyRotationStrategy,
  updatePlatformRateLimits,
  updatePlatformTokenLimits,
} from "./platformSettingsFunctions";
