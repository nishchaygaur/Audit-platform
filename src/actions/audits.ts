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
    const audits = db
      .prepare(
        `SELECT * FROM audits WHERE workspace_id = ? ORDER BY created_at DESC`
      )
      .all(workspaceId);
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
    const audit = db
      .prepare(`SELECT * FROM audits WHERE id = ? AND workspace_id = ?`)
      .get(auditId, workspaceId);

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

    db.prepare(`
      INSERT INTO audits (
        id, workspace_id, name, framework, lead, status, progress,
        start_date, due_date, objective, scope, controls, evidence, findings, risks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
      risks
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

    const existing = db
      .prepare(`SELECT * FROM audits WHERE id = ? AND workspace_id = ?`)
      .get(auditId, workspaceId) as { id: string; name: string; status: string } | undefined;

    if (!existing) {
      return { success: false, error: "Audit not found" };
    }

    const setParts: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      setParts.push("name = ?");
      values.push(updates.name.trim());
    }
    if (updates.framework !== undefined) {
      setParts.push("framework = ?");
      values.push(updates.framework);
    }
    if (updates.lead !== undefined) {
      setParts.push("lead = ?");
      values.push(updates.lead);
    }
    if (updates.status !== undefined) {
      if (!VALID_AUDIT_STATUSES.includes(updates.status)) {
        return { success: false, error: "Invalid audit status" };
      }
      setParts.push("status = ?");
      values.push(updates.status);
    }
    if (updates.progress !== undefined) {
      setParts.push("progress = ?");
      values.push(Math.max(0, Math.min(100, Number(updates.progress) || 0)));
    }
    if (updates.startDate !== undefined) {
      setParts.push("start_date = ?");
      values.push(updates.startDate);
    }
    if (updates.dueDate !== undefined) {
      setParts.push("due_date = ?");
      values.push(updates.dueDate);
    }
    if (updates.objective !== undefined) {
      setParts.push("objective = ?");
      values.push(updates.objective);
    }
    if (updates.scope !== undefined) {
      setParts.push("scope = ?");
      values.push(updates.scope);
    }
    if (updates.controls !== undefined) {
      setParts.push("controls = ?");
      values.push(Number(updates.controls) || 0);
    }
    if (updates.evidence !== undefined) {
      setParts.push("evidence = ?");
      values.push(Number(updates.evidence) || 0);
    }
    if (updates.findings !== undefined) {
      setParts.push("findings = ?");
      values.push(Number(updates.findings) || 0);
    }
    if (updates.risks !== undefined) {
      setParts.push("risks = ?");
      values.push(Number(updates.risks) || 0);
    }

    if (setParts.length === 0) {
      return { success: true };
    }

    values.push(auditId, workspaceId);
    db.prepare(
      `UPDATE audits SET ${setParts.join(", ")} WHERE id = ? AND workspace_id = ?`
    ).run(...values);

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

    const existing = db
      .prepare(`SELECT id, name FROM audits WHERE id = ? AND workspace_id = ?`)
      .get(auditId, workspaceId) as { id: string; name: string } | undefined;

    if (!existing) {
      return { success: false, error: "Audit not found" };
    }

    db.prepare(`DELETE FROM audits WHERE id = ? AND workspace_id = ?`).run(
      auditId,
      workspaceId
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
