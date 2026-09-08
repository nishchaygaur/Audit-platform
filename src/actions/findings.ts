"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { requirePermission } from "@/lib/server-rbac";
import crypto from "crypto";

async function authorize(userId: string, workspaceId: string, permission: string) {
  const membership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(userId, workspaceId) as { role: string } | undefined;
  if (!membership) return false;
  return hasPermission(membership.role, permission);
}

export async function getFindings(workspaceId: string, auditId?: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "findings.view")) return { error: "Permission denied" };

  let query = `SELECT * FROM findings WHERE workspace_id = ?`;
  const params: any[] = [workspaceId];
  
  if (auditId) {
    query += ` AND audit_id = ?`;
    params.push(auditId);
  }
  
  query += ` ORDER BY created_at DESC`;
  const findings = db.prepare(query).all(...params);
  return { success: true, data: findings };
}

export async function getFinding(workspaceId: string, findingId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "findings.view")) return { error: "Permission denied" };

  const finding = db.prepare(`SELECT * FROM findings WHERE id = ? AND workspace_id = ?`).get(findingId, workspaceId);
  if (!finding) return { error: "Finding not found" };

  return { success: true, data: finding };
}

export async function createFinding(workspaceId: string, data: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "findings.create")) return { error: "Permission denied" };

  // Validate that the audit belongs to the workspace
  if (data.auditId) {
    const audit = db.prepare(`SELECT id FROM audits WHERE id = ? AND workspace_id = ?`).get(data.auditId, workspaceId);
    if (!audit) return { error: "Audit not found in this workspace" };
  } else {
      return { error: "auditId is required" };
  }

  const id = crypto.randomUUID();
  const reference = data.reference || `FND-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

  try {
    db.prepare(`
      INSERT INTO findings (id, workspace_id, audit_id, reference, title, description, framework, control, severity, owner, identified_date, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, workspaceId, data.auditId, reference, data.title, data.description, data.framework, data.control,
      data.severity, data.owner, data.identifiedDate, data.dueDate, data.status
    );
    return { success: true, data: { id, reference, ...data } };
  } catch (err) {
    return { error: "Failed to create finding" };
  }
}

export async function updateFinding(workspaceId: string, findingId: string, updates: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "findings.update")) return { error: "Permission denied" };

  const finding = db.prepare(`SELECT id FROM findings WHERE id = ? AND workspace_id = ?`).get(findingId, workspaceId);
  if (!finding) return { error: "Finding not found" };

  const setClause = Object.keys(updates).map(k => {
    if (k === 'identifiedDate') return 'identified_date = ?';
    if (k === 'dueDate') return 'due_date = ?';
    if (k === 'auditId') return 'audit_id = ?';
    return `${k} = ?`;
  }).join(", ");
  const values = Object.values(updates);

  if (values.length === 0) return { success: true };

  try {
    db.prepare(`UPDATE findings SET ${setClause} WHERE id = ? AND workspace_id = ?`).run(...values, findingId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to update finding" };
  }
}

export async function deleteFinding(workspaceId: string, findingId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "findings.delete")) return { error: "Permission denied" };

  const finding = db.prepare(`SELECT id FROM findings WHERE id = ? AND workspace_id = ?`).get(findingId, workspaceId);
  if (!finding) return { error: "Finding not found" };

  try {
    db.prepare(`DELETE FROM findings WHERE id = ? AND workspace_id = ?`).run(findingId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to delete finding" };
  }
}
