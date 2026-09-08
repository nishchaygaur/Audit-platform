import { getSession } from "@/lib/auth";
import { Permission, hasPermission, Role } from "./rbac";
import db from "./db";

export class AuthorizationError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requirePermission(permission: Permission, workspaceId: string) {
  if (!workspaceId) {
    throw new AuthorizationError("Forbidden: Workspace ID is required for authorization");
  }

  const session = await getSession();
  
  if (!session || !session.user) {
    throw new AuthorizationError("Unauthorized: No active session");
  }

  // Fetch the authoritative role from the DB for this specific workspace
  const membership = db.prepare('SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?').get(session.user.id, workspaceId) as { role: string } | undefined;

  if (!membership) {
    throw new AuthorizationError("Forbidden: User is not a member of this workspace");
  }

  const role = membership.role as Role;
  
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(`Forbidden: Requires ${permission} permission in this workspace`);
  }

  return { user: session.user, role };
}

export async function requireRoleManagement(targetRole: Role, workspaceId: string) {
  const auth = await requirePermission("roles.manage", workspaceId);
  
  // Owner Protection: Only Owners can grant or modify Owner status
  if (targetRole === "Owner" && auth.role !== "Owner") {
    throw new AuthorizationError("Forbidden: Only Owners can manage Owner roles");
  }
  
  return auth;
}
