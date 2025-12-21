import * as functions from "firebase-functions";
import { initializeUser } from "./lib/credits";
import { INITIAL_SIGNUP_CREDITS } from "./config";

/**
 * Firebase Auth trigger: Initialize new users with starting credits
 *
 * When a new user signs up via Firebase Auth:
 * 1. Creates their user document in Firestore
 * 2. Grants them the initial free trial credits (100 credits = $2 value)
 * 3. Sets trial expiration (14 days)
 * 4. Creates a credit transaction record
 *
 * This ensures every user starts with some credits to try the service.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  functions.logger.info(`New user created: ${user.uid} (${user.email})`);

  try {
    const initialBalance = await initializeUser(
      user.uid,
      user.email || "",
      user.displayName,
      INITIAL_SIGNUP_CREDITS
    );

    functions.logger.info(
      `Initialized user ${user.uid} with ${initialBalance} credits (free trial)`
    );

    return { success: true, initialBalance };
  } catch (error: any) {
    functions.logger.error(
      `Failed to initialize user ${user.uid}:`,
      error.message
    );

    // Don't throw - we don't want to block user creation
    // The user will just have 0 credits until manually fixed
    return { success: false, error: error.message };
  }
});
