import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type DocMetadata } from "@/lib/docs-manifest";

interface DocsPaginationProps {
  prev: DocMetadata | null;
  next: DocMetadata | null;
}

export default function DocsPagination({ prev, next }: DocsPaginationProps) {
  if (!prev && !next) return null;

  return (
    <div className="mt-12 border-t border-slate-200 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Previous Doc Card */}
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50/20 shadow-2xs"
          >
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Previous Chapter</span>
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {prev.chapterNumber !== undefined ? `Chapter ${prev.chapterNumber}` : prev.category}
              </div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                {prev.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        {/* Next Doc Card */}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="group flex flex-col justify-between items-end text-right rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50/20 shadow-2xs"
          >
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition">
              <span>Next Chapter</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                {next.chapterNumber !== undefined ? `Chapter ${next.chapterNumber}` : next.category}
              </div>
              <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                {next.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
    </div>
  );
}
