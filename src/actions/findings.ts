"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import crypto from "crypto";

export type FindingSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Informational";

export type FindingStatus =
  | "Open"
  | "In Progress"
  | "Remediated"
  | "Accepted Risk"
  | "Closed";

export const VALID_FINDING_SEVERITIES: readonly FindingSeverity[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
] as const;

export const VALID_FINDING_STATUSES: readonly FindingStatus[] = [
  "Open",
  "In Progress",
  "Remediated",
  "Accepted Risk",
  "Closed",
] as const;

function normalizeStatus(status?: string): FindingStatus | undefined {
  if (!status) return undefined;
  const trimmed = status.trim();
  if (trimmed === "Resolved") return "Remediated";
  if (trimmed === "Accepted") return "Accepted Risk";
  if (VALID_FINDING_STATUSES.includes(trimmed as FindingStatus)) {
    return trimmed as FindingStatus;
  }
  return undefined;
}

export type CreateFindingInput = {
  auditId: string;
  reference?: string;
  title: string;
  description: string;
  framework?: string;
  control?: string;
  severity: FindingSeverity;
  owner?: string;
  identifiedDate?: string;
  dueDate?: string;
  status?: FindingStatus | "Resolved" | "Accepted";
  recommendation?: string;
  evidence?: string;
  auditor?: string;
};

export type UpdateFindingInput = {
  auditId?: string;
  reference?: string;
  title?: string;
  description?: string;
  framework?: string;
  control?: string;
  severity?: FindingSeverity;
  owner?: string;
  identifiedDate?: string;
  dueDate?: string;
  status?: FindingStatus | "Resolved" | "Accepted";
  recommendation?: string;
  evidence?: string;
  auditor?: string;
};

export async function getFindings(workspaceId: string, auditId?: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("findings.view", workspaceId);

    if (auditId) {
      const audit = db
        .prepare("SELECT id FROM audits WHERE id = ? AND workspace_id = ?")
        .get(auditId, workspaceId);
      if (!audit) {
        return { success: false, error: "Audit not found in this workspace" };
      }
    }

    let query = `
      SELECT f.*, a.name as audit_name 
      FROM findings f 
      JOIN audits a ON f.audit_id = a.id 
      WHERE f.workspace_id = ? AND a.workspace_id = ?
    `;
    const params: string[] = [workspaceId, workspaceId];

    if (auditId) {
      query += ` AND f.audit_id = ?`;
      params.push(auditId);
    }

    query += ` ORDER BY f.created_at DESC`;
    const findings = db.prepare(query).all(...params);

    return { success: true, data: findings };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch findings";
    return { success: false, error: message };
  }
}

export async function getFinding(
  workspaceId: string,
  findingId: string,
  auditId?: string
) {
  if (!workspaceId || !findingId) {
    return { success: false, error: "Workspace ID and Finding ID are required" };
  }

  try {
    await requirePermission("findings.view", workspaceId);

    let query = `
      SELECT f.*, a.name as audit_name 
      FROM findings f 
      JOIN audits a ON f.audit_id = a.id 
      WHERE f.id = ? AND f.workspace_id = ? AND a.workspace_id = ?
    `;
    const params: string[] = [findingId, workspaceId, workspaceId];

    if (auditId) {
      query += ` AND f.audit_id = ?`;
      params.push(auditId);
    }

    const finding = db.prepare(query).get(...params);
    if (!finding) {
      return { success: false, error: "Finding not found" };
    }

    return { success: true, data: finding };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch finding";
    return { success: false, error: message };
  }
}

export async function createFinding(workspaceId: string, input: CreateFindingInput) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("findings.create", workspaceId);

    if (!input.title || !input.title.trim()) {
      return { success: false, error: "Finding title is required" };
    }

    if (!input.auditId) {
      return { success: false, error: "Audit ID is required" };
    }

    // Verify parent audit belongs to this workspace
    const audit = db
      .prepare("SELECT id, framework FROM audits WHERE id = ? AND workspace_id = ?")
      .get(input.auditId, workspaceId) as { id: string; framework: string } | undefined;

    if (!audit) {
      return { success: false, error: "Audit not found in this workspace" };
    }

    // Validate severity
    if (!input.severity || !VALID_FINDING_SEVERITIES.includes(input.severity)) {
      return {
        success: false,
        error: `Invalid severity. Must be one of: ${VALID_FINDING_SEVERITIES.join(", ")}`,
      };
    }

    // Validate status
    const normalizedStatus = normalizeStatus(input.status) || "Open";
    if (!VALID_FINDING_STATUSES.includes(normalizedStatus)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${VALID_FINDING_STATUSES.join(", ")}`,
      };
    }

    // Cross-workspace evidence reference check
    if (input.evidence && input.evidence.trim()) {
      const referencedEvidence = db
        .prepare("SELECT workspace_id FROM evidence WHERE id = ? OR reference = ?")
        .get(input.evidence.trim(), input.evidence.trim()) as { workspace_id: string } | undefined;

      if (referencedEvidence && referencedEvidence.workspace_id !== workspaceId) {
        return {
          success: false,
          error: "Referenced evidence belongs to another workspace",
        };
      }
    }

    const id = crypto.randomUUID();
    const reference =
      input.reference && input.reference.trim()
        ? input.reference.trim()
        : `FND-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    const framework = input.framework || audit.framework || "General";
    const control = input.control || "Not specified";
    const owner = input.owner || "Unassigned";
    const identifiedDate = input.identifiedDate || new Date().toISOString().split("T")[0];
    const dueDate = input.dueDate || "Not assigned";
    const recommendation = input.recommendation || "";
    const evidence = input.evidence || "";
    const auditor = input.auditor || "";

    db.prepare(`
      INSERT INTO findings (
        id, workspace_id, audit_id, reference, title, description,
        framework, control, severity, owner, identified_date, due_date,
        status, recommendation, evidence, auditor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      workspaceId,
      input.auditId,
      reference,
      input.title.trim(),
      input.description || "",
      framework,
      control,
      input.severity,
      owner,
      identifiedDate,
      dueDate,
      normalizedStatus,
      recommendation,
      evidence,
      auditor
    );

    // Sync parent audit finding count
    db.prepare(
      "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = ?) WHERE id = ?"
    ).run(input.auditId, input.auditId);

    const createdRecord = db.prepare("SELECT * FROM findings WHERE id = ?").get(id);

    return { success: true, data: createdRecord };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create finding";
    return { success: false, error: message };
  }
}

export async function updateFinding(
  workspaceId: string,
  findingId: string,
  updates: UpdateFindingInput,
  auditId?: string
) {
  if (!workspaceId || !findingId) {
    return { success: false, error: "Workspace ID and Finding ID are required" };
  }

  try {
    await requirePermission("findings.update", workspaceId);

    // Verify finding belongs to workspace (and audit if specified)
    let checkQuery = `
      SELECT f.* 
      FROM findings f 
      JOIN audits a ON f.audit_id = a.id 
      WHERE f.id = ? AND f.workspace_id = ? AND a.workspace_id = ?
    `;
    const checkParams: string[] = [findingId, workspaceId, workspaceId];
    if (auditId) {
      checkQuery += ` AND f.audit_id = ?`;
      checkParams.push(auditId);
    }

    const existing = db.prepare(checkQuery).get(...checkParams) as
      | { id: string; audit_id: string }
      | undefined;

    if (!existing) {
      return { success: false, error: "Finding not found" };
    }

    // If updating auditId, verify target audit belongs to this workspace
    if (updates.auditId && updates.auditId !== existing.audit_id) {
      const targetAudit = db
        .prepare("SELECT id FROM audits WHERE id = ? AND workspace_id = ?")
        .get(updates.auditId, workspaceId);
      if (!targetAudit) {
        return { success: false, error: "Target audit not found in this workspace" };
      }
    }

    // Validate severity if updated
    if (updates.severity) {
      if (!VALID_FINDING_SEVERITIES.includes(updates.severity)) {
        return {
          success: false,
          error: `Invalid severity. Must be one of: ${VALID_FINDING_SEVERITIES.join(", ")}`,
        };
      }
    }

    // Validate status if updated
    let normalizedStatus: FindingStatus | undefined;
    if (updates.status) {
      normalizedStatus = normalizeStatus(updates.status);
      if (!normalizedStatus || !VALID_FINDING_STATUSES.includes(normalizedStatus)) {
        return {
          success: false,
          error: `Invalid status. Must be one of: ${VALID_FINDING_STATUSES.join(", ")}`,
        };
      }
    }

    // Cross-workspace evidence reference check
    if (updates.evidence && updates.evidence.trim()) {
      const referencedEvidence = db
        .prepare("SELECT workspace_id FROM evidence WHERE id = ? OR reference = ?")
        .get(updates.evidence.trim(), updates.evidence.trim()) as { workspace_id: string } | undefined;

      if (referencedEvidence && referencedEvidence.workspace_id !== workspaceId) {
        return {
          success: false,
          error: "Referenced evidence belongs to another workspace",
        };
      }
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title.trim());
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.auditId !== undefined) {
      fields.push("audit_id = ?");
      values.push(updates.auditId);
    }
    if (updates.reference !== undefined) {
      fields.push("reference = ?");
      values.push(updates.reference);
    }
    if (updates.framework !== undefined) {
      fields.push("framework = ?");
      values.push(updates.framework);
    }
    if (updates.control !== undefined) {
      fields.push("control = ?");
      values.push(updates.control);
    }
    if (updates.severity !== undefined) {
      fields.push("severity = ?");
      values.push(updates.severity);
    }
    if (updates.owner !== undefined) {
      fields.push("owner = ?");
      values.push(updates.owner);
    }
    if (updates.identifiedDate !== undefined) {
      fields.push("identified_date = ?");
      values.push(updates.identifiedDate);
    }
    if (updates.dueDate !== undefined) {
      fields.push("due_date = ?");
      values.push(updates.dueDate);
    }
    if (normalizedStatus !== undefined) {
      fields.push("status = ?");
      values.push(normalizedStatus);
    }
    if (updates.recommendation !== undefined) {
      fields.push("recommendation = ?");
      values.push(updates.recommendation);
    }
    if (updates.evidence !== undefined) {
      fields.push("evidence = ?");
      values.push(updates.evidence);
    }
    if (updates.auditor !== undefined) {
      fields.push("auditor = ?");
      values.push(updates.auditor);
    }

    if (fields.length > 0) {
      values.push(findingId, workspaceId);
      db.prepare(`UPDATE findings SET ${fields.join(", ")} WHERE id = ? AND workspace_id = ?`).run(
        ...values
      );
    }

    // Sync audit counters
    db.prepare(
      "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = ?) WHERE id = ?"
    ).run(existing.audit_id, existing.audit_id);

    if (updates.auditId && updates.auditId !== existing.audit_id) {
      db.prepare(
        "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = ?) WHERE id = ?"
      ).run(updates.auditId, updates.auditId);
    }

    const updated = db.prepare("SELECT * FROM findings WHERE id = ?").get(findingId);
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update finding";
    return { success: false, error: message };
  }
}

export async function deleteFinding(
  workspaceId: string,
  findingId: string,
  auditId?: string
) {
  if (!workspaceId || !findingId) {
    return { success: false, error: "Workspace ID and Finding ID are required" };
  }

  try {
    await requirePermission("findings.delete", workspaceId);

    let checkQuery = `
      SELECT f.* 
      FROM findings f 
      JOIN audits a ON f.audit_id = a.id 
      WHERE f.id = ? AND f.workspace_id = ? AND a.workspace_id = ?
    `;
    const checkParams: string[] = [findingId, workspaceId, workspaceId];
    if (auditId) {
      checkQuery += ` AND f.audit_id = ?`;
      checkParams.push(auditId);
    }

    const existing = db.prepare(checkQuery).get(...checkParams) as
      | { id: string; audit_id: string }
      | undefined;

    if (!existing) {
      return { success: false, error: "Finding not found" };
    }

    db.prepare("DELETE FROM findings WHERE id = ? AND workspace_id = ?").run(
      findingId,
      workspaceId
    );

    // Sync parent audit counter
    db.prepare(
      "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = ?) WHERE id = ?"
    ).run(existing.audit_id, existing.audit_id);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete finding";
    return { success: false, error: message };
  }
}
