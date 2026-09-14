export interface DocHeading {
  id: string;
  text: string;
  level: number;
}

export interface DocMetadata {
  slug: string;
  filename: string;
  chapterNumber?: number;
  title: string;
  description: string;
  category: DocCategory;
  order: number;
  targetAudience?: string[];
  readingTimeMinutes?: number;
  iconName?: string;
}

export interface DocItem extends DocMetadata {
  content: string;
  headings: DocHeading[];
}

export type DocCategory =
  | "Getting Started"
  | "Core Platform"
  | "Architecture & Engineering"
  | "Operations & Guides"
  | "Governance & References";

export interface DocCategoryGroup {
  name: DocCategory;
  description: string;
  iconName: string;
  items: DocMetadata[];
}

export interface SearchDocResult {
  slug: string;
  title: string;
  category: DocCategory;
  chapterNumber?: number;
  snippet: string;
  matchScore: number;
}

export const DOCS_MANIFEST: DocMetadata[] = [
  // Getting Started
  {
    slug: "overview",
    filename: "README.md",
    title: "Documentation Overview & Portal Guide",
    description: "Enterprise Cybersecurity & GRC Audit Management Platform documentation directory and system specifications.",
    category: "Getting Started",
    order: 0,
    targetAudience: ["All Audiences", "Evaluators", "Engineers"],
    iconName: "Compass",
  },
  {
    slug: "01-project-overview",
    filename: "01-project-overview.md",
    chapterNumber: 1,
    title: "Project Overview & Background",
    description: "Executive summary, industry problem statement, proposed GRC solution, objectives, and persona definitions.",
    category: "Getting Started",
    order: 1,
    targetAudience: ["Academic Evaluators", "Leadership", "Auditors"],
    iconName: "FileText",
  },
  {
    slug: "02-scope-and-requirements",
    filename: "02-scope-and-requirements.md",
    chapterNumber: 2,
    title: "Scope & Requirements Catalogue",
    description: "In-scope GRC features vs. out-of-scope tasks, 40 functional requirements, and 15 non-functional requirements.",
    category: "Getting Started",
    order: 2,
    targetAudience: ["Academic Evaluators", "Product Owners", "Auditors"],
    iconName: "CheckSquare",
  },
  {
    slug: "04-technology-stack",
    filename: "04-technology-stack.md",
    chapterNumber: 4,
    title: "Technology Stack Specification",
    description: "Next.js 16 App Router, React 19, Supabase SSR Auth, Neon PostgreSQL, AWS S3, Tailwind CSS v4, and Playwright.",
    category: "Getting Started",
    order: 4,
    targetAudience: ["DevOps & Engineers", "Technical Leads"],
    iconName: "Layers",
  },

  // Core Platform
  {
    slug: "07-workspaces",
    filename: "07-workspaces.md",
    chapterNumber: 7,
    title: "Multi-Organization Tenancy & Workspaces",
    description: "Workspace-level data isolation mechanics, organization switching, member role assignment, and active context persistence.",
    category: "Core Platform",
    order: 7,
    targetAudience: ["Administrators", "Auditors", "Engineers"],
    iconName: "Building2",
  },
  {
    slug: "08-audit-management",
    filename: "08-audit-management.md",
    chapterNumber: 8,
    title: "Audit Lifecycle & Fieldwork",
    description: "5-stage audit lifecycle (Planning → Fieldwork → Review → Reporting → Completed), scoping, and progress tracking.",
    category: "Core Platform",
    order: 8,
    targetAudience: ["Lead Auditors", "Audit Teams", "Reviewers"],
    iconName: "ClipboardList",
  },
  {
    slug: "09-audit-plan",
    filename: "09-audit-plan.md",
    chapterNumber: 9,
    title: "Audit Planning & Control Assessments",
    description: "Planning horizons, control assessment instantiation, assessor tracking, and 4-tier effectiveness scoring.",
    category: "Core Platform",
    order: 9,
    targetAudience: ["Auditors", "Compliance Officers"],
    iconName: "FileCheck2",
  },
  {
    slug: "10-frameworks",
    filename: "10-frameworks.md",
    chapterNumber: 10,
    title: "Compliance Framework Implementations",
    description: "Deep dive into ISO/IEC 27001:2022, NIST CSF 2.0, NIST RMF Rev. 5, and SOC 2 2023 control catalog mapping.",
    category: "Core Platform",
    order: 10,
    targetAudience: ["Compliance Specialists", "Auditors"],
    iconName: "Shield",
  },
  {
    slug: "11-evidence",
    filename: "11-evidence.md",
    chapterNumber: 11,
    title: "Evidence Vault & Storage Architecture",
    description: "AWS S3 object storage integration, pre-signed URLs, HMAC-SHA256 fallback tokens, and upload validation.",
    category: "Core Platform",
    order: 11,
    targetAudience: ["Auditors", "Security Engineers"],
    iconName: "FileSpreadsheet",
  },
  {
    slug: "12-findings",
    filename: "12-findings.md",
    chapterNumber: 12,
    title: "Findings Management & Remediation",
    description: "Finding taxonomy (5 severities, 5 statuses), evidence linkages, remediation workflows, and cross-tenant checks.",
    category: "Core Platform",
    order: 12,
    targetAudience: ["Auditors", "Remediation Owners", "Admins"],
    iconName: "TriangleAlert",
  },
  {
    slug: "13-reporting",
    filename: "13-reporting.md",
    chapterNumber: 13,
    title: "Compliance Reporting & PDF Engine",
    description: "Real-time data compilation, 12-section compliance reporting, pure JS/TS PDF-1.4 generator, and JSON export.",
    category: "Core Platform",
    order: 13,
    targetAudience: ["Executive Leadership", "Auditors", "Clients"],
    iconName: "BarChart3",
  },

  // Architecture & Engineering
  {
    slug: "03-system-architecture",
    filename: "03-system-architecture.md",
    chapterNumber: 3,
    title: "System Architecture & Diagrams",
    description: "End-to-end multi-tier architecture, Next.js 16 server actions, edge proxy, and sequence flow diagrams.",
    category: "Architecture & Engineering",
    order: 3,
    targetAudience: ["Architects", "Engineers", "Evaluators"],
    iconName: "Cpu",
  },
  {
    slug: "05-codebase-structure",
    filename: "05-codebase-structure.md",
    chapterNumber: 5,
    title: "Codebase Structure & Modules",
    description: "Complete repository walkthrough, directory responsibilities, server actions, contexts, and component hierarchy.",
    category: "Architecture & Engineering",
    order: 5,
    targetAudience: ["Software Engineers", "Maintainers"],
    iconName: "FolderTree",
  },
  {
    slug: "06-authentication",
    filename: "06-authentication.md",
    chapterNumber: 6,
    title: "Authentication, Session & RBAC",
    description: "Supabase SSR auth, PKCE & OTP token callbacks, email verification, and 5-role RBAC permission matrix.",
    category: "Architecture & Engineering",
    order: 6,
    targetAudience: ["Security Engineers", "Backend Developers"],
    iconName: "KeyRound",
  },
  {
    slug: "14-data-model",
    filename: "14-data-model.md",
    chapterNumber: 14,
    title: "PostgreSQL Schema & Data Relations",
    description: "SQL schema definitions, relational constraints, composite indexes, field dictionaries, and Mermaid ER diagrams.",
    category: "Architecture & Engineering",
    order: 14,
    targetAudience: ["Database Administrators", "Backend Engineers"],
    iconName: "Database",
  },
  {
    slug: "15-security",
    filename: "15-security.md",
    chapterNumber: 15,
    title: "Security Architecture & Threat Model",
    description: "Implemented security controls, SQL parameterization, CSRF defenses, storage boundaries, and threat model analysis.",
    category: "Architecture & Engineering",
    order: 15,
    targetAudience: ["Security Engineers", "Penetration Testers"],
    iconName: "ShieldAlert",
  },

  // Operations & Guides
  {
    slug: "18-user-guide",
    filename: "18-user-guide.md",
    chapterNumber: 18,
    title: "Comprehensive End-User Manual",
    description: "Step-by-step operator guide using real application UI terms from initial login to final report export.",
    category: "Operations & Guides",
    order: 18,
    targetAudience: ["End Users", "Auditors", "Reviewers"],
    iconName: "BookOpen",
  },
  {
    slug: "19-admin-guide",
    filename: "19-admin-guide.md",
    chapterNumber: 19,
    title: "Administrator & Maintenance Runbook",
    description: "Team management, role delegation, immutable audit trail governance, database seeding, and operational hygiene.",
    category: "Operations & Guides",
    order: 19,
    targetAudience: ["Workspace Admins", "Platform Owners"],
    iconName: "Sliders",
  },
  {
    slug: "20-troubleshooting",
    filename: "20-troubleshooting.md",
    chapterNumber: 20,
    title: "Technical Troubleshooting Guide",
    description: "Comprehensive symptom-cause-remedy matrix covering authentication, database timeouts, storage, and build issues.",
    category: "Operations & Guides",
    order: 20,
    targetAudience: ["Support Engineers", "DevOps"],
    iconName: "Wrench",
  },
  {
    slug: "17-deployment",
    filename: "17-deployment.md",
    chapterNumber: 17,
    title: "Production Deployment & Infrastructure",
    description: "Vercel Edge Serverless deployment, Neon PostgreSQL connectivity, build output analysis, and environment variables.",
    category: "Operations & Guides",
    order: 17,
    targetAudience: ["DevOps", "Infrastructure Engineers"],
    iconName: "Cloud",
  },
  {
    slug: "16-testing",
    filename: "16-testing.md",
    chapterNumber: 16,
    title: "Testing Architecture & Traceability Matrix",
    description: "Playwright E2E test suite analysis across 9 specifications; requirement-to-test traceability matrix and test coverage.",
    category: "Operations & Guides",
    order: 16,
    targetAudience: ["QA Engineers", "Software Engineers"],
    iconName: "CheckCheck",
  },

  // Governance & References
  {
    slug: "21-limitations",
    filename: "21-limitations.md",
    chapterNumber: 21,
    title: "Technical Limitations & Known Debt",
    description: "Unvarnished disclosure of architecture boundaries, partial mock routes, and compliance certification disclaimers.",
    category: "Governance & References",
    order: 21,
    targetAudience: ["Auditors", "Evaluators", "Tech Leads"],
    iconName: "AlertOctagon",
  },
  {
    slug: "22-roadmap",
    filename: "22-roadmap.md",
    chapterNumber: 22,
    title: "Future Engineering Roadmap",
    description: "Prioritized development milestones across Immediate (P0), Short-Term (P1), Medium-Term (P2), and Long-Term (P3).",
    category: "Governance & References",
    order: 22,
    targetAudience: ["Product Leadership", "Stakeholders"],
    iconName: "Milestone",
  },
  {
    slug: "23-academic-project",
    filename: "23-academic-project.md",
    chapterNumber: 23,
    title: "Academic Capstone Project Dossier",
    description: "Formal academic submission format: Aim, Objectives, Problem Statement, System Design, Implementation, and Evaluation.",
    category: "Governance & References",
    order: 23,
    targetAudience: ["Academic Evaluators", "University Examiners"],
    iconName: "GraduationCap",
  },
  {
    slug: "24-viva-guide",
    filename: "24-viva-guide.md",
    chapterNumber: 24,
    title: "Viva & Demonstration Defense Script",
    description: "30-second elevator pitch, 1-minute overview, 5-minute live walkthrough script, and examiner technical Q&A defense.",
    category: "Governance & References",
    order: 24,
    targetAudience: ["Demonstrators", "Project Presenters"],
    iconName: "MessageSquare",
  },
  {
    slug: "25-glossary-and-references",
    filename: "25-glossary-and-references.md",
    chapterNumber: 25,
    title: "GRC Glossary & Technical References",
    description: "Authoritative regulatory definitions, standard citations (ISO, NIST), and official documentation references.",
    category: "Governance & References",
    order: 25,
    targetAudience: ["All Audiences", "Auditors", "Students"],
    iconName: "BookMarked",
  },
];

export const DOC_CATEGORIES: { name: DocCategory; description: string; iconName: string }[] = [
  {
    name: "Getting Started",
    description: "Introduction, scope, objectives, and technology stack specification.",
    iconName: "Compass",
  },
  {
    name: "Core Platform",
    description: "Workspaces, audits, control assessments, frameworks, evidence vault, findings, and reports.",
    iconName: "ShieldCheck",
  },
  {
    name: "Architecture & Engineering",
    description: "Multi-tier system design, codebase map, authentication & RBAC, PostgreSQL schemas, and security.",
    iconName: "Cpu",
  },
  {
    name: "Operations & Guides",
    description: "End-user manual, administrator runbook, troubleshooting guide, deployment, and Playwright testing.",
    iconName: "BookOpen",
  },
  {
    name: "Governance & References",
    description: "System limitations, engineering roadmap, academic capstone dossier, viva script, and GRC glossary.",
    iconName: "GraduationCap",
  },
];

export function getDocsCategories(): DocCategoryGroup[] {
  return DOC_CATEGORIES.map((cat) => {
    const items = DOCS_MANIFEST.filter((doc) => doc.category === cat.name).sort(
      (a, b) => a.order - b.order
    );
    return {
      ...cat,
      items,
    };
  });
}

export function getDocMetadataBySlug(slug: string): DocMetadata | undefined {
  const normalized = slug.toLowerCase().replace(/\.md$/, "");
  return DOCS_MANIFEST.find(
    (doc) =>
      doc.slug.toLowerCase() === normalized ||
      doc.filename.toLowerCase().replace(/\.md$/, "") === normalized ||
      (doc.chapterNumber !== undefined && `chapter-${doc.chapterNumber}` === normalized) ||
      (doc.chapterNumber !== undefined && String(doc.chapterNumber) === normalized)
  );
}

export function getAdjacentDocs(slug: string): { prev: DocMetadata | null; next: DocMetadata | null } {
  const sorted = [...DOCS_MANIFEST].sort((a, b) => a.order - b.order);
  const current = getDocMetadataBySlug(slug);
  if (!current) return { prev: null, next: null };

  const currentIndex = sorted.findIndex((doc) => doc.slug === current.slug);
  if (currentIndex === -1) return { prev: null, next: null };

  return {
    prev: currentIndex > 0 ? sorted[currentIndex - 1] : null,
    next: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
  };
}

export function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      let rawText = match[2].trim();
      rawText = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      rawText = rawText.replace(/[*_`]/g, "");
      
      const id = rawText
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      headings.push({
        id,
        text: rawText,
        level,
      });
    }
  }

  return headings;
}

export function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
