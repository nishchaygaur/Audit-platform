"use client";

import React from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileCheck,
  FileText,
  Printer,
  Shield,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import type { ReportRecord } from "@/actions/reports";
import { downloadReportPdf } from "@/lib/pdf-generator";

interface AuditReportViewerProps {
  report: ReportRecord;
  onClose: () => void;
  onDownloadJson?: (report: ReportRecord) => void;
}

export default function AuditReportViewer({
  report,
  onClose,
  onDownloadJson,
}: AuditReportViewerProps) {
  const content = report.content || {};
  const stats = report.summary_stats || {};

  const organization = content.organization || "Enterprise Organization";
  const auditInfo = content.auditInformation || {
    id: report.audit_id || "AUD-001",
    name: report.audit_name || report.name,
    lead: report.generated_by || "Lead Auditor",
    status: report.status || "Completed",
    progress: 100,
    startDate: "2026-01-01",
    dueDate: "2026-12-31",
  };
  const scope =
    content.scope ||
    "Enterprise cloud infrastructure, data processing environments, and administrative access controls.";
  const objectives =
    content.objectives ||
    `Evaluate compliance posture against ${report.framework || "ISO 27001"} and provide risk remediation roadmap.`;
  const frameworks =
    content.frameworks && content.frameworks.length > 0
      ? content.frameworks
      : [report.framework || "ISO 27001"];
  const executiveSummary =
    content.executiveSummary ||
    `This report provides an independent compliance and risk evaluation for ${organization} under ${report.framework}.`;
  const assessments = content.controlAssessmentSummary?.breakdown || [];
  const evidenceItems = content.evidenceSummary?.items || [];
  const findingsItems = content.findingsSummary?.items || [];
  const risksItems = content.risksSummary?.items || [];
  const recommendations = content.recommendations || [
    "Prioritize containment and remediation of all Critical and High findings.",
    "Establish formal implementation plans and milestones for not-implemented controls.",
    "Conduct quarterly post-remediation assessments to validate sustainable control effectiveness.",
  ];
  const conclusion =
    content.conclusion ||
    `Based on the audit fieldwork conducted, the compliance posture stands aligned with applicable framework baselines subject to prompt remediation of identified findings.`;

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    if (onDownloadJson) {
      onDownloadJson(report);
    } else {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `${report.id}_${report.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  }

  return (
    <div
      data-testid="audit-report-viewer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Shield size={16} className="text-slate-900" />
            <span>Formal Audit Report</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-500">{report.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadReportPdf(report)}
              data-testid="download-pdf-button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition"
            >
              <Download size={14} />
              Download PDF
            </button>

            <button
              onClick={handlePrint}
              data-testid="print-report-button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <Printer size={14} />
              Print / PDF
            </button>

            <button
              onClick={handleDownload}
              data-testid="download-json-button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <Download size={14} />
              Download JSON
            </button>

            <button
              onClick={onClose}
              data-testid="close-report-button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 sm:px-12 sm:py-10 space-y-10 text-slate-900 print:overflow-visible print:px-0 print:py-0">
          {/* Section 1: Organization & Report Header */}
          <section data-testid="report-section-organization" className="border-b border-slate-200 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
                  <Building2 size={13} />
                  <span>{organization}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {report.name}
                </h1>
                <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                  Official Compliance & Internal Controls Assurance Report
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5 min-w-[220px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Report ID:</span>
                  <span className="font-mono font-medium text-slate-800">{report.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-medium text-slate-800">{report.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Generated:</span>
                  <span className="font-medium text-slate-800">{report.generated_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-semibold text-rose-600">CONFIDENTIAL</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Audit Information */}
          <section data-testid="report-section-audit-info" className="space-y-4">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" />
              1. Audit Information
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Audit Name</span>
                <p className="mt-1 font-semibold text-sm text-slate-900">{auditInfo.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{auditInfo.id}</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Lead Auditor</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <User size={15} className="text-slate-500" />
                  <p className="font-semibold text-sm text-slate-900">{auditInfo.lead}</p>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{organization}</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Fieldwork Window</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <Calendar size={15} className="text-slate-500" />
                  <p className="font-semibold text-sm text-slate-900">
                    {auditInfo.startDate} – {auditInfo.dueDate}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Lifecycle Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={12} />
                    {auditInfo.status}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{auditInfo.progress}%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 & 4: Scope & Objectives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section data-testid="report-section-scope" className="rounded-xl border border-slate-200 p-5 bg-white space-y-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                2. Audit Scope
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{scope}</p>
            </section>

            <section data-testid="report-section-objectives" className="rounded-xl border border-slate-200 p-5 bg-white space-y-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-600" />
                3. Audit Objectives
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{objectives}</p>
            </section>
          </div>

          {/* Section 5: Frameworks Evaluated */}
          <section data-testid="report-section-frameworks" className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Shield size={18} className="text-purple-600" />
              4. Frameworks Evaluated
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {frameworks.map((fw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3.5 py-2 text-sm font-semibold text-purple-900"
                >
                  <Shield size={16} className="text-purple-600" />
                  {fw}
                </span>
              ))}
            </div>
          </section>

          {/* Section 6: Executive Summary */}
          <section data-testid="report-section-executive-summary" className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-6">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 size={18} className="text-slate-800" />
              5. Executive Summary
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{executiveSummary}</p>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Controls Evaluated</span>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.controlsCount ?? assessments.length}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Evidence Verified</span>
                <p className="text-2xl font-bold text-emerald-700 mt-0.5">{stats.evidenceCount ?? evidenceItems.length}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Findings Raised</span>
                <p className="text-2xl font-bold text-rose-600 mt-0.5">{stats.findingsCount ?? findingsItems.length}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Active Risks</span>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats.risksCount ?? risksItems.length}</p>
              </div>
            </div>
          </section>

          {/* Section 7: Control Assessment Summary + Breakdown */}
          <section data-testid="report-section-controls" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-600" />
                6. Control Assessment Summary & Breakdown
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Total: {assessments.length} controls
              </span>
            </div>

            {assessments.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">
                No individual control assessments recorded for this audit.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Control ID</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Domain</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Auditor Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessments.map((ctrl, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{ctrl.controlId}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{ctrl.title}</td>
                        <td className="px-4 py-3 text-slate-600">{ctrl.domain}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 font-semibold text-[11px] ${
                              ctrl.status === "Implemented"
                                ? "bg-emerald-50 text-emerald-700"
                                : ctrl.status === "Partially Implemented"
                                ? "bg-amber-50 text-amber-700"
                                : ctrl.status === "In Progress"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {ctrl.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{ctrl.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 8: Evidence Summary + Items List */}
          <section data-testid="report-section-evidence" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-600" />
                7. Evidence Summary & Artifacts
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Total: {evidenceItems.length} items
              </span>
            </div>

            {evidenceItems.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">
                No evidence artifacts attached to this audit.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Evidence Name</th>
                      <th className="px-4 py-3">Control Mapping</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evidenceItems.map((ev, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">{ev.reference}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{ev.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{ev.control}</td>
                        <td className="px-4 py-3 text-slate-500">{ev.type}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 font-semibold text-[11px] ${
                              ev.status === "Accepted"
                                ? "bg-emerald-50 text-emerald-700"
                                : ev.status === "Under Review"
                                ? "bg-blue-50 text-blue-700"
                                : ev.status === "Rejected"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 9: Findings Summary + Items List */}
          <section data-testid="report-section-findings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-600" />
                8. Findings & Remediation Items
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Total: {findingsItems.length} findings
              </span>
            </div>

            {findingsItems.length === 0 ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-lg font-medium">
                No non-conformities or findings recorded during this audit cycle.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Control</th>
                      <th className="px-4 py-3">Remediation Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {findingsItems.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">{f.reference}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{f.title}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 font-bold text-[10px] ${
                              f.severity === "Critical"
                                ? "bg-rose-100 text-rose-800"
                                : f.severity === "High"
                                ? "bg-orange-100 text-orange-800"
                                : f.severity === "Medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {f.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{f.status}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{f.control}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={f.recommendation}>
                          {f.recommendation || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 10: Risks Summary + Items List */}
          <section data-testid="report-section-risks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                9. Risk Register & Exposure (1–25 Matrix)
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Total: {risksItems.length} risks
              </span>
            </div>

            {risksItems.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">
                No active risks logged in association with this audit scope.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Risk Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Risk Level</th>
                      <th className="px-4 py-3">Score (1–25)</th>
                      <th className="px-4 py-3">Treatment Strategy</th>
                      <th className="px-4 py-3">Residual Score</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {risksItems.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                        <td className="px-4 py-3 text-slate-600">{r.category}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 font-bold text-[10px] ${
                              r.level === "Critical"
                                ? "bg-rose-100 text-rose-800"
                                : r.level === "High"
                                ? "bg-orange-100 text-orange-800"
                                : r.level === "Medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {r.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{r.score}</td>
                        <td className="px-4 py-3 text-slate-600">{r.treatment}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{r.residualScore}</td>
                        <td className="px-4 py-3 text-slate-600">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 11: Recommendations */}
          <section data-testid="report-section-recommendations" className="space-y-4">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-indigo-600" />
              10. Key Remediation Recommendations
            </h2>

            <div className="space-y-2.5">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs sm:text-sm text-slate-800"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="mt-0.5 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 12: Conclusion & Sign-Off */}
          <section data-testid="report-section-conclusion" className="space-y-6 pt-4 border-t border-slate-200">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-2">
                <FileCheck size={18} className="text-slate-800" />
                11. Audit Conclusion & Opinion
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200">
                {conclusion}
              </p>
            </div>

            {/* Formal Sign-Off Block */}
            <div className="rounded-xl border border-slate-300 p-6 bg-white space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                12. Formal Sign-Off & Verification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                <div className="space-y-3">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Lead Auditor Attestation</span>
                  <div className="border-b-2 border-slate-300 pb-2">
                    <p className="font-serif italic text-lg text-slate-800">{auditInfo.lead}</p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">{auditInfo.lead}</p>
                    <p>Lead Assurance Auditor, GRC Practice</p>
                    <p className="text-slate-400">Date: {report.generated_date}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Governance & Compliance Officer</span>
                  <div className="border-b-2 border-slate-300 pb-2">
                    <p className="font-serif italic text-lg text-slate-800">Approved & Verified</p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-800">{organization} Compliance Board</p>
                    <p>Audit & Risk Oversight Committee</p>
                    <p className="text-slate-400">Status: Formally Adopted</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 print:hidden">
          <p className="text-xs text-slate-500">
            Generated via automated audit synthesizer for {organization}.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
