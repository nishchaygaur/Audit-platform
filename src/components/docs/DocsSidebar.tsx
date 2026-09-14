"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ChevronDown,
  BookOpen,
  Layers,
  Compass,
  ShieldCheck,
  Cpu,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  X,
  Menu,
} from "lucide-react";
import { getDocsCategories, type DocCategoryGroup } from "@/lib/docs-manifest";
import DocsSearchModal from "./DocsSearchModal";

interface DocsSidebarProps {
  categories?: DocCategoryGroup[];
}

export default function DocsSidebar({ categories }: DocsSidebarProps) {
  const pathname = usePathname();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Default all categories to open
  const allCategories = categories || getDocsCategories();
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  function toggleCategory(catName: string) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  }

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Compass":
        return <Compass className="h-4 w-4 text-blue-500" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case "Cpu":
        return <Cpu className="h-4 w-4 text-indigo-500" />;
      case "BookOpen":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "GraduationCap":
        return <GraduationCap className="h-4 w-4 text-amber-500" />;
      default:
        return <Layers className="h-4 w-4 text-slate-400" />;
    }
  };

  const navContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Top Header / Portal Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5 bg-slate-50/70">
        <Link
          href="/docs"
          className="flex items-center gap-2.5 transition hover:opacity-80"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">
              Audit Docs
            </div>
            <div className="text-[10.5px] font-medium text-slate-500">
              v1.0 • 25 Chapters
            </div>
          </div>
        </Link>

        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Input Trigger */}
      <div className="p-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-[12.5px] text-slate-500 transition hover:border-slate-300 hover:bg-white shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search docs...</span>
          </div>
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            ⌘K
          </kbd>
        </button>

        {/* Local fast chapter filter */}
        <div className="mt-2">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter chapters..."
            className="h-7 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[11.5px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Categories & Chapter Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 [scrollbar-width:thin]">
        {/* Docs Overview Link */}
        <Link
          href="/docs"
          onClick={() => setMobileOpen(false)}
          className={`flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-semibold transition ${
            pathname === "/docs"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Sparkles className={`h-4 w-4 ${pathname === "/docs" ? "text-white" : "text-blue-600"}`} />
          <span>Documentation Home</span>
        </Link>

        {allCategories.map((category) => {
          const isCollapsed = collapsedCategories[category.name] && !filterText;
          const filteredItems = category.items.filter(
            (doc) =>
              !filterText ||
              doc.title.toLowerCase().includes(filterText.toLowerCase()) ||
              (doc.chapterNumber !== undefined && String(doc.chapterNumber).includes(filterText))
          );

          if (filterText && filteredItems.length === 0) return null;

          return (
            <div key={category.name} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleCategory(category.name)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition"
              >
                <div className="flex items-center gap-1.5">
                  {getCategoryIcon(category.iconName)}
                  <span>{category.name}</span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>

              {!isCollapsed && (
                <div className="mt-1 space-y-0.5 pl-1">
                  {filteredItems.map((doc) => {
                    const docHref = `/docs/${doc.slug}`;
                    const isActive = pathname === docHref || pathname === `/docs/${doc.filename.replace('.md', '')}`;

                    return (
                      <Link
                        key={doc.slug}
                        href={docHref}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] transition ${
                          isActive
                            ? "bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-500/20"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {doc.chapterNumber !== undefined ? (
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                                isActive
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                              }`}
                            >
                              {String(doc.chapterNumber).padStart(2, "0")}
                            </span>
                          ) : (
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                                isActive
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                              }`}
                            >
                              ★
                            </span>
                          )}
                          <span className="truncate">{doc.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer link to Platform Dashboard */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        <Link
          href="/dashboard"
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
          <span>Back to Application</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 overflow-hidden shadow-xs z-20">
        {navContent}
      </aside>

      {/* Mobile Menu Toggle Button */}
      <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Menu className="h-4 w-4" />
          <span>Docs Menu</span>
        </button>

        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Search Modal */}
      <DocsSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
