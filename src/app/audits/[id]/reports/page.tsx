"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileBarChart,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getReports,
  generateReport as generateReportAction,
  deleteReport as deleteReportAction,
  type ReportRecord,
} from "@/actions/reports";
import AuditReportViewer from "@/components/reports/AuditReportViewer";

type ReportStatus = "Draft" | "Generating" | "Completed" | "Failed";

type ReportType =
  | "Executive Summary"
  | "Audit Report"
  | "Compliance Report"
  | "Management Report";

type Framework =
  | "ISO 27001"
  | "NIST CSF"
  | "NIST RMF"
  | "SOC 2"
  | "Multi-Framework";

const REPORT_TYPES: ReportType[] = [
  "Executive Summary",
  "Audit Report",
  "Compliance Report",
  "Management Report",
];

const FRAMEWORKS: Framework[] = [
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "SOC 2",
  "Multi-Framework",
];

const STATUS_OPTIONS: Array<ReportStatus | "All Statuses"> = [
  "All Statuses",
  "Draft",
  "Generating",
  "Completed",
  "Failed",
];

function statusClasses(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700";
    case "Generating":
      return "bg-blue-50 text-blue-700";
    case "Draft":
      return "bg-amber-50 text-amber-700";
    case "Failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusIcon(status: string) {
  if (status === "Completed") return <CheckCircle2 size={14} />;
  if (status === "Generating") return <Clock3 size={14} />;
  if (status === "Failed") return <ShieldAlert size={14} />;
  return <FileText size={14} />;
}

function downloadReportJson(report: ReportRecord) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${report.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function ReportRow({
  report,
  onView,
  onDelete,
}: {
  report: ReportRecord;
  onView: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const refCode = `RPT-${report.id.substring(0, 8).toUpperCase()}`;
  const period = new Date(report.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <tr className="border-b border-[#edf0f5] hover:bg-[#fafbfe]">
      <td className="px-5 py-4">
        <div>
          <p className="text-[13px] font-semibold text-[#111827]">
            {report.name}
          </p>
          <p className="mt-1 text-[11px] text-[#8a94a6]">
            {refCode}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="rounded-md bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-medium text-[#475569]">
          {report.type}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="text-[12px] font-medium text-[#374151]">
          {report.framework || "ISO 27001"}
        </span>
      </td>

      <td className="px-5 py-4">
        <p className="text-[12px] text-[#4b5563]">{period}</p>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-3 text-[12px]">
          <span title="Findings" className="text-[#ef4444]">
            F {report.summary_stats?.findingsCount ?? 0}
          </span>
          <span title="Risks" className="text-[#f59e0b]">
            R {report.summary_stats?.risksCount ?? 0}
          </span>
          <span title="Controls" className="text-[#3b82f6]">
            C {report.summary_stats?.controlsCount ?? 0}
          </span>
          <span title="Evidence" className="text-[#10b981]">
            E {report.summary_stats?.evidenceCount ?? 0}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
            report.status
          )}`}
        >
          {statusIcon(report.status)}
          {report.status}
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-[#8a94a6] hover:bg-[#f1f4f8] hover:text-[#374151]"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-36 rounded-xl border border-[#e5e9f0] bg-white p-1.5 shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onView();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-[#374151] hover:bg-[#f5f7fa]"
              >
                <Eye size={14} />
                View Report
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  downloadReportJson(report);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-[#374151] hover:bg-[#f5f7fa]"
              >
                <Download size={14} />
                Download
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AuditReportsPage() {
  const params = useParams();
  const auditId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace.id;

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ReportStatus | "All Statuses"
  >("All Statuses");

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);

  const [reportType, setReportType] = useState<ReportType>("Audit Report");
  const [framework, setFramework] = useState<Framework>("ISO 27001");
  const [reportName, setReportName] = useState("");

  const loadReports = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReports(workspaceId, auditId);
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setError(res.error || "Failed to load reports");
      }
    } catch {
      setError("An error occurred while loading reports");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, auditId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const query = search.toLowerCase().trim();

    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        report.name.toLowerCase().includes(query) ||
        report.id.toLowerCase().includes(query) ||
        report.type.toLowerCase().includes(query) ||
        (report.framework && report.framework.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All Statuses" ||
        report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const completed = reports.filter(
    (report) => report.status === "Completed"
  ).length;

  const generating = reports.filter(
    (report) => report.status === "Generating"
  ).length;

  const drafts = reports.filter(
    (report) => report.status === "Draft"
  ).length;

  const totalFindings = reports.reduce(
    (sum, report) => sum + (report.summary_stats?.findingsCount ?? 0),
    0
  );

  const totalRisks = reports.reduce(
    (sum, report) => sum + (report.summary_stats?.risksCount ?? 0),
    0
  );

  async function handleGenerateReport() {
    if (!reportName.trim() || !workspaceId || !auditId) return;
    setGeneratingReport(true);

    try {
      const res = await generateReportAction(
        workspaceId,
        auditId,
        reportType,
        reportName.trim()
      );

      if (res.success && res.data) {
        setReports((prev) => [res.data!, ...prev]);
        setShowGenerateModal(false);
        setReportName("");
      } else {
        alert(res.error || "Failed to generate report");
      }
    } catch {
      alert("Error generating report");
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleDeleteReport(id: string) {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const res = await deleteReportAction(workspaceId, id);
      if (res.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (selectedReport?.id === id) {
          setSelectedReport(null);
        }
      } else {
        alert(res.error || "Failed to delete report");
      }
    } catch {
      alert("Error deleting report");
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] w-[calc(100%-250px)] min-h-screen">
        <Header />

        <section className="px-8 py-7">
          {/* Header */}
          <div className="mb-7 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#8a94a6]">
                <span>Audits</span>
                <span>/</span>
                <span className="text-[#4b5563]">
                  Reports
                </span>
              </div>

              <h1 className="text-[25px] font-bold tracking-[-0.4px] text-[#111827]">
                Audit Reports
              </h1>

              <p className="mt-1 text-[13px] text-[#7b8494]">
                Generate, manage and review synthesized audit reports for{" "}
                {currentWorkspace.name}.
              </p>
            </div>

            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
            >
              <Plus size={16} />
              Generate Report
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="mb-7 grid grid-cols-5 gap-4">
            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a94a6]">
                  Total Reports
                </p>
                <FileBarChart size={18} className="text-[#64748b]" />
              </div>
              <p className="text-[25px] font-bold">{reports.length}</p>
              <p className="mt-1 text-[11px] text-[#94a3b8]">
                For this audit
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a94a6]">
                  Completed
                </p>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <p className="text-[25px] font-bold text-emerald-600">
                {completed}
              </p>
              <p className="mt-1 text-[11px] text-[#94a3b8]">
                Ready for review
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a94a6]">
                  Generating
                </p>
                <Clock3 size={18} className="text-blue-500" />
              </div>
              <p className="text-[25px] font-bold text-blue-600">
                {generating}
              </p>
              <p className="mt-1 text-[11px] text-[#94a3b8]">
                Reports in progress
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a94a6]">
                  Drafts
                </p>
                <FileText size={18} className="text-amber-500" />
              </div>
              <p className="text-[25px] font-bold text-amber-600">
                {drafts}
              </p>
              <p className="mt-1 text-[11px] text-[#94a3b8]">
                Awaiting completion
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a94a6]">
                  Audit Coverage
                </p>
                <BarChart3 size={18} className="text-[#6366f1]" />
              </div>
              <p className="text-[25px] font-bold text-[#4f46e5]">
                {totalFindings + totalRisks}
              </p>
              <p className="mt-1 text-[11px] text-[#94a3b8]">
                Findings + risks reported
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mb-4 rounded-xl border border-[#e5e9f0] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3b2]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reports by name, type, framework..."
                  className="h-10 w-full rounded-lg border border-[#e1e6ee] bg-[#fafbfc] pl-9 pr-3 text-[12px] outline-none placeholder:text-[#a3acba] focus:border-[#93b4f8]"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | ReportStatus
                        | "All Statuses"
                    )
                  }
                  className="h-10 appearance-none rounded-lg border border-[#e1e6ee] bg-white px-4 pr-9 text-[12px] font-medium text-[#475569] outline-none"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>

                <Filter
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-[#e5e9f0] bg-white">
            <div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4">
              <div>
                <h2 className="text-[14px] font-semibold text-[#111827]">
                  Report History
                </h2>
                <p className="mt-0.5 text-[11px] text-[#8a94a6]">
                  {filteredReports.length} report
                  {filteredReports.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
                <Loader2 className="animate-spin" size={20} />
                <span>Loading reports from database...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9]">
                  <FileBarChart
                    size={22}
                    className="text-[#94a3b8]"
                  />
                </div>
                <p className="text-[13px] font-semibold text-[#374151]">
                  No reports generated yet
                </p>
                <p className="mt-1 text-[11px] text-[#94a3b8]">
                  Click &ldquo;Generate Report&rdquo; to create a synthesized report from this audit.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-[#edf0f5] bg-[#fafbfc]">
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#8a94a6]">
                        Report
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#8a94a6]">
                        Type
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#8a94a6]">
                        Framework
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#8a94a6]">
                        Audit Period
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#8a94a6]">
                        Coverage
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#8a94a6]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-[#8a94a6]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReports.map((report) => (
                      <ReportRow
                        key={report.id}
                        report={report}
                        onView={() => setSelectedReport(report)}
                        onDelete={() => handleDeleteReport(report.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Information cards */}
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <FileBarChart size={17} className="text-blue-600" />
              </div>
              <h3 className="text-[13px] font-semibold">
                Executive Reporting
              </h3>
              <p className="mt-1.5 text-[11px] leading-5 text-[#7b8494]">
                Generate concise reports containing audit status,
                key findings, risks and remediation progress.
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2
                  size={17}
                  className="text-emerald-600"
                />
              </div>
              <h3 className="text-[13px] font-semibold">
                Compliance Evidence
              </h3>
              <p className="mt-1.5 text-[11px] leading-5 text-[#7b8494]">
                Reports summarize evidence coverage against
                the selected security and compliance framework.
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e9f0] bg-white p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <ShieldAlert
                  size={17}
                  className="text-amber-600"
                />
              </div>
              <h3 className="text-[13px] font-semibold">
                Risk & Findings
              </h3>
              <p className="mt-1.5 text-[11px] leading-5 text-[#7b8494]">
                Maintain a clear management view of outstanding
                findings, risks and remediation activity.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#edf0f5] px-6 py-5">
              <div>
                <h2 className="text-[16px] font-bold text-[#111827]">
                  Generate Report
                </h2>
                <p className="mt-1 text-[11px] text-[#8a94a6]">
                  Create an authoritative report for this audit.
                </p>
              </div>

              <button
                onClick={() => setShowGenerateModal(false)}
                className="rounded-lg p-2 text-[#8a94a6] hover:bg-[#f3f5f8]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-[11px] font-semibold text-[#374151]">
                  Report Name
                </label>

                <input
                  value={reportName}
                  onChange={(event) =>
                    setReportName(event.target.value)
                  }
                  placeholder="e.g. Q2 Comprehensive Audit Report"
                  className="h-10 w-full rounded-lg border border-[#dfe4ec] px-3 text-[12px] outline-none focus:border-[#7aa2ed]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold text-[#374151]">
                  Report Type
                </label>

                <select
                  value={reportType}
                  onChange={(event) =>
                    setReportType(event.target.value as ReportType)
                  }
                  className="h-10 w-full rounded-lg border border-[#dfe4ec] bg-white px-3 text-[12px] outline-none focus:border-[#7aa2ed]"
                >
                  {REPORT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold text-[#374151]">
                  Framework Focus
                </label>

                <select
                  value={framework}
                  onChange={(event) =>
                    setFramework(event.target.value as Framework)
                  }
                  className="h-10 w-full rounded-lg border border-[#dfe4ec] bg-white px-3 text-[12px] outline-none focus:border-[#7aa2ed]"
                >
                  {FRAMEWORKS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-[#f8fafc] p-4">
                <p className="mb-2 text-[11px] font-semibold text-[#475569]">
                  Report will include
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748b]">
                  <span>• Scope & Objectives</span>
                  <span>• Findings breakdown</span>
                  <span>• Risk registers</span>
                  <span>• Remediation status</span>
                  <span>• Evidence tracking</span>
                  <span>• Control assessments</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#edf0f5] px-6 py-4">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="rounded-lg border border-[#dfe4ec] px-4 py-2 text-[12px] font-medium text-[#475569] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>

              <button
                disabled={!reportName.trim() || generatingReport}
                onClick={handleGenerateReport}
                className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingReport ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <FileBarChart size={15} />
                )}
                {generatingReport ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human-Readable Report Viewer Modal */}
      {selectedReport && (
        <AuditReportViewer
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onDownloadJson={downloadReportJson}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
