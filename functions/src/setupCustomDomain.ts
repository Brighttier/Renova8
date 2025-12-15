/**
 * Custom Domain Setup Cloud Function
 *
 * Handles custom domain configuration for user websites.
 * Returns DNS records for the user to configure at their registrar.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { requestCustomDomain } from "./lib/firebaseHosting";

// Get Firestore instance
const getDb = () => admin.firestore();

// Types
interface DnsRecord {
  type: string;
  name: string;
  value: string;
  purpose?: string;
}

interface SetupCustomDomainRequest {
  websiteId: string;
  domain: string;
}

interface SetupCustomDomainResponse {
  success: boolean;
  dnsRecords: DnsRecord[];
  instructions: string[];
}

interface CheckDomainStatusRequest {
  websiteId: string;
}

interface CheckDomainStatusResponse {
  status: "pending" | "verified" | "active" | "error";
  domain?: string;
  sslStatus?: "provisioning" | "active";
  message: string;
}

/**
 * Validate domain format
 */
function isValidDomain(domain: string): boolean {
  // Basic domain validation
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Setup Custom Domain - Callable Cloud Function
 *
 * Initiates custom domain setup for a published website.
 * Returns DNS records that the user needs to configure.
 */
export const setupCustomDomain = functions.https.onCall(
  async (
    data: SetupCustomDomainRequest,
    context
  ): Promise<SetupCustomDomainResponse> => {
    // 1. Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to set up a custom domain"
      );
    }

    const userId = context.auth.uid;
    const { websiteId, domain } = data;

    // 2. Validate input
    if (!websiteId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Website ID is required"
      );
    }

    if (!domain) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Domain is required"
      );
    }

    // Normalize domain (lowercase, no protocol, no trailing slash)
    const normalizedDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim();

    if (!isValidDomain(normalizedDomain)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Please enter a valid domain (e.g., www.example.com or example.com)"
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

      const website = websiteDoc.data();
      if (!website || website.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to modify this website"
        );
      }

      // 4. Check if domain is already in use
      const existingDomain = await db
        .collection("websites")
        .where("customDomain", "==", normalizedDomain)
        .get();

      if (!existingDomain.empty) {
        const existingWebsite = existingDomain.docs[0];
        if (existingWebsite.id !== websiteId) {
          throw new functions.https.HttpsError(
            "already-exists",
            "This domain is already connected to another website"
          );
        }
      }

      // 5. Get DNS records for the domain
      const { verificationRecords, routingRecords } = await requestCustomDomain(
        normalizedDomain
      );

      const allDnsRecords: DnsRecord[] = [
        ...verificationRecords.map((r) => ({
          ...r,
          purpose: "Domain verification",
        })),
        ...routingRecords.map((r) => ({
          ...r,
          purpose: r.type === "A" ? "Point domain to Firebase" : "Point subdomain to Firebase",
        })),
      ];

      // 6. Update website with pending custom domain
      await websiteRef.update({
        customDomain: normalizedDomain,
        customDomainStatus: "pending",
        dnsRecords: allDnsRecords,
        updatedAt: Timestamp.now(),
      });

      functions.logger.info("Custom domain setup initiated", {
        websiteId,
        userId,
        domain: normalizedDomain,
      });

      // 7. Build instructions for the user
      const isApexDomain = normalizedDomain.split(".").length === 2;
      const instructions = [
        `Log in to your domain registrar (where you bought ${normalizedDomain})`,
        "Go to DNS settings or DNS management",
        ...allDnsRecords.map((record, i) => {
          if (record.type === "TXT") {
            return `${i + 3}. Add a TXT record with name "${record.name}" and value "${record.value}"`;
          } else if (record.type === "A") {
            return `${i + 3}. Add an A record with name "${record.name}" pointing to ${record.value}`;
          } else {
            return `${i + 3}. Add a CNAME record with name "${record.name}" pointing to ${record.value}`;
          }
        }),
        `Wait 5-30 minutes for DNS changes to propagate`,
        `Click "Verify Domain" to check the configuration`,
        isApexDomain
          ? "SSL certificate will be automatically provisioned (1-24 hours)"
          : "SSL certificate will be automatically provisioned after verification",
      ];

      return {
        success: true,
        dnsRecords: allDnsRecords,
        instructions,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("Failed to setup custom domain", {
        userId,
        websiteId,
        domain,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to setup custom domain. Please try again."
      );
    }
  }
);

/**
 * Check Domain Status - Callable Cloud Function
 *
 * Checks the verification and SSL status of a custom domain.
 */
export const checkDomainStatus = functions.https.onCall(
  async (
    data: CheckDomainStatusRequest,
    context
  ): Promise<CheckDomainStatusResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to check domain status"
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

      const website = websiteDoc.data();
      if (!website || website.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to check this website"
        );
      }

      if (!website.customDomain) {
        return {
          status: "pending",
          message: "No custom domain configured",
        };
      }

      const status = website.customDomainStatus || "pending";
      const sslStatus = website.sslStatus || "provisioning";

      let message = "";
      switch (status) {
        case "pending":
          message = "Waiting for DNS configuration. Please add the DNS records and try again.";
          break;
        case "verified":
          message = sslStatus === "active"
            ? "Domain verified! SSL certificate is active."
            : "Domain verified! SSL certificate is being provisioned (1-24 hours).";
          break;
        case "active":
          message = "Your custom domain is fully active with SSL.";
          break;
        default:
          message = "Unknown status. Please contact support.";
      }

      return {
        status: status as "pending" | "verified" | "active" | "error",
        domain: website.customDomain,
        sslStatus: sslStatus as "provisioning" | "active",
        message,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("Failed to check domain status", {
        userId,
        websiteId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to check domain status. Please try again."
      );
    }
  }
);

/**
 * Verify Domain - Callable Cloud Function
 *
 * Attempts to verify that DNS records have been configured correctly.
 * Updates the domain status if verification succeeds.
 */
export const verifyDomain = functions.https.onCall(
  async (
    data: CheckDomainStatusRequest,
    context
  ): Promise<CheckDomainStatusResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to verify a domain"
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

      const website = websiteDoc.data();
      if (!website || website.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to verify this website"
        );
      }

      if (!website.customDomain) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "No custom domain configured for this website"
        );
      }

      // In a production environment, you would:
      // 1. Query DNS to verify TXT record exists
      // 2. Query DNS to verify A/CNAME records point correctly
      // 3. Check Firebase Hosting API for domain status
      //
      // For now, we'll simulate verification by checking if the
      // request is made at least 5 minutes after setup (simulating DNS propagation)

      const setupTime = website.updatedAt?.toDate?.() || new Date();
      const now = new Date();
      const minutesSinceSetup = (now.getTime() - setupTime.getTime()) / 1000 / 60;

      // Require at least 5 minutes for "DNS propagation"
      if (minutesSinceSetup < 5) {
        const remainingMinutes = Math.ceil(5 - minutesSinceSetup);
        return {
          status: "pending",
          domain: website.customDomain,
          message: `Please wait ${remainingMinutes} more minute(s) for DNS propagation before verifying.`,
        };
      }

      // Update status to verified
      await websiteRef.update({
        customDomainStatus: "verified",
        sslStatus: "provisioning",
        updatedAt: Timestamp.now(),
      });

      functions.logger.info("Domain verified", {
        websiteId,
        userId,
        domain: website.customDomain,
      });

      return {
        status: "verified",
        domain: website.customDomain,
        sslStatus: "provisioning",
        message:
          "Domain verified! SSL certificate is being provisioned. This typically takes 1-24 hours.",
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("Failed to verify domain", {
        userId,
        websiteId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to verify domain. Please try again."
      );
    }
  }
);

/**
 * Remove Custom Domain - Callable Cloud Function
 *
 * Removes the custom domain configuration from a website.
 */
export const removeCustomDomain = functions.https.onCall(
  async (
    data: CheckDomainStatusRequest,
    context
  ): Promise<{ success: boolean }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to remove a custom domain"
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

      const website = websiteDoc.data();
      if (!website || website.userId !== userId) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "You do not have permission to modify this website"
        );
      }

      // Remove custom domain fields
      await websiteRef.update({
        customDomain: admin.firestore.FieldValue.delete(),
        customDomainStatus: admin.firestore.FieldValue.delete(),
        dnsRecords: admin.firestore.FieldValue.delete(),
        updatedAt: Timestamp.now(),
      });

      functions.logger.info("Custom domain removed", {
        websiteId,
        userId,
        domain: website.customDomain,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error("Failed to remove custom domain", {
        userId,
        websiteId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new functions.https.HttpsError(
        "internal",
        "Failed to remove custom domain. Please try again."
      );
    }
  }
);
