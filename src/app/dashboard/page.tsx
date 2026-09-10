"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getDashboardData, type DashboardStats } from "@/actions/dashboard";

type Severity = "Critical" | "High" | "Medium" | "Low";

const severityStyles: Record<Severity, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-amber-400",
  Low: "bg-emerald-500",
};

const STATUS_OPTIONS = [
  "All Audits",
  "Planning",
  "Fieldwork",
  "Review",
  "Reporting",
  "Completed",
] as const;

type ActivityItem = {
  title: string;
  sub: string;
  icon: "finding" | "evidence" | "audit" | "risk" | "report";
};

function statusClass(status: string) {
  if (status === "Completed") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "Review" || status === "Reporting") {
    return "bg-blue-50 text-blue-700";
  }
  if (status === "Planning") {
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
        <span className="text-slate-500">from last period</span>
      </div>
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
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);

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
  const height = Math.max(12, Math.round((value / Math.max(1, max)) * 145));

  return (
    <div className="flex h-full w-14 flex-col items-center justify-end">
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
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("All Audits");

  const [period, setPeriod] = useState("Current Audit Period");

  const loadData = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardData(workspaceId);
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.error || "Failed to load dashboard metrics");
      }
    } catch {
      setError("An unexpected error occurred while fetching metrics");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recentList = stats?.audits.recentList ?? [];
  const filteredAudits = useMemo(() => {
    if (statusFilter === "All Audits") {
      return recentList;
    }
    return recentList.filter((audit) => audit.status === statusFilter);
  }, [recentList, statusFilter]);

  const totalAudits = stats?.audits.total ?? 0;
  const inProgress =
    (stats?.audits.fieldwork ?? 0) +
    (stats?.audits.review ?? 0) +
    (stats?.audits.planning ?? 0) +
    (stats?.audits.reporting ?? 0);

  const openFindings =
    (stats?.findings.open ?? 0) + (stats?.findings.inProgress ?? 0);
  const closedFindings =
    (stats?.findings.closed ?? 0) + (stats?.findings.remediated ?? 0);
  const totalFindings = stats?.findings.total ?? 0;

  const remediationCompleted =
    (stats?.findings.remediated ?? 0) + (stats?.findings.closed ?? 0);
  const remediationTotal = stats?.findings.total ?? 0;
  const remediationRate =
    remediationTotal === 0
      ? 100
      : Math.round((remediationCompleted / remediationTotal) * 100);

  const evidenceApproved = stats?.evidence.accepted ?? 0;
  const evidenceTotal = stats?.evidence.total ?? 0;
  const evidenceRate =
    evidenceTotal === 0
      ? 100
      : Math.round((evidenceApproved / evidenceTotal) * 100);

  const controlRate = stats?.controls.compliancePercentage ?? 0;

  const auditStatusCounts = {
    Planning: stats?.audits.planning ?? 0,
    Fieldwork: stats?.audits.fieldwork ?? 0,
    Review: stats?.audits.review ?? 0,
    Completed: stats?.audits.completed ?? 0,
  };

  const findingsBySeverity: { severity: Severity; count: number }[] = [
    { severity: "Critical", count: stats?.findings.critical ?? 0 },
    { severity: "High", count: stats?.findings.high ?? 0 },
    { severity: "Medium", count: stats?.findings.medium ?? 0 },
    { severity: "Low", count: stats?.findings.low ?? 0 },
  ];
  const maxSeverityCount = Math.max(
    1,
    ...findingsBySeverity.map((item) => item.count)
  );

  const totalRisks = stats?.risks.total ?? 0;
  const highPriorityRisks =
    (stats?.risks.critical ?? 0) + (stats?.risks.high ?? 0);
  const riskExposure =
    totalRisks === 0 ? 0 : Math.round((highPriorityRisks / totalRisks) * 100);

  const activities: ActivityItem[] = useMemo(() => {
    if (!stats?.recentActivities) return [];
    return stats.recentActivities.slice(0, 5).map((a) => {
      let icon: ActivityItem["icon"] = "audit";
      const entity = (a.entityType || "").toLowerCase();
      if (entity.includes("finding")) icon = "finding";
      else if (entity.includes("evidence")) icon = "evidence";
      else if (entity.includes("risk")) icon = "risk";
      else if (entity.includes("report")) icon = "report";

      return {
        title: a.description || `${a.action} on ${a.entityType}`,
        sub: `${a.userName || "System"} • ${new Date(
          a.createdAt
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
        icon,
      };
    });
  }, [stats?.recentActivities]);

  if (authLoading || !user) {
    return null;
  }

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
                Live overview of audit activities, controls and compliance posture
                for {currentWorkspace.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className="h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-[11px] font-medium text-slate-700 shadow-sm outline-none"
                >
                  <option>Current Audit Period</option>
                  <option>Last 30 Days</option>
                  <option>Year to Date</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          )}

          {!workspaceId ? (
            <div className="flex flex-col items-center justify-center p-14 bg-white rounded-xl border border-slate-200 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">No Workspace Assigned</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  You are not currently assigned to any workspace. Contact your administrator or create a new workspace to access audits and compliance metrics.
                </p>
              </div>
              <a
                href="/workspaces"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Go to Workspaces
              </a>
            </div>
          ) : loading ? (
            <div className="flex h-64 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-slate-500">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-sm">Loading live audit metrics...</span>
            </div>
          ) : (
            <>
              {/* Top metrics */}
              <div className="grid grid-cols-4 gap-5">
                <StatCard
                  title="Total Audits"
                  value={String(totalAudits)}
                  change="Live"
                  positive
                  icon={
                    <ClipboardCheck className="h-6 w-6 text-blue-600" />
                  }
                  iconBg="bg-blue-50"
                />

                <StatCard
                  title="Audits in Progress"
                  value={String(inProgress)}
                  change="Active"
                  positive
                  icon={<Clock3 className="h-6 w-6 text-orange-500" />}
                  iconBg="bg-orange-50"
                />

                <StatCard
                  title="Open Findings"
                  value={String(openFindings)}
                  change="Open"
                  positive={openFindings === 0}
                  icon={
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  }
                  iconBg="bg-red-50"
                />

                <StatCard
                  title="Closed Findings"
                  value={String(closedFindings)}
                  change="Resolved"
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
                        label="Planning"
                        value={auditStatusCounts.Planning}
                        total={totalAudits}
                        dot="bg-blue-500"
                      />

                      <StatusLegend
                        label="Fieldwork"
                        value={auditStatusCounts.Fieldwork}
                        total={totalAudits}
                        dot="bg-amber-400"
                      />

                      <StatusLegend
                        label="Review"
                        value={auditStatusCounts.Review}
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
                      Authoritative DB
                    </span>
                  }
                >
                  <div className="px-5 pb-5">
                    <div className="relative h-[205px]">
                      <div className="absolute inset-x-0 bottom-8 top-3 flex flex-col justify-between pl-7">
                        {[
                          Math.round(maxSeverityCount),
                          Math.round(maxSeverityCount * 0.75),
                          Math.round(maxSeverityCount * 0.5),
                          Math.round(maxSeverityCount * 0.25),
                          0,
                        ].map((number, idx) => (
                          <div
                            key={idx}
                            className="flex items-center"
                          >
                            <span className="absolute left-0 w-6 text-[9px] text-slate-400">
                              {number}
                            </span>
                            <div className="h-px flex-1 bg-slate-100" />
                          </div>
                        ))}
                      </div>

                      <div className="absolute bottom-8 left-8 right-0 flex h-[168px] items-end justify-around">
                        {findingsBySeverity.map((item) => (
                          <SeverityBar
                            key={item.severity}
                            label={item.severity}
                            value={item.count}
                            max={maxSeverityCount}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </Panel>

                {/* Compliance posture */}
                <Panel
                  title="Compliance Posture"
                  subtitle="Control assessment effectiveness"
                >
                  <div className="px-5 pb-5">
                    <div className="mb-4 flex items-end justify-between">
                      <div>
                        <p className="text-[30px] font-semibold text-slate-900">
                          {controlRate}%
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Implemented controls
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
                        label="Implemented"
                        value={stats?.controls.implemented ?? 0}
                        total={stats?.controls.total ?? 0}
                        dot="bg-emerald-500"
                      />
                      <MetricRow
                        label="Partially Implemented"
                        value={stats?.controls.partiallyImplemented ?? 0}
                        total={stats?.controls.total ?? 0}
                        dot="bg-amber-400"
                      />
                      <MetricRow
                        label="Not Implemented"
                        value={stats?.controls.notImplemented ?? 0}
                        total={stats?.controls.total ?? 0}
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
                  mainLabel={`${remediationCompleted} of ${remediationTotal} resolved`}
                  rows={[
                    {
                      label: "Remediated / Closed",
                      value: remediationCompleted,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "In Progress",
                      value: stats?.findings.inProgress ?? 0,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Open / Unresolved",
                      value: stats?.findings.open ?? 0,
                      color: "bg-red-500",
                    },
                  ]}
                />

                <ProgressPanel
                  title="Evidence Coverage"
                  icon={<FileCheck2 className="h-5 w-5 text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  percentage={evidenceRate}
                  mainLabel={`${evidenceApproved} of ${evidenceTotal} approved`}
                  rows={[
                    {
                      label: "Accepted",
                      value: stats?.evidence.accepted ?? 0,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Under Review / Submitted",
                      value:
                        (stats?.evidence.underReview ?? 0) +
                        (stats?.evidence.submitted ?? 0),
                      color: "bg-amber-400",
                    },
                    {
                      label: "Rejected",
                      value: stats?.evidence.rejected ?? 0,
                      color: "bg-red-500",
                    },
                  ]}
                />

                <ProgressPanel
                  title="Risk Distribution"
                  icon={<ShieldAlert className="h-5 w-5 text-orange-500" />}
                  iconBg="bg-orange-50"
                  percentage={riskExposure}
                  mainLabel="High priority risk exposure"
                  rows={[
                    {
                      label: "Critical",
                      value: stats?.risks.critical ?? 0,
                      color: "bg-red-500",
                    },
                    {
                      label: "High",
                      value: stats?.risks.high ?? 0,
                      color: "bg-orange-500",
                    },
                    {
                      label: "Medium",
                      value: stats?.risks.medium ?? 0,
                      color: "bg-amber-400",
                    },
                    {
                      label: "Low",
                      value: stats?.risks.low ?? 0,
                      color: "bg-emerald-500",
                    },
                  ]}
                />
              </div>

              {/* Tables */}
              <div className="mt-5 grid grid-cols-[1.6fr_1fr] gap-5">
                <Panel
                  title="Recent Audits"
                  subtitle="Latest audits across this workspace"
                  action={
                    <span className="text-[10px] font-medium text-slate-400">
                      Live
                    </span>
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
                              {audit.dueDate ? new Date(audit.dueDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredAudits.length === 0 && (
                      <div className="py-10 text-center text-[11px] text-slate-500">
                        No audits found in this workspace.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel
                  title="Recent Activity"
                  subtitle="Latest events logged to audit trail"
                >
                  <div className="divide-y divide-slate-100 px-5">
                    {activities.map((activity, index) => (
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

                    {activities.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-slate-400">
                        No recent activity recorded yet.
                      </div>
                    )}
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
                      Authoritative indicators for the current audit program
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
                    value={String(openFindings)}
                    status={openFindings <= 15 ? "Healthy" : "Attention"}
                    positive={openFindings <= 15}
                  />
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
