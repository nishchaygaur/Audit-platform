"use client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useEffect } from "react";
import { getFindings } from "@/actions/findings";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Search,
  FileWarning,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronDown,
  Link2,
} from "lucide-react";

type FindingSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

type FindingStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Accepted Risk"
  | "Closed";

type Finding = {
  id: number;
  findingId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  framework: string;
  control: string;
  owner: string;
  auditor: string;
  identified: string;
  dueDate: string;
  evidence: string;
  recommendation: string;
};

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
  "Accepted Risk",
  "Closed",
];

const FRAMEWORK_OPTIONS = [
  "All Frameworks",
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "SOC 2",
  "CIS Controls",
];

const INITIAL_FINDINGS: Finding[] = [
  {
    id: 1,
    findingId: "FND-2026-001",
    title: "Privileged access reviews are not performed quarterly",
    description:
      "Quarterly privileged access reviews were not consistently performed for administrative accounts.",
    severity: "High",
    status: "Open",
    framework: "ISO 27001",
    control: "A.5.18",
    owner: "Michael Lee",
    auditor: "John Carter",
    identified: "Today, 09:15 AM",
    dueDate: "Sep 15, 2026",
    evidence: "Access Control Review.xlsx",
    recommendation:
      "Implement a documented quarterly privileged-access review process with management sign-off.",
  },
  {
    id: 2,
    findingId: "FND-2026-002",
    title: "Security awareness training records incomplete",
    description:
      "Training completion records for several employees could not be verified during the audit.",
    severity: "Medium",
    status: "In Progress",
    framework: "NIST CSF",
    control: "PR.AT-01",
    owner: "Emily Davis",
    auditor: "John Carter",
    identified: "Yesterday, 03:42 PM",
    dueDate: "Sep 20, 2026",
    evidence: "Security Awareness Training.pdf",
    recommendation:
      "Maintain centralized training records and establish periodic completion monitoring.",
  },
  {
    id: 3,
    findingId: "FND-2026-003",
    title: "Vulnerability remediation exceeds defined SLA",
    description:
      "Several high-risk vulnerabilities remained unresolved beyond the organization's remediation SLA.",
    severity: "Critical",
    status: "Open",
    framework: "NIST CSF",
    control: "DE.CM-08",
    owner: "David Wilson",
    auditor: "John Carter",
    identified: "Yesterday, 11:18 AM",
    dueDate: "Sep 10, 2026",
    evidence: "Vulnerability Management Report.pdf",
    recommendation:
      "Enforce vulnerability remediation SLAs and escalate overdue high-risk vulnerabilities.",
  },
  {
    id: 4,
    findingId: "FND-2026-004",
    title: "Risk register requires periodic review",
    description:
      "The enterprise risk register did not contain evidence of a recent formal review.",
    severity: "Medium",
    status: "Open",
    framework: "NIST RMF",
    control: "RM-02",
    owner: "Alice Smith",
    auditor: "John Carter",
    identified: "2 days ago",
    dueDate: "Sep 25, 2026",
    evidence: "Risk Assessment Register.xlsx",
    recommendation:
      "Establish a recurring risk-register review cadence with documented approvals.",
  },
  {
    id: 5,
    findingId: "FND-2026-005",
    title: "Incident response procedure requires update",
    description:
      "The incident response procedure does not reflect the organization's current escalation contacts.",
    severity: "Low",
    status: "Resolved",
    framework: "SOC 2",
    control: "CC7.3",
    owner: "Sarah Brown",
    auditor: "John Carter",
    identified: "3 days ago",
    dueDate: "Sep 05, 2026",
    evidence: "Incident Response Procedure.docx",
    recommendation:
      "Update escalation contacts and validate the procedure through an annual tabletop exercise.",
  },
  {
    id: 6,
    findingId: "FND-2026-006",
    title: "Security policy approval evidence unavailable",
    description:
      "Current approval evidence for the information security policy was not available at the time of testing.",
    severity: "High",
    status: "Accepted Risk",
    framework: "ISO 27001",
    control: "A.5.1",
    owner: "Alice Smith",
    auditor: "John Carter",
    identified: "4 days ago",
    dueDate: "Oct 01, 2026",
    evidence: "Information Security Policy.pdf",
    recommendation:
      "Maintain documented management approval and version history for security policies.",
  },
];

export default function FindingsPage() {
  const { currentWorkspace } = useWorkspace();
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (currentWorkspace?.id) {
      getFindings(currentWorkspace.id).then((res: any) => {
        if (res.success && res.data) setFindings(res.data.map((f: any) => ({ ...f, findingId: f.reference, identified: f.identified_date, dueDate: f.due_date })));
        setLoading(false);
      });
    } else {
      setFindings([]);
      setLoading(false);
    }
  }, [currentWorkspace?.id]);
  //


  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] =
    useState("All Severity");

  const [statusFilter, setStatusFilter] =
    useState("All Status");

  const [frameworkFilter, setFrameworkFilter] =
    useState("All Frameworks");

  const [severityOpen, setSeverityOpen] =
    useState(false);

  const [statusOpen, setStatusOpen] =
    useState(false);

  const [frameworkOpen, setFrameworkOpen] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [editingFinding, setEditingFinding] =
    useState<Finding | null>(null);

  const [selectedFinding, setSelectedFinding] =
    useState<Finding | null>(null);

  const [openMenu, setOpenMenu] =
    useState<number | null>(null);

  const [formTitle, setFormTitle] =
    useState("");

  const [formDescription, setFormDescription] =
    useState("");

  const [formSeverity, setFormSeverity] =
    useState<FindingSeverity>("Medium");

  const [formStatus, setFormStatus] =
    useState<FindingStatus>("Open");

  const [formFramework, setFormFramework] =
    useState("ISO 27001");

  const [formControl, setFormControl] =
    useState("");

  const [formOwner, setFormOwner] =
    useState("Alice Smith");

  const [formDueDate, setFormDueDate] =
    useState("");

  const [formEvidence, setFormEvidence] =
    useState("");

  const [formRecommendation, setFormRecommendation] =
    useState("");

  const filteredFindings = useMemo(() => {
    const query = search.toLowerCase().trim();

    return findings.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.findingId.toLowerCase().includes(query) ||
        item.control.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesSeverity =
        severityFilter === "All Severity" ||
        item.severity === severityFilter;

      const matchesStatus =
        statusFilter === "All Status" ||
        item.status === statusFilter;

      const matchesFramework =
        frameworkFilter === "All Frameworks" ||
        item.framework === frameworkFilter;

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus &&
        matchesFramework
      );
    });
  }, [
    findings,
    search,
    severityFilter,
    statusFilter,
    frameworkFilter,
  ]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading findings...</div>;

  const totalFindings = findings.length;

  const openFindings = findings.filter(
    (item) =>
      item.status === "Open" ||
      item.status === "In Progress"
  ).length;

  const criticalHighFindings = findings.filter(
    (item) =>
      item.severity === "Critical" ||
      item.severity === "High"
  ).length;

  const resolvedFindings = findings.filter(
    (item) =>
      item.status === "Resolved" ||
      item.status === "Closed"
  ).length;

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormSeverity("Medium");
    setFormStatus("Open");
    setFormFramework("ISO 27001");
    setFormControl("");
    setFormOwner("Alice Smith");
    setFormDueDate("");
    setFormEvidence("");
    setFormRecommendation("");
  }

  function openAddFinding() {
    setEditingFinding(null);
    resetForm();
    setShowModal(true);
  }

  function openEditFinding(item: Finding) {
    setEditingFinding(item);

    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormSeverity(item.severity);
    setFormStatus(item.status);
    setFormFramework(item.framework);
    setFormControl(item.control);
    setFormOwner(item.owner);
    setFormDueDate(item.dueDate);
    setFormEvidence(item.evidence);
    setFormRecommendation(item.recommendation);

    setOpenMenu(null);
    setShowModal(true);
  }

  function saveFinding() {
    if (
      !formTitle.trim() ||
      !formDescription.trim() ||
      !formControl.trim()
    ) {
      return;
    }

    if (editingFinding) {
      setFindings((current) =>
        current.map((item) =>
          item.id === editingFinding.id
            ? {
                ...item,
                title: formTitle.trim(),
                description: formDescription.trim(),
                severity: formSeverity,
                status: formStatus,
                framework: formFramework,
                control: formControl.trim(),
                owner: formOwner,
                dueDate:
                  formDueDate.trim() || "Not assigned",
                evidence:
                  formEvidence.trim() || "No evidence linked",
                recommendation:
                  formRecommendation.trim() ||
                  "No recommendation provided.",
              }
            : item
        )
      );
    } else {
      const newFinding: Finding = {
        id: Date.now(),
        findingId: `FND-2026-${String(
          findings.length + 1
        ).padStart(3, "0")}`,
        title: formTitle.trim(),
        description: formDescription.trim(),
        severity: formSeverity,
        status: formStatus,
        framework: formFramework,
        control: formControl.trim(),
        owner: formOwner,
        auditor: "John Carter",
        identified: "Just now",
        dueDate:
          formDueDate.trim() || "Not assigned",
        evidence:
          formEvidence.trim() || "No evidence linked",
        recommendation:
          formRecommendation.trim() ||
          "No recommendation provided.",
      };

      setFindings((current) => [
        newFinding,
        ...current,
      ]);
    }

    setShowModal(false);
  }

  function deleteFinding(item: Finding) {
    setFindings((current) =>
      current.filter(
        (entry) => entry.id !== item.id
      )
    );

    setOpenMenu(null);

    if (selectedFinding?.id === item.id) {
      setSelectedFinding(null);
    }
  }

  function changeStatus(
    item: Finding,
    status: FindingStatus
  ) {
    setFindings((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status,
            }
          : entry
      )
    );

    setOpenMenu(null);

    if (selectedFinding?.id === item.id) {
      setSelectedFinding({
        ...item,
        status,
      });
    }
  }

  function changeSeverity(
    item: Finding,
    severity: FindingSeverity
  ) {
    setFindings((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              severity,
            }
          : entry
      )
    );

    setOpenMenu(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      {/* <main className="min-h-screen"> */}
      <main className="ml-64 min-h-screen">
        <section className="px-8 py-7">

          {/* HEADER */}

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <FileWarning
                  className="h-5 w-5 text-red-500"
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h1 className="text-[23px] font-semibold">
                  Findings
                </h1>

                <p className="mt-1 text-[11px] text-slate-500">
                  Identify, assess and manage audit findings
                  mapped to controls and frameworks.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddFinding}
              className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700"
            >
              <FileWarning className="h-4 w-4" />
              Add Finding
            </button>
          </div>

          {/* SUMMARY */}

          <div className="mb-5 grid grid-cols-4 gap-4">
            <SummaryCard
              icon={
                <FileWarning className="h-4 w-4" />
              }
              label="Total Findings"
              value={String(totalFindings)}
            />

            <SummaryCard
              icon={
                <AlertTriangle className="h-4 w-4" />
              }
              label="Open Findings"
              value={String(openFindings)}
              valueClass="text-amber-600"
            />

            <SummaryCard
              icon={
                <XCircle className="h-4 w-4" />
              }
              label="Critical / High"
              value={String(criticalHighFindings)}
              valueClass="text-red-500"
            />

            <SummaryCard
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
              label="Resolved"
              value={String(resolvedFindings)}
              valueClass="text-emerald-600"
            />
          </div>

          {/* REGISTER */}

          <div className="overflow-visible rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

            {/* TOOLBAR */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search findings..."
                  className="h-9 w-[340px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2">

                <FilterDropdown
                  label={frameworkFilter}
                  open={frameworkOpen}
                  setOpen={() => {
                    setFrameworkOpen(
                      !frameworkOpen
                    );
                    setStatusOpen(false);
                    setSeverityOpen(false);
                  }}
                  options={FRAMEWORK_OPTIONS}
                  onSelect={(value) => {
                    setFrameworkFilter(value);
                    setFrameworkOpen(false);
                  }}
                />

                <FilterDropdown
                  label={severityFilter}
                  open={severityOpen}
                  setOpen={() => {
                    setSeverityOpen(
                      !severityOpen
                    );
                    setFrameworkOpen(false);
                    setStatusOpen(false);
                  }}
                  options={[
                    "All Severity",
                    ...SEVERITY_OPTIONS,
                  ]}
                  onSelect={(value) => {
                    setSeverityFilter(value);
                    setSeverityOpen(false);
                  }}
                />

                <FilterDropdown
                  label={statusFilter}
                  open={statusOpen}
                  setOpen={() => {
                    setStatusOpen(!statusOpen);
                    setFrameworkOpen(false);
                    setSeverityOpen(false);
                  }}
                  options={[
                    "All Status",
                    ...STATUS_OPTIONS,
                  ]}
                  onSelect={(value) => {
                    setStatusFilter(value);
                    setStatusOpen(false);
                  }}
                />

              </div>
            </div>

            {/* TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">

                    <TableHeader>
                      Finding
                    </TableHeader>

                    <TableHeader>
                      Severity
                    </TableHeader>

                    <TableHeader>
                      Framework
                    </TableHeader>

                    <TableHeader>
                      Control
                    </TableHeader>

                    <TableHeader>
                      Owner
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Due Date
                    </TableHeader>

                    <th className="w-16 px-3 py-3" />

                  </tr>
                </thead>

                <tbody>
                  {filteredFindings.length > 0 ? (
                    filteredFindings.map((item) => (
                      <FindingRow
                        key={item.id}
                        item={item}
                        menuOpen={
                          openMenu === item.id
                        }
                        onMenu={() =>
                          setOpenMenu(
                            openMenu === item.id
                              ? null
                              : item.id
                          )
                        }
                        onView={() => {
                          setSelectedFinding(item);
                          setOpenMenu(null);
                        }}
                        onEdit={() =>
                          openEditFinding(item)
                        }
                        onAccept={() =>
                          changeStatus(
                            item,
                            "Accepted Risk"
                          )
                        }
                        onResolve={() =>
                          changeStatus(
                            item,
                            "Resolved"
                          )
                        }
                        onCloseFinding={() =>
                          changeStatus(
                            item,
                            "Closed"
                          )
                        }
                        onCritical={() =>
                          changeSeverity(
                            item,
                            "Critical"
                          )
                        }
                        onHigh={() =>
                          changeSeverity(
                            item,
                            "High"
                          )
                        }
                        onMedium={() =>
                          changeSeverity(
                            item,
                            "Medium"
                          )
                        }
                        onLow={() =>
                          changeSeverity(
                            item,
                            "Low"
                          )
                        }
                        onDelete={() =>
                          deleteFinding(item)
                        }
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center"
                      >
                        <Search className="mx-auto h-6 w-6 text-slate-300" />

                        <p className="mt-2 text-[12px] font-medium text-slate-600">
                          No findings found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Try changing your search or
                          filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-[10px] text-slate-400">
                Showing {filteredFindings.length} of{" "}
                {findings.length} findings
              </span>

              <span className="text-[10px] text-slate-400">
                {openFindings} open
              </span>
            </div>
          </div>

          {/* TRACEABILITY */}

          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4">
              <h2 className="text-[14px] font-semibold text-slate-800">
                Finding Traceability
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                Findings are mapped directly to framework
                controls, evidence and remediation
                activities.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">

              <TraceCard
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
                title="Control Mapping"
                text="Every finding is linked to an applicable framework control."
              />

              <TraceCard
                icon={
                  <Link2 className="h-4 w-4" />
                }
                title="Evidence Linkage"
                text="Findings can reference supporting audit evidence."
              />

              <TraceCard
                icon={
                  <CheckCircle2 className="h-4 w-4" />
                }
                title="Remediation Tracking"
                text="Track findings from identification through remediation and closure."
              />

            </div>
          </div>

        </section>
      </main>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <FindingModal
          editing={Boolean(editingFinding)}
          title={formTitle}
          description={formDescription}
          severity={formSeverity}
          status={formStatus}
          framework={formFramework}
          control={formControl}
          owner={formOwner}
          dueDate={formDueDate}
          evidence={formEvidence}
          recommendation={formRecommendation}
          setTitle={setFormTitle}
          setDescription={setFormDescription}
          setSeverity={setFormSeverity}
          setStatus={setFormStatus}
          setFramework={setFormFramework}
          setControl={setFormControl}
          setOwner={setFormOwner}
          setDueDate={setFormDueDate}
          setEvidence={setFormEvidence}
          setRecommendation={
            setFormRecommendation
          }
          onClose={() => setShowModal(false)}
          onSave={saveFinding}
        />
      )}

      {/* DETAILS */}

      {selectedFinding && (
        <FindingDetails
          item={selectedFinding}
          onClose={() =>
            setSelectedFinding(null)
          }
          onEdit={() => {
            setSelectedFinding(null);
            openEditFinding(selectedFinding);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon,
  label,
  value,
  valueClass = "text-slate-900",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p
        className={`text-[20px] font-semibold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* ============================================================
   TABLE HEADER
============================================================ */

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

/* ============================================================
   FILTER DROPDOWN
============================================================ */

function FilterDropdown({
  label,
  open,
  setOpen,
  options,
  onSelect,
}: {
  label: string;
  open: boolean;
  setOpen: () => void;
  options: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={setOpen}
        className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50"
      >
        {label}

        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[180px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-slate-50 ${
                label === option
                  ? "font-medium text-blue-600"
                  : "text-slate-600"
              }`}
            >
              {option}

              {label === option && (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FINDING ROW
============================================================ */

function FindingRow({
  item,
  menuOpen,
  onMenu,
  onView,
  onEdit,
  onAccept,
  onResolve,
  onCloseFinding,
  onCritical,
  onHigh,
  onMedium,
  onLow,
  onDelete,
}: {
  item: Finding;
  menuOpen: boolean;
  onMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onAccept: () => void;
  onResolve: () => void;
  onCloseFinding: () => void;
  onCritical: () => void;
  onHigh: () => void;
  onMedium: () => void;
  onLow: () => void;
  onDelete: () => void;
}) {
  const severityClass =
    item.severity === "Critical"
      ? "bg-red-100 text-red-700"
      : item.severity === "High"
        ? "bg-orange-50 text-orange-700"
        : item.severity === "Medium"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600";

  const statusClass =
    item.status === "Resolved" ||
    item.status === "Closed"
      ? "bg-emerald-50 text-emerald-700"
      : item.status === "In Progress"
        ? "bg-blue-50 text-blue-700"
        : item.status === "Accepted Risk"
          ? "bg-violet-50 text-violet-700"
          : "bg-amber-50 text-amber-700";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">

      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onView}
          className="flex items-start gap-3 text-left"
        >
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500">
            <FileWarning className="h-4 w-4" />
          </div>

          <div className="min-w-0 max-w-[330px]">
            <p className="text-[12px] font-medium text-slate-800 hover:text-blue-600">
              {item.title}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              {item.findingId} · {item.auditor}
            </p>
          </div>
        </button>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${severityClass}`}
        >
          {item.severity}
        </span>
      </td>

      <td className="px-3 py-4">
        <span className="rounded bg-violet-50 px-2 py-1 text-[9px] font-medium text-violet-700">
          {item.framework}
        </span>
      </td>

      <td className="px-3 py-4">
        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
          {item.control}
        </span>
      </td>

      <td className="px-3 py-4">
        <span className="text-[10px] text-slate-600">
          {item.owner}
        </span>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${statusClass}`}
        >
          {item.status}
        </span>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock3 className="h-3.5 w-3.5 text-slate-400" />
          {item.dueDate}
        </div>
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
          <div className="absolute right-3 top-12 z-50 w-48 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">

            <button
              type="button"
              onClick={onView}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5" />
              View Finding
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Finding
            </button>

            <div className="my-1 border-t border-slate-100" />

            <p className="px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wide text-slate-400">
              Change Severity
            </p>

            <div className="grid grid-cols-2 gap-1 px-2 pb-1">
              <button
                type="button"
                onClick={onCritical}
                className="rounded px-2 py-1.5 text-[9px] text-red-600 hover:bg-red-50"
              >
                Critical
              </button>

              <button
                type="button"
                onClick={onHigh}
                className="rounded px-2 py-1.5 text-[9px] text-orange-600 hover:bg-orange-50"
              >
                High
              </button>

              <button
                type="button"
                onClick={onMedium}
                className="rounded px-2 py-1.5 text-[9px] text-amber-600 hover:bg-amber-50"
              >
                Medium
              </button>

              <button
                type="button"
                onClick={onLow}
                className="rounded px-2 py-1.5 text-[9px] text-slate-600 hover:bg-slate-50"
              >
                Low
              </button>
            </div>

            <div className="my-1 border-t border-slate-100" />

            {item.status !== "Resolved" && (
              <button
                type="button"
                onClick={onResolve}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Resolved
              </button>
            )}

            {item.status !== "Accepted Risk" && (
              <button
                type="button"
                onClick={onAccept}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-violet-600 hover:bg-violet-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Accept Risk
              </button>
            )}

            {item.status !== "Closed" && (
              <button
                type="button"
                onClick={onCloseFinding}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-blue-600 hover:bg-blue-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Close Finding
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

/* ============================================================
   TRACE CARD
============================================================ */

function TraceCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>

      <h3 className="text-[11px] font-semibold text-slate-700">
        {title}
      </h3>

      <p className="mt-1 text-[9px] leading-4 text-slate-400">
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   FINDING MODAL
============================================================ */

function FindingModal({
  editing,
  title,
  description,
  severity,
  status,
  framework,
  control,
  owner,
  dueDate,
  evidence,
  recommendation,
  setTitle,
  setDescription,
  setSeverity,
  setStatus,
  setFramework,
  setControl,
  setOwner,
  setDueDate,
  setEvidence,
  setRecommendation,
  onClose,
  onSave,
}: {
  editing: boolean;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  framework: string;
  control: string;
  owner: string;
  dueDate: string;
  evidence: string;
  recommendation: string;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setSeverity: (value: FindingSeverity) => void;
  setStatus: (value: FindingStatus) => void;
  setFramework: (value: string) => void;
  setControl: (value: string) => void;
  setOwner: (value: string) => void;
  setDueDate: (value: string) => void;
  setEvidence: (value: string) => void;
  setRecommendation: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-6">

      <div className="my-6 w-full max-w-[620px] overflow-hidden rounded-xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">
              {editing
                ? "Edit Finding"
                : "Add Finding"}
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              {editing
                ? "Update finding details, classification and remediation."
                : "Register a finding and map it to an audit control."}
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

        <div className="space-y-4 px-6 py-5">

          <FormField
            label="Finding Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Privileged access review not performed"
          />

          <TextAreaField
            label="Finding Description"
            value={description}
            onChange={setDescription}
            placeholder="Describe the audit observation and condition identified."
          />

          <div className="grid grid-cols-2 gap-4">

            <SelectField
              label="Severity"
              value={severity}
              options={SEVERITY_OPTIONS}
              onChange={(value) =>
                setSeverity(
                  value as FindingSeverity
                )
              }
            />

            <SelectField
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) =>
                setStatus(
                  value as FindingStatus
                )
              }
            />

          </div>

          <div className="grid grid-cols-2 gap-4">

            <SelectField
              label="Framework"
              value={framework}
              options={[
                "ISO 27001",
                "NIST CSF",
                "NIST RMF",
                "SOC 2",
                "CIS Controls",
              ]}
              onChange={setFramework}
            />

            <FormField
              label="Control ID"
              value={control}
              onChange={setControl}
              placeholder="e.g. A.5.18"
            />

          </div>

          <div className="grid grid-cols-2 gap-4">

            <SelectField
              label="Finding Owner"
              value={owner}
              options={[
                "Alice Smith",
                "John Carter",
                "Emily Davis",
                "Michael Lee",
                "David Wilson",
                "Sarah Brown",
              ]}
              onChange={setOwner}
            />

            <FormField
              label="Due Date"
              value={dueDate}
              onChange={setDueDate}
              placeholder="e.g. Sep 20, 2026"
            />

          </div>

          <FormField
            label="Linked Evidence"
            value={evidence}
            onChange={setEvidence}
            placeholder="e.g. Access Control Review.xlsx"
          />

          <TextAreaField
            label="Recommendation / Remediation"
            value={recommendation}
            onChange={setRecommendation}
            placeholder="Describe the recommended corrective action."
          />

          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

              <div>
                <p className="text-[10px] font-medium text-blue-800">
                  Control Traceability
                </p>

                <p className="mt-1 text-[9px] leading-4 text-blue-600">
                  This finding will be associated with{" "}
                  {control ||
                    "the selected control"}{" "}
                  under {framework}.
                </p>
              </div>
            </div>
          </div>
        </div>

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
            disabled={
              !title.trim() ||
              !description.trim() ||
              !control.trim()
            }
            className="h-8 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing
              ? "Save Changes"
              : "Add Finding"}
          </button>

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <input
        type="text"
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

/* ============================================================
   TEXT AREA
============================================================ */

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] leading-4 text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      />
    </div>
  );
}

/* ============================================================
   SELECT FIELD
============================================================ */

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
          <option key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ============================================================
   FINDING DETAILS
============================================================ */

function FindingDetails({
  item,
  onClose,
  onEdit,
}: {
  item: Finding;
  onClose: () => void;
  onEdit: () => void;
}) {
  const severityClass =
    item.severity === "Critical"
      ? "bg-red-100 text-red-700"
      : item.severity === "High"
        ? "bg-orange-50 text-orange-700"
        : item.severity === "Medium"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600";

  const statusClass =
    item.status === "Resolved" ||
    item.status === "Closed"
      ? "bg-emerald-50 text-emerald-700"
      : item.status === "In Progress"
        ? "bg-blue-50 text-blue-700"
        : item.status === "Accepted Risk"
          ? "bg-violet-50 text-violet-700"
          : "bg-amber-50 text-amber-700";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-6">

      <div className="my-6 w-full max-w-[640px] overflow-hidden rounded-xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-500">
              <FileWarning className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-[14px] font-semibold text-slate-800">
                Finding Details
              </h2>

              <p className="mt-1 text-[9px] text-slate-400">
                {item.findingId}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>

        </div>

        <div className="px-6 py-5">

          <div className="mb-5 rounded-md border border-slate-100 bg-slate-50/60 p-4">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  {item.title}
                </p>

                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  {item.description}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-medium ${severityClass}`}
              >
                {item.severity}
              </span>

            </div>

          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5">

            <DetailItem
              label="Framework"
              value={item.framework}
            />

            <DetailItem
              label="Control"
              value={item.control}
            />

            <DetailItem
              label="Owner"
              value={item.owner}
            />

            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>

              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[9px] font-medium ${statusClass}`}
              >
                {item.status}
              </span>
            </div>

            <DetailItem
              label="Identified"
              value={item.identified}
            />

            <DetailItem
              label="Due Date"
              value={item.dueDate}
            />

            <DetailItem
              label="Auditor"
              value={item.auditor}
            />

            <DetailItem
              label="Linked Evidence"
              value={item.evidence}
            />

          </div>

          <div className="mt-6 rounded-md border border-blue-100 bg-blue-50 p-4">

            <div className="flex items-start gap-2">

              <Link2 className="mt-0.5 h-4 w-4 text-blue-600" />

              <div>
                <p className="text-[10px] font-semibold text-blue-800">
                  Control Mapping
                </p>

                <p className="mt-1 text-[9px] leading-4 text-blue-600">
                  This finding is mapped to control{" "}
                  <strong>{item.control}</strong>{" "}
                  in the {item.framework} framework.
                </p>
              </div>

            </div>

          </div>

          <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4">

            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
              Recommendation / Remediation
            </p>

            <p className="mt-2 text-[10px] leading-5 text-slate-600">
              {item.recommendation}
            </p>

          </div>

        </div>

        <div className="flex items-center justifynd gap-2 border-t border-slate-100 px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-slate-200 px-4 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="flex h-8 items-center gap-2 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

        </div>

      </div>
    </div>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[11px] font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}
export const dynamic = 'force-dynamic';
