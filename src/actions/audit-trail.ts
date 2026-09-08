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

    await db.execute(
      `
      INSERT INTO audit_trail (
        id, workspace_id, user_id, user_name, user_email, action,
        entity_type, entity_id, description, details, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
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
        new Date().toISOString(),
      ]
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

    let whereClause = `WHERE workspace_id = $1`;
    const params: unknown[] = [workspaceId];

    if (filters?.entityType && filters.entityType !== "All") {
      params.push(filters.entityType);
      whereClause += ` AND entity_type = $${params.length}`;
    }

    if (filters?.action && filters.action !== "All") {
      params.push(filters.action);
      whereClause += ` AND action = $${params.length}`;
    }

    if (filters?.userEmail && filters.userEmail !== "All") {
      params.push(filters.userEmail);
      whereClause += ` AND user_email = $${params.length}`;
    }

    if (filters?.search && filters.search.trim()) {
      const searchParam = `%${filters.search.trim()}%`;
      params.push(searchParam);
      const searchIdx = params.length;
      whereClause += ` AND (description ILIKE $${searchIdx} OR user_name ILIKE $${searchIdx} OR user_email ILIKE $${searchIdx} OR entity_id ILIKE $${searchIdx} OR details ILIKE $${searchIdx})`;
    }

    if (filters?.startDate) {
      params.push(filters.startDate);
      whereClause += ` AND created_at >= $${params.length}`;
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      whereClause += ` AND created_at <= $${params.length}`;
    }

    // Count total matching records for pagination using the current params
    const countQuery = `SELECT COUNT(*) as count FROM audit_trail ${whereClause}`;
    const totalRow = await db.queryOne<{ count: string | number }>(countQuery, [...params]);

    // Data query with ordering and pagination
    let dataQuery = `
      SELECT id, workspace_id, user_id, user_name, user_email, action,
             entity_type, entity_id, description, details, created_at
      FROM audit_trail
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const limit = filters?.limit ? Math.min(1000, Math.max(1, filters.limit)) : 200;
    const offset = filters?.offset ? Math.max(0, filters.offset) : 0;

    params.push(limit);
    dataQuery += ` LIMIT $${params.length}`;

    params.push(offset);
    dataQuery += ` OFFSET $${params.length}`;

    const records = await db.query<AuditTrailRecord>(dataQuery, params);
    const total = totalRow ? Number(totalRow.count) : records.length;

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

    const totalRow = await db.queryOne<{ count: string | number }>(
      `SELECT COUNT(*) as count FROM audit_trail WHERE workspace_id = $1`,
      [workspaceId]
    );

    const todayStr = new Date().toISOString().split("T")[0];
    const todayRow = await db.queryOne<{ count: string | number }>(
      `SELECT COUNT(*) as count FROM audit_trail WHERE workspace_id = $1 AND created_at >= $2`,
      [workspaceId, todayStr]
    );

    const rawEntityBreakdown = await db.query<{ entity_type: string; count: string | number }>(
      `SELECT entity_type, COUNT(*) as count FROM audit_trail WHERE workspace_id = $1 GROUP BY entity_type ORDER BY count DESC`,
      [workspaceId]
    );

    const rawActionBreakdown = await db.query<{ action: string; count: string | number }>(
      `SELECT action, COUNT(*) as count FROM audit_trail WHERE workspace_id = $1 GROUP BY action ORDER BY count DESC`,
      [workspaceId]
    );

    const entityBreakdown = rawEntityBreakdown.map((r) => ({
      entity_type: r.entity_type,
      count: Number(r.count),
    }));

    const actionBreakdown = rawActionBreakdown.map((r) => ({
      action: r.action,
      count: Number(r.count),
    }));

    return {
      success: true,
      data: {
        totalEvents: Number(totalRow?.count || 0),
        todayEvents: Number(todayRow?.count || 0),
        entityBreakdown,
        actionBreakdown,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve audit trail stats";
    return { success: false, error: message };
  }
}

