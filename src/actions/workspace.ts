"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAuditEvent } from "./audit-trail";
import { hasPermission, type Role } from "@/lib/rbac";
import { requirePermission, requireRoleManagement } from "@/lib/server-rbac";

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

export async function addWorkspaceMember(workspaceId: string, email: string, role: string) {
  if (!workspaceId) return { error: "Unauthorized" };
  try {
    await requireRoleManagement(role as Role, workspaceId);
  } catch (err: any) {
    return { error: err.message };
  }

  const user = db.prepare(`SELECT id, name, email FROM users WHERE email = ?`).get(email) as { id: string; name: string; email: string } | undefined;
  if (!user) return { error: "User not found. Ask them to sign up first." };

  try {
    db.prepare(`INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES (?, ?, ?)`).run(user.id, workspaceId, role);

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Member",
      entityId: user.id,
      description: `Added workspace member ${user.name} (${user.email}) with role ${role}`,
      details: { memberId: user.id, email: user.email, role },
    });

    return { success: true };
  } catch (err: any) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return { error: "User is already in this workspace" };
    }
    return { error: "Failed to add member" };
  }
}

export async function updateWorkspaceMember(workspaceId: string, userId: string, role: string) {
  if (!workspaceId) return { error: "Unauthorized" };
  let auth;
  try {
    auth = await requireRoleManagement(role as Role, workspaceId);
  } catch (err: any) {
    return { error: err.message };
  }

  if (userId === auth.user.id) return { error: "Cannot change your own role" };

  const targetMembership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(userId, workspaceId) as { role: string } | undefined;
  if (!targetMembership) return { error: "User is not in this workspace" };

  if (targetMembership.role === "Owner" && auth.role !== "Owner") {
    return { error: "Permission denied: Only Owners can modify Owner roles" };
  }

  const targetUser = db.prepare(`SELECT name, email FROM users WHERE id = ?`).get(userId) as { name: string; email: string } | undefined;

  try {
    db.prepare(`UPDATE user_workspaces SET role = ? WHERE user_id = ? AND workspace_id = ?`).run(role, userId, workspaceId);

    await logAuditEvent({
      workspaceId,
      action: "STATUS_CHANGE",
      entityType: "Member",
      entityId: userId,
      description: `Changed role of member ${targetUser?.name || userId} from ${targetMembership.role} to ${role}`,
      details: { memberId: userId, oldRole: targetMembership.role, newRole: role },
    });

    return { success: true };
  } catch (err) {
    return { error: "Failed to update member" };
  }
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  if (!workspaceId) return { error: "Unauthorized" };
  let auth;
  try {
    auth = await requirePermission("workspace.manage", workspaceId);
  } catch (err: any) {
    return { error: err.message };
  }

  if (userId === auth.user.id) return { error: "Cannot remove yourself" };

  const targetMembership = db.prepare(`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).get(userId, workspaceId) as { role: string } | undefined;
  if (!targetMembership) return { error: "User is not in this workspace" };

  if (targetMembership.role === "Owner" && auth.role !== "Owner") {
    return { error: "Permission denied: Only Owners can remove Owners" };
  }

  const targetUser = db.prepare(`SELECT name, email FROM users WHERE id = ?`).get(userId) as { name: string; email: string } | undefined;

  try {
    db.prepare(`DELETE FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`).run(userId, workspaceId);

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Member",
      entityId: userId,
      description: `Removed member ${targetUser?.name || userId} (${targetUser?.email || ""}) from workspace`,
    });

    return { success: true };
  } catch (err) {
    return { error: "Failed to remove member" };
  }
}
