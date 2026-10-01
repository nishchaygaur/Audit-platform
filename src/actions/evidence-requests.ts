"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";

export type PBCRequestPriority = "Critical" | "High" | "Medium" | "Low";
export type PBCRequestStatus =
  | "Requested"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected";

export interface EvidenceRequestRecord {
  id: string;
  workspace_id: string;
  audit_id: string;
  control_id: string;
  control_title: string;
  title: string;
  description: string;
  priority: PBCRequestPriority;
  status: PBCRequestStatus;
  assigned_to: string;
  due_date: string;
  evidence_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
  audit_name?: string;
  evidence_name?: string;
  comments_count?: number;
}

export interface EvidenceCommentRecord {
  id: string;
  workspace_id: string;
  request_id?: string;
  evidence_id?: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
}

export interface CreateEvidenceRequestInput {
  auditId: string;
  controlId: string;
  controlTitle?: string;
  title: string;
  description?: string;
  priority?: PBCRequestPriority;
  assignedTo: string;
  dueDate: string;
}

export async function getEvidenceRequests(
  workspaceId: string,
  auditId?: string
): Promise<{ success: boolean; data?: EvidenceRequestRecord[]; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("evidence.view", workspaceId);

    const queryStr = `
      SELECT 
        r.*, 
        a.name as audit_name,
        e.name as evidence_name,
        (SELECT COUNT(*) FROM evidence_comments c WHERE c.request_id = r.id) as comments_count
      FROM evidence_requests r
      JOIN audits a ON r.audit_id = a.id
      LEFT JOIN evidence e ON r.evidence_id = e.id
      WHERE r.workspace_id = $1
        ${auditId ? "AND r.audit_id = $2" : ""}
      ORDER BY 
        CASE r.priority 
          WHEN 'Critical' THEN 1 
          WHEN 'High' THEN 2 
          WHEN 'Medium' THEN 3 
          ELSE 4 
        END,
        r.due_date ASC
    `;

    const params = auditId ? [workspaceId, auditId] : [workspaceId];
    const rows = await db.query<EvidenceRequestRecord>(queryStr, params);

    return { success: true, data: rows };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch evidence requests";
    return { success: false, error: message };
  }
}

export async function createEvidenceRequest(
  workspaceId: string,
  input: CreateEvidenceRequestInput
): Promise<{ success: boolean; data?: EvidenceRequestRecord; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }
  if (!input.auditId) {
    return { success: false, error: "Audit ID is required" };
  }
  if (!input.title?.trim()) {
    return { success: false, error: "Request title is required" };
  }
  if (!input.assignedTo?.trim()) {
    return { success: false, error: "Assigned auditee is required" };
  }

  try {
    const auth = await requirePermission("evidence.create", workspaceId);

    const id = `REQ-${new Date().getFullYear()}-${crypto
      .randomUUID()
      .slice(0, 5)
      .toUpperCase()}`;

    const priority = input.priority || "Medium";
    const status: PBCRequestStatus = "Requested";
    const controlTitle = input.controlTitle || input.controlId || "General Compliance";
    const description = input.description || "";
    const dueDate = input.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    await db.execute(
      `
      INSERT INTO evidence_requests (
        id, workspace_id, audit_id, control_id, control_title, title, description,
        priority, status, assigned_to, due_date, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        id,
        workspaceId,
        input.auditId,
        input.controlId,
        controlTitle,
        input.title.trim(),
        description,
        priority,
        status,
        input.assignedTo.trim(),
        dueDate,
        auth.user.name || "Auditor",
      ]
    );

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "EvidenceRequest",
      entityId: id,
      description: `Created PBC Evidence Request "${input.title}" assigned to ${input.assignedTo}`,
      details: { controlId: input.controlId, priority, dueDate },
    });

    const res = await db.queryOne<EvidenceRequestRecord>(
      `
      SELECT r.*, a.name as audit_name
      FROM evidence_requests r
      JOIN audits a ON r.audit_id = a.id
      WHERE r.id = $1 AND r.workspace_id = $2
      `,
      [id, workspaceId]
    );

    return { success: true, data: res };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create evidence request";
    return { success: false, error: message };
  }
}

export async function fulfillEvidenceRequest(
  workspaceId: string,
  requestId: string,
  evidenceId: string
): Promise<{ success: boolean; error?: string }> {
  if (!workspaceId || !requestId || !evidenceId) {
    return { success: false, error: "Missing required parameters" };
  }

  try {
    await requirePermission("evidence.create", workspaceId);

    const req = await db.queryOne<{ id: string; title: string }>(
      `SELECT id, title FROM evidence_requests WHERE id = $1 AND workspace_id = $2`,
      [requestId, workspaceId]
    );

    if (!req) {
      return { success: false, error: "Request not found in this workspace" };
    }

    await db.execute(
      `
      UPDATE evidence_requests
      SET evidence_id = $1, status = 'Submitted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND workspace_id = $3
      `,
      [evidenceId, requestId, workspaceId]
    );

    // Also update evidence status to Under Review
    await db.execute(
      `
      UPDATE evidence
      SET status = 'Under Review', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND workspace_id = $2
      `,
      [evidenceId, workspaceId]
    );

    await logAuditEvent({
      workspaceId,
      action: "STATUS_CHANGE",
      entityType: "EvidenceRequest",
      entityId: requestId,
      description: `Auditee submitted evidence for request "${req.title}"`,
      details: { evidenceId },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fulfill evidence request";
    return { success: false, error: message };
  }
}

export async function reviewEvidenceRequest(
  workspaceId: string,
  requestId: string,
  decision: "Approved" | "Rejected",
  feedback?: string
): Promise<{ success: boolean; error?: string }> {
  if (!workspaceId || !requestId) {
    return { success: false, error: "Missing required parameters" };
  }

  try {
    const auth = await requirePermission("evidence.update", workspaceId);

    const req = await db.queryOne<{ id: string; title: string; evidence_id?: string }>(
      `SELECT id, title, evidence_id FROM evidence_requests WHERE id = $1 AND workspace_id = $2`,
      [requestId, workspaceId]
    );

    if (!req) {
      return { success: false, error: "Request not found" };
    }

    const newStatus: PBCRequestStatus = decision === "Approved" ? "Approved" : "Rejected";

    await db.execute(
      `
      UPDATE evidence_requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND workspace_id = $3
      `,
      [newStatus, requestId, workspaceId]
    );

    // If evidence is linked, sync its status
    if (req.evidence_id) {
      const evidenceStatus = decision === "Approved" ? "Accepted" : "Rejected";
      await db.execute(
        `
        UPDATE evidence
        SET status = $1, reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND workspace_id = $4
        `,
        [evidenceStatus, auth.user.name || "Auditor", req.evidence_id, workspaceId]
      );
    }

    if (feedback?.trim()) {
      await addEvidenceComment(workspaceId, {
        requestId,
        evidenceId: req.evidence_id || undefined,
        message: `[Decision: ${decision}] ${feedback.trim()}`,
      });
    }

    await logAuditEvent({
      workspaceId,
      action: "STATUS_CHANGE",
      entityType: "EvidenceRequest",
      entityId: requestId,
      description: `Auditor marked request "${req.title}" as ${decision}`,
      details: { decision, feedback },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review evidence request";
    return { success: false, error: message };
  }
}

export async function deleteEvidenceRequest(
  workspaceId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  if (!workspaceId || !requestId) {
    return { success: false, error: "Missing required parameters" };
  }

  try {
    await requirePermission("evidence.delete", workspaceId);

    await db.execute(
      `DELETE FROM evidence_requests WHERE id = $1 AND workspace_id = $2`,
      [requestId, workspaceId]
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete request";
    return { success: false, error: message };
  }
}

export async function getEvidenceComments(
  workspaceId: string,
  options: { requestId?: string; evidenceId?: string }
): Promise<{ success: boolean; data?: EvidenceCommentRecord[]; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("evidence.view", workspaceId);

    const { requestId, evidenceId } = options;
    if (!requestId && !evidenceId) {
      return { success: true, data: [] };
    }

    let rows: EvidenceCommentRecord[] = [];
    if (requestId && evidenceId) {
      rows = await db.query<EvidenceCommentRecord>(
        `
        SELECT * FROM evidence_comments
        WHERE workspace_id = $1 AND (request_id = $2 OR evidence_id = $3)
        ORDER BY created_at ASC
        `,
        [workspaceId, requestId, evidenceId]
      );
    } else if (requestId) {
      rows = await db.query<EvidenceCommentRecord>(
        `
        SELECT * FROM evidence_comments
        WHERE workspace_id = $1 AND request_id = $2
        ORDER BY created_at ASC
        `,
        [workspaceId, requestId]
      );
    } else if (evidenceId) {
      rows = await db.query<EvidenceCommentRecord>(
        `
        SELECT * FROM evidence_comments
        WHERE workspace_id = $1 AND evidence_id = $2
        ORDER BY created_at ASC
        `,
        [workspaceId, evidenceId]
      );
    }

    return { success: true, data: rows };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch comments";
    return { success: false, error: message };
  }
}

export async function addEvidenceComment(
  workspaceId: string,
  input: { requestId?: string; evidenceId?: string; message: string }
): Promise<{ success: boolean; data?: EvidenceCommentRecord; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }
  if (!input.message?.trim()) {
    return { success: false, error: "Comment message cannot be empty" };
  }

  try {
    const auth = await requirePermission("evidence.view", workspaceId);

    const id = `COM-${crypto.randomUUID().slice(0, 8)}`;
    const userId = auth.user.id || "usr_unknown";
    const userName = auth.user.name || "Auditor";
    const userRole = auth.role || "Auditor";

    await db.execute(
      `
      INSERT INTO evidence_comments (
        id, workspace_id, request_id, evidence_id, user_id, user_name, user_role, message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        id,
        workspaceId,
        input.requestId || null,
        input.evidenceId || null,
        userId,
        userName,
        userRole,
        input.message.trim(),
      ]
    );

    const record: EvidenceCommentRecord = {
      id,
      workspace_id: workspaceId,
      request_id: input.requestId,
      evidence_id: input.evidenceId,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      message: input.message.trim(),
      created_at: new Date().toISOString(),
    };

    return { success: true, data: record };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add comment";
    return { success: false, error: message };
  }
}
