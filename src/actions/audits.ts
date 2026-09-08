"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";

export type AuditLifecycleStatus =
  | "Planning"
  | "Fieldwork"
  | "Review"
  | "Reporting"
  | "Completed";

export const VALID_AUDIT_STATUSES: readonly AuditLifecycleStatus[] = [
  "Planning",
  "Fieldwork",
  "Review",
  "Reporting",
  "Completed",
] as const;

export type CreateAuditInput = {
  name: string;
  framework?: string;
  lead?: string;
  status?: AuditLifecycleStatus;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  objective?: string;
  scope?: string;
  controls?: number;
  evidence?: number;
  findings?: number;
  risks?: number;
};

export type UpdateAuditInput = {
  name?: string;
  framework?: string;
  lead?: string;
  status?: AuditLifecycleStatus;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  objective?: string;
  scope?: string;
  controls?: number;
  evidence?: number;
  findings?: number;
  risks?: number;
};

export async function getAudits(workspaceId: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audits.view", workspaceId);
    const audits = await db.query(
      `SELECT * FROM audits WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspaceId]
    );
    return { success: true, data: audits };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch audits";
    return { success: false, error: message };
  }
}

export async function getAudit(workspaceId: string, auditId: string) {
  if (!workspaceId || !auditId) {
    return { success: false, error: "Workspace ID and Audit ID are required" };
  }

  try {
    await requirePermission("audits.view", workspaceId);
    const audit = await db.queryOne(
      `SELECT * FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!audit) {
      return { success: false, error: "Audit not found" };
    }

    return { success: true, data: audit };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch audit";
    return { success: false, error: message };
  }
}

export async function createAudit(workspaceId: string, data: CreateAuditInput) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audits.create", workspaceId);

    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Audit name is required" };
    }

    const status: AuditLifecycleStatus =
      data.status && VALID_AUDIT_STATUSES.includes(data.status)
        ? data.status
        : "Planning";

    const id = `AUD-${new Date().getFullYear()}-${crypto
      .randomUUID()
      .slice(0, 5)
      .toUpperCase()}`;

    const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
    const startDate = data.startDate || new Date().toISOString().split("T")[0];
    const dueDate =
      data.dueDate ||
      new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const framework = data.framework || "ISO 27001";
    const lead = data.lead || "Unassigned";
    const objective = data.objective || "";
    const scope = data.scope || "";
    const controls = Number(data.controls) || 0;
    const evidence = Number(data.evidence) || 0;
    const findings = Number(data.findings) || 0;
    const risks = Number(data.risks) || 0;

    await db.execute(
      `
      INSERT INTO audits (
        id, workspace_id, name, framework, lead, status, progress,
        start_date, due_date, objective, scope, controls, evidence, findings, risks
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
      [
        id,
        workspaceId,
        data.name.trim(),
        framework,
        lead,
        status,
        progress,
        startDate,
        dueDate,
        objective,
        scope,
        controls,
        evidence,
        findings,
        risks,
      ]
    );

    const createdAudit = {
      id,
      workspace_id: workspaceId,
      name: data.name.trim(),
      framework,
      lead,
      status,
      progress,
      start_date: startDate,
      due_date: dueDate,
      objective,
      scope,
      controls,
      evidence,
      findings,
      risks,
    };

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Audit",
      entityId: id,
      description: `Created audit "${data.name.trim()}" (${framework})`,
      details: { lead, status, framework, progress },
    });

    return { success: true, data: createdAudit };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create audit";
    return { success: false, error: message };
  }
}

export async function updateAudit(
  workspaceId: string,
  auditId: string,
  updates: UpdateAuditInput
) {
  if (!workspaceId || !auditId) {
    return { success: false, error: "Workspace ID and Audit ID are required" };
  }

  try {
    await requirePermission("audits.update", workspaceId);

    const existing = await db.queryOne<{ id: string; name: string; status: string }>(
      `SELECT * FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Audit not found" };
    }

    const setParts: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      values.push(updates.name.trim());
      setParts.push(`name = $${values.length}`);
    }
    if (updates.framework !== undefined) {
      values.push(updates.framework);
      setParts.push(`framework = $${values.length}`);
    }
    if (updates.lead !== undefined) {
      values.push(updates.lead);
      setParts.push(`lead = $${values.length}`);
    }
    if (updates.status !== undefined) {
      if (!VALID_AUDIT_STATUSES.includes(updates.status)) {
        return { success: false, error: "Invalid audit status" };
      }
      values.push(updates.status);
      setParts.push(`status = $${values.length}`);
    }
    if (updates.progress !== undefined) {
      values.push(Math.max(0, Math.min(100, Number(updates.progress) || 0)));
      setParts.push(`progress = $${values.length}`);
    }
    if (updates.startDate !== undefined) {
      values.push(updates.startDate);
      setParts.push(`start_date = $${values.length}`);
    }
    if (updates.dueDate !== undefined) {
      values.push(updates.dueDate);
      setParts.push(`due_date = $${values.length}`);
    }
    if (updates.objective !== undefined) {
      values.push(updates.objective);
      setParts.push(`objective = $${values.length}`);
    }
    if (updates.scope !== undefined) {
      values.push(updates.scope);
      setParts.push(`scope = $${values.length}`);
    }
    if (updates.controls !== undefined) {
      values.push(Number(updates.controls) || 0);
      setParts.push(`controls = $${values.length}`);
    }
    if (updates.evidence !== undefined) {
      values.push(Number(updates.evidence) || 0);
      setParts.push(`evidence = $${values.length}`);
    }
    if (updates.findings !== undefined) {
      values.push(Number(updates.findings) || 0);
      setParts.push(`findings = $${values.length}`);
    }
    if (updates.risks !== undefined) {
      values.push(Number(updates.risks) || 0);
      setParts.push(`risks = $${values.length}`);
    }

    if (setParts.length === 0) {
      return { success: true };
    }

    values.push(auditId);
    const auditIdParamIdx = values.length;
    values.push(workspaceId);
    const workspaceIdParamIdx = values.length;

    await db.execute(
      `UPDATE audits SET ${setParts.join(", ")} WHERE id = $${auditIdParamIdx} AND workspace_id = $${workspaceIdParamIdx}`,
      values
    );

    let desc = `Updated audit "${existing.name}"`;
    if (updates.status && updates.status !== existing.status) {
      desc = `Changed audit "${existing.name}" status from ${existing.status} to ${updates.status}`;
    }

    await logAuditEvent({
      workspaceId,
      action: updates.status && updates.status !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "Audit",
      entityId: auditId,
      description: desc,
      details: updates,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update audit";
    return { success: false, error: message };
  }
}

export async function deleteAudit(workspaceId: string, auditId: string) {
  if (!workspaceId || !auditId) {
    return { success: false, error: "Workspace ID and Audit ID are required" };
  }

  try {
    await requirePermission("audits.delete", workspaceId);

    const existing = await db.queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Audit not found" };
    }

    await db.execute(
      `DELETE FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Audit",
      entityId: auditId,
      description: `Deleted audit "${existing.name}" (${auditId})`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete audit";
    return { success: false, error: message };
  }
}
