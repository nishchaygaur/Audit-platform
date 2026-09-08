"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";
import {
  type FindingSeverity,
  type FindingStatus,
  VALID_FINDING_SEVERITIES,
  VALID_FINDING_STATUSES,
} from "@/lib/findings-types";

export type { FindingSeverity, FindingStatus };

export type FindingRecord = {
  id: string;
  workspace_id: string;
  audit_id: string;
  reference: string;
  title: string;
  description: string;
  framework: string;
  control: string;
  severity: FindingSeverity;
  owner: string;
  identified_date: string;
  due_date: string;
  status: FindingStatus;
  recommendation: string;
  evidence: string;
  auditor: string;
  created_at: string;
  audit_name?: string;
};

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
      const audit = await db.queryOne<{ id: string }>(
        "SELECT id FROM audits WHERE id = $1 AND workspace_id = $2",
        [auditId, workspaceId]
      );
      if (!audit) {
        return { success: false, error: "Audit not found in this workspace" };
      }
    }

    let query = `
      SELECT f.*, a.name as audit_name 
      FROM findings f 
      JOIN audits a ON f.audit_id = a.id 
      WHERE f.workspace_id = $1 AND a.workspace_id = $2
    `;
    const params: string[] = [workspaceId, workspaceId];

    if (auditId) {
      params.push(auditId);
      query += ` AND f.audit_id = $${params.length}`;
    }

    query += ` ORDER BY f.created_at DESC`;
    const findings = await db.query<FindingRecord>(query, params);

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
      WHERE f.id = $1 AND f.workspace_id = $2 AND a.workspace_id = $3
    `;
    const params: string[] = [findingId, workspaceId, workspaceId];

    if (auditId) {
      params.push(auditId);
      query += ` AND f.audit_id = $${params.length}`;
    }

    const finding = await db.queryOne<FindingRecord>(query, params);
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
    const audit = await db.queryOne<{ id: string; framework: string }>(
      "SELECT id, framework FROM audits WHERE id = $1 AND workspace_id = $2",
      [input.auditId, workspaceId]
    );

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
      const referencedEvidence = await db.queryOne<{ workspace_id: string }>(
        "SELECT workspace_id FROM evidence WHERE id = $1 OR reference = $2",
        [input.evidence.trim(), input.evidence.trim()]
      );

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

    await db.execute(
      `
      INSERT INTO findings (
        id, workspace_id, audit_id, reference, title, description,
        framework, control, severity, owner, identified_date, due_date,
        status, recommendation, evidence, auditor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
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
        auditor,
      ]
    );

    // Sync parent audit finding count
    await db.execute(
      "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = $1) WHERE id = $2",
      [input.auditId, input.auditId]
    );

    const createdRecord = await db.queryOne<FindingRecord>(
      "SELECT * FROM findings WHERE id = $1",
      [id]
    );

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Finding",
      entityId: id,
      description: `Created finding "${input.title.trim()}" (${reference}) - Severity: ${input.severity}`,
      details: { severity: input.severity, status: normalizedStatus, control, framework, owner },
    });

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
      WHERE f.id = $1 AND f.workspace_id = $2 AND a.workspace_id = $3
    `;
    const checkParams: string[] = [findingId, workspaceId, workspaceId];
    if (auditId) {
      checkParams.push(auditId);
      checkQuery += ` AND f.audit_id = $${checkParams.length}`;
    }

    const existing = await db.queryOne<{
      id: string;
      title: string;
      reference: string;
      status: string;
      severity: string;
      audit_id: string;
    }>(checkQuery, checkParams);

    if (!existing) {
      return { success: false, error: "Finding not found" };
    }

    // If updating auditId, verify target audit belongs to this workspace
    if (updates.auditId && updates.auditId !== existing.audit_id) {
      const targetAudit = await db.queryOne<{ id: string }>(
        "SELECT id FROM audits WHERE id = $1 AND workspace_id = $2",
        [updates.auditId, workspaceId]
      );
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
      const referencedEvidence = await db.queryOne<{ workspace_id: string }>(
        "SELECT workspace_id FROM evidence WHERE id = $1 OR reference = $2",
        [updates.evidence.trim(), updates.evidence.trim()]
      );

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
      values.push(updates.title.trim());
      fields.push(`title = $${values.length}`);
    }
    if (updates.description !== undefined) {
      values.push(updates.description);
      fields.push(`description = $${values.length}`);
    }
    if (updates.auditId !== undefined) {
      values.push(updates.auditId);
      fields.push(`audit_id = $${values.length}`);
    }
    if (updates.reference !== undefined) {
      values.push(updates.reference);
      fields.push(`reference = $${values.length}`);
    }
    if (updates.framework !== undefined) {
      values.push(updates.framework);
      fields.push(`framework = $${values.length}`);
    }
    if (updates.control !== undefined) {
      values.push(updates.control);
      fields.push(`control = $${values.length}`);
    }
    if (updates.severity !== undefined) {
      values.push(updates.severity);
      fields.push(`severity = $${values.length}`);
    }
    if (updates.owner !== undefined) {
      values.push(updates.owner);
      fields.push(`owner = $${values.length}`);
    }
    if (updates.identifiedDate !== undefined) {
      values.push(updates.identifiedDate);
      fields.push(`identified_date = $${values.length}`);
    }
    if (updates.dueDate !== undefined) {
      values.push(updates.dueDate);
      fields.push(`due_date = $${values.length}`);
    }
    if (normalizedStatus !== undefined) {
      values.push(normalizedStatus);
      fields.push(`status = $${values.length}`);
    }
    if (updates.recommendation !== undefined) {
      values.push(updates.recommendation);
      fields.push(`recommendation = $${values.length}`);
    }
    if (updates.evidence !== undefined) {
      values.push(updates.evidence);
      fields.push(`evidence = $${values.length}`);
    }
    if (updates.auditor !== undefined) {
      values.push(updates.auditor);
      fields.push(`auditor = $${values.length}`);
    }

    if (fields.length > 0) {
      values.push(findingId);
      const findingIdIdx = values.length;
      values.push(workspaceId);
      const workspaceIdIdx = values.length;

      await db.execute(
        `UPDATE findings SET ${fields.join(", ")} WHERE id = $${findingIdIdx} AND workspace_id = $${workspaceIdIdx}`,
        values
      );
    }

    // Sync audit counters
    await db.execute(
      "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = $1) WHERE id = $2",
      [existing.audit_id, existing.audit_id]
    );

    if (updates.auditId && updates.auditId !== existing.audit_id) {
      await db.execute(
        "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = $1) WHERE id = $2",
        [updates.auditId, updates.auditId]
      );
    }

    const updated = await db.queryOne<FindingRecord>(
      "SELECT * FROM findings WHERE id = $1",
      [findingId]
    );

    let desc = `Updated finding "${existing.title}" (${existing.reference})`;
    if (normalizedStatus && normalizedStatus !== existing.status) {
      desc = `Changed finding "${existing.reference}" status from ${existing.status} to ${normalizedStatus}`;
    }

    await logAuditEvent({
      workspaceId,
      action: normalizedStatus && normalizedStatus !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "Finding",
      entityId: findingId,
      description: desc,
      details: updates,
    });

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
      WHERE f.id = $1 AND f.workspace_id = $2 AND a.workspace_id = $3
    `;
    const checkParams: string[] = [findingId, workspaceId, workspaceId];
    if (auditId) {
      checkParams.push(auditId);
      checkQuery += ` AND f.audit_id = $${checkParams.length}`;
    }

    const existing = await db.queryOne<{
      id: string;
      title: string;
      reference: string;
      audit_id: string;
    }>(checkQuery, checkParams);

    if (!existing) {
      return { success: false, error: "Finding not found" };
    }

    await db.execute(
      "DELETE FROM findings WHERE id = $1 AND workspace_id = $2",
      [findingId, workspaceId]
    );

    // Sync parent audit counter
    await db.execute(
      "UPDATE audits SET findings = (SELECT COUNT(*) FROM findings WHERE audit_id = $1) WHERE id = $2",
      [existing.audit_id, existing.audit_id]
    );

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Finding",
      entityId: findingId,
      description: `Deleted finding "${existing.title}" (${existing.reference})`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete finding";
    return { success: false, error: message };
  }
}

