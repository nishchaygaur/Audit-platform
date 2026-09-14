# Chapter 3: System Architecture & Data Flow

## 3.1 Architectural Overview

The **Audit Platform** is constructed as a modern, multi-tier cloud application built upon **Next.js 16.3.4 (App Router)** and **React 19.2.8**, running on the **Vercel Edge Serverless Platform**. Rather than relying on a separate custom backend microservice (e.g. Express or NestJS), the application utilizes Next.js 16 native **Server Actions (`'use server'`)** as a type-safe RPC boundary, coupled with direct PostgreSQL connection pooling and managed cloud services for authentication and object storage.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                   │
│  React 19 SPA (Client Components, Tailwind v4, Lucide Icons, Recharts)     │
│  Context Providers: AuthContext • WorkspaceContext • AuditContext          │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ HTTPS / Next.js Server Action RPC
┌─────────────────────────────────────▼──────────────────────────────────────┐
│                           EDGE PROXY & ROUTING                             │
│  Next.js 16 Edge Proxy (src/proxy.ts) • Session Verification & Redirects   │
│  App Router: /dashboard, /audits, /evidence, /findings, /reports, etc.     │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼──────────────────────────────────────┐
│                            SERVER ACTION TIER                              │
│  Type-Safe Server Actions (src/actions/*.ts) • Server-Side RBAC Validation │
│  Audit Trail Logger • PDF Generator Engine • S3 Request Presigner          │
└──────────────┬──────────────────────┬──────────────────────┬───────────────┘
               │                      │                      │
┌──────────────▼──────┐┌──────────────▼──────┐┌──────────────▼───────────────┐
│   SUPABASE AUTH     ││  REMOTE POSTGRESQL  ││     OBJECT STORAGE VAULT     │
│ • Supabase SSR      ││ • Neon Tech / Hosted││ • AWS S3 Object Storage      │
│ • PKCE Code Exchange││ • Direct Pool ('pg')││ • Pre-Signed URLs (15-min)   │
│ • Token Hash OTP    ││ • Relational Tables ││ • Local Persistent Disk      │
│ • JWT Cookies       ││ • Cascade Integrity ││   Fallback (.storage/evd)   │
└─────────────────────┘└─────────────────────┘└──────────────────────────────┘
```

---

## 3.2 Tier-by-Tier Architectural Breakdown

### 1. Presentation & State Tier (Client)
- **React 19 Client Components**: Highly responsive, interactive components utilizing React 19 hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- **Context Architecture**:
  - `AuthContext.tsx`: Distributes authenticated user identity and role across all client trees.
  - `WorkspaceContext.tsx`: Maintains the active workspace ID, synchronizes with `localStorage` (`audit-platform-workspace`), and triggers workspace reloading.
  - `AuditContext.tsx`: Caches and synchronizes the active audit list and provides CRUD dispatchers for audit records.
- **Component Styling**: Built using **Tailwind CSS v4** with a custom CSS design system defining status badges, interactive dialogs, progress bars, and high-density data tables.
- **Data Visualization**: Employs **Recharts 3.10.1** to render interactive audit status bars, finding severity distributions, risk matrices, and compliance trend lines.

### 2. Edge Proxy & Routing Tier
- **Next.js 16 Edge Proxy (`src/proxy.ts`)**: Acts as a zero-trust network ingress filter. For all incoming requests matched by `config.matcher`, the proxy:
  1. Initializes the Supabase SSR client with request cookies.
  2. Resolves `supabase.auth.getUser()`.
  3. Inspects route path against public paths (`/signin`, `/reset-password`, `/auth/callback`).
  4. Redirects unauthenticated or unverified users (`!user.email_confirmed_at`) immediately to `/signin`.
  5. Prevents verified authenticated users from visiting `/signin`, redirecting them to `/workspaces`.

### 3. Application Logic & Server Action Tier
- **Server Actions (`'use server'`)**: All data mutations and data fetching execute via server actions residing in `src/actions/`. These actions run strictly server-side in Node.js serverless execution contexts.
- **Authoritative Authorization**: Every server action calls `requirePermission(permission, workspaceId)` from `src/lib/server-rbac.ts`, verifying against PostgreSQL before touching domain tables.
- **Sanitized Governance Logging**: After every write mutation, `logAuditEvent(...)` records an immutable trace in the `audit_trail` table.

### 4. Persistence & Database Tier
- **PostgreSQL Database**: Configured for **Neon PostgreSQL** or **Supabase PostgreSQL** via `process.env.DATABASE_URL`.
- **Connection Management (`src/lib/db.ts`)**: Employs a pooled connection architecture using `pg.Pool` configured with `max: 10`, `idleTimeoutMillis: 30000`, and `connectionTimeoutMillis: 10000`. It features lazy evaluation to avoid serverless module-initialization timeouts.
- **Schema Management**: Self-bootstraps via `ensureSchema()`, executing idempotent DDL statements (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) and seeding initial GRC frameworks on first run.

### 5. Object Storage Vault Tier
- **Dual-Tier Storage Architecture (`src/lib/storage.ts`)**:
  - *Tier A (Cloud S3)*: When `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` are provided, files are stored in AWS S3 (or S3-compatible endpoints such as Cloudflare R2 or MinIO). Pre-signed download URLs are issued with a strict 15-minute expiration (`expiresInSeconds: 900`).
  - *Tier B (Local Persistent Disk Fallback)*: When S3 credentials are not set, files are safely persisted to `.storage/evidence` on disk. Downloads are authorized through HMAC-SHA256 signatures generated using `JWT_SECRET` and validated by `/api/evidence/download/route.ts`.

---

## 3.3 Architecture Diagrams (Mermaid)

### 3.3.1 System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Tier (Browser)"]
        UI[React 19 UI / Tailwind CSS]
        Ctx[Auth & Workspace Contexts]
        PDFEngine[SimplePdfDocument Generator]
    end

    subgraph Edge ["Edge Proxy Tier (Vercel)"]
        Proxy["src/proxy.ts (Middleware Interceptor)"]
    end

    subgraph ServerActions ["Server Action Tier (Next.js 16)"]
        AuthAction["actions/auth.ts"]
        WsAction["actions/workspace.ts"]
        AuditAction["actions/audits.ts"]
        AssessAction["actions/assessments.ts"]
        EvAction["actions/evidence.ts"]
        FindAction["actions/findings.ts"]
        RiskAction["actions/risks.ts"]
        ReportAction["actions/reports.ts"]
        TrailAction["actions/audit-trail.ts"]
        SRBAC["lib/server-rbac.ts"]
    end

    subgraph ExternalAuth ["Authentication Service"]
        SupaAuth[Supabase Auth SSR]
    end

    subgraph Database ["Persistence Tier"]
        PG[(PostgreSQL Database)]
        Pool["pg.Pool Connection Pool"]
    end

    subgraph StorageVault ["Object Storage Tier"]
        S3Client["AWS S3 Client (@aws-sdk)"]
        S3Bucket[("AWS S3 Bucket / Cloudflare R2")]
        LocalStore[("Local Disk (.storage/evidence)")]
        DownloadRoute["/api/evidence/download (HMAC Auth)"]
    end

    UI <--> Ctx
    UI -->|HTTP POST Server Action| Proxy
    Proxy -->|Authenticated Request| ServerActions
    AuthAction <-->|PKCE & OTP Verify| SupaAuth
    ServerActions -->|Check Permission| SRBAC
    SRBAC -->|Query Membership| Pool
    ServerActions -->|Execute SQL| Pool
    Pool <--> PG
    EvAction -->|Put / Get Object| S3Client
    S3Client <--> S3Bucket
    EvAction -.->|Fallback Storage| LocalStore
    LocalStore <--> DownloadRoute
    ReportAction -->|Compile Content| UI
    UI -->|Render & Export| PDFEngine
```

---

### 3.3.2 Authentication & User Resolution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Auditor / User
    participant Page as /signin (Client)
    participant Action as actions/auth.ts (Server)
    participant Supabase as Supabase Auth
    participant CB as /auth/callback (Route)
    participant DB as PostgreSQL (users table)
    participant Proxy as proxy.ts (Edge)

    User->>Page: Enters Gmail & Password
    Page->>Action: signUp(formData) or signIn(formData)
    Action->>Supabase: signInWithPassword({ email, password })
    
    alt Email Not Verified
        Supabase-->>Action: error ("Email not confirmed")
        Action-->>Page: Return error ("Please verify your email")
    else Valid & Confirmed
        Supabase-->>Action: Returns Session & User Object
        Action->>DB: resolveAppUser(supabaseUser)
        DB-->>Action: Returns Application AppUser Record
        Action-->>Page: Returns { success: true }
        Page->>Proxy: Navigate to /workspaces
        Proxy->>Proxy: Verify Session & email_confirmed_at
        Proxy-->>User: Render /workspaces
    end

    alt Email Confirmation Callback Flow
        User->>CB: Clicks link (?code=xyz or ?token_hash=abc)
        CB->>Supabase: exchangeCodeForSession(code) OR verifyOtp(token_hash)
        Supabase-->>CB: Returns Verified User Session
        CB->>DB: resolveAppUser(data.user)
        CB-->>User: Redirect to /workspaces (or safe next path)
    end
```

---

### 3.3.3 Multi-Tenant Workspace & Authorization Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated User
    participant UI as Sidebar / Workspace Selector
    participant Context as WorkspaceContext
    participant Server as Server Action
    participant RBAC as server-rbac.ts
    participant DB as PostgreSQL

    User->>UI: Selects Workspace (e.g. "Acme Corp")
    UI->>Context: setWorkspace(workspaceId)
    Context->>Context: Save to localStorage("audit-platform-workspace")
    Context-->>UI: Update Active Workspace State

    User->>UI: Triggers Action (e.g. Create Finding)
    UI->>Server: createFinding(workspaceId, input)
    Server->>RBAC: requirePermission("findings.create", workspaceId)
    RBAC->>DB: SELECT role FROM user_workspaces WHERE user_id=$1 AND workspace_id=$2
    
    alt Not a Member
        DB-->>RBAC: null
        RBAC-->>Server: throw AuthorizationError("Forbidden: Not a member")
        Server-->>UI: Return { success: false, error: "Forbidden" }
    else Has Required Role (e.g. Auditor)
        DB-->>RBAC: role = "Auditor"
        RBAC->>RBAC: Check ROLE_PERMISSIONS["Auditor"].includes("findings.create")
        RBAC-->>Server: Authorized { user, role }
        Server->>DB: INSERT INTO findings (...) WHERE workspace_id=$1
        Server->>DB: INSERT INTO audit_trail (...) (Governance Log)
        DB-->>Server: Success
        Server-->>UI: Return { success: true, data: newFinding }
    end
```

---

### 3.3.4 Audit 5-Stage Lifecycle & Progress Aggregation

```mermaid
stateDiagram-v2
    [*] --> Planning: createAudit() [id: AUD-YYYY-XXXX]
    
    state Planning {
        [*] --> ScopeDefinition
        ScopeDefinition --> ObjectiveSetting
        ObjectiveSetting --> AssignLead
    }
    
    Planning --> Fieldwork: updateAudit(status = "Fieldwork")
    
    state Fieldwork {
        [*] --> ControlAssessments
        ControlAssessments --> EvidenceCollection
        EvidenceCollection --> FindingIdentification
        FindingIdentification --> RiskLogging
    }
    
    Fieldwork --> Review: updateAudit(status = "Review")
    
    state Review {
        [*] --> QAInspection
        QAInspection --> EvidenceApproval
        EvidenceApproval --> RemediationReview
    }
    
    Review --> Reporting: updateAudit(status = "Reporting")
    
    state Reporting {
        [*] --> GenerateReportData
        GenerateReportData --> ExecutiveReview
        ExecutiveReview --> PDFExport
    }
    
    Reporting --> Completed: updateAudit(status = "Completed")
    
    state Completed {
        [*] --> AuditClosed
        AuditClosed --> ImmutableArchive
    }
    
    Completed --> [*]
```

---

### 3.3.5 Evidence Upload & Pre-Signed Retrieval Flow

```mermaid
sequenceDiagram
    autonumber
    actor Auditor as Lead Auditor
    participant Modal as Add Evidence Modal
    participant Action as actions/evidence.ts
    participant Storage as lib/storage.ts
    participant S3 as AWS S3 / Local Disk
    participant DB as PostgreSQL
    participant Trail as actions/audit-trail.ts

    Auditor->>Modal: Selects File (e.g. policy.pdf) + Enters Control
    Modal->>Action: uploadEvidenceFile(workspaceId, auditId, formData)
    
    Action->>Action: Validate file size (<= 25MB) & extension (.pdf, .docx, etc.)
    Action->>Action: Check target audit belongs to workspace
    Action->>Storage: generateStorageKey(workspaceId, auditId, filename)
    Storage-->>Action: storageKey: "workspaces/WID/audits/AID/UUID-policy.pdf"
    
    Action->>Storage: putObject({ key, body: buffer, contentType })
    Storage->>S3: Upload binary stream
    S3-->>Storage: Upload confirmation (ETag)
    
    Action->>DB: INSERT INTO evidence (id, workspace_id, audit_id, storage_key, ...)
    Action->>DB: UPDATE audits SET evidence = (COUNT) WHERE id = auditId
    Action->>Trail: logAuditEvent("CREATE", "Evidence", id)
    Action-->>Modal: Return { success: true, data: record }

    alt Downloading Evidence
        Auditor->>Modal: Clicks "Download Evidence"
        Modal->>Action: getEvidenceDownloadUrl(workspaceId, evidenceId)
        Action->>Storage: getSignedDownloadUrl({ key, filename, workspaceId, evidenceId })
        alt S3 Configured
            Storage->>Storage: S3 GetObjectCommand + getSignedUrl (15-min expiry)
            Storage-->>Action: Pre-signed AWS S3 URL
        else Local Fallback
            Storage->>Storage: generateDownloadToken(HMAC-SHA256)
            Storage-->>Action: "/api/evidence/download?key=...&token=...&expires=..."
        end
        Action-->>Modal: Return { success: true, downloadUrl }
        Modal-->>Auditor: Browser triggers direct download
    end
```

---

### 3.3.6 Report Generation & PDF Synthesis Pipeline

```mermaid
flowchart TD
    Start([User Clicks 'Generate Report']) --> ReqAuth[Authorize via requirePermission 'reports.generate']
    ReqAuth --> FetchAudit[Query Audit Record & Metadata]
    FetchAudit --> FetchAssess[Query Control Assessments & Breakdown]
    FetchAssess --> FetchEv[Query Evidence Artifacts & Statuses]
    FetchEv --> FetchFind[Query Findings, Severities & Recommendations]
    FetchFind --> FetchRisk[Query Risks, Likelihood, Impact & Scores]
    
    FetchRisk --> SynthesizeMetrics[Compute Compliance % & Metric Tallies]
    SynthesizeMetrics --> GenerateExecutiveSummary[Synthesize Executive Summary Text]
    GenerateExecutiveSummary --> GenerateRecommendations[Synthesize Prioritized Recommendations]
    GenerateRecommendations --> GenerateConclusion[Synthesize Auditor Statement & Conclusion]
    
    GenerateConclusion --> StoreReport[INSERT INTO reports Table in PostgreSQL]
    StoreReport --> LogTrail[Write to audit_trail Event Ledger]
    LogTrail --> ReturnJSON[Return ReportRecord to Browser]
    
    ReturnJSON --> OpenViewer[Open AuditReportViewer Modal]
    OpenViewer --> UserAction{User Selection}
    
    UserAction -->|Print View| PrintCSS[Apply @media print Stylesheet]
    UserAction -->|Download JSON| JSONBlob[Export Formatted JSON File]
    UserAction -->|Download PDF| PDFEngine[Invoke SimplePdfDocument Engine]
    
    subgraph PDFEngineInternal ["Pure TS/JS PDF-1.4 Generator (lib/pdf-generator.ts)"]
        PDFEngine --> BuildCatalog[1. Construct PDF Catalog & Pages Tree]
        BuildCatalog --> EmbedFonts[2. Instantiate Helvetica & Helvetica-Bold Type 1 Fonts]
        EmbedFonts --> DrawRibbons[3. Paint Headers, Decorative Bars & Section Ribbons]
        DrawRibbons --> StreamText[4. Wrap & Emit 9pt Text Content Streams]
        StreamText --> GenXref[5. Compute Byte Offsets & Build XRef Table]
        GenXref --> EmitPDF[6. Assemble %PDF-1.4 Binary Buffer with Trailer & EOF]
    end
    
    EmitPDF --> TriggerDownload[Browser Dispatches Blob Download: ReportID.pdf]
```

---

### 3.3.7 Production Deployment Topology

```mermaid
flowchart LR
    subgraph Internet ["Public Internet"]
        ClientBrowser[Auditor Browser / Mobile Client]
    end

    subgraph VercelEdge ["Vercel Production Platform (auditplatform-nu.vercel.app)"]
        CDN[Vercel Global Edge CDN]
        NextServer[Next.js 16 Serverless Functions]
        EdgeProxy["src/proxy.ts (Edge Runtime)"]
    end

    subgraph CloudServices ["Managed Cloud Infrastructure"]
        NeonDB[("Neon PostgreSQL Cluster (AWS us-east-2)")]
        SupaCloud[("Supabase Auth Service (HTTPS / REST)")]
        AWSS3[("AWS S3 Evidence Bucket (us-east-1)")]
    end

    ClientBrowser <-->|HTTPS / TLS 1.3| CDN
    CDN <--> EdgeProxy
    EdgeProxy <--> NextServer
    NextServer <-->|Pooled TCP (SSL Require)| NeonDB
    NextServer <-->|HTTPS API / JWT Auth| SupaCloud
    NextServer <-->|HTTPS AWS SDK v3| AWSS3
```
