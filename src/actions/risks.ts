"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission, type Permission, type Role } from "@/lib/rbac";
import { requirePermission } from "@/lib/server-rbac";
import crypto from "crypto";

async function authorize(userId: string, workspaceId: string, permission: Permission) {
  const membership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(userId, workspaceId) as { role: string } | undefined;
  if (!membership) return false;
  return hasPermission(membership.role as Role, permission);
}

export async function getRisks(workspaceId: string, auditId?: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "risks.view")) return { error: "Permission denied" };

  let query = `SELECT * FROM risks WHERE workspace_id = ?`;
  const params: any[] = [workspaceId];
  
  if (auditId) {
    query += ` AND audit_id = ?`;
    params.push(auditId);
  }
  
  query += ` ORDER BY created_at DESC`;
  const risks = db.prepare(query).all(...params);
  return { success: true, data: risks };
}

export async function getRisk(workspaceId: string, riskId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "risks.view")) return { error: "Permission denied" };

  const risk = db.prepare(`SELECT * FROM risks WHERE id = ? AND workspace_id = ?`).get(riskId, workspaceId);
  if (!risk) return { error: "Risk not found" };

  return { success: true, data: risk };
}

export async function createRisk(workspaceId: string, data: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "risks.create")) return { error: "Permission denied" };

  if (data.auditId) {
    const audit = db.prepare(`SELECT id FROM audits WHERE id = ? AND workspace_id = ?`).get(data.auditId, workspaceId);
    if (!audit) return { error: "Audit not found in this workspace" };
  } else {
    return { error: "auditId is required" };
  }

  const id = `RSK-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

  try {
    db.prepare(`
      INSERT INTO risks (id, workspace_id, audit_id, title, description, category, finding, framework, control, likelihood, impact, score, level, treatment, owner, due_date, residual_score, residual_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, workspaceId, data.auditId, data.title, data.description, data.category, data.finding, data.framework, data.control,
      data.likelihood, data.impact, data.score, data.level, data.treatment, data.owner, data.dueDate, data.residualScore,
      data.residualLevel, data.status
    );
    return { success: true, data: { id, ...data } };
  } catch (err) {
    return { error: "Failed to create risk" };
  }
}

export async function updateRisk(workspaceId: string, riskId: string, updates: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "risks.update")) return { error: "Permission denied" };

  const risk = db.prepare(`SELECT id FROM risks WHERE id = ? AND workspace_id = ?`).get(riskId, workspaceId);
  if (!risk) return { error: "Risk not found" };

  const setClause = Object.keys(updates).map(k => {
    if (k === 'auditId') return 'audit_id = ?';
    if (k === 'dueDate') return 'due_date = ?';
    if (k === 'residualScore') return 'residual_score = ?';
    if (k === 'residualLevel') return 'residual_level = ?';
    return `${k} = ?`;
  }).join(", ");
  const values = Object.values(updates);

  if (values.length === 0) return { success: true };

  try {
    db.prepare(`UPDATE risks SET ${setClause} WHERE id = ? AND workspace_id = ?`).run(...values, riskId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to update risk" };
  }
}

export async function deleteRisk(workspaceId: string, riskId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "risks.delete")) return { error: "Permission denied" };

  const risk = db.prepare(`SELECT id FROM risks WHERE id = ? AND workspace_id = ?`).get(riskId, workspaceId);
  if (!risk) return { error: "Risk not found" };

  try {
    db.prepare(`DELETE FROM risks WHERE id = ? AND workspace_id = ?`).run(riskId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to delete risk" };
  }
}
