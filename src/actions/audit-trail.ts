"use server";

import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/server-rbac";
import crypto from "crypto";

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "ACCESS"
  | "EXPORT";

export type AuditEntityType =
  | "Audit"
  | "Evidence"
  | "Finding"
  | "Risk"
  | "Member"
  | "Workspace"
  | "Report"
  | "Assessment";

export interface AuditTrailRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  details: string;
  created_at: string;
}

export interface LogAuditEventParams {
  workspaceId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  details?: string | Record<string, unknown>;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export interface AuditTrailFilters {
  search?: string;
  entityType?: string;
  action?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Server-side audit event logging helper.
 * Obtains authenticated user context securely from session.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<{ success: boolean; id?: string }> {
  const { workspaceId, action, entityType, entityId, description, details } = params;

  if (!workspaceId) {
    return { success: false };
  }

  try {
    let userId = params.userId;
    let userName = params.userName;
    let userEmail = params.userEmail;

    if (!userId || !userName || !userEmail) {
      const session = await getSession();
      if (session?.user) {
        userId = userId || session.user.id;
        userName = userName || session.user.name;
        userEmail = userEmail || session.user.email;
      }
    }

    userId = userId || "system";
    userName = userName || "System User";
    userEmail = userEmail || "system@auditplatform.local";

    const id = `TRL-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    let formattedDetails = "";
    if (typeof details === "string") {
      formattedDetails = details;
    } else if (details && typeof details === "object") {
      // Remove any sensitive keys if present
      const sanitized = { ...details };
      delete (sanitized as Record<string, unknown>).password;
      delete (sanitized as Record<string, unknown>).token;
      delete (sanitized as Record<string, unknown>).secret;
      formattedDetails = JSON.stringify(sanitized);
    }

    db.prepare(`
      INSERT INTO audit_trail (
        id, workspace_id, user_id, user_name, user_email, action,
        entity_type, entity_id, description, details, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      workspaceId,
      userId,
      userName,
      userEmail,
      action,
      entityType,
      entityId,
      description,
      formattedDetails,
      new Date().toISOString()
    );

    return { success: true, id };
  } catch (err: unknown) {
    console.error("Failed to log audit event:", err);
    return { success: false };
  }
}

/**
 * Retrieves audit trail records strictly scoped to the user's workspace.
 */
export async function getAuditTrail(
  workspaceId: string,
  filters?: AuditTrailFilters
): Promise<{ success: boolean; data?: AuditTrailRecord[]; total?: number; error?: string }> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audit_trail.view", workspaceId);

    let query = `
      SELECT id, workspace_id, user_id, user_name, user_email, action,
             entity_type, entity_id, description, details, created_at
      FROM audit_trail
      WHERE workspace_id = ?
    `;
    const params: (string | number)[] = [workspaceId];

    if (filters?.entityType && filters.entityType !== "All") {
      query += ` AND entity_type = ?`;
      params.push(filters.entityType);
    }

    if (filters?.action && filters.action !== "All") {
      query += ` AND action = ?`;
      params.push(filters.action);
    }

    if (filters?.userEmail && filters.userEmail !== "All") {
      query += ` AND user_email = ?`;
      params.push(filters.userEmail);
    }

    if (filters?.search && filters.search.trim()) {
      query += ` AND (description LIKE ? OR user_name LIKE ? OR user_email LIKE ? OR entity_id LIKE ? OR details LIKE ?)`;
      const searchParam = `%${filters.search.trim()}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (filters?.startDate) {
      query += ` AND created_at >= ?`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND created_at <= ?`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY created_at DESC`;

    const limit = filters?.limit ? Math.min(1000, Math.max(1, filters.limit)) : 200;
    const offset = filters?.offset ? Math.max(0, filters.offset) : 0;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const records = db.prepare(query).all(...params) as AuditTrailRecord[];

    // Count total matching records for pagination
    let countQuery = `SELECT COUNT(*) as count FROM audit_trail WHERE workspace_id = ?`;
    const countParams: (string | number)[] = [workspaceId];

    if (filters?.entityType && filters.entityType !== "All") {
      countQuery += ` AND entity_type = ?`;
      countParams.push(filters.entityType);
    }
    if (filters?.action && filters.action !== "All") {
      countQuery += ` AND action = ?`;
      countParams.push(filters.action);
    }
    if (filters?.userEmail && filters.userEmail !== "All") {
      countQuery += ` AND user_email = ?`;
      countParams.push(filters.userEmail);
    }
    if (filters?.search && filters.search.trim()) {
      countQuery += ` AND (description LIKE ? OR user_name LIKE ? OR user_email LIKE ? OR entity_id LIKE ? OR details LIKE ?)`;
      const searchParam = `%${filters.search.trim()}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }
    if (filters?.startDate) {
      countQuery += ` AND created_at >= ?`;
      countParams.push(filters.startDate);
    }
    if (filters?.endDate) {
      countQuery += ` AND created_at <= ?`;
      countParams.push(filters.endDate);
    }

    const totalRow = db.prepare(countQuery).get(...countParams) as { count: number } | undefined;
    const total = totalRow?.count || records.length;

    return { success: true, data: records, total };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve audit trail";
    return { success: false, error: message };
  }
}

/**
 * Returns summary statistics for the workspace's audit trail.
 */
export async function getAuditTrailStats(
  workspaceId: string
): Promise<{
  success: boolean;
  data?: {
    totalEvents: number;
    todayEvents: number;
    entityBreakdown: { entity_type: string; count: number }[];
    actionBreakdown: { action: string; count: number }[];
  };
  error?: string;
}> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audit_trail.view", workspaceId);

    const totalRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_trail WHERE workspace_id = ?`)
      .get(workspaceId) as { count: number } | undefined;

    const todayStr = new Date().toISOString().split("T")[0];
    const todayRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_trail WHERE workspace_id = ? AND created_at >= ?`)
      .get(workspaceId, todayStr) as { count: number } | undefined;

    const entityBreakdown = db
      .prepare(
        `SELECT entity_type, COUNT(*) as count FROM audit_trail WHERE workspace_id = ? GROUP BY entity_type ORDER BY count DESC`
      )
      .all(workspaceId) as { entity_type: string; count: number }[];

    const actionBreakdown = db
      .prepare(
        `SELECT action, COUNT(*) as count FROM audit_trail WHERE workspace_id = ? GROUP BY action ORDER BY count DESC`
      )
      .all(workspaceId) as { action: string; count: number }[];

    return {
      success: true,
      data: {
        totalEvents: totalRow?.count || 0,
        todayEvents: todayRow?.count || 0,
        entityBreakdown,
        actionBreakdown,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve audit trail stats";
    return { success: false, error: message };
  }
}
