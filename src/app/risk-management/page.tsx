"use client";
import { getRisks } from "@/actions/risks";

import { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  TrendingDown,
  UserRound,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";

type RiskStatus = "Open" | "Mitigated" | "Accepted" | "Closed";
type RiskLevel = "Critical" | "High" | "Medium" | "Low";

type Risk = {
  id: string;
  title: string;
  description: string;
  category: string;
  framework: string;
  asset: string;
  owner: string;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  status: RiskStatus;
  identifiedDate: string;
  dueDate: string;
  treatment: string;
};

const workspaceRisks: Record<string, Risk[]> = {
  "abc-technologies": [
    {
      id: "RSK-2024-001",
      title: "Privileged accounts without MFA",
      description:
        "Several privileged accounts are not protected by multi-factor authentication.",
      category: "Access Control",
      framework: "ISO 27001",
      asset: "Identity & Access Management",
      owner: "Alice Smith",
      likelihood: 5,
      impact: 5,
      score: 25,
      level: "Critical",
      status: "Open",
      identifiedDate: "06 May 2024",
      dueDate: "31 May 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-002",
      title: "Incomplete access review process",
      description:
        "Periodic user access reviews are not consistently documented.",
      category: "Identity Management",
      framework: "NIST 800-53",
      asset: "User Accounts",
      owner: "John Carter",
      likelihood: 4,
      impact: 5,
      score: 20,
      level: "High",
      status: "Open",
      identifiedDate: "10 May 2024",
      dueDate: "07 Jun 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-003",
      title: "Security awareness gaps",
      description:
        "Security awareness records contain employees with overdue training.",
      category: "People",
      framework: "ISO 27001",
      asset: "Employees",
      owner: "Emily Davis",
      likelihood: 3,
      impact: 4,
      score: 12,
      level: "Medium",
      status: "Mitigated",
      identifiedDate: "14 May 2024",
      dueDate: "14 Jun 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-004",
      title: "Stale asset inventory records",
      description:
        "The asset inventory contains records that have not been validated recently.",
      category: "Asset Management",
      framework: "NIST CSF",
      asset: "Asset Inventory",
      owner: "Michael Lee",
      likelihood: 2,
      impact: 3,
      score: 6,
      level: "Low",
      status: "Closed",
      identifiedDate: "18 May 2024",
      dueDate: "28 Jun 2024",
      treatment: "Accept",
    },
    {
      id: "RSK-2024-005",
      title: "Vendor security assessment overdue",
      description:
        "A high-risk supplier has not completed the required security assessment.",
      category: "Third Party",
      framework: "SOC 2",
      asset: "Critical Vendors",
      owner: "Alice Smith",
      likelihood: 4,
      impact: 4,
      score: 16,
      level: "High",
      status: "Open",
      identifiedDate: "21 May 2024",
      dueDate: "21 Jun 2024",
      treatment: "Mitigate",
    },
  ],

  "xyz-finance": [
    {
      id: "RSK-2024-011",
      title: "Excessive user permissions",
      description:
        "Some users retain permissions that exceed their current job responsibilities.",
      category: "Access Control",
      framework: "ISO 27001",
      asset: "Financial Systems",
      owner: "Sarah Brown",
      likelihood: 4,
      impact: 5,
      score: 20,
      level: "High",
      status: "Open",
      identifiedDate: "05 May 2024",
      dueDate: "05 Jun 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-012",
      title: "Incident response documentation gap",
      description:
        "Incident response procedures do not fully document escalation requirements.",
      category: "Incident Management",
      framework: "NIST CSF",
      asset: "Incident Response",
      owner: "David Wilson",
      likelihood: 3,
      impact: 4,
      score: 12,
      level: "Medium",
      status: "Open",
      identifiedDate: "12 May 2024",
      dueDate: "30 Jun 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-013",
      title: "Backup restoration testing overdue",
      description:
        "A scheduled restoration test for critical financial systems is overdue.",
      category: "Business Continuity",
      framework: "NIST RMF",
      asset: "Backup Infrastructure",
      owner: "Sarah Brown",
      likelihood: 4,
      impact: 5,
      score: 20,
      level: "High",
      status: "Open",
      identifiedDate: "17 May 2024",
      dueDate: "20 Jun 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-014",
      title: "Security policy acknowledgement gap",
      description:
        "A small number of employees have not acknowledged updated security policies.",
      category: "Governance",
      framework: "SOC 2",
      asset: "Security Policies",
      owner: "David Wilson",
      likelihood: 2,
      impact: 2,
      score: 4,
      level: "Low",
      status: "Closed",
      identifiedDate: "20 May 2024",
      dueDate: "30 Jun 2024",
      treatment: "Accept",
    },
  ],

  "pqr-healthcare": [
    {
      id: "RSK-2024-021",
      title: "Clinical application accounts not reviewed",
      description:
        "Privileged clinical application accounts have not completed their scheduled review.",
      category: "Access Control",
      framework: "ISO 27001",
      asset: "Clinical Applications",
      owner: "Michael Lee",
      likelihood: 5,
      impact: 5,
      score: 25,
      level: "Critical",
      status: "Open",
      identifiedDate: "04 May 2024",
      dueDate: "31 May 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-022",
      title: "Inconsistent logging coverage",
      description:
        "Logging coverage is inconsistent across several healthcare applications.",
      category: "Logging & Monitoring",
      framework: "NIST 800-53",
      asset: "Application Infrastructure",
      owner: "Emily Davis",
      likelihood: 4,
      impact: 4,
      score: 16,
      level: "High",
      status: "Open",
      identifiedDate: "11 May 2024",
      dueDate: "15 Jun 2024",
      treatment: "Mitigate",
    },
    {
      id: "RSK-2024-023",
      title: "Supplier security clauses missing",
      description:
        "Several supplier agreements do not contain the required security clauses.",
      category: "Third Party",
      framework: "NIST RMF",
      asset: "Supplier Contracts",
      owner: "John Carter",
      likelihood: 3,
      impact: 4,
      score: 12,
      level: "Medium",
      status: "Open",
      identifiedDate: "19 May 2024",
      dueDate: "30 Jun 2024",
      treatment: "Mitigate",
    },
  ],
};

export default function RiskManagementPage() {
  const { currentWorkspace } = useWorkspace();

  const workspaceKey = currentWorkspace?.id || "abc-technologies";

  const risks = workspaceRisks[workspaceKey] || workspaceRisks["abc-technologies"];

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"All" | RiskLevel>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | RiskStatus>("All");
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredRisks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return risks.filter((risk) => {
      const matchesSearch =
        !query ||
        risk.id.toLowerCase().includes(query) ||
        risk.title.toLowerCase().includes(query) ||
        risk.category.toLowerCase().includes(query) ||
        risk.owner.toLowerCase().includes(query) ||
        risk.framework.toLowerCase().includes(query);

      const matchesLevel =
        levelFilter === "All" || risk.level === levelFilter;

      const matchesStatus =
        statusFilter === "All" || risk.status === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [risks, search, levelFilter, statusFilter]);

  const critical = risks.filter((risk) => risk.level === "Critical").length;
  const high = risks.filter((risk) => risk.level === "High").length;
  const open = risks.filter((risk) => risk.status === "Open").length;
  const mitigated = risks.filter(
    (risk) => risk.status === "Mitigated" || risk.status === "Closed"
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f8fc] pl-[250px]">
      <Header />

      <div className="px-8 py-7">
        {/* Page Header */}
        <div className="mb-7 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <ShieldAlert className="h-4 w-4" />
              <span>Governance & Risk</span>
              <span>/</span>
              <span>Risk Management</span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
              Risk Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Identify, assess, monitor, and manage cybersecurity risks across
              your workspace.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Risk
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-7 grid grid-cols-4 gap-5">
          <SummaryCard
            title="Total Risks"
            value={risks.length}
            subtitle="Across workspace"
            icon={<ShieldAlert className="h-5 w-5" />}
          />

          <SummaryCard
            title="Critical Risks"
            value={critical}
            subtitle="Immediate attention"
            icon={<AlertTriangle className="h-5 w-5" />}
            danger
          />

          <SummaryCard
            title="High Risks"
            value={high}
            subtitle="Require treatment"
            icon={<CircleAlert className="h-5 w-5" />}
            warning
          />

          <SummaryCard
            title="Open Risks"
            value={open}
            subtitle={`${mitigated} mitigated or closed`}
            icon={<TrendingDown className="h-5 w-5" />}
          />
        </div>

        {/* Risk Register */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Risk Register
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredRisks.length} of {risks.length} risks displayed
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search risks..."
                    className="h-9 w-[230px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                <FilterSelect
                  value={levelFilter}
                  onChange={(value) =>
                    setLevelFilter(value as "All" | RiskLevel)
                  }
                  options={["All", "Critical", "High", "Medium", "Low"]}
                />

                <FilterSelect
                  value={statusFilter}
                  onChange={(value) =>
                    setStatusFilter(value as "All" | RiskStatus)
                  }
                  options={["All", "Open", "Mitigated", "Accepted", "Closed"]}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <TableHead>Risk</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Likelihood</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Action</TableHead>
                </tr>
              </thead>

              <tbody>
                {filteredRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {risk.id}
                        </p>
                        <p className="mt-1 max-w-[230px] text-sm font-semibold text-slate-900">
                          {risk.title}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {risk.category}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                        {risk.framework}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <RiskRating value={risk.likelihood} />
                    </td>

                    <td className="px-4 py-4">
                      <RiskRating value={risk.impact} />
                    </td>

                    <td className="px-4 py-4">
                      <ScoreBadge score={risk.score} level={risk.level} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        {risk.owner}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={risk.status} />
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {risk.dueDate}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedRisk(risk)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredRisks.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-14 text-center text-sm text-slate-500"
                    >
                      No risks match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Risk Details Modal */}
      {selectedRisk && (
        <Modal onClose={() => setSelectedRisk(null)}>
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {selectedRisk.id}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedRisk.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedRisk(null)}
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
                {selectedRisk.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Category" value={selectedRisk.category} />
              <DetailItem label="Framework" value={selectedRisk.framework} />
              <DetailItem label="Affected Asset" value={selectedRisk.asset} />
              <DetailItem label="Owner" value={selectedRisk.owner} />
              <DetailItem
                label="Identified Date"
                value={selectedRisk.identifiedDate}
              />
              <DetailItem label="Due Date" value={selectedRisk.dueDate} />
              <DetailItem label="Treatment" value={selectedRisk.treatment} />
              <DetailItem
                label="Status"
                value={selectedRisk.status}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 text-sm font-semibold text-slate-900">
                Risk Assessment
              </p>

              <div className="grid grid-cols-3 gap-4">
                <AssessmentBox
                  label="Likelihood"
                  value={selectedRisk.likelihood}
                />
                <AssessmentBox
                  label="Impact"
                  value={selectedRisk.impact}
                />
                <AssessmentBox
                  label="Risk Score"
                  value={selectedRisk.score}
                  highlight
                />
              </div>
            </div>
          </div>

          <div className="flex justifynd border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => setSelectedRisk(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Add Risk Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add New Risk
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Add a risk to the workspace risk register.
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
            <FormField label="Risk Title">
              <input
                placeholder="Enter risk title"
                className="form-input"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                rows={3}
                placeholder="Describe the risk..."
                className="form-input resize-none py-2"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Category">
                <select className="form-input">
                  <option>Access Control</option>
                  <option>Asset Management</option>
                  <option>Incident Management</option>
                  <option>Third Party</option>
                  <option>Governance</option>
                  <option>Business Continuity</option>
                </select>
              </FormField>

              <FormField label="Framework">
                <select className="form-input">
                  <option>ISO 27001</option>
                  <option>NIST CSF</option>
                  <option>NIST 800-53</option>
                  <option>NIST RMF</option>
                  <option>SOC 2</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Likelihood">
                <select className="form-input">
                  <option>1 - Rare</option>
                  <option>2 - Unlikely</option>
                  <option>3 - Possible</option>
                  <option>4 - Likely</option>
                  <option>5 - Almost Certain</option>
                </select>
              </FormField>

              <FormField label="Impact">
                <select className="form-input">
                  <option>1 - Minimal</option>
                  <option>2 - Minor</option>
                  <option>3 - Moderate</option>
                  <option>4 - Major</option>
                  <option>5 - Severe</option>
                </select>
              </FormField>
            </div>

            <FormField label="Risk Owner">
              <select className="form-input">
                <option>Alice Smith</option>
                <option>John Carter</option>
                <option>Emily Davis</option>
                <option>Michael Lee</option>
              </select>
            </FormField>
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
              Create Risk
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
  warning,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`rounded-lg p-2.5 ${
            danger
              ? "bg-red-50 text-red-600"
              : warning
              ? "bg-amber-50 text-amber-600"
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

function RiskRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{value}</span>
      <span className="text-xs text-slate-400">/ 5</span>
    </div>
  );
}

function ScoreBadge({
  score,
  level,
}: {
  score: number;
  level: RiskLevel;
}) {
  const styles: Record<RiskLevel, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bgmerald-50 textmerald-700 bordermerald-200",
  };

  return (
    <span
      className={`inline-flex min-w-[72px] items-center justify-center rounded-md border px-2 py-1 text-xs font-bold ${styles[level]}`}
    >
      {score} · {level}
    </span>
  );
}

function StatusBadge({ status }: { status: RiskStatus }) {
  const styles: Record<RiskStatus, string> = {
    Open: "bg-red-50 text-red-700",
    Mitigated: "bg-blue-50 text-blue-700",
    Accepted: "bg-amber-50 text-amber-700",
    Closed: "bgmerald-50 textmerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status === "Open" && <CircleAlert className="h-3 w-3" />}
      {status === "Mitigated" && <TrendingDown className="h-3 w-3" />}
      {status === "Accepted" && <Clock3 className="h-3 w-3" />}
      {status === "Closed" && <CheckCircle2 className="h-3 w-3" />}
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
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function AssessmentBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`mt-2 text-xl font-bold ${
          highlight ? "text-slate-900" : "text-slate-700"
        }`}
      >
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';
