"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  Filter,
  ListChecks,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";

type RemediationStatus =
  | "Open"
  | "In Progress"
  | "Pending Review"
  | "Completed"
  | "Overdue";

type Priority = "Critical" | "High" | "Medium" | "Low";

type Remediation = {
  id: string;
  title: string;
  description: string;
  findingId: string;
  riskId: string;
  framework: string;
  priority: Priority;
  owner: string;
  dueDate: string;
  status: RemediationStatus;
  progress: number;
  createdDate: string;
};

const workspaceRemediations: Record<string, Remediation[]> = {
  "abc-technologies": [
    {
      id: "REM-2024-001",
      title: "Enable MFA for privileged accounts",
      description:
        "Enable multi-factor authentication for all privileged and administrative accounts.",
      findingId: "FND-2024-001",
      riskId: "RSK-2024-001",
      framework: "ISO 27001",
      priority: "Critical",
      owner: "Alice Smith",
      dueDate: "31 May 2024",
      status: "In Progress",
      progress: 65,
      createdDate: "06 May 2024",
    },
    {
      id: "REM-2024-002",
      title: "Complete quarterly access review",
      description:
        "Perform and document a complete review of user and privileged access.",
      findingId: "FND-2024-002",
      riskId: "RSK-2024-002",
      framework: "NIST 800-53",
      priority: "High",
      owner: "John Carter",
      dueDate: "07 Jun 2024",
      status: "In Progress",
      progress: 45,
      createdDate: "10 May 2024",
    },
    {
      id: "REM-2024-003",
      title: "Update security awareness records",
      description:
        "Bring employee security awareness and training records up to date.",
      findingId: "FND-2024-003",
      riskId: "RSK-2024-003",
      framework: "ISO 27001",
      priority: "Medium",
      owner: "Emily Davis",
      dueDate: "14 Jun 2024",
      status: "Pending Review",
      progress: 90,
      createdDate: "14 May 2024",
    },
    {
      id: "REM-2024-004",
      title: "Clean stale asset inventory entries",
      description:
        "Review, validate, and remove obsolete asset inventory records.",
      findingId: "FND-2024-004",
      riskId: "RSK-2024-004",
      framework: "NIST CSF",
      priority: "Low",
      owner: "Michael Lee",
      dueDate: "28 Jun 2024",
      status: "Completed",
      progress: 100,
      createdDate: "18 May 2024",
    },
    {
      id: "REM-2024-005",
      title: "Complete vendor security assessment",
      description:
        "Complete the outstanding security assessment for the high-risk supplier.",
      findingId: "FND-2024-005",
      riskId: "RSK-2024-005",
      framework: "SOC 2",
      priority: "High",
      owner: "Alice Smith",
      dueDate: "21 Jun 2024",
      status: "Open",
      progress: 15,
      createdDate: "21 May 2024",
    },
  ],

  "xyz-finance": [
    {
      id: "REM-2024-011",
      title: "Remove excessive user permissions",
      description:
        "Review user privileges and remove permissions that are no longer required.",
      findingId: "FND-2024-011",
      riskId: "RSK-2024-011",
      framework: "ISO 27001",
      priority: "High",
      owner: "Sarah Brown",
      dueDate: "05 Jun 2024",
      status: "In Progress",
      progress: 60,
      createdDate: "05 May 2024",
    },
    {
      id: "REM-2024-012",
      title: "Update incident response documentation",
      description:
        "Complete missing escalation, communication, and response procedures.",
      findingId: "FND-2024-012",
      riskId: "RSK-2024-012",
      framework: "NIST CSF",
      priority: "Medium",
      owner: "David Wilson",
      dueDate: "30 Jun 2024",
      status: "In Progress",
      progress: 50,
      createdDate: "12 May 2024",
    },
    {
      id: "REM-2024-013",
      title: "Perform backup restoration test",
      description:
        "Execute and document a restoration test for critical financial systems.",
      findingId: "FND-2024-013",
      riskId: "RSK-2024-013",
      framework: "NIST RMF",
      priority: "High",
      owner: "Sarah Brown",
      dueDate: "20 Jun 2024",
      status: "Overdue",
      progress: 20,
      createdDate: "17 May 2024",
    },
    {
      id: "REM-2024-014",
      title: "Close policy acknowledgement gap",
      description:
        "Obtain outstanding employee acknowledgements for updated security policies.",
      findingId: "FND-2024-014",
      riskId: "RSK-2024-014",
      framework: "SOC 2",
      priority: "Low",
      owner: "David Wilson",
      dueDate: "30 Jun 2024",
      status: "Completed",
      progress: 100,
      createdDate: "20 May 2024",
    },
  ],

  "pqr-healthcare": [
    {
      id: "REM-2024-021",
      title: "Review clinical application accounts",
      description:
        "Complete the scheduled review of privileged clinical application accounts.",
      findingId: "FND-2024-021",
      riskId: "RSK-2024-021",
      framework: "ISO 27001",
      priority: "Critical",
      owner: "Michael Lee",
      dueDate: "31 May 2024",
      status: "Open",
      progress: 25,
      createdDate: "04 May 2024",
    },
    {
      id: "REM-2024-022",
      title: "Improve application logging coverage",
      description:
        "Enable consistent security logging across identified healthcare applications.",
      findingId: "FND-2024-022",
      riskId: "RSK-2024-022",
      framework: "NIST 800-53",
      priority: "High",
      owner: "Emily Davis",
      dueDate: "15 Jun 2024",
      status: "In Progress",
      progress: 55,
      createdDate: "11 May 2024",
    },
    {
      id: "REM-2024-023",
      title: "Add security clauses to supplier contracts",
      description:
        "Update applicable supplier agreements with required security requirements.",
      findingId: "FND-2024-023",
      riskId: "RSK-2024-023",
      framework: "NIST RMF",
      priority: "Medium",
      owner: "John Carter",
      dueDate: "30 Jun 2024",
      status: "Open",
      progress: 10,
      createdDate: "19 May 2024",
    },
  ],
};

export default function RemediationPage() {
  const { currentWorkspace } = useWorkspace();

  const workspaceKey = currentWorkspace?.id || "abc-technologies";

  const remediations =
    workspaceRemediations[workspaceKey] ||
    workspaceRemediations["abc-technologies"];

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | Priority
  >("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | RemediationStatus
  >("All");
  const [selectedRemediation, setSelectedRemediation] =
    useState<Remediation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRemediations = useMemo(() => {
    const query = search.toLowerCase().trim();

    return remediations.filter((item) => {
      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.findingId.toLowerCase().includes(query) ||
        item.riskId.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query) ||
        item.framework.toLowerCase().includes(query);

      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [remediations, search, priorityFilter, statusFilter]);

  const openCount = remediations.filter(
    (item) => item.status === "Open"
  ).length;

  const inProgressCount = remediations.filter(
    (item) => item.status === "In Progress"
  ).length;

  const overdueCount = remediations.filter(
    (item) => item.status === "Overdue"
  ).length;

  const completedCount = remediations.filter(
    (item) => item.status === "Completed"
  ).length;

  const averageProgress =
    remediations.length > 0
      ? Math.round(
          remediations.reduce((sum, item) => sum + item.progress, 0) /
            remediations.length
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#f6f8fc] pl-[250px]">
      <Header />

      <div className="px-8 py-7">
        {/* Header */}
        <div className="mb-7 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <ListChecks className="h-4 w-4" />
              <span>Governance & Risk</span>
              <span>/</span>
              <span>Remediation</span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
              Remediation
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track corrective actions and monitor remediation progress across
              the workspace.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Remediation
          </button>
        </div>

        {/* Summary */}
        <div className="mb-7 grid grid-cols-5 gap-4">
          <SummaryCard
            title="Total Actions"
            value={remediations.length}
            subtitle="Workspace remediation"
            icon={<ListChecks className="h-5 w-5" />}
          />

          <SummaryCard
            title="Open"
            value={openCount}
            subtitle="Awaiting action"
            icon={<CircleAlert className="h-5 w-5" />}
          />

          <SummaryCard
            title="In Progress"
            value={inProgressCount}
            subtitle="Currently being worked"
            icon={<Clock3 className="h-5 w-5" />}
          />

          <SummaryCard
            title="Overdue"
            value={overdueCount}
            subtitle="Require attention"
            icon={<CalendarDays className="h-5 w-5" />}
            danger
          />

          <SummaryCard
            title="Completed"
            value={completedCount}
            subtitle={`${averageProgress}% average progress`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            success
          />
        </div>

        {/* Register */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Remediation Register
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredRemediations.length} of {remediations.length}{" "}
                  actions displayed
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search remediation..."
                    className="h-9 w-[235px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                <FilterSelect
                  value={priorityFilter}
                  onChange={(value) =>
                    setPriorityFilter(value as "All" | Priority)
                  }
                  options={["All", "Critical", "High", "Medium", "Low"]}
                />

                <FilterSelect
                  value={statusFilter}
                  onChange={(value) =>
                    setStatusFilter(value as "All" | RemediationStatus)
                  }
                  options={[
                    "All",
                    "Open",
                    "In Progress",
                    "Pending Review",
                    "Completed",
                    "Overdue",
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <TableHead>Remediation</TableHead>
                  <TableHead>Finding</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </tr>
              </thead>

              <tbody>
                {filteredRemediations.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-500">
                        {item.id}
                      </p>

                      <p className="mt-1 max-w-[230px] text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold text-slate-600">
                        {item.findingId}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold text-slate-600">
                        {item.riskId}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                        {item.framework}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        {item.owner}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.dueDate}
                    </td>

                    <td className="px-4 py-4">
                      <div className="w-[105px]">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            {item.progress}%
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-700 transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedRemediation(item)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRemediations.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      No remediation actions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Details Modal */}
      {selectedRemediation && (
        <Modal onClose={() => setSelectedRemediation(null)}>
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedRemediation.id}
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedRemediation.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedRemediation(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="text-sm leading-6 text-slate-600">
                {selectedRemediation.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem
                label="Finding"
                value={selectedRemediation.findingId}
              />

              <DetailItem
                label="Risk"
                value={selectedRemediation.riskId}
              />

              <DetailItem
                label="Framework"
                value={selectedRemediation.framework}
              />

              <DetailItem
                label="Priority"
                value={selectedRemediation.priority}
              />

              <DetailItem
                label="Owner"
                value={selectedRemediation.owner}
              />

              <DetailItem
                label="Created Date"
                value={selectedRemediation.createdDate}
              />

              <DetailItem
                label="Due Date"
                value={selectedRemediation.dueDate}
              />

              <DetailItem
                label="Status"
                value={selectedRemediation.status}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Remediation Progress
                </p>

                <span className="text-sm font-bold text-slate-700">
                  {selectedRemediation.progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-slate-700"
                  style={{
                    width: `${selectedRemediation.progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justifynd border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => setSelectedRemediation(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Add Remediation Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Remediation Action
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create a corrective action for the workspace.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            <FormField label="Remediation Title">
              <input
                placeholder="Enter remediation title"
                className="form-input"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                rows={3}
                placeholder="Describe the corrective action..."
                className="form-input resize-none py-2"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Finding ID">
                <input
                  placeholder="e.g. FND-2024-001"
                  className="form-input"
                />
              </FormField>

              <FormField label="Risk ID">
                <input
                  placeholder="e.g. RSK-2024-001"
                  className="form-input"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Framework">
                <select className="form-input">
                  <option>ISO 27001</option>
                  <option>NIST CSF</option>
                  <option>NIST 800-53</option>
                  <option>NIST RMF</option>
                  <option>SOC 2</option>
                </select>
              </FormField>

              <FormField label="Priority">
                <select className="form-input">
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Owner">
                <select className="form-input">
                  <option>Alice Smith</option>
                  <option>John Carter</option>
                  <option>Emily Davis</option>
                  <option>Michael Lee</option>
                  <option>Sarah Brown</option>
                  <option>David Wilson</option>
                </select>
              </FormField>

              <FormField label="Due Date">
                <input type="date" className="form-input" />
              </FormField>
            </div>
          </div>

          <div className="flex justifynd gap-3 border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={() => setShowAddModal(false)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create Action
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ---------- Components ---------- */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  danger,
  success,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  danger?: boolean;
  success?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`rounded-lg p-2.5 ${
            danger
              ? "bg-red-50 text-red-600"
              : success
              ? "bgmerald-50 textmerald-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-600 outline-none focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>

      <ChevronDown className="pointervents-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </th>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    Critical: "bg-red-50 text-red-700",
    High: "bg-orange-50 text-orange-700",
    Medium: "bg-amber-50 text-amber-700",
    Low: "bgmerald-50 textmerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: RemediationStatus;
}) {
  const styles: Record<RemediationStatus, string> = {
    Open: "bg-red-50 text-red-700",
    "In Progress": "bg-blue-50 text-blue-700",
    "Pending Review": "bg-amber-50 text-amber-700",
    Completed: "bgmerald-50 textmerald-700",
    Overdue: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status === "Completed" && (
        <CheckCircle2 className="h-3 w-3" />
      )}

      {status === "In Progress" && (
        <Clock3 className="h-3 w-3" />
      )}

      {status === "Pending Review" && (
        <Clock3 className="h-3 w-3" />
      )}

      {(status === "Open" || status === "Overdue") && (
        <CircleAlert className="h-3 w-3" />
      )}

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
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';
