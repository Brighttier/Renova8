/**
 * Publish Website Cloud Function
 *
 * Deploys user-generated HTML websites to Firebase Hosting
 * and stores metadata in Firestore for management.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { deployToPreviewChannel } from "./lib/firebaseHosting";

// Get Firestore instance
const getDb = () => admin.firestore();

// Types for the function
interface PublishWebsiteRequest {
  htmlContent: string;
  siteName: string;
  leadId?: string;
}

interface PublishWebsiteResponse {
  success: boolean;
  websiteId: string;
  firebaseUrl: string;
  subdomain: string;
  expireTime?: string;
}

interface PublishedWebsite {
  id: string;
  userId: string;
  leadId?: string;
  name: string;
  subdomain: string;
  firebaseUrl: string;
  customDomain?: string;
  customDomainStatus?: "pending" | "verified" | "active";
  dnsRecords?: Array<{ type: string; name: string; value: string }>;
  htmlContent: string;
  publishedAt: Timestamp;
  updatedAt: Timestamp;
  sslStatus: "provisioning" | "active";
  versionId?: string;
  expireTime?: string;
}

/**
 * Generate a URL-safe subdomain from site name
 */
function generateSubdomain(siteName: string, uniqueId: string): string {
  // Convert to lowercase, replace spaces with hyphens, remove special chars
  const base = siteName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 20);

  // Add unique suffix
  return `${base}-${uniqueId.substring(0, 8)}`;
}

/**
 * Validate HTML content for basic safety
 */
function validateHtmlContent(html: string): { valid: boolean; error?: string } {
  // Check minimum length
  if (!html || html.length < 50) {
    return { valid: false, error: "HTML content is too short" };
  }

  // Check maximum length (2MB limit)
  if (html.length > 2 * 1024 * 1024) {
    return { valid: false, error: "HTML content exceeds 2MB limit" };
  }

  // Basic structure check
  if (!html.includes("<html") && !html.includes("<!DOCTYPE")) {
    return { valid: false, error: "HTML content must include valid HTML structure" };
  }

  return { valid: true };
}

/**
 * Publish Website - Callable Cloud Function
 *
 * Deploys HTML content to Firebase Hosting preview channel
 * and stores metadata in Firestore.
 */
export const publishWebsite = functions.https.onCall(
  async (
    data: PublishWebsiteRequest,
    context
  ): Promise<PublishWebsiteResponse> => {
    // 1. Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to publish a website"
      );
    }

    const userId = context.auth.uid;
    const { htmlContent, siteName, leadId } = data;

    // 2. Validate input
    if (!htmlContent) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "HTML content is required"
      );
    }

    if (!siteName) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Site name is required"
      );
    }

    const validation = validateHtmlContent(htmlContent);
    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.error || "Invalid HTML content"
      );
    }

    try {
      const db = getDb();
      const websiteId = db.collection("websites").doc().id;
      const subdomain = generateSubdomain(siteName, websiteId);

      // 3. Deploy to Firebase Hosting preview channel
      // Using preview channels allows multiple user sites without
      // needing separate Firebase Hosting sites
      const deployment = await deployToPreviewChannel(
        htmlContent,
        subdomain,
        "30d" // 30 day TTL - can be renewed on updates
      );

      // 4. Store website metadata in Firestore
      const now = Timestamp.now();
      const websiteData: PublishedWebsite = {
        id: websiteId,
        userId,
        leadId: leadId || undefined,
        name: siteName,
        subdomain,
        firebaseUrl: deployment.url,
        htmlContent, // Store for re-deployments
        publishedAt: now,
        updatedAt: now,
        sslStatus: "active", // Firebase auto-provisions SSL
        expireTime: deployment.expireTime,
      };

      await db.collection("websites").doc(websiteId).set(websiteData);

      // 5. Log the deployment
      functions.logger.info("Website published", {
        websiteId,
        userId,
        subdomain,
        url: deployment.url,
      });

      return {
        success: true,
        websiteId,
        firebaseUrl: deployment.url,
        subdomain,
        expireTime: deployment.expireTime,
      };
    } catch (error) {
      functions.logger.error("Failed to publish website", {
        userId,
        siteName,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to publish website. Please try again."
      );
    }
  }
);

/**
 * Update Website - Callable Cloud Function
 *
 * Updates an existing published website with new content.
 */
export const updateWebsite = functions.https.onCall(
  async (
    data: { websiteId: string; htmlContent: string },
    context
  ): Promise<PublishWebsiteResponse> => {
    // 1. Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to update a website"
      );
    }

    const userId = context.auth.uid;
    const { websiteId, htmlContent } = data;

    // 2. Validate input
    if (!websiteId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Website ID is required"
      );
    }

    const validation = validateHtmlContent(htmlContent);
    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.error || "Invalid HTML content"
      );
    }

    try {
      const db = getDb();
      const websiteRef = db.collection("websites").doc(websiteId);
      const websiteDoc = await websiteRef.get();

      // 3. Check website exists and belongs to user
      if (!websiteDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Website not found");
      }

      const website = websiteDoc.data() as PublishedWebsite;

      if (website.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to update this website"
        );
      }

      // 4. Re-deploy to Firebase Hosting
      const deployment = await deployToPreviewChannel(
        htmlContent,
        website.subdomain,
        "30d"
      );

      // 5. Update Firestore
      await websiteRef.update({
        htmlContent,
        firebaseUrl: deployment.url,
        updatedAt: Timestamp.now(),
        expireTime: deployment.expireTime,
      });

      functions.logger.info("Website updated", {
        websiteId,
        userId,
        url: deployment.url,
      });

      return {
        success: true,
        websiteId,
        firebaseUrl: deployment.url,
        subdomain: website.subdomain,
        expireTime: deployment.expireTime,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("Failed to update website", {
        userId,
        websiteId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to update website. Please try again."
      );
    }
  }
);

/**
 * Get User Websites - Callable Cloud Function
 *
 * Returns all websites owned by the authenticated user.
 */
export const getUserWebsites = functions.https.onCall(
  async (
    _data: unknown,
    context
  ): Promise<{
    websites: Array<Omit<PublishedWebsite, "htmlContent">>;
  }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to view your websites"
      );
    }

    const userId = context.auth.uid;

    try {
      const db = getDb();
      const snapshot = await db
        .collection("websites")
        .where("userId", "==", userId)
        .orderBy("publishedAt", "desc")
        .get();

      const websites = snapshot.docs.map((doc) => {
        const data = doc.data() as PublishedWebsite;
        // Exclude htmlContent from response to reduce payload
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { htmlContent, ...rest } = data;
        return rest;
      });

      return { websites };
    } catch (error) {
      functions.logger.error("Failed to get user websites", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to retrieve websites. Please try again."
      );
    }
  }
);

/**
 * Delete Website - Callable Cloud Function
 *
 * Removes a website from Firestore.
 * Note: The preview channel will expire naturally.
 */
export const deleteWebsite = functions.https.onCall(
  async (
    data: { websiteId: string },
    context
  ): Promise<{ success: boolean }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to delete a website"
      );
    }

    const userId = context.auth.uid;
    const { websiteId } = data;

    if (!websiteId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Website ID is required"
      );
    }

    try {
      const db = getDb();
      const websiteRef = db.collection("websites").doc(websiteId);
      const websiteDoc = await websiteRef.get();

      if (!websiteDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Website not found");
      }

      const website = websiteDoc.data() as PublishedWebsite;

      if (website.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to delete this website"
        );
      }

      await websiteRef.delete();

      functions.logger.info("Website deleted", { websiteId, userId });

      return { success: true };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("Failed to delete website", {
        userId,
        websiteId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to delete website. Please try again."
      );
    }
  }
);
