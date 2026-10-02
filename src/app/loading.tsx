"use client";

import { ShieldCheck, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f6f8fc]/80 dark:bg-[#0b0f19]/80 backdrop-blur-md transition-all">
      {/* Centered Glowing Loading Container */}
      <div className="relative flex flex-col items-center">
        {/* Animated ambient background glow */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 blur-xl animate-pulse" />

        {/* Shield Icon Container with dual orbit rings */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          {/* Rotating outer spinner ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-blue-600 dark:border-t-blue-500 border-r-indigo-500 animate-spin" />
          
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
            <ShieldCheck className="h-7 w-7 animate-pulse" />
          </div>
        </div>

        {/* Title & Microcopy */}
        <div className="mt-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[14px] font-semibold text-slate-800 dark:text-slate-100">
            <span>Loading Audit Platform</span>
            <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-bounce" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Synchronizing compliance workpapers, controls, and active sessions...
          </p>
        </div>

        {/* Loading Bar */}
        <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full w-full origin-left bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-[loading-bar_1.5s_infinite_ease-in-out]" />
        </div>
      </div>
    </div>
  );
}
