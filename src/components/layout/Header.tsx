"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Bell,
  CircleHelp,
  ChevronDown,
  X,
  LogOut,
  Sliders,
  UsersRound,
  FileCheck2,
  ClipboardList,
  TriangleAlert,
  ShieldCheck,
  FileText,
  BookOpenCheck,
  FileSpreadsheet,
  Check,
  Clock,
  Loader2,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/actions/auth";
import { globalSearch, type SearchResultItem } from "@/actions/search";
import { getAuditTrail, type AuditTrailRecord } from "@/actions/audit-trail";
import { hasPermission } from "@/lib/rbac";

export default function Header() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();

  // Dropdown & Modal States
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<AuditTrailRecord[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Refs for click outside
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch recent notifications
  const loadNotifications = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoadingNotifications(true);
    try {
      const res = await getAuditTrail(currentWorkspace.id, { limit: 5 });
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingNotifications(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !currentWorkspace?.id) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await globalSearch(currentWorkspace.id, searchQuery);
        if (res.success) {
          setSearchResults(res.data);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, currentWorkspace?.id]);

  async function handleLogout() {
    setUserMenuOpen(false);
    await signOut();
  }

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userRole = currentWorkspace?.role || user?.role || "Viewer";
  const userInitials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getResultIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "Audit":
        return <ClipboardList className="h-4 w-4 text-blue-600" />;
      case "Audit Plan":
        return <FileCheck2 className="h-4 w-4 text-indigo-600" />;
      case "Finding":
        return <TriangleAlert className="h-4 w-4 text-amber-600" />;
      case "Risk":
        return <ShieldCheck className="h-4 w-4 text-rose-600" />;
      case "Evidence":
        return <FileText className="h-4 w-4 text-teal-600" />;
      case "Framework":
        return <Building2 className="h-4 w-4 text-purple-600" />;
      case "Control":
        return <BookOpenCheck className="h-4 w-4 text-sky-600" />;
      case "Report":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[86px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Building2 className="h-7 w-7 text-blue-600" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[27px] font-medium leading-none tracking-[-0.6px] text-slate-900">
                {currentWorkspace.name || "No Workspace"}
              </h2>
              <span className="shrink-0 rounded-md bg-violet-50 px-3 py-1 text-[12px] font-medium text-indigo-700">
                Workspace
              </span>
            </div>
            <p className="mt-1.5 truncate text-[14px] text-slate-500">
              {currentWorkspace.description || "Organization Workspace"}
            </p>
          </div>
        </div>

        <div className="ml-6 flex shrink-0 items-center gap-5">
          {/* SEARCH BUTTON */}
          {/* SEARCH BUTTON */}
          <button
            type="button"
            id="header-search-btn"
            data-testid="header-search-button"
            aria-label="Search"
            onClick={() => {
              setSearchOpen(true);
              setSearchQuery("");
              setSearchResults([]);
            }}
            className="text-slate-600 transition hover:text-blue-600 focus:outline-hidden"
          >
            <Search className="h-5 w-5" strokeWidth={1.8} />
          </button>

          {/* NOTIFICATIONS BUTTON & POPOVER */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              id="header-notifications-btn"
              data-testid="header-notifications-button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setHasUnread(false);
                loadNotifications();
              }}
              className="relative text-slate-600 transition hover:text-blue-600 focus:outline-hidden"
            >
              <Bell className="h-5 w-5" strokeWidth={1.8} />
              {hasUnread && notifications.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div
                id="header-notifications-popover"
                data-testid="notifications-popover"
                className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Notifications & Activity
                  </span>
                  <Link
                    href="/audit-trail"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    View audit trail →
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto py-1">
                  {loadingNotifications ? (
                    <div className="flex items-center justify-center py-6 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-xs">Loading activity...</span>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg p-2.5 transition hover:bg-slate-50"
                      >
                        <p className="text-xs font-medium text-slate-800 leading-tight">
                          {n.description}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>{n.user_name || "System"}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No recent activity recorded
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* HELP BUTTON */}
          <button
            type="button"
            id="header-help-btn"
            data-testid="header-help-button"
            aria-label="Help"
            onClick={() => setHelpOpen(true)}
            className="text-slate-600 transition hover:text-blue-600 focus:outline-hidden"
          >
            <CircleHelp className="h-5 w-5" strokeWidth={1.8} />
          </button>

          {/* USER AVATAR & DROPDOWN */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              id="header-user-btn"
              data-testid="user-menu-button"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-slate-100 focus:outline-hidden"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-[13px] font-semibold text-violet-700">
                {userInitials}
              </span>
              <div className="hidden text-left sm:block">
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                  {userName}
                </p>
                <span className="text-[11px] font-medium text-indigo-600">
                  {userRole}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div
                id="header-user-menu"
                data-testid="user-dropdown-menu"
                className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-100"
              >
                <div className="border-b border-slate-100 px-3.5 py-3 bg-slate-50/70 rounded-t-lg">
                  <p className="text-[13px] font-semibold text-slate-900 leading-tight">
                    {userName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 mt-0.5">
                    {userEmail}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {userRole}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentWorkspace?.name}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/workspaces"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[12.5px] text-slate-700 transition hover:bg-slate-100"
                  >
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Switch Workspace
                  </Link>

                  {hasPermission(currentWorkspace?.role, "workspace.manage") && (
                    <Link
                      href="/administration"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[12.5px] text-slate-700 transition hover:bg-slate-100"
                    >
                      <UsersRound className="h-4 w-4 text-slate-400" />
                      Team & Permissions
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[12.5px] text-slate-700 transition hover:bg-slate-100"
                  >
                    <Sliders className="h-4 w-4 text-slate-400" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    data-testid="sign-out-button"
                    onClick={handleLogout}
                    className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[12.5px] font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================
          GLOBAL SEARCH MODAL
      ====================================================== */}
      {searchOpen && (
        <div
          data-testid="global-search-modal"
          onKeyDown={(e) => {
            if (e.key === "Escape") setSearchOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-20 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 bg-slate-50/70">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                autoFocus
                data-testid="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audits, controls, findings, risks, evidence, reports..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div data-testid="global-search-results" className="max-h-96 overflow-y-auto p-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2 text-xs">Searching platform...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(item.url);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          {getResultIcon(item.type)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  No matching results found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Type at least 2 characters to search across this workspace.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400 flex justify-between">
              <span>Quick navigation across all workspace resources</span>
              <span>Press ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          HELP & DOCUMENTATION MODAL
      ====================================================== */}
      {helpOpen && (
        <div
          data-testid="help-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <CircleHelp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Audit & GRC Knowledge Base
                  </h3>
                  <p className="text-xs text-slate-500">
                    Governance, Risk & Compliance Quick Reference
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="close-help-modal-button"
                onClick={() => setHelpOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700 text-xs leading-relaxed">
              <div>
                <h4 className="font-semibold text-sm text-slate-900 mb-1.5">
                  1. Audit Lifecycle
                </h4>
                <p className="text-slate-600 mb-2">
                  Audits follow a strict 5-stage lifecycle ensuring thorough governance:
                </p>
                <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                  <div className="rounded-lg bg-slate-100 p-2 font-medium">1. Planning</div>
                  <div className="rounded-lg bg-blue-50 text-blue-700 p-2 font-medium">2. Fieldwork</div>
                  <div className="rounded-lg bg-indigo-50 text-indigo-700 p-2 font-medium">3. Review</div>
                  <div className="rounded-lg bg-purple-50 text-purple-700 p-2 font-medium">4. Reporting</div>
                  <div className="rounded-lg bg-emerald-50 text-emerald-700 p-2 font-medium">5. Completed</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-semibold text-sm text-slate-900 mb-1.5">
                  2. 5 Roles & Access Model
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold w-20 text-purple-700">Owner:</span>
                    <span>Full workspace authority, user management, workspace settings and deletion.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold w-20 text-blue-700">Admin:</span>
                    <span>Administrative management of audits, assessments, evidence, and team membership.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold w-20 text-cyan-700">Auditor:</span>
                    <span>Conducts assessments, creates and updates findings, evidence, risks and audit plans.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold w-20 text-green-700">Reviewer:</span>
                    <span>Reviews evidence, approves control assessments, reviews risks and generates reports.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold w-20 text-slate-600">Viewer:</span>
                    <span>Read-only visibility into published audits, compliance metrics and reports.</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-semibold text-sm text-slate-900 mb-1.5">
                  3. Evidence & Finding Statuses
                </h4>
                <p className="text-slate-600 mb-2">
                  Evidence flows: <span className="font-semibold">Requested → Submitted → Under Review → Accepted / Rejected</span>.
                </p>
                <p className="text-slate-600">
                  Findings lifecycle: <span className="font-semibold">Open → In Progress → Remediated → Accepted Risk → Closed</span> with severities Critical, High, Medium, Low, Informational.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-semibold text-sm text-slate-900 mb-1.5">
                  4. Multi-Workspace Isolation
                </h4>
                <p className="text-slate-600">
                  Data in each organization workspace is strictly isolated at the PostgreSQL database boundary. Role permissions are evaluated per workspace.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex justify-end">
              <button
                type="button"
                data-testid="close-help-modal-button"
                onClick={() => setHelpOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
