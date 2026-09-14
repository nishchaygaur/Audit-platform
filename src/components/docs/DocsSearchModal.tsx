"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, BookOpen, ChevronRight, FileText } from "lucide-react";
import { searchDocumentation } from "@/actions/docs";
import { type SearchDocResult } from "@/lib/docs-manifest";

interface DocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocsSearchModal({ isOpen, onClose }: DocsSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDocResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via custom event or state if needed
        }
      }
      if (e.key === "/" && !isOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        // Allow / to trigger search
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchDocumentation(query);
        if (res.success) {
          setResults(res.data);
          setSelectedIndex(0);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation within results
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        onClose();
        router.push(`/docs/${target.slug}`);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Documentation Search Modal"
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-16 sm:pt-24 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex h-14 items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-4">
          <Search className="h-5 w-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search documentation by topic, chapter, framework, or keyword..."
            className="w-full bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 [scrollbar-width:thin]">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.slug}-${idx}`}
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/docs/${item.slug}`);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                      isSelected
                        ? "bg-blue-50/80 ring-1 ring-blue-500/20"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                      {item.chapterNumber !== undefined ? (
                        <span className="text-[11px] font-bold">
                          {String(item.chapterNumber).padStart(2, "0")}
                        </span>
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <h4 className="text-[13.5px] font-semibold text-slate-900 truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="mt-1 text-[12px] text-slate-600 line-clamp-2 leading-relaxed">
                        {item.snippet}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 self-center" />
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="py-12 text-center text-slate-500">
              <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No documentation found</p>
              <p className="text-xs text-slate-500 mt-1">
                No matching results for &ldquo;{query}&rdquo;. Try another term like &ldquo;audit&rdquo;, &ldquo;evidence&rdquo;, &ldquo;RBAC&rdquo;, or &ldquo;ISO 27001&rdquo;.
              </p>
            </div>
          ) : (
            <div className="py-8 px-4 text-slate-500">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Quick Documentation Categories
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQuery("ISO 27001")}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-left hover:bg-slate-100 transition"
                >
                  <span className="font-semibold text-slate-800">ISO 27001 & Frameworks</span>
                  <p className="text-[11px] text-slate-500 truncate">Controls, NIST CSF, SOC 2</p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuery("Evidence Storage")}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-left hover:bg-slate-100 transition"
                >
                  <span className="font-semibold text-slate-800">Evidence Vault</span>
                  <p className="text-[11px] text-slate-500 truncate">AWS S3, upload & download</p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuery("Authentication RBAC")}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-left hover:bg-slate-100 transition"
                >
                  <span className="font-semibold text-slate-800">Authentication & Roles</span>
                  <p className="text-[11px] text-slate-500 truncate">Supabase SSR, 5-role RBAC</p>
                </button>
                <button
                  type="button"
                  onClick={() => setQuery("Report PDF")}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-left hover:bg-slate-100 transition"
                >
                  <span className="font-semibold text-slate-800">Compliance Reporting</span>
                  <p className="text-[11px] text-slate-500 truncate">12-section PDF generator</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px]">↑</kbd> <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px]">↓</kbd></span>
            <span>Select: <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd></span>
          </div>
          <span>Close: <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
}
