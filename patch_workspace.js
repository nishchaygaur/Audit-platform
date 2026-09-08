const fs = require('fs');
let code = fs.readFileSync('src/actions/workspace.ts', 'utf8');

// Replace everything from `import { hasPermission } ...` downwards.
const startIdx = code.indexOf('import { hasPermission }');
const keep = code.substring(0, startIdx);

const newCode = keep + `import { hasPermission, type Role } from "@/lib/rbac";
import { requirePermission, requireRoleManagement } from "@/lib/server-rbac";

export async function addWorkspaceMember(workspaceId: string, email: string, role: string) {
  if (!workspaceId) return { error: "Unauthorized" };
  try {
    await requireRoleManagement(role as Role, workspaceId);
  } catch (err: any) {
    return { error: err.message };
  }

  const user = db.prepare(\`SELECT id FROM users WHERE email = ?\`).get(email) as { id: string } | undefined;
  if (!user) return { error: "User not found. Ask them to sign up first." };

  try {
    db.prepare(\`INSERT INTO user_workspaces (user_id, workspace_id, role) VALUES (?, ?, ?)\`).run(user.id, workspaceId, role);
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

  const targetMembership = db.prepare(\`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?\`).get(userId, workspaceId) as { role: string } | undefined;
  if (!targetMembership) return { error: "User is not in this workspace" };

  if (targetMembership.role === "Owner" && auth.role !== "Owner") {
    return { error: "Permission denied: Only Owners can modify Owner roles" };
  }

  try {
    db.prepare(\`UPDATE user_workspaces SET role = ? WHERE user_id = ? AND workspace_id = ?\`).run(role, userId, workspaceId);
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

  const targetMembership = db.prepare(\`SELECT role FROM user_workspaces WHERE user_id = ? AND workspace_id = ?\`).get(userId, workspaceId) as { role: string } | undefined;
  if (!targetMembership) return { error: "User is not in this workspace" };

  if (targetMembership.role === "Owner" && auth.role !== "Owner") {
    return { error: "Permission denied: Only Owners can remove Owners" };
  }

  try {
    db.prepare(\`DELETE FROM user_workspaces WHERE user_id = ? AND workspace_id = ?\`).run(userId, workspaceId);
    return { success: true };
  } catch (err) {
    return { error: "Failed to remove member" };
  }
}
`;

fs.writeFileSync('src/actions/workspace.ts', newCode);
