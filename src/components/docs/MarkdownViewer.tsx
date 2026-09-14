"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Info,
  Lightbulb,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  Hash,
} from "lucide-react";

interface MarkdownViewerProps {
  content: string;
}

// Convert relative markdown file links (e.g. ./01-project-overview.md or 01-project-overview.md) to /docs/...
function normalizeDocLink(href: string): { isInternalDoc: boolean; url: string } {
  if (!href) return { isInternalDoc: false, url: "" };

  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return { isInternalDoc: false, url: href };
  }

  // Handle #heading-anchors
  if (href.startsWith("#")) {
    return { isInternalDoc: false, url: href };
  }

  // Handle relative .md files
  const mdMatch = href.match(/(?:\.\/)?([a-zA-Z0-9_-]+)\.md(#.*)?/);
  if (mdMatch) {
    const slug = mdMatch[1] === "README" ? "overview" : mdMatch[1];
    const hash = mdMatch[2] || "";
    return { isInternalDoc: true, url: `/docs/${slug}${hash}` };
  }

  return { isInternalDoc: false, url: href };
}

// Inline Markdown Parser
function parseInlineMarkdown(text: string): ReactNode[] {
  const elements: ReactNode[] = [];
  let keyIndex = 0;

  // Tokenize string for math, code, links, bold, italic
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|~~[^~]+~~)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `inline-${keyIndex++}`;

    if (token.startsWith("$$") && token.endsWith("$$")) {
      // Display Math
      const math = token.slice(2, -2).trim();
      elements.push(
        <span
          key={key}
          className="my-2 block overflow-x-auto rounded-lg bg-slate-900/90 px-4 py-3 font-mono text-[13px] text-blue-200 border border-slate-700/60 shadow-inner"
        >
          {math}
        </span>
      );
    } else if (token.startsWith("$") && token.endsWith("$")) {
      // Inline Math
      const math = token.slice(1, -1).trim();
      elements.push(
        <span
          key={key}
          className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] font-medium text-slate-800 border border-slate-200"
        >
          {math}
        </span>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      // Inline Code
      const code = token.slice(1, -1);
      elements.push(
        <code
          key={key}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-blue-700 border border-slate-200/80"
        >
          {code}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      // Link
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const rawHref = linkMatch[2];
        const { isInternalDoc, url } = normalizeDocLink(rawHref);

        if (isInternalDoc || url.startsWith("/")) {
          elements.push(
            <Link
              key={key}
              href={url}
              className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800 hover:decoration-blue-600"
            >
              {parseInlineMarkdown(linkText)}
            </Link>
          );
        } else if (url.startsWith("#")) {
          elements.push(
            <a
              key={key}
              href={url}
              className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800 hover:decoration-blue-600"
            >
              {parseInlineMarkdown(linkText)}
            </a>
          );
        } else {
          elements.push(
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800 hover:decoration-blue-600"
            >
              <span>{parseInlineMarkdown(linkText)}</span>
              <ExternalLink className="inline h-3 w-3 text-slate-400" />
            </a>
          );
        }
      } else {
        elements.push(token);
      }
    } else if (
      (token.startsWith("**") && token.endsWith("**")) ||
      (token.startsWith("__") && token.endsWith("__"))
    ) {
      // Bold
      const boldText = token.slice(2, -2);
      elements.push(
        <strong key={key} className="font-semibold text-slate-900">
          {parseInlineMarkdown(boldText)}
        </strong>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      // Italic
      const italicText = token.slice(1, -1);
      elements.push(
        <em key={key} className="italic text-slate-800">
          {parseInlineMarkdown(italicText)}
        </em>
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      // Strikethrough
      const strikeText = token.slice(2, -2);
      elements.push(
        <del key={key} className="line-through text-slate-400">
          {parseInlineMarkdown(strikeText)}
        </del>
      );
    } else {
      elements.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
}

// Code Block Component with Copy to Clipboard
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const isAsciiDiagram =
    !language ||
    language === "text" ||
    language === "plaintext" ||
    code.includes("┌─") ||
    code.includes("├──") ||
    code.includes("│") ||
    code.includes("───");

  return (
    <div className="group relative my-5 overflow-hidden rounded-xl border border-slate-700/80 bg-[#061427] shadow-lg">
      {/* Header bar */}
      <div className="flex h-9 items-center justify-between border-b border-slate-700/60 bg-[#0a1c35] px-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-2 font-mono text-[11px] font-medium tracking-wide uppercase text-slate-400">
            {language || (isAsciiDiagram ? "diagram / text" : "code")}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents */}
      <div className="overflow-x-auto p-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
        <pre className="font-mono text-[12.5px] leading-relaxed text-slate-200 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// Callout / Alert Component
function CalloutBox({
  type,
  children,
}: {
  type: "note" | "tip" | "important" | "warning" | "caution" | "quote";
  children: ReactNode;
}) {
  const configs = {
    note: {
      border: "border-blue-500/40 bg-blue-50/70 text-blue-950",
      icon: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
      title: "Note",
      titleColor: "text-blue-900",
    },
    tip: {
      border: "border-emerald-500/40 bg-emerald-50/70 text-emerald-950",
      icon: <Lightbulb className="h-5 w-5 text-emerald-600 shrink-0" />,
      title: "Tip",
      titleColor: "text-emerald-900",
    },
    important: {
      border: "border-purple-500/40 bg-purple-50/70 text-purple-950",
      icon: <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0" />,
      title: "Important",
      titleColor: "text-purple-900",
    },
    warning: {
      border: "border-amber-500/40 bg-amber-50/70 text-amber-950",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
      title: "Warning",
      titleColor: "text-amber-900",
    },
    caution: {
      border: "border-rose-500/40 bg-rose-50/70 text-rose-950",
      icon: <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0" />,
      title: "Caution",
      titleColor: "text-rose-900",
    },
    quote: {
      border: "border-slate-300 bg-slate-50 text-slate-700",
      icon: null,
      title: "",
      titleColor: "",
    },
  };

  const config = configs[type];

  return (
    <div className={`my-5 rounded-xl border p-4 shadow-xs ${config.border}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1 min-w-0">
          {config.title && (
            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${config.titleColor}`}>
              {config.title}
            </div>
          )}
          <div className="text-[13.5px] leading-relaxed space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  const blocks: ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Code block ```
    if (line.trim().startsWith("```")) {
      const language = line.trim().replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <CodeBlock
          key={`code-${blockKey++}`}
          code={codeLines.join("\n")}
          language={language}
        />
      );
      continue;
    }

    // Horizontal Rule ---
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      blocks.push(
        <hr key={`hr-${blockKey++}`} className="my-8 border-t border-slate-200" />
      );
      i++;
      continue;
    }

    // Headings #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const rawText = headingMatch[2].trim();
      const cleanHeadingText = rawText
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`]/g, "");
      const headingId = cleanHeadingText
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      const inlineChildren = parseInlineMarkdown(rawText);

      if (level === 1) {
        blocks.push(
          <h1
            key={`h1-${blockKey++}`}
            id={headingId}
            className="group relative mt-8 mb-4 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-3"
          >
            <a
              href={`#${headingId}`}
              className="absolute -left-6 top-1 hidden text-slate-300 transition group-hover:inline-block hover:text-blue-600"
              aria-label="Direct link to heading"
            >
              <Hash className="h-5 w-5" />
            </a>
            {inlineChildren}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2
            key={`h2-${blockKey++}`}
            id={headingId}
            className="group relative mt-10 mb-3 text-xl md:text-2xl font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-2 scroll-mt-24"
          >
            <a
              href={`#${headingId}`}
              className="absolute -left-6 top-1 hidden text-slate-300 transition group-hover:inline-block hover:text-blue-600"
              aria-label="Direct link to heading"
            >
              <Hash className="h-4 w-4" />
            </a>
            {inlineChildren}
          </h2>
        );
      } else if (level === 3) {
        blocks.push(
          <h3
            key={`h3-${blockKey++}`}
            id={headingId}
            className="group relative mt-6 mb-2 text-lg font-semibold tracking-tight text-slate-800 scroll-mt-24"
          >
            <a
              href={`#${headingId}`}
              className="absolute -left-5 top-1 hidden text-slate-300 transition group-hover:inline-block hover:text-blue-600"
              aria-label="Direct link to heading"
            >
              <Hash className="h-3.5 w-3.5" />
            </a>
            {inlineChildren}
          </h3>
        );
      } else {
        blocks.push(
          <h4
            key={`h4-${blockKey++}`}
            id={headingId}
            className="mt-4 mb-2 text-base font-semibold text-slate-800 scroll-mt-24"
          >
            {inlineChildren}
          </h4>
        );
      }
      i++;
      continue;
    }

    // Blockquote & Callouts (> [!NOTE], etc.)
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      let alertType: "note" | "tip" | "important" | "warning" | "caution" | "quote" = "quote";

      while (i < lines.length && lines[i].trim().startsWith(">")) {
        let qLine = lines[i].trim().replace(/^>\s?/, "");
        const alertMatch = qLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        if (alertMatch) {
          alertType = alertMatch[1].toLowerCase() as typeof alertType;
          qLine = qLine.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s?/i, "");
        }
        if (qLine) {
          quoteLines.push(qLine);
        }
        i++;
      }

      blocks.push(
        <CalloutBox key={`callout-${blockKey++}`} type={alertType}>
          {quoteLines.map((q, idx) => (
            <p key={idx}>{parseInlineMarkdown(q)}</p>
          ))}
        </CalloutBox>
      );
      continue;
    }

    // Markdown Table (| header | header |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());

        // Line 1 is delimiter: | :--- | :--- |
        const bodyLines = tableLines.slice(2);

        blocks.push(
          <div
            key={`table-${blockKey++}`}
            className="my-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs [scrollbar-width:thin]"
          >
            <table className="w-full min-w-[500px] border-collapse text-left text-[13px]">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  {headerCells.map((header, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-4 py-3 font-semibold text-slate-800"
                    >
                      {parseInlineMarkdown(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bodyLines.map((rowLine, rIdx) => {
                  const cells = rowLine
                    .slice(1, -1)
                    .split("|")
                    .map((c) => c.trim());
                  return (
                    <tr
                      key={rIdx}
                      className="transition hover:bg-blue-50/30 even:bg-slate-50/30"
                    >
                      {cells.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-2.5 text-slate-700 leading-relaxed"
                        >
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Unordered List (- or *) or Checklist (- [ ] or - [x])
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: { text: string; isChecklist: boolean; checked: boolean; indent: number }[] = [];

      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemLine = lines[i];
        const indentMatch = itemLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        let itemText = itemLine.replace(/^\s*[-*]\s+/, "");

        let isChecklist = false;
        let checked = false;

        if (itemText.startsWith("[ ] ")) {
          isChecklist = true;
          checked = false;
          itemText = itemText.replace(/^\[ \]\s+/, "");
        } else if (itemText.startsWith("[x] ") || itemText.startsWith("[X] ")) {
          isChecklist = true;
          checked = true;
          itemText = itemText.replace(/^\[[xX]\]\s+/, "");
        }

        listItems.push({ text: itemText, isChecklist, checked, indent });
        i++;
      }

      blocks.push(
        <ul key={`ul-${blockKey++}`} className="my-4 space-y-1.5 pl-5 text-[14px] text-slate-700">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className={`leading-relaxed ${
                item.isChecklist
                  ? "flex items-start gap-2 list-none -ml-5"
                  : "list-disc marker:text-blue-500"
              } ${item.indent > 0 ? "ml-4" : ""}`}
            >
              {item.isChecklist && (
                <input
                  type="checkbox"
                  readOnly
                  checked={item.checked}
                  className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              )}
              <span>{parseInlineMarkdown(item.text)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List (1. 2. 3.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, "");
        listItems.push(itemText);
        i++;
      }

      blocks.push(
        <ol key={`ol-${blockKey++}`} className="my-4 list-decimal space-y-1.5 pl-6 text-[14px] text-slate-700 marker:font-semibold marker:text-slate-500">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Standard Paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\*\*\*|---|___)$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push(
        <p
          key={`p-${blockKey++}`}
          className="my-3 text-[14.5px] leading-relaxed text-slate-700"
        >
          {parseInlineMarkdown(paragraphLines.join(" "))}
        </p>
      );
    }
  }

  return (
    <article className="prose prose-slate max-w-none text-slate-800">
      {blocks}
    </article>
  );
}
