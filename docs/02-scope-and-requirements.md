# Chapter 2: Scope Boundaries & Requirements Catalogue

## 2.1 Formal Project Scope

Defining strict boundaries is essential for the integrity and technical evaluation of the Audit Platform. The platform is designed as a **Governance, Risk, and Compliance (GRC) Management and Audit Orchestration System**.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              IN-SCOPE (GRC)                                │
├────────────────────────────────────────────────────────────────────────────┤
│  ✓ Workspace & Multi-Organization Tenancy   ✓ Compliance Control Testing   │
│  ✓ Audit Lifecycle Management (5 Stages)    ✓ Evidence File Vault & S3     │
│  ✓ Audit Planning & Lead Allocation         ✓ Deficiency & Finding Tracking│
│  ✓ Framework Standards (ISO, NIST, SOC 2)   ✓ 5x5 Matrix Risk Management   │
│  ✓ Automated Progress Aggregation           ✓ 12-Section PDF-1.4 Reporting │
│  ✓ Role-Based Access Control (5 Roles)      ✓ Tamper-Evident Audit Trail   │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                    OUT-OF-SCOPE (TECHNICAL TESTING)                        │
├────────────────────────────────────────────────────────────────────────────┤
│  ✗ Penetration Testing & Exploit Execution  ✗ DAST / SAST Scanning Engines │
│  ✗ Network Port Scanning & Packet Sniffing  ✗ Vulnerability Exploitation   │
│  ✗ Automated Attack Surface Mapping         ✗ Active Directory Password Brute│
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.1.1 In-Scope Capabilities
1. **Multi-Organization Tenancy**: Isolated workspaces for managing distinct client companies or corporate subsidiaries without cross-tenant data leakage.
2. **Audit Engagement Management**: Full CRUD lifecycle tracking across 5 defined phases (`Planning`, `Fieldwork`, `Review`, `Reporting`, `Completed`).
3. **Framework Control Mapping**: Instantiation and testing of security baselines based on ISO/IEC 27001:2022, NIST CSF 2.0, NIST RMF Rev. 5, and SOC 2 Trust Services Criteria.
4. **Control Assessment Workflow**: Granular evaluation of control effectiveness (`Implemented`, `Partially Implemented`, `Not Implemented`, `Not Applicable`), notes documentation, and assessor assignment.
5. **Secure Evidence Vault**: Binary file upload, metadata cataloging, MIME/size validation, persistent storage in AWS S3 or local disk fallback, and time-limited signed download URLs (15-minute expiration).
6. **Finding & Deficiency Tracking**: Logging and tracking non-conformities across 5 severity tiers (`Critical`, `High`, `Medium`, `Low`, `Informational`) and 5 lifecycle statuses (`Open`, `In Progress`, `Remediated`, `Accepted Risk`, `Closed`).
7. **Risk Governance**: Quantitative $5 \times 5$ Likelihood $\times$ Impact risk scoring, residual risk calculation, and treatment assignment (`Mitigate`, `Accept`, `Transfer`, `Avoid`).
8. **Compliance Reporting**: Dynamic data compilation generating interactive in-browser reports across 12 standard sections and pure client-side PDF-1.4 file downloads.
9. **Tamper-Evident Audit Trail**: Real-time logging of administrative and operational actions with user attribution, timestamping, and entity tracking.

### 2.1.2 Explicitly Out-of-Scope Activities
- **Penetration Testing**: The platform does **NOT** perform active network penetration testing, payload delivery, vulnerability exploitation, or password cracking.
- **Dynamic Application Security Testing (DAST)**: No automated web crawling, SQL injection fuzzing, or cross-site scripting scanners are integrated.
- **Static Analysis (SAST)**: Code repository scanning or abstract syntax tree analysis of target application repositories is outside the scope.
- **Infrastructure Vulnerability Scanning**: The platform does not execute Nessus, OpenVAS, or Nmap scans; it ingests the *evidence and findings* resulting from such assessments conducted by human auditors.

---

## 2.2 Functional Requirements Catalogue

The following catalogue details all functional requirements verified in the repository implementation:

| ID | Feature / Requirement | Description | Status | Route / Component / Code Location | Technical Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | User Registration | Registration with name, email, password; enforces Gmail validation (`@gmail.com` or `@googlemail.com`) and min 8 chars. | **Implemented** | `src/actions/auth.ts`<br>`src/app/signin/page.tsx` | Validated by regex. Sends email confirmation redirect via Supabase. |
| **FR-02** | Email Verification Enforcement | Blocks application access until user confirms email address via link. | **Implemented** | `src/actions/auth.ts`<br>`src/proxy.ts` | Intercepted in edge proxy (`!user.email_confirmed_at`). |
| **FR-03** | User Sign In | Authenticates email & password via Supabase Auth; synchronizes session with PostgreSQL `users`. | **Implemented** | `src/actions/auth.ts`<br>`src/lib/auth.ts` | Resolves app user via `resolveAppUser` and sets HTTP-only cookies. |
| **FR-04** | User Sign Out | Invalidates Supabase session, clears cookies, and redirects to `/signin`. | **Implemented** | `src/actions/auth.ts`<br>`src/components/layout/Sidebar.tsx` | Calls `supabase.auth.signOut()`. |
| **FR-05** | Password Reset Request | Requests password reset email with anti-enumeration protection. | **Implemented** | `src/actions/auth.ts`<br>`src/app/signin/page.tsx` | Sends Supabase reset email targeting `/auth/callback?next=/reset-password`. |
| **FR-06** | Password Update | Allows authenticated password reset session to establish a new password (min 8 chars). | **Implemented** | `src/actions/auth.ts`<br>`src/app/reset-password/page.tsx` | Updates user credentials and signs out recovery session. |
| **FR-07** | Workspace Creation | Authenticated users can create new workspaces with name, description, industry, and framework. | **Implemented** | `src/actions/workspace.ts`<br>`src/components/layout/Sidebar.tsx` | Assigns creator as `Owner` in `user_workspaces`. |
| **FR-08** | Workspace Selection & Switching | Users switch between assigned workspaces via dropdown or dedicated selection screen. | **Implemented** | `src/context/WorkspaceContext.tsx`<br>`src/app/workspaces/page.tsx` | Persisted in `localStorage` (`audit-platform-workspace`). |
| **FR-09** | Workspace Isolation | Enforces strict data isolation preventing data access across workspaces. | **Implemented** | `src/lib/server-rbac.ts`<br>All `src/actions/*.ts` | Queries filter by `workspace_id = $X`. |
| **FR-10** | Member Allocation | Owners and Admins invite existing users to a workspace and allocate roles. | **Implemented** | `src/actions/workspace.ts`<br>`src/app/administration/page.tsx` | Inserts into `user_workspaces` with unique constraint. |
| **FR-11** | Member Role Management | Modifies member roles (`Admin`, `Auditor`, `Reviewer`, `Viewer`). Only Owners can manage Owner roles. | **Implemented** | `src/actions/workspace.ts`<br>`src/lib/server-rbac.ts` | Enforces `requireRoleManagement`. |
| **FR-12** | Member Removal | Removes users from a workspace without deleting the underlying user account. | **Implemented** | `src/actions/workspace.ts` | Deletes from `user_workspaces`; cascade protects tenant records. |
| **FR-13** | Audit Creation | Creates an audit with name, framework, lead, objective, scope, and target dates. | **Implemented** | `src/actions/audits.ts`<br>`src/app/audits/page.tsx` | Generates ID `AUD-YYYY-XXXXX` and initializes control assessments. |
| **FR-14** | Audit Lifecycle State Machine | Manages audit progression across `Planning`, `Fieldwork`, `Review`, `Reporting`, `Completed`. | **Implemented** | `src/actions/audits.ts`<br>`src/app/audits/[id]/page.tsx` | Validates against `VALID_AUDIT_STATUSES`. |
| **FR-15** | Dynamic Progress Calculation | Computes audit completion percentage from evaluated control effectiveness. | **Implemented** | `src/actions/assessments.ts` lines 231–254 | Formula: $((\text{Implemented} + 0.5 \times \text{Partial}) / \text{Total}) \times 100$. |
| **FR-16** | Audit Plan Management | Aggregates audits within high-level plans with start/end boundaries and target frameworks. | **Implemented** | `src/actions/audit-plans.ts`<br>`src/app/audit-plans/page.tsx` | Supports statuses `Draft`, `Approved`, `In Progress`, `Completed`. |
| **FR-17** | Control Assessment Instantiation | Instantiates framework controls into `control_assessments` when audit is accessed. | **Implemented** | `src/actions/assessments.ts` lines 108–174 | Pulls baseline framework controls and seeds assessment rows. |
| **FR-18** | Control Effectiveness Scoring | Assessors evaluate controls (`Implemented`, `Partially Implemented`, `Not Implemented`, etc.) and log notes. | **Implemented** | `src/actions/assessments.ts`<br>`src/app/audits/[id]/page.tsx` | Records assessor identity and timestamp. |
| **FR-19** | Evidence Upload (Binary) | Uploads binary files with validation (max 25MB, approved extensions). | **Implemented** | `src/actions/evidence.ts`<br>`src/lib/storage.ts` | Writes binary to S3 / disk before inserting database metadata. |
| **FR-20** | Evidence Pre-Signed Download | Generates authenticated download URLs with 15-minute expiration (S3 pre-signed or HMAC token). | **Implemented** | `src/actions/evidence.ts`<br>`src/lib/storage.ts` | Enforces 900-second expiration and tenant validation. |
| **FR-21** | Evidence Verification Endpoint | Secure API route serving local disk fallback files after validating HMAC tokens or session RBAC. | **Implemented** | `src/app/api/evidence/download/route.ts` | Checks HMAC token validity and tenant matching via join. |
| **FR-22** | Evidence Status Workflow | Tracks evidence across `Requested`, `Submitted`, `Under Review`, `Accepted`, `Rejected`. | **Implemented** | `src/actions/evidence.ts`<br>`src/app/evidence/page.tsx` | Validates against `VALID_EVIDENCE_STATUSES`. |
| **FR-23** | Finding Creation & Severity | Logs deficiencies across 5 severities (`Critical`, `High`, `Medium`, `Low`, `Informational`). | **Implemented** | `src/actions/findings.ts`<br>`src/app/findings/page.tsx` | Generates ID `FND-YYYY-XXXX` and updates audit finding counter. |
| **FR-24** | Finding Remediation Lifecycle | Tracks finding status (`Open`, `In Progress`, `Remediated`, `Accepted Risk`, `Closed`). | **Implemented** | `src/actions/findings.ts`<br>`src/app/audits/[id]/findings/page.tsx` | Normalizes legacy statuses (`Resolved` $\rightarrow$ `Remediated`). |
| **FR-25** | Cross-Workspace Evidence Check | Blocks linking evidence belonging to another workspace when creating a finding. | **Implemented** | `src/actions/findings.ts` lines 204–216 | Performs workspace ownership verification query. |
| **FR-26** | Quantitative Risk Register | Logs risks with Likelihood (1–5) and Impact (1–5) calculating overall Risk Score (1–25). | **Implemented** | `src/actions/risks.ts`<br>`src/app/risk-management/page.tsx` | Maps scores to levels: `Critical` ($\ge 16$), `High` ($\ge 10$), `Med` ($\ge 5$), `Low`. |
| **FR-27** | Residual Risk Scoring | Computes residual risk score and level post-mitigation or post-risk-acceptance. | **Implemented** | `src/actions/risks.ts` lines 237–246 | Reduces score to 40% on acceptance or 0 on closure. |
| **FR-28** | Compliance Report Compilation | Compiles live audit, assessment, evidence, finding, and risk metrics into JSON structure. | **Implemented** | `src/actions/reports.ts`<br>`src/app/reports/page.tsx` | Synthesizes executive summary, recommendations, conclusion. |
| **FR-29** | 12-Section Interactive Viewer | Renders compiled report in modal viewer across 12 structured compliance sections. | **Implemented** | `src/components/reports/AuditReportViewer.tsx` | Formatted for executive review and printable via `@media print`. |
| **FR-30** | Pure JS/TS PDF-1.4 Generator | Programmatically builds standard-compliant PDF-1.4 binary documents without external binaries. | **Implemented** | `src/lib/pdf-generator.ts` | Builds PDF Catalog, Pages, Helvetica Type 1 fonts, streams, xref. |
| **FR-31** | Governance Audit Trail Logging | Automatically logs all CRUD and status changes across 8 entity types. | **Implemented** | `src/actions/audit-trail.ts` | Records user ID, email, entity ID, action, description, details. |
| **FR-32** | Audit Trail Filter & Search | Filters audit trail events by entity type, action, user email, date range, and text search. | **Implemented** | `src/actions/audit-trail.ts`<br>`src/app/audit-trail/page.tsx` | Parameterized SQL query with dynamic WHERE clause. |
| **FR-33** | Executive Dashboard Metrics | Aggregates workspace KPIs: audit statuses, finding severities, risk posture, compliance %. | **Implemented** | `src/actions/dashboard.ts`<br>`src/app/dashboard/page.tsx` | Queries live counts and renders interactive Recharts. |
| **FR-34** | Global Search Modal | Real-time cross-entity keyword search across audits, plans, findings, risks, evidence, and reports. | **Implemented** | `src/actions/search.ts`<br>`src/components/layout/Header.tsx` | Returns unified list with direct navigation links. |
| **FR-35** | Seed Framework Standards | Pre-seeds baseline controls for ISO 27001, NIST CSF, NIST RMF, and SOC 2. | **Implemented** | `src/lib/db.ts` lines 336–385 | Seeds 4 frameworks and 28 controls on schema initialization. |
| **FR-36** | Custom Framework Management | Allows Admins to create and configure custom compliance frameworks and controls. | **Implemented** | `src/actions/frameworks.ts`<br>`src/app/frameworks/page.tsx` | Scoped to workspace (`workspace_id IS NULL OR workspace_id = $1`). |
| **FR-37** | Secondary Remediation Dashboard | Standalone dashboard tracking remediation actions linked to findings. | **Partial** | `src/app/remediation/page.tsx` | UI implemented; currently loads from `grcData.ts` seed list. |
| **FR-38** | Standalone Tasks Dashboard | Operational task management interface for auditor assignment. | **Partial** | `src/app/tasks/page.tsx` | UI implemented; currently loads from `grcData.ts` seed list. |
| **FR-39** | Audit Calendar View | Calendar schedule view displaying audit milestones and fieldwork dates. | **Partial** | `src/app/calendar/page.tsx` | UI implemented; currently loads from `grcData.ts` seed list. |
| **FR-40** | Notification Flyout | Header notifications displaying latest 5 activity events from audit trail. | **Implemented** | `src/components/layout/Header.tsx` | Queries `getAuditTrail` with limit 5; live counter badge. |

---

## 2.3 Non-Functional Requirements (NFR)

The system satisfies the following non-functional engineering standards:

### 2.3.1 Security & Data Isolation
- **NFR-01 (Workspace Isolation)**: Absolute separation between workspace data. The PostgreSQL database enforces foreign keys (`ON DELETE CASCADE`), and all server actions authenticate workspace membership prior to executing queries.
- **NFR-02 (SQL Injection Prevention)**: All SQL queries utilize parameterized positional arguments (`$1, $2, ...`) via `node-postgres` (`pg`). Dynamic string concatenation of untrusted input into SQL queries is completely absent.
- **NFR-03 (Authentication Security)**: Passwords are managed securely through Supabase Auth (or hashed using `bcryptjs` with a work factor of 10 for administrative records). Sessions are validated using cryptographic token verification.
- **NFR-04 (Evidence Storage Privacy)**: Binary objects are never stored with publicly readable URLs. Object keys include cryptographic UUIDs (`workspaces/${workspaceId}/audits/${auditId}/${randomUUID}-${filename}`). Pre-signed S3 URLs or HMAC-SHA256 tokens strictly expire after 15 minutes (900 seconds).

### 2.3.2 Performance & Scalability
- **NFR-05 (Serverless Lifecycle & Connection Pooling)**: Database queries utilize lazy pool initialization with an active pool size of 10 connections and 30-second idle timeouts (`src/lib/db.ts`), preventing connection exhaustion on Vercel serverless edge workers.
- **NFR-06 (Lightweight PDF Synthesis)**: The reporting engine utilizes pure TypeScript/JavaScript PDF generation, generating 10-page documents in under 150 milliseconds in-memory without spawning headless Chrome or Puppeteer instances.
- **NFR-07 (Database Indexing)**: Composite indexes are defined across all primary lookup keys (`workspace_id`, `audit_id`, `created_at`, `supabase_user_id`), ensuring sub-50ms query latency on large datasets.

### 2.3.3 Usability, Accessibility & Design
- **NFR-08 (Responsive Interface)**: The application features a 250px fixed navigation sidebar on desktop with smooth scrolling, collapsible navigation drawers on mobile, and flexible CSS grid layouts.
- **NFR-09 (Design Consistency)**: Built with a cohesive enterprise color palette (`#031b3d` navy brand sidebar, `#f6f8fc` slate canvas, `#2563eb` action blues, and standard severity badge tones).
- **NFR-10 (Accessibility)**: Implements semantic HTML tags (`<header>`, `<nav>`, `<aside>`, `<main>`), proper `aria-expanded` and `aria-label` attributes on modals and dropdowns, and high-contrast color pairings.

### 2.3.4 Reliability, Observability & Maintainability
- **NFR-11 (Zero TypeScript Errors)**: The entire codebase compiles with zero type errors (`tsc --noEmit`). Strict typing is enforced across all domain entities.
- **NFR-12 (Automated E2E Verification)**: 9 Playwright end-to-end test suites validate authentication, workspace isolation, header controls, audit lifecycles, and report viewer rendering.
- **NFR-13 (Edge Proxy Reliability)**: Next.js 16 edge proxy (`src/proxy.ts`) guarantees unauthenticated users cannot access protected routes and prevents verified users from landing back on `/signin`.
- **NFR-14 (Idempotent Migrations)**: Database schema definitions execute with `CREATE TABLE IF NOT EXISTS` and idempotent `ALTER TABLE ADD COLUMN IF NOT EXISTS`, preventing deployment restart crashes.
- **NFR-15 (Observability via Audit Trail)**: Every administrative mutation, status change, and entity creation writes an immutable record to `audit_trail` containing user attribution, action type, and sanitized JSON details.
