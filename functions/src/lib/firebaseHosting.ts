/**
 * Firebase Hosting REST API Wrapper
 *
 * Provides programmatic deployment of websites to Firebase Hosting
 * using the REST API. Used for publishing user-generated websites.
 *
 * API Reference: https://firebase.google.com/docs/reference/hosting/rest
 */

import * as admin from "firebase-admin";
import { createHash } from "crypto";
import { gzipSync } from "zlib";

// Firebase project configuration
const PROJECT_ID = "claude-476618";
const DEFAULT_SITE_ID = PROJECT_ID; // Default hosting site

/**
 * Get OAuth 2.0 access token for Firebase Hosting API
 */
async function getAccessToken(): Promise<string> {
  const credential = admin.credential.applicationDefault();
  const token = await credential.getAccessToken();
  return token.access_token;
}

/**
 * Calculate SHA256 hash of gzipped content
 * Firebase Hosting requires files to be gzipped before hashing
 */
function calculateFileHash(content: string): string {
  const gzipped = gzipSync(Buffer.from(content, "utf-8"));
  return createHash("sha256").update(gzipped).digest("hex");
}

/**
 * Create a new hosting version
 */
async function createVersion(siteId: string): Promise<string> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          rewrites: [
            {
              glob: "**",
              path: "/index.html",
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create version: ${response.status} ${error}`);
  }

  const data = await response.json();
  // Version name format: sites/{site}/versions/{version}
  const versionId = data.name.split("/").pop();
  return versionId;
}

/**
 * Populate files in the version
 * Returns upload URL for files that need to be uploaded
 */
async function populateFiles(
  siteId: string,
  versionId: string,
  files: Record<string, string>
): Promise<{ uploadUrl: string; uploadRequiredHashes: string[] }> {
  const accessToken = await getAccessToken();

  // Calculate hashes for all files
  const fileHashes: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    fileHashes[path] = calculateFileHash(content);
  }

  const response = await fetch(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions/${versionId}:populateFiles`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: fileHashes }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to populate files: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    uploadUrl: data.uploadUrl || "",
    uploadRequiredHashes: data.uploadRequiredHashes || [],
  };
}

/**
 * Upload a file to the version
 */
async function uploadFile(
  uploadUrl: string,
  fileHash: string,
  content: string
): Promise<void> {
  const accessToken = await getAccessToken();
  const gzipped = gzipSync(Buffer.from(content, "utf-8"));

  const response = await fetch(`${uploadUrl}/${fileHash}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: gzipped,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file: ${response.status} ${error}`);
  }
}

/**
 * Finalize the version (mark as ready for deployment)
 */
async function finalizeVersion(
  siteId: string,
  versionId: string
): Promise<void> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions/${versionId}?updateMask=status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "FINALIZED" }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to finalize version: ${response.status} ${error}`);
  }
}

/**
 * Create a release to make the version live
 */
async function createRelease(
  siteId: string,
  versionId: string
): Promise<string> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/releases?versionName=sites/${siteId}/versions/${versionId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create release: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.name;
}

/**
 * Get the public URL for a hosted site
 */
function getSiteUrl(siteId: string): string {
  return `https://${siteId}.web.app`;
}

/**
 * Deploy HTML content to Firebase Hosting
 *
 * @param htmlContent - The HTML content to deploy
 * @param siteId - Optional site ID (defaults to project default site)
 * @returns The public URL of the deployed site
 */
export async function deployHtmlToHosting(
  htmlContent: string,
  siteId: string = DEFAULT_SITE_ID
): Promise<{ url: string; versionId: string }> {
  // Step 1: Create a new version
  const versionId = await createVersion(siteId);

  // Step 2: Populate files (register what we're uploading)
  const files = {
    "/index.html": htmlContent,
  };
  const { uploadUrl, uploadRequiredHashes } = await populateFiles(
    siteId,
    versionId,
    files
  );

  // Step 3: Upload files that need uploading
  if (uploadRequiredHashes.length > 0 && uploadUrl) {
    const fileHash = calculateFileHash(htmlContent);
    if (uploadRequiredHashes.includes(fileHash)) {
      await uploadFile(uploadUrl, fileHash, htmlContent);
    }
  }

  // Step 4: Finalize the version
  await finalizeVersion(siteId, versionId);

  // Step 5: Create a release to make it live
  await createRelease(siteId, versionId);

  return {
    url: getSiteUrl(siteId),
    versionId,
  };
}

/**
 * Deploy to a preview channel (for testing/staging)
 * Preview channels create temporary URLs that expire
 *
 * @param htmlContent - The HTML content to deploy
 * @param channelId - Unique channel identifier
 * @param ttl - Time to live (e.g., "7d" for 7 days, max "30d")
 * @returns The preview URL
 */
export async function deployToPreviewChannel(
  htmlContent: string,
  channelId: string,
  ttl: string = "7d"
): Promise<{ url: string; expireTime: string }> {
  const accessToken = await getAccessToken();
  const siteId = DEFAULT_SITE_ID;

  // Create or update the channel
  const channelResponse = await fetch(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/channels/${channelId}?updateMask=ttl`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl: `${ttl}` }),
    }
  );

  // If channel doesn't exist, create it
  if (channelResponse.status === 404) {
    await fetch(
      `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/channels?channelId=${channelId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: `${ttl}` }),
      }
    );
  }

  // Deploy content to the channel
  const versionId = await createVersion(siteId);

  const files = { "/index.html": htmlContent };
  const { uploadUrl, uploadRequiredHashes } = await populateFiles(
    siteId,
    versionId,
    files
  );

  if (uploadRequiredHashes.length > 0 && uploadUrl) {
    const fileHash = calculateFileHash(htmlContent);
    if (uploadRequiredHashes.includes(fileHash)) {
      await uploadFile(uploadUrl, fileHash, htmlContent);
    }
  }

  await finalizeVersion(siteId, versionId);

  // Release to the specific channel
  const releaseResponse = await fetch(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/channels/${channelId}/releases?versionName=sites/${siteId}/versions/${versionId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!releaseResponse.ok) {
    const error = await releaseResponse.text();
    throw new Error(
      `Failed to release to channel: ${releaseResponse.status} ${error}`
    );
  }

  // Get channel URL
  const channelUrl = `https://${siteId}--${channelId}.web.app`;

  // Calculate expiration time
  const expireTime = new Date();
  const days = parseInt(ttl.replace("d", ""));
  expireTime.setDate(expireTime.getDate() + days);

  return {
    url: channelUrl,
    expireTime: expireTime.toISOString(),
  };
}

/**
 * List custom domains for a site
 */
export async function listCustomDomains(
  siteId: string = DEFAULT_SITE_ID
): Promise<
  Array<{
    domainName: string;
    status: string;
    dnsStatus: string;
  }>
> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list domains: ${response.status} ${error}`);
  }

  const data = await response.json();
  return (data.domains || []).map(
    (domain: { domainName: string; status: string; dnsStatus?: string }) => ({
      domainName: domain.domainName,
      status: domain.status,
      dnsStatus: domain.dnsStatus || "UNKNOWN",
    })
  );
}

/**
 * Get DNS records required for custom domain setup
 */
export function getRequiredDnsRecords(domain: string): Array<{
  type: string;
  name: string;
  value: string;
  purpose: string;
}> {
  // Firebase Hosting IPs for A records
  const firebaseIps = ["199.36.158.100"];

  const isApexDomain = domain.split(".").length === 2;

  if (isApexDomain) {
    // Apex domain (e.g., example.com) needs A records
    return firebaseIps.map((ip) => ({
      type: "A",
      name: "@",
      value: ip,
      purpose: "Point domain to Firebase Hosting",
    }));
  } else {
    // Subdomain (e.g., www.example.com) needs CNAME
    return [
      {
        type: "CNAME",
        name: domain.split(".")[0], // www
        value: `${DEFAULT_SITE_ID}.web.app`,
        purpose: "Point subdomain to Firebase Hosting",
      },
    ];
  }
}

/**
 * Request custom domain setup (returns verification records)
 * Note: Full custom domain support requires Firebase Console or gcloud CLI
 */
export async function requestCustomDomain(domain: string): Promise<{
  verificationRecords: Array<{ type: string; name: string; value: string }>;
  routingRecords: Array<{ type: string; name: string; value: string }>;
}> {
  // Generate TXT record for domain verification
  const verificationToken = `firebase-hosting-verification-${Date.now()}`;

  return {
    verificationRecords: [
      {
        type: "TXT",
        name: "_firebase",
        value: verificationToken,
      },
    ],
    routingRecords: getRequiredDnsRecords(domain),
  };
}
