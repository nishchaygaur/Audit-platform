"use client";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getEvidences,
  createEvidence,
  updateEvidence,
  deleteEvidence as deleteEvidenceAction,
  type EvidenceRecord,
} from "@/actions/evidence";
import { getAudits } from "@/actions/audits";
import type { ReactNode } from "react";
import { useMemo, useState, useEffect, useCallback } from "react";

import {
  Upload,
  Search,
  FileText,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronDown,
  Download,
  Link2,
} from "lucide-react";

type EvidenceStatus =
  | "Requested"
  | "Submitted"
  | "Under Review"
  | "Accepted"
  | "Rejected";

type Evidence = {
  id: string;
  evidenceId: string;
  auditId: string;
  audit?: string;
  name: string;
  type: string;
  size: string;
  control: string;
  framework: string;
  owner: string;
  status: EvidenceStatus;
  uploaded: string;
  reviewedBy: string;
  description?: string;
};

const STATUS_OPTIONS: EvidenceStatus[] = [
  "Requested",
  "Submitted",
  "Under Review",
  "Accepted",
  "Rejected",
];

const FRAMEWORK_OPTIONS = [
  "All Frameworks",
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "SOC 2",
  "CIS Controls",
];

export default function EvidencePage() {
  const { currentWorkspace } = useWorkspace();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [audits, setAudits] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [formAuditId, setFormAuditId] = useState("");

  const loadData = useCallback(async (workspaceId: string) => {
    if (!workspaceId) {
      setEvidence([]);
      setAudits([]);
      setLoading(false);
      return;
    }

    try {
      const [evidenceRes, auditsRes] = await Promise.all([
        getEvidences(workspaceId),
        getAudits(workspaceId),
      ]);

      if (evidenceRes.success && evidenceRes.data) {
        setEvidence(
          (evidenceRes.data as EvidenceRecord[]).map((e) => ({
            id: e.id,
            evidenceId: e.reference || e.id,
            auditId: e.audit_id,
            audit: e.audit_name || e.audit_id,
            name: e.name,
            type: e.type,
            size: e.size || "1.2 MB",
            control: e.control,
            framework: e.framework || "ISO 27001",
            owner: e.uploaded_by || "Auditor",
            status: (e.status as EvidenceStatus) || "Requested",
            uploaded: e.date || "Today",
            reviewedBy: e.reviewed_by || "—",
            description: e.description || "",
          }))
        );
      } else {
        setEvidence([]);
      }

      if (auditsRes.success && auditsRes.data) {
        const auditList = (auditsRes.data as Array<{ id: string; name: string }>).map((a) => ({
          id: a.id,
          name: a.name,
        }));
        setAudits(auditList);
        if (auditList.length > 0) {
          setFormAuditId((prev) => prev || auditList[0].id);
        }
      } else {
        setAudits([]);
      }
    } catch {
      setEvidence([]);
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void loadData(currentWorkspace?.id);
  }, [currentWorkspace?.id, loadData]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [frameworkFilter, setFrameworkFilter] = useState("All Frameworks");

  const [statusOpen, setStatusOpen] = useState(false);
  const [frameworkOpen, setFrameworkOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("PDF");
  const [formSize, setFormSize] = useState("");
  const [formControl, setFormControl] = useState("");
  const [formFramework, setFormFramework] = useState("ISO 27001");
  const [formOwner, setFormOwner] = useState("Alice Smith");
  const [formStatus, setFormStatus] = useState<EvidenceStatus>("Requested");

  const filteredEvidence = useMemo(() => {
    const query = search.toLowerCase().trim();

    return evidence.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.evidenceId.toLowerCase().includes(query) ||
        item.control.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Status" || item.status === statusFilter;

      const matchesFramework =
        frameworkFilter === "All Frameworks" ||
        item.framework === frameworkFilter;

      return matchesSearch && matchesStatus && matchesFramework;
    });
  }, [evidence, search, statusFilter, frameworkFilter]);

  const totalEvidence = evidence.length;

  const acceptedEvidence = evidence.filter(
    (item) => item.status === "Accepted"
  ).length;

  const underReviewEvidence = evidence.filter(
    (item) => item.status === "Under Review" || item.status === "Submitted"
  ).length;

  const rejectedEvidence = evidence.filter(
    (item) => item.status === "Rejected"
  ).length;

  function openAddEvidence() {
    setEditingEvidence(null);

    setFormName("");
    setFormType("PDF");
    setFormSize("1.2 MB");
    setFormControl("A.5.1");
    setFormFramework("ISO 27001");
    setFormOwner("Alice Smith");
    setFormStatus("Requested");
    if (audits.length > 0) {
      setFormAuditId(audits[0].id);
    }

    setShowModal(true);
  }

  function openEditEvidence(item: Evidence) {
    setEditingEvidence(item);

    setFormName(item.name);
    setFormType(item.type);
    setFormSize(item.size);
    setFormControl(item.control);
    setFormFramework(item.framework);
    setFormOwner(item.owner);
    setFormStatus(item.status);
    setFormAuditId(item.auditId);

    setOpenMenu(null);
    setShowModal(true);
  }

  async function saveEvidence() {
    if (
      !currentWorkspace?.id ||
      !formName.trim() ||
      !formControl.trim()
    ) {
      return;
    }

    if (editingEvidence) {
      const auditId = formAuditId || editingEvidence.auditId;
      const res = await updateEvidence(currentWorkspace.id, auditId, editingEvidence.id, {
        name: formName.trim(),
        type: formType,
        size: formSize.trim() || "1.2 MB",
        control: formControl.trim(),
        framework: formFramework,
        uploadedBy: formOwner,
        status: formStatus,
      });

      if (res.success) {
        await loadData(currentWorkspace.id);
      }
    } else {
      if (!formAuditId) {
        return;
      }

      const res = await createEvidence(currentWorkspace.id, formAuditId, {
        name: formName.trim(),
        type: formType,
        size: formSize.trim() || "1.2 MB",
        control: formControl.trim(),
        framework: formFramework,
        uploadedBy: formOwner,
        status: formStatus,
      });

      if (res.success) {
        await loadData(currentWorkspace.id);
      }
    }

    setShowModal(false);
  }

  async function deleteEvidence(item: Evidence) {
    if (!currentWorkspace?.id) return;

    const res = await deleteEvidenceAction(currentWorkspace.id, item.auditId, item.id);
    if (res.success) {
      setEvidence((current) =>
        current.filter((entry) => entry.id !== item.id)
      );

      if (selectedEvidence?.id === item.id) {
        setSelectedEvidence(null);
      }
    }

    setOpenMenu(null);
  }

  async function changeStatus(
    item: Evidence,
    status: EvidenceStatus
  ) {
    if (!currentWorkspace?.id) return;

    const res = await updateEvidence(currentWorkspace.id, item.auditId, item.id, {
      status,
    });

    if (res.success) {
      setEvidence((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status,
                reviewedBy:
                  status === "Accepted" || status === "Rejected"
                    ? "John Carter"
                    : entry.reviewedBy,
              }
            : entry
        )
      );
    }

    setOpenMenu(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      {/* 
        IMPORTANT:
        The sidebar is fixed outside this page.
        ml-64 reserves 16rem for the sidebar so
        Evidence content does not render underneath it.
      */}
      <main className="ml-64 min-h-screen">
        <section className="px-8 py-7">
          {/* HEADER */}

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText
                  className="h-5 w-5 text-blue-600"
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h1 className="text-[23px] font-semibold">
                  Evidence
                </h1>

                <p className="mt-1 text-[11px] text-slate-500">
                  Collect, review and manage audit evidence
                  mapped to controls and frameworks.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddEvidence}
              className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              Add Evidence
            </button>
          </div>

          {/* SUMMARY */}

          <div className="mb-5 grid grid-cols-4 gap-4">
            <SummaryCard
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Total Evidence"
              value={String(totalEvidence)}
            />

            <SummaryCard
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
              label="Accepted"
              value={String(acceptedEvidence)}
              valueClass="text-emerald-600"
            />

            <SummaryCard
              icon={
                <Clock3 className="h-4 w-4" />
              }
              label="Under Review"
              value={String(underReviewEvidence)}
              valueClass="text-blue-600"
            />

            <SummaryCard
              icon={
                <XCircle className="h-4 w-4" />
              }
              label="Rejected"
              value={String(rejectedEvidence)}
              valueClass="text-red-500"
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
                  placeholder="Search evidence..."
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
                  }}
                  options={FRAMEWORK_OPTIONS}
                  onSelect={(value) => {
                    setFrameworkFilter(value);
                    setFrameworkOpen(false);
                  }}
                />

                <FilterDropdown
                  label={statusFilter}
                  open={statusOpen}
                  setOpen={() => {
                    setStatusOpen(!statusOpen);
                    setFrameworkOpen(false);
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
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                    <TableHeader>
                      Evidence
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
                      Uploaded
                    </TableHeader>

                    <th className="w-16 px-3 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-[12px] text-slate-500">
                        Loading workspace evidence...
                      </td>
                    </tr>
                  ) : filteredEvidence.length > 0 ? (
                    filteredEvidence.map((item) => (
                      <EvidenceRow
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
                          setSelectedEvidence(item);
                          setOpenMenu(null);
                        }}
                        onEdit={() =>
                          openEditEvidence(item)
                        }
                        onAccept={() =>
                          changeStatus(
                            item,
                            "Accepted"
                          )
                        }
                        onReject={() =>
                          changeStatus(
                            item,
                            "Rejected"
                          )
                        }
                        onDelete={() =>
                          deleteEvidence(item)
                        }
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center"
                      >
                        <Search className="mx-auto h-6 w-6 text-slate-300" />

                        <p className="mt-2 text-[12px] font-medium text-slate-600">
                          No evidence found
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
                Showing {filteredEvidence.length} of{" "}
                {evidence.length} evidence items
              </span>

              <span className="text-[10px] text-slate-400">
                {acceptedEvidence} accepted
              </span>
            </div>
          </div>

          {/* TRACEABILITY */}

          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4">
              <h2 className="text-[14px] font-semibold text-slate-800">
                Evidence Traceability
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                Evidence is mapped directly to framework
                controls for audit traceability.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <TraceCard
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
                title="Control Mapping"
                text="Every evidence item is linked to an applicable control."
              />

              <TraceCard
                icon={
                  <Link2 className="h-4 w-4" />
                }
                title="Audit Traceability"
                text="Evidence can be referenced from audit activities and findings."
              />

              <TraceCard
                icon={
                  <CheckCircle2 className="h-4 w-4" />
                }
                title="Review Workflow"
                text="Track evidence from submission through acceptance or rejection."
              />
            </div>
          </div>
        </section>
      </main>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <EvidenceModal
          editing={Boolean(editingEvidence)}
          audits={audits}
          auditId={formAuditId}
          setAuditId={setFormAuditId}
          name={formName}
          type={formType}
          size={formSize}
          control={formControl}
          framework={formFramework}
          owner={formOwner}
          status={formStatus}
          setName={setFormName}
          setType={setFormType}
          setSize={setFormSize}
          setControl={setFormControl}
          setFramework={setFormFramework}
          setOwner={setFormOwner}
          setStatus={setFormStatus}
          onClose={() => setShowModal(false)}
          onSave={saveEvidence}
        />
      )}

      {/* DETAILS */}

      {selectedEvidence && (
        <EvidenceDetails
          item={selectedEvidence}
          onClose={() =>
            setSelectedEvidence(null)
          }
          onEdit={() => {
            setSelectedEvidence(null);
            openEditEvidence(selectedEvidence);
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
   EVIDENCE ROW
============================================================ */

function EvidenceRow({
  item,
  menuOpen,
  onMenu,
  onView,
  onEdit,
  onAccept,
  onReject,
  onDelete,
}: {
  item: Evidence;
  menuOpen: boolean;
  onMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onAccept: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const statusClass =
    item.status === "Accepted"
      ? "bg-emerald-50 text-emerald-700"
      : item.status === "Under Review"
        ? "bg-blue-50 text-blue-700"
        : item.status === "Submitted"
          ? "bg-indigo-50 text-indigo-700"
          : item.status === "Requested"
            ? "bg-amber-50 text-amber-700"
            : "bg-red-50 text-red-700";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <FileText className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-medium text-slate-800 hover:text-blue-600">
              {item.name}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              {item.evidenceId} · {item.type} ·{" "}
              {item.size}
            </p>
          </div>
        </button>
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
          {item.uploaded}
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
          <div className="absolute right-3 top-12 z-50 w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
            <button
              type="button"
              onClick={onView}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5" />
              View Evidence
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Evidence
            </button>

            {item.status !== "Accepted" && (
              <button
                type="button"
                onClick={onAccept}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accept Evidence
              </button>
            )}

            {item.status !== "Rejected" && (
              <button
                type="button"
                onClick={onReject}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject Evidence
              </button>
            )}

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Evidence
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
   EVIDENCE MODAL
============================================================ */

function EvidenceModal({
  editing,
  audits,
  auditId,
  setAuditId,
  name,
  type,
  size,
  control,
  framework,
  owner,
  status,
  setName,
  setType,
  setSize,
  setControl,
  setFramework,
  setOwner,
  setStatus,
  onClose,
  onSave,
}: {
  editing: boolean;
  audits: { id: string; name: string }[];
  auditId: string;
  setAuditId: (value: string) => void;
  name: string;
  type: string;
  size: string;
  control: string;
  framework: string;
  owner: string;
  status: EvidenceStatus;
  setName: (value: string) => void;
  setType: (value: string) => void;
  setSize: (value: string) => void;
  setControl: (value: string) => void;
  setFramework: (value: string) => void;
  setOwner: (value: string) => void;
  setStatus: (value: EvidenceStatus) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-[560px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">
              {editing
                ? "Edit Evidence"
                : "Add Evidence"}
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              {editing
                ? "Update evidence metadata and review status."
                : "Register evidence and map it to an audit control."}
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
          {audits && audits.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
                Target Audit
              </label>
              <select
                value={auditId}
                disabled={editing}
                onChange={(e) => setAuditId(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <FormField
            label="Evidence Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Information Security Policy.pdf"
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="File Type"
              value={type}
              options={[
                "PDF",
                "DOCX",
                "XLSX",
                "CSV",
                "PNG",
                "JPG",
              ]}
              onChange={setType}
            />

            <FormField
              label="File Size"
              value={size}
              onChange={setSize}
              placeholder="e.g. 2.4 MB"
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
              placeholder="e.g. A.5.1"
            />
          </div>

          <SelectField
            label="Evidence Owner"
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

          <SelectField
            label="Review Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              setStatus(value as EvidenceStatus)
            }
          />

          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

              <div>
                <p className="text-[10px] font-medium text-blue-800">
                  Control Traceability
                </p>

                <p className="mt-1 text-[9px] leading-4 text-blue-600">
                  This evidence will be associated with{" "}
                  {control || "the selected control"} under{" "}
                  {framework}.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
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
              !name.trim() ||
              !size.trim() ||
              !control.trim()
            }
            className="h-8 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing
              ? "Save Changes"
              : "Add Evidence"}
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
   EVIDENCE DETAILS
============================================================ */

function EvidenceDetails({
  item,
  onClose,
  onEdit,
}: {
  item: Evidence;
  onClose: () => void;
  onEdit: () => void;
}) {
  const statusClass =
    item.status === "Accepted"
      ? "bg-emerald-50 text-emerald-700"
      : item.status === "Rejected"
        ? "bg-red-50 text-red-700"
        : item.status === "Under Review"
          ? "bg-blue-50 text-blue-700"
          : item.status === "Submitted"
            ? "bg-indigo-50 text-indigo-700"
            : "bg-amber-50 text-amber-700";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-[600px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-[14px] font-semibold text-slate-800">
                Evidence Details
              </h2>

              <p className="mt-1 text-[9px] text-slate-400">
                {item.evidenceId}
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
            <p className="text-[13px] font-semibold text-slate-800">
              {item.name}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {item.type} · {item.size}
            </p>
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
              label="Uploaded"
              value={item.uploaded}
            />

            <DetailItem
              label="Reviewed By"
              value={item.reviewedBy}
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
                  This evidence supports control{" "}
                  <strong>{item.control}</strong> in the{" "}
                  {item.framework} framework.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            className="flex h-8 items-center gap-2 rounded-md border border-slate-200 px-3 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>

          <div className="flex gap-2">
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
