"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";

export type AssessmentStatus =
  | "Not Started"
  | "In Progress"
  | "Implemented"
  | "Partially Implemented"
  | "Not Implemented"
  | "Not Applicable";

const VALID_ASSESSMENT_STATUSES: readonly AssessmentStatus[] = [
  "Not Started",
  "In Progress",
  "Implemented",
  "Partially Implemented",
  "Not Implemented",
  "Not Applicable",
] as const;

export interface ControlAssessmentRecord {
  id: string;
  workspace_id: string;
  audit_id: string;
  control_id: string;
  control_title: string;
  control_domain: string;
  requirement: string;
  status: AssessmentStatus;
  assessor: string;
  notes: string;
  evidence_count: number;
  findings_count: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateAssessmentInput {
  status?: AssessmentStatus;
  assessor?: string;
  notes?: string;
}

export async function getAssessments(workspaceId: string, auditId: string) {
  if (!workspaceId || !auditId) {
    return { success: false, error: "Workspace ID and Audit ID are required" };
  }

  try {
    await requirePermission("assessments.view", workspaceId);

    // Verify audit belongs to workspace
    const audit = await db.queryOne<{ id: string; framework: string }>(
      `SELECT id, framework FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!audit) {
      return { success: false, error: "Audit not found in this workspace" };
    }

    // Check if assessments exist for this audit
    let rows = await db.query<ControlAssessmentRecord>(
      `
      SELECT ca.*,
        COALESCE((SELECT COUNT(*) FROM evidence e WHERE e.audit_id = ca.audit_id AND (e.control ILIKE '%' || ca.control_id || '%' OR e.control ILIKE '%' || ca.control_title || '%')), 0) as evidence_count,
        COALESCE((SELECT COUNT(*) FROM findings f WHERE f.audit_id = ca.audit_id AND (f.control ILIKE '%' || ca.control_id || '%' OR f.control ILIKE '%' || ca.control_title || '%')), 0) as findings_count
      FROM control_assessments ca
      WHERE ca.workspace_id = $1 AND ca.audit_id = $2
      ORDER BY ca.control_id ASC
      `,
      [workspaceId, auditId]
    );

    // If no assessments exist yet, initialize them from controls
    if (rows.length === 0) {
      await initializeAuditAssessments(workspaceId, auditId, audit.framework);
      rows = await db.query<ControlAssessmentRecord>(
        `
        SELECT ca.*,
          COALESCE((SELECT COUNT(*) FROM evidence e WHERE e.audit_id = ca.audit_id AND (e.control ILIKE '%' || ca.control_id || '%' OR e.control ILIKE '%' || ca.control_title || '%')), 0) as evidence_count,
          COALESCE((SELECT COUNT(*) FROM findings f WHERE f.audit_id = ca.audit_id AND (f.control ILIKE '%' || ca.control_id || '%' OR f.control ILIKE '%' || ca.control_title || '%')), 0) as findings_count
        FROM control_assessments ca
        WHERE ca.workspace_id = $1 AND ca.audit_id = $2
        ORDER BY ca.control_id ASC
        `,
        [workspaceId, auditId]
      );
    }

    const assessments = rows.map((r) => ({
      ...r,
      evidence_count: Number(r.evidence_count || 0),
      findings_count: Number(r.findings_count || 0),
    }));

    return { success: true, data: assessments };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch assessments";
    return { success: false, error: message };
  }
}

export async function initializeAuditAssessments(
  workspaceId: string,
  auditId: string,
  auditFramework: string
) {
  // Find applicable controls for this audit framework
  let applicableControls = await db.query<{
    id: string;
    title: string;
    description: string;
    domain: string;
  }>(
    `
    SELECT id, title, description, domain
    FROM controls
    WHERE (framework_short ILIKE '%' || $1 || '%' OR framework_name ILIKE '%' || $1 || '%')
      AND (workspace_id IS NULL OR workspace_id = $2)
    ORDER BY id ASC
    `,
    [auditFramework, workspaceId]
  );

  if (applicableControls.length === 0) {
    applicableControls = await db.query<{
      id: string;
      title: string;
      description: string;
      domain: string;
    }>(
      `SELECT id, title, description, domain FROM controls WHERE workspace_id IS NULL OR workspace_id = $1 LIMIT 12`,
      [workspaceId]
    );
  }

  for (const c of applicableControls) {
    const assessmentId = `ASM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await db.execute(
      `
      INSERT INTO control_assessments (
        id, workspace_id, audit_id, control_id, control_title, control_domain,
        requirement, status, assessor, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        assessmentId,
        workspaceId,
        auditId,
        c.id,
        c.title,
        c.domain,
        c.description,
        "Not Started",
        "",
        "",
      ]
    );
  }

  // Update audit control count in audits table
  await db.execute(
    `UPDATE audits SET controls = (SELECT COUNT(*) FROM control_assessments WHERE audit_id = $1) WHERE id = $2`,
    [auditId, auditId]
  );
}

export async function updateAssessment(
  workspaceId: string,
  assessmentId: string,
  auditId: string,
  updates: UpdateAssessmentInput
) {
  if (!workspaceId || !assessmentId || !auditId) {
    return { success: false, error: "Workspace ID, Assessment ID, and Audit ID are required" };
  }

  try {
    const auth = await requirePermission("assessments.update", workspaceId);

    const existing = await db.queryOne<ControlAssessmentRecord>(
      `SELECT * FROM control_assessments WHERE id = $1 AND audit_id = $2 AND workspace_id = $3`,
      [assessmentId, auditId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Assessment not found" };
    }

    if (updates.status && !VALID_ASSESSMENT_STATUSES.includes(updates.status)) {
      return {
        success: false,
        error: `Invalid assessment status. Must be one of: ${VALID_ASSESSMENT_STATUSES.join(", ")}`,
      };
    }

    const setParts: string[] = ["updated_at = CURRENT_TIMESTAMP"];
    const values: (string | null)[] = [];

    if (updates.status !== undefined) {
      values.push(updates.status);
      setParts.push(`status = $${values.length}`);
    }
    if (updates.assessor !== undefined) {
      values.push(updates.assessor.trim() || auth.user.name);
      setParts.push(`assessor = $${values.length}`);
    }
    if (updates.notes !== undefined) {
      values.push(updates.notes.trim());
      setParts.push(`notes = $${values.length}`);
    }

    values.push(assessmentId);
    const idIdx = values.length;
    values.push(workspaceId);
    const wsIdx = values.length;

    await db.execute(
      `UPDATE control_assessments SET ${setParts.join(", ")} WHERE id = $${idIdx} AND workspace_id = $${wsIdx}`,
      values
    );

    // Update audit progress based on completed assessments
    const statusCounts = await db.query<{ status: string; count: string | number }>(
      `SELECT status, COUNT(*) as count FROM control_assessments WHERE audit_id = $1 GROUP BY status`,
      [auditId]
    );

    let total = 0;
    let completed = 0;
    for (const sc of statusCounts) {
      const c = Number(sc.count);
      total += c;
      if (sc.status === "Implemented" || sc.status === "Not Applicable") {
        completed += c;
      } else if (sc.status === "Partially Implemented") {
        completed += c * 0.5;
      }
    }

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    await db.execute(`UPDATE audits SET progress = $1 WHERE id = $2 AND workspace_id = $3`, [
      progress,
      auditId,
      workspaceId,
    ]);

    await logAuditEvent({
      workspaceId,
      action: updates.status && updates.status !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "Assessment",
      entityId: assessmentId,
      description: `Updated assessment for control ${existing.control_id} (${existing.control_title}): ${updates.status || existing.status}`,
      details: { controlId: existing.control_id, oldStatus: existing.status, newStatus: updates.status },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update assessment";
    return { success: false, error: message };
  }
}
