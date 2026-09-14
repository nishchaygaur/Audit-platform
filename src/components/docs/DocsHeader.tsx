import Link from "next/link";
import { ChevronRight, Clock, Users, ShieldCheck } from "lucide-react";
import { type DocMetadata } from "@/lib/docs-manifest";

interface DocsHeaderProps {
  meta: DocMetadata;
}

export default function DocsHeader({ meta }: DocsHeaderProps) {
  return (
    <div className="mb-8 border-b border-slate-200 pb-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/docs" className="hover:text-blue-600 transition">
          Docs
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-700">{meta.category}</span>
        {meta.chapterNumber !== undefined && (
          <>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-blue-600 font-semibold">
              Chapter {meta.chapterNumber}
            </span>
          </>
        )}
      </nav>

      {/* Chapter Indicator + Title */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 border border-blue-200/60">
          {meta.category}
        </span>
        {meta.chapterNumber !== undefined && (
          <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200/60">
            Chapter {String(meta.chapterNumber).padStart(2, "0")}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          <ShieldCheck className="h-3 w-3" />
          Verified Technical Doc
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
        {meta.title}
      </h1>

      <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
        {meta.description}
      </p>

      {/* Metadata Row */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
        {meta.readingTimeMinutes && (
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{meta.readingTimeMinutes} min read</span>
          </div>
        )}

        {meta.targetAudience && meta.targetAudience.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>Audience: {meta.targetAudience.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
