import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import path from "path";
import crypto from "crypto";

export interface StoragePutOptions {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageGetResult {
  body: Buffer;
  contentType: string;
  contentLength: number;
}

export interface SignedDownloadOptions {
  key: string;
  filename: string;
  workspaceId: string;
  evidenceId: string;
  expiresInSeconds?: number;
}

export const EVIDENCE_BUCKET = "evidence";

const JWT_SECRET = process.env.JWT_SECRET || "development-audit-platform-secret-key-32-chars-min";

let adminStorageClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client for server-side Storage operations.
 * Prioritizes the server-side SUPABASE_SERVICE_ROLE_KEY for administrative operations
 * behind authoritative application-level RBAC, and falls back to the authenticated
 * SSR server client.
 */
export async function getStorageClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    if (!adminStorageClient) {
      adminStorageClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    return adminStorageClient;
  }

  // Fallback: use authenticated server client with session cookies
  return (await createServerClient()) as unknown as SupabaseClient;
}

/**
 * Normalizes a storage key into bucket name and relative object path.
 * Handles keys whether prefixed with 'evidence/' or not.
 */
export function getBucketAndPath(storageKey: string): { bucket: string; path: string } {
  let cleanKey = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (cleanKey.startsWith(`${EVIDENCE_BUCKET}/`)) {
    cleanKey = cleanKey.slice(`${EVIDENCE_BUCKET}/`.length);
  }
  return {
    bucket: EVIDENCE_BUCKET,
    path: cleanKey,
  };
}

/**
 * Generate a cryptographically unguessable, collision-safe object key scoped to workspace and audit.
 * Enforces strict sanitization to prevent path traversal attacks.
 * Structure: evidence/{workspaceId}/{auditId}/{uniqueId}-{sanitizedFileName}
 */
export function generateStorageKey(workspaceId: string, auditId: string, filename: string): string {
  // Prevent directory traversal: isolate base file name only
  const baseName = path.basename(filename.replace(/\\/g, "/"));
  // Sanitize characters: allow alphanumeric, dot, underscore, dash
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "");
  const safeFileName = sanitized || "evidence_file";
  const uniqueId = crypto.randomUUID();
  const safeWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeAudit = auditId.replace(/[^a-zA-Z0-9_-]/g, "_");

  return `evidence/${safeWorkspace}/${safeAudit}/${uniqueId}-${safeFileName}`;
}

/**
 * Generate an HMAC-SHA256 signature for time-limited download authorization
 */
export function generateDownloadToken(key: string, workspaceId: string, evidenceId: string, expires: number): string {
  const payload = `${key}:${workspaceId}:${evidenceId}:${expires}`;
  return crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
}

/**
 * Verify an HMAC-SHA256 download signature
 */
export function verifyDownloadToken(
  token: string,
  key: string,
  workspaceId: string,
  evidenceId: string,
  expires: number
): boolean {
  if (Date.now() > expires) {
    return false;
  }
  const expected = generateDownloadToken(key, workspaceId, evidenceId, expires);
  try {
    return crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/**
 * Stores binary file content in persistent Supabase Storage.
 */
export async function putObject(options: StoragePutOptions): Promise<void> {
  const { key, body, contentType } = options;
  const { bucket, path: objectPath } = getBucketAndPath(key);
  const client = await getStorageClient();

  const { error } = await client.storage
    .from(bucket)
    .upload(objectPath, body, {
      contentType: contentType || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("[Storage] Failed to upload object to Supabase Storage:", error.message);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }
}

/**
 * Retrieves binary file content from persistent Supabase Storage.
 */
export async function getObject(key: string): Promise<StorageGetResult> {
  const { bucket, path: objectPath } = getBucketAndPath(key);
  const client = await getStorageClient();

  const { data, error } = await client.storage
    .from(bucket)
    .download(objectPath);

  if (error || !data) {
    console.error("[Storage] Failed to download object from Supabase Storage:", error?.message);
    throw new Error(`Object not found in Supabase Storage: ${key} (${error?.message || "Not found"})`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  return {
    body,
    contentType: data.type || "application/octet-stream",
    contentLength: body.length,
  };
}

/**
 * Deletes an object from persistent Supabase Storage.
 */
export async function deleteObject(key: string): Promise<void> {
  if (!key) return;
  const { bucket, path: objectPath } = getBucketAndPath(key);
  const client = await getStorageClient();

  const { error } = await client.storage
    .from(bucket)
    .remove([objectPath]);

  if (error) {
    console.warn("[Storage] Warning deleting object from Supabase Storage:", error.message);
  }
}

/**
 * Generates an authenticated, short-lived signed download URL via Supabase Storage.
 * Enforces 15-minute expiration (900 seconds) by default.
 */
export async function getSignedDownloadUrl(options: SignedDownloadOptions): Promise<string> {
  const { key, filename, expiresInSeconds = 900 } = options;
  const { bucket, path: objectPath } = getBucketAndPath(key);
  const client = await getStorageClient();

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds, {
      download: filename,
    });

  if (error || !data?.signedUrl) {
    console.error("[Storage] Failed to create signed URL from Supabase Storage:", error?.message);
    throw new Error(`Failed to generate signed download URL: ${error?.message || "Unknown error"}`);
  }

  return data.signedUrl;
}

export function isS3Configured(): boolean {
  return false;
}

export const storage = {
  isS3Configured,
  generateStorageKey,
  generateDownloadToken,
  verifyDownloadToken,
  putObject,
  getObject,
  deleteObject,
  getSignedDownloadUrl,
};

export default storage;
