import { getSession } from "@/lib/auth";
import { Permission, hasPermission, Role } from "./rbac";

export class AuthorizationError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requirePermission(permission: Permission) {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new AuthorizationError("Unauthorized: No active session");
  }

  const role = session.user.role as Role;
  
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(`Forbidden: Requires ${permission} permission`);
  }

  return session.user;
}

export async function requireRoleManagement(targetRole: Role) {
  const user = await requirePermission("roles.manage");
  
  // Owner Protection: Only Owners can grant or modify Owner status
  if (targetRole === "Owner" && user.role !== "Owner") {
    throw new AuthorizationError("Forbidden: Only Owners can manage Owner roles");
  }
  
  return user;
}
