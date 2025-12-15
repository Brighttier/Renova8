/**
 * Website Publishing Service
 *
 * Frontend service for publishing websites to Firebase Hosting
 * and managing custom domains.
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import {
  PublishWebsiteResult,
  SetupDomainResult,
  DomainStatusResult,
  PublishedWebsite,
} from "../types";

// ============================================
// Type Definitions
// ============================================

interface PublishWebsiteRequest {
  htmlContent: string;
  siteName: string;
  leadId?: string;
}

interface UpdateWebsiteRequest {
  websiteId: string;
  htmlContent: string;
}

interface SetupDomainRequest {
  websiteId: string;
  domain: string;
}

interface WebsiteIdRequest {
  websiteId: string;
}

interface GetUserWebsitesResponse {
  websites: Omit<PublishedWebsite, "htmlContent">[];
}

// ============================================
// Cloud Function Callables
// ============================================

// Create dummy callable for when Firebase isn't configured
const createDummyCallable = <TReq, TRes>(name: string) => {
  return (() => {
    throw new Error(
      `Firebase not configured. Cannot call ${name}. Please set up Firebase credentials.`
    );
  }) as unknown as ReturnType<typeof httpsCallable<TReq, TRes>>;
};

// Website publishing functions
const publishWebsiteCallable = functions
  ? httpsCallable<PublishWebsiteRequest, PublishWebsiteResult>(
      functions,
      "publishWebsite"
    )
  : createDummyCallable<PublishWebsiteRequest, PublishWebsiteResult>(
      "publishWebsite"
    );

const updateWebsiteCallable = functions
  ? httpsCallable<UpdateWebsiteRequest, PublishWebsiteResult>(
      functions,
      "updateWebsite"
    )
  : createDummyCallable<UpdateWebsiteRequest, PublishWebsiteResult>(
      "updateWebsite"
    );

const getUserWebsitesCallable = functions
  ? httpsCallable<void, GetUserWebsitesResponse>(functions, "getUserWebsites")
  : createDummyCallable<void, GetUserWebsitesResponse>("getUserWebsites");

const deleteWebsiteCallable = functions
  ? httpsCallable<WebsiteIdRequest, { success: boolean }>(
      functions,
      "deleteWebsite"
    )
  : createDummyCallable<WebsiteIdRequest, { success: boolean }>("deleteWebsite");

// Custom domain functions
const setupCustomDomainCallable = functions
  ? httpsCallable<SetupDomainRequest, SetupDomainResult>(
      functions,
      "setupCustomDomain"
    )
  : createDummyCallable<SetupDomainRequest, SetupDomainResult>(
      "setupCustomDomain"
    );

const checkDomainStatusCallable = functions
  ? httpsCallable<WebsiteIdRequest, DomainStatusResult>(
      functions,
      "checkDomainStatus"
    )
  : createDummyCallable<WebsiteIdRequest, DomainStatusResult>(
      "checkDomainStatus"
    );

const verifyDomainCallable = functions
  ? httpsCallable<WebsiteIdRequest, DomainStatusResult>(
      functions,
      "verifyDomain"
    )
  : createDummyCallable<WebsiteIdRequest, DomainStatusResult>("verifyDomain");

const removeCustomDomainCallable = functions
  ? httpsCallable<WebsiteIdRequest, { success: boolean }>(
      functions,
      "removeCustomDomain"
    )
  : createDummyCallable<WebsiteIdRequest, { success: boolean }>(
      "removeCustomDomain"
    );

// ============================================
// Publishing Functions
// ============================================

/**
 * Publish a website to Firebase Hosting
 *
 * @param htmlContent - The HTML content to publish
 * @param siteName - The name of the website
 * @param leadId - Optional lead ID to associate with the website
 * @returns PublishWebsiteResult with the published URL
 */
export async function publishWebsite(
  htmlContent: string,
  siteName: string,
  leadId?: string
): Promise<PublishWebsiteResult> {
  try {
    const result = await publishWebsiteCallable({
      htmlContent,
      siteName,
      leadId,
    });
    return result.data;
  } catch (error: unknown) {
    console.error("Error publishing website:", error);

    // Handle specific error types
    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      switch (firebaseError.code) {
        case "functions/unauthenticated":
          throw new Error("Please log in to publish your website");
        case "functions/invalid-argument":
          throw new Error(firebaseError.message || "Invalid website content");
        case "functions/resource-exhausted":
          throw new Error(
            "Publishing limit reached. Please try again later."
          );
        default:
          throw new Error(
            firebaseError.message || "Failed to publish website"
          );
      }
    }

    throw new Error("Failed to publish website. Please try again.");
  }
}

/**
 * Update an existing published website
 *
 * @param websiteId - The ID of the website to update
 * @param htmlContent - The new HTML content
 * @returns PublishWebsiteResult with the updated URL
 */
export async function updateWebsite(
  websiteId: string,
  htmlContent: string
): Promise<PublishWebsiteResult> {
  try {
    const result = await updateWebsiteCallable({ websiteId, htmlContent });
    return result.data;
  } catch (error: unknown) {
    console.error("Error updating website:", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === "functions/not-found") {
        throw new Error("Website not found");
      }
      if (firebaseError.code === "functions/permission-denied") {
        throw new Error("You do not have permission to update this website");
      }
      throw new Error(firebaseError.message || "Failed to update website");
    }

    throw new Error("Failed to update website. Please try again.");
  }
}

/**
 * Get all websites published by the current user
 *
 * @returns Array of published websites (without HTML content)
 */
export async function getUserWebsites(): Promise<
  Omit<PublishedWebsite, "htmlContent">[]
> {
  try {
    const result = await getUserWebsitesCallable();
    return result.data.websites;
  } catch (error: unknown) {
    console.error("Error fetching websites:", error);
    throw new Error("Failed to fetch your websites. Please try again.");
  }
}

/**
 * Delete a published website
 *
 * @param websiteId - The ID of the website to delete
 */
export async function deleteWebsite(websiteId: string): Promise<void> {
  try {
    await deleteWebsiteCallable({ websiteId });
  } catch (error: unknown) {
    console.error("Error deleting website:", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === "functions/not-found") {
        throw new Error("Website not found");
      }
      if (firebaseError.code === "functions/permission-denied") {
        throw new Error("You do not have permission to delete this website");
      }
      throw new Error(firebaseError.message || "Failed to delete website");
    }

    throw new Error("Failed to delete website. Please try again.");
  }
}

// ============================================
// Custom Domain Functions
// ============================================

/**
 * Set up a custom domain for a website
 *
 * @param websiteId - The ID of the website
 * @param domain - The custom domain to set up (e.g., www.example.com)
 * @returns DNS records and instructions for configuration
 */
export async function setupCustomDomain(
  websiteId: string,
  domain: string
): Promise<SetupDomainResult> {
  try {
    const result = await setupCustomDomainCallable({ websiteId, domain });
    return result.data;
  } catch (error: unknown) {
    console.error("Error setting up custom domain:", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === "functions/already-exists") {
        throw new Error("This domain is already connected to another website");
      }
      if (firebaseError.code === "functions/invalid-argument") {
        throw new Error(
          firebaseError.message || "Please enter a valid domain"
        );
      }
      throw new Error(
        firebaseError.message || "Failed to set up custom domain"
      );
    }

    throw new Error("Failed to set up custom domain. Please try again.");
  }
}

/**
 * Check the verification status of a custom domain
 *
 * @param websiteId - The ID of the website
 * @returns Current domain status
 */
export async function checkDomainStatus(
  websiteId: string
): Promise<DomainStatusResult> {
  try {
    const result = await checkDomainStatusCallable({ websiteId });
    return result.data;
  } catch (error: unknown) {
    console.error("Error checking domain status:", error);
    throw new Error("Failed to check domain status. Please try again.");
  }
}

/**
 * Verify that DNS records have been configured correctly
 *
 * @param websiteId - The ID of the website
 * @returns Verification result
 */
export async function verifyDomain(
  websiteId: string
): Promise<DomainStatusResult> {
  try {
    const result = await verifyDomainCallable({ websiteId });
    return result.data;
  } catch (error: unknown) {
    console.error("Error verifying domain:", error);

    if (error && typeof error === "object" && "code" in error) {
      const firebaseError = error as { code: string; message: string };
      if (firebaseError.code === "functions/failed-precondition") {
        throw new Error("No custom domain configured for this website");
      }
      throw new Error(firebaseError.message || "Failed to verify domain");
    }

    throw new Error("Failed to verify domain. Please try again.");
  }
}

/**
 * Remove a custom domain from a website
 *
 * @param websiteId - The ID of the website
 */
export async function removeCustomDomain(websiteId: string): Promise<void> {
  try {
    await removeCustomDomainCallable({ websiteId });
  } catch (error: unknown) {
    console.error("Error removing custom domain:", error);
    throw new Error("Failed to remove custom domain. Please try again.");
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if website publishing is available
 * (Firebase must be configured and user must be authenticated)
 */
export function isPublishingAvailable(): boolean {
  return functions !== null;
}

/**
 * Format a Firebase Hosting URL for display
 */
export function formatHostingUrl(url: string): string {
  // Remove https:// prefix for cleaner display
  return url.replace(/^https?:\/\//, "");
}

/**
 * Get the primary URL for a published website
 * (custom domain if verified, otherwise Firebase URL)
 */
export function getPrimaryUrl(website: Partial<PublishedWebsite>): string {
  if (
    website.customDomain &&
    (website.customDomainStatus === "verified" ||
      website.customDomainStatus === "active")
  ) {
    return `https://${website.customDomain}`;
  }
  return website.firebaseUrl || "";
}
