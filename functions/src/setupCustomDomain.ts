/**
 * Custom Domain Setup Cloud Function
 *
 * Handles custom domain configuration for user websites.
 * Returns DNS records for the user to configure at their registrar.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import * as dns from "dns";
import { promisify } from "util";
import {
  requestCustomDomain,
  addCustomDomain,
  getDomainStatus,
  removeCustomDomainFromHosting,
} from "./lib/firebaseHosting";

// DNS lookup functions
const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

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
 * Verify DNS records are configured correctly
 * Performs real DNS lookups to check if records exist
 */
async function verifyDnsRecords(
  domain: string,
  dnsRecords: DnsRecord[]
): Promise<{ verified: boolean; errors: string[]; details: string[] }> {
  const errors: string[] = [];
  const details: string[] = [];

  for (const record of dnsRecords) {
    try {
      if (record.type === "TXT") {
        // For TXT records, check the subdomain (e.g., _firebase.example.com)
        const lookupDomain =
          record.name === "@" ? domain : `${record.name}.${domain}`;
        try {
          const txtRecords = await resolveTxt(lookupDomain);
          const flatRecords = txtRecords.flat();
          const found = flatRecords.some((r) => r.includes(record.value));
          if (found) {
            details.push(`✓ TXT record found at ${lookupDomain}`);
          } else {
            errors.push(
              `TXT record at ${lookupDomain} does not contain expected value`
            );
          }
        } catch (e) {
          errors.push(`TXT record not found at ${lookupDomain}`);
        }
      } else if (record.type === "A") {
        // For A records, check the domain points to Firebase IP
        const lookupDomain = record.name === "@" ? domain : `${record.name}.${domain}`;
        try {
          const aRecords = await resolve4(lookupDomain);
          if (aRecords.includes(record.value)) {
            details.push(`✓ A record found: ${lookupDomain} → ${record.value}`);
          } else {
            errors.push(
              `A record for ${lookupDomain} points to ${aRecords.join(", ")} instead of ${record.value}`
            );
          }
        } catch (e) {
          errors.push(`A record not found for ${lookupDomain}`);
        }
      } else if (record.type === "CNAME") {
        // For CNAME records, check the subdomain points to Firebase
        const lookupDomain =
          record.name === "@" ? domain : `${record.name}.${domain}`;
        try {
          const cnameRecords = await resolveCname(lookupDomain);
          // CNAME values often have trailing dot, normalize for comparison
          const normalizedExpected = record.value.replace(/\.$/, "");
          const found = cnameRecords.some(
            (r) => r.replace(/\.$/, "") === normalizedExpected
          );
          if (found) {
            details.push(`✓ CNAME record found: ${lookupDomain} → ${record.value}`);
          } else {
            errors.push(
              `CNAME for ${lookupDomain} points to ${cnameRecords.join(", ")} instead of ${record.value}`
            );
          }
        } catch (e) {
          errors.push(`CNAME record not found for ${lookupDomain}`);
        }
      }
    } catch (e) {
      errors.push(`Failed to verify ${record.type} record: ${e}`);
    }
  }

  return {
    verified: errors.length === 0,
    errors,
    details,
  };
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

      // 4. Check if domain is already in use by another website
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

      // 5. Register domain with Firebase Hosting and get real DNS records
      // This calls the Firebase Hosting API to register the domain first,
      // which returns the actual verification records needed
      functions.logger.info("Registering domain with Firebase Hosting", {
        websiteId,
        domain: normalizedDomain,
      });

      const { verificationRecords, routingRecords, domainStatus } = await requestCustomDomain(
        normalizedDomain
      );

      functions.logger.info("Domain registration response", {
        websiteId,
        domain: normalizedDomain,
        domainStatus,
        verificationRecordCount: verificationRecords.length,
        routingRecordCount: routingRecords.length,
      });

      const allDnsRecords: DnsRecord[] = [
        ...verificationRecords.map((r) => ({
          ...r,
          purpose: "Domain verification (required by Firebase)",
        })),
        ...routingRecords.map((r) => ({
          ...r,
          purpose: r.type === "A" ? "Point domain to Firebase Hosting" : "Point subdomain to Firebase Hosting",
        })),
      ];

      // 6. Update website with pending custom domain
      // Domain is now registered with Firebase, waiting for DNS configuration
      await websiteRef.update({
        customDomain: normalizedDomain,
        customDomainStatus: domainStatus === "ALREADY_REGISTERED" ? "pending" : "pending",
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
 * Checks the real verification and SSL status from Firebase Hosting API.
 * Updates local Firestore status if Firebase Hosting reports active.
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

      let localStatus = website.customDomainStatus || "pending";
      let localSslStatus = website.sslStatus || "provisioning";

      // Always check Firebase Hosting for real status when domain is configured
      try {
        const hostingStatus = await getDomainStatus(website.customDomain);

        functions.logger.info("Firebase Hosting domain status", {
          websiteId,
          domain: website.customDomain,
          status: hostingStatus.status,
          provisioning: hostingStatus.provisioning,
        });

        // Check domain status from Firebase Hosting API
        // Status values: DOMAIN_STATUS_UNSPECIFIED, NEEDS_SETUP, SETUP_IN_PROGRESS, ACTIVE
        if (hostingStatus.status === "ACTIVE") {
          // Domain is fully active with SSL
          if (localStatus !== "active" || localSslStatus !== "active") {
            await websiteRef.update({
              customDomainStatus: "active",
              sslStatus: "active",
              updatedAt: Timestamp.now(),
            });
            localStatus = "active";
            localSslStatus = "active";

            functions.logger.info("Domain is now fully active", {
              websiteId,
              domain: website.customDomain,
            });
          }
        } else if (hostingStatus.status === "SETUP_IN_PROGRESS") {
          // Firebase is verifying DNS or provisioning SSL
          const certStatus = hostingStatus.provisioning?.certStatus;

          if (certStatus === "CERT_ACTIVE") {
            localSslStatus = "active";
          } else if (
            certStatus === "CERT_PREPARING" ||
            certStatus === "CERT_VALIDATING" ||
            certStatus === "CERT_PROPAGATING"
          ) {
            localSslStatus = "provisioning";
          }

          // Update status if DNS is verified but cert is still provisioning
          if (localStatus === "pending" && hostingStatus.provisioning?.dnsStatus === "DNS_MATCH") {
            await websiteRef.update({
              customDomainStatus: "verified",
              sslStatus: localSslStatus,
              updatedAt: Timestamp.now(),
            });
            localStatus = "verified";

            functions.logger.info("Domain DNS verified by Firebase", {
              websiteId,
              domain: website.customDomain,
              certStatus,
            });
          }
        } else if (hostingStatus.status === "NEEDS_SETUP") {
          // DNS not configured yet
          localStatus = "pending";
        }
      } catch (hostingError) {
        // If we can't reach Firebase Hosting API, use local status
        functions.logger.warn("Could not fetch Firebase Hosting status", {
          websiteId,
          domain: website.customDomain,
          error:
            hostingError instanceof Error
              ? hostingError.message
              : "Unknown error",
        });
      }

      let message = "";
      switch (localStatus) {
        case "pending":
          message =
            "Waiting for DNS configuration. Please add the DNS records and click Verify.";
          break;
        case "verified":
          message =
            localSslStatus === "active"
              ? "Domain verified! SSL certificate is active."
              : "Domain verified! SSL certificate is being provisioned (typically 15 min - 24 hours).";
          break;
        case "active":
          message = `Your custom domain is fully active! Visit https://${website.customDomain}`;
          break;
        default:
          message = "Unknown status. Please contact support.";
      }

      return {
        status: localStatus as "pending" | "verified" | "active" | "error",
        domain: website.customDomain,
        sslStatus: localSslStatus as "provisioning" | "active",
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
 * Performs real DNS verification and registers domain with Firebase Hosting.
 * Updates the domain status based on actual DNS lookup results.
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

      const dnsRecords = website.dnsRecords || [];

      // Step 1: Perform real DNS verification
      functions.logger.info("Verifying DNS records", {
        websiteId,
        domain: website.customDomain,
        recordCount: dnsRecords.length,
      });

      const { verified, errors, details } = await verifyDnsRecords(
        website.customDomain,
        dnsRecords
      );

      if (!verified) {
        functions.logger.info("DNS verification failed", {
          websiteId,
          domain: website.customDomain,
          errors,
        });

        return {
          status: "pending",
          domain: website.customDomain,
          message: `DNS records not configured correctly:\n${errors.join("\n")}\n\nPlease check your DNS settings and try again in a few minutes.`,
        };
      }

      // Step 2: Domain is already registered with Firebase Hosting (done during setup)
      // Just verify that Firebase can see the DNS records
      functions.logger.info("DNS verified, checking Firebase Hosting status", {
        websiteId,
        domain: website.customDomain,
        details,
      });

      // Get domain status from Firebase Hosting to confirm registration
      try {
        const hostingStatus = await getDomainStatus(website.customDomain);
        functions.logger.info("Firebase Hosting domain status", {
          websiteId,
          domain: website.customDomain,
          status: hostingStatus.status,
          provisioning: hostingStatus.provisioning,
        });
      } catch (hostingError) {
        // If domain not found in Firebase Hosting, try to re-register it
        const errorMessage =
          hostingError instanceof Error ? hostingError.message : "Unknown error";
        functions.logger.warn("Domain not found in Firebase Hosting, re-registering", {
          websiteId,
          domain: website.customDomain,
          error: errorMessage,
        });

        try {
          await addCustomDomain(website.customDomain);
          functions.logger.info("Domain re-registered with Firebase Hosting", {
            websiteId,
            domain: website.customDomain,
          });
        } catch (reRegisterError) {
          const reRegisterMessage =
            reRegisterError instanceof Error ? reRegisterError.message : "Unknown error";
          // If it already exists, that's fine
          if (!reRegisterMessage.includes("already exists") && !reRegisterMessage.includes("409")) {
            throw reRegisterError;
          }
        }
      }

      // Step 3: Update Firestore status
      await websiteRef.update({
        customDomainStatus: "verified",
        sslStatus: "provisioning",
        updatedAt: Timestamp.now(),
      });

      functions.logger.info("Domain verified and connected", {
        websiteId,
        userId,
        domain: website.customDomain,
      });

      return {
        status: "verified",
        domain: website.customDomain,
        sslStatus: "provisioning",
        message:
          "Domain verified and connected to Firebase Hosting! SSL certificate is being provisioned. This typically takes 15 minutes to 24 hours.",
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
 * Removes the custom domain from Firebase Hosting and Firestore.
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

      // Try to remove domain from Firebase Hosting
      if (website.customDomain && website.customDomainStatus !== "pending") {
        try {
          await removeCustomDomainFromHosting(website.customDomain);
          functions.logger.info("Domain removed from Firebase Hosting", {
            websiteId,
            domain: website.customDomain,
          });
        } catch (hostingError) {
          // Log but don't fail - domain might not exist in Firebase Hosting
          functions.logger.warn("Could not remove domain from Firebase Hosting", {
            websiteId,
            domain: website.customDomain,
            error:
              hostingError instanceof Error
                ? hostingError.message
                : "Unknown error",
          });
        }
      }

      // Remove custom domain fields from Firestore
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
