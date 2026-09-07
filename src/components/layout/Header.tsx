"use client";

import { Building2, Search, Bell, CircleHelp, ChevronDown } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function Header() {
  const { currentWorkspace } = useWorkspace();

  return (
    <header className="sticky top-0 z-30 flex h-[86px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <Building2 className="h-7 w-7 text-blue-600" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[27px] font-medium leading-none tracking-[-0.6px] text-slate-900">
              {currentWorkspace.name}
            </h1>
            <span className="shrink-0 rounded-md bg-violet-50 px-3 py-1 text-[12px] font-medium text-indigo-700">
              Workspace
            </span>
          </div>
          <p className="mt-1.5 truncate text-[14px] text-slate-500">
            {currentWorkspace.description}
          </p>
        </div>
      </div>

      <div className="ml-6 flex shrink-0 items-center gap-5">
        <button type="button" aria-label="Search" className="text-slate-600 transition hover:text-blue-600">
          <Search className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <button type="button" aria-label="Notifications" className="relative text-slate-600 transition hover:text-blue-600">
          <Bell className="h-5 w-5" strokeWidth={1.8} />
          <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">5</span>
        </button>
        <button type="button" aria-label="Help" className="text-slate-600 transition hover:text-blue-600">
          <CircleHelp className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <button type="button" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-[13px] font-medium text-violet-700">AS</span>
          <span className="hidden text-[14px] font-medium text-slate-800 sm:block">Alice Smith</span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
