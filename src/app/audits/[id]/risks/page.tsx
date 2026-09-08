"use client";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getRisks } from "@/actions/risks";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";

type RiskLevel = "Critical" | "High" | "Medium" | "Low";
type RiskStatus = "Open" | "In Treatment" | "Accepted" | "Closed";
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
};

const INITIAL_RISKS: Risk[] = [
  {
    id: "RSK-001",
    title: "Unauthorized privileged access",
    description:
      "Excessive or unauthorized privileged access could allow inappropriate changes to critical systems.",
    category: "Access Control",
    finding: "FND-001",
    framework: "ISO 27001",
    control: "A.5.15",
    likelihood: "Likely",
    impact: "Almost Certain",
    score: 20,
    level: "Critical",
    treatment: "Mitigate",
    owner: "John Carter",
    dueDate: "30 Jun 2024",
    residualScore: 8,
    residualLevel: "Medium",
    status: "Open",
  },
  {
    id: "RSK-002",
    title: "Loss of sensitive customer information",
    description:
      "Inadequate protection of sensitive information may result in disclosure or unauthorized access.",
    category: "Data Protection",
    finding: "FND-002",
    framework: "ISO 27001",
    control: "A.5.34",
    likelihood: "Possible",
    impact: "Almost Certain",
    score: 15,
    level: "High",
    treatment: "Mitigate",
    owner: "Emily Davis",
    dueDate: "05 Jul 2024",
    residualScore: 6,
    residualLevel: "Medium",
    status: "In Treatment",
  },
  {
    id: "RSK-003",
    title: "Cloud service security misconfiguration",
    description:
      "Incorrect cloud configuration could expose services or sensitive organizational information.",
    category: "Cloud Security",
    finding: "FND-003",
    framework: "NIST CSF",
    control: "PR.AC-03",
    likelihood: "Possible",
    impact: "Likely",
    score: 12,
    level: "High",
    treatment: "Mitigate",
    owner: "Michael Lee",
    dueDate: "12 Jul 2024",
    residualScore: 6,
    residualLevel: "Medium",
    status: "In Treatment",
  },
  {
    id: "RSK-004",
    title: "Insufficient security awareness",
    description:
      "Insufficient employee security awareness may increase the likelihood of humanrror incidents.",
    category: "Human Resources",
    finding: "FND-004",
    framework: "ISO 27001",
    control: "A.6.3",
    likelihood: "Unlikely",
    impact: "Likely",
    score: 8,
    level: "Medium",
    treatment: "Mitigate",
    owner: "Alice Smith",
    dueDate: "20 Jul 2024",
    residualScore: 4,
    residualLevel: "Medium",
    status: "Open",
  },
  {
    id: "RSK-005",
    title: "Third-party service disruption",
    description:
      "A disruption at a critical supplier could affect the availability of business services.",
    category: "Third Party",
    finding: "FND-005",
    framework: "NIST CSF",
    control: "ID.SC-02",
    likelihood: "Unlikely",
    impact: "Possible",
    score: 6,
    level: "Medium",
    treatment: "Accept",
    owner: "David Wilson",
    dueDate: "25 Jul 2024",
    residualScore: 3,
    residualLevel: "Low",
    status: "Accepted",
  },
];

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

  return values[rating];
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
  const auditId = params.id;

  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();
  
  useEffect(() => {
    if (currentWorkspace?.id && params.id) {
      getRisks(currentWorkspace.id, params.id as string).then((res: any) => {
        if (res.success && res.data) {
          setRisks(res.data.map((r: any) => ({...r, dueDate: r.due_date, residualScore: r.residual_score, residualLevel: r.residual_level})));
        }
        setLoading(false);
      });
    } else {
      setRisks([]);
      setLoading(false);
    }
  }, [currentWorkspace?.id, params.id]);
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
  });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading risks...</div>;
  const filteredRisks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return risks.filter((risk) => {
      const matchesSearch =
        !query ||
        risk.id.toLowerCase().includes(query) ||
        risk.title.toLowerCase().includes(query) ||
        risk.category.toLowerCase().includes(query) ||
        risk.finding.toLowerCase().includes(query) ||
        risk.owner.toLowerCase().includes(query);

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

  function addRisk() {
    if (!newRisk.title.trim()) return;

    const score = calculateScore(
      newRisk.likelihood,
      newRisk.impact,
    );

    const level = calculateLevel(score);

    const risk: Risk = {
      id: `RSK-${String(risks.length + 1).padStart(3, "0")}`,
      title: newRisk.title.trim(),
      description:
        newRisk.description.trim() ||
        "Risk identified during the audit assessment.",
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
      dueDate: newRisk.dueDate
        ? new Date(`${newRisk.dueDate}T00:00:00`).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            },
          )
        : "Not set",
      residualScore: score,
      residualLevel: level,
      status: "Open",
    };

    setRisks((current) => [...current, risk]);
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
    });
  }

  function updateRiskStatus(id: string, status: RiskStatus) {
    setRisks((current) =>
      current.map((risk) =>
        risk.id === id
          ? {
              ...risk,
              status,
              residualScore:
                status === "Closed"
                  ? 0
                  : status === "Accepted"
                    ? Math.max(1, Math.round(risk.score * 0.35))
                    : risk.residualScore,
              residualLevel:
                status === "Closed"
                  ? "Low"
                  : status === "Accepted"
                    ? calculateLevel(
                        Math.max(1, Math.round(risk.score * 0.35)),
                      )
                    : risk.residualLevel,
            }
          : risk,
      ),
    );

    setSelectedRisk(null);
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
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </button>

                <FilterSelect
                  value={levelFilter}
                  options={[
                    "All",
                    "Critical",
                    "High",
                    "Medium",
                    "Low",
                  ]}
                  label="Risk level"
                  onChange={(value) =>
                    setLevelFilter(value as RiskLevel | "All")
                  }
                />

                <FilterSelect
                  value={statusFilter}
                  options={[
                    "All",
                    "Open",
                    "In Treatment",
                    "Accepted",
                    "Closed",
                  ]}
                  label="Status"
                  onChange={(value) =>
                    setStatusFilter(value as RiskStatus | "All")
                  }
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                    <TableHeader first>Risk</TableHeader>
                    <TableHeader>Finding</TableHeader>
                    <TableHeader>Framework / Control</TableHeader>
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
                  {filteredRisks.map((risk) => (
                    <RiskRow
                      key={risk.id}
                      risk={risk}
                      onOpen={() => setSelectedRisk(risk)}
                    />
                  ))}
                </tbody>
              </table>

              {filteredRisks.length === 0 && (
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

            <div className="grid grid-cols-2 gap-4 px-6 py-5">
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

              <Field label="Finding">
                <input
                  value={newRisk.finding}
                  onChange={(event) =>
                    setNewRisk({
                      ...newRisk,
                      finding: event.target.value,
                    })
                  }
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
                disabled={!newRisk.title.trim()}
                onClick={addRisk}
                className="h-9 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Risk
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
        <span className="rounded bg-orange-50 px-2 py-1 text-[10px] font-medium text-orange-700">
          {risk.finding}
        </span>
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
}: {
  risk: Risk;
  onClose: () => void;
  onStatusChange: (id: string, status: RiskStatus) => void;
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

        <div className="space-y-5 px-6 py-5">
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
            <Detail label="Finding">{risk.finding}</Detail>
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
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Risk Status
            </p>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "Open",
                  "In Treatment",
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

        <div className="flex justifynd border-t border-slate-100 px-6 py-4">
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

      <ChevronDown className="pointervents-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
export const dynamic = 'force-dynamic';
