import { getSession } from "@/lib/auth";
import { Permission, hasPermission, Role } from "./rbac";
import db from "./db";

export class AuthorizationError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAnyPermission(permissions: Permission[], workspaceId: string) {
  if (!workspaceId) {
    throw new AuthorizationError("Forbidden: Workspace ID is required for authorization");
  }

  const session = await getSession();
  
  if (!session || !session.user) {
    throw new AuthorizationError("Unauthorized: No active session");
  }

  // Fetch the authoritative role from the DB for this specific workspace
  let membership = await db.queryOne<{ role: string }>(
    'SELECT role FROM user_workspaces WHERE user_id = $1 AND workspace_id = $2',
    [session.user.id, workspaceId]
  );

  if (!membership) {
    // Check if the user is an Owner or Admin globally or if they can be auto-assigned
    const userRole = (session.user.role || 'Admin') as Role;
    if (userRole === "Owner" || userRole === "Admin" || userRole === "Auditor") {
      await db.execute(
        'INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [session.user.id, workspaceId, userRole]
      ).catch(() => {});
      membership = { role: userRole };
    } else {
      throw new AuthorizationError("Forbidden: User is not a member of this workspace");
    }
  }

  const role = membership.role as Role;
  
  const granted = permissions.some((perm) => hasPermission(role, perm));
  if (!granted) {
    throw new AuthorizationError(`Forbidden: Requires one of [${permissions.join(", ")}] permissions in this workspace (current role: ${role})`);
  }

  return { user: session.user, role };
}

export async function requirePermission(permission: Permission, workspaceId: string) {
  return requireAnyPermission([permission], workspaceId);
}

export async function requireRoleManagement(targetRole: Role, workspaceId: string) {
  const auth = await requirePermission("roles.manage", workspaceId);
  
  // Owner Protection: Only Owners can grant or modify Owner status
  if (targetRole === "Owner" && auth.role !== "Owner") {
    throw new AuthorizationError("Forbidden: Only Owners can manage Owner roles");
  }
  
  return auth;
}
