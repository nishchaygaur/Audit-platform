"use client";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Plus,
  Search,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  UsersRound,
  ShieldCheck,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";

type PlanStatus = "Draft" | "Active" | "Completed" | "Archived";

type AuditPlan = {
  id: number;
  name: string;
  description: string;
  framework: string;
  owner: string;
  startDate: string;
  endDate: string;
  audits: number;
  completed: number;
  status: PlanStatus;
};

const FRAMEWORKS = [
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "NIST 800-53",
  "SOC 2",
  "CIS Controls",
];

const STATUS_OPTIONS: PlanStatus[] = [
  "Draft",
  "Active",
  "Completed",
  "Archived",
];

const INITIAL_PLANS: Record<string, AuditPlan[]> = {
  "abc-technologies": [
    {
      id: 1,
      name: "2024 Information Security Audit Plan",
      description:
        "Annual internal audit programme covering information security controls and compliance.",
      framework: "ISO 27001",
      owner: "Alice Smith",
      startDate: "01 May 2024",
      endDate: "30 Jun 2024",
      audits: 8,
      completed: 4,
      status: "Active",
    },
    {
      id: 2,
      name: "NIST CSF Assessment Programme",
      description:
        "Risk-based assessment programme aligned with the NIST Cybersecurity Framework.",
      framework: "NIST CSF",
      owner: "John Carter",
      startDate: "01 Jun 2024",
      endDate: "31 Jul 2024",
      audits: 5,
      completed: 2,
      status: "Active",
    },
    {
      id: 3,
      name: "Third-Party Security Review",
      description:
        "Planned security assessments for critical vendors and service providers.",
      framework: "NIST RMF",
      owner: "Emily Davis",
      startDate: "01 Jul 2024",
      endDate: "31 Aug 2024",
      audits: 6,
      completed: 0,
      status: "Draft",
    },
    {
      id: 4,
      name: "Access Control Review 2024",
      description:
        "Review programme for identity, access control and privileged access management.",
      framework: "NIST 800-53",
      owner: "Michael Lee",
      startDate: "01 Apr 2024",
      endDate: "31 May 2024",
      audits: 4,
      completed: 4,
      status: "Completed",
    },
  ],

  "xyz-finance": [
    {
      id: 11,
      name: "Financial Services Compliance Plan",
      description:
        "Annual compliance audit programme for financial security and regulatory controls.",
      framework: "ISO 27001",
      owner: "Sarah Brown",
      startDate: "01 May 2024",
      endDate: "31 Jul 2024",
      audits: 10,
      completed: 5,
      status: "Active",
    },
    {
      id: 12,
      name: "Cyber Risk Assessment Programme",
      description:
        "Enterprise cyber risk assessments across critical business functions.",
      framework: "NIST CSF",
      owner: "David Wilson",
      startDate: "15 Jun 2024",
      endDate: "31 Aug 2024",
      audits: 7,
      completed: 1,
      status: "Active",
    },
    {
      id: 13,
      name: "Vendor Assurance Programme",
      description:
        "Security review programme covering financial technology vendors.",
      framework: "SOC 2",
      owner: "Sarah Brown",
      startDate: "01 Aug 2024",
      endDate: "30 Sep 2024",
      audits: 5,
      completed: 0,
      status: "Draft",
    },
  ],

  "pqr-healthcare": [
    {
      id: 21,
      name: "Healthcare Security Audit Plan",
      description:
        "Security and compliance audit programme for healthcare information systems.",
      framework: "ISO 27001",
      owner: "Michael Lee",
      startDate: "01 May 2024",
      endDate: "30 Jun 2024",
      audits: 9,
      completed: 3,
      status: "Active",
    },
    {
      id: 22,
      name: "Clinical Systems Risk Review",
      description:
        "Risk-focused assessment programme for clinical and patient-facing systems.",
      framework: "NIST RMF",
      owner: "Emily Davis",
      startDate: "01 Jul 2024",
      endDate: "31 Aug 2024",
      audits: 6,
      completed: 0,
      status: "Draft",
    },
    {
      id: 23,
      name: "Security Controls Validation",
      description:
        "Validation of technical and administrative security safeguards.",
      framework: "NIST 800-53",
      owner: "John Carter",
      startDate: "01 Mar 2024",
      endDate: "30 Apr 2024",
      audits: 4,
      completed: 4,
      status: "Completed",
    },
  ],
};

export default function AuditPlansPage() {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace.id;

  const [plansByWorkspace, setPlansByWorkspace] =
    useState<Record<string, AuditPlan[]>>(INITIAL_PLANS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PlanStatus | "All Statuses">("All Statuses");

  const [statusOpen, setStatusOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] =
    useState<AuditPlan | null>(null);

  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFramework, setFormFramework] =
    useState("ISO 27001");
  const [formOwner, setFormOwner] = useState("Alice Smith");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formAudits, setFormAudits] = useState("5");
  const [formStatus, setFormStatus] =
    useState<PlanStatus>("Draft");

  const plans = plansByWorkspace[workspaceId] ?? [];

  const filteredPlans = useMemo(() => {
    const query = search.toLowerCase().trim();

    return plans.filter((plan) => {
      const matchesSearch =
        !query ||
        plan.name.toLowerCase().includes(query) ||
        plan.framework.toLowerCase().includes(query) ||
        plan.owner.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        plan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const totalAudits = plans.reduce(
    (sum, plan) => sum + plan.audits,
    0
  );

  const completedAudits = plans.reduce(
    (sum, plan) => sum + plan.completed,
    0
  );

  const activePlans = plans.filter(
    (plan) => plan.status === "Active"
  ).length;

  const draftPlans = plans.filter(
    (plan) => plan.status === "Draft"
  ).length;

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormFramework("ISO 27001");
    setFormOwner("Alice Smith");
    setFormStartDate("");
    setFormEndDate("");
    setFormAudits("5");
    setFormStatus("Draft");
  }

  function openCreateModal() {
    setEditingPlan(null);
    resetForm();
    setShowModal(true);
  }

  function openEditModal(plan: AuditPlan) {
    setEditingPlan(plan);

    setFormName(plan.name);
    setFormDescription(plan.description);
    setFormFramework(plan.framework);
    setFormOwner(plan.owner);
    setFormStartDate(plan.startDate);
    setFormEndDate(plan.endDate);
    setFormAudits(String(plan.audits));
    setFormStatus(plan.status);

    setOpenMenu(null);
    setShowModal(true);
  }

  function savePlan() {
    if (!formName.trim()) {
      return;
    }

    const audits = Math.max(
      1,
      Number.parseInt(formAudits, 10) || 1
    );

    if (editingPlan) {
      setPlansByWorkspace((current) => ({
        ...current,
        [workspaceId]: (current[workspaceId] ?? []).map(
          (plan) =>
            plan.id === editingPlan.id
              ? {
                  ...plan,
                  name: formName.trim(),
                  description: formDescription.trim(),
                  framework: formFramework,
                  owner: formOwner.trim() || "Unassigned",
                  startDate:
                    formStartDate || "Not scheduled",
                  endDate:
                    formEndDate || "Not scheduled",
                  audits,
                  status: formStatus,
                  completed: Math.min(
                    plan.completed,
                    audits
                  ),
                }
              : plan
        ),
      }));
    } else {
      const newPlan: AuditPlan = {
        id: Date.now(),
        name: formName.trim(),
        description: formDescription.trim(),
        framework: formFramework,
        owner: formOwner.trim() || "Unassigned",
        startDate: formStartDate || "Not scheduled",
        endDate: formEndDate || "Not scheduled",
        audits,
        completed: 0,
        status: formStatus,
      };

      setPlansByWorkspace((current) => ({
        ...current,
        [workspaceId]: [
          newPlan,
          ...(current[workspaceId] ?? []),
        ],
      }));
    }

    setShowModal(false);
    setEditingPlan(null);
    resetForm();
  }

  function deletePlan(plan: AuditPlan) {
    const confirmed = window.confirm(
      `Remove "${plan.name}" from this workspace?`
    );

    if (!confirmed) {
      return;
    }

    setPlansByWorkspace((current) => ({
      ...current,
      [workspaceId]: (current[workspaceId] ?? []).filter(
        (item) => item.id !== plan.id
      ),
    }));

    setOpenMenu(null);
  }

  function toggleStatus(plan: AuditPlan) {
    const nextStatus: PlanStatus =
      plan.status === "Active" ? "Archived" : "Active";

    setPlansByWorkspace((current) => ({
      ...current,
      [workspaceId]: (current[workspaceId] ?? []).map(
        (item) =>
          item.id === plan.id
            ? { ...item, status: nextStatus }
            : item
      ),
    }));

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
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h1 className="text-[28px] font-semibold tracking-[-0.5px]">
                    Audit Plans
                  </h1>

                  <p className="mt-1 text-[14px] text-slate-500">
                    Plan and coordinate audit activities for{" "}
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
              New Audit Plan
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-4 gap-5">
            <SummaryCard
              title="Total Plans"
              value={String(plans.length)}
              icon={<ClipboardList className="h-5 w-5" />}
            />

            <SummaryCard
              title="Active Plans"
              value={String(activePlans)}
              icon={<Clock3 className="h-5 w-5" />}
            />

            <SummaryCard
              title="Planned Audits"
              value={String(totalAudits)}
              icon={<CalendarDays className="h-5 w-5" />}
            />

            <SummaryCard
              title="Completed Audits"
              value={`${completedAudits}/${totalAudits}`}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </div>

          {/* Main panel */}
          <div className="overflow-visible rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search audit plans..."
                  className="h-9 w-[300px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

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
                      statusOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {statusOpen && (
                  <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
                    {[
                      "All Statuses",
                      ...STATUS_OPTIONS,
                    ].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setStatusFilter(
                            status as PlanStatus | "All Statuses"
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
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                    <TableHeader>Audit Plan</TableHeader>
                    <TableHeader>Framework</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    <TableHeader>Schedule</TableHeader>
                    <TableHeader>Audits</TableHeader>
                    <TableHeader>Progress</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        menuOpen={openMenu === plan.id}
                        onMenu={() =>
                          setOpenMenu(
                            openMenu === plan.id
                              ? null
                              : plan.id
                          )
                        }
                        onEdit={() => openEditModal(plan)}
                        onToggleStatus={() =>
                          toggleStatus(plan)
                        }
                        onDelete={() => deletePlan(plan)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center"
                      >
                        <ClipboardList className="mx-auto h-7 w-7 text-slate-300" />

                        <p className="mt-2 text-[12px] font-medium text-slate-600">
                          No audit plans found
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Try changing your search or status
                          filter.
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
                Showing {filteredPlans.length} of{" "}
                {plans.length} audit plans
              </span>

              <span className="text-[10px] text-slate-400">
                {draftPlans} draft{" "}
                {draftPlans === 1 ? "plan" : "plans"}
              </span>
            </div>
          </div>

          {/* Planning information */}
          <div className="mt-6 grid grid-cols-3 gap-5">
            <InfoCard
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Framework Coverage"
              value={`${new Set(
                plans.map((plan) => plan.framework)
              ).size} frameworks`}
              description="Frameworks currently represented in this workspace's audit programme."
            />

            <InfoCard
              icon={<UsersRound className="h-4 w-4" />}
              title="Plan Owners"
              value={`${new Set(
                plans.map((plan) => plan.owner)
              ).size} owners`}
              description="Users currently responsible for audit planning activities."
            />

            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              title="Workspace"
              value={currentWorkspace.name}
              description="All audit plans shown here belong to the selected workspace."
            />
          </div>
        </section>
      </main>

      {/* Modal */}
      {showModal && (
        <AuditPlanModal
          editing={Boolean(editingPlan)}
          name={formName}
          description={formDescription}
          framework={formFramework}
          owner={formOwner}
          startDate={formStartDate}
          endDate={formEndDate}
          audits={formAudits}
          status={formStatus}
          setName={setFormName}
          setDescription={setFormDescription}
          setFramework={setFormFramework}
          setOwner={setFormOwner}
          setStartDate={setFormStartDate}
          setEndDate={setFormEndDate}
          setAudits={setFormAudits}
          setStatus={setFormStatus}
          onClose={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
          onSave={savePlan}
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

function PlanRow({
  plan,
  menuOpen,
  onMenu,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  plan: AuditPlan;
  menuOpen: boolean;
  onMenu: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const progress =
    plan.audits > 0
      ? Math.round((plan.completed / plan.audits) * 100)
      : 0;

  const statusClass =
    plan.status === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : plan.status === "Completed"
        ? "bg-blue-50 text-blue-700"
        : plan.status === "Draft"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-500";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-4">
        <div>
          <p className="text-[12px] font-medium text-slate-800">
            {plan.name}
          </p>

          <p className="mt-1 max-w-[300px] truncate text-[10px] text-slate-400">
            {plan.description || "No description provided"}
          </p>
        </div>
      </td>

      <td className="px-3 py-4">
        <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
          {plan.framework}
        </span>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-[9px] font-semibold text-violet-700">
            {getInitials(plan.owner)}
          </div>

          <span className="text-[10px] text-slate-600">
            {plan.owner}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

          <span>
            {plan.startDate} – {plan.endDate}
          </span>
        </div>
      </td>

      <td className="px-3 py-4">
        <span className="text-[11px] font-medium text-slate-700">
          {plan.completed}/{plan.audits}
        </span>
      </td>

      <td className="px-3 py-4">
        <div className="w-[110px]">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] text-slate-400">
              Progress
            </span>

            <span className="text-[9px] font-medium text-slate-600">
              {progress}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-medium ${statusClass}`}
        >
          {plan.status}
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
          <div className="absolute right-3 top-11 z-50 w-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Plan
            </button>

            <button
              type="button"
              onClick={onToggleStatus}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
            >
              {plan.status === "Active" ? (
                <>
                  <Clock3 className="h-3.5 w-3.5" />
                  Archive Plan
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Activate Plan
                </>
              )}
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Plan
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function AuditPlanModal({
  editing,
  name,
  description,
  framework,
  owner,
  startDate,
  endDate,
  audits,
  status,
  setName,
  setDescription,
  setFramework,
  setOwner,
  setStartDate,
  setEndDate,
  setAudits,
  setStatus,
  onClose,
  onSave,
}: {
  editing: boolean;
  name: string;
  description: string;
  framework: string;
  owner: string;
  startDate: string;
  endDate: string;
  audits: string;
  status: PlanStatus;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setFramework: (value: string) => void;
  setOwner: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setAudits: (value: string) => void;
  setStatus: (value: PlanStatus) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-[620px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">
              {editing ? "Edit Audit Plan" : "New Audit Plan"}
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              {editing
                ? "Update the audit plan details."
                : "Create a planned programme of audit activities."}
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
            label="Plan Name"
            value={name}
            onChange={setName}
            placeholder="e.g. 2024 Information Security Audit Plan"
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
              placeholder="Describe the purpose and scope of this audit plan..."
              rows={3}
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
              label="Plan Owner"
              value={owner}
              onChange={setOwner}
              placeholder="e.g. Alice Smith"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              placeholder="e.g. 01 May 2024"
            />

            <FormField
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              placeholder="e.g. 30 Jun 2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Planned Audits"
              value={audits}
              onChange={setAudits}
              placeholder="e.g. 5"
              type="number"
            />

            <SelectField
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(value) =>
                setStatus(value as PlanStatus)
              }
            />
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
            disabled={!name.trim()}
            className="h-8 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editing ? "Save Changes" : "Create Audit Plan"}
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
