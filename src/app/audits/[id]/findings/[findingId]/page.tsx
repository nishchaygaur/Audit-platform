"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
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
  Pencil,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";

type Severity = "Critical" | "High" | "Medium" | "Low";
type Status = "Open" | "In Progress" | "Resolved" | "Accepted" | "Closed";

type Finding = {
  id: number;
  reference: string;
  title: string;
  description: string;
  framework: string;
  control: string;
  severity: Severity;
  owner: string;
  identifiedDate: string;
  dueDate: string;
  status: Status;
};

const FINDINGS: Record<string, Finding[]> = {
  "abc-technologies": [
    { id: 1, reference: "FND-2024-001", title: "Privileged accounts lack MFA", description: "Several privileged administrator accounts are not protected by multi-factor authentication.", framework: "ISO 27001", control: "A.5.17", severity: "Critical", owner: "Alice Smith", identifiedDate: "06 May 2024", dueDate: "31 May 2024", status: "Open" },
    { id: 2, reference: "FND-2024-002", title: "Incomplete access review evidence", description: "Quarterly user access reviews were performed, but supporting approval evidence was incomplete.", framework: "NIST 800-53", control: "AC-2", severity: "High", owner: "John Carter", identifiedDate: "10 May 2024", dueDate: "07 Jun 2024", status: "In Progress" },
    { id: 3, reference: "FND-2024-003", title: "Security awareness records outdated", description: "Training records for a number of employees have not been updated following role changes.", framework: "ISO 27001", control: "A.6.3", severity: "Medium", owner: "Emily Davis", identifiedDate: "14 May 2024", dueDate: "14 Jun 2024", status: "In Progress" },
    { id: 4, reference: "FND-2024-004", title: "Asset inventory contains stale records", description: "The information asset register contains systems that have been retired but remain listed as active.", framework: "NIST CSF", control: "ID.AM", severity: "Low", owner: "Michael Lee", identifiedDate: "18 May 2024", dueDate: "28 Jun 2024", status: "Resolved" },
    { id: 5, reference: "FND-2024-005", title: "Vendor risk assessment not completed", description: "The annual security assessment for a critical third-party service provider remains outstanding.", framework: "SOC 2", control: "CC3.2", severity: "High", owner: "Alice Smith", identifiedDate: "21 May 2024", dueDate: "21 Jun 2024", status: "Open" },
  ],
  "xyz-finance": [
    { id: 11, reference: "FND-2024-011", title: "Excessive user permissions", description: "Several users retain access permissions that are no longer required for their current roles.", framework: "ISO 27001", control: "A.5.15", severity: "High", owner: "Sarah Brown", identifiedDate: "05 May 2024", dueDate: "05 Jun 2024", status: "Open" },
    { id: 12, reference: "FND-2024-012", title: "Incident response documentation incomplete", description: "Incident response procedures do not document escalation requirements for all critical scenarios.", framework: "NIST CSF", control: "RS.MA", severity: "Medium", owner: "David Wilson", identifiedDate: "12 May 2024", dueDate: "30 Jun 2024", status: "In Progress" },
    { id: 13, reference: "FND-2024-013", title: "Backup restoration test overdue", description: "A scheduled disaster recovery restoration test was not completed within the defined testing period.", framework: "NIST RMF", control: "CP-4", severity: "High", owner: "Sarah Brown", identifiedDate: "17 May 2024", dueDate: "20 Jun 2024", status: "Open" },
    { id: 14, reference: "FND-2024-014", title: "Security policy acknowledgement gap", description: "A small number of employees have not acknowledged the latest information security policy.", framework: "SOC 2", control: "CC2.2", severity: "Low", owner: "David Wilson", identifiedDate: "20 May 2024", dueDate: "30 Jun 2024", status: "Resolved" },
  ],
  "pqr-healthcare": [
    { id: 21, reference: "FND-2024-021", title: "Clinical application accounts not reviewed", description: "Periodic access review for several clinical applications was not completed on schedule.", framework: "ISO 27001", control: "A.5.18", severity: "Critical", owner: "Michael Lee", identifiedDate: "04 May 2024", dueDate: "31 May 2024", status: "Open" },
    { id: 22, reference: "FND-2024-022", title: "Logging coverage inconsistent", description: "Security event logging is not consistently enabled across several supporting infrastructure components.", framework: "NIST 800-53", control: "AU-2", severity: "High", owner: "Emily Davis", identifiedDate: "11 May 2024", dueDate: "15 Jun 2024", status: "In Progress" },
    { id: 23, reference: "FND-2024-023", title: "Supplier security clauses missing", description: "Some supplier agreements do not contain the required information security provisions.", framework: "SOC 2", control: "CC9.2", severity: "Medium", owner: "Alice Smith", identifiedDate: "16 May 2024", dueDate: "16 Jun 2024", status: "Open" },
  ],
};

const evidence = [
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
  const [status, setStatus] = useState<Status | null>(null);
  const [actions, setActions] = useState(initialActions);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { author: "Alice Smith", text: "MFA rollout is underway for the remaining privileged accounts.", date: "17 May 2024, 10:42" },
    { author: "John Carter", text: "Please attach the final configuration evidence once validation is complete.", date: "16 May 2024, 15:18" },
  ]);

  const finding = useMemo(() => {
    const list = FINDINGS[currentWorkspace.id] ?? FINDINGS["abc-technologies"];
    return list.find((item) => String(item.id) === params.findingId) ?? list[0];
  }, [currentWorkspace.id, params.findingId]);

  const currentStatus = status ?? finding.status;

  if (!finding) return null;

  const severityClass = finding.severity === "Critical" ? "bg-red-50 text-red-700" : finding.severity === "High" ? "bg-orange-50 text-orange-700" : finding.severity === "Medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  const statusClass = currentStatus === "Open" ? "bg-red-50 text-red-700" : currentStatus === "In Progress" ? "bg-blue-50 text-blue-700" : currentStatus === "Resolved" ? "bg-emerald-50 text-emerald-700" : currentStatus === "Accepted" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600";

  function addComment() {
    if (!comment.trim()) return;
    setComments((items) => [{ author: "Alice Smith", text: comment.trim(), date: "Just now" }, ...items]);
    setComment("");
  }

  function addAction() {
    setActions((items) => [...items, { id: Date.now(), title: "New remediation action", owner: "Unassigned", due: "Not specified", status: "Open" }]);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] min-h-screen">
        <Header />
        <section className="px-8 py-7">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Link href={`/audits/${params.id}/findings`} className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Findings
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50"><FileWarning className="h-5 w-5 text-red-600" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[28px] font-semibold tracking-[-0.5px]">Finding Details</h1>
                    <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">{finding.reference}</span>
                  </div>
                  <p className="mt-1 text-[14px] text-slate-500">Review, track and manage the lifecycle of this audit finding.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-9">
              <button type="button" className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Edit Finding</button>
              <div className="relative group">
                <button type="button" className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-[11px] font-medium text-white hover:bg-blue-700">Change Status <ChevronDown className="h-3.5 w-3.5" /></button>
                <div className="invisible absolute right-0 top-10 z-40 w-36 rounded-md border border-slate-200 bg-white py-1 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {(["Open", "In Progress", "Resolved", "Accepted", "Closed"] as Status[]).map((option) => (
                    <button key={option} type="button" onClick={() => setStatus(option)} className="flex w-full items-center px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50">{option}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-4 gap-5">
            <MetricCard label="Severity" value={finding.severity} tone={severityClass} icon={<ShieldCheck className="h-4 w-4" />} />
            <MetricCard label="Status" value={currentStatus} tone={statusClass} icon={<Clock3 className="h-4 w-4" />} />
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
              </Panel>

              <Panel title="Linked Evidence" icon={<FileCheck2 className="h-4 w-4" />} action={<span className="text-[10px] text-slate-400">{evidence.length} items</span>}>
                <div className="divide-y divide-slate-100">
                  {evidence.map((item) => (
                    <div key={item.ref} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600"><FileCheck2 className="h-4 w-4" /></div>
                        <div className="min-w-0"><p className="truncate text-[11px] font-medium text-slate-700">{item.name}</p><p className="mt-0.5 text-[9px] text-slate-400">{item.ref} · {item.type} · {item.date}</p></div>
                      </div>
                      <span className="ml-3 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-medium text-emerald-700">{item.status}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Remediation Actions" icon={<CheckCircle2 className="h-4 w-4" />} action={<button type="button" onClick={addAction} className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700"><Plus className="h-3.5 w-3.5" /> Add Action</button>}>
                <div className="divide-y divide-slate-100">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0"><p className="text-[11px] font-medium text-slate-700">{action.title}</p><p className="mt-1 text-[9px] text-slate-400">Owner: {action.owner} · Due: {action.due}</p></div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-medium ${action.status === "In Progress" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{action.status}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel title="Control Mapping" icon={<Link2 className="h-4 w-4" />}>
                <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3"><p className="text-[9px] uppercase tracking-wide text-slate-400">Framework</p><p className="mt-1 text-[12px] font-semibold text-slate-700">{finding.framework}</p><div className="my-3 border-t border-slate-200" /><p className="text-[9px] uppercase tracking-wide text-slate-400">Control</p><p className="mt-1 text-[12px] font-semibold text-blue-600">{finding.control}</p></div>
                <p className="mt-3 text-[9px] leading-4 text-slate-400">This finding is mapped to the control above for audit traceability and remediation tracking.</p>
              </Panel>

              <Panel title="Comments & Notes" icon={<MessageSquare className="h-4 w-4" />}>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment or audit note..." className="h-20 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
                <button type="button" onClick={addComment} disabled={!comment.trim()} className="mt-2 h-8 rounded-md bg-blue-600 px-3 text-[10px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Add Comment</button>
                <div className="mt-4 divide-y divide-slate-100">
                  {comments.map((item, index) => <div key={`${item.date}-${index}`} className="py-3 first:pt-0"><div className="flex items-center justify-between"><span className="text-[10px] font-medium text-slate-700">{item.author}</span><span className="text-[8px] text-slate-400">{item.date}</span></div><p className="mt-1 text-[9px] leading-4 text-slate-500">{item.text}</p></div>)}
                </div>
              </Panel>

              <Panel title="Activity History" icon={<Clock3 className="h-4 w-4" />}>
                <TimelineItem title="Finding identified" detail={`${finding.reference} created during audit review`} date={finding.identifiedDate} />
                <TimelineItem title="Evidence linked" detail="MFA configuration evidence attached" date="15 May 2024" />
                <TimelineItem title="Owner assigned" detail={`${finding.owner} assigned as finding owner`} date="16 May 2024" />
                <TimelineItem title={currentStatus === finding.status ? "Status recorded" : "Status changed"} detail={`Current status: ${currentStatus}`} date="17 May 2024" last />
              </Panel>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Panel({ title, icon, action, children }: { title: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">{icon}</div><h3 className="text-[12px] font-semibold text-slate-800">{title}</h3></div>{action}</div>{children}</div>;
}

function MetricCard({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"><div className="flex items-center justify-between"><span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</span><span className="text-slate-400">{icon}</span></div><div className="mt-2"><span className={tone ? `inline-flex rounded-full px-2.5 py-1 text-[9px] font-medium ${tone}` : "text-[12px] font-semibold text-slate-700"}>{value}</span></div></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-[11px] font-medium text-slate-700">{value}</p></div>; }

function TimelineItem({ title, detail, date, last }: { title: string; detail: string; date: string; last?: boolean }) {
  return <div className="relative flex gap-3 pb-4 last:pb-0"><div className="flex w-3 shrink-0 justify-center"><span className="relative z-10 mt-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />{!last && <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />}</div><div className="min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-medium text-slate-700">{title}</p><span className="shrink-0 text-[8px] text-slate-400">{date}</span></div><p className="mt-1 text-[9px] leading-4 text-slate-400">{detail}</p></div></div>;
}
