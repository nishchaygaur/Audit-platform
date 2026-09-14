# Audit Platform — Documentation Portal

> **Enterprise Cybersecurity & GRC (Governance, Risk, and Compliance) Audit Management Platform**  
> *Live Deployment:* [https://auditplatform-nu.vercel.app/](https://auditplatform-nu.vercel.app/)  
> *Source Repository:* [https://github.com/nishchaygaur/Audit-platform](https://github.com/nishchaygaur/Audit-platform)  
> *Primary Branch:* `main` | *Application Runtime:* Next.js 16.3.4 (Turbopack, App Router) • React 19.2.8 • PostgreSQL • Supabase Auth • AWS S3

---

## 1. Welcome to the Audit Platform Documentation

The **Audit Platform** is an enterprise-grade Governance, Risk, and Compliance (GRC) management system engineered to orchestrate the complete cybersecurity audit lifecycle across multiple corporate workspaces. The platform provides structured framework control assessment, tamper-evident audit trails, cryptographically verified evidence management, finding lifecycle tracking, automated risk scoring, and multi-section compliance reporting.

This documentation package provides an exhaustive, source-code-grounded technical analysis, architectural breakdown, user manual, administrator guide, security evaluation, and academic evaluation package for the platform.

```
USER
  └── WORKSPACE / ORGANIZATION
        └── AUDITS
              ├── AUDIT PLANS / CONTROLS (ISO 27001, NIST CSF, NIST RMF, SOC 2)
              ├── EVIDENCE (AWS S3 & Local Persistent Disk Fallback)
              ├── CONTROL ASSESSMENTS (Effectiveness Scoring & Progress)
              ├── FINDINGS & DEFICIENCIES (Remediation Tracking)
              ├── RISK REGISTER (5x5 Likelihood x Impact Matrix)
              └── REPORTS (12-Section Synthesis & Pure JS/TS PDF-1.4 Generator)
```

---

## 2. Documentation Directory Index

This documentation suite is partitioned into 25 comprehensive modular chapters:

| Document | Title | Description & Target Audience |
| :--- | :--- | :--- |
| **[01. Project Overview](./01-project-overview.md)** | Executive Summary & Project Background | High-level summary, industry problem statement, proposed solution, objectives, and persona definitions. |
| **[02. Scope & Requirements](./02-scope-and-requirements.md)** | Scope Boundaries & Requirements Catalogue | In-scope GRC features vs. out-of-scope tasks (explicitly excluding penetration testing); 40 functional requirements & 15 NFRs. |
| **[03. System Architecture](./03-system-architecture.md)** | System Architecture & Mermaid Diagrams | End-to-end multi-tier architecture, Next.js 16 server actions, edge proxy, and sequence diagrams. |
| **[04. Technology Stack](./04-technology-stack.md)** | Technology Stack Specification | Verified stack breakdown (Next.js 16, React 19, Supabase, Neon PostgreSQL, S3, Recharts, Playwright). |
| **[05. Codebase Structure](./05-codebase-structure.md)** | Repository Layout & Module Catalogue | Complete repository walkthrough, file responsibilities, imports, and component relationships. |
| **[06. Authentication](./06-authentication.md)** | Authentication, Session & RBAC | Supabase SSR auth, PKCE & OTP token callbacks, email verification, account resolution, and 5-role RBAC. |
| **[07. Workspaces](./07-workspaces.md)** | Multi-Organization Tenancy Model | Data isolation mechanics, workspace creation, member role assignment, and active context persistence. |
| **[08. Audit Management](./08-audit-management.md)** | Audit Lifecycle & Fieldwork | 5-stage lifecycle (`Planning` → `Fieldwork` → `Review` → `Reporting` → `Completed`), scoping, and progress calculation. |
| **[09. Audit Plan](./09-audit-plan.md)** | Audit Planning & Control Assessments | Planning horizons, baseline control assessment instantiation, assessor tracking, and effectiveness scoring. |
| **[10. Frameworks](./10-frameworks.md)** | Framework Implementation Analysis | Deep dive into ISO 27001:2022, NIST CSF 2.0, NIST RMF Rev. 5, and SOC 2; control mapping vs. certification. |
| **[11. Evidence](./11-evidence.md)** | Evidence Lifecycle & Storage Architecture | AWS S3 object storage integration, pre-signed URLs, HMAC-SHA256 fallback tokens, and upload validation. |
| **[12. Findings](./12-findings.md)** | Findings Management & Remediation | Finding taxonomy (5 severities, 5 statuses), evidence linkages, remediation workflows, and cross-tenant checks. |
| **[13. Reporting](./13-reporting.md)** | Compliance Reporting & PDF Synthesis | Real-time data compilation, 12 report sections, pure JS/TS PDF-1.4 generation engine, and JSON export. |
| **[14. Data Model](./14-data-model.md)** | PostgreSQL Schema & Entity Relations | Complete SQL schema definitions, constraints, composite indexes, field dictionaries, and Mermaid ER diagrams. |
| **[15. Security](./15-security.md)** | Security Architecture & Evaluation | Implemented security controls vs. controls requiring improvement; SQL injection defense, CSRF, and threat model. |
| **[16. Testing](./16-testing.md)** | Testing Architecture & Traceability Matrix | Playwright E2E test suite analysis across 9 specifications; requirement-to-test traceability matrix and test gaps. |
| **[17. Deployment](./17-deployment.md)** | Production Deployment & Infrastructure | Vercel Edge Serverless deployment, Neon PostgreSQL connectivity, build output analysis, and environment variables. |
| **[18. User Guide](./18-user-guide.md)** | Comprehensive End-User Manual | Step-by-step operator guide using real application UI terms from initial login to final report export. |
| **[19. Admin Guide](./19-admin-guide.md)** | Administrator & Maintenance Runbook | Team management, role delegation, immutable audit trail governance, database seeding, and operational hygiene. |
| **[20. Troubleshooting](./20-troubleshooting.md)** | Technical Troubleshooting Guide | Comprehensive symptom-cause-remedy matrix covering authentication, database timeouts, storage, and build issues. |
| **[21. Limitations](./21-limitations.md)** | Technical Limitations & Known Debt | Unvarnished disclosure of architecture boundaries, partial mock routes, and compliance certification disclaimers. |
| **[22. Roadmap](./22-roadmap.md)** | Future Engineering Roadmap | Prioritized development milestones across Immediate (P0), Short-Term (P1), Medium-Term (P2), and Long-Term (P3). |
| **[23. Academic Project](./23-academic-project.md)** | Capstone / Academic Project Dossier | Formal academic submission format: Aim, Objectives, Problem Statement, System Design, Implementation, Evaluation. |
| **[24. Viva Guide](./24-viva-guide.md)** | Viva & Demonstration Script | 30-second elevator pitch, 1-minute overview, 5-minute live walkthrough script, and examiner technical Q&A defense. |
| **[25. Glossary & References](./25-glossary-and-references.md)** | GRC Glossary & Technical References | Authoritative regulatory definitions, standard citations (ISO, NIST), and official documentation references. |

---

## 3. Quick System Information

| Attribute | Specification |
| :--- | :--- |
| **System Classification** | Cybersecurity Governance, Risk & Compliance (GRC) Platform |
| **Architectural Model** | Workspace-Isolated Multi-Tenant Next.js Web Application |
| **Frontend Framework** | React 19.2.8 / Next.js 16.3.4 (App Router) |
| **Styling Engine** | Tailwind CSS v4 (PostCSS 4) |
| **Database Engine** | Remote PostgreSQL (Connection pooling via `pg` Pool, hosted on Neon / Supabase) |
| **Authentication Provider** | Supabase Auth (`@supabase/ssr`) with PKCE and token hash verification |
| **Binary Object Storage** | AWS S3 (`@aws-sdk/client-s3`) with Local Persistent Disk Fallback |
| **Reporting Output** | In-Browser HTML Viewer & Pure TypeScript/JavaScript PDF-1.4 Generator |
| **Test Framework** | Playwright Test 1.63.0 (End-to-End Suite) |
| **Production Host** | Vercel Edge Serverless Platform (`https://auditplatform-nu.vercel.app/`) |

---

## 4. Reading Paths by Audience

- **Academic Evaluators & Project Examiners**: Start with [01. Project Overview](./01-project-overview.md), review [02. Scope & Requirements](./02-scope-and-requirements.md), study the system design in [03. System Architecture](./03-system-architecture.md), check the academic evaluation in [23. Academic Project](./23-academic-project.md), and use [24. Viva Guide](./24-viva-guide.md) for demonstration verification.
- **Software Engineers & DevOps**: Start with [04. Technology Stack](./04-technology-stack.md), [05. Codebase Structure](./05-codebase-structure.md), [14. Data Model](./14-data-model.md), [16. Testing](./16-testing.md), and [17. Deployment](./17-deployment.md).
- **Security & Compliance Auditors**: Examine [06. Authentication](./06-authentication.md), [07. Workspaces](./07-workspaces.md), [10. Frameworks](./10-frameworks.md), [11. Evidence](./11-evidence.md), [12. Findings](./12-findings.md), and [15. Security](./15-security.md).
- **End Users & Administrators**: Refer directly to [18. User Guide](./18-user-guide.md) and [19. Admin Guide](./19-admin-guide.md).
