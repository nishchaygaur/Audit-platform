"use client";

import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getRisks,
  createRisk,
  updateRisk,
  deleteRisk,
  type RiskRecord,
} from "@/actions/risks";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type RiskLevel = "Critical" | "High" | "Medium" | "Low";
type RiskStatus = "Open" | "In Treatment" | "Mitigated" | "Accepted" | "Closed";
type Treatment = "Mitigate" | "Accept" | "Transfer" | "Avoid";
type Rating = "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain";

type Risk = {
  id: string;
  title: string;
  description: string;
  category: string;
  finding: string;
  framework: string;
  control: string;
  likelihood: Rating;
  impact: Rating;
  score: number;
  level: RiskLevel;
  treatment: Treatment;
  owner: string;
  dueDate: string;
  residualScore: number;
  residualLevel: RiskLevel;
  status: RiskStatus;
  asset?: string;
  identifiedDate?: string;
};

const OWNERS = [
  "Alice Smith",
  "John Carter",
  "Emily Davis",
  "Michael Lee",
  "David Wilson",
];

const CATEGORIES = [
  "Access Control",
  "Data Protection",
  "Cloud Security",
  "Human Resources",
  "Third Party",
  "Business Continuity",
  "Identity Management",
  "Logging & Monitoring",
  "Governance",
];

const RATINGS: Rating[] = [
  "Rare",
  "Unlikely",
  "Possible",
  "Likely",
  "Almost Certain",
];

function ratingValue(rating: Rating) {
  const values: Record<Rating, number> = {
    Rare: 1,
    Unlikely: 2,
    Possible: 3,
    Likely: 4,
    "Almost Certain": 5,
  };

  return values[rating] || 3;
}

function calculateScore(likelihood: Rating, impact: Rating) {
  return ratingValue(likelihood) * ratingValue(impact);
}

function calculateLevel(score: number): RiskLevel {
  if (score >= 16) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

export default function RisksPage() {
  const params = useParams<{ id: string }>();
  const auditId = params?.id as string;

  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentWorkspace } = useWorkspace();

  const loadRisks = useCallback(async () => {
    if (!currentWorkspace?.id || !auditId) {
      setRisks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getRisks(currentWorkspace.id, auditId);
      if (res.success && res.data) {
        const mapped: Risk[] = res.data.map((r: RiskRecord) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          finding: r.finding,
          framework: r.framework,
          control: r.control,
          likelihood: (r.likelihood as Rating) || "Possible",
          impact: (r.impact as Rating) || "Possible",
          score: r.score,
          level: r.level,
          treatment: (r.treatment as Treatment) || "Mitigate",
          owner: r.owner,
          dueDate: r.due_date,
          residualScore: r.residual_score,
          residualLevel: r.residual_level,
          status: r.status,
          asset: r.asset,
          identifiedDate: r.identified_date,
        }));
        setRisks(mapped);
      } else {
        setError(res.error || "Failed to load risks");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch risks");
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, auditId]);

  useEffect(() => {
    loadRisks();
  }, [loadRisks]);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "All">("All");
  const [statusFilter, setStatusFilter] = useState<RiskStatus | "All">("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const [newRisk, setNewRisk] = useState({
    title: "",
    description: "",
    category: "Access Control",
    finding: "FND-001",
    framework: "ISO 27001",
    control: "A.5.15",
    likelihood: "Possible" as Rating,
    impact: "Possible" as Rating,
    treatment: "Mitigate" as Treatment,
    owner: OWNERS[0],
    dueDate: "",
    asset: "Core Infrastructure",
  });

  const filteredRisks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return risks.filter((risk) => {
      const matchesSearch =
        !query ||
        risk.id.toLowerCase().includes(query) ||
        risk.title.toLowerCase().includes(query) ||
        risk.category.toLowerCase().includes(query) ||
        (risk.finding && risk.finding.toLowerCase().includes(query)) ||
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
  const medium = risks.filter((risk) => risk.level === "Medium").length;
  const low = risks.filter((risk) => risk.level === "Low").length;

  async function handleAddRisk() {
    if (!newRisk.title.trim() || !currentWorkspace?.id || !auditId) return;

    setIsSubmitting(true);
    const score = calculateScore(newRisk.likelihood, newRisk.impact);
    const level = calculateLevel(score);

    const res = await createRisk(currentWorkspace.id, {
      auditId,
      title: newRisk.title.trim(),
      description:
        newRisk.description.trim() ||
        "Risk identified during audit assessment.",
      category: newRisk.category,
      finding: newRisk.finding,
      framework: newRisk.framework,
      control: newRisk.control,
      likelihood: newRisk.likelihood,
      impact: newRisk.impact,
      score,
      level,
      treatment: newRisk.treatment,
      owner: newRisk.owner,
      dueDate:
        newRisk.dueDate ||
        new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "Open",
      asset: newRisk.asset,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      const created: Risk = {
        id: res.data.id,
        title: res.data.title,
        description: res.data.description,
        category: res.data.category,
        finding: res.data.finding,
        framework: res.data.framework,
        control: res.data.control,
        likelihood: (res.data.likelihood as Rating) || newRisk.likelihood,
        impact: (res.data.impact as Rating) || newRisk.impact,
        score: res.data.score,
        level: res.data.level,
        treatment: (res.data.treatment as Treatment) || (newRisk.treatment as Treatment),
        owner: res.data.owner,
        dueDate: res.data.due_date,
        residualScore: res.data.residual_score,
        residualLevel: res.data.residual_level,
        status: res.data.status,
        asset: res.data.asset,
        identifiedDate: res.data.identified_date,
      };
      setRisks((current) => [created, ...current]);
      setShowAddModal(false);

      setNewRisk({
        title: "",
        description: "",
        category: "Access Control",
        finding: "FND-001",
        framework: "ISO 27001",
        control: "A.5.15",
        likelihood: "Possible",
        impact: "Possible",
        treatment: "Mitigate",
        owner: OWNERS[0],
        dueDate: "",
        asset: "Core Infrastructure",
      });
    } else {
      alert(res.error || "Failed to create risk");
    }
  }

  async function updateRiskStatus(id: string, status: RiskStatus) {
    if (!currentWorkspace?.id) return;
    const res = await updateRisk(currentWorkspace.id, id, { status });
    if (res.success && res.data) {
      setRisks((current) =>
        current.map((risk) =>
          risk.id === id
            ? {
                ...risk,
                status: res.data.status,
                residualScore: res.data.residual_score,
                residualLevel: res.data.residual_level,
              }
            : risk
        )
      );
    } else {
      alert(res.error || "Failed to update risk status");
    }
    setSelectedRisk(null);
  }

  async function handleDeleteRisk(id: string) {
    if (!currentWorkspace?.id) return;
    if (!confirm("Are you sure you want to delete this risk?")) return;

    const res = await deleteRisk(currentWorkspace.id, id);
    if (res.success) {
      setRisks((current) => current.filter((risk) => risk.id !== id));
      setSelectedRisk(null);
    } else {
      alert(res.error || "Failed to delete risk");
    }
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

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <ShieldAlert
                    className="h-5 w-5 text-red-500"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h1 className="text-[21px] font-semibold">
                    Risk Management
                  </h1>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Risk register for {auditId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Risk
              </button>
            </div>

            {/* SUMMARY */}
            <div className="grid grid-cols-5 border-b border-slate-100">
              <Summary
                label="Total Risks"
                value={String(risks.length)}
              />

              <Summary
                label="Critical"
                value={String(critical)}
                valueClass="text-red-700"
              />

              <Summary
                label="High"
                value={String(high)}
                valueClass="text-red-600"
              />

              <Summary
                label="Medium"
                value={String(medium)}
                valueClass="text-amber-600"
              />

              <Summary
                label="Low"
                value={String(low)}
                valueClass="text-emerald-600"
              />
            </div>

            {/* TOOLBAR */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search risks..."
                  className="h-9 w-[300px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <FilterSelect
                  label="Level"
                  value={levelFilter}
                  options={["All", "Critical", "High", "Medium", "Low"]}
                  onChange={(val) => setLevelFilter(val as RiskLevel | "All")}
                />

                <FilterSelect
                  label="Status"
                  value={statusFilter}
                  options={["All", "Open", "In Treatment", "Mitigated", "Accepted", "Closed"]}
                  onChange={(val) => setStatusFilter(val as RiskStatus | "All")}
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <TableHeader first>Risk</TableHeader>
                    <TableHeader>Finding</TableHeader>
                    <TableHeader>Framework & Control</TableHeader>
                    <TableHeader>Likelihood</TableHeader>
                    <TableHeader>Impact</TableHeader>
                    <TableHeader>Score</TableHeader>
                    <TableHeader>Level</TableHeader>
                    <TableHeader>Treatment</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <th className="w-12 px-3 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-xs text-slate-400">
                        Loading risks...
                      </td>
                    </tr>
                  ) : filteredRisks.map((risk) => (
                    <RiskRow
                      key={risk.id}
                      risk={risk}
                      onOpen={() => setSelectedRisk(risk)}
                    />
                  ))}
                </tbody>
              </table>

              {!loading && filteredRisks.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <ShieldAlert className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-3 text-[12px] font-medium text-slate-600">
                    No risks found
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
                Showing {filteredRisks.length} of {risks.length} risks
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

      {/* ADD RISK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-[700px] rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-slate-800">
                  Add Risk
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  Create a risk for this audit assessment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-5 max-h-[80vh] overflow-y-auto">
              <Field label="Risk Title" className="col-span-2">
                <input
                  value={newRisk.title}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter risk title"
                  className={inputClass}
                />
              </Field>

              <Field label="Description" className="col-span-2">
                <textarea
                  value={newRisk.description}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Describe the risk..."
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </Field>

              <Field label="Category">
                <select
                  value={newRisk.category}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      category: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>

              <Field label="Associated Finding">
                <input
                  value={newRisk.finding}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      finding: event.target.value,
                    })
                  }
                  placeholder="e.g. FND-001"
                  className={inputClass}
                />
              </Field>

              <Field label="Framework">
                <select
                  value={newRisk.framework}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      framework: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option>ISO 27001</option>
                  <option>NIST CSF</option>
                  <option>NIST 800-53</option>
                  <option>NIST RMF</option>
                  <option>SOC 2</option>
                  <option>CIS Controls</option>
                </select>
              </Field>

              <Field label="Control">
                <input
                  value={newRisk.control}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      control: event.target.value,
                    })
                  }
                  placeholder="e.g. A.5.15"
                  className={inputClass}
                />
              </Field>

              <Field label="Likelihood">
                <select
                  value={newRisk.likelihood}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      likelihood: event.target.value as Rating,
                    })
                  }
                  className={inputClass}
                >
                  {RATINGS.map((rating) => (
                    <option key={rating}>{rating}</option>
                  ))}
                </select>
              </Field>

              <Field label="Impact">
                <select
                  value={newRisk.impact}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      impact: event.target.value as Rating,
                    })
                  }
                  className={inputClass}
                >
                  {RATINGS.map((rating) => (
                    <option key={rating}>{rating}</option>
                  ))}
                </select>
              </Field>

              <Field label="Treatment">
                <select
                  value={newRisk.treatment}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      treatment: event.target.value as Treatment,
                    })
                  }
                  className={inputClass}
                >
                  <option>Mitigate</option>
                  <option>Accept</option>
                  <option>Transfer</option>
                  <option>Avoid</option>
                </select>
              </Field>

              <Field label="Owner">
                <select
                  value={newRisk.owner}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
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
                  value={newRisk.dueDate}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      dueDate: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Affected Asset">
                <input
                  value={newRisk.asset}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      asset: event.target.value,
                    })
                  }
                  placeholder="e.g. Core Infrastructure"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-9 rounded-md border border-slate-200 px-4 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!newRisk.title.trim() || isSubmitting}
                onClick={handleAddRisk}
                className="h-9 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Risk"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RISK DETAIL MODAL */}
      {selectedRisk && (
        <RiskDetailModal
          risk={selectedRisk}
          onClose={() => setSelectedRisk(null)}
          onStatusChange={updateRiskStatus}
          onDelete={() => handleDeleteRisk(selectedRisk.id)}
        />
      )}
    </div>
  );
}

/* ============================================================
   SUMMARY
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

      <p className="mt-1 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

/* ============================================================
   TABLE
============================================================ */

function TableHeader({
  children,
  first = false,
}: {
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <th
      className={`px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ${
        first ? "pl-5" : ""
      }`}
    >
      {children}
    </th>
  );
}

function RiskRow({
  risk,
  onOpen,
}: {
  risk: Risk;
  onOpen: () => void;
}) {
  const levelClass =
    risk.level === "Critical"
      ? "bg-red-100 text-red-800"
      : risk.level === "High"
        ? "bg-red-50 text-red-700"
        : risk.level === "Medium"
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700";

  const statusClass =
    risk.status === "Closed"
      ? "bg-emerald-50 text-emerald-700"
      : risk.status === "Accepted"
        ? "bg-slate-100 text-slate-600"
        : risk.status === "Mitigated"
          ? "bg-emerald-50 text-emerald-600"
          : risk.status === "In Treatment"
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50">
            {risk.level === "Critical" ? (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-500" />
            )}
          </div>

          <div>
            <p className="text-[12px] font-medium text-slate-800 hover:text-blue-600">
              {risk.title}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {risk.id} · {risk.category}
            </p>
          </div>
        </button>
      </td>

      <td className="px-3 py-4">
        {risk.finding ? (
          <span className="rounded bg-orange-50 px-2 py-1 text-[10px] font-medium text-orange-700">
            {risk.finding}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">-</span>
        )}
      </td>

      <td className="px-3 py-4">
        <p className="text-[10px] font-medium text-slate-600">
          {risk.framework}
        </p>

        <p className="mt-0.5 text-[9px] text-slate-400">
          {risk.control}
        </p>
      </td>

      <td className="px-3 py-4 text-[10px] text-slate-600">
        {risk.likelihood}
      </td>

      <td className="px-3 py-4 text-[10px] text-slate-600">
        {risk.impact}
      </td>

      <td className="px-3 py-4">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700">
          {risk.score}
        </span>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${levelClass}`}
        >
          {risk.level}
        </span>
      </td>

      <td className="px-3 py-4 text-[10px] font-medium text-slate-600">
        {risk.treatment}
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
          <UserRound className="h-3 w-3 text-slate-400" />
          {risk.owner}
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-1.5 whitespace-nowrap text-[10px] text-slate-500">
          <CalendarDays className="h-3 w-3 text-slate-400" />
          {risk.dueDate}
        </div>
      </td>

      <td className="px-3 py-4">
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass}`}
        >
          {risk.status}
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

/* ============================================================
   DETAIL MODAL
============================================================ */

function RiskDetailModal({
  risk,
  onClose,
  onStatusChange,
  onDelete,
}: {
  risk: Risk;
  onClose: () => void;
  onStatusChange: (id: string, status: RiskStatus) => void;
  onDelete: () => void;
}) {
  const levelClass =
    risk.level === "Critical"
      ? "bg-red-100 text-red-800"
      : risk.level === "High"
        ? "bg-red-50 text-red-700"
        : risk.level === "Medium"
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
      <div className="w-full max-w-[720px] rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </div>

            <div>
              <p className="text-[10px] font-medium text-slate-400">
                {risk.id}
              </p>

              <h2 className="mt-1 text-[16px] font-semibold text-slate-800">
                {risk.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5 max-h-[75vh] overflow-y-auto">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Risk Description
            </p>

            <p className="mt-2 text-[12px] leading-5 text-slate-600">
              {risk.description}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Detail label="Risk Level">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${levelClass}`}
              >
                {risk.level}
              </span>
            </Detail>

            <Detail label="Inherent Score">
              <span className="text-[16px] font-semibold text-slate-800">
                {risk.score}
              </span>
            </Detail>

            <Detail label="Residual Score">
              <span className="text-[16px] font-semibold text-blue-600">
                {risk.residualScore}
              </span>
            </Detail>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Detail label="Finding">{risk.finding || "None"}</Detail>
            <Detail label="Category">{risk.category}</Detail>
            <Detail label="Framework">{risk.framework}</Detail>
            <Detail label="Control">{risk.control}</Detail>
            <Detail label="Likelihood">{risk.likelihood}</Detail>
            <Detail label="Impact">{risk.impact}</Detail>
            <Detail label="Treatment">{risk.treatment}</Detail>
            <Detail label="Owner">{risk.owner}</Detail>
            <Detail label="Due Date">{risk.dueDate}</Detail>
            <Detail label="Residual Level">
              {risk.residualLevel}
            </Detail>
            {risk.asset && <Detail label="Affected Asset">{risk.asset}</Detail>}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Update Status
            </p>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "Open",
                  "In Treatment",
                  "Mitigated",
                  "Accepted",
                  "Closed",
                ] as RiskStatus[]
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    onStatusChange(risk.id, status)
                  }
                  className={`rounded-md border px-3 py-2 text-[10px] font-medium ${
                    risk.status === status
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />

            <p className="text-[10px] leading-4 text-blue-700">
              Residual risk represents the remaining exposure after the
              selected treatment is applied.
            </p>
          </div>
        </div>

        <div className="flex justify-between border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-[11px] font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Risk
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-slate-200 px-4 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM COMPONENTS
============================================================ */

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
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-3">
      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-1 text-[11px] font-medium text-slate-700">
        {children}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  options,
  label,
  onChange,
}: {
  value: string;
  options: string[];
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 appearance-none rounded-md border border-slate-200 bg-white py-0 pl-3 pr-8 text-[11px] text-slate-600 outline-none focus:border-blue-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? `All ${label}` : option}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
export const dynamic = 'force-dynamic';
