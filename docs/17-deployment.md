# Section 17: Production Deployment & Cloud Operations

## 1. Cloud Architecture Overview

The Audit Platform is deployed in a modern, serverless cloud architecture leveraging **Vercel** for frontend and edge proxy hosting, **Neon Serverless PostgreSQL** for transactional persistence, **Supabase Auth** for identity management, and **AWS S3** (or Cloudflare R2 / MinIO) for binary evidentiary object storage.

```mermaid
graph TD
    subgraph Users ["Internet Traffic"]
        Browser["Auditor / Admin Browser"]
    end

    subgraph VercelEdge ["Vercel Global Edge Network"]
        CDN["Vercel Edge Network (DNS & SSL)"]
        EdgeMiddleware["src/proxy.ts (Auth Edge Interceptor)"]
        ServerlessFunc["Next.js Server Actions / API Routes"]
    end

    subgraph AuthCloud ["Supabase Managed Cloud"]
        SupaAuth["Supabase Auth Engine (PKCE & Email OTP)"]
    end

    subgraph DBCloud ["Neon Serverless Cloud"]
        NeonPool["Neon PostgreSQL 16 (Auto-Scaling Compute & Storage)"]
    end

    subgraph S3Cloud ["Amazon Web Services (AWS)"]
        S3Bucket[("AWS S3 Encrypted Bucket (AES-256)")]
    end

    Browser -->|HTTPS / Port 443| CDN
    CDN --> EdgeMiddleware
    EdgeMiddleware --> ServerlessFunc
    ServerlessFunc -->|Identity Verification| SupaAuth
    ServerlessFunc -->|pg.Pool TLS Connection| NeonPool
    ServerlessFunc -->|Pre-Signed Uploads / Downloads| S3Bucket
```

---

## 2. Live Production Deployment Information

- **Production URL**: [https://auditplatform-nu.vercel.app/](https://auditplatform-nu.vercel.app/)
- **Hosting Platform**: Vercel Serverless (Region: `iad1` - US East Washington D.C.)
- **Framework & Engine**: Next.js 16.3.4 with Turbopack bundler
- **Runtime Environment**: Node.js 20.x LTS

---

## 3. Environment Variables Configuration Guide

To deploy the Audit Platform, create and populate the following sanitized environment variables in your Vercel Project Settings or local `.env.local` file:

```bash
# ============================================================
# 1. TRANSACTIONAL DATABASE: NEON POSTGRESQL (MANDATORY)
# ============================================================
# Connects to Neon PostgreSQL serverless compute endpoint with required SSL
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require

# ============================================================
# 2. IDENTITY & AUTHENTICATION: SUPABASE SSR (MANDATORY)
# ============================================================
# Supabase project URL and public publishable anonymous key
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production site base URL for email verification callbacks
NEXT_PUBLIC_SITE_URL=https://auditplatform-nu.vercel.app

# ============================================================
# 3. BINARY OBJECT STORAGE: AWS S3 / CLOUDFLARE R2 (OPTIONAL)
# ============================================================
# When omitted, the platform seamlessly defaults to local persistent disk storage (.storage/evidence)
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=production-audit-evidence-vault
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# ============================================================
# 4. CRYPTOGRAPHIC SIGNING (RECOMMENDED)
# ============================================================
# Secret used for HMAC-SHA256 evidence download signatures (min 32 characters)
JWT_SECRET=your-production-hmac-secret-key-32-chars-minimum
```

---

## 4. Continuous Integration & Deployment (CI/CD) Pipeline

The platform is integrated with GitHub and Vercel for automated continuous delivery:

1. **GitHub Push (`main` branch)**:
   - A commit pushed to `origin/main` automatically initiates a Vercel production deployment trigger.
2. **Build Execution Command**:
   ```bash
   next build
   ```
3. **Database Schema Auto-Migration**:
   - The application does not require manual external migration scripts (`prisma migrate` or `db-migrate`).
   - On the first incoming server request, `src/lib/db.ts:ensureSchema()` checks if relational tables exist and idempotently executes `POSTGRES_SCHEMA_SQL`, auto-provisioning tables, composite indexes, and baseline framework controls.
4. **Zero-Downtime Rollout**:
   - Vercel provisions immutable deployment preview URLs and performs atomic DNS cutovers once the health check passes.

---

## 5. Cold Starts, Connection Pooling & Scaling Strategies

Serverless functions scale dynamically with traffic, which can introduce connection pool saturation if not properly managed:

- **Connection Throttling**: In `src/lib/db.ts`, `pg.Pool` caps active connections at `max: 10` per serverless instance with `idleTimeoutMillis: 30000` to prevent exhausting PostgreSQL connection limits.
- **Neon Connection Pooling**: For extreme traffic spikes, `DATABASE_URL` should point to Neon's **PgBouncer pooled connection string** (`-pooler` endpoint on port `5432`), allowing thousands of concurrent serverless functions to multiplex over a handful of physical PostgreSQL connections.
- **Server External Packages**: `next.config.ts` declares `serverExternalPackages: ["bcryptjs", "pg", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"]`, keeping heavy server libraries out of client bundles and accelerating cold-start times.
