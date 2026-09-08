"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Trash2,
  TrendingDown,
  UserRound,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getRisks,
  createRisk,
  updateRisk,
  deleteRisk,
  type RiskRecord,
  type RiskLevel,
  type RiskStatus,
} from "@/actions/risks";

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
  auditName?: string;
};

export default function RiskManagementPage() {
  const { currentWorkspace } = useWorkspace();

  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"All" | RiskLevel>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | RiskStatus>("All");
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New risk form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Access Control");
  const [newFramework, setNewFramework] = useState("ISO 27001");
  const [newAsset, setNewAsset] = useState("Core Infrastructure");
  const [newOwner, setNewOwner] = useState("Alice Smith");
  const [newLikelihood, setNewLikelihood] = useState(3);
  const [newImpact, setNewImpact] = useState(3);
  const [newTreatment, setNewTreatment] = useState("Mitigate");
  const [newDueDate, setNewDueDate] = useState("");

  const loadRisks = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setRisks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getRisks(currentWorkspace.id);
      if (res.success && res.data) {
        const mapped: Risk[] = res.data.map((r: RiskRecord) => {
          const lNum = typeof r.likelihood === "string" ? parseInt(r.likelihood, 10) || 3 : 3;
          const iNum = typeof r.impact === "string" ? parseInt(r.impact, 10) || 3 : 3;
          return {
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            framework: r.framework,
            asset: r.asset || "Core Infrastructure",
            owner: r.owner,
            likelihood: lNum,
            impact: iNum,
            score: r.score,
            level: r.level,
            status: r.status,
            identifiedDate: r.identified_date || r.created_at?.split("T")[0] || "2024-05-01",
            dueDate: r.due_date,
            treatment: r.treatment,
            auditName: r.audit_name,
          };
        });
        setRisks(mapped);
      } else {
        setError(res.error || "Failed to load risks");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load risks";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRisks();
  }, [loadRisks]);

  const filteredRisks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return risks.filter((risk) => {
      const matchesSearch =
        !query ||
        risk.id.toLowerCase().includes(query) ||
        risk.title.toLowerCase().includes(query) ||
        risk.category.toLowerCase().includes(query) ||
        risk.owner.toLowerCase().includes(query) ||
        risk.framework.toLowerCase().includes(query) ||
        risk.asset.toLowerCase().includes(query);

      const matchesLevel =
        levelFilter === "All" || risk.level === levelFilter;

      const matchesStatus =
        statusFilter === "All" || risk.status === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [risks, search, levelFilter, statusFilter]);

  const critical = risks.filter((risk) => risk.level === "Critical").length;
  const high = risks.filter((risk) => risk.level === "High").length;
  const open = risks.filter((risk) => risk.status === "Open" || risk.status === "In Treatment").length;
  const mitigated = risks.filter(
    (risk) => risk.status === "Mitigated" || risk.status === "Closed" || risk.status === "Accepted"
  ).length;

  async function handleCreateRisk(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWorkspace?.id || !newTitle.trim()) return;

    setIsSubmitting(true);
    const score = newLikelihood * newImpact;
    const level: RiskLevel = score >= 16 ? "Critical" : score >= 10 ? "High" : score >= 5 ? "Medium" : "Low";

    const res = await createRisk(currentWorkspace.id, {
      auditId: "", // Backend will associate with the first workspace audit if empty
      title: newTitle.trim(),
      description: newDescription.trim() || "Risk identified during risk assessment.",
      category: newCategory,
      framework: newFramework,
      asset: newAsset,
      owner: newOwner,
      likelihood: String(newLikelihood),
      impact: String(newImpact),
      score,
      level,
      treatment: newTreatment,
      dueDate: newDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "Open",
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      const created: Risk = {
        id: res.data.id,
        title: res.data.title,
        description: res.data.description,
        category: res.data.category,
        framework: res.data.framework,
        asset: res.data.asset || newAsset,
        owner: res.data.owner,
        likelihood: newLikelihood,
        impact: newImpact,
        score: res.data.score,
        level: res.data.level,
        status: res.data.status,
        identifiedDate: res.data.identified_date || new Date().toISOString().split("T")[0],
        dueDate: res.data.due_date,
        treatment: res.data.treatment,
      };
      setRisks((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
    } else {
      alert(res.error || "Failed to create risk");
    }
  }

  async function handleUpdateStatus(id: string, newStatus: RiskStatus) {
    if (!currentWorkspace?.id) return;
    const res = await updateRisk(currentWorkspace.id, id, { status: newStatus });
    if (res.success && res.data) {
      setRisks((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: res.data.status } : r))
      );
      if (selectedRisk && selectedRisk.id === id) {
        setSelectedRisk({ ...selectedRisk, status: res.data.status });
      }
    } else {
      alert(res.error || "Failed to update risk status");
    }
  }

  async function handleDeleteRisk(id: string) {
    if (!currentWorkspace?.id) return;
    if (!confirm("Are you sure you want to delete this risk?")) return;

    const res = await deleteRisk(currentWorkspace.id, id);
    if (res.success) {
      setRisks((prev) => prev.filter((r) => r.id !== id));
      setSelectedRisk(null);
    } else {
      alert(res.error || "Failed to delete risk");
    }
  }

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
              Identify, assess, monitor, and manage cybersecurity risks across{" "}
              {currentWorkspace?.name || "your workspace"}.
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

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

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
            subtitle="Action required"
            icon={<CircleAlert className="h-5 w-5" />}
            warning
          />

          <SummaryCard
            title="Mitigated / Closed"
            value={mitigated}
            subtitle="Controlled exposure"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        {/* Filter Toolbar */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, category, owner, asset..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <FilterSelect
              value={levelFilter}
              onChange={(v) => setLevelFilter(v as "All" | RiskLevel)}
              options={["All", "Critical", "High", "Medium", "Low"]}
            />

            <FilterSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as "All" | RiskStatus)}
              options={["All", "Open", "In Treatment", "Mitigated", "Accepted", "Closed"]}
            />
          </div>
        </div>

        {/* Risks Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75">
                <TableHead>Risk ID & Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Asset / Scope</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Likelihood</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-xs text-slate-400">
                    Loading workspace risks...
                  </td>
                </tr>
              ) : filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <ShieldAlert className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">No risks found</p>
                    <p className="mt-1 text-xs text-slate-400">
                      No risks match your filter or search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRisks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400">
                          {risk.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {risk.title}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                      {risk.category}
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                      {risk.asset}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <UserRound className="h-3.5 w-3.5 text-slate-400" />
                        {risk.owner}
                      </div>
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
                      <StatusBadge status={risk.status} />
                    </td>

                    <td className="px-4 py-4 text-xs font-medium text-slate-500">
                      {risk.dueDate}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedRisk(risk)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRisk && (
        <Modal onClose={() => setSelectedRisk(null)}>
          <div className="flex items-start justify-between border-b border-slate-200 p-6">
            <div>
              <span className="text-xs font-bold text-slate-400">
                {selectedRisk.id}
              </span>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {selectedRisk.title}
              </h2>
            </div>

            <button
              onClick={() => setSelectedRisk(null)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {selectedRisk.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Category" value={selectedRisk.category} />
              <DetailItem label="Framework" value={selectedRisk.framework} />
              <DetailItem label="Affected Asset" value={selectedRisk.asset} />
              <DetailItem label="Risk Owner" value={selectedRisk.owner} />
              <DetailItem label="Treatment Strategy" value={selectedRisk.treatment} />
              <DetailItem label="Identified Date" value={selectedRisk.identifiedDate} />
              <DetailItem label="Target Due Date" value={selectedRisk.dueDate} />
              {selectedRisk.auditName && (
                <DetailItem label="Associated Audit" value={selectedRisk.auditName} />
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Risk Assessment Matrix
              </p>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <AssessmentBox
                  label="Likelihood (1-5)"
                  value={selectedRisk.likelihood}
                />
                <AssessmentBox
                  label="Impact (1-5)"
                  value={selectedRisk.impact}
                />
                <AssessmentBox
                  label="Risk Score"
                  value={selectedRisk.score}
                  highlight
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Update Status
              </p>
              <div className="flex flex-wrap gap-2">
                {(["Open", "In Treatment", "Mitigated", "Accepted", "Closed"] as RiskStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedRisk.id, status)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        selectedRisk.status === status
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4">
            <button
              onClick={() => handleDeleteRisk(selectedRisk.id)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Risk
            </button>

            <button
              onClick={() => setSelectedRisk(null)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Add Risk Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleCreateRisk}>
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">Add New Risk</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6 max-h-[75vh] overflow-y-auto">
              <FormField label="Risk Title">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unpatched Vulnerabilities in Web Application"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed description of the threat and potential business impact..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option>Access Control</option>
                    <option>Data Protection</option>
                    <option>Cloud Security</option>
                    <option>Identity Management</option>
                    <option>Incident Management</option>
                    <option>Business Continuity</option>
                    <option>Asset Management</option>
                    <option>Third Party</option>
                    <option>Governance</option>
                  </select>
                </FormField>

                <FormField label="Framework">
                  <select
                    value={newFramework}
                    onChange={(e) => setNewFramework(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option>ISO 27001</option>
                    <option>NIST CSF</option>
                    <option>NIST 800-53</option>
                    <option>NIST RMF</option>
                    <option>SOC 2</option>
                    <option>CIS Controls</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Affected Asset / Scope">
                  <input
                    type="text"
                    value={newAsset}
                    onChange={(e) => setNewAsset(e.target.value)}
                    placeholder="e.g. Payment Gateway"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  />
                </FormField>

                <FormField label="Risk Owner">
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. Alice Smith"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Likelihood (1: Rare -> 5: Almost Certain)">
                  <select
                    value={newLikelihood}
                    onChange={(e) => setNewLikelihood(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option value={1}>1 - Rare</option>
                    <option value={2}>2 - Unlikely</option>
                    <option value={3}>3 - Possible</option>
                    <option value={4}>4 - Likely</option>
                    <option value={5}>5 - Almost Certain</option>
                  </select>
                </FormField>

                <FormField label="Impact (1: Insignificant -> 5: Catastrophic)">
                  <select
                    value={newImpact}
                    onChange={(e) => setNewImpact(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option value={1}>1 - Minimal</option>
                    <option value={2}>2 - Minor</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Major</option>
                    <option value={5}>5 - Severe / Critical</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Treatment Strategy">
                  <select
                    value={newTreatment}
                    onChange={(e) => setNewTreatment(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  >
                    <option>Mitigate</option>
                    <option>Accept</option>
                    <option>Transfer</option>
                    <option>Avoid</option>
                  </select>
                </FormField>

                <FormField label="Target Due Date">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                  />
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!newTitle.trim() || isSubmitting}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Risk"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}

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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              danger
                ? "text-red-600"
                : warning
                ? "text-amber-600"
                : "text-slate-900"
            }`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
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
        aria-label="Filter options"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-600 outline-none focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? "All Options" : option}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex min-w-[72px] items-center justify-center rounded-md border px-2 py-1 text-xs font-bold ${styles[level] || styles.Low}`}
    >
      {score} · {level}
    </span>
  );
}

function StatusBadge({ status }: { status: RiskStatus }) {
  const styles: Record<RiskStatus, string> = {
    Open: "bg-red-50 text-red-700",
    "In Treatment": "bg-blue-50 text-blue-700",
    Mitigated: "bg-blue-50 text-blue-700",
    Accepted: "bg-amber-50 text-amber-700",
    Closed: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.Open}`}
    >
      {status === "Open" && <CircleAlert className="h-3 w-3" />}
      {status === "In Treatment" && <TrendingDown className="h-3 w-3" />}
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
