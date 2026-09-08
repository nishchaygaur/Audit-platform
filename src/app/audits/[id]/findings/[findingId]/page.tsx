"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FileWarning,
  Link2,
  MessageSquare,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getFinding,
  updateFinding,
} from "@/actions/findings";
import {
  type FindingSeverity,
  type FindingStatus,
  VALID_FINDING_STATUSES,
} from "@/lib/findings-types";

type FindingDbRow = {
  id: string;
  reference: string;
  title: string;
  description: string;
  framework: string;
  control: string;
  severity: FindingSeverity;
  owner: string;
  identified_date: string;
  due_date: string;
  status: FindingStatus;
  evidence?: string;
  recommendation?: string;
  auditor?: string;
};

type Finding = {
  id: string;
  reference: string;
  title: string;
  description: string;
  framework: string;
  control: string;
  severity: FindingSeverity;
  owner: string;
  identifiedDate: string;
  dueDate: string;
  status: FindingStatus;
  evidence?: string;
  recommendation?: string;
};

const evidenceItems = [
  { ref: "EV-0003", name: "MFA Configuration Screenshot", type: "Screenshot", status: "Approved", date: "15 May 2024" },
  { ref: "EV-0007", name: "Privileged Account Register", type: "Report", status: "Approved", date: "16 May 2024" },
];

const initialActions = [
  { id: 1, title: "Enable MFA for all privileged administrator accounts", owner: "Alice Smith", due: "24 May 2024", status: "In Progress" },
  { id: 2, title: "Validate MFA coverage and retain implementation evidence", owner: "John Carter", due: "31 May 2024", status: "Open" },
];

export default function FindingDetailsPage() {
  const params = useParams<{ id: string; findingId: string }>();
  const { currentWorkspace } = useWorkspace();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actions, setActions] = useState(initialActions);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { author: "Alice Smith", text: "Remediation rollout is underway for the finding.", date: "17 May 2024, 10:42" },
    { author: "John Carter", text: "Please attach the final configuration evidence once validation is complete.", date: "16 May 2024, 15:18" },
  ]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!currentWorkspace?.id || !params?.findingId) {
        if (isMounted) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getFinding(currentWorkspace.id, params.findingId, params.id);
        if (isMounted) {
          if (res.success && res.data) {
            const d = res.data as unknown as FindingDbRow;
            setFinding({
              id: d.id,
              reference: d.reference,
              title: d.title,
              description: d.description,
              framework: d.framework,
              control: d.control,
              severity: d.severity,
              owner: d.owner,
              identifiedDate: d.identified_date,
              dueDate: d.due_date,
              status: d.status,
              evidence: d.evidence,
              recommendation: d.recommendation,
            });
          } else {
            setFinding(null);
          }
        }
      } catch {
        if (isMounted) setFinding(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [currentWorkspace?.id, params?.findingId, params?.id]);

  async function handleStatusChange(newStatus: FindingStatus) {
    if (!currentWorkspace?.id || !params?.findingId || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await updateFinding(
        currentWorkspace.id,
        params.findingId,
        { status: newStatus },
        params.id
      );
      if (res.success) {
        setFinding((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  function addComment() {
    if (!comment.trim()) return;
    setComments((items) => [{ author: "Alice Smith", text: comment.trim(), date: "Just now" }, ...items]);
    setComment("");
  }

  function addAction() {
    setActions((items) => [...items, { id: Date.now(), title: "New remediation action", owner: "Unassigned", due: "Not specified", status: "Open" }]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
        <main className="ml-[250px] min-h-screen">
          <Header />
          <section className="px-8 py-16 text-center text-slate-500">
            <Clock3 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm font-medium">Loading finding details...</p>
          </section>
        </main>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
        <main className="ml-[250px] min-h-screen">
          <Header />
          <section className="px-8 py-16 text-center">
            <FileWarning className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800">Finding Not Found</h2>
            <p className="mt-1 text-sm text-slate-500">
              The requested finding does not exist in this audit and workspace.
            </p>
            <div className="mt-6">
              <Link
                href={`/audits/${params.id}/findings`}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Findings
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const severityClass =
    finding.severity === "Critical"
      ? "bg-red-50 text-red-700"
      : finding.severity === "High"
        ? "bg-orange-50 text-orange-700"
        : finding.severity === "Medium"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600";

  const statusClass =
    finding.status === "Open"
      ? "bg-red-50 text-red-700"
      : finding.status === "In Progress"
        ? "bg-blue-50 text-blue-700"
        : finding.status === "Remediated"
          ? "bg-emerald-50 text-emerald-700"
          : finding.status === "Accepted Risk"
            ? "bg-violet-50 text-violet-700"
            : "bg-slate-100 text-slate-600";

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] min-h-screen">
        <Header />
        <section className="px-8 py-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Link
                href={`/audits/${params.id}/findings`}
                className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Findings
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <FileWarning className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[28px] font-semibold tracking-[-0.5px]">Finding Details</h1>
                    <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                      {finding.reference}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-slate-500">
                    Review, track and manage the lifecycle of this audit finding.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-9">
              <div className="relative group">
                <button
                  type="button"
                  disabled={updatingStatus}
                  className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Change Status <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="invisible absolute right-0 top-10 z-40 w-36 rounded-md border border-slate-200 bg-white py-1 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {VALID_FINDING_STATUSES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleStatusChange(option)}
                      className="flex w-full items-center px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-4 gap-5">
            <MetricCard label="Severity" value={finding.severity} tone={severityClass} icon={<ShieldCheck className="h-4 w-4" />} />
            <MetricCard label="Status" value={finding.status} tone={statusClass} icon={<Clock3 className="h-4 w-4" />} />
            <MetricCard label="Owner" value={finding.owner} icon={<UserRound className="h-4 w-4" />} />
            <MetricCard label="Due Date" value={finding.dueDate} icon={<CalendarDays className="h-4 w-4" />} />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
            <div className="space-y-5">
              <Panel title="Finding Overview" icon={<FileWarning className="h-4 w-4" />}>
                <h2 className="text-[16px] font-semibold text-slate-800">{finding.title}</h2>
                <p className="mt-2 text-[12px] leading-5 text-slate-500">{finding.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-slate-100 pt-4">
                  <Detail label="Framework" value={finding.framework} />
                  <Detail label="Control" value={finding.control} />
                  <Detail label="Identified Date" value={finding.identifiedDate} />
                  <Detail label="Due Date" value={finding.dueDate} />
                </div>
                {finding.recommendation && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">Recommendation</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-600">{finding.recommendation}</p>
                  </div>
                )}
              </Panel>

              <Panel
                title="Linked Evidence"
                icon={<FileCheck2 className="h-4 w-4" />}
                action={<span className="text-[10px] text-slate-400">{finding.evidence ? "1 item" : `${evidenceItems.length} items`}</span>}
              >
                {finding.evidence ? (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                        <FileCheck2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-700">{finding.evidence}</p>
                        <p className="mt-0.5 text-[9px] text-slate-400">Attached finding evidence</p>
                      </div>
                    </div>
                    <span className="ml-3 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-medium text-emerald-700">Linked</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {evidenceItems.map((item) => (
                      <div key={item.ref} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                            <FileCheck2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-slate-700">{item.name}</p>
                            <p className="mt-0.5 text-[9px] text-slate-400">{item.ref} · {item.type} · {item.date}</p>
                          </div>
                        </div>
                        <span className="ml-3 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-medium text-emerald-700">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel
                title="Remediation Actions"
                icon={<CheckCircle2 className="h-4 w-4" />}
                action={
                  <button
                    type="button"
                    onClick={addAction}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Action
                  </button>
                }
              >
                <div className="divide-y divide-slate-100">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-700">{action.title}</p>
                        <p className="mt-1 text-[9px] text-slate-400">Owner: {action.owner} · Due: {action.due}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-medium ${action.status === "In Progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {action.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel title="Control Mapping" icon={<Link2 className="h-4 w-4" />}>
                <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-[9px] uppercase tracking-wide text-slate-400">Framework</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-700">{finding.framework}</p>
                  <div className="my-3 border-t border-slate-200" />
                  <p className="text-[9px] uppercase tracking-wide text-slate-400">Control</p>
                  <p className="mt-1 text-[12px] font-semibold text-blue-600">{finding.control}</p>
                </div>
                <p className="mt-3 text-[9px] leading-4 text-slate-400">
                  This finding is mapped to the control above for audit traceability and remediation tracking.
                </p>
              </Panel>

              <Panel title="Comments & Notes" icon={<MessageSquare className="h-4 w-4" />}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment or audit note..."
                  className="h-20 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={addComment}
                  disabled={!comment.trim()}
                  className="mt-2 h-8 rounded-md bg-blue-600 px-3 text-[10px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add Comment
                </button>
                <div className="mt-4 divide-y divide-slate-100">
                  {comments.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="py-3 first:pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-700">{item.author}</span>
                        <span className="text-[8px] text-slate-400">{item.date}</span>
                      </div>
                      <p className="mt-1 text-[9px] leading-4 text-slate-500">{item.text}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Activity History" icon={<Clock3 className="h-4 w-4" />}>
                <TimelineItem
                  title="Finding identified"
                  detail={`${finding.reference} created during audit review`}
                  date={finding.identifiedDate}
                />
                <TimelineItem
                  title="Owner assigned"
                  detail={`${finding.owner} assigned as finding owner`}
                  date={finding.identifiedDate}
                />
                <TimelineItem
                  title="Status recorded"
                  detail={`Current status: ${finding.status}`}
                  date={finding.dueDate}
                  last
                />
              </Panel>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            {icon}
          </div>
          <h3 className="text-[12px] font-semibold text-slate-800">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div className="mt-2">
        <span className={tone ? `inline-flex rounded-full px-2.5 py-1 text-[9px] font-medium ${tone}` : "text-[12px] font-semibold text-slate-700"}>
          {value}
        </span>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-700">{value}</p>
    </div>
  );
}

function TimelineItem({
  title,
  detail,
  date,
  last,
}: {
  title: string;
  detail: string;
  date: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      <div className="flex w-3 shrink-0 justify-center">
        <span className="relative z-10 mt-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
        {!last && <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium text-slate-700">{title}</p>
          <span className="shrink-0 text-[8px] text-slate-400">{date}</span>
        </div>
        <p className="mt-1 text-[9px] leading-4 text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
