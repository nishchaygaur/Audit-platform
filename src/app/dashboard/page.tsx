"use client";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";

type AuditStatus =
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Completed";

type Severity = "Critical" | "High" | "Medium" | "Low";

type Audit = {
  id: number;
  name: string;
  framework: string;
  status: AuditStatus;
  progress: number;
  dueDate: string;
};

type FindingSummary = {
  severity: Severity;
  count: number;
};

type ActivityItem = {
  title: string;
  sub: string;
  icon: "finding" | "evidence" | "audit" | "risk" | "report";
};

type DashboardData = {
  audits: Audit[];
  findings: {
    open: number;
    closed: number;
    bySeverity: FindingSummary[];
  };
  risks: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  remediation: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  evidence: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  controls: {
    total: number;
    effective: number;
    partial: number;
    ineffective: number;
  };
  activities: ActivityItem[];
};

const DASHBOARD_DATA: Record<string, DashboardData> = {
  "abc-technologies": {
    audits: [
      {
        id: 1,
        name: "ISO 27001 Internal Audit",
        framework: "ISO 27001:2022",
        status: "In Progress",
        progress: 65,
        dueDate: "30 May 2024",
      },
      {
        id: 2,
        name: "NIST CSF Assessment",
        framework: "NIST CSF 2.0",
        status: "In Review",
        progress: 80,
        dueDate: "10 Jun 2024",
      },
      {
        id: 3,
        name: "Vendor Risk Assessment",
        framework: "ISO 27036",
        status: "In Progress",
        progress: 40,
        dueDate: "15 Jun 2024",
      },
      {
        id: 4,
        name: "Data Privacy Audit",
        framework: "ISO 27701",
        status: "Not Started",
        progress: 0,
        dueDate: "20 Jun 2024",
      },
      {
        id: 5,
        name: "BCP & DR Audit",
        framework: "ISO 22301",
        status: "Completed",
        progress: 100,
        dueDate: "25 Apr 2024",
      },
    ],
    findings: {
      open: 17,
      closed: 32,
      bySeverity: [
        { severity: "Critical", count: 5 },
        { severity: "High", count: 7 },
        { severity: "Medium", count: 12 },
        { severity: "Low", count: 15 },
      ],
    },
    risks: {
      critical: 2,
      high: 5,
      medium: 8,
      low: 3,
    },
    remediation: {
      total: 24,
      completed: 12,
      inProgress: 7,
      overdue: 5,
    },
    evidence: {
      total: 58,
      approved: 42,
      pending: 11,
      rejected: 5,
    },
    controls: {
      total: 96,
      effective: 71,
      partial: 18,
      ineffective: 7,
    },
    activities: [
      {
        title: 'New finding "A.8.2.1 - User Access Review" created',
        sub: "Bob Johnson • 2 hours ago",
        icon: "finding",
      },
      {
        title: 'Evidence "screen_shot_2024.png" uploaded',
        sub: "Alice Smith • 5 hours ago",
        icon: "evidence",
      },
      {
        title: 'Audit "ISO 27001 Internal Audit" status changed',
        sub: "Alice Smith • 1 day ago",
        icon: "audit",
      },
      {
        title: 'Risk "RISK-12: Unauthorized Access" updated',
        sub: "John Carter • 1 day ago",
        icon: "risk",
      },
      {
        title: 'Report "ISO 27001 Internal Audit" generated',
        sub: "System • 2 days ago",
        icon: "report",
      },
    ],
  },

  "xyz-finance": {
    audits: [
      {
        id: 11,
        name: "Financial Security Audit",
        framework: "NIST CSF 2.0",
        status: "In Progress",
        progress: 72,
        dueDate: "12 Jun 2024",
      },
      {
        id: 12,
        name: "Access Control Review",
        framework: "ISO 27001:2022",
        status: "In Review",
        progress: 88,
        dueDate: "15 Jun 2024",
      },
      {
        id: 13,
        name: "Third Party Assessment",
        framework: "SOC 2",
        status: "In Progress",
        progress: 54,
        dueDate: "20 Jun 2024",
      },
      {
        id: 14,
        name: "Business Continuity Audit",
        framework: "ISO 22301",
        status: "Completed",
        progress: 100,
        dueDate: "28 Apr 2024",
      },
    ],
    findings: {
      open: 13,
      closed: 27,
      bySeverity: [
        { severity: "Critical", count: 3 },
        { severity: "High", count: 8 },
        { severity: "Medium", count: 14 },
        { severity: "Low", count: 15 },
      ],
    },
    risks: {
      critical: 1,
      high: 6,
      medium: 7,
      low: 4,
    },
    remediation: {
      total: 19,
      completed: 10,
      inProgress: 6,
      overdue: 3,
    },
    evidence: {
      total: 49,
      approved: 38,
      pending: 8,
      rejected: 3,
    },
    controls: {
      total: 84,
      effective: 63,
      partial: 15,
      ineffective: 6,
    },
    activities: [
      {
        title: 'Finding "Excessive User Permissions" updated',
        sub: "Sarah Brown • 1 hour ago",
        icon: "finding",
      },
      {
        title: 'Evidence package approved',
        sub: "David Wilson • 4 hours ago",
        icon: "evidence",
      },
      {
        title: 'Financial Security Audit moved to In Progress',
        sub: "Sarah Brown • 1 day ago",
        icon: "audit",
      },
      {
        title: 'Risk assessment updated',
        sub: "David Wilson • 1 day ago",
        icon: "risk",
      },
      {
        title: "Compliance report generated",
        sub: "System • 3 days ago",
        icon: "report",
      },
    ],
  },

  "pqr-healthcare": {
    audits: [
      {
        id: 21,
        name: "Healthcare Security Audit",
        framework: "ISO 27001:2022",
        status: "In Progress",
        progress: 61,
        dueDate: "08 Jun 2024",
      },
      {
        id: 22,
        name: "Clinical Application Review",
        framework: "NIST 800-53",
        status: "In Review",
        progress: 84,
        dueDate: "14 Jun 2024",
      },
      {
        id: 23,
        name: "Supplier Security Assessment",
        framework: "NIST RMF",
        status: "In Progress",
        progress: 45,
        dueDate: "22 Jun 2024",
      },
      {
        id: 24,
        name: "Privacy Compliance Review",
        framework: "ISO 27701",
        status: "Not Started",
        progress: 0,
        dueDate: "25 Jun 2024",
      },
    ],
    findings: {
      open: 11,
      closed: 21,
      bySeverity: [
        { severity: "Critical", count: 4 },
        { severity: "High", count: 6 },
        { severity: "Medium", count: 10 },
        { severity: "Low", count: 12 },
      ],
    },
    risks: {
      critical: 3,
      high: 4,
      medium: 6,
      low: 2,
    },
    remediation: {
      total: 17,
      completed: 8,
      inProgress: 6,
      overdue: 3,
    },
    evidence: {
      total: 46,
      approved: 34,
      pending: 9,
      rejected: 3,
    },
    controls: {
      total: 78,
      effective: 57,
      partial: 15,
      ineffective: 6,
    },
    activities: [
      {
        title: 'Clinical application finding created',
        sub: "Michael Lee • 2 hours ago",
        icon: "finding",
      },
      {
        title: "Security evidence uploaded",
        sub: "Emily Davis • 6 hours ago",
        icon: "evidence",
      },
      {
        title: "Healthcare Security Audit updated",
        sub: "Michael Lee • 1 day ago",
        icon: "audit",
      },
      {
        title: "Supplier risk assessment updated",
        sub: "John Carter • 2 days ago",
        icon: "risk",
      },
      {
        title: "Security Compliance Review generated",
        sub: "System • 3 days ago",
        icon: "report",
      },
    ],
  },
};

const STATUS_OPTIONS = [
  "All Audits",
  "Not Started",
  "In Progress",
  "In Review",
  "Completed",
] as const;

const severityStyles: Record<Severity, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-400",
  Low: "bg-emerald-500",
};

function statusClass(status: AuditStatus) {
  if (status === "Completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "In Review") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "Not Started") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

function ActivityIcon({ type }: { type: ActivityItem["icon"] }) {
  const config = {
    finding: {
      icon: AlertTriangle,
      bg: "bg-red-50",
      text: "text-red-500",
    },
    evidence: {
      icon: FileCheck2,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    audit: {
      icon: ClipboardCheck,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    risk: {
      icon: ShieldAlert,
      bg: "bg-orange-50",
      text: "text-orange-500",
    },
    report: {
      icon: FileText,
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
    >
      <Icon className={`h-4 w-4 ${config.text}`} />
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  positive,
  icon,
  iconBg,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] text-slate-600">{title}</p>
          <p className="mt-2 text-[29px] font-semibold leading-none text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`mt-5 flex items-center gap-1 text-[10px] ${
          positive ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {positive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}

        <span className="font-semibold">{change}</span>
        <span className="text-slate-500">from last month</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspace();

  const data =
    DASHBOARD_DATA[currentWorkspace.id] ??
    DASHBOARD_DATA["abc-technologies"];

  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("All Audits");

  const [period, setPeriod] = useState("01 May 2024 - 31 May 2024");

  const filteredAudits = useMemo(() => {
    if (statusFilter === "All Audits") {
      return data.audits;
    }

    return data.audits.filter(
      (audit) => audit.status === statusFilter
    );
  }, [data.audits, statusFilter]);

  const totalAudits = data.audits.length;
  const inProgress = data.audits.filter(
    (audit) => audit.status === "In Progress"
  ).length;

  const totalFindings =
    data.findings.open + data.findings.closed;

  const remediationRate =
    data.remediation.total === 0
      ? 0
      : Math.round(
          (data.remediation.completed / data.remediation.total) * 100
        );

  const evidenceRate =
    data.evidence.total === 0
      ? 0
      : Math.round(
          (data.evidence.approved / data.evidence.total) * 100
        );

  const controlRate =
    data.controls.total === 0
      ? 0
      : Math.round(
          (data.controls.effective / data.controls.total) * 100
        );

  const auditStatusCounts = {
    "Not Started": data.audits.filter(
      (a) => a.status === "Not Started"
    ).length,
    "In Progress": data.audits.filter(
      (a) => a.status === "In Progress"
    ).length,
    "In Review": data.audits.filter(
      (a) => a.status === "In Review"
    ).length,
    Completed: data.audits.filter(
      (a) => a.status === "Completed"
    ).length,
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] min-h-screen">
        <Header />

        <section className="px-7 py-6">
          {/* Page header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[27px] font-semibold tracking-[-0.5px] text-slate-900">
                Dashboard
              </h2>

              <p className="mt-1 text-[13px] text-slate-500">
                Overview of audit activities and compliance posture
                for {currentWorkspace.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarDays className="pointervents-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className="h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-[11px] font-medium text-slate-700 shadow-sm outline-none"
                >
                  <option>01 May 2024 - 31 May 2024</option>
                  <option>01 Apr 2024 - 30 Apr 2024</option>
                  <option>01 Mar 2024 - 31 Mar 2024</option>
                  <option>01 Jan 2024 - 31 Jan 2024</option>
                </select>

                <ChevronDown className="pointervents-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Top metrics */}
          <div className="grid grid-cols-4 gap-5">
            <StatCard
              title="Total Audits"
              value={String(totalAudits)}
              change="20%"
              positive
              icon={
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
              }
              iconBg="bg-blue-50"
            />

            <StatCard
              title="Audits in Progress"
              value={String(inProgress)}
              change="14%"
              positive
              icon={<Clock3 className="h-6 w-6 text-orange-500" />}
              iconBg="bg-orange-50"
            />

            <StatCard
              title="Open Findings"
              value={String(data.findings.open)}
              change="8%"
              positive={false}
              icon={
                <AlertTriangle className="h-6 w-6 text-red-500" />
              }
              iconBg="bg-red-50"
            />

            <StatCard
              title="Closed Findings"
              value={String(data.findings.closed)}
              change="27%"
              positive
              icon={
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              }
              iconBg="bg-emerald-50"
            />
          </div>

          {/* Analytics */}
          <div className="mt-5 grid grid-cols-[1.05fr_1.15fr_0.9fr] gap-5">
            {/* Audit status */}
            <Panel
              title="Audit Status"
              action={
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as (typeof STATUS_OPTIONS)[number]
                    )
                  }
                  className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] text-slate-600 outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              }
            >
              <div className="flex items-center justify-center gap-8 px-5 pb-5 pt-2">
                <div className="relative h-[165px] w-[165px] shrink-0 rounded-full bg-[conic-gradient(#4169e1_0deg_90deg,#fbb52b_90deg_210deg,#42ad9b_210deg_285deg,#31a36d_285deg_360deg)]">
                  <div className="absolute inset-[27px] flex flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-[27px] font-semibold text-slate-900">
                      {totalAudits}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Total
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <StatusLegend
                    label="Not Started"
                    value={auditStatusCounts["Not Started"]}
                    total={totalAudits}
                    dot="bg-blue-500"
                  />

                  <StatusLegend
                    label="In Progress"
                    value={auditStatusCounts["In Progress"]}
                    total={totalAudits}
                    dot="bg-amber-400"
                  />

                  <StatusLegend
                    label="In Review"
                    value={auditStatusCounts["In Review"]}
                    total={totalAudits}
                    dot="bg-teal-500"
                  />

                  <StatusLegend
                    label="Completed"
                    value={auditStatusCounts.Completed}
                    total={totalAudits}
                    dot="bg-emerald-600"
                  />
                </div>
              </div>
            </Panel>

            {/* Findings */}
            <Panel
              title="Findings by Severity"
              subtitle={`${totalFindings} total findings`}
              action={
                <span className="text-[10px] font-medium text-slate-500">
                  Current Workspace
                </span>
              }
            >
              <div className="px-5 pb-5">
                <div className="relative h-[205px]">
                  <div className="absolute inset-x-0 bottom-8 top-3 flex flex-col justify-between pl-7">
                    {[20, 15, 10, 5, 0].map((number) => (
                      <div
                        key={number}
                        className="flex items-center"
                      >
                        <span className="absolute left-0 w-6 text-[9px] text-slate-400">
                          {number}
                        </span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-8 left-8 right-0 flex h-[168px] itemsnd justify-around">
                    {data.findings.bySeverity.map((item) => (
                      <SeverityBar
                        key={item.severity}
                        label={item.severity}
                        value={item.count}
                        max={20}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            {/* Compliance posture */}
            <Panel
              title="Compliance Posture"
              subtitle="Current control effectiveness"
            >
              <div className="px-5 pb-5">
                <div className="mb-4 flex itemsnd justify-between">
                  <div>
                    <p className="text-[30px] font-semibold text-slate-900">
                      {controlRate}%
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Effective controls
                    </p>
                  </div>

                  <Target className="h-7 w-7 text-indigo-500" />
                </div>

                <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${controlRate}%` }}
                  />
                </div>

                <div className="space-y-3">
                  <MetricRow
                    label="Effective"
                    value={data.controls.effective}
                    total={data.controls.total}
                    dot="bg-emerald-500"
                  />
                  <MetricRow
                    label="Partially Effective"
                    value={data.controls.partial}
                    total={data.controls.total}
                    dot="bg-amber-400"
                  />
                  <MetricRow
                    label="Ineffective"
                    value={data.controls.ineffective}
                    total={data.controls.total}
                    dot="bg-red-500"
                  />
                </div>
              </div>
            </Panel>
          </div>

          {/* Operational metrics */}
          <div className="mt-5 grid grid-cols-3 gap-5">
            <ProgressPanel
              title="Remediation Progress"
              icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
              percentage={remediationRate}
              mainLabel={`${data.remediation.completed} of ${data.remediation.total} completed`}
              rows={[
                {
                  label: "Completed",
                  value: data.remediation.completed,
                  color: "bg-emerald-500",
                },
                {
                  label: "In Progress",
                  value: data.remediation.inProgress,
                  color: "bg-blue-500",
                },
                {
                  label: "Overdue",
                  value: data.remediation.overdue,
                  color: "bg-red-500",
                },
              ]}
            />

            <ProgressPanel
              title="Evidence Coverage"
              icon={<FileCheck2 className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              percentage={evidenceRate}
              mainLabel={`${data.evidence.approved} of ${data.evidence.total} approved`}
              rows={[
                {
                  label: "Approved",
                  value: data.evidence.approved,
                  color: "bg-emerald-500",
                },
                {
                  label: "Pending Review",
                  value: data.evidence.pending,
                  color: "bg-amber-400",
                },
                {
                  label: "Rejected",
                  value: data.evidence.rejected,
                  color: "bg-red-500",
                },
              ]}
            />

            <ProgressPanel
              title="Risk Distribution"
              icon={<ShieldAlert className="h-5 w-5 text-orange-500" />}
              iconBg="bg-orange-50"
              percentage={Math.round(
                ((data.risks.critical + data.risks.high) /
                  (data.risks.critical +
                    data.risks.high +
                    data.risks.medium +
                    data.risks.low)) *
                  100
              )}
              mainLabel="High priority risk exposure"
              rows={[
                {
                  label: "Critical",
                  value: data.risks.critical,
                  color: "bg-red-500",
                },
                {
                  label: "High",
                  value: data.risks.high,
                  color: "bg-orange-500",
                },
                {
                  label: "Medium",
                  value: data.risks.medium,
                  color: "bg-amber-400",
                },
                {
                  label: "Low",
                  value: data.risks.low,
                  color: "bg-emerald-500",
                },
              ]}
            />
          </div>

          {/* Tables */}
          <div className="mt-5 grid grid-cols-[1.6fr_1fr] gap-5">
            <Panel
              title="Recent Audits"
              subtitle="Latest audit activities across this workspace"
              action={
                <button
                  type="button"
                  className="text-[10px] font-semibold text-blue-600"
                >
                  View all
                </button>
              }
            >
              <div className="overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-y border-slate-100 bg-slate-50/70">
                    <tr>
                      {[
                        "Audit Name",
                        "Framework",
                        "Status",
                        "Progress",
                        "Due Date",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAudits.map((audit) => (
                      <tr
                        key={audit.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-semibold text-slate-800">
                            {audit.name}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-[10px] text-slate-600">
                          {audit.framework}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-md px-2 py-1 text-[9px] font-semibold ${statusClass(
                              audit.status
                            )}`}
                          >
                            {audit.status}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                  width: `${audit.progress}%`,
                                }}
                              />
                            </div>

                            <span className="text-[10px] text-slate-600">
                              {audit.progress}%
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right text-[10px] text-slate-600">
                          {audit.dueDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredAudits.length === 0 && (
                  <div className="py-10 text-center text-[11px] text-slate-500">
                    No audits match the selected status.
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title="Recent Activity"
              action={
                <button
                  type="button"
                  className="text-[10px] font-semibold text-blue-600"
                >
                  View all
                </button>
              }
            >
              <div className="divide-y divide-slate-100 px-5">
                {data.activities.map((activity, index) => (
                  <div
                    key={`${activity.title}-${index}`}
                    className="flex gap-3 py-3"
                  >
                    <ActivityIcon type={activity.icon} />

                    <div className="min-w-0">
                      <p className="text-[10.5px] leading-4 text-slate-800">
                        {activity.title}
                      </p>

                      <p className="mt-0.5 text-[9px] text-slate-500">
                        {activity.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Workspace health */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">
                  Workspace Health
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  High-level indicators for the current audit program
                </p>
              </div>

              <Activity className="h-5 w-5 text-slate-400" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <HealthMetric
                label="Control Effectiveness"
                value={`${controlRate}%`}
                status={controlRate >= 75 ? "Healthy" : "Attention"}
                positive={controlRate >= 75}
              />

              <HealthMetric
                label="Evidence Approval"
                value={`${evidenceRate}%`}
                status={evidenceRate >= 75 ? "Healthy" : "Attention"}
                positive={evidenceRate >= 75}
              />

              <HealthMetric
                label="Remediation Completion"
                value={`${remediationRate}%`}
                status={remediationRate >= 60 ? "Healthy" : "Attention"}
                positive={remediationRate >= 60}
              />

              <HealthMetric
                label="Open Findings"
                value={String(data.findings.open)}
                status={
                  data.findings.open <= 15 ? "Healthy" : "Attention"
                }
                positive={data.findings.open <= 15}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusLegend({
  label,
  value,
  total,
  dot,
}: {
  label: string;
  value: number;
  total: number;
  dot: string;
}) {
  const percentage =
    total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div className="flex min-w-[150px] items-center gap-2 text-[10px]">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="flex-1 text-slate-700">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
      <span className="text-slate-400">({percentage}%)</span>
    </div>
  );
}

function SeverityBar({
  label,
  value,
  max,
}: {
  label: Severity;
  value: number;
  max: number;
}) {
  const height = Math.max(12, Math.round((value / max) * 145));

  return (
    <div className="flex h-full w-14 flex-col items-center justifynd">
      <span className="mb-1 text-[10px] font-semibold text-slate-700">
        {value}
      </span>

      <div
        className={`w-10 rounded-t ${severityStyles[label]}`}
        style={{ height }}
      />

      <span className="mt-2 text-[9px] text-slate-500">
        {label}
      </span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  total,
  dot,
}: {
  label: string;
  value: number;
  total: number;
  dot: string;
}) {
  const percentage =
    total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />

      <span className="flex-1 text-[10px] text-slate-600">
        {label}
      </span>

      <span className="text-[10px] font-medium text-slate-700">
        {value}
      </span>

      <span className="w-9 text-right text-[9px] text-slate-400">
        {percentage}%
      </span>
    </div>
  );
}

function ProgressPanel({
  title,
  icon,
  iconBg,
  percentage,
  mainLabel,
  rows,
}: {
  title: string;
  icon: ReactNode;
  iconBg: string;
  percentage: number;
  mainLabel: string;
  rows: {
    label: string;
    value: number;
    color: string;
  }[];
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            {mainLabel}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-full bg-slate-100">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#2563eb 0deg ${
                percentage * 3.6
              }deg, #e2e8f0 ${percentage * 3.6}deg 360deg)`,
            }}
          />

          <div className="absolute inset-[7px] flex items-center justify-center rounded-full bg-white">
            <span className="text-[16px] font-semibold text-slate-900">
              {percentage}%
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {rows.map((row) => (
            <MetricRow
              key={row.label}
              label={row.label}
              value={row.value}
              total={total}
              dot={row.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  status,
  positive,
}: {
  label: string;
  value: string;
  status: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-slate-500">{label}</p>
          <p className="mt-1 text-[20px] font-semibold text-slate-900">
            {value}
          </p>
        </div>

        {positive ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
      </div>

      <p
        className={`mt-3 text-[9px] font-semibold ${
          positive ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {status}
      </p>
    </div>
  );
}
export const dynamic = 'force-dynamic';
