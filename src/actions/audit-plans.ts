"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";

export type PlanStatus = "Draft" | "Approved" | "In Progress" | "Active" | "Completed" | "Archived";

export interface AuditPlanRecord {
  id: string;
  workspace_id: string;
  audit_id?: string | null;
  name: string;
  description: string;
  framework: string;
  owner: string;
  start_date: string;
  end_date: string;
  audits_count: number;
  completed_count: number;
  status: PlanStatus;
  created_at: string;
}

export interface CreateAuditPlanInput {
  name: string;
  description?: string;
  framework: string;
  owner?: string;
  startDate?: string;
  endDate?: string;
  auditsCount?: number;
  completedCount?: number;
  status?: PlanStatus;
  auditId?: string;
}

export interface UpdateAuditPlanInput {
  name?: string;
  description?: string;
  framework?: string;
  owner?: string;
  startDate?: string;
  endDate?: string;
  auditsCount?: number;
  completedCount?: number;
  status?: PlanStatus;
  auditId?: string;
}

export async function getAuditPlans(workspaceId: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audit_plans.view", workspaceId);

    const plans = await db.query<AuditPlanRecord>(
      `SELECT * FROM audit_plans WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspaceId]
    );

    return { success: true, data: plans };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch audit plans";
    return { success: false, error: message };
  }
}

export async function getAuditPlan(workspaceId: string, planId: string) {
  if (!workspaceId || !planId) {
    return { success: false, error: "Workspace ID and Plan ID are required" };
  }

  try {
    await requirePermission("audit_plans.view", workspaceId);

    const plan = await db.queryOne<AuditPlanRecord>(
      `SELECT * FROM audit_plans WHERE id = $1 AND workspace_id = $2`,
      [planId, workspaceId]
    );

    if (!plan) {
      return { success: false, error: "Audit plan not found" };
    }

    return { success: true, data: plan };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch audit plan";
    return { success: false, error: message };
  }
}

export async function createAuditPlan(workspaceId: string, input: CreateAuditPlanInput) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    const auth = await requirePermission("audit_plans.create", workspaceId);

    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Audit plan name is required" };
    }

    const id = `PLN-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
    const name = input.name.trim();
    const description = input.description?.trim() || "";
    const framework = input.framework?.trim() || "ISO 27001";
    const owner = input.owner?.trim() || auth.user.name || "Unassigned";
    const startDate = input.startDate || new Date().toISOString().split("T")[0];
    const endDate = input.endDate || new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
    const auditsCount = Math.max(1, Number(input.auditsCount) || 1);
    const completedCount = Math.max(0, Number(input.completedCount) || 0);
    const status: PlanStatus = input.status || "Draft";
    const auditId = input.auditId || null;

    await db.execute(
      `
      INSERT INTO audit_plans (
        id, workspace_id, audit_id, name, description, framework,
        owner, start_date, end_date, audits_count, completed_count, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        id,
        workspaceId,
        auditId,
        name,
        description,
        framework,
        owner,
        startDate,
        endDate,
        auditsCount,
        completedCount,
        status,
      ]
    );

    const createdPlan: AuditPlanRecord = {
      id,
      workspace_id: workspaceId,
      audit_id: auditId,
      name,
      description,
      framework,
      owner,
      start_date: startDate,
      end_date: endDate,
      audits_count: auditsCount,
      completed_count: completedCount,
      status,
      created_at: new Date().toISOString(),
    };

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Audit",
      entityId: id,
      description: `Created audit plan "${name}" (${framework})`,
      details: { framework, owner, status, auditsCount },
    });

    return { success: true, data: createdPlan };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create audit plan";
    return { success: false, error: message };
  }
}

export async function updateAuditPlan(
  workspaceId: string,
  planId: string,
  updates: UpdateAuditPlanInput
) {
  if (!workspaceId || !planId) {
    return { success: false, error: "Workspace ID and Plan ID are required" };
  }

  try {
    await requirePermission("audit_plans.update", workspaceId);

    const existing = await db.queryOne<AuditPlanRecord>(
      `SELECT * FROM audit_plans WHERE id = $1 AND workspace_id = $2`,
      [planId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Audit plan not found" };
    }

    const setParts: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      values.push(updates.name.trim());
      setParts.push(`name = $${values.length}`);
    }
    if (updates.description !== undefined) {
      values.push(updates.description.trim());
      setParts.push(`description = $${values.length}`);
    }
    if (updates.framework !== undefined) {
      values.push(updates.framework.trim());
      setParts.push(`framework = $${values.length}`);
    }
    if (updates.owner !== undefined) {
      values.push(updates.owner.trim());
      setParts.push(`owner = $${values.length}`);
    }
    if (updates.startDate !== undefined) {
      values.push(updates.startDate);
      setParts.push(`start_date = $${values.length}`);
    }
    if (updates.endDate !== undefined) {
      values.push(updates.endDate);
      setParts.push(`end_date = $${values.length}`);
    }
    if (updates.auditsCount !== undefined) {
      values.push(Math.max(1, Number(updates.auditsCount) || 1));
      setParts.push(`audits_count = $${values.length}`);
    }
    if (updates.completedCount !== undefined) {
      values.push(Math.max(0, Number(updates.completedCount) || 0));
      setParts.push(`completed_count = $${values.length}`);
    }
    if (updates.status !== undefined) {
      values.push(updates.status);
      setParts.push(`status = $${values.length}`);
    }
    if (updates.auditId !== undefined) {
      values.push(updates.auditId || null);
      setParts.push(`audit_id = $${values.length}`);
    }

    if (setParts.length === 0) {
      return { success: true, data: existing };
    }

    values.push(planId);
    const planIdIdx = values.length;
    values.push(workspaceId);
    const workspaceIdIdx = values.length;

    await db.execute(
      `UPDATE audit_plans SET ${setParts.join(", ")} WHERE id = $${planIdIdx} AND workspace_id = $${workspaceIdIdx}`,
      values
    );

    const updated = await db.queryOne<AuditPlanRecord>(
      `SELECT * FROM audit_plans WHERE id = $1 AND workspace_id = $2`,
      [planId, workspaceId]
    );

    let desc = `Updated audit plan "${existing.name}"`;
    if (updates.status && updates.status !== existing.status) {
      desc = `Changed audit plan "${existing.name}" status from ${existing.status} to ${updates.status}`;
    }

    await logAuditEvent({
      workspaceId,
      action: updates.status && updates.status !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "Audit",
      entityId: planId,
      description: desc,
      details: updates as Record<string, unknown>,
    });

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update audit plan";
    return { success: false, error: message };
  }
}

export async function deleteAuditPlan(workspaceId: string, planId: string) {
  if (!workspaceId || !planId) {
    return { success: false, error: "Workspace ID and Plan ID are required" };
  }

  try {
    await requirePermission("audit_plans.delete", workspaceId);

    const existing = await db.queryOne<AuditPlanRecord>(
      `SELECT id, name FROM audit_plans WHERE id = $1 AND workspace_id = $2`,
      [planId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Audit plan not found" };
    }

    await db.execute(
      `DELETE FROM audit_plans WHERE id = $1 AND workspace_id = $2`,
      [planId, workspaceId]
    );

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Audit",
      entityId: planId,
      description: `Deleted audit plan "${existing.name}" (${planId})`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete audit plan";
    return { success: false, error: message };
  }
}
