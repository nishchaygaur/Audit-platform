import Link from "next/link";
import {
  BookOpen,
  Shield,
  Layers,
  ArrowRight,
  Compass,
  Cpu,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Terminal,
  FileCheck2,
  Users,
} from "lucide-react";
import { getDocsCategories } from "@/lib/docs";
import DocsSidebar from "@/components/docs/DocsSidebar";
import DocsLayoutWrapper from "@/components/docs/DocsLayoutWrapper";

export const metadata = {
  title: "Documentation Portal | Audit Platform",
  description: "Comprehensive technical, architectural, and operational documentation for the Audit Platform GRC system.",
};

export default function DocsLandingPage() {
  const categories = getDocsCategories();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Compass":
        return <Compass className="h-6 w-6 text-blue-600" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-6 w-6 text-emerald-600" />;
      case "Cpu":
        return <Cpu className="h-6 w-6 text-indigo-600" />;
      case "BookOpen":
        return <BookOpen className="h-6 w-6 text-purple-600" />;
      case "GraduationCap":
        return <GraduationCap className="h-6 w-6 text-amber-600" />;
      default:
        return <Layers className="h-6 w-6 text-slate-500" />;
    }
  };

  const readingPaths = [
    {
      title: "Academic Evaluators & Examiners",
      description: "Project background, formal problem statement, architecture diagrams, academic capstone dossier, and viva defense script.",
      color: "border-amber-200 bg-amber-50/40 text-amber-950",
      badgeColor: "bg-amber-100 text-amber-800",
      icon: <GraduationCap className="h-5 w-5 text-amber-700" />,
      links: [
        { name: "01. Project Overview", href: "/docs/01-project-overview" },
        { name: "02. Scope & Requirements", href: "/docs/02-scope-and-requirements" },
        { name: "03. System Architecture", href: "/docs/03-system-architecture" },
        { name: "23. Academic Dossier", href: "/docs/23-academic-project" },
        { name: "24. Viva Guide & Defense", href: "/docs/24-viva-guide" },
      ],
    },
    {
      title: "Software Engineers & DevOps",
      description: "Technology stack, codebase hierarchy, PostgreSQL schemas, server action data pipelines, testing, and production deployment.",
      color: "border-indigo-200 bg-indigo-50/40 text-indigo-950",
      badgeColor: "bg-indigo-100 text-indigo-800",
      icon: <Terminal className="h-5 w-5 text-indigo-700" />,
      links: [
        { name: "04. Technology Stack", href: "/docs/04-technology-stack" },
        { name: "05. Codebase Structure", href: "/docs/05-codebase-structure" },
        { name: "14. Data Model & SQL", href: "/docs/14-data-model" },
        { name: "16. Testing Matrix", href: "/docs/16-testing" },
        { name: "17. Production Deployment", href: "/docs/17-deployment" },
      ],
    },
    {
      title: "Security & Compliance Auditors",
      description: "Supabase SSR authentication, 5-role RBAC, ISO 27001/NIST mappings, dual-tier evidence vault, finding tracking, and security model.",
      color: "border-blue-200 bg-blue-50/40 text-blue-950",
      badgeColor: "bg-blue-100 text-blue-800",
      icon: <Shield className="h-5 w-5 text-blue-700" />,
      links: [
        { name: "06. Authentication & RBAC", href: "/docs/06-authentication" },
        { name: "07. Workspace Tenancy", href: "/docs/07-workspaces" },
        { name: "10. Compliance Frameworks", href: "/docs/10-frameworks" },
        { name: "11. Evidence Architecture", href: "/docs/11-evidence" },
        { name: "12. Findings Lifecycle", href: "/docs/12-findings" },
        { name: "15. Security Threat Model", href: "/docs/15-security" },
      ],
    },
    {
      title: "End Users & Platform Admins",
      description: "Step-by-step operator user guide from initial login to final report export, team administration runbook, and troubleshooting matrix.",
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-950",
      badgeColor: "bg-emerald-100 text-emerald-800",
      icon: <Users className="h-5 w-5 text-emerald-700" />,
      links: [
        { name: "18. End-User Manual", href: "/docs/18-user-guide" },
        { name: "19. Administrator Runbook", href: "/docs/19-admin-guide" },
        { name: "08. Audit Management", href: "/docs/08-audit-management" },
        { name: "13. Compliance Reporting", href: "/docs/13-reporting" },
        { name: "20. Troubleshooting", href: "/docs/20-troubleshooting" },
      ],
    },
  ];

  const quickSpecs = [
    { label: "Classification", value: "Enterprise Cybersecurity Governance, Risk & Compliance (GRC) Platform" },
    { label: "Architecture", value: "Multi-Tenant Workspace-Isolated Web Application" },
    { label: "Frontend & Runtime", value: "Next.js 16.3.4 (App Router) • React 19.2.8 • Tailwind CSS v4" },
    { label: "Database Engine", value: "Remote PostgreSQL (Neon / Supabase) via pg connection pooling" },
    { label: "Authentication", value: "Supabase SSR Auth with PKCE and 5-Role RBAC" },
    { label: "Evidence Storage", value: "Dual-Tier: AWS S3 Object Storage + HMAC-Signed Disk Fallback" },
    { label: "Reporting Engine", value: "Interactive 12-Section Viewer & Pure JS/TS PDF-1.4 Generator" },
    { label: "Test Framework", value: "Playwright Test 1.63.0 E2E Suite (9 comprehensive specs)" },
    { label: "Production Host", value: "Vercel Edge Serverless Platform" },
  ];

  return (
    <DocsLayoutWrapper>
      <div className="flex min-h-screen bg-[#f8fafc]">
        {/* Documentation Navigation Sidebar */}
        <DocsSidebar categories={categories} />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-12">
          {/* HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl border border-blue-900/40 bg-gradient-to-br from-[#041a3d] via-[#092b5e] to-[#031530] p-8 sm:p-12 text-white shadow-xl">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>Enterprise GRC Documentation Portal</span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Audit Platform Documentation
              </h1>

              <p className="mt-3 max-w-2xl text-base sm:text-lg text-blue-100/90 leading-relaxed">
                Everything you need to understand, use, audit, and develop the Audit Platform. Complete source-code-grounded documentation across 25 chapters.
              </p>

              {/* Quick Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/docs/01-project-overview"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Start with Chapter 1</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/docs/18-user-guide"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
                >
                  <Users className="h-4 w-4" />
                  <span>End-User Manual</span>
                </Link>

                <Link
                  href="/docs/03-system-architecture"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition hover:bg-white/20"
                >
                  <Cpu className="h-4 w-4" />
                  <span>System Architecture</span>
                </Link>
              </div>

              {/* Quick Stat Badges */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 pt-6">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">25</div>
                  <div className="text-xs text-blue-200">Modular Chapters</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">4</div>
                  <div className="text-xs text-blue-200">Pre-Seeded Frameworks</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">5-Stage</div>
                  <div className="text-xs text-blue-200">Audit Lifecycle</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">100%</div>
                  <div className="text-xs text-blue-200">Source Code Grounded</div>
                </div>
              </div>
            </div>
          </div>

          {/* READING PATHS BY AUDIENCE */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Recommended Reading Paths
              </h2>
              <p className="text-sm text-slate-500">
                Tailored journeys designed for examiners, engineers, compliance specialists, and end users.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {readingPaths.map((path) => (
                <div
                  key={path.title}
                  className={`rounded-2xl border p-6 shadow-xs flex flex-col justify-between ${path.color}`}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-2xs">
                        {path.icon}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {path.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed mb-4">
                      {path.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Key Chapters
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {path.links.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs hover:text-blue-600 hover:ring-1 hover:ring-blue-400 transition"
                        >
                          <span>{link.name}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ALL CATEGORIES & CHAPTERS DIRECTORY */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Documentation Catalogue
              </h2>
              <p className="text-sm text-slate-500">
                Complete directory of all 25 chapters categorized by functional and architectural domain.
              </p>
            </div>

            <div className="space-y-10">
              {categories.map((category) => (
                <div key={category.name} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                      {getCategoryIcon(category.iconName)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {category.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* Chapter Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map((doc) => (
                      <Link
                        key={doc.slug}
                        href={`/docs/${doc.slug}`}
                        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition duration-150 hover:border-blue-400 hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            {doc.chapterNumber !== undefined ? (
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 border border-blue-200/60">
                                Chapter {String(doc.chapterNumber).padStart(2, "0")}
                              </span>
                            ) : (
                              <span className="rounded-md bg-purple-50 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-700 border border-purple-200/60">
                                Overview
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                          </div>

                          <h4 className="text-[14px] font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                            {doc.title}
                          </h4>

                          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {doc.description}
                          </p>
                        </div>

                        {doc.targetAudience && doc.targetAudience.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1 text-[10.5px] text-slate-400">
                            <span className="truncate">For: {doc.targetAudience.slice(0, 2).join(", ")}</span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK SYSTEM SPECIFICATIONS TABLE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Quick System Specifications
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Verified against application codebase
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  {quickSpecs.map((spec, idx) => (
                    <tr
                      key={spec.label}
                      className={idx % 2 === 0 ? "bg-slate-50/60" : "bg-white"}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-800 w-1/3">
                        {spec.label}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11.5px]">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400 pb-8">
            <p>
              Audit Platform Documentation Portal • Verified source documentation for Cybersecurity & GRC Audit Management.
            </p>
            <p className="mt-1">
              Source repository: <a href="https://github.com/nishchaygaur/Audit-platform" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">github.com/nishchaygaur/Audit-platform</a>
            </p>
          </div>
        </div>
        </div>
      </div>
    </DocsLayoutWrapper>
  );
}
