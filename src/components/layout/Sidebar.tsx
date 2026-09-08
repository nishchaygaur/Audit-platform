"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/rbac";
import { signOut } from "@/actions/auth";


import {
  LayoutDashboard,
  ClipboardList,
  FileCheck2,
  FileText,
  TriangleAlert,
  ShieldCheck,
  Building2,
  Wrench,
  BarChart3,
  ListChecks,
  CalendarDays,
  Settings,
  UsersRound,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Shield,
  Check,
  BookOpenCheck,
  LogOut,
  Sliders,
  X,
  Sparkles,
  History,
} from "lucide-react";

import { useWorkspace } from "@/context/WorkspaceContext";

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href: string;
  badge?: string;
  badgeTone?: string;
}

const mainNavigation: NavItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    name: "Audits",
    icon: ClipboardList,
    href: "/audits",
    badge: "3",
  },
  {
    name: "Audit Plans",
    icon: FileCheck2,
    href: "/audit-plans",
  },
  {
    name: "Evidence",
    icon: FileText,
    href: "/evidence",
  },
  {
    name: "Findings",
    icon: TriangleAlert,
    href: "/findings",
    badge: "4",
    badgeTone: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  {
    name: "Risk Management",
    icon: ShieldCheck,
    href: "/risk-management",
  },
  {
    name: "Frameworks",
    icon: Building2,
    href: "/frameworks",
  },
  {
    name: "Remediation",
    icon: Wrench,
    href: "/remediation",
  },
  {
    name: "Control Library",
    icon: BookOpenCheck,
    href: "/control-library",
  },
  {
    name: "Reports",
    icon: BarChart3,
    href: "/reports",
  },
  {
    name: "Audit Trail",
    icon: History,
    href: "/audit-trail",
  },
  {
    name: "Tasks",
    icon: ListChecks,
    href: "/tasks",
    badge: "5",
  },
  {
    name: "Calendar",
    icon: CalendarDays,
    href: "/calendar",
  },
];

export default function Sidebar() {  const { user } = useAuth();  
  const {
    workspaces,
    currentWorkspace,
    setWorkspace,
  } = useWorkspace();

  const router = useRouter();
  const pathname = usePathname();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Create Workspace Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [newWorkspaceFramework, setNewWorkspaceFramework] = useState("ISO 27001");
  const [newWorkspaceIndustry, setNewWorkspaceIndustry] = useState("Technology & SaaS");

  const workspaceRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (workspaceRef.current && !workspaceRef.current.contains(target)) {
        setWorkspaceOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Hide sidebar on standalone auth or dedicated workspace selection screens
  if (pathname === "/signin" || pathname === "/workspaces") {
    return null;
  }

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(search.toLowerCase())
  );

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;


    setNewWorkspaceName("");
    setNewWorkspaceDesc("");
    setShowCreateModal(false);
    setWorkspaceOpen(false);
  }

  async function handleLogout() {
    setUserMenuOpen(false);
    await signOut();
  }

  return (
    <>
      <aside
        id="app-sidebar"
        aria-label="Main Application Sidebar"
        className="fixed left-0 top-0 z-40 flex h-screen w-[250px] flex-col bg-[#031b3d] text-white shadow-xl"
      >
        {/* ======================================================
            LOGO & BRAND (Clickable to Home/Dashboard)
        ====================================================== */}
        <Link
          href="/dashboard"
          id="sidebar-brand-link"
          className="flex h-[64px] shrink-0 items-center gap-3 px-5 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/30 ring-1 ring-blue-500/40">
            <Shield className="h-6 w-6 text-blue-400" strokeWidth={2} />
          </div>

          <div className="leading-[1.1]">
            <div className="text-[17px] font-bold tracking-wide text-white">
              AUDIT
            </div>
            <div className="text-[12px] font-medium tracking-wider text-blue-300">
              PLATFORM
            </div>
          </div>
        </Link>

        {/* ======================================================
            WORKSPACE SELECTOR
        ====================================================== */}
        <div ref={workspaceRef} className="relative shrink-0 px-3.5 pb-2">
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Active Workspace
          </div>

          <button
            type="button"
            id="workspace-selector-btn"
            aria-expanded={workspaceOpen}
            aria-haspopup="true"
            onClick={() => {
              setWorkspaceOpen((open) => !open);
              setSearch("");
            }}
            className={`flex h-[38px] w-full items-center justify-between rounded-lg border px-3 text-[13px] transition ${
              workspaceOpen
                ? "border-blue-400 bg-[#0b315f] text-white"
                : "border-blue-500/50 bg-[#092954] text-slate-100 hover:bg-[#0d366a]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-blue-400" />
              <span className="truncate font-medium">
                {currentWorkspace?.name || "Select Workspace"}
              </span>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-blue-300 transition-transform ${
                workspaceOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* WORKSPACE DROPDOWN */}
          {workspaceOpen && (
            <div
              id="workspace-dropdown-menu"
              className="absolute left-3.5 right-3.5 top-[64px] z-50 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Search */}
              <div className="flex h-[36px] items-center gap-2 border-b border-slate-100 px-3 bg-slate-50/70">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search workspaces..."
                  className="w-full bg-transparent text-[12px] outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Workspace list */}
              <div className="max-h-[190px] overflow-y-auto py-1">
                {filteredWorkspaces.length > 0 ? (
                  filteredWorkspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        setWorkspace(workspace.id);
                        setWorkspaceOpen(false);
                        setSearch("");
                      }}
                      className="flex h-[36px] w-full items-center justify-between px-3 text-left text-[12.5px] transition hover:bg-slate-100"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span className="truncate font-medium text-slate-800">
                          {workspace.name}
                        </span>
                      </span>

                      {currentWorkspace?.id === workspace.id && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-[12px] text-slate-500">
                    No workspaces found
                  </div>
                )}
              </div>

              {/* Workspace actions */}
              <div className="border-t border-slate-100 bg-slate-50/50 p-1">
                <button
                  type="button"
                  id="create-workspace-btn"
                  onClick={() => {
                    setWorkspaceOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="flex h-[34px] w-full items-center gap-2.5 rounded px-2.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Workspace
                </button>

                <Link
                  href="/settings"
                  id="workspace-settings-link"
                  onClick={() => setWorkspaceOpen(false)}
                  className="flex h-[34px] w-full items-center gap-2.5 rounded px-2.5 text-[12px] text-slate-600 transition hover:bg-slate-100"
                >
                  <Sliders className="h-3.5 w-3.5 text-slate-500" />
                  Workspace Settings
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================
            MAIN NAVIGATION (Smooth Scrollable for all screen heights)
        ====================================================== */}
        <nav
          aria-label="Sidebar Navigation"
          className="min-h-0 flex-1 overflow-y-auto px-3 py-1.5 space-y-0.5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]"
        >
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                id={`sidebar-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                aria-current={active ? "page" : undefined}
                className={`group flex h-[34px] w-full items-center justify-between rounded-lg px-2.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icon
                    className={`h-[16px] w-[16px] shrink-0 transition ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-blue-300"
                    }`}
                    strokeWidth={1.9}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      item.badgeTone ||
                      (active
                        ? "bg-white/20 text-white"
                        : "bg-blue-900/60 text-blue-200 border border-blue-400/30")
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Section Divider */}
          <div className="pt-2 pb-1">
            <div className="border-t border-slate-700/80" />
            <div className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              System & Management
            </div>
          </div>

          {/* Administration */}
          {hasPermission(currentWorkspace?.role, "workspace.manage") && (
            <Link
              href="/administration"
              id="sidebar-nav-administration"
              aria-current={isActive("/administration") ? "page" : undefined}
              className={`group flex h-[34px] w-full items-center justify-between rounded-lg px-2.5 text-[13px] font-medium transition ${
                isActive("/administration")
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2
                  className={`h-4 w-4 ${
                    isActive("/administration") ? "text-blue-400" : "text-slate-400"
                  }`}
                  strokeWidth={1.9}
                />
                <span>Administration</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
            </Link>
          )}

          {/* Settings */}
          <Link
            href="/settings"
            id="sidebar-nav-settings"
            aria-current={isActive("/settings") ? "page" : undefined}
            className={`group flex h-[34px] w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition ${
              isActive("/settings")
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/30"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Settings
              className={`h-[16px] w-[16px] shrink-0 transition ${
                isActive("/settings")
                  ? "text-white"
                  : "text-slate-400 group-hover:text-blue-300"
              }`}
              strokeWidth={1.9}
            />
            <span>Settings</span>
          </Link>
        </nav>

        {/* ======================================================
            USER PROFILE & ACCOUNT CONTROLS
        ====================================================== */}
        <div ref={userMenuRef} className="relative shrink-0 border-t border-slate-700/80 p-3">
          <button
            type="button"
            id="user-profile-btn"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            onClick={() => setUserMenuOpen((open) => !open)}
            className={`flex w-full items-center gap-3 rounded-lg p-1.5 transition ${
              userMenuOpen ? "bg-white/15" : "hover:bg-white/10"
            }`}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-[12px] font-bold text-white shadow-sm">{user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}<span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#031b3d]" />
            </div>

            <div className="min-w-0 flex-1 text-left leading-tight">
              <div className="truncate text-[12.5px] font-medium text-slate-100">{user?.name || "Unknown User"}</div>
              <div className="truncate text-[10.5px] text-slate-400">{currentWorkspace?.role || "Viewer"}</div>
            </div>

            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* USER POPUP MENU */}
          {userMenuOpen && (
            <div
              id="user-profile-menu"
              className="absolute bottom-[66px] left-3 right-3 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-100"
            >
              <div className="border-b border-slate-100 px-3 py-2 bg-slate-50/80">
                <p className="text-[12px] font-semibold text-slate-900">{user?.name || "Unknown User"}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {user?.email || "No email provided"}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[9.5px] font-medium text-blue-700">
                    {currentWorkspace?.role || "Viewer"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/workspaces"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[12px] text-slate-700 transition hover:bg-slate-100"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  Switch Organization
                </Link>

                <Link
                  href="/administration"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[12px] text-slate-700 transition hover:bg-slate-100"
                >
                  <UsersRound className="h-3.5 w-3.5 text-slate-500" />
                  Team & Permissions
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[12px] text-slate-700 transition hover:bg-slate-100"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-500" />
                  Account Settings
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[12px] font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================
          CREATE WORKSPACE MODAL
      ====================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">
                    Create New Workspace
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set up an isolated GRC governance environment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-700">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme FinTech, Globex Cloud"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-700">
                    Industry Domain
                  </label>
                  <select
                    value={newWorkspaceIndustry}
                    onChange={(e) => setNewWorkspaceIndustry(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="Technology & SaaS">Technology & SaaS</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="Government & Defense">Government & Defense</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-slate-700">
                    Primary Framework
                  </label>
                  <select
                    value={newWorkspaceFramework}
                    onChange={(e) => setNewWorkspaceFramework(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="ISO 27001">ISO 27001:2022</option>
                    <option value="SOC 2 Type II">SOC 2 Type II</option>
                    <option value="NIST CSF">NIST CSF 2.0</option>
                    <option value="HIPAA Security">HIPAA Security</option>
                    <option value="PCI-DSS v4.0">PCI-DSS v4.0</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-slate-700">
                  Description / Scope Narrative
                </label>
                <textarea
                  rows={2}
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  placeholder="e.g. Production cloud infrastructure, payment services, customer data stores..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}