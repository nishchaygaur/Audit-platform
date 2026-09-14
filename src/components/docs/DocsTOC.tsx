"use client";

import { useEffect, useState } from "react";
import { type DocHeading } from "@/lib/docs-manifest";
import { AlignLeft, ArrowUp, Link as LinkIcon, Check } from "lucide-react";

interface DocsTOCProps {
  headings: DocHeading[];
}

export default function DocsTOC({ headings }: DocsTOCProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0% -60% 0%",
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [headings]);

  const filteredHeadings = headings.filter((h) => h.level === 2 || h.level === 3);

  if (filteredHeadings.length === 0) {
    return null;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyPageLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <nav
      aria-label="Table of Contents"
      className="hidden xl:block w-64 shrink-0 px-4 py-6 sticky top-0 max-h-screen overflow-y-auto [scrollbar-width:thin]"
    >
      <div className="flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
        <AlignLeft className="h-4 w-4 text-slate-400" />
        <span>On this page</span>
      </div>

      <div className="mt-3 space-y-1">
        {filteredHeadings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById(heading.id);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                  setActiveId(heading.id);
                  history.pushState(null, "", `#${heading.id}`);
                }
              }}
              className={`group flex items-start py-1 text-[12.5px] leading-snug transition ${
                heading.level === 3 ? "pl-4" : "pl-0"
              } ${
                isActive
                  ? "font-semibold text-blue-600 border-l-2 border-blue-600 -ml-[1px] pl-2"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="truncate">{heading.text}</span>
            </a>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
        <button
          type="button"
          onClick={copyPageLink}
          className="flex w-full items-center gap-2 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600">Page link copied!</span>
            </>
          ) : (
            <>
              <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy link to page</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={scrollToTop}
          className="flex w-full items-center gap-2 text-[12px] font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowUp className="h-3.5 w-3.5 text-slate-400" />
          <span>Back to top</span>
        </button>
      </div>
    </nav>
  );
}
