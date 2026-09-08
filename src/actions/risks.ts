"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";

export type RiskLevel = "Critical" | "High" | "Medium" | "Low";
export type RiskStatus = "Open" | "In Treatment" | "Mitigated" | "Accepted" | "Closed";
export type RiskTreatment = "Mitigate" | "Accept" | "Transfer" | "Avoid";

export type RiskRecord = {
  id: string;
  workspace_id: string;
  audit_id: string;
  title: string;
  description: string;
  category: string;
  finding: string;
  framework: string;
  control: string;
  likelihood: string;
  impact: string;
  score: number;
  level: RiskLevel;
  treatment: string;
  owner: string;
  due_date: string;
  residual_score: number;
  residual_level: RiskLevel;
  status: RiskStatus;
  asset?: string;
  identified_date?: string;
  created_at: string;
  audit_name?: string;
};

export type CreateRiskInput = {
  auditId: string;
  title: string;
  description?: string;
  category?: string;
  finding?: string;
  framework?: string;
  control?: string;
  likelihood?: string;
  impact?: string;
  score?: number;
  level?: RiskLevel;
  treatment?: string;
  owner?: string;
  dueDate?: string;
  residualScore?: number;
  residualLevel?: RiskLevel;
  status?: RiskStatus;
  asset?: string;
  identifiedDate?: string;
};

export type UpdateRiskInput = {
  auditId?: string;
  title?: string;
  description?: string;
  category?: string;
  finding?: string;
  framework?: string;
  control?: string;
  likelihood?: string;
  impact?: string;
  score?: number;
  level?: RiskLevel;
  treatment?: string;
  owner?: string;
  dueDate?: string;
  residualScore?: number;
  residualLevel?: RiskLevel;
  status?: RiskStatus;
  asset?: string;
  identifiedDate?: string;
};

function ratingToNumber(val: string | number | undefined, defaultVal: number = 3): number {
  if (typeof val === "number") return Math.min(5, Math.max(1, val));
  if (!val) return defaultVal;
  const num = parseInt(val, 10);
  if (!isNaN(num)) return Math.min(5, Math.max(1, num));
  const map: Record<string, number> = {
    rare: 1,
    minimal: 1,
    unlikely: 2,
    minor: 2,
    possible: 3,
    moderate: 3,
    likely: 4,
    major: 4,
    "almost certain": 5,
    severe: 5,
    critical: 5,
  };
  return map[val.toLowerCase().trim()] || defaultVal;
}

function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 16) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

function updateAuditRiskCount(auditId: string, workspaceId: string) {
  try {
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM risks WHERE audit_id = ? AND workspace_id = ?`)
      .get(auditId, workspaceId) as { count: number } | undefined;
    const count = row?.count || 0;
    db.prepare(`UPDATE audits SET risks = ? WHERE id = ? AND workspace_id = ?`).run(
      count,
      auditId,
      workspaceId
    );
  } catch (err) {
    console.error("Failed to update audit risk count:", err);
  }
}

export async function getRisks(workspaceId: string, auditId?: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("risks.view", workspaceId);

    let query = `
      SELECT r.*, a.name as audit_name
      FROM risks r
      LEFT JOIN audits a ON r.audit_id = a.id
      WHERE r.workspace_id = ?
    `;
    const params: (string | number)[] = [workspaceId];

    if (auditId) {
      query += ` AND r.audit_id = ?`;
      params.push(auditId);
    }

    query += ` ORDER BY r.created_at DESC`;

    const risks = db.prepare(query).all(...params) as RiskRecord[];
    return { success: true, data: risks };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve risks";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function getRisk(workspaceId: string, riskId: string) {
  if (!workspaceId || !riskId) {
    return { success: false, error: "Workspace ID and Risk ID are required" };
  }

  try {
    await requirePermission("risks.view", workspaceId);

    const risk = db
      .prepare(
        `SELECT r.*, a.name as audit_name
         FROM risks r
         LEFT JOIN audits a ON r.audit_id = a.id
         WHERE r.id = ? AND r.workspace_id = ?`
      )
      .get(riskId, workspaceId) as RiskRecord | undefined;

    if (!risk) {
      return { success: false, error: "Risk not found" };
    }

    return { success: true, data: risk };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve risk";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function createRisk(workspaceId: string, data: CreateRiskInput) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("risks.create", workspaceId);

    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Risk title is required" };
    }

    // Verify audit exists and belongs to the workspace
    let auditId = data.auditId;
    if (!auditId) {
      // Find the first audit in the workspace if none provided
      const firstAudit = db
        .prepare(`SELECT id, framework, lead FROM audits WHERE workspace_id = ? LIMIT 1`)
        .get(workspaceId) as { id: string; framework: string; lead: string } | undefined;
      if (firstAudit) {
        auditId = firstAudit.id;
      } else {
        return { success: false, error: "An audit is required to associate with the risk" };
      }
    }

    const audit = db
      .prepare(`SELECT id, framework, lead FROM audits WHERE id = ? AND workspace_id = ?`)
      .get(auditId, workspaceId) as { id: string; framework: string; lead: string } | undefined;

    if (!audit) {
      return { success: false, error: "Audit not found in this workspace" };
    }

    const id = `RSK-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

    const likelihoodNum = ratingToNumber(data.likelihood, 3);
    const impactNum = ratingToNumber(data.impact, 3);
    const score = data.score !== undefined ? data.score : likelihoodNum * impactNum;
    const level = data.level || calculateRiskLevel(score);

    const likelihoodStr = typeof data.likelihood === "string" ? data.likelihood : String(likelihoodNum);
    const impactStr = typeof data.impact === "string" ? data.impact : String(impactNum);

    const status: RiskStatus = data.status || "Open";
    const residualScore =
      data.residualScore !== undefined
        ? data.residualScore
        : status === "Closed"
        ? 0
        : status === "Accepted" || status === "Mitigated"
        ? Math.max(1, Math.round(score * 0.4))
        : score;

    const residualLevel = data.residualLevel || calculateRiskLevel(residualScore);

    const title = data.title.trim();
    const description = data.description?.trim() || "Risk identified during audit assessment.";
    const category = data.category?.trim() || "Access Control";
    const finding = data.finding?.trim() || "";
    const framework = data.framework?.trim() || audit.framework || "ISO 27001";
    const control = data.control?.trim() || "A.5.15";
    const treatment = data.treatment?.trim() || "Mitigate";
    const owner = data.owner?.trim() || audit.lead || "Unassigned";
    const dueDate = data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const asset = data.asset?.trim() || "Core Infrastructure";
    const identifiedDate = data.identifiedDate || new Date().toISOString().split("T")[0];

    db.prepare(`
      INSERT INTO risks (
        id, workspace_id, audit_id, title, description, category, finding,
        framework, control, likelihood, impact, score, level, treatment,
        owner, due_date, residual_score, residual_level, status, asset, identified_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      workspaceId,
      auditId,
      title,
      description,
      category,
      finding,
      framework,
      control,
      likelihoodStr,
      impactStr,
      score,
      level,
      treatment,
      owner,
      dueDate,
      residualScore,
      residualLevel,
      status,
      asset,
      identifiedDate
    );

    updateAuditRiskCount(auditId, workspaceId);

    const createdRisk: RiskRecord = {
      id,
      workspace_id: workspaceId,
      audit_id: auditId,
      title,
      description,
      category,
      finding,
      framework,
      control,
      likelihood: likelihoodStr,
      impact: impactStr,
      score,
      level,
      treatment,
      owner,
      due_date: dueDate,
      residual_score: residualScore,
      residual_level: residualLevel,
      status,
      asset,
      identified_date: identifiedDate,
      created_at: new Date().toISOString(),
    };

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Risk",
      entityId: id,
      description: `Created risk "${title}" (Score: ${score}, Level: ${level})`,
      details: { score, level, treatment, status, category, owner },
    });

    return { success: true, data: createdRisk };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create risk";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function updateRisk(
  workspaceId: string,
  riskId: string,
  updates: UpdateRiskInput
) {
  if (!workspaceId || !riskId) {
    return { success: false, error: "Workspace ID and Risk ID are required" };
  }

  try {
    await requirePermission("risks.update", workspaceId);

    const existing = db
      .prepare(`SELECT * FROM risks WHERE id = ? AND workspace_id = ?`)
      .get(riskId, workspaceId) as RiskRecord | undefined;

    if (!existing) {
      return { success: false, error: "Risk not found" };
    }

    if (updates.auditId && updates.auditId !== existing.audit_id) {
      const audit = db
        .prepare(`SELECT id FROM audits WHERE id = ? AND workspace_id = ?`)
        .get(updates.auditId, workspaceId);
      if (!audit) {
        return { success: false, error: "Target audit not found in this workspace" };
      }
    }

    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const description = updates.description !== undefined ? updates.description : existing.description;
    const category = updates.category !== undefined ? updates.category : existing.category;
    const finding = updates.finding !== undefined ? updates.finding : existing.finding;
    const framework = updates.framework !== undefined ? updates.framework : existing.framework;
    const control = updates.control !== undefined ? updates.control : existing.control;
    const likelihood = updates.likelihood !== undefined ? String(updates.likelihood) : existing.likelihood;
    const impact = updates.impact !== undefined ? String(updates.impact) : existing.impact;
    const treatment = updates.treatment !== undefined ? updates.treatment : existing.treatment;
    const owner = updates.owner !== undefined ? updates.owner : existing.owner;
    const dueDate = updates.dueDate !== undefined ? updates.dueDate : existing.due_date;
    const status = (updates.status !== undefined ? updates.status : existing.status) as RiskStatus;
    const asset = updates.asset !== undefined ? updates.asset : existing.asset || "";
    const identifiedDate = updates.identifiedDate !== undefined ? updates.identifiedDate : existing.identified_date || "";
    const auditId = updates.auditId !== undefined ? updates.auditId : existing.audit_id;

    // Recalculate score and level if requested or if likelihood/impact changed
    const likelihoodNum = ratingToNumber(likelihood, 3);
    const impactNum = ratingToNumber(impact, 3);
    const score = updates.score !== undefined ? updates.score : likelihoodNum * impactNum;
    const level = updates.level || calculateRiskLevel(score);

    const residualScore =
      updates.residualScore !== undefined
        ? updates.residualScore
        : status === "Closed"
        ? 0
        : status === "Accepted" || status === "Mitigated"
        ? Math.max(1, Math.round(score * 0.4))
        : score;

    const residualLevel = updates.residualLevel || calculateRiskLevel(residualScore);

    db.prepare(`
      UPDATE risks
      SET audit_id = ?, title = ?, description = ?, category = ?, finding = ?,
          framework = ?, control = ?, likelihood = ?, impact = ?, score = ?,
          level = ?, treatment = ?, owner = ?, due_date = ?, residual_score = ?,
          residual_level = ?, status = ?, asset = ?, identified_date = ?
      WHERE id = ? AND workspace_id = ?
    `).run(
      auditId,
      title,
      description,
      category,
      finding,
      framework,
      control,
      likelihood,
      impact,
      score,
      level,
      treatment,
      owner,
      dueDate,
      residualScore,
      residualLevel,
      status,
      asset,
      identifiedDate,
      riskId,
      workspaceId
    );

    if (existing.audit_id !== auditId) {
      updateAuditRiskCount(existing.audit_id, workspaceId);
    }
    updateAuditRiskCount(auditId, workspaceId);

    let desc = `Updated risk "${title}"`;
    if (updates.status && updates.status !== existing.status) {
      desc = `Changed risk "${title}" status from ${existing.status} to ${updates.status}`;
    }

    await logAuditEvent({
      workspaceId,
      action: updates.status && updates.status !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "Risk",
      entityId: riskId,
      description: desc,
      details: updates,
    });

    return {
      success: true,
      data: {
        id: riskId,
        workspace_id: workspaceId,
        audit_id: auditId,
        title,
        description,
        category,
        finding,
        framework,
        control,
        likelihood,
        impact,
        score,
        level,
        treatment,
        owner,
        due_date: dueDate,
        residual_score: residualScore,
        residual_level: residualLevel,
        status,
        asset,
        identified_date: identifiedDate,
        created_at: existing.created_at,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update risk";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function deleteRisk(workspaceId: string, riskId: string) {
  if (!workspaceId || !riskId) {
    return { success: false, error: "Workspace ID and Risk ID are required" };
  }

  try {
    await requirePermission("risks.delete", workspaceId);

    const existing = db
      .prepare(`SELECT audit_id, title FROM risks WHERE id = ? AND workspace_id = ?`)
      .get(riskId, workspaceId) as { audit_id: string; title: string } | undefined;

    if (!existing) {
      return { success: false, error: "Risk not found" };
    }

    db.prepare(`DELETE FROM risks WHERE id = ? AND workspace_id = ?`).run(riskId, workspaceId);

    updateAuditRiskCount(existing.audit_id, workspaceId);

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Risk",
      entityId: riskId,
      description: `Deleted risk "${existing.title}" (${riskId})`,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete risk";
    return {
      success: false,
      error: msg,
    };
  }
}

