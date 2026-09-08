"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { requirePermission } from "@/lib/server-rbac";
import crypto from "crypto";

// Returns true if the user has the required permission in the workspace
async function authorize(userId: string, workspaceId: string, permission: string) {
  const membership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(userId, workspaceId) as { role: string } | undefined;
  if (!membership) return false;
  return hasPermission(membership.role, permission);
}

export async function getAudits(workspaceId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  if (!authorize(session.user.id, workspaceId, "audits.view")) {
    return { error: "Permission denied" };
  }

  const audits = db.prepare(`SELECT * FROM audits WHERE workspace_id = ? ORDER BY created_at DESC`).all(workspaceId);
  return { success: true, data: audits };
}

export async function getAudit(workspaceId: string, auditId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  if (!authorize(session.user.id, workspaceId, "audits.view")) {
    return { error: "Permission denied" };
  }

  const audit = db.prepare(`SELECT * FROM audits WHERE id = ? AND workspace_id = ?`).get(auditId, workspaceId);
  if (!audit) return { error: "Audit not found" };

  return { success: true, data: audit };
}

export async function createAudit(workspaceId: string, data: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  if (!authorize(session.user.id, workspaceId, "audits.create")) {
    return { error: "Permission denied" };
  }

  const id = `AUD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

  try {
    db.prepare(`
      INSERT INTO audits (id, workspace_id, name, framework, lead, status, progress, start_date, due_date, objective, scope, controls, evidence, findings, risks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, workspaceId, data.name, data.framework, data.lead, data.status, data.progress || 0,
      data.startDate, data.dueDate, data.objective, data.scope, data.controls || 0, data.evidence || 0,
      data.findings || 0, data.risks || 0
    );
    return { success: true, data: { id, ...data } };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create audit" };
  }
}

export async function updateAudit(workspaceId: string, auditId: string, updates: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  if (!authorize(session.user.id, workspaceId, "audits.update")) {
    return { error: "Permission denied" };
  }

  const audit = db.prepare(`SELECT id FROM audits WHERE id = ? AND workspace_id = ?`).get(auditId, workspaceId);
  if (!audit) return { error: "Audit not found" };

  const setClause = Object.keys(updates).map(k => {
    if (k === 'startDate') return 'start_date = ?';
    if (k === 'dueDate') return 'due_date = ?';
    return `${k} = ?`;
  }).join(", ");
  const values = Object.values(updates);

  if (values.length === 0) return { success: true };

  try {
    db.prepare(`UPDATE audits SET ${setClause} WHERE id = ? AND workspace_id = ?`).run(...values, auditId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to update audit" };
  }
}

export async function deleteAudit(workspaceId: string, auditId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  if (!authorize(session.user.id, workspaceId, "audits.delete")) {
    return { error: "Permission denied" };
  }

  const audit = db.prepare(`SELECT id FROM audits WHERE id = ? AND workspace_id = ?`).get(auditId, workspaceId);
  if (!audit) return { error: "Audit not found" };

  try {
    db.prepare(`DELETE FROM audits WHERE id = ? AND workspace_id = ?`).run(auditId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to delete audit" };
  }
}
