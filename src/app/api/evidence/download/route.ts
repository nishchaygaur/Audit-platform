import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/server-rbac";
import storage, { verifyDownloadToken } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const evidenceId = searchParams.get("evidenceId");
    const key = searchParams.get("key");
    const token = searchParams.get("token");
    const expiresStr = searchParams.get("expires");

    if (!workspaceId || !evidenceId) {
      return NextResponse.json(
        { error: "Workspace ID and Evidence ID are required" },
        { status: 400 }
      );
    }

    let isAuthorized = false;

    // Check Method A: Signed HMAC token authorization
    if (token && expiresStr && key) {
      const expires = parseInt(expiresStr, 10);
      if (!isNaN(expires) && verifyDownloadToken(token, key, workspaceId, evidenceId, expires)) {
        isAuthorized = true;
      }
    }

    // Check Method B: Authenticated User Session with RBAC
    if (!isAuthorized) {
      const session = await getSession();
      if (session && session.user) {
        try {
          await requirePermission("evidence.view", workspaceId);
          isAuthorized = true;
        } catch {
          isAuthorized = false;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid session or expired download token" },
        { status: 403 }
      );
    }

    // Strict multi-tenant verification: Evidence MUST belong to this workspace
    const record = await db.queryOne<{
      id: string;
      name: string;
      storage_key: string;
      mime_type: string;
      size: string;
      workspace_id: string;
    }>(
      `
      SELECT e.id, e.name, e.storage_key, e.mime_type, e.size, a.workspace_id
      FROM evidence e
      JOIN audits a ON e.audit_id = a.id
      WHERE e.id = $1 AND a.workspace_id = $2
      `,
      [evidenceId, workspaceId]
    );

    if (!record) {
      return NextResponse.json(
        { error: "Evidence not found or cross-tenant access prohibited" },
        { status: 404 }
      );
    }

    const storageKey = record.storage_key || key;
    if (!storageKey) {
      return NextResponse.json(
        { error: "Evidence binary file not found in storage" },
        { status: 404 }
      );
    }

    // Retrieve the actual persistent binary bytes
    const { body, contentType, contentLength } = await storage.getObject(storageKey);

    const safeFilename = record.name.replace(/["\r\n]/g, "_");

    return new Response(body as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": record.mime_type || contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeFilename)}"`,
        "Content-Length": contentLength.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve evidence file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
