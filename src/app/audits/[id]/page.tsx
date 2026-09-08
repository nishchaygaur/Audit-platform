/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FileWarning,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  TriangleAlert,
  Upload,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAudits, type Audit } from "@/context/AuditContext";
import {
  type EvidenceItem,
  type Finding,
  type RiskItem,
  type RemediationItem,
  type ReportItem,
  getStoredEvidence,
  saveStoredEvidence,
  getStoredFindings,
  saveStoredFindings,
  getStoredRisks,
  saveStoredRisks,
  getStoredRemediation,
  saveStoredRemediation,
  getStoredReports,
  saveStoredReports,
} from "@/lib/grcData";

/* ============================================================
   FALLBACK AUDIT DATA
============================================================ */

const auditData = {
  "AUD-2024-001": {
    id: "AUD-2024-001",
    name: "ISO 27001 Internal Audit",
    framework: "ISO 27001",
    lead: "Alice Smith",
    status: "In Progress",
    progress: 68,
    startDate: "01 May 2024",
    dueDate: "12 Jun 2024",
    objective:
      "Assess the organization's Information Security Management System against ISO 27001 requirements and identify areas requiring improvement.",
    scope:
      "Information security management system, access control, asset management, supplier relationships, incident management and business continuity.",
    controls: 114,
    evidence: 86,
    findings: 7,
    risks: 3,
  },

  "AUD-2024-002": {
    id: "AUD-2024-002",
    name: "NIST CSF Assessment",
    framework: "NIST CSF",
    lead: "John Carter",
    status: "In Review",
    progress: 86,
    startDate: "06 May 2024",
    dueDate: "15 Jun 2024",
    objective:
      "Evaluate the organization's cybersecurity posture against the NIST Cybersecurity Framework.",
    scope:
      "Identify, Protect, Detect, Respond and Recover functions across the organization's information systems.",
    controls: 108,
    evidence: 94,
    findings: 4,
    risks: 2,
  },

  "AUD-2024-003": {
    id: "AUD-2024-003",
    name: "Vendor Risk Assessment",
    framework: "ISO 27001",
    lead: "Emily Davis",
    status: "Not Started",
    progress: 0,
    startDate: "20 May 2024",
    dueDate: "20 Jun 2024",
    objective:
      "Assess information-security risks associated with critical third-party suppliers.",
    scope:
      "Supplier security controls, contracts, data protection, access management and supplier monitoring.",
    controls: 42,
    evidence: 0,
    findings: 0,
    risks: 4,
  },

  "AUD-2024-004": {
    id: "AUD-2024-004",
    name: "Access Control Review",
    framework: "NIST 800-53",
    lead: "Michael Lee",
    status: "Completed",
    progress: 100,
    startDate: "01 May 2024",
    dueDate: "05 Jun 2024",
    objective:
      "Review logical and physical access controls and verify implementation against applicable security requirements.",
    scope:
      "Identity management, authentication, authorization, privileged access and account lifecycle management.",
    controls: 58,
    evidence: 58,
    findings: 6,
    risks: 1,
  },

  "AUD-2024-005": {
    id: "AUD-2024-005",
    name: "Risk Management Assessment",
    framework: "NIST RMF",
    lead: "Alice Smith",
    status: "In Progress",
    progress: 42,
    startDate: "15 May 2024",
    dueDate: "25 Jun 2024",
    objective:
      "Evaluate the organization's risk management process using the NIST Risk Management Framework.",
    scope:
      "Categorize, select, implement, assess, authorize and continuously monitor information systems.",
    controls: 76,
    evidence: 31,
    findings: 3,
    risks: 5,
  },
} as const;

/* ============================================================
   CONTROL DATA
============================================================ */

const controls = [
  {
    id: "A.5.1",
    name: "Policies for information security",
    domain: "Organizational",
    requirement:
      "Information security policies shall be defined, approved, published and reviewed.",
    evidence: 4,
    findings: 0,
    status: "Compliant",
  },
  {
    id: "A.5.7",
    name: "Threat intelligence",
    domain: "Organizational",
    requirement:
      "Information relating to information security threats shall be collected and analyzed.",
    evidence: 2,
    findings: 1,
    status: "Partially Compliant",
  },
  {
    id: "A.5.15",
    name: "Access control",
    domain: "Organizational",
    requirement:
      "Rules to control physical and logical access to information and assets shall be established.",
    evidence: 5,
    findings: 1,
    status: "Non-Compliant",
  },
  {
    id: "A.5.23",
    name: "Information security for use of cloud services",
    domain: "Organizational",
    requirement:
      "Processes for acquisition, use, management and exit from cloud services shall be established.",
    evidence: 3,
    findings: 0,
    status: "Under Review",
  },
  {
    id: "A.6.1",
    name: "Screening",
    domain: "People",
    requirement:
      "Background verification checks shall be performed for candidates and personnel.",
    evidence: 3,
    findings: 0,
    status: "Compliant",
  },
  {
    id: "A.6.3",
    name: "Information security awareness",
    domain: "People",
    requirement:
      "Personnel shall receive appropriate information security awareness and training.",
    evidence: 4,
    findings: 1,
    status: "Partially Compliant",
  },
  {
    id: "A.7.4",
    name: "Physical security monitoring",
    domain: "Physical",
    requirement:
      "Premises shall be continuously monitored for unauthorized physical access.",
    evidence: 2,
    findings: 0,
    status: "Compliant",
  },
  {
    id: "A.8.2",
    name: "Privileged access rights",
    domain: "Technological",
    requirement:
      "Allocation and use of privileged access rights shall be restricted and managed.",
    evidence: 5,
    findings: 2,
    status: "Non-Compliant",
  },
  {
    id: "A.8.5",
    name: "Secure authentication",
    domain: "Technological",
    requirement:
      "Secure authentication technologies and procedures shall be implemented.",
    evidence: 6,
    findings: 1,
    status: "Partially Compliant",
  },
  {
    id: "A.8.15",
    name: "Logging",
    domain: "Technological",
    requirement:
      "Logs recording activities, exceptions, faults and other relevant events shall be produced.",
    evidence: 4,
    findings: 0,
    status: "Compliant",
  },
];

/* ============================================================
   AUDIT-SPECIFIC CONTROL STATUS SUMMARY
============================================================ */

const controlStatusSummaryByAuditId: Record<
  string,
  {
    compliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
    underReview: number;
  }
> = {
  "AUD-2024-001": {
    compliant: 62,
    partiallyCompliant: 28,
    nonCompliant: 14,
    underReview: 10,
  },

  "AUD-2024-002": {
    compliant: 58,
    partiallyCompliant: 27,
    nonCompliant: 15,
    underReview: 8,
  },

  "AUD-2024-003": {
    compliant: 25,
    partiallyCompliant: 12,
    nonCompliant: 4,
    underReview: 1,
  },

  "AUD-2024-004": {
    compliant: 31,
    partiallyCompliant: 15,
    nonCompliant: 8,
    underReview: 4,
  },

  "AUD-2024-005": {
    compliant: 39,
    partiallyCompliant: 20,
    nonCompliant: 10,
    underReview: 7,
  },

  "AUD-2024-011": {
    compliant: 48,
    partiallyCompliant: 25,
    nonCompliant: 12,
    underReview: 6,
  },

  "AUD-2024-012": {
    compliant: 34,
    partiallyCompliant: 16,
    nonCompliant: 8,
    underReview: 5,
  },

  "AUD-2024-021": {
    compliant: 51,
    partiallyCompliant: 25,
    nonCompliant: 13,
    underReview: 8,
  },
};

/* ============================================================
   AUDIT-SPECIFIC CONTROL MAPPING
============================================================ */

const controlsByAuditId: Record<string, typeof controls> = {
  "AUD-2024-001": [
    controls[0],
    controls[1],
    controls[2],
    controls[3],
    controls[4],
    controls[5],
    controls[6],
    controls[7],
    controls[8],
    controls[9],
  ],

  "AUD-2024-002": [
    controls[1],
    controls[2],
    controls[5],
    controls[7],
    controls[8],
    controls[9],
  ],

  "AUD-2024-003": [
    controls[0],
    controls[2],
    controls[3],
    controls[4],
    controls[6],
  ],

  "AUD-2024-004": [
    controls[2],
    controls[7],
    controls[8],
  ],

  "AUD-2024-005": [
    controls[0],
    controls[1],
    controls[3],
    controls[5],
    controls[7],
    controls[9],
  ],

  "AUD-2024-011": [
    controls[0],
    controls[2],
    controls[3],
    controls[7],
  ],

  "AUD-2024-012": [
    controls[1],
    controls[5],
    controls[8],
    controls[9],
  ],

  "AUD-2024-021": [
    controls[0],
    controls[2],
    controls[4],
    controls[6],
    controls[8],
  ],
};

/* ============================================================
   TABS
============================================================ */

const tabs = [
  "Overview",
  "Scope",
  "Controls",
  "Evidence",
  "Findings",
  "Risks",
  "Remediation",
  "Reports",
];

/* ============================================================
   PAGE
============================================================ */

export default function AuditDetailsPage() {
  const params = useParams<{ id: string }>();

  const workspace = useWorkspace();

  const { getAudit, updateAudit } = useAudits();

  const auditId = params.id;

  const fallbackAudit =
    auditData[auditId as keyof typeof auditData] ??
    auditData["AUD-2024-001"];

  const audit = (getAudit(auditId) ?? {
    ...fallbackAudit,
    workspace: "ABC Technologies",
  }) as Audit;

  const [activeTab, setActiveTab] = useState("Overview");

  const handleStatusChange = (status: Audit["status"]) => {
    updateAudit(auditId, {
      status,
    });
  };

  const handleProgressChange = (progress: number) => {
    updateAudit(auditId, {
      progress: Math.max(0, Math.min(100, progress)),
    });
  };

  const workspaceValue =
    typeof workspace === "object" &&
    workspace !== null &&
    "currentWorkspace" in workspace
      ? workspace.currentWorkspace
      : null;

  const workspaceName =
    typeof workspaceValue === "string"
      ? workspaceValue
      : typeof workspaceValue === "object" &&
          workspaceValue !== null &&
          "name" in workspaceValue
        ? String(workspaceValue.name)
        : audit.workspace ?? "ABC Technologies";

  const statusClass =
    audit.status === "Completed"
      ? "bg-emerald-50 text-emerald-700"
      : audit.status === "In Review"
        ? "bg-blue-50 text-blue-700"
        : audit.status === "Not Started"
          ? "bg-slate-100 text-slate-600"
          : audit.status === "On Hold"
            ? "bg-slate-100 text-slate-600"
            : "bg-amber-50 text-amber-700";

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] min-h-screen">
        <Header />

        <section className="px-8 py-7">
          {/* BACK */}

          <Link
            href="/audits"
            className="mb-5 inline-flex items-center gap-2 text-[12px] font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Audits
          </Link>

          {/* AUDIT HEADER */}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between px-6 py-5">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <ClipboardCheck
                    className="h-6 w-6 text-blue-600"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[23px] font-semibold tracking-[-0.4px]">
                      {audit.name}
                    </h1>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass}`}
                    >
                      {audit.status}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>{audit.id}</span>

                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                    <span>{audit.framework}</span>

                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                    <span>{workspaceName}</span>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  Actions
                </button>

                <button
                  type="button"
                  className="flex h-9 items-center rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white transition hover:bg-blue-700"
                >
                  Edit Audit
                </button>
              </div>
            </div>

            {/* PROGRESS */}

            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">
                    Audit Progress
                  </span>

                  <span className="text-[12px] font-semibold text-slate-800">
                    {audit.progress}%
                  </span>
                </div>

                <span className="text-[11px] text-slate-500">
                  Due {audit.dueDate}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${audit.progress}%`,
                  }}
                />
              </div>
            </div>

            {/* TABS */}

            <div className="flex overflow-x-auto border-t border-slate-100 px-5">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative whitespace-nowrap px-4 py-3 text-[12px] font-medium transition ${
                    activeTab === tab
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab}

                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TAB CONTENT */}

          {activeTab === "Overview" && (
            <OverviewPanel audit={audit} />
          )}

          {activeTab === "Scope" && <ScopePanel audit={audit} />}

          {activeTab === "Controls" && <ControlsPanel audit={audit} />}

          {activeTab === "Evidence" && <EvidencePanel audit={audit} />}

          {activeTab === "Findings" && <FindingsPanel audit={audit} />}

          {activeTab === "Risks" && <RisksPanel audit={audit} />}

          {activeTab === "Remediation" && (
            <RemediationPanel audit={audit} />
          )}

          {activeTab === "Reports" && <ReportsPanel audit={audit} />}
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   OVERVIEW
============================================================ */

function OverviewPanel({ audit }: { audit: Audit }) {
  return (
    <>
      <div className="mt-5 grid grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] gap-5">
        <div className="min-w-0 space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Audit Overview
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <InfoItem label="Framework" value={audit.framework} />

              <InfoItem label="Audit Lead" value={audit.lead} />

              <InfoItem label="Start Date" value={audit.startDate} />

              <InfoItem label="Due Date" value={audit.dueDate} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-medium text-slate-900">
              Audit Objective
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              {audit.objective}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-slate-900">
                Audit Scope
              </h2>

              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                Defined
              </span>
            </div>

            <p className="mt-3 text-[13px] leading-6 text-slate-600">
              {audit.scope}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-medium text-slate-900">
                Audit Team
              </h2>

              <button
                type="button"
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700"
              >
                Manage Team
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-5">
              <TeamMember
                initials="AS"
                name="Alice Smith"
                role="Audit Lead"
                avatar="bg-violet-100 text-violet-700"
              />

              <TeamMember
                initials="JC"
                name="John Carter"
                role="Auditor"
                avatar="bg-blue-100 text-blue-700"
              />

              <TeamMember
                initials="ED"
                name="Emily Davis"
                role="Auditor"
                avatar="bg-emerald-100 text-emerald-700"
              />
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-medium text-slate-900">
              Audit Statistics
            </h2>

            <div className="mt-3">
              <MetricRow
                icon={<FileCheck2 className="h-4 w-4 text-blue-600" />}
                label="Controls"
                value={audit.controls}
              />

              <MetricRow
                icon={<FileText className="h-4 w-4 text-violet-600" />}
                label="Evidence"
                value={audit.evidence}
              />

              <MetricRow
                icon={<TriangleAlert className="h-4 w-4 text-orange-500" />}
                label="Findings"
                value={audit.findings}
              />

              <MetricRow
                icon={<ShieldAlert className="h-4 w-4 text-red-500" />}
                label="Open Risks"
                value={audit.risks}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-medium text-slate-900">
              Schedule
            </h2>

            <div className="mt-4 space-y-4">
              <ScheduleItem
                icon={<CalendarDays className="h-4 w-4 text-blue-600" />}
                label="Start Date"
                value={audit.startDate}
              />

              <ScheduleItem
                icon={<Clock3 className="h-4 w-4 text-orange-500" />}
                label="Due Date"
                value={audit.dueDate}
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-medium text-slate-900">
              Quick Actions
            </h2>

            <div className="mt-3 space-y-2">
              <QuickAction
                icon={<FileText className="h-4 w-4" />}
                label="Upload Evidence"
              />

              <QuickAction
                icon={<TriangleAlert className="h-4 w-4" />}
                label="Add Finding"
              />

              <QuickAction
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Create Risk"
              />

              <QuickAction
                icon={<UsersRound className="h-4 w-4" />}
                label="Assign Task"
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   SCOPE
============================================================ */

function ScopePanel({ audit }: { audit: Audit }) {
  const areas = [
    "Information Security Management",
    "Access Control",
    "Asset Management",
    "Supplier Management",
    "Incident Management",
    "Business Continuity",
  ];

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Audit Scope
          </h2>

          <p className="mt-1 text-[11px] text-slate-500">
            Define and manage the boundaries of this audit.
          </p>
        </div>

        <button
          type="button"
          className="flex h-9 items-center rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white transition hover:bg-blue-700"
        >
          Edit Scope
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 p-5">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Audit Objective
          </p>

          <p className="mt-2 text-[12px] leading-5 text-slate-600">
            {audit.objective}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Scope Definition
          </p>

          <p className="mt-2 text-[12px] leading-5 text-slate-600">
            {audit.scope}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <h3 className="text-[13px] font-medium text-slate-900">
          Scope Areas
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {areas.map((area) => (
            <div
              key={area}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-3 py-3 text-[11px] text-slate-600"
            >
              {area}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CONTROLS
============================================================ */

function ControlsPanel({ audit }: { audit: Audit }) {
  const auditControls = controlsByAuditId[audit.id] ?? controls;

  const summary = controlStatusSummaryByAuditId[audit.id] ?? {
    compliant: 0,
    partiallyCompliant: 0,
    nonCompliant: 0,
    underReview: 0,
  };

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      {/* Header */}

      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Controls
          </h2>

          <p className="mt-1 text-[11px] text-slate-500">
            Assess applicable framework controls for this audit.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[18px] font-semibold text-slate-900">
            {audit.controls}
          </p>

          <p className="text-[10px] text-slate-400">Total Controls</p>
        </div>
      </div>

      {/* Summary */}

      <div className="grid grid-cols-4 border-b border-slate-100">
        <ControlSummary
          label="Compliant"
          value={String(summary.compliant)}
          className="text-emerald-600"
        />

        <ControlSummary
          label="Partially Compliant"
          value={String(summary.partiallyCompliant)}
          className="text-amber-600"
        />

        <ControlSummary
          label="Non-Compliant"
          value={String(summary.nonCompliant)}
          className="text-red-600"
        />

        <ControlSummary
          label="Under Review"
          value={String(summary.underReview)}
          className="text-blue-600"
        />
      </div>

      {/* Toolbar */}

      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search controls..."
            className="h-9 w-[280px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            All Statuses
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            All Domains
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Control
              </th>

              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Domain
              </th>

              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Evidence
              </th>

              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Findings
              </th>

              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>

          <tbody>
            {auditControls.map((control) => (
              <ControlRow key={control.id} {...control} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <span className="text-[10px] text-slate-400">
          Showing {auditControls.length} of {audit.controls} controls
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-7 rounded border border-slate-200 px-2.5 text-[10px] text-slate-400"
          >
            Previous
          </button>

          <button
            type="button"
            className="h-7 rounded border border-blue-600 bg-blue-600 px-2.5 text-[10px] text-white"
          >
            1
          </button>

          <button
            type="button"
            className="h-7 rounded border border-slate-200 px-2.5 text-[10px] text-slate-600"
          >
            2
          </button>

          <button
            type="button"
            className="h-7 rounded border border-slate-200 px-2.5 text-[10px] text-slate-600"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CONTROL SUMMARY
============================================================ */

function ControlSummary({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="border-r border-slate-100 px-5 py-4 last:border-r-0">
      <p className={`text-[19px] font-semibold ${className}`}>{value}</p>

      <p className="mt-1 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

/* ============================================================
   CONTROL ROW
============================================================ */

function ControlRow({
  id,
  name,
  domain,
  evidence,
  findings,
  status,
}: {
  id: string;
  name: string;
  domain: string;
  requirement: string;
  evidence: number;
  findings: number;
  status: string;
}) {
  const statusStyles: Record<string, string> = {
    Compliant: "bg-emerald-50 text-emerald-700",
    "Partially Compliant": "bg-amber-50 text-amber-700",
    "Non-Compliant": "bg-red-50 text-red-700",
    "Under Review": "bg-blue-50 text-blue-700",
  };

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[9px] font-semibold text-blue-700">
            {id}
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-medium text-slate-800">
              {name}
            </p>

            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              ISO 27001 control requirement
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-4">
        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
          {domain}
        </span>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-400" />

          <span className="text-[11px] font-medium text-slate-700">
            {evidence}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5">
          <TriangleAlert
            className={`h-3.5 w-3.5 ${
              findings > 0 ? "text-orange-500" : "text-slate-300"
            }`}
          />

          <span className="text-[11px] font-medium text-slate-700">
            {findings}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${
            statusStyles[status] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {status}
        </span>
      </td>

      <td className="px-3 py-4">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

/* ============================================================
   EVIDENCE
============================================================ */

function EvidencePanel({ audit }: { audit: Audit }) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Form state for Upload
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("PDF");
  const [formControl, setFormControl] = useState("A.5.1");
  const [formOwner, setFormOwner] = useState(audit.lead || "Alice Smith");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    const allEvidence = getStoredEvidence();
    const filtered = allEvidence.filter((e) => e.auditId === audit.id);
    if (filtered.length > 0) {
      setEvidenceList(filtered);
    } else {
      // Create sensible defaults for this audit if none yet stored
      const defaults: EvidenceItem[] = [
        {
          id: `EVD-${audit.id.replace("AUD-", "")}-001`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          name: `${audit.framework} Security Baseline.pdf`,
          type: "PDF",
          size: "2.1 MB",
          control: "A.5.1",
          framework: audit.framework,
          owner: audit.lead,
          status: "Accepted",
          uploaded: "02 May 2024",
          reviewedBy: "Auditor Team",
          description: "Formal security baseline documentation.",
        },
        {
          id: `EVD-${audit.id.replace("AUD-", "")}-002`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          name: "Access Control Verification Sample.xlsx",
          type: "XLSX",
          size: "820 KB",
          control: "A.5.15",
          framework: audit.framework,
          owner: "Michael Lee",
          status: "Under Review",
          uploaded: "05 May 2024",
          reviewedBy: audit.lead,
          description: "Sample review of privileged user accesses.",
        },
        {
          id: `EVD-${audit.id.replace("AUD-", "")}-003`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          name: "Security Training Compliance Roster.pdf",
          type: "PDF",
          size: "1.4 MB",
          control: "A.6.3",
          framework: audit.framework,
          owner: "Emily Davis",
          status: "Pending Review",
          uploaded: "08 May 2024",
          reviewedBy: "—",
          description: "Roster of completed annual security training modules.",
        },
      ];
      setEvidenceList(defaults);
      saveStoredEvidence([...allEvidence, ...defaults]);
    }
  }, [audit.id, audit.framework, audit.lead]);

  const filteredEvidence = useMemo(() => {
    return evidenceList.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.control.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [evidenceList, search, statusFilter]);

  const verifiedCount = evidenceList.filter(
    (e) => e.status === "Accepted"
  ).length;
  const underReviewCount = evidenceList.filter(
    (e) => e.status === "Under Review"
  ).length;
  const pendingCount = evidenceList.filter(
    (e) => e.status === "Pending Review"
  ).length;

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const all = getStoredEvidence();
    const nextNum = all.length + 1;
    const newId = `EVD-2024-${String(nextNum).padStart(3, "0")}`;

    const newItem: EvidenceItem = {
      id: newId,
      workspaceId: "abc-technologies",
      auditId: audit.id,
      name: formName.trim().endsWith(`.${formType.toLowerCase()}`)
        ? formName.trim()
        : `${formName.trim()}.${formType.toLowerCase()}`,
      type: formType,
      size: "1.2 MB",
      control: formControl,
      framework: audit.framework,
      owner: formOwner,
      status: "Pending Review",
      uploaded: "Just now",
      reviewedBy: "—",
      description: formDesc || "Uploaded evidence for audit assessment.",
    };

    const updatedAll = [newItem, ...all];
    saveStoredEvidence(updatedAll);
    setEvidenceList([newItem, ...evidenceList]);
    setShowUploadModal(false);
    setFormName("");
    setFormDesc("");
  };

  const updateStatus = (id: string, newStatus: EvidenceItem["status"]) => {
    const updated = evidenceList.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setEvidenceList(updated);
    const all = getStoredEvidence();
    const updatedAll = all.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    saveStoredEvidence(updatedAll);
    if (selectedEvidence && selectedEvidence.id === id) {
      setSelectedEvidence({ ...selectedEvidence, status: newStatus });
    }
  };

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Evidence for {audit.name}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Review and upload evidence artifacts linked to Audit {audit.id}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white transition hover:bg-blue-700"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Evidence
        </button>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-4 border-b border-slate-100">
        <ControlSummary
          label="Total Evidence"
          value={String(evidenceList.length)}
          className="text-slate-800"
        />
        <ControlSummary
          label="Accepted"
          value={String(verifiedCount)}
          className="text-emerald-600"
        />
        <ControlSummary
          label="Under Review"
          value={String(underReviewCount)}
          className="text-blue-600"
        />
        <ControlSummary
          label="Pending Review"
          value={String(pendingCount)}
          className="text-amber-600"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search evidence or control..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          {["All Statuses", "Accepted", "Under Review", "Pending Review", "Rejected"].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                  statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Evidence Items List */}
      <div className="divide-y divide-slate-100">
        {filteredEvidence.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-[12px]">
            No evidence records match the current filter.
          </div>
        ) : (
          filteredEvidence.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-50">
                  <FileText className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvidence(item)}
                    className="text-left text-[12px] font-medium text-slate-800 hover:text-blue-600"
                  >
                    {item.name}
                  </button>
                  <p className="mt-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">{item.id}</span> · Control:{" "}
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">
                      {item.control}
                    </span>{" "}
                    · Owner: {item.owner} · Uploaded: {item.uploaded}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    item.status === "Accepted"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.status === "Under Review"
                      ? "bg-blue-50 text-blue-700"
                      : item.status === "Rejected"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedEvidence(item)}
                  className="flex h-7 items-center gap-1 rounded border border-slate-200 px-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Eye className="h-3 w-3" />
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Upload Evidence Artifact
                </h3>
                <p className="text-[11px] text-slate-500">
                  Attach compliance documentation to {audit.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Document Title / File Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Identity Access Certification Q1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    File Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="XLSX">Spreadsheet (XLSX)</option>
                    <option value="DOCX">Word Document (DOCX)</option>
                    <option value="CSV">Data Export (CSV)</option>
                    <option value="JSON">Configuration (JSON)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Associated Control
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A.5.15"
                    value={formControl}
                    onChange={(e) => setFormControl(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Owner / Custodian
                </label>
                <input
                  type="text"
                  value={formOwner}
                  onChange={(e) => setFormOwner(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Description / Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide brief verification instructions..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 p-2 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
                <Upload className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-1 text-[11px] font-medium text-slate-600">
                  Drag and drop files here or browse
                </p>
                <p className="text-[10px] text-slate-400">PDF, XLSX, DOCX up to 25MB</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="h-8 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Save Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Detail Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  {selectedEvidence.id}
                </span>
                <h3 className="mt-1 text-[15px] font-semibold text-slate-900">
                  {selectedEvidence.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Control</span>
                  <p className="font-semibold text-slate-700">{selectedEvidence.control}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Framework</span>
                  <p className="font-semibold text-slate-700">{selectedEvidence.framework}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Owner</span>
                  <p className="font-semibold text-slate-700">{selectedEvidence.owner}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Uploaded</span>
                  <p className="font-semibold text-slate-700">{selectedEvidence.uploaded}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400">Description</span>
                <p className="mt-0.5 text-slate-600">{selectedEvidence.description}</p>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-medium text-slate-700">Review Status</span>
                <div className="mt-1.5 flex gap-2">
                  {(["Accepted", "Under Review", "Pending Review", "Rejected"] as EvidenceItem["status"][]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateStatus(selectedEvidence.id, st)}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                          selectedEvidence.status === st
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="h-8 rounded-md bg-slate-900 px-4 text-[11px] font-medium text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   FINDINGS
============================================================ */

function FindingsPanel({ audit }: { audit: Audit }) {
  const [findingsList, setFindingsList] = useState<Finding[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All Severity");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSeverity, setFormSeverity] = useState<Finding["severity"]>("High");
  const [formStatus, setFormStatus] = useState<Finding["status"]>("Open");
  const [formControl, setFormControl] = useState("A.8.2");
  const [formOwner, setFormOwner] = useState(audit.lead || "Alice Smith");
  const [formDueDate, setFormDueDate] = useState("30 Jun 2024");
  const [formRecommendation, setFormRecommendation] = useState("");

  useEffect(() => {
    const all = getStoredFindings();
    const filtered = all.filter((f) => f.auditId === audit.id);
    if (filtered.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFindingsList(filtered);
    } else {
      const defaults: Finding[] = [
        {
          id: `FND-${audit.id.replace("AUD-", "")}-001`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          title: `Control deficiency identified in ${audit.framework} evaluation`,
          description: "Sample access reviews were missing management sign-off.",
          severity: "High",
          status: "Open",
          framework: audit.framework,
          control: "A.5.15",
          owner: audit.lead,
          auditor: "John Carter",
          identified: "05 May 2024",
          dueDate: "20 Jun 2024",
          evidence: "EVD-2024-002",
          recommendation: "Establish automated recurring approvals with 30-day escalation.",
        },
      ];
      setFindingsList(defaults);
      saveStoredFindings([...all, ...defaults]);
    }
  }, [audit.id, audit.framework, audit.lead]);

  const filteredFindings = useMemo(() => {
    return findingsList.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.control.toLowerCase().includes(q);
      const matchesSeverity =
        severityFilter === "All Severity" || item.severity === severityFilter;
      const matchesStatus =
        statusFilter === "All Status" || item.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [findingsList, search, severityFilter, statusFilter]);

  const criticalCount = findingsList.filter((f) => f.severity === "Critical").length;
  const highCount = findingsList.filter((f) => f.severity === "High").length;
  const openCount = findingsList.filter(
    (f) => f.status === "Open" || f.status === "In Progress"
  ).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const all = getStoredFindings();
    const nextNum = all.length + 1;
    const newId = `FND-2024-${String(nextNum).padStart(3, "0")}`;

    const newFinding: Finding = {
      id: newId,
      workspaceId: "abc-technologies",
      auditId: audit.id,
      title: formTitle.trim(),
      description: formDesc || "Identified during audit testing.",
      severity: formSeverity,
      status: formStatus,
      framework: audit.framework,
      control: formControl,
      owner: formOwner,
      auditor: "John Carter",
      identified: "Today",
      dueDate: formDueDate,
      evidence: "EVD-2024-001",
      recommendation:
        formRecommendation || "Implement corrective remediation measures according to policy.",
    };

    const updatedAll = [newFinding, ...all];
    saveStoredFindings(updatedAll);
    setFindingsList([newFinding, ...findingsList]);
    setShowAddModal(false);
    setFormTitle("");
    setFormDesc("");
    setFormRecommendation("");
  };

  const updateStatus = (id: string, newStatus: Finding["status"]) => {
    const updated = findingsList.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setFindingsList(updated);
    const all = getStoredFindings();
    const updatedAll = all.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    saveStoredFindings(updatedAll);
    if (selectedFinding && selectedFinding.id === id) {
      setSelectedFinding({ ...selectedFinding, status: newStatus });
    }
  };

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Findings for {audit.name}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Track deficiencies, non-conformities, and observations for {audit.id}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white transition hover:bg-blue-700"
        >
          <TriangleAlert className="h-3.5 w-3.5" />
          Add Finding
        </button>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-100">
        <ControlSummary
          label="Total Findings"
          value={String(findingsList.length)}
          className="text-slate-800"
        />
        <ControlSummary
          label="Critical"
          value={String(criticalCount)}
          className="text-red-600"
        />
        <ControlSummary
          label="High"
          value={String(highCount)}
          className="text-orange-600"
        />
        <ControlSummary
          label="Open / Active"
          value={String(openCount)}
          className="text-amber-600"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search findings or controls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["All Severity", "Critical", "High", "Medium", "Low"].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                severityFilter === sev
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Finding
              </th>
              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Severity
              </th>
              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Control
              </th>
              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Owner
              </th>
              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Due Date
              </th>
              <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="w-16 px-3 py-3" />
            </tr>
          </thead>

          <tbody>
            {filteredFindings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-[12px]">
                  No findings match the selected filters.
                </td>
              </tr>
            ) : (
              filteredFindings.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedFinding(item)}
                      className="text-left font-medium text-slate-800 hover:text-blue-600 text-[12px]"
                    >
                      {item.title}
                    </button>
                    <p className="mt-1 text-[10px] text-slate-400 font-mono">
                      {item.id}
                    </p>
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        item.severity === "Critical"
                          ? "bg-red-50 text-red-700"
                          : item.severity === "High"
                          ? "bg-orange-50 text-orange-700"
                          : item.severity === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.severity}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {item.control}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-[11px] text-slate-600">
                    {item.owner}
                  </td>

                  <td className="px-3 py-4 text-[11px] text-slate-600">
                    {item.dueDate}
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        item.status === "Resolved" || item.status === "Closed"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.status === "In Progress"
                          ? "bg-blue-50 text-blue-700"
                          : item.status === "Accepted Risk"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-3 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedFinding(item)}
                      className="rounded border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Finding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Log New Audit Finding
                </h3>
                <p className="text-[11px] text-slate-500">
                  Associate finding with Audit {audit.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Finding Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unencrypted data volumes discovered in secondary zone"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Deficiency Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain what condition was identified..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 p-2 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Severity
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as Finding["severity"])}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Associated Control
                  </label>
                  <input
                    type="text"
                    required
                    value={formControl}
                    onChange={(e) => setFormControl(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Remediation Owner
                  </label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Auditor Recommendation
                </label>
                <textarea
                  rows={2}
                  placeholder="Recommended corrective steps..."
                  value={formRecommendation}
                  onChange={(e) => setFormRecommendation(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 p-2 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Record Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-500">
                    {selectedFinding.id}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      selectedFinding.severity === "Critical"
                        ? "bg-red-50 text-red-700"
                        : selectedFinding.severity === "High"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selectedFinding.severity}
                  </span>
                </div>
                <h3 className="mt-1 text-[15px] font-semibold text-slate-900">
                  {selectedFinding.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFinding(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Control</span>
                  <p className="font-semibold text-blue-700">{selectedFinding.control}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Framework</span>
                  <p className="font-semibold text-slate-700">{selectedFinding.framework}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Owner</span>
                  <p className="font-semibold text-slate-700">{selectedFinding.owner}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Due Date</span>
                  <p className="font-semibold text-slate-700">{selectedFinding.dueDate}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400">Condition Description</span>
                <p className="mt-0.5 text-slate-600">{selectedFinding.description}</p>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400">Recommendation</span>
                <p className="mt-0.5 text-slate-700 bg-amber-50/60 p-2.5 rounded-md border border-amber-100">
                  {selectedFinding.recommendation}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-medium text-slate-700">Update Finding Status</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(["Open", "In Progress", "Resolved", "Accepted Risk", "Closed"] as Finding["status"][]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateStatus(selectedFinding.id, st)}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                          selectedFinding.status === st
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedFinding(null)}
                className="h-8 rounded-md bg-slate-900 px-4 text-[11px] font-medium text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   RISKS
============================================================ */

function RisksPanel({ audit }: { audit: Audit }) {
  const [risksList, setRisksList] = useState<RiskItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Access Control");
  const [formLevel, setFormLevel] = useState<RiskItem["level"]>("High");
  const [formAsset, setFormAsset] = useState("Core Systems");
  const [formOwner, setFormOwner] = useState(audit.lead || "Alice Smith");
  const [formTreatment, setFormTreatment] = useState("Mitigate");

  useEffect(() => {
    const all = getStoredRisks();
    const filtered = all.filter((r) => r.auditId === audit.id);
    if (filtered.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRisksList(filtered);
    } else {
      const defaults: RiskItem[] = [
        {
          id: `RSK-${audit.id.replace("AUD-", "")}-001`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          title: `Operational risk related to ${audit.framework} control deficiencies`,
          description: "Unmitigated compliance gap may impact certification status.",
          category: "Compliance",
          framework: audit.framework,
          asset: "Information Security Management",
          owner: audit.lead,
          likelihood: 4,
          impact: 4,
          score: 16,
          level: "High",
          status: "Open",
          identifiedDate: "05 May 2024",
          dueDate: "30 Jun 2024",
          treatment: "Mitigate",
        },
      ];
      setRisksList(defaults);
      saveStoredRisks([...all, ...defaults]);
    }
  }, [audit.id, audit.framework, audit.lead]);

  const highOrCritCount = risksList.filter(
    (r) => r.level === "Critical" || r.level === "High"
  ).length;
  const mediumCount = risksList.filter((r) => r.level === "Medium").length;
  const lowCount = risksList.filter((r) => r.level === "Low").length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const all = getStoredRisks();
    const nextNum = all.length + 1;
    const newId = `RSK-2024-${String(nextNum).padStart(3, "0")}`;

    const newRisk: RiskItem = {
      id: newId,
      workspaceId: "abc-technologies",
      auditId: audit.id,
      title: formTitle.trim(),
      description: formDesc || "Identified during security assessment.",
      category: formCategory,
      framework: audit.framework,
      asset: formAsset,
      owner: formOwner,
      likelihood: 4,
      impact: formLevel === "Critical" ? 5 : formLevel === "High" ? 4 : 3,
      score: formLevel === "Critical" ? 25 : formLevel === "High" ? 16 : 9,
      level: formLevel,
      status: "Open",
      identifiedDate: "Today",
      dueDate: "30 Jun 2024",
      treatment: formTreatment,
    };

    const updatedAll = [newRisk, ...all];
    saveStoredRisks(updatedAll);
    setRisksList([newRisk, ...risksList]);
    setShowCreateModal(false);
    setFormTitle("");
    setFormDesc("");
  };

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Risk Management for {audit.name}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Assess and treat security risks associated with Audit {audit.id}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white transition hover:bg-blue-700"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Create Risk
        </button>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-100">
        <ControlSummary
          label="Total Risks"
          value={String(risksList.length)}
          className="text-slate-800"
        />
        <ControlSummary
          label="Critical / High"
          value={String(highOrCritCount)}
          className="text-red-600"
        />
        <ControlSummary
          label="Medium"
          value={String(mediumCount)}
          className="text-amber-600"
        />
        <ControlSummary
          label="Low"
          value={String(lowCount)}
          className="text-emerald-600"
        />
      </div>

      <div className="divide-y divide-slate-100">
        {risksList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-[12px]">
            No risks registered for this audit.
          </div>
        ) : (
          risksList.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedRisk(item)}
                    className="text-left text-[12px] font-medium text-slate-800 hover:text-blue-600"
                  >
                    {item.title}
                  </button>
                  <p className="mt-1 text-[10px] text-slate-400">
                    <span className="font-mono font-semibold text-slate-600">{item.id}</span> · Category:{" "}
                    {item.category} · Asset: {item.asset} · Treatment: {item.treatment}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    item.level === "Critical"
                      ? "bg-red-50 text-red-700"
                      : item.level === "High"
                      ? "bg-orange-50 text-orange-700"
                      : item.level === "Medium"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {item.level} ({item.score})
                </span>

                <span className="text-[11px] text-slate-500">{item.status}</span>

                <button
                  type="button"
                  onClick={() => setSelectedRisk(item)}
                  className="rounded border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Risk Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Register Risk for {audit.id}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Categorize threat vectors and treatment strategy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Risk Statement / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unauthorized access to cloud storage buckets"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  >
                    <option value="Access Control">Access Control</option>
                    <option value="Data Protection">Data Protection</option>
                    <option value="Network Security">Network Security</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Third-Party">Third-Party</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Risk Level
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as RiskItem["level"])}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Impacted Asset
                  </label>
                  <input
                    type="text"
                    value={formAsset}
                    onChange={(e) => setFormAsset(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Treatment Strategy
                  </label>
                  <select
                    value={formTreatment}
                    onChange={(e) => setFormTreatment(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  >
                    <option value="Mitigate">Mitigate</option>
                    <option value="Accept">Accept</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Avoid">Avoid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Risk Owner
                </label>
                <input
                  type="text"
                  value={formOwner}
                  onChange={(e) => setFormOwner(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-8 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Save Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Details Modal */}
      {selectedRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {selectedRisk.id}
                </span>
                <h3 className="mt-1 text-[15px] font-semibold text-slate-900">
                  {selectedRisk.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRisk(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Level & Score</span>
                  <p className="font-semibold text-red-600">
                    {selectedRisk.level} (Score: {selectedRisk.score})
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Category</span>
                  <p className="font-semibold text-slate-700">{selectedRisk.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Asset</span>
                  <p className="font-semibold text-slate-700">{selectedRisk.asset}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Owner</span>
                  <p className="font-semibold text-slate-700">{selectedRisk.owner}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400">Description</span>
                <p className="mt-0.5 text-slate-600">{selectedRisk.description}</p>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400">Treatment Plan</span>
                <p className="mt-0.5 font-medium text-slate-800">
                  {selectedRisk.treatment} — Status: {selectedRisk.status}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedRisk(null)}
                className="h-8 rounded-md bg-slate-900 px-4 text-[11px] font-medium text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   REMEDIATION
============================================================ */

function RemediationPanel({ audit }: { audit: Audit }) {
  const [actionsList, setActionsList] = useState<RemediationItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<RemediationItem | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState<RemediationItem["priority"]>("High");
  const [formOwner, setFormOwner] = useState(audit.lead || "Alice Smith");
  const [formDueDate, setFormDueDate] = useState("30 Jun 2024");
  const [formFindingId, setFormFindingId] = useState("FND-2024-001");

  useEffect(() => {
    const all = getStoredRemediation();
    const filtered = all.filter((r) => r.auditId === audit.id);
    if (filtered.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActionsList(filtered);
    } else {
      const defaults: RemediationItem[] = [
        {
          id: `REM-${audit.id.replace("AUD-", "")}-001`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          title: `Address identified non-conformities for ${audit.framework}`,
          description: "Implement corrective controls and submit updated evidence.",
          findingId: "FND-2024-001",
          riskId: "RSK-2024-001",
          framework: audit.framework,
          priority: "High",
          owner: audit.lead,
          dueDate: "30 Jun 2024",
          status: "In Progress",
          progress: 50,
          createdDate: "06 May 2024",
        },
      ];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActionsList(defaults);
      saveStoredRemediation([...all, ...defaults]);
    }
  }, [audit.id, audit.framework, audit.lead]);

  const openCount = actionsList.filter((a) => a.status === "Open").length;
  const inProgressCount = actionsList.filter((a) => a.status === "In Progress").length;
  const completedCount = actionsList.filter((a) => a.status === "Completed").length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const all = getStoredRemediation();
    const nextNum = all.length + 1;
    const newId = `REM-2024-${String(nextNum).padStart(3, "0")}`;

    const newItem: RemediationItem = {
      id: newId,
      workspaceId: "abc-technologies",
      auditId: audit.id,
      title: formTitle.trim(),
      description: formDesc || "Corrective action plan.",
      findingId: formFindingId,
      riskId: "RSK-2024-001",
      framework: audit.framework,
      priority: formPriority,
      owner: formOwner,
      dueDate: formDueDate,
      status: "In Progress",
      progress: 25,
      createdDate: "Today",
    };

    const updatedAll = [newItem, ...all];
    saveStoredRemediation(updatedAll);
    setActionsList([newItem, ...actionsList]);
    setShowAddModal(false);
    setFormTitle("");
    setFormDesc("");
  };

  const updateProgress = (id: string, newProgress: number) => {
    const newStatus: RemediationItem["status"] =
      newProgress >= 100 ? "Completed" : newProgress > 0 ? "In Progress" : "Open";
    const updated = actionsList.map((item) =>
      item.id === id ? { ...item, progress: newProgress, status: newStatus } : item
    );
    setActionsList(updated);
    const all = getStoredRemediation();
    const updatedAll = all.map((item) =>
      item.id === id ? { ...item, progress: newProgress, status: newStatus } : item
    );
    saveStoredRemediation(updatedAll);
    if (selectedAction && selectedAction.id === id) {
      setSelectedAction({ ...selectedAction, progress: newProgress, status: newStatus });
    }
  };

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Remediation for {audit.name}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Track corrective actions and remediation activities for {audit.id}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white transition hover:bg-blue-700"
        >
          <Wrench className="h-3.5 w-3.5" />
          Add Action
        </button>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-100">
        <ControlSummary
          label="Total Actions"
          value={String(actionsList.length)}
          className="text-slate-800"
        />
        <ControlSummary
          label="Open"
          value={String(openCount)}
          className="text-red-600"
        />
        <ControlSummary
          label="In Progress"
          value={String(inProgressCount)}
          className="text-blue-600"
        />
        <ControlSummary
          label="Completed"
          value={String(completedCount)}
          className="text-emerald-600"
        />
      </div>

      <div className="divide-y divide-slate-100">
        {actionsList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-[12px]">
            No corrective actions configured for this audit.
          </div>
        ) : (
          actionsList.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedAction(item)}
                    className="text-left text-[12px] font-medium text-slate-800 hover:text-blue-600"
                  >
                    {item.title}
                  </button>
                  <p className="mt-1 text-[10px] text-slate-400">
                    <span className="font-mono font-semibold text-slate-600">{item.id}</span> · Linked:{" "}
                    <span className="font-mono text-blue-600">{item.findingId}</span> · Owner:{" "}
                    {item.owner} · Due: {item.dueDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24">
                  <div className="flex justify-between text-[10px] font-medium text-slate-500">
                    <span>Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    item.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.status === "In Progress"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {item.status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedAction(item)}
                  className="rounded border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
                >
                  Update
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  New Corrective Action for {audit.id}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Define remediation tasks and assignment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Action Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement hardware MFA keys on bastion hosts"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Action Scope / Steps
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail step-by-step implementation..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 p-2 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Linked Finding
                  </label>
                  <input
                    type="text"
                    value={formFindingId}
                    onChange={(e) => setFormFindingId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as RemediationItem["priority"])}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Action Owner
                  </label>
                  <input
                    type="text"
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700">
                    Target Completion Date
                  </label>
                  <input
                    type="text"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Create Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Details & Progress Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {selectedAction.id}
                </span>
                <h3 className="mt-1 text-[15px] font-semibold text-slate-900">
                  {selectedAction.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-[12px]">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Linked Finding</span>
                  <p className="font-semibold text-blue-700">{selectedAction.findingId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Priority</span>
                  <p className="font-semibold text-orange-600">{selectedAction.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Owner</span>
                  <p className="font-semibold text-slate-700">{selectedAction.owner}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400">Due Date</span>
                  <p className="font-semibold text-slate-700">{selectedAction.dueDate}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-medium text-slate-400">Action Plan</span>
                <p className="mt-0.5 text-slate-600">{selectedAction.description}</p>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-700">
                    Completion Progress: {selectedAction.progress}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Status: {selectedAction.status}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={selectedAction.progress}
                  onChange={(e) =>
                    updateProgress(selectedAction.id, Number(e.target.value))
                  }
                  className="mt-2 w-full accent-blue-600 cursor-pointer"
                />
                <div className="mt-2 flex gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updateProgress(selectedAction.id, pct)}
                      className="rounded border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Set {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                className="h-8 rounded-md bg-slate-900 px-4 text-[11px] font-medium text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   REPORTS
============================================================ */

function ReportsPanel({ audit }: { audit: Audit }) {
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Form state
  const [formName, setFormName] = useState(`${audit.framework} Comprehensive Audit Report`);
  const [formType, setFormType] = useState<ReportItem["type"]>("Audit Report");

  useEffect(() => {
    const all = getStoredReports();
    const filtered = all.filter((r) => r.auditId === audit.id);
    if (filtered.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReportsList(filtered);
    } else {
      const defaults: ReportItem[] = [
        {
          id: `RPT-${audit.id.replace("AUD-", "")}-001`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          name: `${audit.name} Final Executive Report`,
          type: "Audit Report",
          framework: audit.framework,
          generatedBy: audit.lead,
          generatedDate: "05 Sep 2026",
          size: "2.4 MB",
          status: "Completed",
          summary: {
            scopeCount: 6,
            controlsCount: audit.controls,
            compliantCount: Math.round(audit.controls * 0.65),
            evidenceCount: audit.evidence,
            findingsCount: audit.findings,
            risksCount: audit.risks,
            remediationCount: 4,
          },
        },
        {
          id: `RPT-${audit.id.replace("AUD-", "")}-002`,
          workspaceId: "abc-technologies",
          auditId: audit.id,
          name: `${audit.framework} Compliance & Findings Matrix`,
          type: "Compliance Report",
          framework: audit.framework,
          generatedBy: audit.lead,
          generatedDate: "02 Sep 2026",
          size: "1.1 MB",
          status: "Completed",
          summary: {
            scopeCount: 6,
            controlsCount: audit.controls,
            compliantCount: Math.round(audit.controls * 0.65),
            evidenceCount: audit.evidence,
            findingsCount: audit.findings,
            risksCount: audit.risks,
            remediationCount: 4,
          },
        },
      ];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReportsList(defaults);
      saveStoredReports([...all, ...defaults]);
    }
  }, [audit.id, audit.name, audit.framework, audit.lead, audit.controls, audit.evidence, audit.findings, audit.risks]);

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const allReports = getStoredReports();
    const allFindings = getStoredFindings().filter((f) => f.auditId === audit.id);
    const allEvidence = getStoredEvidence().filter((e) => e.auditId === audit.id);
    const allRisks = getStoredRisks().filter((r) => r.auditId === audit.id);
    const allRem = getStoredRemediation().filter((r) => r.auditId === audit.id);

    const nextNum = allReports.length + 1;
    const newId = `RPT-${String(nextNum).padStart(3, "0")}`;

    const newReport: ReportItem = {
      id: newId,
      workspaceId: "abc-technologies",
      auditId: audit.id,
      name: formName.trim(),
      type: formType,
      framework: audit.framework,
      generatedBy: audit.lead || "System",
      generatedDate: "Just now",
      size: "1.8 MB",
      status: "Completed",
      summary: {
        scopeCount: 6,
        controlsCount: audit.controls,
        compliantCount: Math.round(audit.controls * 0.72),
        evidenceCount: allEvidence.length || audit.evidence,
        findingsCount: allFindings.length || audit.findings,
        risksCount: allRisks.length || audit.risks,
        remediationCount: allRem.length || 3,
      },
    };

    const updatedAll = [newReport, ...allReports];
    saveStoredReports(updatedAll);
    setReportsList([newReport, ...reportsList]);
    setShowGenerateModal(false);
    setSelectedReport(newReport);
  };

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-900">
            Reports for {audit.name}
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Synthesize Audit → Scope → Controls → Evidence → Findings → Risks → Remediation
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGenerateModal(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white transition hover:bg-blue-700"
        >
          <FileText className="h-3.5 w-3.5" />
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-100">
        <ControlSummary
          label="Audit Progress"
          value={`${audit.progress}%`}
          className="text-blue-600"
        />
        <ControlSummary
          label="Findings"
          value={String(audit.findings)}
          className="text-orange-600"
        />
        <ControlSummary
          label="Open Risks"
          value={String(audit.risks)}
          className="text-red-600"
        />
      </div>

      <div className="p-5">
        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
          {reportsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-[12px]">
              No reports generated yet for this audit. Click Generate Report to create one.
            </div>
          ) : (
            reportsList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-4 hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50">
                    <FileWarning className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(item)}
                      className="text-left text-[12px] font-medium text-slate-800 hover:text-blue-600"
                    >
                      {item.name}
                    </button>
                    <p className="mt-1 text-[10px] text-slate-400">
                      <span className="font-mono font-semibold text-slate-600">{item.id}</span> ·{" "}
                      {item.type} · Generated: {item.generatedDate} · Size: {item.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(item)}
                    className="flex h-7 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Eye className="h-3 w-3" />
                    Preview Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Generate Synthesized Audit Report
                </h3>
                <p className="text-[11px] text-slate-500">
                  Compile live Scope, Controls, Evidence, Findings, Risks, and Remediation
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Report Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as ReportItem["type"])}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-500"
                >
                  <option value="Audit Report">Comprehensive Audit Report</option>
                  <option value="Executive Summary">Executive Summary Report</option>
                  <option value="Compliance Report">Compliance Matrix Report</option>
                  <option value="Remediation Report">Remediation Status Report</option>
                </select>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-blue-900">Automatic Data Aggregation Included:</p>
                <p>• Scope boundaries & audit objective</p>
                <p>• Control compliance status & domain breakdowns</p>
                <p>• Evidence verified / pending breakdown</p>
                <p>• Findings severities & corrective recommendations</p>
                <p>• Risk assessment register & mitigation roadmap</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="h-8 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Generate & Compile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-[11px] font-semibold text-blue-600">
                  {selectedReport.id}
                </span>
                <h3 className="mt-1 text-[17px] font-semibold text-slate-900">
                  {selectedReport.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedReport.framework} · Generated on {selectedReport.generatedDate} by{" "}
                  {selectedReport.generatedBy}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-[12px]">
              {/* Executive Summary */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-[13px] font-semibold text-slate-900">
                  Executive Overview
                </h4>
                <p className="mt-2 leading-relaxed text-slate-600">
                  This report documents the assessment of the organization&apos;s Information
                  Security Management System against {audit.framework} requirements. The overall audit
                  completion stands at <strong>{audit.progress}%</strong> with{" "}
                  <strong>{audit.controls}</strong> controls evaluated.
                </p>
              </div>

              {/* Aggregation Matrix */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <span className="text-[10px] font-medium uppercase text-slate-400">Controls Evaluated</span>
                  <p className="text-[16px] font-semibold text-slate-900">{audit.controls}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Compliant: ~65%</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <span className="text-[10px] font-medium uppercase text-slate-400">Evidence Collected</span>
                  <p className="text-[16px] font-semibold text-slate-900">{audit.evidence}</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Verified artifacts</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <span className="text-[10px] font-medium uppercase text-slate-400">Active Findings</span>
                  <p className="text-[16px] font-semibold text-orange-600">{audit.findings}</p>
                  <p className="text-[10px] text-red-600 mt-0.5">Risks: {audit.risks}</p>
                </div>
              </div>

              {/* Scope */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-[13px] font-semibold text-slate-900">
                  Scope Boundaries
                </h4>
                <p className="mt-1 text-slate-600">{audit.scope}</p>
              </div>

              {/* Remediation Summary */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-[13px] font-semibold text-slate-900">
                  Remediation Roadmap
                </h4>
                <p className="mt-1 text-slate-600">
                  Corrective action plans have been defined for all high and critical severity
                  findings, scheduled to conclude by {audit.dueDate}.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="h-8 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download Report Package
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 truncate text-[12px] font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   METRIC ROW
============================================================ */

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50">
          {icon}
        </div>

        <span className="text-[12px] text-slate-600">{label}</span>
      </div>

      <span className="text-[15px] font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   SCHEDULE
============================================================ */

function ScheduleItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] text-slate-400">{label}</p>

        <p className="mt-0.5 text-[12px] font-medium text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   TEAM MEMBER
============================================================ */

function TeamMember({
  initials,
  name,
  role,
  avatar,
}: {
  initials: string;
  name: string;
  role: string;
  avatar: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${avatar}`}
      >
        {initials}
      </div>

      <div className="min-w-0">
        <p className="whitespace-nowrap text-[11px] font-medium text-slate-800">
          {name}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">{role}</p>
      </div>
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex h-9 w-full items-center gap-3 rounded-md border border-slate-200 px-3 text-left text-[12px] font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
    >
      {icon}
      {label}
    </button>
  );
}