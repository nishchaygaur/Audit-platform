"use client";

import { useMemo, useState } from "react";
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

type ReportStatus = "Completed" | "Generating" | "Failed";

type Report = {
  id: string;
  name: string;
  type: string;
  framework: string;
  audit: string;
  generatedBy: string;
  generatedDate: string;
  size: string;
  status: ReportStatus;
};

const reportsByWorkspace: Record<string, Report[]> = {
  "abc-technologies": [
    {
      id: "RPT-001",
      name: "ISO 27001 Internal Audit Report",
      type: "Audit Report",
      framework: "ISO 27001",
      audit: "AUD-2024-001",
      generatedBy: "Admin",
      generatedDate: "05 Sep 2026",
      size: "2.4 MB",
      status: "Completed",
    },
    {
      id: "RPT-002",
      name: "NIST CSF Compliance Report",
      type: "Compliance Report",
      framework: "NIST CSF",
      audit: "AUD-2024-001",
      generatedBy: "Admin",
      generatedDate: "04 Sep 2026",
      size: "1.8 MB",
      status: "Completed",
    },
    {
      id: "RPT-003",
      name: "Risk Register Summary",
      type: "Risk Report",
      framework: "Enterprise",
      audit: "—",
      generatedBy: "Security Team",
      generatedDate: "03 Sep 2026",
      size: "1.1 MB",
      status: "Completed",
    },
    {
      id: "RPT-004",
      name: "Executive Audit Summary",
      type: "Executive Summary",
      framework: "ISO 27001",
      audit: "AUD-2024-001",
      generatedBy: "Admin",
      generatedDate: "02 Sep 2026",
      size: "890 KB",
      status: "Completed",
    },
    {
      id: "RPT-005",
      name: "Remediation Status Report",
      type: "Remediation Report",
      framework: "Multiple",
      audit: "—",
      generatedBy: "Compliance Team",
      generatedDate: "01 Sep 2026",
      size: "1.3 MB",
      status: "Completed",
    },
  ],

  "xyz-finance": [
    {
      id: "RPT-101",
      name: "ISO 27001 Compliance Assessment",
      type: "Compliance Report",
      framework: "ISO 27001",
      audit: "AUD-2024-002",
      generatedBy: "Admin",
      generatedDate: "05 Sep 2026",
      size: "2.1 MB",
      status: "Completed",
    },
    {
      id: "RPT-102",
      name: "NIST RMF Assessment Report",
      type: "Audit Report",
      framework: "NIST RMF",
      audit: "AUD-2024-002",
      generatedBy: "Audit Team",
      generatedDate: "03 Sep 2026",
      size: "2.7 MB",
      status: "Completed",
    },
    {
      id: "RPT-103",
      name: "Enterprise Risk Overview",
      type: "Risk Report",
      framework: "Enterprise",
      audit: "—",
      generatedBy: "Risk Team",
      generatedDate: "02 Sep 2026",
      size: "1.4 MB",
      status: "Completed",
    },
    {
      id: "RPT-104",
      name: "Audit Findings Report",
      type: "Audit Report",
      framework: "NIST RMF",
      audit: "AUD-2024-002",
      generatedBy: "Admin",
      generatedDate: "01 Sep 2026",
      size: "1.9 MB",
      status: "Completed",
    },
  ],

  "pqr-healthcare": [
    {
      id: "RPT-201",
      name: "Healthcare Security Audit Report",
      type: "Audit Report",
      framework: "ISO 27001",
      audit: "AUD-2024-003",
      generatedBy: "Admin",
      generatedDate: "05 Sep 2026",
      size: "2.6 MB",
      status: "Completed",
    },
    {
      id: "RPT-202",
      name: "NIST CSF Assessment",
      type: "Compliance Report",
      framework: "NIST CSF",
      audit: "AUD-2024-003",
      generatedBy: "Audit Team",
      generatedDate: "04 Sep 2026",
      size: "2.2 MB",
      status: "Completed",
    },
    {
      id: "RPT-203",
      name: "Risk Treatment Report",
      type: "Risk Report",
      framework: "Enterprise",
      audit: "—",
      generatedBy: "Risk Team",
      generatedDate: "02 Sep 2026",
      size: "1.2 MB",
      status: "Completed",
    },
  ],
};

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

  const workspaceId = currentWorkspace?.id ?? "abc-technologies";

  const [reports, setReports] = useState<Report[]>(
    reportsByWorkspace[workspaceId] ?? reportsByWorkspace["abc-technologies"]
  );

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [newReportName, setNewReportName] = useState("");
  const [newReportType, setNewReportType] = useState("Audit Report");
  const [newFramework, setNewFramework] = useState("ISO 27001");

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

  const thisMonthCount = reports.filter((report) =>
    report.generatedDate.includes("Sep 2026")
  ).length;

  function generateReport() {
    if (!newReportName.trim()) return;

    const id = `RPT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport: Report = {
      id,
      name: newReportName.trim(),
      type: newReportType,
      framework: newFramework,
      audit: "—",
      generatedBy: "Current User",
      generatedDate: "05 Sep 2026",
      size: "Generating...",
      status: "Generating",
    };

    setReports((current) => [newReport, ...current]);
    setShowGenerateModal(false);

    setNewReportName("");
    setNewReportType("Audit Report");
    setNewFramework("ISO 27001");

    setTimeout(() => {
      setReports((current) =>
        current.map((report) =>
          report.id === id
            ? {
                ...report,
                status: "Completed",
                size: "1.6 MB",
              }
            : report
        )
      );
    }, 1800);
  }

  function deleteReport(id: string) {
    setReports((current) => current.filter((report) => report.id !== id));

    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
  }

  function downloadReport(report: Report) {
    if (report.status !== "Completed") return;

    window.alert(
      `Report "${report.name}" is ready for download.\n\nFile size: ${report.size}`
    );
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
                  {filteredReports.length === 0 ? (
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
                          {report.audit}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {report.generatedDate}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {report.generatedBy}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={report.status} />
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
                              onClick={() => downloadReport(report)}
                              disabled={report.status !== "Completed"}
                              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>

                            <button
                              onClick={() => deleteReport(report.id)}
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
                  Create a new workspace report
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
                onClick={generateReport}
                disabled={!newReportName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileBarChart2 size={16} />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText size={21} />
                </div>

                <div>
                  <h2 className="max-w-[400px] text-lg font-semibold text-slate-900">
                    {selectedReport.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selectedReport.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-200">
              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Type
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedReport.type}
                </p>
              </div>

              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Framework
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedReport.framework}
                </p>
              </div>

              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Audit
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedReport.audit}
                </p>
              </div>

              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>
                <div className="mt-2">
                  <StatusBadge status={selectedReport.status} />
                </div>
              </div>

              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Generated By
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedReport.generatedBy}
                </p>
              </div>

              <div className="bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  File Size
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {selectedReport.size}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => deleteReport(selectedReport.id)}
                className="mr-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete
              </button>

              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>

              <button
                onClick={() => downloadReport(selectedReport)}
                disabled={selectedReport.status !== "Completed"}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}