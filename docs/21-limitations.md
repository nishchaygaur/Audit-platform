# Section 21: System Limitations & Architectural Boundaries

## 1. Transparency & Purpose of This Document

Honest technical self-assessment is a fundamental requirement of professional software engineering and academic capstone evaluation. This document explicitly catalogs the platform's current operational constraints, non-functional limitations, secondary mock routes, and architectural boundaries.

---

## 2. Functional & Scope Limitations

### 2.1 Not a Penetration Testing or Vulnerability Scanning Engine
- **Boundary**: The platform is an enterprise **Governance, Risk, and Compliance (GRC)** audit management suite.
- **Out of Scope**: It does **not** perform network port scanning, dynamic web vulnerability scanning (DAST), penetration testing exploits, or automated source code security auditing (SAST). 
- **Operational Integration**: External security tools (e.g., Snyk, SonarQube, Nessus, Burp Suite) generate the raw vulnerability reports that human auditors summarize, evaluate, and attach into this platform as evidentiary documentation.

### 2.2 Formal Certification & Attestation Disclaimer
- **Boundary**: Achieving 100% compliance within the platform does **not** grant formal accreditation under ISO/IEC 27001 or issue an official AICPA SOC 2 Type II attestation report.
- **Accreditation Mandate**: Only accredited Third-Party Assessment Organizations (3PAO), Certification Bodies (CBs), and licensed CPA firms can issue official certifications. The platform serves as the internal management system and evidence repository presented to those auditors.

---

## 3. Implementation Status of Secondary Routes

While the core audit workflow—authentication, multi-tenant workspaces, audit lifecycles, control assessments, persistent evidence vault, findings, risk registers, and 12-section PDF reporting—is fully backed by PostgreSQL and S3, certain secondary utility routes currently employ client-side state or placeholder datasets:

| Route / Module | Current Implementation Status | Data Source | Planned Evolution |
| :--- | :--- | :--- | :--- |
| **`/audits` & `/audits/[id]`** | **Full Production** | Neon PostgreSQL (`audits`, `control_assessments`) | Dynamic live updates |
| **`/evidence`** | **Full Production** | Neon PostgreSQL (`evidence`) + S3 / Local HMAC | Real binary streaming |
| **`/findings`** | **Full Production** | Neon PostgreSQL (`findings`) | Live SLA tracking |
| **`/reports`** | **Full Production** | Neon PostgreSQL (`reports`) + In-Memory PDF-1.4 | 12-section compilation |
| **`/administration`** | **Full Production** | Neon PostgreSQL (`users`, `user_workspaces`) | Multi-tenant RBAC |
| **`/remediation`** | *Partial / Transitional* | Client state initialized from `grcData.ts` | Refactor to query `findings` table directly |
| **`/tasks`** | *Partial / Transitional* | Static client-side task queue | Connect to user action items |
| **`/calendar`** | *Partial / Transitional* | Mock calendar grid | Derive milestones from `audits.due_date` |

---

## 4. Architectural & Storage Constraints

### 4.1 Single-Region Object Storage
- The current S3 configuration binds to a single cloud region (e.g., `us-east-1`).
- Multi-region replication, cross-continent active-active failover, and geographic CDN caching for binary files are not currently configured.

### 4.2 Standard Type 1 Typography in Pure PDF Generator
- The custom in-memory PDF engine (`src/lib/pdf-generator.ts`) utilizes standard Adobe Type 1 fonts (`/Helvetica` and `/Helvetica-Bold`).
- While this eliminates external dependencies and executes in <150ms, it lacks native support for complex scripts requiring custom TrueType/OpenType font table parsing (e.g., Arabic, CJK, Devanagari). Non-Latin characters are currently escaped or omitted.

### 4.3 Upload Antivirus & Threat Inspection Pipeline
- File uploads are strictly filtered by extension and size (25MB cap), but binary streams are not currently piped through an automated malware scanner (such as ClamAV or VirusTotal API) prior to object storage persistence.

### 4.4 In-Memory Connection Pool vs Serverless Concurrency
- `src/lib/db.ts` uses an in-process pool (`max: 10`). When serverless functions scale horizontally to hundreds of instances, direct database connections can multiply. The system relies on Neon's PgBouncer pooled connection endpoint to prevent exhaustion under heavy bursts.
