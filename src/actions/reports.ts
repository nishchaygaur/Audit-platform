"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";
import crypto from "crypto";

export interface ReportSummaryStats {
  scopeCount: number;
  controlsCount: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  evidenceCount: number;
  findingsCount: number;
  risksCount: number;
  criticalFindings: number;
  highFindings: number;
  criticalRisks: number;
  highRisks: number;
}

export interface ReportContentData {
  organization: string;
  auditInformation: {
    id: string;
    name: string;
    lead: string;
    status: string;
    progress: number;
    startDate: string;
    dueDate: string;
  };
  scope: string;
  objectives: string;
  frameworks: string[];
  executiveSummary: string;
  controlAssessmentSummary: {
    total: number;
    implemented: number;
    partiallyImplemented: number;
    notImplemented: number;
    inProgress: number;
    notStarted: number;
    notApplicable: number;
    breakdown: {
      controlId: string;
      title: string;
      domain: string;
      status: string;
      notes: string;
    }[];
  };
  evidenceSummary: {
    total: number;
    accepted: number;
    underReview: number;
    submitted: number;
    requested: number;
    rejected: number;
    items: {
      reference: string;
      name: string;
      control: string;
      status: string;
      type: string;
    }[];
  };
  findingsSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
    items: {
      reference: string;
      title: string;
      severity: string;
      status: string;
      control: string;
      owner: string;
      recommendation: string;
    }[];
  };
  risksSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    items: {
      title: string;
      category: string;
      level: string;
      score: number;
      treatment: string;
      residualScore: number;
      status: string;
    }[];
  };
  recommendations: string[];
  conclusion: string;
  generatedAt: string;
  generatedBy: string;
}

export interface ReportRecord {
  id: string;
  workspace_id: string;
  audit_id: string;
  name: string;
  type: string;
  framework: string;
  generated_by: string;
  generated_date: string;
  status: string;
  size: string;
  summary_stats: ReportSummaryStats;
  content: ReportContentData;
  created_at: string;
  audit_name?: string;
}

export async function getReports(workspaceId: string, auditId?: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("reports.view", workspaceId);

    let query = `
      SELECT r.*, a.name as audit_name
      FROM reports r
      JOIN audits a ON r.audit_id = a.id
      WHERE r.workspace_id = $1 AND a.workspace_id = $2
    `;
    const params: unknown[] = [workspaceId, workspaceId];

    if (auditId) {
      params.push(auditId);
      query += ` AND r.audit_id = $${params.length}`;
    }

    query += ` ORDER BY r.created_at DESC`;

    const rows = await db.query<{
      id: string;
      workspace_id: string;
      audit_id: string;
      name: string;
      type: string;
      framework: string;
      generated_by: string;
      generated_date: string;
      status: string;
      size: string;
      summary_stats: string;
      content: string;
      created_at: string;
      audit_name: string;
    }>(query, params);

    const reports: ReportRecord[] = rows.map((r) => {
      let summary_stats: ReportSummaryStats;
      let content: ReportContentData;
      try {
        summary_stats = JSON.parse(r.summary_stats || "{}");
      } catch {
        summary_stats = {} as ReportSummaryStats;
      }
      try {
        content = JSON.parse(r.content || "{}");
      } catch {
        content = {} as ReportContentData;
      }

      return {
        ...r,
        summary_stats,
        content,
      };
    });

    return { success: true, data: reports };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch reports";
    return { success: false, error: message };
  }
}

export async function getReport(workspaceId: string, reportId: string) {
  if (!workspaceId || !reportId) {
    return { success: false, error: "Workspace ID and Report ID are required" };
  }

  try {
    await requirePermission("reports.view", workspaceId);

    const row = await db.queryOne<{
      id: string;
      workspace_id: string;
      audit_id: string;
      name: string;
      type: string;
      framework: string;
      generated_by: string;
      generated_date: string;
      status: string;
      size: string;
      summary_stats: string;
      content: string;
      created_at: string;
      audit_name: string;
    }>(
      `
      SELECT r.*, a.name as audit_name
      FROM reports r
      JOIN audits a ON r.audit_id = a.id
      WHERE r.id = $1 AND r.workspace_id = $2
      `,
      [reportId, workspaceId]
    );

    if (!row) {
      return { success: false, error: "Report not found" };
    }

    let summary_stats: ReportSummaryStats;
    let content: ReportContentData;
    try {
      summary_stats = JSON.parse(row.summary_stats || "{}");
    } catch {
      summary_stats = {} as ReportSummaryStats;
    }
    try {
      content = JSON.parse(row.content || "{}");
    } catch {
      content = {} as ReportContentData;
    }

    return {
      success: true,
      data: {
        ...row,
        summary_stats,
        content,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch report";
    return { success: false, error: message };
  }
}

export async function generateReport(
  workspaceId: string,
  auditId: string,
  reportType: string = "Audit Report",
  customName?: string
) {
  if (!workspaceId || !auditId) {
    return { success: false, error: "Workspace ID and Audit ID are required" };
  }

  try {
    const auth = await requirePermission("reports.generate", workspaceId);

    // 1. Fetch Workspace
    const workspace = await db.queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM workspaces WHERE id = $1`,
      [workspaceId]
    );

    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // 2. Fetch Audit
    const audit = await db.queryOne<{
      id: string;
      name: string;
      framework: string;
      lead: string;
      status: string;
      progress: number;
      start_date: string;
      due_date: string;
      objective: string;
      scope: string;
      controls: number;
      evidence: number;
      findings: number;
      risks: number;
    }>(
      `SELECT * FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!audit) {
      return { success: false, error: "Audit not found in this workspace" };
    }

    // 3. Fetch Real Control Assessments
    const assessments = await db.query<{
      control_id: string;
      control_title: string;
      control_domain: string;
      status: string;
      notes: string;
    }>(
      `SELECT control_id, control_title, control_domain, status, notes FROM control_assessments WHERE audit_id = $1 ORDER BY control_id ASC`,
      [auditId]
    );

    // 4. Fetch Real Evidence
    const evidenceRows = await db.query<{
      reference: string;
      name: string;
      control: string;
      status: string;
      type: string;
    }>(
      `SELECT reference, name, control, status, type FROM evidence WHERE audit_id = $1 ORDER BY created_at DESC`,
      [auditId]
    );

    // 5. Fetch Real Findings
    const findingsRows = await db.query<{
      reference: string;
      title: string;
      severity: string;
      status: string;
      control: string;
      owner: string;
      recommendation: string;
    }>(
      `SELECT reference, title, severity, status, control, owner, recommendation FROM findings WHERE audit_id = $1 ORDER BY severity DESC, created_at DESC`,
      [auditId]
    );

    // 6. Fetch Real Risks
    const risksRows = await db.query<{
      title: string;
      category: string;
      level: string;
      score: number;
      treatment: string;
      residual_score: number;
      status: string;
    }>(
      `SELECT title, category, level, score, treatment, residual_score, status FROM risks WHERE audit_id = $1 ORDER BY score DESC`,
      [auditId]
    );

    // Compute Assessment Breakdown
    let implemented = 0;
    let partiallyImplemented = 0;
    let notImplemented = 0;
    let inProgress = 0;
    let notStarted = 0;
    let notApplicable = 0;

    for (const a of assessments) {
      switch (a.status) {
        case "Implemented": implemented++; break;
        case "Partially Implemented": partiallyImplemented++; break;
        case "Not Implemented": notImplemented++; break;
        case "In Progress": inProgress++; break;
        case "Not Applicable": notApplicable++; break;
        default: notStarted++; break;
      }
    }

    // Compute Evidence Breakdown
    let acceptedEv = 0;
    let underReviewEv = 0;
    let submittedEv = 0;
    let requestedEv = 0;
    let rejectedEv = 0;

    for (const ev of evidenceRows) {
      switch (ev.status) {
        case "Accepted": acceptedEv++; break;
        case "Under Review": underReviewEv++; break;
        case "Submitted": submittedEv++; break;
        case "Rejected": rejectedEv++; break;
        default: requestedEv++; break;
      }
    }

    // Compute Findings Breakdown
    let criticalF = 0;
    let highF = 0;
    let mediumF = 0;
    let lowF = 0;
    let infoF = 0;

    for (const f of findingsRows) {
      switch (f.severity) {
        case "Critical": criticalF++; break;
        case "High": highF++; break;
        case "Medium": mediumF++; break;
        case "Low": lowF++; break;
        default: infoF++; break;
      }
    }

    // Compute Risks Breakdown
    let criticalR = 0;
    let highR = 0;
    let mediumR = 0;
    let lowR = 0;

    for (const r of risksRows) {
      switch (r.level) {
        case "Critical": criticalR++; break;
        case "High": highR++; break;
        case "Medium": mediumR++; break;
        default: lowR++; break;
      }
    }

    // Synthesize Executive Summary
    const totalControls = assessments.length || audit.controls;
    const compliantPct = totalControls > 0 ? Math.round(((implemented + partiallyImplemented * 0.5) / totalControls) * 100) : 0;
    const executiveSummary = `This ${reportType} provides an independent compliance and risk evaluation for ${workspace.name} under the ${audit.framework} framework. The audit "${audit.name}" has achieved an overall progress of ${audit.progress}%, with ${implemented} controls fully implemented and ${partiallyImplemented} controls partially implemented out of ${totalControls} evaluated. A total of ${findingsRows.length} findings (${criticalF} Critical, ${highF} High) and ${risksRows.length} risks (${criticalR} Critical, ${highR} High) were documented alongside ${evidenceRows.length} supporting evidence artifacts.`;

    // Synthesize Recommendations
    const recommendations: string[] = [];
    if (criticalF > 0 || highF > 0) {
      recommendations.push("Prioritize immediate containment and remediation of all Critical and High findings.");
    }
    if (notImplemented > 0) {
      recommendations.push(`Establish formal implementation plans and milestones for the ${notImplemented} not implemented controls.`);
    }
    if (underReviewEv > 0 || requestedEv > 0) {
      recommendations.push(`Expedite verification of ${underReviewEv} pending evidence submissions and follow up on ${requestedEv} outstanding evidence requests.`);
    }
    if (criticalR > 0) {
      recommendations.push("Conduct executive risk treatment reviews for high-exposure operational assets.");
    }
    recommendations.push("Conduct quarterly post-remediation assessments to validate sustainable control effectiveness.");

    // Synthesize Conclusion
    const conclusion = `Based on the audit fieldwork conducted between ${audit.start_date} and ${audit.due_date}, the overall compliance posture of ${workspace.name} for ${audit.framework} stands at approximately ${compliantPct}%. Continued commitment to addressing the identified findings and risk treatments will ensure sustained alignment with industry standards.`;

    const generatedDateStr = new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const reportId = `RPT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const reportName = customName?.trim() || `${audit.name} - ${reportType}`;

    const summaryStats: ReportSummaryStats = {
      scopeCount: 1,
      controlsCount: totalControls,
      compliantCount: implemented,
      partiallyCompliantCount: partiallyImplemented,
      nonCompliantCount: notImplemented,
      evidenceCount: evidenceRows.length,
      findingsCount: findingsRows.length,
      risksCount: risksRows.length,
      criticalFindings: criticalF,
      highFindings: highF,
      criticalRisks: criticalR,
      highRisks: highR,
    };

    const contentData: ReportContentData = {
      organization: workspace.name,
      auditInformation: {
        id: audit.id,
        name: audit.name,
        lead: audit.lead,
        status: audit.status,
        progress: audit.progress,
        startDate: audit.start_date,
        dueDate: audit.due_date,
      },
      scope: audit.scope || "Enterprise information systems and supporting organizational processes.",
      objectives: audit.objective || `Evaluate adherence to ${audit.framework} controls and identify security deficiencies.`,
      frameworks: [audit.framework],
      executiveSummary,
      controlAssessmentSummary: {
        total: totalControls,
        implemented,
        partiallyImplemented,
        notImplemented,
        inProgress,
        notStarted,
        notApplicable,
        breakdown: assessments.map((a) => ({
          controlId: a.control_id,
          title: a.control_title,
          domain: a.control_domain,
          status: a.status,
          notes: a.notes || "Assessed against framework baseline.",
        })),
      },
      evidenceSummary: {
        total: evidenceRows.length,
        accepted: acceptedEv,
        underReview: underReviewEv,
        submitted: submittedEv,
        requested: requestedEv,
        rejected: rejectedEv,
        items: evidenceRows.map((e) => ({
          reference: e.reference,
          name: e.name,
          control: e.control,
          status: e.status,
          type: e.type,
        })),
      },
      findingsSummary: {
        total: findingsRows.length,
        critical: criticalF,
        high: highF,
        medium: mediumF,
        low: lowF,
        informational: infoF,
        items: findingsRows.map((f) => ({
          reference: f.reference,
          title: f.title,
          severity: f.severity,
          status: f.status,
          control: f.control,
          owner: f.owner,
          recommendation: f.recommendation,
        })),
      },
      risksSummary: {
        total: risksRows.length,
        critical: criticalR,
        high: highR,
        medium: mediumR,
        low: lowR,
        items: risksRows.map((r) => ({
          title: r.title,
          category: r.category,
          level: r.level,
          score: r.score,
          treatment: r.treatment,
          residualScore: r.residual_score,
          status: r.status,
        })),
      },
      recommendations,
      conclusion,
      generatedAt: new Date().toISOString(),
      generatedBy: auth.user.name || "Audit Lead",
    };

    const size = `${(JSON.stringify(contentData).length / 1024).toFixed(1)} KB`;

    await db.execute(
      `
      INSERT INTO reports (
        id, workspace_id, audit_id, name, type, framework,
        generated_by, generated_date, status, summary_stats, content, size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        reportId,
        workspaceId,
        auditId,
        reportName,
        reportType,
        audit.framework,
        auth.user.name || audit.lead,
        generatedDateStr,
        "Completed",
        JSON.stringify(summaryStats),
        JSON.stringify(contentData),
        size,
      ]
    );

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Report",
      entityId: reportId,
      description: `Generated ${reportType} "${reportName}" for audit ${audit.id}`,
      details: { reportType, auditId, framework: audit.framework },
    });

    const createdRecord: ReportRecord = {
      id: reportId,
      workspace_id: workspaceId,
      audit_id: auditId,
      name: reportName,
      type: reportType,
      framework: audit.framework,
      generated_by: auth.user.name || audit.lead,
      generated_date: generatedDateStr,
      status: "Completed",
      size,
      summary_stats: summaryStats,
      content: contentData,
      created_at: new Date().toISOString(),
      audit_name: audit.name,
    };

    return { success: true, data: createdRecord };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate report";
    return { success: false, error: message };
  }
}

export async function deleteReport(workspaceId: string, reportId: string) {
  if (!workspaceId || !reportId) {
    return { success: false, error: "Workspace ID and Report ID are required" };
  }

  try {
    await requirePermission("reports.view", workspaceId);

    const existing = await db.queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM reports WHERE id = $1 AND workspace_id = $2`,
      [reportId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Report not found" };
    }

    await db.execute(`DELETE FROM reports WHERE id = $1 AND workspace_id = $2`, [reportId, workspaceId]);

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Report",
      entityId: reportId,
      description: `Deleted report "${existing.name}" (${reportId})`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete report";
    return { success: false, error: message };
  }
}
