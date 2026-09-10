"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";
import path from "path";
import storage from "@/lib/storage";

export type EvidenceStatus =
  | "Requested"
  | "Submitted"
  | "Under Review"
  | "Accepted"
  | "Rejected";

const VALID_EVIDENCE_STATUSES: readonly EvidenceStatus[] = [
  "Requested",
  "Submitted",
  "Under Review",
  "Accepted",
  "Rejected",
] as const;

export type CreateEvidenceInput = {
  auditId?: string;
  name: string;
  reference?: string;
  type?: string;
  size?: string;
  control?: string;
  framework?: string;
  uploadedBy?: string;
  date?: string;
  status?: EvidenceStatus;
  description?: string;
  reviewedBy?: string;
  storageKey?: string;
  mimeType?: string;
};

export type UpdateEvidenceInput = {
  name?: string;
  reference?: string;
  type?: string;
  size?: string;
  control?: string;
  framework?: string;
  uploadedBy?: string;
  date?: string;
  status?: EvidenceStatus;
  description?: string;
  reviewedBy?: string;
  storageKey?: string;
  mimeType?: string;
};

export type EvidenceRecord = {
  id: string;
  workspace_id: string;
  audit_id: string;
  reference: string;
  name: string;
  type: string;
  control: string;
  uploaded_by: string;
  date: string;
  status: EvidenceStatus;
  description: string;
  size: string;
  framework: string;
  reviewed_by: string;
  storage_key?: string;
  mime_type?: string;
  created_at: string;
  updated_at?: string;
  audit_name?: string;
};

export async function getEvidences(workspaceId: string, auditId?: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("evidence.view", workspaceId);

    if (auditId) {
      const audit = await db.queryOne<{ id: string }>(
        `SELECT id FROM audits WHERE id = $1 AND workspace_id = $2`,
        [auditId, workspaceId]
      );

      if (!audit) {
        return { success: false, error: "Audit not found in this workspace" };
      }

      const rows = await db.query<EvidenceRecord>(
        `
          SELECT e.*, a.name as audit_name
          FROM evidence e
          JOIN audits a ON e.audit_id = a.id
          WHERE a.workspace_id = $1 AND e.audit_id = $2
          ORDER BY e.created_at DESC
        `,
        [workspaceId, auditId]
      );

      return { success: true, data: rows };
    }

    const rows = await db.query<EvidenceRecord>(
      `
        SELECT e.*, a.name as audit_name
        FROM evidence e
        JOIN audits a ON e.audit_id = a.id
        WHERE a.workspace_id = $1
        ORDER BY e.created_at DESC
      `,
      [workspaceId]
    );

    return { success: true, data: rows };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch evidence";
    return { success: false, error: message };
  }
}

export async function getEvidence(
  workspaceId: string,
  param2: string,
  param3?: string
) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  const auditId = param3 ? param2 : undefined;
  const evidenceId = param3 ? param3 : param2;

  if (!evidenceId) {
    return { success: false, error: "Evidence ID is required" };
  }

  try {
    await requirePermission("evidence.view", workspaceId);

    let row;
    if (auditId) {
      const audit = await db.queryOne<{ id: string }>(
        `SELECT id FROM audits WHERE id = $1 AND workspace_id = $2`,
        [auditId, workspaceId]
      );

      if (!audit) {
        return { success: false, error: "Audit not found in this workspace" };
      }

      row = await db.queryOne<EvidenceRecord>(
        `
          SELECT e.*, a.name as audit_name
          FROM evidence e
          JOIN audits a ON e.audit_id = a.id
          WHERE e.id = $1 AND e.audit_id = $2 AND a.workspace_id = $3
        `,
        [evidenceId, auditId, workspaceId]
      );
    } else {
      row = await db.queryOne<EvidenceRecord>(
        `
          SELECT e.*, a.name as audit_name
          FROM evidence e
          JOIN audits a ON e.audit_id = a.id
          WHERE e.id = $1 AND a.workspace_id = $2
        `,
        [evidenceId, workspaceId]
      );
    }

    if (!row) {
      return { success: false, error: "Evidence not found in this workspace" };
    }

    return { success: true, data: row };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch evidence";
    return { success: false, error: message };
  }
}

export async function createEvidence(
  workspaceId: string,
  param2: string | CreateEvidenceInput,
  param3?: CreateEvidenceInput
) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  const auditId = typeof param2 === "string" ? param2 : param2.auditId;
  const data: CreateEvidenceInput = typeof param2 === "string" ? (param3 || ({} as CreateEvidenceInput)) : param2;

  if (!auditId) {
    return { success: false, error: "Audit ID is required" };
  }

  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Evidence name is required" };
  }

  try {
    const auth = await requirePermission("evidence.create", workspaceId);

    // Verify audit belongs to this workspace
    const audit = await db.queryOne<{ id: string; framework: string; lead: string }>(
      `SELECT id, framework, lead FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!audit) {
      return { success: false, error: "Audit not found in this workspace" };
    }

    // Status validation
    let status: EvidenceStatus = "Requested";
    if (data.status) {
      if (!VALID_EVIDENCE_STATUSES.includes(data.status)) {
        return {
          success: false,
          error: `Invalid evidence status. Must be one of: ${VALID_EVIDENCE_STATUSES.join(", ")}`,
        };
      }
      status = data.status;
    }

    const id = `EVD-${new Date().getFullYear()}-${crypto
      .randomUUID()
      .slice(0, 5)
      .toUpperCase()}`;

    const reference = data.reference || `EV-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const name = data.name.trim();
    const type = data.type || "PDF";
    const control = data.control || "General";
    const uploadedBy = data.uploadedBy || auth.user.name || "Auditor";
    const date = data.date || new Date().toISOString().split("T")[0];
    const description = data.description || "";
    const size = data.size || "1.2 MB";
    const framework = data.framework || audit.framework || "ISO 27001";
    const reviewedBy = data.reviewedBy || "—";
    const storageKey = data.storageKey || "";
    const mimeType = data.mimeType || "application/octet-stream";

    await db.execute(
      `
      INSERT INTO evidence (
        id, workspace_id, audit_id, reference, name, type, control,
        uploaded_by, date, status, description, size, framework, reviewed_by,
        storage_key, mime_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        id,
        workspaceId,
        auditId,
        reference,
        name,
        type,
        control,
        uploadedBy,
        date,
        status,
        description,
        size,
        framework,
        reviewedBy,
        storageKey,
        mimeType,
      ]
    );

    // Keep audit evidence metric in sync
    await db.execute(
      `
      UPDATE audits
      SET evidence = (SELECT COUNT(*) FROM evidence WHERE audit_id = $1)
      WHERE id = $2
      `,
      [auditId, auditId]
    );

    const record: EvidenceRecord = {
      id,
      workspace_id: workspaceId,
      audit_id: auditId,
      reference,
      name,
      type,
      control,
      uploaded_by: uploadedBy,
      date,
      status,
      description,
      size,
      framework,
      reviewed_by: reviewedBy,
      storage_key: storageKey,
      mime_type: mimeType,
      created_at: new Date().toISOString(),
    };

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Evidence",
      entityId: id,
      description: `Uploaded evidence "${name}" (${reference})`,
      details: { control, framework, status, uploadedBy, storageKey },
    });

    return { success: true, data: record };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create evidence";
    return { success: false, error: message };
  }
}

export async function updateEvidence(
  workspaceId: string,
  param2: string,
  param3: string | UpdateEvidenceInput,
  param4?: UpdateEvidenceInput
) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  const auditId = typeof param3 === "string" ? param2 : undefined;
  const evidenceId = typeof param3 === "string" ? param3 : param2;
  const updates: UpdateEvidenceInput = typeof param3 === "string" ? (param4 || {}) : param3;

  if (!evidenceId) {
    return { success: false, error: "Evidence ID is required" };
  }

  try {
    await requirePermission("evidence.update", workspaceId);

    // Validate existence and tenant chain
    let existing;
    if (auditId) {
      existing = await db.queryOne<{ id: string; name: string; reference: string; status: string; audit_id: string; workspace_id: string }>(
        `
          SELECT e.id, e.name, e.reference, e.status, e.audit_id, e.workspace_id
          FROM evidence e
          JOIN audits a ON e.audit_id = a.id
          WHERE e.id = $1 AND e.audit_id = $2 AND a.workspace_id = $3
        `,
        [evidenceId, auditId, workspaceId]
      );
    } else {
      existing = await db.queryOne<{ id: string; name: string; reference: string; status: string; audit_id: string; workspace_id: string }>(
        `
          SELECT e.id, e.name, e.reference, e.status, e.audit_id, e.workspace_id
          FROM evidence e
          JOIN audits a ON e.audit_id = a.id
          WHERE e.id = $1 AND a.workspace_id = $2
        `,
        [evidenceId, workspaceId]
      );
    }

    if (!existing) {
      return { success: false, error: "Evidence not found in this workspace" };
    }

    const setParts: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      values.push(updates.name.trim());
      setParts.push(`name = $${values.length}`);
    }
    if (updates.reference !== undefined) {
      values.push(updates.reference);
      setParts.push(`reference = $${values.length}`);
    }
    if (updates.type !== undefined) {
      values.push(updates.type);
      setParts.push(`type = $${values.length}`);
    }
    if (updates.size !== undefined) {
      values.push(updates.size);
      setParts.push(`size = $${values.length}`);
    }
    if (updates.control !== undefined) {
      values.push(updates.control);
      setParts.push(`control = $${values.length}`);
    }
    if (updates.framework !== undefined) {
      values.push(updates.framework);
      setParts.push(`framework = $${values.length}`);
    }
    if (updates.uploadedBy !== undefined) {
      values.push(updates.uploadedBy);
      setParts.push(`uploaded_by = $${values.length}`);
    }
    if (updates.date !== undefined) {
      values.push(updates.date);
      setParts.push(`date = $${values.length}`);
    }
    if (updates.status !== undefined) {
      if (!VALID_EVIDENCE_STATUSES.includes(updates.status)) {
        return {
          success: false,
          error: `Invalid evidence status. Must be one of: ${VALID_EVIDENCE_STATUSES.join(", ")}`,
        };
      }
      values.push(updates.status);
      setParts.push(`status = $${values.length}`);
    }
    if (updates.description !== undefined) {
      values.push(updates.description);
      setParts.push(`description = $${values.length}`);
    }
    if (updates.reviewedBy !== undefined) {
      values.push(updates.reviewedBy);
      setParts.push(`reviewed_by = $${values.length}`);
    }

    if (setParts.length === 0) {
      return { success: true };
    }

    values.push(evidenceId);
    const evidenceIdIdx = values.length;
    values.push(existing.audit_id);
    const auditIdIdx = values.length;
    values.push(workspaceId);
    const workspaceIdIdx = values.length;

    await db.execute(
      `
      UPDATE evidence
      SET ${setParts.join(", ")}
      WHERE id = $${evidenceIdIdx} AND audit_id = $${auditIdIdx} AND workspace_id = $${workspaceIdIdx}
      `,
      values
    );

    let desc = `Updated evidence "${existing.name}" (${existing.reference})`;
    if (updates.status && updates.status !== existing.status) {
      desc = `Changed evidence "${existing.name}" status from ${existing.status} to ${updates.status}`;
    }

    await logAuditEvent({
      workspaceId,
      action: updates.status && updates.status !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "Evidence",
      entityId: evidenceId,
      description: desc,
      details: updates,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update evidence";
    return { success: false, error: message };
  }
}

export async function deleteEvidence(
  workspaceId: string,
  param2: string,
  param3?: string
) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  const auditId = param3 ? param2 : undefined;
  const evidenceId = param3 ? param3 : param2;

  if (!evidenceId) {
    return { success: false, error: "Evidence ID is required" };
  }

  try {
    await requirePermission("evidence.delete", workspaceId);

    let existing;
    if (auditId) {
      existing = await db.queryOne<{ id: string; name: string; reference: string; audit_id: string; storage_key?: string }>(
        `
          SELECT e.id, e.name, e.reference, e.audit_id, e.storage_key
          FROM evidence e
          JOIN audits a ON e.audit_id = a.id
          WHERE e.id = $1 AND e.audit_id = $2 AND a.workspace_id = $3
        `,
        [evidenceId, auditId, workspaceId]
      );
    } else {
      existing = await db.queryOne<{ id: string; name: string; reference: string; audit_id: string; storage_key?: string }>(
        `
          SELECT e.id, e.name, e.reference, e.audit_id, e.storage_key
          FROM evidence e
          JOIN audits a ON e.audit_id = a.id
          WHERE e.id = $1 AND a.workspace_id = $2
        `,
        [evidenceId, workspaceId]
      );
    }

    if (!existing) {
      return { success: false, error: "Evidence not found in this workspace" };
    }

    // Clean up persistent binary object if present
    if (existing.storage_key) {
      await storage.deleteObject(existing.storage_key).catch(() => {});
    }

    await db.execute(
      `
      DELETE FROM evidence
      WHERE id = $1 AND audit_id = $2 AND workspace_id = $3
      `,
      [evidenceId, existing.audit_id, workspaceId]
    );

    // Keep audit evidence metric in sync
    await db.execute(
      `
      UPDATE audits
      SET evidence = (SELECT COUNT(*) FROM evidence WHERE audit_id = $1)
      WHERE id = $2
      `,
      [existing.audit_id, existing.audit_id]
    );

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Evidence",
      entityId: evidenceId,
      description: `Deleted evidence "${existing.name}" (${existing.reference})`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete evidence";
    return { success: false, error: message };
  }
}

/**
 * Uploads a real binary file to persistent object storage and persists its metadata in Neon PostgreSQL.
 * Strictly verifies workspace isolation, file type, file size, and non-empty content.
 */
export async function uploadEvidenceFile(
  workspaceId: string,
  auditId: string,
  formData: FormData
): Promise<{ success: boolean; data?: EvidenceRecord; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }
  if (!auditId) {
    return { success: false, error: "Audit ID is required" };
  }

  try {
    const auth = await requirePermission("evidence.create", workspaceId);

    // Verify target audit belongs to this workspace
    const audit = await db.queryOne<{ id: string; framework: string }>(
      `SELECT id, framework FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!audit) {
      return { success: false, error: "Audit not found in this workspace" };
    }

    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return { success: false, error: "No file provided for upload" };
    }

    if (file.size === 0) {
      return { success: false, error: "File cannot be empty (0 bytes)" };
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB limit
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "File exceeds 25 MB maximum size limit" };
    }

    const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        success: false,
        error: `Unsupported file format '${ext}'. Allowed formats: PDF, DOCX, XLSX, CSV, PNG, JPG`,
      };
    }

    const control = (formData.get("control") as string)?.trim() || "General";
    const framework = (formData.get("framework") as string)?.trim() || audit.framework || "ISO 27001";
    let status = (formData.get("status") as EvidenceStatus) || "Submitted";
    if (!VALID_EVIDENCE_STATUSES.includes(status)) {
      status = "Submitted";
    }
    const uploadedBy = (formData.get("uploadedBy") as string)?.trim() || auth.user.name || "Auditor";
    const description = (formData.get("description") as string)?.trim() || "";
    const reference = (formData.get("reference") as string)?.trim() || `EV-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    // Format file type based on extension
    const type = ext.replace(".", "").toUpperCase();
    const sizeFormatted = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const mimeType = file.type || "application/octet-stream";

    // 1. Generate unguessable persistent storage key
    const storageKey = storage.generateStorageKey(workspaceId, auditId, file.name);

    // 2. Read file binary buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. PERSIST BINARY CONTENT TO OBJECT STORAGE FIRST
    await storage.putObject({
      key: storageKey,
      body: buffer,
      contentType: mimeType,
      metadata: {
        workspaceId,
        auditId,
        filename: file.name,
      },
    });

    // 4. ONLY AFTER BINARY STORAGE SUCCEEDS, INSERT METADATA RECORD IN NEON POSTGRESQL
    const id = `EVD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
    const date = new Date().toISOString().split("T")[0];

    await db.execute(
      `
      INSERT INTO evidence (
        id, workspace_id, audit_id, reference, name, type, control,
        uploaded_by, date, status, description, size, framework, reviewed_by,
        storage_key, mime_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        id,
        workspaceId,
        auditId,
        reference,
        file.name,
        type,
        control,
        uploadedBy,
        date,
        status,
        description,
        sizeFormatted,
        framework,
        "—",
        storageKey,
        mimeType,
      ]
    );

    // Sync audit evidence counter
    await db.execute(
      `
      UPDATE audits
      SET evidence = (SELECT COUNT(*) FROM evidence WHERE audit_id = $1)
      WHERE id = $2
      `,
      [auditId, auditId]
    );

    const record: EvidenceRecord = {
      id,
      workspace_id: workspaceId,
      audit_id: auditId,
      reference,
      name: file.name,
      type,
      control,
      uploaded_by: uploadedBy,
      date,
      status,
      description,
      size: sizeFormatted,
      framework,
      reviewed_by: "—",
      storage_key: storageKey,
      mime_type: mimeType,
      created_at: new Date().toISOString(),
    };

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Evidence",
      entityId: id,
      description: `Uploaded persistent evidence "${file.name}" (${reference})`,
      details: { control, framework, status, uploadedBy, storageKey, size: sizeFormatted },
    });

    return { success: true, data: record };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload evidence file";
    return { success: false, error: message };
  }
}

/**
 * Generates an authenticated, short-lived signed download URL for an evidence item.
 * Strictly checks that the requester belongs to the workspace and the evidence belongs to that workspace.
 */
export async function getEvidenceDownloadUrl(
  workspaceId: string,
  evidenceId: string
): Promise<{ success: boolean; downloadUrl?: string; filename?: string; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }
  if (!evidenceId) {
    return { success: false, error: "Evidence ID is required" };
  }

  try {
    await requirePermission("evidence.view", workspaceId);

    const record = await db.queryOne<EvidenceRecord>(
      `
      SELECT e.*, a.name as audit_name
      FROM evidence e
      JOIN audits a ON e.audit_id = a.id
      WHERE e.id = $1 AND a.workspace_id = $2
      `,
      [evidenceId, workspaceId]
    );

    if (!record) {
      return { success: false, error: "Evidence not found or unauthorized for this workspace" };
    }

    if (!record.storage_key) {
      return { success: false, error: "This evidence item has no persistent binary storage" };
    }

    const downloadUrl = await storage.getSignedDownloadUrl({
      key: record.storage_key,
      filename: record.name,
      workspaceId,
      evidenceId: record.id,
      expiresInSeconds: 900, // 15-minute expiration
    });

    return {
      success: true,
      downloadUrl,
      filename: record.name,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate download authorization";
    return { success: false, error: message };
  }
}


