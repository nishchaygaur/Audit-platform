"use client";
import { useParams } from "next/navigation";
import {
  getEvidences,
  createEvidence,
  updateEvidence,
  deleteEvidence as deleteEvidenceAction,
  type EvidenceRecord,
} from "@/actions/evidence";
import type { ReactNode } from "react";
import { useMemo, useState, useEffect, useCallback } from "react";

import {
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Upload,
  Download,
  Eye,
  ShieldCheck,
  Link2,
  CalendarDays,
  UserRound,
  FolderOpen,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";

type EvidenceStatus =
  | "Requested"
  | "Submitted"
  | "Under Review"
  | "Accepted"
  | "Rejected";

type EvidenceType =
  | "Document"
  | "Screenshot"
  | "Report"
  | "Policy"
  | "Configuration"
  | "Log"
  | "Other";

type Evidence = {
  id: string;
  reference: string;
  name: string;
  description: string;
  type: EvidenceType;
  framework: string;
  control: string;
  audit: string;
  owner: string;
  collectedDate: string;
  reviewDate: string;
  status: EvidenceStatus;
  fileName: string;
  size: string;
};

const EVIDENCE_TYPES: EvidenceType[] = [
  "Document",
  "Screenshot",
  "Report",
  "Policy",
  "Configuration",
  "Log",
  "Other",
];

const STATUS_OPTIONS: EvidenceStatus[] = [
  "Requested",
  "Submitted",
  "Under Review",
  "Accepted",
  "Rejected",
];

const FRAMEWORKS = [
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "NIST 800-53",
  "SOC 2",
  "CIS Controls",
];

export default function EvidencePage() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace.id;
  const params = useParams();
  const auditId = (params?.id as string) || "";

  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (wsId: string, aId: string) => {
    if (!wsId || !aId) {
      setEvidence([]);
      setLoading(false);
      return;
    }

    try {
      const res = await getEvidences(wsId, aId);
      if (res.success && res.data) {
        setEvidence(
          (res.data as EvidenceRecord[]).map((e) => ({
            id: e.id,
            reference: e.reference || e.id,
            name: e.name,
            description: e.description || "",
            type: (e.type as EvidenceType) || "Document",
            framework: e.framework || "ISO 27001",
            control: e.control || "A.5.1",
            audit: e.audit_name || aId,
            owner: e.uploaded_by || "Unassigned",
            collectedDate: e.date || "Today",
            reviewDate: "Scheduled",
            status: (e.status as EvidenceStatus) || "Requested",
            fileName: e.name,
            size: e.size || "1.2 MB",
          }))
        );
      } else {
        setEvidence([]);
      }
    } catch {
      setEvidence([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workspaceId && auditId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadData(workspaceId, auditId);
    } else {
      setEvidence([]);
      setLoading(false);
    }
  }, [workspaceId, auditId, loadData]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    EvidenceStatus | "All Statuses"
  >("All Statuses");

  const [typeFilter, setTypeFilter] = useState<
    EvidenceType | "All Types"
  >("All Types");

  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState<Evidence | null>(
    null
  );

  const [editingEvidence, setEditingEvidence] =
    useState<Evidence | null>(null);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] =
    useState<EvidenceType>("Document");
  const [formFramework, setFormFramework] =
    useState("ISO 27001");
  const [formControl, setFormControl] = useState("");
  const [formAudit, setFormAudit] = useState("");
  const [formOwner, setFormOwner] = useState("Alice Smith");
  const [formCollectedDate, setFormCollectedDate] = useState("");
  const [formReviewDate, setFormReviewDate] = useState("");
  const [formFileName, setFormFileName] = useState("");
  const [formSize, setFormSize] = useState("");

  const filteredEvidence = useMemo(() => {
    const query = search.toLowerCase().trim();

    return evidence.filter((item) => {
      const matchesSearch =
        !query ||
        item.reference.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.framework.toLowerCase().includes(query) ||
        item.control.toLowerCase().includes(query) ||
        item.audit.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        item.status === statusFilter;

      const matchesType =
        typeFilter === "All Types" ||
        item.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [evidence, search, statusFilter, typeFilter]);

  const acceptedCount = evidence.filter(
    (item) => item.status === "Accepted"
  ).length;

  const underReviewCount = evidence.filter(
    (item) => item.status === "Under Review" || item.status === "Submitted"
  ).length;

  const attentionCount = evidence.filter(
    (item) => item.status === "Rejected" || item.status === "Requested"
  ).length;

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormType("Document");
    setFormFramework("ISO 27001");
    setFormControl("");
    setFormAudit("");
    setFormOwner("Alice Smith");
    setFormCollectedDate("");
    setFormReviewDate("");
    setFormFileName("");
    setFormSize("");
  }

  function openCreateModal() {
    setEditingEvidence(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(item: Evidence) {
    setEditingEvidence(item);

    setFormName(item.name);
    setFormDescription(item.description);
    setFormType(item.type);
    setFormFramework(item.framework);
    setFormControl(item.control);
    setFormAudit(item.audit);
    setFormOwner(item.owner);
    setFormCollectedDate(item.collectedDate);
    setFormReviewDate(item.reviewDate);
    setFormFileName(item.fileName);
    setFormSize(item.size);

    setOpenMenu(null);
    setShowModal(true);
  }

  async function saveEvidence() {
    if (!workspaceId || !auditId || !formName.trim()) {
      return;
    }

    if (editingEvidence) {
      const res = await updateEvidence(
        workspaceId,
        auditId,
        editingEvidence.id,
        {
          name: formName.trim(),
          description: formDescription.trim(),
          type: formType,
          framework: formFramework,
          control: formControl.trim() || "A.5.1",
          uploadedBy: formOwner.trim() || "Unassigned",
          size: formSize.trim() || "1.2 MB",
        }
      );

      if (res.success) {
        await loadData(workspaceId, auditId);
      }
    } else {
      const res = await createEvidence(workspaceId, auditId, {
        name: formName.trim(),
        description: formDescription.trim(),
        type: formType,
        framework: formFramework,
        control: formControl.trim() || "A.5.1",
        uploadedBy: formOwner.trim() || "Unassigned",
        status: "Requested",
        size: formSize.trim() || "1.2 MB",
      });

      if (res.success) {
        await loadData(workspaceId, auditId);
      }
    }

    setShowModal(false);
    setEditingEvidence(null);
    resetForm();
  }

  async function deleteEvidence(item: Evidence) {
    if (!workspaceId || !auditId) return;

    const confirmed = window.confirm(
      `Remove "${item.name}" from this audit?`
    );

    if (!confirmed) {
      return;
    }

    const res = await deleteEvidenceAction(workspaceId, auditId, item.id);
    if (res.success) {
      setEvidence((current) =>
        current.filter((evidenceItem) => evidenceItem.id !== item.id)
      );
    }

    setOpenMenu(null);
  }

  async function updateStatus(
    item: Evidence,
    status: EvidenceStatus
  ) {
    if (!workspaceId || !auditId) return;

    const res = await updateEvidence(workspaceId, auditId, item.id, {
      status,
    });

    if (res.success) {
      setEvidence((current) =>
        current.map((evidenceItem) =>
          evidenceItem.id === item.id
            ? {
                ...evidenceItem,
                status,
              }
            : evidenceItem
        )
      );
    }

    setOpenMenu(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] min-h-screen">
        <Header />

        <section className="px-8 py-7">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h1 className="text-[28px] font-semibold tracking-[-0.5px]">
                    Evidence
                  </h1>

                  <p className="mt-1 text-[14px] text-slate-500">
                    Collect, manage and review audit evidence for{" "}
                    {currentWorkspace.name}.
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
              Add Evidence
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-4 gap-5">
            <SummaryCard
              title="Total Evidence"
              value={String(evidence.length)}
              icon={
                <FileText className="h-5 w-5" />
              }
            />

            <SummaryCard
              title="Under Review"
              value={String(underReviewCount)}
              icon={
                <Clock3 className="h-5 w-5" />
              }
            />

            <SummaryCard
              title="Accepted"
              value={String(acceptedCount)}
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
            />

            <SummaryCard
              title="Requires Attention"
              value={String(attentionCount)}
              icon={
                <AlertTriangle className="h-5 w-5" />
              }
            />
          </div>

          {/* Main panel */}
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
                    placeholder="Search evidence..."
                    className="h-9 w-[300px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>

                {/* Type filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setTypeOpen((open) => !open)
                    }
                    className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    {typeFilter}

                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        typeOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {typeOpen && (
                    <div className="absolute left-0 top-10 z-50 w-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
                      {[
                        "All Types",
                        ...EVIDENCE_TYPES,
                      ].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setTypeFilter(
                              type as
                                | EvidenceType
                                | "All Types"
                            );
                            setTypeOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] hover:bg-slate-50 ${
                            typeFilter === type
                              ? "font-medium text-blue-600"
                              : "text-slate-600"
                          }`}
                        >
                          {type}

                          {typeFilter === type && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status filter */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setStatusOpen((open) => !open)
                  }
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50"
                >
                  {statusFilter}

                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      statusOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {statusOpen && (
                  <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
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
                              | EvidenceStatus
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

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                    <TableHeader>
                      Evidence
                    </TableHeader>

                    <TableHeader>
                      Type
                    </TableHeader>

                    <TableHeader>
                      Framework / Control
                    </TableHeader>

                    <TableHeader>
                      Audit
                    </TableHeader>

                    <TableHeader>
                      Owner
                    </TableHeader>

                    <TableHeader>
                      Collected
                    </TableHeader>

                    <TableHeader>
                      Review
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-5 py-14 text-center text-[12px] text-slate-500"
                      >
                        Loading evidence...
                      </td>
                    </tr>
                  ) : filteredEvidence.length > 0 ? (
                    filteredEvidence.map((item) => (
                      <EvidenceRow
                        key={item.id}
                        evidence={item}
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
                          setShowDetails(item);
                          setOpenMenu(null);
                        }}
                        onEdit={() =>
                          openEditModal(item)
                        }
                        onApprove={() =>
                          updateStatus(
                            item,
                            "Accepted"
                          )
                        }
                        onReject={() =>
                          updateStatus(
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
                        colSpan={9}
                        className="px-5 py-14 text-center"
                      >
                        <FileText className="mx-auto h-7 w-7 text-slate-300" />

                        <p className="mt-2 text-[12px] font-medium text-slate-600">
                          No evidence found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Try changing your search
                          or filter.
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
                Showing {filteredEvidence.length} of{" "}
                {evidence.length} evidence items
              </span>

              <span className="text-[10px] text-slate-400">
                {underReviewCount} under review
              </span>
            </div>
          </div>

          {/* Evidence information */}
          <div className="mt-6 grid grid-cols-3 gap-5">
            <InfoCard
              icon={
                <ShieldCheck className="h-4 w-4" />
              }
              title="Framework Coverage"
              value={`${new Set(
                evidence.map(
                  (item) => item.framework
                )
              ).size} frameworks`}
              description="Frameworks currently represented by evidence in this workspace."
            />

            <InfoCard
              icon={
                <Link2 className="h-4 w-4" />
              }
              title="Control Mapping"
              value={`${new Set(
                evidence.map(
                  (item) => item.control
                )
              ).size} controls`}
              description="Unique controls currently supported by collected evidence."
            />

            <InfoCard
              icon={
                <UserRound className="h-4 w-4" />
              }
              title="Evidence Owners"
              value={`${new Set(
                evidence.map(
                  (item) => item.owner
                )
              ).size} owners`}
              description="Users currently responsible for submitted evidence."
            />
          </div>
        </section>
      </main>

      {/* Add / Edit modal */}
      {showModal && (
        <EvidenceModal
          editing={Boolean(editingEvidence)}
          name={formName}
          description={formDescription}
          type={formType}
          framework={formFramework}
          control={formControl}
          audit={formAudit}
          owner={formOwner}
          collectedDate={formCollectedDate}
          reviewDate={formReviewDate}
          fileName={formFileName}
          size={formSize}
          setName={setFormName}
          setDescription={setFormDescription}
          setType={setFormType}
          setFramework={setFormFramework}
          setControl={setFormControl}
          setAudit={setFormAudit}
          setOwner={setFormOwner}
          setCollectedDate={setFormCollectedDate}
          setReviewDate={setFormReviewDate}
          setFileName={setFormFileName}
          setSize={setFormSize}
          onClose={() => {
            setShowModal(false);
            setEditingEvidence(null);
          }}
          onSave={saveEvidence}
        />
      )}

      {/* Details modal */}
      {showDetails && (
        <EvidenceDetailsModal
          evidence={showDetails}
          onClose={() => setShowDetails(null)}
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

function EvidenceRow({
  evidence,
  menuOpen,
  onMenu,
  onView,
  onEdit,
  onApprove,
  onReject,
  onDelete,
}: {
  evidence: Evidence;
  menuOpen: boolean;
  onMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const statusClass =
    evidence.status === "Accepted"
      ? "bg-emerald-50 text-emerald-700"
      : evidence.status === "Under Review"
        ? "bg-amber-50 text-amber-700"
        : evidence.status === "Rejected"
          ? "bg-red-50 text-red-700"
          : evidence.status === "Submitted"
            ? "bg-orange-50 text-orange-700"
            : "bg-slate-100 text-slate-500";

  const typeClass =
    evidence.type === "Policy"
      ? "bg-violet-50 text-violet-700"
      : evidence.type === "Screenshot"
        ? "bg-cyan-50 text-cyan-700"
        : evidence.type === "Report"
          ? "bg-blue-50 text-blue-700"
          : "bg-slate-100 text-slate-600";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <FileText className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-medium text-blue-600">
                {evidence.reference}
              </span>
            </div>

            <p className="mt-0.5 max-w-[250px] truncate text-[12px] font-medium text-slate-800">
              {evidence.name}
            </p>

            <p className="mt-1 max-w-[280px] truncate text-[10px] text-slate-400">
              {evidence.description ||
                "No description provided"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded px-2 py-1 text-[9px] font-medium ${typeClass}`}
        >
          {evidence.type}
        </span>
      </td>

      <td className="px-3 py-4">
        <div>
          <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
            {evidence.framework}
          </span>

          <p className="mt-1.5 text-[10px] font-medium text-slate-600">
            {evidence.control}
          </p>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex max-w-[180px] items-start gap-1.5">
          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <span className="truncate text-[10px] text-slate-500">
            {evidence.audit}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-[9px] font-semibold text-violet-700">
            {getInitials(evidence.owner)}
          </div>

          <span className="text-[10px] text-slate-600">
            {evidence.owner}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

          <span>
            {evidence.collectedDate}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <span className="text-[10px] text-slate-500">
          {evidence.reviewDate}
        </span>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${statusClass}`}
        >
          {evidence.status}
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
          <div className="absolute right-3 top-11 z-50 w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
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

            {evidence.status !== "Accepted" && (
              <button
                type="button"
                onClick={onApprove}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accept
              </button>
            )}

            {evidence.status !== "Rejected" && (
              <button
                type="button"
                onClick={onReject}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Reject
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

function EvidenceModal({
  editing,
  name,
  description,
  type,
  framework,
  control,
  audit,
  owner,
  collectedDate,
  reviewDate,
  fileName,
  size,
  setName,
  setDescription,
  setType,
  setFramework,
  setControl,
  setAudit,
  setOwner,
  setCollectedDate,
  setReviewDate,
  setFileName,
  setSize,
  onClose,
  onSave,
}: {
  editing: boolean;
  name: string;
  description: string;
  type: EvidenceType;
  framework: string;
  control: string;
  audit: string;
  owner: string;
  collectedDate: string;
  reviewDate: string;
  fileName: string;
  size: string;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setType: (value: EvidenceType) => void;
  setFramework: (value: string) => void;
  setControl: (value: string) => void;
  setAudit: (value: string) => void;
  setOwner: (value: string) => void;
  setCollectedDate: (value: string) => void;
  setReviewDate: (value: string) => void;
  setFileName: (value: string) => void;
  setSize: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-[700px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">
              {editing
                ? "Edit Evidence"
                : "Add Evidence"}
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              {editing
                ? "Update evidence metadata and audit mapping."
                : "Register evidence collected during audit activities."}
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

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <FormField
            label="Evidence Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Information Security Policy"
          />

          <div>
            <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-wide text-slate-400">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Describe what this evidence demonstrates..."
              rows={3}
              className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Evidence Type"
              value={type}
              options={EVIDENCE_TYPES}
              onChange={(value) =>
                setType(value as EvidenceType)
              }
            />

            <SelectField
              label="Framework"
              value={framework}
              options={FRAMEWORKS}
              onChange={setFramework}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Control / Requirement"
              value={control}
              onChange={setControl}
              placeholder="e.g. A.5.1"
            />

            <FormField
              label="Related Audit"
              value={audit}
              onChange={setAudit}
              placeholder="e.g. 2024 Information Security Audit Plan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Evidence Owner"
              value={owner}
              onChange={setOwner}
              placeholder="e.g. Alice Smith"
            />

            <FormField
              label="File Name"
              value={fileName}
              onChange={setFileName}
              placeholder="e.g. security-policy.pdf"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Collected Date"
              value={collectedDate}
              onChange={setCollectedDate}
              placeholder="e.g. 05 May 2024"
            />

            <FormField
              label="Review / Expiry Date"
              value={reviewDate}
              onChange={setReviewDate}
              placeholder="e.g. 05 May 2025"
            />
          </div>

          <FormField
            label="File Size"
            value={size}
            onChange={setSize}
            placeholder="e.g. 1.8 MB"
          />

          {!editing && (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Upload className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-700">
                    Evidence file
                  </p>

                  <p className="mt-0.5 text-[9px] text-slate-400">
                    File upload can be connected to your storage layer later.
                  </p>
                </div>
              </div>
            </div>
          )}
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
            disabled={!name.trim()}
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

function EvidenceDetailsModal({
  evidence,
  onClose,
}: {
  evidence: Evidence;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-[620px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold text-blue-600">
                {evidence.reference}
              </span>

              <StatusBadge
                status={evidence.status}
              />
            </div>

            <h2 className="mt-1 text-[15px] font-semibold text-slate-800">
              {evidence.name}
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              Evidence details and audit mapping
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

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
              Description
            </p>

            <p className="mt-2 text-[11px] leading-5 text-slate-600">
              {evidence.description ||
                "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailItem
              label="Evidence Type"
              value={evidence.type}
            />

            <DetailItem
              label="Framework"
              value={evidence.framework}
            />

            <DetailItem
              label="Control"
              value={evidence.control}
            />

            <DetailItem
              label="Related Audit"
              value={evidence.audit}
            />

            <DetailItem
              label="Owner"
              value={evidence.owner}
            />

            <DetailItem
              label="Collected"
              value={evidence.collectedDate}
            />

            <DetailItem
              label="Review / Expiry"
              value={evidence.reviewDate}
            />

            <DetailItem
              label="File"
              value={evidence.fileName}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-medium text-slate-700">
                  {evidence.fileName}
                </p>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  {evidence.size}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="flex h-8 items-center gap-2 rounded-md border border-slate-200 px-3 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: EvidenceStatus;
}) {
  const statusClass =
    status === "Accepted"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Under Review"
        ? "bg-amber-50 text-amber-700"
        : status === "Rejected"
          ? "bg-red-50 text-red-700"
          : status === "Submitted"
            ? "bg-orange-50 text-orange-700"
            : "bg-slate-100 text-slate-500";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${statusClass}`}
    >
      {status}
    </span>
  );
}

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

      <p className="mt-1.5 text-[11px] font-medium text-slate-700">
        {value}
      </p>
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
          <option
            key={option}
            value={option}
          >
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
