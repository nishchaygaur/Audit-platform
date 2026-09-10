import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import fsp from "fs/promises";
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

// Environment variables configuration (consistent across application)
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const JWT_SECRET = process.env.JWT_SECRET || "development-audit-platform-secret-key-32-chars-min";

// Local storage directory fallback when S3 credentials are not configured
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), ".storage", "evidence");

export function isS3Configured(): boolean {
  return Boolean(S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);
}

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID || "",
        secretAccessKey: S3_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: Boolean(S3_ENDPOINT), // Required for MinIO / LocalStack / Cloudflare R2
    });
  }
  return s3ClientInstance;
}

/**
 * Ensures the local storage directory exists
 */
async function ensureLocalStorageDir(subdir = ""): Promise<string> {
  const targetDir = path.join(LOCAL_STORAGE_DIR, subdir);
  if (!fs.existsSync(targetDir)) {
    await fsp.mkdir(targetDir, { recursive: true });
  }
  return targetDir;
}

/**
 * Generate a cryptographically unguessable object key scoped to tenant and audit
 */
export function generateStorageKey(workspaceId: string, auditId: string, filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const randomBytes = crypto.randomUUID();
  return `workspaces/${workspaceId}/audits/${auditId}/${randomBytes}-${sanitized}`;
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
 * Stores binary file content in persistent object storage
 */
export async function putObject(options: StoragePutOptions): Promise<void> {
  const { key, body, contentType } = options;

  if (isS3Configured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: options.metadata,
      })
    );
  } else {
    // Local persistent disk storage fallback
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    await ensureLocalStorageDir(path.dirname(key));
    await fsp.writeFile(filePath, body);

    // Save contentType metadata
    const metaPath = `${filePath}.meta.json`;
    await fsp.writeFile(
      metaPath,
      JSON.stringify({
        contentType,
        size: body.length,
        createdAt: new Date().toISOString(),
      }),
      "utf8"
    );
  }
}

/**
 * Retrieves binary file content from persistent object storage
 */
export async function getObject(key: string): Promise<StorageGetResult> {
  if (isS3Configured()) {
    const client = getS3Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error(`Object not found in S3 storage: ${key}`);
    }

    const byteArray = await response.Body.transformToByteArray();
    return {
      body: Buffer.from(byteArray),
      contentType: response.ContentType || "application/octet-stream",
      contentLength: response.ContentLength || byteArray.length,
    };
  } else {
    // Local persistent disk storage fallback
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Object not found in local persistent storage: ${key}`);
    }

    const body = await fsp.readFile(filePath);
    let contentType = "application/octet-stream";

    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await fsp.readFile(metaPath, "utf8"));
        if (meta.contentType) {
          contentType = meta.contentType;
        }
      } catch {
        // use default
      }
    }

    return {
      body,
      contentType,
      contentLength: body.length,
    };
  }
}

/**
 * Deletes an object from persistent storage
 */
export async function deleteObject(key: string): Promise<void> {
  if (!key) return;

  if (isS3Configured()) {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    if (fs.existsSync(filePath)) {
      await fsp.unlink(filePath).catch(() => {});
    }
    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      await fsp.unlink(metaPath).catch(() => {});
    }
  }
}

/**
 * Generates an authenticated, short-lived signed download URL
 * Enforces 15-minute expiration (900 seconds)
 */
export async function getSignedDownloadUrl(options: SignedDownloadOptions): Promise<string> {
  const { key, filename, workspaceId, evidenceId, expiresInSeconds = 900 } = options;

  if (isS3Configured()) {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } else {
    // Generate secure HMAC-signed application endpoint
    const expires = Date.now() + expiresInSeconds * 1000;
    const token = generateDownloadToken(key, workspaceId, evidenceId, expires);

    const queryParams = new URLSearchParams({
      key,
      workspaceId,
      evidenceId,
      expires: expires.toString(),
      token,
      filename,
    });

    return `/api/evidence/download?${queryParams.toString()}`;
  }
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
