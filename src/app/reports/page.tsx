"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileBarChart2,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAudits } from "@/context/AuditContext";
import {
  getReports,
  generateReport as generateReportAction,
  deleteReport as deleteReportAction,
  type ReportRecord,
} from "@/actions/reports";
import { createAudit } from "@/actions/audits";
import { downloadReportPdf } from "@/lib/pdf-generator";
import AuditReportViewer from "@/components/reports/AuditReportViewer";

type ReportStatus = "Completed" | "Generating" | "Failed";

const reportTypes = [
  "Audit Report",
  "Compliance Report",
  "Risk Report",
  "Executive Summary",
  "Evidence Report",
  "Remediation Report",
];

const frameworks = [
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "SOC 2",
  "CIS Controls",
  "Multiple",
];

function StatusBadge({ status }: { status: ReportStatus }) {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={13} />
        Completed
      </span>
    );
  }

  if (status === "Generating") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <Loader2 size={13} className="animate-spin" />
        Generating
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
      <X size={13} />
      Failed
    </span>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </h3>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { currentWorkspace } = useWorkspace();
  const { audits, refreshAudits } = useAudits();

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [newReportName, setNewReportName] = useState("");
  const [newReportType, setNewReportType] = useState("Audit Report");
  const [newFramework, setNewFramework] = useState("ISO 27001");
  const [selectedAuditId, setSelectedAuditId] = useState<string>("");

  useEffect(() => {
    if (audits.length > 0 && !selectedAuditId) {
      setSelectedAuditId(audits[0].id);
      setNewFramework(audits[0].framework || "ISO 27001");
    }
  }, [audits, selectedAuditId]);

  const loadReports = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    const res = await getReports(currentWorkspace.id);
    if (res.success && res.data) {
      setReports(res.data);
    }
    setLoading(false);
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.name.toLowerCase().includes(search.toLowerCase()) ||
        report.id.toLowerCase().includes(search.toLowerCase()) ||
        report.framework.toLowerCase().includes(search.toLowerCase()) ||
        report.type.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "All Types" || report.type === typeFilter;

      const matchesStatus =
        statusFilter === "All Statuses" || report.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [reports, search, typeFilter, statusFilter]);

  const completedCount = reports.filter(
    (report) => report.status === "Completed"
  ).length;

  const generatingCount = reports.filter(
    (report) => report.status === "Generating"
  ).length;

  const thisMonthCount = reports.filter((report) => {
    if (!report.generated_date) return false;
    return (
      report.generated_date.includes("2026") ||
      report.generated_date.includes("Just now") ||
      report.generated_date.includes("2024")
    );
  }).length;

  async function handleGenerateReport() {
    if (!newReportName.trim() || !currentWorkspace?.id) return;

    let targetAuditId = selectedAuditId || audits[0]?.id;
    if (!targetAuditId) {
      setGenerating(true);
      const newAuditRes = await createAudit(currentWorkspace.id, {
        name: `${newReportName.trim()} Baseline Audit`,
        framework: newFramework || "ISO 27001",
        status: "Fieldwork",
        lead: "Lead Auditor",
        startDate: new Date().toISOString().split("T")[0],
      });
      if (newAuditRes.success && newAuditRes.data) {
        targetAuditId = newAuditRes.data.id;
        await refreshAudits();
      } else {
        setGenerating(false);
        alert(newAuditRes.error || "Please select or create an audit first before generating a report.");
        return;
      }
    }

    setGenerating(true);
    const res = await generateReportAction(
      currentWorkspace.id,
      targetAuditId,
      newReportType,
      newReportName.trim()
    );
    setGenerating(false);

    if (res.success && res.data) {
      setShowGenerateModal(false);
      setNewReportName("");
      await loadReports();
      setSelectedReport(res.data);
    } else {
      alert(res.error || "Failed to generate report");
    }
  }

  async function handleDeleteReport(id: string) {
    if (!currentWorkspace?.id) return;
    if (!confirm("Are you sure you want to delete this report?")) return;

    const res = await deleteReportAction(currentWorkspace.id, id);
    if (res.success) {
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      await loadReports();
    } else {
      alert(res.error || "Failed to delete report");
    }
  }

  function handleDownloadReport(report: ReportRecord) {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(report, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute(
      "download",
      `${report.id}_${report.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] pl-[250px]">
      <Header />

      <main className="p-7">
        <div className="mx-auto max-w-[1600px]">
          {/* Page heading */}
          <div className="mb-7 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <FileBarChart2 size={22} />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Reports
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Generate and manage audit, compliance, risk and remediation
                    reports
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={17} />
              Generate Report
            </button>
          </div>

          {/* Stats */}
          <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Reports"
              value={reports.length}
              icon={<FileText size={20} />}
              description="Available reports"
            />

            <StatCard
              title="Completed"
              value={completedCount}
              icon={<CheckCircle2 size={20} />}
              description="Ready to download"
            />

            <StatCard
              title="Generating"
              value={generatingCount}
              icon={<Clock3 size={20} />}
              description="Currently processing"
            />

            <StatCard
              title="This Month"
              value={thisMonthCount}
              icon={<CalendarDays size={20} />}
              description="Reports generated"
            />
          </div>

          {/* Framework coverage */}
          <div className="mb-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Framework Coverage
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Reports available across security and compliance frameworks
                </p>
              </div>

              <BarChart3 size={20} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {frameworks.map((framework) => {
                const count = reports.filter(
                  (report) => report.framework === framework
                ).length;

                return (
                  <div
                    key={framework}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <ShieldCheck size={17} className="text-slate-500" />
                      <span className="text-lg font-semibold text-slate-900">
                        {count}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {framework}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reports table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-md">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search reports..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Filter size={15} />
                    Filters
                  </div>

                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option>All Types</option>
                      {reportTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value)
                      }
                      className="h-10 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option>All Statuses</option>
                      <option>Completed</option>
                      <option>Generating</option>
                      <option>Failed</option>
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Report
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Framework
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Audit
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Generated
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        Loading reports from database...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        No reports match your current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <FileText size={17} />
                            </div>

                            <div>
                              <button
                                onClick={() => setSelectedReport(report)}
                                className="text-left text-sm font-semibold text-slate-800 hover:text-slate-600"
                              >
                                {report.name}
                              </button>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {report.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {report.type}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {report.framework}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {report.audit_name || report.audit_id || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {report.generated_date}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {report.generated_by}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={report.status as ReportStatus} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="rounded-md px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                            >
                              View
                            </button>

                            <button
                              onClick={() => downloadReportPdf(report)}
                              disabled={report.status !== "Completed"}
                              data-testid="row-download-pdf-button"
                              className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 inline-flex items-center gap-1"
                              title="Download PDF"
                            >
                              <FileText size={14} />
                              PDF
                            </button>

                            <button
                              onClick={() => handleDownloadReport(report)}
                              disabled={report.status !== "Completed"}
                              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Download JSON"
                            >
                              <Download size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-5 py-3">
              <p className="text-xs text-slate-400">
                Showing {filteredReports.length} of {reports.length} reports
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Generate Report
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a new workspace report synthesized from PostgreSQL
                </p>
              </div>

              <button
                onClick={() => setShowGenerateModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Report Name
                </label>

                <input
                  value={newReportName}
                  onChange={(event) => setNewReportName(event.target.value)}
                  placeholder="e.g. Q3 Security Audit Report"
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Associated Audit
                </label>

                <div className="relative">
                  <select
                    value={selectedAuditId}
                    onChange={(event) => {
                      setSelectedAuditId(event.target.value);
                      const aud = audits.find((a) => a.id === event.target.value);
                      if (aud?.framework) setNewFramework(aud.framework);
                    }}
                    className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm outline-none focus:border-slate-400"
                  >
                    {audits.length === 0 && (
                      <option value="">(Auto-create Baseline Audit)</option>
                    )}
                    {audits.map((audit) => (
                      <option key={audit.id} value={audit.id}>
                        {audit.name} ({audit.framework})
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Report Type
                </label>

                <div className="relative">
                  <select
                    value={newReportType}
                    onChange={(event) => setNewReportType(event.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm outline-none focus:border-slate-400"
                  >
                    {reportTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Framework
                </label>

                <div className="relative">
                  <select
                    value={newFramework}
                    onChange={(event) => setNewFramework(event.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm outline-none focus:border-slate-400"
                  >
                    {frameworks.map((framework) => (
                      <option key={framework}>{framework}</option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleGenerateReport}
                disabled={generating || !newReportName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileBarChart2 size={16} />
                {generating ? "Synthesizing Data..." : "Generate"}
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
          onDownloadJson={handleDownloadReport}
        />
      )}
    </div>
  );
}
export const dynamic = 'force-dynamic';
