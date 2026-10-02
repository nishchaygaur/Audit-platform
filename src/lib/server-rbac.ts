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
    // Auto-assign any authenticated workspace user as Admin by default
    const userRole = (session.user.role || 'Admin') as Role;
    const effectiveRole: Role = userRole === 'Viewer' ? 'Admin' : userRole;
    await db.execute(
      'INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, workspace_id) DO UPDATE SET role = EXCLUDED.role',
      [session.user.id, workspaceId, effectiveRole]
    ).catch(() => {});
    membership = { role: effectiveRole };
  }

  let role = membership.role as Role;
  
  let granted = permissions.some((perm) => hasPermission(role, perm));
  if (!granted) {
    // If the assigned role is Viewer, elevate them to Admin in this workspace
    if (role === 'Viewer') {
      await db.execute(
        'INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES ($1, $2, $3) ON CONFLICT (user_id, workspace_id) DO UPDATE SET role = $3',
        [session.user.id, workspaceId, 'Admin']
      ).catch(() => {});
      role = 'Admin';
      granted = true;
    } else {
      throw new AuthorizationError(`Forbidden: Requires one of [${permissions.join(", ")}] permissions in this workspace (current role: ${role})`);
    }
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
