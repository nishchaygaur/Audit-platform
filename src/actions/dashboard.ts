"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { AuditTrailRecord } from "./audit-trail";

export interface DashboardStats {
  audits: {
    total: number;
    planning: number;
    fieldwork: number;
    review: number;
    reporting: number;
    completed: number;
    recentList: {
      id: string;
      name: string;
      framework: string;
      status: string;
      progress: number;
      dueDate: string;
    }[];
  };
  findings: {
    total: number;
    open: number;
    inProgress: number;
    remediated: number;
    acceptedRisk: number;
    closed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  risks: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    open: number;
    inTreatment: number;
    mitigated: number;
    accepted: number;
  };
  evidence: {
    total: number;
    requested: number;
    submitted: number;
    underReview: number;
    accepted: number;
    rejected: number;
  };
  controls: {
    total: number;
    implemented: number;
    partiallyImplemented: number;
    notImplemented: number;
    inProgress: number;
    notStarted: number;
    notApplicable: number;
    compliancePercentage: number;
  };
  recentActivities: {
    id: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    createdAt: string;
  }[];
}

export async function getDashboardData(workspaceId: string): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audits.view", workspaceId);

    // 1. Audits
    const auditRows = await db.query<{
      id: string;
      name: string;
      framework: string;
      status: string;
      progress: number;
      due_date: string;
    }>(
      `SELECT id, name, framework, status, progress, due_date FROM audits WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspaceId]
    );

    let planning = 0;
    let fieldwork = 0;
    let review = 0;
    let reporting = 0;
    let completed = 0;

    for (const a of auditRows) {
      switch (a.status) {
        case "Planning": planning++; break;
        case "Fieldwork": fieldwork++; break;
        case "Review": review++; break;
        case "Reporting": reporting++; break;
        case "Completed": completed++; break;
      }
    }

    // 2. Findings
    const findingStatusRows = await db.query<{ status: string; count: string | number }>(
      `SELECT status, COUNT(*) as count FROM findings WHERE workspace_id = $1 GROUP BY status`,
      [workspaceId]
    );
    const findingSeverityRows = await db.query<{ severity: string; count: string | number }>(
      `SELECT severity, COUNT(*) as count FROM findings WHERE workspace_id = $1 GROUP BY severity`,
      [workspaceId]
    );

    let fOpen = 0, fInProgress = 0, fRemediated = 0, fAcceptedRisk = 0, fClosed = 0;
    for (const r of findingStatusRows) {
      const cnt = Number(r.count);
      switch (r.status) {
        case "Open": fOpen += cnt; break;
        case "In Progress": fInProgress += cnt; break;
        case "Remediated": fRemediated += cnt; break;
        case "Accepted Risk": fAcceptedRisk += cnt; break;
        case "Closed": fClosed += cnt; break;
      }
    }

    let fCrit = 0, fHigh = 0, fMed = 0, fLow = 0, fInfo = 0;
    for (const r of findingSeverityRows) {
      const cnt = Number(r.count);
      switch (r.severity) {
        case "Critical": fCrit += cnt; break;
        case "High": fHigh += cnt; break;
        case "Medium": fMed += cnt; break;
        case "Low": fLow += cnt; break;
        case "Informational": fInfo += cnt; break;
      }
    }

    // 3. Risks
    const riskLevelRows = await db.query<{ level: string; count: string | number }>(
      `SELECT level, COUNT(*) as count FROM risks WHERE workspace_id = $1 GROUP BY level`,
      [workspaceId]
    );
    const riskStatusRows = await db.query<{ status: string; count: string | number }>(
      `SELECT status, COUNT(*) as count FROM risks WHERE workspace_id = $1 GROUP BY status`,
      [workspaceId]
    );

    let rCrit = 0, rHigh = 0, rMed = 0, rLow = 0;
    for (const r of riskLevelRows) {
      const cnt = Number(r.count);
      switch (r.level) {
        case "Critical": rCrit += cnt; break;
        case "High": rHigh += cnt; break;
        case "Medium": rMed += cnt; break;
        case "Low": rLow += cnt; break;
      }
    }

    let rOpen = 0, rInTreatment = 0, rMitigated = 0, rAccepted = 0;
    for (const r of riskStatusRows) {
      const cnt = Number(r.count);
      switch (r.status) {
        case "Open": rOpen += cnt; break;
        case "In Treatment": rInTreatment += cnt; break;
        case "Mitigated": rMitigated += cnt; break;
        case "Accepted": rAccepted += cnt; break;
      }
    }

    // 4. Evidence
    const evidenceStatusRows = await db.query<{ status: string; count: string | number }>(
      `SELECT status, COUNT(*) as count FROM evidence WHERE workspace_id = $1 GROUP BY status`,
      [workspaceId]
    );

    let evRequested = 0, evSubmitted = 0, evUnderReview = 0, evAccepted = 0, evRejected = 0;
    for (const r of evidenceStatusRows) {
      const cnt = Number(r.count);
      switch (r.status) {
        case "Requested": evRequested += cnt; break;
        case "Submitted": evSubmitted += cnt; break;
        case "Under Review": evUnderReview += cnt; break;
        case "Accepted": evAccepted += cnt; break;
        case "Rejected": evRejected += cnt; break;
      }
    }

    // 5. Control Assessments
    const controlAssessmentRows = await db.query<{ status: string; count: string | number }>(
      `SELECT status, COUNT(*) as count FROM control_assessments WHERE workspace_id = $1 GROUP BY status`,
      [workspaceId]
    );

    let caImplemented = 0, caPartial = 0, caNotImplemented = 0, caInProgress = 0, caNotStarted = 0, caNA = 0;
    for (const r of controlAssessmentRows) {
      const cnt = Number(r.count);
      switch (r.status) {
        case "Implemented": caImplemented += cnt; break;
        case "Partially Implemented": caPartial += cnt; break;
        case "Not Implemented": caNotImplemented += cnt; break;
        case "In Progress": caInProgress += cnt; break;
        case "Not Started": caNotStarted += cnt; break;
        case "Not Applicable": caNA += cnt; break;
      }
    }

    const totalCA = caImplemented + caPartial + caNotImplemented + caInProgress + caNotStarted + caNA;
    const compliancePercentage = totalCA > 0 ? Math.round(((caImplemented + caPartial * 0.5) / totalCA) * 100) : 0;

    // 6. Recent Activities from audit_trail
    const recentActivitiesRows = await db.query<AuditTrailRecord>(
      `SELECT * FROM audit_trail WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 8`,
      [workspaceId]
    );

    const stats: DashboardStats = {
      audits: {
        total: auditRows.length,
        planning,
        fieldwork,
        review,
        reporting,
        completed,
        recentList: auditRows.slice(0, 5).map((a) => ({
          id: a.id,
          name: a.name,
          framework: a.framework,
          status: a.status,
          progress: a.progress,
          dueDate: a.due_date,
        })),
      },
      findings: {
        total: fOpen + fInProgress + fRemediated + fAcceptedRisk + fClosed,
        open: fOpen,
        inProgress: fInProgress,
        remediated: fRemediated,
        acceptedRisk: fAcceptedRisk,
        closed: fClosed,
        critical: fCrit,
        high: fHigh,
        medium: fMed,
        low: fLow,
        informational: fInfo,
      },
      risks: {
        total: rCrit + rHigh + rMed + rLow,
        critical: rCrit,
        high: rHigh,
        medium: rMed,
        low: rLow,
        open: rOpen,
        inTreatment: rInTreatment,
        mitigated: rMitigated,
        accepted: rAccepted,
      },
      evidence: {
        total: evRequested + evSubmitted + evUnderReview + evAccepted + evRejected,
        requested: evRequested,
        submitted: evSubmitted,
        underReview: evUnderReview,
        accepted: evAccepted,
        rejected: evRejected,
      },
      controls: {
        total: totalCA,
        implemented: caImplemented,
        partiallyImplemented: caPartial,
        notImplemented: caNotImplemented,
        inProgress: caInProgress,
        notStarted: caNotStarted,
        notApplicable: caNA,
        compliancePercentage,
      },
      recentActivities: recentActivitiesRows.map((r) => ({
        id: r.id,
        userName: r.user_name,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        description: r.description,
        createdAt: r.created_at,
      })),
    };

    return { success: true, data: stats };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard data";
    return { success: false, error: message };
  }
}
