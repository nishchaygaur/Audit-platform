"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getUserWorkspaces() {
  const session = await getSession();
  if (!session || !session.user) {
    return [];
  }

  const workspaces = db.prepare(`
    SELECT w.id, w.name, w.created_at, uw.role
    FROM workspaces w
    JOIN user_workspaces uw ON w.id = uw.workspace_id
    WHERE uw.user_id = ?
    ORDER BY w.name ASC
  `).all(session.user.id);

  return workspaces as { id: string; name: string; created_at: string; role: string }[];
}

export async function getWorkspaceMembers(workspaceId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) {
    return [];
  }

  // Validate that the user is a member of this workspace
  const membership = db.prepare(`
    SELECT role FROM user_workspaces 
    WHERE user_id = ? AND workspace_id = ?
  `).get(session.user.id, workspaceId);

  if (!membership) {
    return [];
  }

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, uw.role
    FROM users u
    JOIN user_workspaces uw ON u.id = uw.user_id
    WHERE uw.workspace_id = ?
  `).all(workspaceId);

  return members as { id: string; name: string; email: string; role: string }[];
}
import { hasPermission } from "@/lib/rbac";
import { requirePermission } from "@/lib/server-rbac";

export async function addWorkspaceMember(workspaceId: string, email: string, role: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  const membership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(session.user.id, workspaceId) as { role: string } | undefined;
  if (!membership || !hasPermission(membership.role, "workspace.manage")) return { error: "Permission denied" };

  const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email) as { id: string } | undefined;
  if (!user) return { error: "User not found. Ask them to sign up first." };

  try {
    db.prepare(`INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES (?, ?, ?)`).run(user.id, workspaceId, role);
    return { success: true };
  } catch (err: any) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return { error: "User is already in this workspace" };
    }
    return { error: "Failed to add member" };
  }
}

export async function updateWorkspaceMember(workspaceId: string, userId: string, role: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  const membership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(session.user.id, workspaceId) as { role: string } | undefined;
  if (!membership || !hasPermission(membership.role, "workspace.manage")) return { error: "Permission denied" };

  if (userId === session.user.id) return { error: "Cannot change your own role" };

  try {
    db.prepare(`UPDATE user_workspaces SET role = ? WHERE user_id = ? AND workspace_id = ?`).run(role, userId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to update member" };
  }
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) return { error: "Unauthorized" };

  const membership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(session.user.id, workspaceId) as { role: string } | undefined;
  if (!membership || !hasPermission(membership.role, "workspace.manage")) return { error: "Permission denied" };

  if (userId === session.user.id) return { error: "Cannot remove yourself" };

  try {
    db.prepare(`DELETE FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).run(userId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to remove member" };
  }
}
