"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAuditEvent } from "./audit-trail";
import { type Role } from "@/lib/rbac";
import { requirePermission, requireRoleManagement } from "@/lib/server-rbac";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function getUserWorkspaces() {
  const session = await getSession();
  if (!session || !session.user) {
    return [];
  }

  const workspaces = await db.query<{ id: string; name: string; created_at: string; role: string }>(`
    SELECT w.id, w.name, w.created_at, uw.role
    FROM workspaces w
    JOIN user_workspaces uw ON w.id = uw.workspace_id
    WHERE uw.user_id = $1
    ORDER BY w.name ASC
  `, [session.user.id]);

  return workspaces;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const session = await getSession();
  if (!session || !session.user || !workspaceId) {
    return [];
  }

  // Validate that the user is a member of this workspace
  const membership = await db.queryOne<{ role: string }>(`
    SELECT role FROM user_workspaces 
    WHERE user_id = $1 AND workspace_id = $2
  `, [session.user.id, workspaceId]);

  if (!membership) {
    return [];
  }

  const members = await db.query<{ id: string; name: string; email: string; role: string }>(`
    SELECT u.id, u.name, u.email, uw.role
    FROM users u
    JOIN user_workspaces uw ON u.id = uw.user_id
    WHERE uw.workspace_id = $1
  `, [workspaceId]);

  return members;
}

export async function addWorkspaceMember(workspaceId: string, email: string, role: string) {
  if (!workspaceId) return { error: "Unauthorized" };
  try {
    await requireRoleManagement(role as Role, workspaceId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { error: message };
  }

  const user = await db.queryOne<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE email = $1`,
    [email]
  );
  if (!user) return { error: "User not found. Ask them to sign up first." };

  try {
    await db.execute(
      `INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3)`,
      [user.id, workspaceId, role]
    );

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Member",
      entityId: user.id,
      description: `Added workspace member ${user.name} (${user.email}) with role ${role}`,
      details: { memberId: user.id, email: user.email, role },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("unique") || message.includes("duplicate") || message.includes("UNIQUE constraint failed")) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { error: message };
  }

  if (userId === auth.user.id) return { error: "Cannot change your own role" };

  const targetMembership = await db.queryOne<{ role: string }>(
    `SELECT role FROM user_workspaces WHERE user_id = $1 AND workspace_id = $2`,
    [userId, workspaceId]
  );
  if (!targetMembership) return { error: "User is not in this workspace" };

  if (targetMembership.role === "Owner" && auth.role !== "Owner") {
    return { error: "Permission denied: Only Owners can modify Owner roles" };
  }

  const targetUser = await db.queryOne<{ name: string; email: string }>(
    `SELECT name, email FROM users WHERE id = $1`,
    [userId]
  );

  try {
    await db.execute(
      `UPDATE user_workspaces SET role = $1 WHERE user_id = $2 AND workspace_id = $3`,
      [role, userId, workspaceId]
    );

    await logAuditEvent({
      workspaceId,
      action: "STATUS_CHANGE",
      entityType: "Member",
      entityId: userId,
      description: `Changed role of member ${targetUser?.name || userId} from ${targetMembership.role} to ${role}`,
      details: { memberId: userId, oldRole: targetMembership.role, newRole: role },
    });

    return { success: true };
  } catch {
    return { error: "Failed to update member" };
  }
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  if (!workspaceId) return { error: "Unauthorized" };
  let auth;
  try {
    auth = await requirePermission("workspace.manage", workspaceId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { error: message };
  }

  if (userId === auth.user.id) return { error: "Cannot remove yourself" };

  const targetMembership = await db.queryOne<{ role: string }>(
    `SELECT role FROM user_workspaces WHERE user_id = $1 AND workspace_id = $2`,
    [userId, workspaceId]
  );
  if (!targetMembership) return { error: "User is not in this workspace" };

  if (targetMembership.role === "Owner" && auth.role !== "Owner") {
    return { error: "Permission denied: Only Owners can remove Owners" };
  }

  const targetUser = await db.queryOne<{ name: string; email: string }>(
    `SELECT name, email FROM users WHERE id = $1`,
    [userId]
  );

  try {
    await db.execute(
      `DELETE FROM user_workspaces WHERE user_id = $1 AND workspace_id = $2`,
      [userId, workspaceId]
    );

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Member",
      entityId: userId,
      description: `Removed member ${targetUser?.name || userId} (${targetUser?.email || ""}) from workspace`,
    });

    return { success: true };
  } catch {
    return { error: "Failed to remove member" };
  }
}

export async function createWorkspace(data: {
  name: string;
  description?: string;
  framework?: string;
  industry?: string;
}) {
  const session = await getSession();
  if (!session || !session.user) {
    return { error: "Unauthorized: Please sign in first" };
  }

  const name = data.name?.trim();
  if (!name) {
    return { error: "Workspace name is required" };
  }

  const workspaceId = crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      await tx.execute(
        "INSERT INTO workspaces (id, name) VALUES ($1, $2)",
        [workspaceId, name]
      );

      await tx.execute(
        "INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3)",
        [session.user.id, workspaceId, "Owner"]
      );
    });

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Workspace",
      entityId: workspaceId,
      description: `Created workspace "${name}"`,
      details: {
        workspaceId,
        name,
        description: data.description || "",
        framework: data.framework || "ISO 27001",
        industry: data.industry || "Technology & SaaS",
      },
    });

    return {
      success: true,
      workspace: {
        id: workspaceId,
        name,
        description: data.description || "",
        role: "Owner",
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create workspace";
    return { error: message };
  }
}

export async function createUserWithWorkspaceMember(params: {
  workspaceId: string;
  name: string;
  email: string;
  password?: string;
  role: string;
}) {
  const { workspaceId, name, email, password, role } = params;
  if (!workspaceId) return { error: "Workspace ID is required" };

  let auth;
  try {
    auth = await requireRoleManagement(role as Role, workspaceId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return { error: message };
  }

  const normalizedEmail = email?.trim().toLowerCase();
  const trimmedName = name?.trim();
  if (!normalizedEmail || !trimmedName) {
    return { error: "Name and email are required" };
  }

  const rawPassword = password?.trim() || "Password123!";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  try {
    const result = await db.transaction(async (tx) => {
      // Check if user already exists
      let user = await tx.queryOne<{ id: string; name: string; email: string }>(
        "SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)",
        [normalizedEmail]
      );

      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        const newUserId = crypto.randomUUID();
        await tx.execute(
          "INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
          [newUserId, trimmedName, normalizedEmail, hashedPassword, "Viewer"]
        );
        user = { id: newUserId, name: trimmedName, email: normalizedEmail };
      }

      // Check if already member of workspace
      const existingMembership = await tx.queryOne<{ role: string }>(
        "SELECT role FROM user_workspaces WHERE user_id = $1 AND workspace_id = $2",
        [user.id, workspaceId]
      );

      if (existingMembership) {
        throw new Error("User is already a member of this workspace");
      }

      await tx.execute(
        "INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3)",
        [user.id, workspaceId, role]
      );

      return { user, isNewUser };
    });

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Member",
      entityId: result.user.id,
      description: `${result.isNewUser ? "Created user and assigned" : "Assigned"} member ${result.user.name} (${result.user.email}) with role ${role}`,
      details: { memberId: result.user.id, email: result.user.email, role, isNewUser: result.isNewUser },
    });

    return { success: true, user: result.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add member";
    return { error: message };
  }
}

