"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import {
  getAuditTrail,
  getAuditTrailStats,
  type AuditTrailRecord,
  type AuditTrailFilters,
} from "@/actions/audit-trail";
import {
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  User,
  Shield,
  FileText,
  TriangleAlert,
  ClipboardList,
  ShieldCheck,
  Building2,
  UsersRound,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowUpDown,
  Activity,
  AlertCircle,
  FileSpreadsheet,
  Info,
} from "lucide-react";

const ENTITY_TYPE_OPTIONS = [
  "All",
  "Audit",
  "Evidence",
  "Finding",
  "Risk",
  "Member",
  "Workspace",
  "Report",
  "Assessment",
];

const ACTION_OPTIONS = [
  "All",
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "ACCESS",
  "EXPORT",
];

export default function AuditTrailPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [records, setRecords] = useState<AuditTrailRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<{
    totalEvents: number;
    todayEvents: number;
    entityBreakdown: { entity_type: string; count: number }[];
    actionBreakdown: { action: string; count: number }[];
  } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");
  const [selectedDatePreset, setSelectedDatePreset] = useState<
    "all" | "today" | "7days" | "30days" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<AuditTrailRecord | null>(
    null
  );
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // View Mode: "table" | "timeline"
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  // Calculate Date Filters
  const dateFilterValues = useMemo(() => {
    const now = new Date();
    if (selectedDatePreset === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (selectedDatePreset === "7days") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (selectedDatePreset === "30days") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (selectedDatePreset === "custom") {
      return {
        startDate: customStartDate ? new Date(customStartDate).toISOString() : undefined,
        endDate: customEndDate ? new Date(customEndDate + "T23:59:59").toISOString() : undefined,
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [selectedDatePreset, customStartDate, customEndDate]);

  const loadAuditData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setRefreshing(true);
    setError(null);

    const filterPayload: AuditTrailFilters = {
      search: searchTerm.trim() || undefined,
      entityType: selectedEntity !== "All" ? selectedEntity : undefined,
      action: selectedAction !== "All" ? selectedAction : undefined,
      startDate: dateFilterValues.startDate,
      endDate: dateFilterValues.endDate,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };

    try {
      const [trailRes, statsRes] = await Promise.all([
        getAuditTrail(currentWorkspace.id, filterPayload),
        getAuditTrailStats(currentWorkspace.id),
      ]);

      if (trailRes.success && trailRes.data) {
        setRecords(trailRes.data);
        setTotalCount(trailRes.total || trailRes.data.length);
      } else {
        setError(trailRes.error || "Failed to load audit trail");
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching data";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    currentWorkspace?.id,
    searchTerm,
    selectedEntity,
    selectedAction,
    dateFilterValues,
    pageSize,
    page,
  ]);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedEntity, selectedAction, selectedDatePreset, customStartDate, customEndDate]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      "ID",
      "Timestamp",
      "User Name",
      "User Email",
      "Action",
      "Entity Type",
      "Entity ID",
      "Description",
      "Details",
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.created_at}"`,
      `"${r.user_name.replace(/"/g, '""')}"`,
      `"${r.user_email.replace(/"/g, '""')}"`,
      `"${r.action}"`,
      `"${r.entity_type}"`,
      `"${r.entity_id}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${(r.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `audit_trail_${currentWorkspace?.name || "workspace"}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyJson = (details: string) => {
    navigator.clipboard.writeText(details);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Helper for Action Badge Styling
  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            CREATE
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            UPDATE
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            DELETE
          </span>
        );
      case "STATUS_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            STATUS CHANGE
          </span>
        );
      case "ACCESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
            ACCESS
          </span>
        );
      case "EXPORT":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700 border border-cyan-200">
            EXPORT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  // Helper for Entity Icon
  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case "audit":
        return <ClipboardList className="h-3.5 w-3.5 text-blue-600" />;
      case "evidence":
        return <FileText className="h-3.5 w-3.5 text-indigo-600" />;
      case "finding":
        return <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />;
      case "risk":
        return <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />;
      case "member":
        return <UsersRound className="h-3.5 w-3.5 text-teal-600" />;
      case "workspace":
        return <Building2 className="h-3.5 w-3.5 text-purple-600" />;
      case "report":
        return <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />;
      case "assessment":
        return <FileCheck2 className="h-3.5 w-3.5 text-cyan-600" />;
      default:
        return <Layers className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  // Format Date & Time
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        relative: getRelativeTimeString(date),
      };
    } catch {
      return { date: isoString, time: "", relative: "" };
    }
  };

  const getRelativeTimeString = (date: Date) => {
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* ============================================================
          TOP HEADER
      ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Audit Trail & Activity History
              </h1>
              <p className="text-sm text-slate-500">
                Immutable, workspace-scoped chronological log of all governance and compliance events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="refresh-audit-trail-btn"
            onClick={loadAuditData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            id="export-audit-trail-btn"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ============================================================
          METRICS CARDS
      ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Logged Events
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats ? stats.totalEvents : records.length}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>Workspace: {currentWorkspace?.name || "Active"}</span>
          </div>
        </div>

        {/* Today's Events */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Events Today
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats ? stats.todayEvents : 0}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 font-medium">
            <span>Active monitoring</span>
          </div>
        </div>

        {/* Most Active Entity */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Top Entity Activity
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.entityBreakdown?.[0]?.entity_type || "N/A"}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>
              {stats?.entityBreakdown?.[0]
                ? `${stats.entityBreakdown[0].count} events logged`
                : "No events"}
            </span>
          </div>
        </div>

        {/* Status / State Changes */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              State Changes
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ArrowUpDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {stats?.actionBreakdown?.find((a) => a.action === "STATUS_CHANGE")
              ?.count || 0}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>Transitions & workflows</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          FILTERS & CONTROLS
      ============================================================ */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="audit-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, description, user, email, or entity ID..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Entity & Action Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Entity:</span>
              <select
                id="audit-entity-filter"
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {ENTITY_TYPE_OPTIONS.map((ent) => (
                  <option key={ent} value={ent}>
                    {ent}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Action:</span>
              <select
                id="audit-action-filter"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {ACTION_OPTIONS.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewMode === "timeline"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Tabs & Presets */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Timeframe:</span>
            {[
              { label: "All Time", value: "all" },
              { label: "Today", value: "today" },
              { label: "Last 7 Days", value: "7days" },
              { label: "Last 30 Days", value: "30days" },
              { label: "Custom Range", value: "custom" },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setSelectedDatePreset(preset.value as any)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  selectedDatePreset === preset.value
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {selectedDatePreset === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
          )}

          {(searchTerm ||
            selectedEntity !== "All" ||
            selectedAction !== "All" ||
            selectedDatePreset !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedEntity("All");
                setSelectedAction("All");
                setSelectedDatePreset("all");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          ERROR MESSAGE
      ============================================================ */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================
          MAIN CONTENT VIEW
      ============================================================ */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs text-slate-500">Loading audit history...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 px-4 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            No audit records found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {searchTerm || selectedEntity !== "All" || selectedAction !== "All"
              ? "No events match your selected filters. Try broadening your search or resetting filters."
              : "As actions and governance changes occur in this workspace, they will automatically be recorded here in immutable chronological order."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor / User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Reference / Target</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => {
                  const ts = formatTimestamp(record.created_at);
                  const userInitials = record.user_name
                    ? record.user_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U";

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/75 transition cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        <div className="font-medium text-slate-900">
                          {ts.date}
                        </div>
                        <div className="text-[10.5px] text-slate-400">
                          {ts.time} ({ts.relative})
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                            {userInitials}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {record.user_name}
                            </div>
                            <div className="text-[10.5px] text-slate-400">
                              {record.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {getActionBadge(record.action)}
                      </td>

                      {/* Entity */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          {getEntityIcon(record.entity_type)}
                          <span>{record.entity_type}</span>
                        </div>
                      </td>

                      {/* Reference / Entity ID */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="font-mono text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {record.entity_id}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="max-w-md px-4 py-3.5 text-slate-700">
                        <p className="line-clamp-2 leading-relaxed">
                          {record.description}
                        </p>
                      </td>

                      {/* Details Button */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="relative border-l-2 border-slate-100 pl-6 space-y-8 ml-3">
            {records.map((record) => {
              const ts = formatTimestamp(record.created_at);
              return (
                <div key={record.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-blue-500 shadow-xs">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition group-hover:border-slate-200 group-hover:bg-white group-hover:shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(record.action)}
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                          {getEntityIcon(record.entity_type)}
                          {record.entity_type}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-200/60 px-1.5 py-0.2 rounded">
                          {record.entity_id}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {ts.date} at {ts.time} ({ts.relative})
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-medium text-slate-800">
                      {record.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <span>
                          {record.user_name} ({record.user_email})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          PAGINATION BAR
      ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            of <strong className="text-slate-800">{totalCount}</strong> events
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <span className="px-2 text-xs font-medium text-slate-700">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================
          RECORD DETAIL MODAL / DRAWER
      ============================================================ */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">
                    Audit Event Inspection
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Event Reference: {selectedRecord.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-5 text-xs">
              {/* Event Summary Banner */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/75 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Action Type
                  </span>
                  {getActionBadge(selectedRecord.action)}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {selectedRecord.description}
                </div>
              </div>

              {/* Core Attributes Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-100 p-3 bg-white">
                  <span className="text-[10.5px] font-medium uppercase text-slate-400">
                    Timestamp
                  </span>
                  <div className="mt-1 font-medium text-slate-800">
                    {formatTimestamp(selectedRecord.created_at).date}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatTimestamp(selectedRecord.created_at).time} (UTC)
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 p-3 bg-white">
                  <span className="text-[10.5px] font-medium uppercase text-slate-400">
                    Actor / User
                  </span>
                  <div className="mt-1 font-medium text-slate-800">
                    {selectedRecord.user_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedRecord.user_email}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 p-3 bg-white">
                  <span className="text-[10.5px] font-medium uppercase text-slate-400">
                    Target Entity Type
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-800">
                    {getEntityIcon(selectedRecord.entity_type)}
                    <span>{selectedRecord.entity_type}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 p-3 bg-white">
                  <span className="text-[10.5px] font-medium uppercase text-slate-400">
                    Entity ID / Key
                  </span>
                  <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-slate-800">
                    <span>{selectedRecord.entity_id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(selectedRecord.entity_id)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedId ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Structured Details JSON */}
              {selectedRecord.details ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Structured Payload & Changed Fields
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyJson(selectedRecord.details)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Copied JSON
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy JSON
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-slate-100 max-h-48 leading-relaxed">
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedRecord.details);
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        return selectedRecord.details;
                      }
                    })()}
                  </pre>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
                  No additional change payload recorded for this event.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
