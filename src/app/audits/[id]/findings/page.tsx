"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { getFindings } from "@/actions/findings";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ShieldAlert,
  UserRound,
  CalendarDays,
  FileWarning,
  CircleDot,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";

type FindingSeverity = "Critical" | "High" | "Medium" | "Low";

type FindingStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Accepted"
  | "Closed";

type Finding = {
  id: number;
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
};

const FRAMEWORKS = [
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "NIST 800-53",
  "SOC 2",
  "CIS Controls",
];

const SEVERITY_OPTIONS: FindingSeverity[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

const STATUS_OPTIONS: FindingStatus[] = [
  "Open",
  "In Progress",
  "Resolved",
  "Accepted",
  "Closed",
];

const INITIAL_FINDINGS: Record<string, Finding[]> = {
  "abc-technologies": [
    {
      id: 1,
      reference: "FND-2024-001",
      title: "Privileged accounts lack MFA",
      description:
        "Several privileged administrator accounts are not protected by multi-factor authentication.",
      framework: "ISO 27001",
      control: "A.5.17",
      severity: "Critical",
      owner: "Alice Smith",
      identifiedDate: "06 May 2024",
      dueDate: "31 May 2024",
      status: "Open",
    },
    {
      id: 2,
      reference: "FND-2024-002",
      title: "Incomplete access review evidence",
      description:
        "Quarterly user access reviews were performed, but supporting approval evidence was incomplete.",
      framework: "NIST 800-53",
      control: "AC-2",
      severity: "High",
      owner: "John Carter",
      identifiedDate: "10 May 2024",
      dueDate: "07 Jun 2024",
      status: "In Progress",
    },
    {
      id: 3,
      reference: "FND-2024-003",
      title: "Security awareness records outdated",
      description:
        "Training records for a number of employees have not been updated following role changes.",
      framework: "ISO 27001",
      control: "A.6.3",
      severity: "Medium",
      owner: "Emily Davis",
      identifiedDate: "14 May 2024",
      dueDate: "14 Jun 2024",
      status: "In Progress",
    },
    {
      id: 4,
      reference: "FND-2024-004",
      title: "Asset inventory contains stale records",
      description:
        "The information asset register contains systems that have been retired but remain listed as active.",
      framework: "NIST CSF",
      control: "ID.AM",
      severity: "Low",
      owner: "Michael Lee",
      identifiedDate: "18 May 2024",
      dueDate: "28 Jun 2024",
      status: "Resolved",
    },
    {
      id: 5,
      reference: "FND-2024-005",
      title: "Vendor risk assessment not completed",
      description:
        "The annual security assessment for a critical third-party service provider remains outstanding.",
      framework: "SOC 2",
      control: "CC3.2",
      severity: "High",
      owner: "Alice Smith",
      identifiedDate: "21 May 2024",
      dueDate: "21 Jun 2024",
      status: "Open",
    },
  ],

  "xyz-finance": [
    {
      id: 11,
      reference: "FND-2024-011",
      title: "Excessive user permissions",
      description:
        "Several users retain access permissions that are no longer required for their current roles.",
      framework: "ISO 27001",
      control: "A.5.15",
      severity: "High",
      owner: "Sarah Brown",
      identifiedDate: "05 May 2024",
      dueDate: "05 Jun 2024",
      status: "Open",
    },
    {
      id: 12,
      reference: "FND-2024-012",
      title: "Incident response documentation incomplete",
      description:
        "Incident response procedures do not document escalation requirements for all critical scenarios.",
      framework: "NIST CSF",
      control: "RS.MA",
      severity: "Medium",
      owner: "David Wilson",
      identifiedDate: "12 May 2024",
      dueDate: "30 Jun 2024",
      status: "In Progress",
    },
    {
      id: 13,
      reference: "FND-2024-013",
      title: "Backup restoration test overdue",
      description:
        "A scheduled disaster recovery restoration test was not completed within the defined testing period.",
      framework: "NIST RMF",
      control: "CP-4",
      severity: "High",
      owner: "Sarah Brown",
      identifiedDate: "17 May 2024",
      dueDate: "20 Jun 2024",
      status: "Open",
    },
    {
      id: 14,
      reference: "FND-2024-014",
      title: "Security policy acknowledgement gap",
      description:
        "A small number of employees have not acknowledged the latest information security policy.",
      framework: "SOC 2",
      control: "CC2.2",
      severity: "Low",
      owner: "David Wilson",
      identifiedDate: "20 May 2024",
      dueDate: "30 Jun 2024",
      status: "Resolved",
    },
  ],

  "pqr-healthcare": [
    {
      id: 21,
      reference: "FND-2024-021",
      title: "Clinical application accounts not reviewed",
      description:
        "Periodic access review for several clinical applications was not completed on schedule.",
      framework: "ISO 27001",
      control: "A.5.18",
      severity: "Critical",
      owner: "Michael Lee",
      identifiedDate: "04 May 2024",
      dueDate: "31 May 2024",
      status: "Open",
    },
    {
      id: 22,
      reference: "FND-2024-022",
      title: "Logging coverage inconsistent",
      description:
        "Security event logging is not consistently enabled across several supporting infrastructure components.",
      framework: "NIST 800-53",
      control: "AU-2",
      severity: "High",
      owner: "Emily Davis",
      identifiedDate: "11 May 2024",
      dueDate: "15 Jun 2024",
      status: "In Progress",
    },
    {
      id: 23,
      reference: "FND-2024-023",
      title: "Supplier security clauses missing",
      description:
        "Some supplier agreements do not contain the required information security provisions.",
      framework: "NIST RMF",
      control: "SA-9",
      severity: "Medium",
      owner: "John Carter",
      identifiedDate: "19 May 2024",
      dueDate: "30 Jun 2024",
      status: "Open",
    },
  ],
};

export default function FindingsPage() {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace.id;

  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  
  useEffect(() => {
    if (workspaceId && params.id) {
      getFindings(workspaceId, params.id as string).then((res: any) => {
        if (res.success && res.data) {
          setFindings(res.data.map((f: any) => ({ ...f, reference: f.reference, identifiedDate: f.identified_date, dueDate: f.due_date })));
        }
        setLoading(false);
      });
    } else {
      setFindings([]);
      setLoading(false);
    }
  }, [workspaceId, params.id]);

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] = useState<
    FindingSeverity | "All Severities"
  >("All Severities");

  const [statusFilter, setStatusFilter] = useState<
    FindingStatus | "All Statuses"
  >("All Statuses");

  const [severityOpen, setSeverityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingFinding, setEditingFinding] =
    useState<Finding | null>(null);

  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const [formReference, setFormReference] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFramework, setFormFramework] =
    useState("ISO 27001");
  const [formControl, setFormControl] = useState("");
  const [formSeverity, setFormSeverity] =
    useState<FindingSeverity>("Medium");
  const [formOwner, setFormOwner] = useState("");
  const [formIdentifiedDate, setFormIdentifiedDate] =
    useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formStatus, setFormStatus] =
    useState<FindingStatus>("Open");

  if (loading) return <div className="p-8 text-center text-slate-500">Loading findings...</div>;

  const filteredFindings = useMemo(() => {
    const query = search.toLowerCase().trim();

    return findings.filter((finding) => {
      const matchesSearch =
        !query ||
        finding.reference.toLowerCase().includes(query) ||
        finding.title.toLowerCase().includes(query) ||
        finding.description.toLowerCase().includes(query) ||
        finding.framework.toLowerCase().includes(query) ||
        finding.control.toLowerCase().includes(query) ||
        finding.owner.toLowerCase().includes(query);

      const matchesSeverity =
        severityFilter === "All Severities" ||
        finding.severity === severityFilter;

      const matchesStatus =
        statusFilter === "All Statuses" ||
        finding.status === statusFilter;

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus
      );
    });
  }, [
    findings,
    search,
    severityFilter,
    statusFilter,
  ]);

  const criticalFindings = findings.filter(
    (finding) => finding.severity === "Critical"
  ).length;

  const highFindings = findings.filter(
    (finding) => finding.severity === "High"
  ).length;

  const openFindings = findings.filter(
    (finding) =>
      finding.status === "Open" ||
      finding.status === "In Progress"
  ).length;

  const resolvedFindings = findings.filter(
    (finding) =>
      finding.status === "Resolved" ||
      finding.status === "Closed"
  ).length;

  function resetForm() {
    setFormReference("");
    setFormTitle("");
    setFormDescription("");
    setFormFramework("ISO 27001");
    setFormControl("");
    setFormSeverity("Medium");
    setFormOwner("");
    setFormIdentifiedDate("");
    setFormDueDate("");
    setFormStatus("Open");
  }

  function openCreateModal() {
    setEditingFinding(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(finding: Finding) {
    setEditingFinding(finding);

    setFormReference(finding.reference);
    setFormTitle(finding.title);
    setFormDescription(finding.description);
    setFormFramework(finding.framework);
    setFormControl(finding.control);
    setFormSeverity(finding.severity);
    setFormOwner(finding.owner);
    setFormIdentifiedDate(finding.identifiedDate);
    setFormDueDate(finding.dueDate);
    setFormStatus(finding.status);

    setOpenMenu(null);
    setShowModal(true);
  }

  function saveFinding() {
    if (!formTitle.trim()) {
      return;
    }

    const reference =
      formReference.trim() ||
      `FND-${new Date().getFullYear()}-${String(
        Date.now()
      ).slice(-4)}`;

    const newFinding: Finding = {
      id: editingFinding?.id ?? Date.now(),
      reference,
      title: formTitle.trim(),
      description: formDescription.trim(),
      framework: formFramework,
      control: formControl.trim() || "Not specified",
      severity: formSeverity,
      owner: formOwner.trim() || "Unassigned",
      identifiedDate:
        formIdentifiedDate || "Not specified",
      dueDate: formDueDate || "Not specified",
      status: formStatus,
    };

    if (editingFinding) {
      setFindings((current) => current.map(
          (finding) =>
            finding.id === editingFinding.id
              ? newFinding
              : finding
        ));
    } else {
      setFindings((current) => [newFinding, ...current]);
    }

    setShowModal(false);
    setEditingFinding(null);
    resetForm();
  }

  function deleteFinding(finding: Finding) {
    const confirmed = window.confirm(
      `Remove "${finding.reference}" from this workspace?`
    );

    if (!confirmed) {
      return;
    }

    setFindings((current) => current.filter((item) => item.id !== finding.id));

    setOpenMenu(null);
  }

  function updateFindingStatus(
    finding: Finding,
    status: FindingStatus
  ) {
    setFindings((current) => current.map((item) =>
        item.id === finding.id
          ? { ...item, status }
          : item
      ));

    setOpenMenu(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      {/* 
        IMPORTANT:
        Sidebar is fixed at 250px.
        This wrapper reserves exactly that width so
        Findings can never render underneath the sidebar.
      */}
      <main className="ml-[250px] w-[calc(100%-250px)] min-h-screen">
        <Header />

        <section className="px-8 py-7">
          {/* Page Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <FileWarning className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <h1 className="text-[28px] font-semibold tracking-[-0.5px]">
                    Findings
                  </h1>

                  <p className="mt-1 text-[14px] text-slate-500">
                    Track, manage and remediate audit findings
                    for {currentWorkspace.name}.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Finding
            </button>
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-4 gap-5">
            <SummaryCard
              title="Total Findings"
              value={String(findings.length)}
              icon={<FileWarning className="h-5 w-5" />}
            />

            <SummaryCard
              title="Critical / High"
              value={`${criticalFindings + highFindings}`}
              icon={<AlertTriangle className="h-5 w-5" />}
            />

            <SummaryCard
              title="Open Findings"
              value={String(openFindings)}
              icon={<Clock3 className="h-5 w-5" />}
            />

            <SummaryCard
              title="Resolved Findings"
              value={String(resolvedFindings)}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </div>

          {/* Main Panel */}
          <div className="overflow-visible rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search findings..."
                    className="h-9 w-[300px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Severity Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSeverityOpen((open) => !open);
                      setStatusOpen(false);
                    }}
                    className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    {severityFilter}

                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        severityOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {severityOpen && (
                    <div className="absolute right-0 top-10 z-[60] w-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
                      {[
                        "All Severities",
                        ...SEVERITY_OPTIONS,
                      ].map((severity) => (
                        <button
                          key={severity}
                          type="button"
                          onClick={() => {
                            setSeverityFilter(
                              severity as
                                | FindingSeverity
                                | "All Severities"
                            );
                            setSeverityOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-slate-50 ${
                            severityFilter === severity
                              ? "font-medium text-blue-600"
                              : "text-slate-600"
                          }`}
                        >
                          {severity}

                          {severityFilter === severity && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusOpen((open) => !open);
                      setSeverityOpen(false);
                    }}
                    className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    {statusFilter}

                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        statusOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {statusOpen && (
                    <div className="absolute right-0 top-10 z-[60] w-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
                      {[
                        "All Statuses",
                        ...STATUS_OPTIONS,
                      ].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setStatusFilter(
                              status as
                                | FindingStatus
                                | "All Statuses"
                            );
                            setStatusOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-slate-50 ${
                            statusFilter === status
                              ? "font-medium text-blue-600"
                              : "text-slate-600"
                          }`}
                        >
                          {status}

                          {statusFilter === status && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                    <TableHeader>Finding</TableHeader>
                    <TableHeader>Framework</TableHeader>
                    <TableHeader>Control</TableHeader>
                    <TableHeader>Severity</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredFindings.length > 0 ? (
                    filteredFindings.map((finding) => (
                      <FindingRow
                        key={finding.id}
                        finding={finding}
                        menuOpen={openMenu === finding.id}
                        onMenu={() =>
                          setOpenMenu(
                            openMenu === finding.id
                              ? null
                              : finding.id
                          )
                        }
                        onEdit={() =>
                          openEditModal(finding)
                        }
                        onResolve={() =>
                          updateFindingStatus(
                            finding,
                            "Resolved"
                          )
                        }
                        onDelete={() =>
                          deleteFinding(finding)
                        }
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center"
                      >
                        <FileWarning className="mx-auto h-7 w-7 text-slate-300" />

                        <p className="mt-2 text-[12px] font-medium text-slate-600">
                          No findings found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Try changing your search or filter
                          settings.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-[10px] text-slate-400">
                Showing {filteredFindings.length} of{" "}
                {findings.length} findings
              </span>

              <span className="text-[10px] text-slate-400">
                {openFindings} requiring action
              </span>
            </div>
          </div>

          {/* Information Cards */}
          <div className="mt-6 grid grid-cols-3 gap-5">
            <InfoCard
              icon={<ShieldAlert className="h-4 w-4" />}
              title="Risk Exposure"
              value={`${criticalFindings} critical · ${highFindings} high`}
              description="High-priority findings requiring timely remediation or formal risk acceptance."
            />

            <InfoCard
              icon={<UserRound className="h-4 w-4" />}
              title="Finding Owners"
              value={`${
                new Set(
                  findings.map((finding) => finding.owner)
                ).size
              } owners`}
              description="Users currently responsible for addressing findings in this workspace."
            />

            <InfoCard
              icon={<CircleDot className="h-4 w-4" />}
              title="Workspace"
              value={currentWorkspace.name}
              description="All findings shown here belong to the selected workspace."
            />
          </div>
        </section>
      </main>

      {/* Modal */}
      {showModal && (
        <FindingModal
          editing={Boolean(editingFinding)}
          reference={formReference}
          title={formTitle}
          description={formDescription}
          framework={formFramework}
          control={formControl}
          severity={formSeverity}
          owner={formOwner}
          identifiedDate={formIdentifiedDate}
          dueDate={formDueDate}
          status={formStatus}
          setReference={setFormReference}
          setTitle={setFormTitle}
          setDescription={setFormDescription}
          setFramework={setFormFramework}
          setControl={setFormControl}
          setSeverity={setFormSeverity}
          setOwner={setFormOwner}
          setIdentifiedDate={setFormIdentifiedDate}
          setDueDate={setFormDueDate}
          setStatus={setFormStatus}
          onClose={() => {
            setShowModal(false);
            setEditingFinding(null);
          }}
          onSave={saveFinding}
        />
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="text-[21px] font-semibold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">
        {title}
      </p>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500 first:px-5">
      {children}
    </th>
  );
}

function FindingRow({
  finding,
  menuOpen,
  onMenu,
  onEdit,
  onResolve,
  onDelete,
}: {
  finding: Finding;
  menuOpen: boolean;
  onMenu: () => void;
  onEdit: () => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
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
        : finding.status === "Resolved"
          ? "bgmerald-50 textmerald-700"
          : finding.status === "Accepted"
            ? "bg-violet-50 text-violet-700"
            : "bg-slate-100 text-slate-500";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
              {finding.reference}
            </span>
          </div>

          <p className="mt-2 text-[12px] font-medium text-slate-800">
            {finding.title}
          </p>

          <p className="mt-1 max-w-[310px] truncate text-[10px] text-slate-400">
            {finding.description || "No description provided"}
          </p>
        </div>
      </td>

      <td className="px-3 py-4">
        <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
          {finding.framework}
        </span>
      </td>

      <td className="px-3 py-4">
        <span className="text-[10px] font-medium text-slate-600">
          {finding.control}
        </span>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${severityClass}`}
        >
          {finding.severity}
        </span>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-[9px] font-semibold text-violet-700">
            {getInitials(finding.owner)}
          </div>

          <span className="text-[10px] text-slate-600">
            {finding.owner}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span>{finding.dueDate}</span>
        </div>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${statusClass}`}
        >
          {finding.status}
        </span>
      </td>

      <td className="relative px-3 py-4">
        <button
          type="button"
          onClick={onMenu}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-3 top-11 z-[70] w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Finding
            </button>

            {finding.status !== "Resolved" &&
              finding.status !== "Closed" && (
                <button
                  type="button"
                  onClick={onResolve}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark Resolved
                </button>
              )}

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Finding
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function FindingModal({
  editing,
  reference,
  title,
  description,
  framework,
  control,
  severity,
  owner,
  identifiedDate,
  dueDate,
  status,
  setReference,
  setTitle,
  setDescription,
  setFramework,
  setControl,
  setSeverity,
  setOwner,
  setIdentifiedDate,
  setDueDate,
  setStatus,
  onClose,
  onSave,
}: {
  editing: boolean;
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
  setReference: (value: string) => void;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setFramework: (value: string) => void;
  setControl: (value: string) => void;
  setSeverity: (value: FindingSeverity) => void;
  setOwner: (value: string) => void;
  setIdentifiedDate: (value: string) => void;
  setDueDate: (value: string) => void;
  setStatus: (value: FindingStatus) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-[650px] overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">
              {editing ? "Edit Finding" : "New Finding"}
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              {editing
                ? "Update the finding details and remediation status."
                : "Record an audit finding and assign remediation responsibility."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Finding Reference"
              value={reference}
              onChange={setReference}
              placeholder="e.g. FND-2024-001"
            />

            <SelectField
              label="Severity"
              value={severity}
              options={SEVERITY_OPTIONS}
              onChange={(value) =>
                setSeverity(value as FindingSeverity)
              }
            />
          </div>

          <FormField
            label="Finding Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Privileged accounts lack MFA"
          />

          <div>
            <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the finding, condition, impact and relevant context..."
              rows={4}
              className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Framework"
              value={framework}
              options={FRAMEWORKS}
              onChange={setFramework}
            />

            <FormField
              label="Control / Requirement"
              value={control}
              onChange={setControl}
              placeholder="e.g. A.5.17"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Finding Owner"
              value={owner}
              onChange={setOwner}
              placeholder="e.g. Alice Smith"
            />

            <SelectField
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) =>
                setStatus(value as FindingStatus)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Identified Date"
              value={identifiedDate}
              onChange={setIdentifiedDate}
              placeholder="e.g. 06 May 2024"
            />

            <FormField
              label="Due Date"
              value={dueDate}
              onChange={setDueDate}
              placeholder="e.g. 31 May 2024"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justifynd gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-slate-200 px-4 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!title.trim()}
            className="h-8 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? "Save Changes" : "Create Finding"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none focus:border-blue-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
  description,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="text-[12px] font-semibold text-slate-800">
        {title}
      </p>

      <p className="mt-1 text-[13px] font-medium text-blue-600">
        {value}
      </p>

      <p className="mt-2 text-[9px] leading-4 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NA"
  );
}
export const dynamic = 'force-dynamic';
