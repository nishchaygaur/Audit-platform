"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/rbac";
import { requirePermission } from "@/lib/server-rbac";
import crypto from "crypto";

async function authorize(userId: string, workspaceId: string, permission: Permission) {
  const membership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(userId, workspaceId) as { role: string } | undefined;
  if (!membership) return false;
  return hasPermission(membership.role as any, permission);
}

export async function getEvidences(workspaceId: string, auditId?: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "evidence.view")) return { error: "Permission denied" };

  let query = `SELECT * FROM evidence WHERE workspace_id = ?`;
  const params: any[] = [workspaceId];
  
  if (auditId) {
    query += ` AND audit_id = ?`;
    params.push(auditId);
  }
  
  query += ` ORDER BY created_at DESC`;
  const evidences = db.prepare(query).all(...params);
  return { success: true, data: evidences };
}

export async function getEvidence(workspaceId: string, evidenceId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "evidence.view")) return { error: "Permission denied" };

  const evidence = db.prepare(`SELECT * FROM evidence WHERE id = ? AND workspace_id = ?`).get(evidenceId, workspaceId);
  if (!evidence) return { error: "Evidence not found" };

  return { success: true, data: evidence };
}

export async function createEvidence(workspaceId: string, data: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "evidence.create")) return { error: "Permission denied" };

  if (data.auditId) {
    const audit = db.prepare(`SELECT id FROM audits WHERE id = ? AND workspace_id = ?`).get(data.auditId, workspaceId);
    if (!audit) return { error: "Audit not found in this workspace" };
  } else {
    return { error: "auditId is required" };
  }

  const id = crypto.randomUUID();
  const reference = data.reference || `EV-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

  try {
    db.prepare(`
      INSERT INTO evidence (id, workspace_id, audit_id, reference, name, type, control, uploaded_by, date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, workspaceId, data.auditId, reference, data.name, data.type, data.control, data.uploadedBy, data.date, data.status
    );
    return { success: true, data: { id, reference, ...data } };
  } catch (err) {
    return { error: "Failed to create evidence" };
  }
}

export async function updateEvidence(workspaceId: string, evidenceId: string, updates: any) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "evidence.update")) return { error: "Permission denied" };

  const evidence = db.prepare(`SELECT id FROM evidence WHERE id = ? AND workspace_id = ?`).get(evidenceId, workspaceId);
  if (!evidence) return { error: "Evidence not found" };

  const setClause = Object.keys(updates).map(k => {
    if (k === 'auditId') return 'audit_id = ?';
    if (k === 'uploadedBy') return 'uploaded_by = ?';
    return `${k} = ?`;
  }).join(", ");
  const values = Object.values(updates);

  if (values.length === 0) return { success: true };

  try {
    db.prepare(`UPDATE evidence SET ${setClause} WHERE id = ? AND workspace_id = ?`).run(...values, evidenceId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to update evidence" };
  }
}

export async function deleteEvidence(workspaceId: string, evidenceId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };
  if (!authorize(session.user.id, workspaceId, "evidence.delete")) return { error: "Permission denied" };

  const evidence = db.prepare(`SELECT id FROM evidence WHERE id = ? AND workspace_id = ?`).get(evidenceId, workspaceId);
  if (!evidence) return { error: "Evidence not found" };

  try {
    db.prepare(`DELETE FROM evidence WHERE id = ? AND workspace_id = ?`).run(evidenceId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to delete evidence" };
  }
}
