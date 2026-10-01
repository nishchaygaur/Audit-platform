"use client";

import { useState, useEffect } from "react";
import {
  Layers3,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Loader2,
  Award,
} from "lucide-react";
import {
  getCrossFrameworkMappings,
  calculateCrossFrameworkReadiness,
  type ControlCrossMapping,
  type CrossReadinessResult,
} from "@/actions/cross-mapping";

interface CrossMappingViewProps {
  workspaceId: string;
  audits?: Array<{ id: string; name: string; framework: string }>;
}

export default function CrossMappingView({
  workspaceId,
  audits = [],
}: CrossMappingViewProps) {
  const [mappings, setMappings] = useState<ControlCrossMapping[]>([]);
  const [readiness, setReadiness] = useState<CrossReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAuditId, setSelectedAuditId] = useState<string>(audits[0]?.id || "AUD-2024-001");
  const [domainFilter, setDomainFilter] = useState("All");
  const [frameworkFilter, setFrameworkFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [mapRes, readyRes] = await Promise.all([
          getCrossFrameworkMappings(),
          selectedAuditId
            ? calculateCrossFrameworkReadiness(workspaceId, selectedAuditId)
            : Promise.resolve({ success: false } as const),
        ]);

        if (mapRes.success) {
          setMappings(mapRes.data);
        }
        if (readyRes.success && readyRes.data) {
          setReadiness(readyRes.data);
        }
      } catch (err) {
        console.error("Failed to load cross mappings:", err);
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      loadData();
    }
  }, [workspaceId, selectedAuditId]);

  const domains = [
    "All",
    "Governance & Policies",
    "Access Control & IAM",
    "Threat & Vulnerability Management",
    "Cloud & Vendor Security",
    "Personnel & Training",
    "Logging & Monitoring",
    "Incident Response",
  ];

  const frameworks = ["All", "ISO 27001", "SOC 2", "NIST CSF", "NIST RMF"];

  const filtered = mappings.filter((m) => {
    const matchesDomain = domainFilter === "All" || m.domain === domainFilter;
    const matchesFw =
      frameworkFilter === "All" ||
      m.sourceFramework.toLowerCase().includes(frameworkFilter.toLowerCase()) ||
      m.targetFramework.toLowerCase().includes(frameworkFilter.toLowerCase());
    const matchesSearch =
      m.sourceControlId.toLowerCase().includes(search.toLowerCase()) ||
      m.sourceControlTitle.toLowerCase().includes(search.toLowerCase()) ||
      m.targetControlId.toLowerCase().includes(search.toLowerCase()) ||
      m.targetControlTitle.toLowerCase().includes(search.toLowerCase()) ||
      m.domain.toLowerCase().includes(search.toLowerCase()) ||
      m.mappingJustification.toLowerCase().includes(search.toLowerCase());

    return matchesDomain && matchesFw && matchesSearch;
  });

  const getOverlapBadge = (level: string, percentage: number) => {
    if (percentage >= 95) {
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
    if (percentage >= 85) {
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  return (
    <div className="space-y-6">
      {/* "Audit Once, Comply with Many" Cross-Readiness Dashboard */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Layers3 className="h-4 w-4" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900">
                Unified Cross-Framework Readiness Engine
              </h3>
            </div>
            <p className="mt-1 text-[12px] text-slate-600 max-w-xl">
              <strong className="text-blue-700">Audit once, satisfy multiple standards:</strong> Controls evidenced in your primary audit engagement automatically substantiate compliance requirements across external frameworks.
            </p>
          </div>

          {audits.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Active Audit:</span>
              <select
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.framework})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Readiness Cards */}
        {readiness && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {readiness.targets.map((tgt) => (
              <div
                key={tgt.framework}
                className="rounded-xl border border-white/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-800">
                    {tgt.framework}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      tgt.readinessScore >= 80
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : tgt.readinessScore >= 50
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {tgt.status}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {tgt.readinessScore}%
                  </span>
                  <span className="text-[11px] text-slate-500">
                    readiness mapped
                  </span>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      tgt.readinessScore >= 80 ? "bg-emerald-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${tgt.readinessScore}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Satisfied: {tgt.satisfiedControlsCount} controls</span>
                  <span>Gaps: {tgt.gapControlsCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cross-walk controls or justification..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[12px] text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                Domain: {d}
              </option>
            ))}
          </select>

          <select
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 focus:border-blue-500 focus:outline-hidden"
          >
            {frameworks.map((f) => (
              <option key={f} value={f}>
                Framework: {f}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[12px] text-slate-500 font-medium">
          Showing {filtered.length} cross-walk mappings
        </div>
      </div>

      {/* Cross-Walk Matrix Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers3 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-[13px] font-medium">No cross-walk mappings matched your filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Domain</th>
                  <th className="px-4 py-3">Source Framework Control</th>
                  <th className="px-4 py-3 text-center">Alignment</th>
                  <th className="px-4 py-3">Target Framework Control</th>
                  <th className="px-5 py-3">Mapping Justification & Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {m.domain}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                          {m.sourceFramework}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {m.sourceControlId}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 max-w-xs truncate">
                        {m.sourceControlTitle}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getOverlapBadge(
                            m.coverageLevel,
                            m.overlapPercentage
                          )}`}
                        >
                          {m.overlapPercentage}% Overlap
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {m.coverageLevel}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                          {m.targetFramework}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {m.targetControlId}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 max-w-xs truncate">
                        {m.targetControlTitle}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-[11px] text-slate-600 leading-relaxed max-w-md">
                        {m.mappingJustification}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
