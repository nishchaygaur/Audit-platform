export type Role = "Owner" | "Admin" | "Auditor" | "Reviewer" | "Viewer";

export type Permission = 
  // User Management
  | "users.view" | "users.create" | "users.update" | "users.delete"
  // Workspace Administration
  | "workspace.manage"
  // Audits
  | "audits.view" | "audits.create" | "audits.update" | "audits.delete"
  // Audit Plans
  | "audit_plans.view" | "audit_plans.create" | "audit_plans.update" | "audit_plans.delete"
  // Control Assessments
  | "assessments.view" | "assessments.create" | "assessments.update"
  // Evidence
  | "evidence.view" | "evidence.create" | "evidence.update" | "evidence.delete"
  // Findings
  | "findings.view" | "findings.create" | "findings.update" | "findings.delete"
  // Risks
  | "risks.view" | "risks.create" | "risks.update" | "risks.delete"
  // Reports
  | "reports.view" | "reports.generate"
  // Audit Trail
  | "audit_trail.view"
  // Roles
  | "roles.manage";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Owner: [
    "users.view", "users.create", "users.update", "users.delete",
    "workspace.manage",
    "audits.view", "audits.create", "audits.update", "audits.delete",
    "audit_plans.view", "audit_plans.create", "audit_plans.update", "audit_plans.delete",
    "assessments.view", "assessments.create", "assessments.update",
    "evidence.view", "evidence.create", "evidence.update", "evidence.delete",
    "findings.view", "findings.create", "findings.update", "findings.delete",
    "risks.view", "risks.create", "risks.update", "risks.delete",
    "reports.view", "reports.generate",
    "audit_trail.view",
    "roles.manage",
  ],
  Admin: [
    "users.view", "users.create", "users.update", "users.delete",
    "workspace.manage",
    "audits.view", "audits.create", "audits.update", "audits.delete",
    "audit_plans.view", "audit_plans.create", "audit_plans.update", "audit_plans.delete",
    "assessments.view", "assessments.create", "assessments.update",
    "evidence.view", "evidence.create", "evidence.update", "evidence.delete",
    "findings.view", "findings.create", "findings.update", "findings.delete",
    "risks.view", "risks.create", "risks.update", "risks.delete",
    "reports.view", "reports.generate",
    "audit_trail.view",
    // Admins can manage roles, but there will be a separate check to prevent modifying Owner
    "roles.manage",
  ],
  Auditor: [
    "audits.view", "audits.create", "audits.update",
    "audit_plans.view", "audit_plans.create", "audit_plans.update",
    "assessments.view", "assessments.create", "assessments.update",
    "evidence.view", "evidence.create", "evidence.update", "evidence.delete",
    "findings.view", "findings.create", "findings.update",
    "risks.view", "risks.create", "risks.update",
    "reports.view", "reports.generate",
  ],
  Reviewer: [
    "audits.view", 
    "audit_plans.view", 
    "assessments.view", "assessments.update", // Reviewers can approve/update assessments
    "evidence.view", 
    "findings.view", "findings.update",
    "risks.view", "risks.update",
    "reports.view", "reports.generate",
  ],
  Viewer: [
    "users.view",
    "audits.view",
    "audit_plans.view",
    "assessments.view",
    "evidence.view",
    "findings.view",
    "risks.view",
    "reports.view",
    "audit_trail.view",
  ],
};

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions.includes(permission);
}
