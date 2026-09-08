"use client";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

type RemediationStatus = "Open" | "In Progress" | "Completed";
type Priority = "High" | "Medium" | "Low";

type RemediationItem = {
  id: string;
  title: string;
  description: string;
  finding: string;
  risk: string;
  priority: Priority;
  owner: string;
  dueDate: string;
  progress: number;
  status: RemediationStatus;
  createdDate: string;
};

const INITIAL_ITEMS: RemediationItem[] = [
  {
    id: "REM-001",
    title: "Implement quarterly privileged access reviews",
    description:
      "Establish a recurring review process for privileged accounts and document approval evidence.",
    finding: "FND-001",
    risk: "RSK-001",
    priority: "High",
    owner: "John Carter",
    dueDate: "30 Jun 2024",
    progress: 45,
    status: "In Progress",
    createdDate: "12 May 2024",
  },
  {
    id: "REM-002",
    title: "Complete access review for critical systems",
    description:
      "Review privileged and business-critical system access and remove unnecessary permissions.",
    finding: "FND-002",
    risk: "RSK-001",
    priority: "High",
    owner: "Emily Davis",
    dueDate: "05 Jul 2024",
    progress: 70,
    status: "In Progress",
    createdDate: "14 May 2024",
  },
  {
    id: "REM-003",
    title: "Establish documented threat intelligence process",
    description:
      "Create a documented process for collecting, reviewing and acting on relevant threat intelligence.",
    finding: "FND-003",
    risk: "RSK-003",
    priority: "Medium",
    owner: "Alice Smith",
    dueDate: "20 Jul 2024",
    progress: 25,
    status: "Open",
    createdDate: "18 May 2024",
  },
  {
    id: "REM-004",
    title: "Complete contractor security awareness training",
    description:
      "Ensure all active contractors complete the required security awareness training.",
    finding: "FND-004",
    risk: "RSK-004",
    priority: "Medium",
    owner: "Michael Lee",
    dueDate: "22 Jul 2024",
    progress: 90,
    status: "In Progress",
    createdDate: "20 May 2024",
  },
  {
    id: "REM-005",
    title: "Update cloud security assessment documentation",
    description:
      "Update the cloud security assessment documentation with current architecture and control evidence.",
    finding: "FND-005",
    risk: "RSK-003",
    priority: "Low",
    owner: "Emily Davis",
    dueDate: "10 Jun 2024",
    progress: 100,
    status: "Completed",
    createdDate: "01 May 2024",
  },
];

const OWNERS = [
  "Alice Smith",
  "John Carter",
  "Emily Davis",
  "Michael Lee",
];

export default function RemediationPage() {
  const params = useParams<{ id: string }>();
  const auditId = params.id;

  const [items, setItems] = useState<RemediationItem[]>(INITIAL_ITEMS);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">(
    "All",
  );
  const [statusFilter, setStatusFilter] = useState<
    RemediationStatus | "All"
  >("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RemediationItem | null>(
    null,
  );

  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    finding: "FND-001",
    risk: "RSK-001",
    priority: "Medium" as Priority,
    owner: OWNERS[0],
    dueDate: "",
  });

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.finding.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query);

      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [items, search, priorityFilter, statusFilter]);

  const total = items.length;
  const open = items.filter((item) => item.status === "Open").length;
  const inProgress = items.filter(
    (item) => item.status === "In Progress",
  ).length;
  const completed = items.filter(
    (item) => item.status === "Completed",
  ).length;

  const overdue = items.filter((item) => {
    if (item.status === "Completed") return false;

    const due = new Date(item.dueDate);
    // eslint-disable-next-line react-hooks/purity
    return due.getTime() < Date.now();
  }).length;

  function addAction() {
    if (!newAction.title.trim()) return;

    const nextNumber = items.length + 1;

    const item: RemediationItem = {
      id: `REM-${String(nextNumber).padStart(3, "0")}`,
      title: newAction.title.trim(),
      description:
        newAction.description.trim() ||
        "Corrective action created for the selected audit finding.",
      finding: newAction.finding,
      risk: newAction.risk,
      priority: newAction.priority,
      owner: newAction.owner,
      dueDate: newAction.dueDate
        ? new Date(`${newAction.dueDate}T00:00:00`).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            },
          )
        : "Not set",
      progress: 0,
      status: "Open",
      createdDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    setItems((current) => [...current, item]);
    setShowAddModal(false);

    setNewAction({
      title: "",
      description: "",
      finding: "FND-001",
      risk: "RSK-001",
      priority: "Medium",
      owner: OWNERS[0],
      dueDate: "",
    });
  }

  function updateStatus(
    id: string,
    status: RemediationStatus,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              progress:
                status === "Completed"
                  ? 100
                  : status === "Open"
                    ? Math.min(item.progress, 25)
                    : Math.max(item.progress, 50),
            }
          : item,
      ),
    );

    setSelectedItem(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] min-h-screen">
        <section className="px-8 py-7">
          <Link
            href={`/audits/${auditId}`}
            className="mb-5 inline-flex items-center gap-2 text-[12px] font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Audit
          </Link>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Wrench
                    className="h-5 w-5 text-blue-600"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h1 className="text-[21px] font-semibold">
                    Remediation
                  </h1>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Corrective actions for findings identified in {auditId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Action
              </button>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-5 border-b border-slate-100">
              <Summary label="Total Actions" value={String(total)} />

              <Summary
                label="Open"
                value={String(open)}
                valueClass="text-orange-600"
              />

              <Summary
                label="In Progress"
                value={String(inProgress)}
                valueClass="text-blue-600"
              />

              <Summary
                label="Overdue"
                value={String(overdue)}
                valueClass="text-red-600"
              />

              <Summary
                label="Completed"
                value={String(completed)}
                valueClass="textmerald-600"
              />
            </div>

            {/* TOOLBAR */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="text"
                  placeholder="Search remediation actions..."
                  className="h-9 w-[320px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </button>

                <FilterSelect
                  value={priorityFilter}
                  options={["All", "High", "Medium", "Low"]}
                  onChange={(value) =>
                    setPriorityFilter(value as Priority | "All")
                  }
                  label="Priority"
                />

                <FilterSelect
                  value={statusFilter}
                  options={["All", "Open", "In Progress", "Completed"]}
                  onChange={(value) =>
                    setStatusFilter(value as RemediationStatus | "All")
                  }
                  label="Status"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                    <TableHeader>Remediation Action</TableHeader>
                    <TableHeader>Finding</TableHeader>
                    <TableHeader>Risk</TableHeader>
                    <TableHeader>Priority</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Progress</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => (
                    <RemediationRow
                      key={item.id}
                      item={item}
                      onOpen={() => setSelectedItem(item)}
                    />
                  ))}
                </tbody>
              </table>

              {filteredItems.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <Wrench className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-[12px] font-medium text-slate-600">
                    No remediation actions found
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Try changing your search or filters.
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-[10px] text-slate-400">
                Showing {filteredItems.length} of {items.length} remediation
                actions
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
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ADD ACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-[620px] rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-slate-800">
                  Add Remediation Action
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  Create a corrective action for an audit finding.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              <Field
                label="Action Title"
                className="col-span-2"
              >
                <input
                  value={newAction.title}
                  onChange={(event) =>
                    setNewAction({
                      ...newAction,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter corrective action"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Description"
                className="col-span-2"
              >
                <textarea
                  value={newAction.description}
                  onChange={(event) =>
                    setNewAction({
                      ...newAction,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Describe the remediation action..."
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </Field>

              <Field label="Finding">
                <input
                  value={newAction.finding}
                  onChange={(event) =>
                    setNewAction({
                      ...newAction,
                      finding: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Risk">
                <input
                  value={newAction.risk}
                  onChange={(event) =>
                    setNewAction({
                      ...newAction,
                      risk: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Priority">
                <select
                  value={newAction.priority}
                  onChange={(event) =>
                    setNewAction({
                      ...newAction,
                      priority: event.target.value as Priority,
                    })
                  }
                  className={inputClass}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </Field>

              <Field label="Owner">
                <select
                  value={newAction.owner}
                  onChange={(event) =>
                    setNewAction({
                      ...newAction,
                      owner: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  {OWNERS.map((owner) => (
                    <option key={owner}>{owner}</option>
                  ))}
                </select>
              </Field>

              <Field label="Due Date">
                <input
                  type="date"
                  value={newAction.dueDate}
                  onChange={(event) =>
                    setNewAction({
                      ...newAction,
                      dueDate: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex justifynd gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-9 rounded-md border border-slate-200 px-4 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addAction}
                disabled={!newAction.title.trim()}
                className="h-9 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-[680px] rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Wrench className="h-4 w-4 text-blue-600" />
                </div>

                <div>
                  <p className="text-[10px] font-medium text-slate-400">
                    {selectedItem.id}
                  </p>

                  <h2 className="mt-1 text-[16px] font-semibold text-slate-800">
                    {selectedItem.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-2 text-[12px] leading-5 text-slate-600">
                  {selectedItem.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Detail label="Finding" value={selectedItem.finding} />
                <Detail label="Risk" value={selectedItem.risk} />
                <Detail label="Owner" value={selectedItem.owner} />
                <Detail label="Due Date" value={selectedItem.dueDate} />
                <Detail label="Priority" value={selectedItem.priority} />
                <Detail label="Created" value={selectedItem.createdDate} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Progress
                  </p>

                  <span className="text-[11px] font-semibold text-slate-700">
                    {selectedItem.progress}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${selectedItem.progress}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Change Status
                </p>

                <div className="flex gap-2">
                  {(["Open", "In Progress", "Completed"] as const).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          updateStatus(selectedItem.id, status)
                        }
                        className={`rounded-md border px-3 py-2 text-[10px] font-medium ${
                          selectedItem.status === status
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function Summary({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="border-r border-slate-100 px-5 py-4 last:border-r-0">
      <p className={`text-[19px] font-semibold ${valueClass}`}>
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {label}
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
    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500 first:pl-5">
      {children}
    </th>
  );
}

function RemediationRow({
  item,
  onOpen,
}: {
  item: RemediationItem;
  onOpen: () => void;
}) {
  const priorityClass =
    item.priority === "High"
      ? "bg-red-50 text-red-700"
      : item.priority === "Medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  const statusClass =
    item.status === "Completed"
      ? "bgmerald-50 textmerald-700"
      : item.status === "In Progress"
        ? "bg-blue-50 text-blue-700"
        : "bg-orange-50 text-orange-700";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-start gap-3 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
            {item.status === "Completed" ? (
              <CheckCircle2 className="h-4 w-4 textmerald-600" />
            ) : (
              <Wrench className="h-4 w-4 text-blue-600" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-medium text-slate-800 hover:text-blue-600">
              {item.title}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {item.id}
            </p>
          </div>
        </button>
      </td>

      <td className="px-3 py-4">
        <span className="rounded bg-orange-50 px-2 py-1 text-[10px] font-medium text-orange-700">
          {item.finding}
        </span>
      </td>

      <td className="px-3 py-4">
        <span className="rounded bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700">
          {item.risk}
        </span>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${priorityClass}`}
        >
          {item.priority}
        </span>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <UserRound className="h-3.5 w-3.5 text-slate-400" />
          {item.owner}
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          {item.dueDate}
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="w-[95px]">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] text-slate-400">
              Progress
            </span>

            <span className="text-[9px] font-medium text-slate-600">
              {item.progress}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      </td>

      <td className="px-3 py-4">
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass}`}
        >
          {item.status}
        </span>
      </td>

      <td className="px-3 py-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function FilterSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 appearance-none rounded-md border border-slate-200 bg-white py-0 pl-3 pr-8 text-[11px] text-slate-600 outline-none focus:border-blue-400"
        aria-label={`Filter by ${label}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? `All ${label}` : option}
          </option>
        ))}
      </select>

      <ChevronDown className="pointervents-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] font-medium text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-3">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[11px] font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
export const dynamic = 'force-dynamic';
