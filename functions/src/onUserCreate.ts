import * as functions from "firebase-functions";
import { initializeUser } from "./lib/credits";
import { INITIAL_SIGNUP_TOKENS } from "./config";

/**
 * Firebase Auth trigger: Initialize new users with starting tokens
 *
 * When a new user signs up via Firebase Auth:
 * 1. Creates their user document in Firestore
 * 2. Grants them the initial signup bonus tokens
 * 3. Creates a credit transaction record
 *
 * This ensures every user starts with some tokens to try the service.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  functions.logger.info(`New user created: ${user.uid} (${user.email})`);

  try {
    const initialBalance = await initializeUser(
      user.uid,
      user.email || "",
      user.displayName,
      INITIAL_SIGNUP_TOKENS
    );

    functions.logger.info(
      `Initialized user ${user.uid} with ${initialBalance} tokens`
    );

    return { success: true, initialBalance };
  } catch (error: any) {
    functions.logger.error(
      `Failed to initialize user ${user.uid}:`,
      error.message
    );

    // Don't throw - we don't want to block user creation
    // The user will just have 0 tokens until manually fixed
    return { success: false, error: error.message };
  }
});
