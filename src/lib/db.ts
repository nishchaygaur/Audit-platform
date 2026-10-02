import { Pool, PoolClient, QueryResultRow } from 'pg';
import { FRAMEWORK_PRESETS } from './framework-presets';

// Lazy pool initialization to support serverless lifecycle and avoid module-eval crashes if DATABASE_URL is not yet bound
let globalPool: Pool | null = null;

export function getPool(): Pool {
  if (!globalPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required to connect to PostgreSQL. Please define DATABASE_URL in your .env.local file or environment.");
    }

    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const isSsl = !isLocalhost && (
      connectionString.includes('sslmode=require') || 
      connectionString.includes('neon.tech') || 
      connectionString.includes('supabase') || 
      process.env.NODE_ENV === 'production'
    );

    globalPool = new Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return globalPool;
}

export interface TransactionClient {
  query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<T[]>;
  queryOne: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<T | undefined>;
  execute: (text: string, params?: unknown[]) => Promise<{ rowCount: number }>;
}

let schemaInitialized: Promise<void> | null = null;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query<T>(text, params);
  return res.rows[0] ?? undefined;
}

export async function execute(
  text: string,
  params: unknown[] = []
): Promise<{ rowCount: number }> {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query(text, params);
  return { rowCount: res.rowCount ?? 0 };
}

export async function transaction<T>(
  callback: (client: TransactionClient) => Promise<T>
): Promise<T> {
  await ensureSchema();
  const pool = getPool();
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    const txClient: TransactionClient = {
      query: async <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<R[]> => {
        const res = await client.query<R>(text, params);
        return res.rows;
      },
      queryOne: async <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<R | undefined> => {
        const res = await client.query<R>(text, params);
        return res.rows[0] ?? undefined;
      },
      execute: async (text: string, params?: unknown[]): Promise<{ rowCount: number }> => {
        const res = await client.query(text, params);
        return { rowCount: res.rowCount ?? 0 };
      },
    };

    const result = await callback(txClient);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export const POSTGRES_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'Viewer',
    supabase_user_id UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);

  CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_workspaces (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, workspace_id)
  );

  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    framework TEXT NOT NULL,
    lead TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    objective TEXT NOT NULL,
    scope TEXT NOT NULL,
    controls INTEGER NOT NULL DEFAULT 0,
    evidence INTEGER NOT NULL DEFAULT 0,
    findings INTEGER NOT NULL DEFAULT 0,
    risks INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    framework TEXT NOT NULL,
    control TEXT NOT NULL,
    severity TEXT NOT NULL,
    owner TEXT NOT NULL,
    identified_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL,
    recommendation TEXT DEFAULT '',
    evidence TEXT DEFAULT '',
    auditor TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    finding TEXT NOT NULL,
    framework TEXT NOT NULL,
    control TEXT NOT NULL,
    likelihood TEXT NOT NULL,
    impact TEXT NOT NULL,
    score INTEGER NOT NULL,
    level TEXT NOT NULL,
    treatment TEXT NOT NULL,
    owner TEXT NOT NULL,
    due_date TEXT NOT NULL,
    residual_score INTEGER NOT NULL,
    residual_level TEXT NOT NULL,
    status TEXT NOT NULL,
    asset TEXT DEFAULT '',
    identified_date TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    control TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT DEFAULT '',
    size TEXT DEFAULT '',
    framework TEXT DEFAULT '',
    reviewed_by TEXT DEFAULT '',
    storage_key TEXT DEFAULT '',
    mime_type TEXT DEFAULT 'application/octet-stream',
    ai_status TEXT DEFAULT '',
    ai_confidence INTEGER DEFAULT 0,
    ai_analysis TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS evidence_requests (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL DEFAULT '',
    control_title TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Requested',
    assigned_to TEXT NOT NULL,
    due_date TEXT NOT NULL,
    evidence_id TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS evidence_comments (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    request_id TEXT,
    evidence_id TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL DEFAULT 'Auditor',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_trail (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    description TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_audits_workspace ON audits(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_findings_workspace ON findings(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_findings_audit ON findings(audit_id);
  CREATE INDEX IF NOT EXISTS idx_risks_workspace ON risks(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_risks_audit ON risks(audit_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_workspace ON evidence(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_audit ON evidence(audit_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_requests_workspace ON evidence_requests(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_requests_audit ON evidence_requests(audit_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_requests_status ON evidence_requests(status);
  CREATE INDEX IF NOT EXISTS idx_evidence_comments_request ON evidence_comments(request_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_comments_evidence ON evidence_comments(evidence_id);
  CREATE INDEX IF NOT EXISTS idx_audit_trail_workspace ON audit_trail(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);

  CREATE TABLE IF NOT EXISTS audit_plans (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audit_id TEXT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    framework TEXT NOT NULL,
    owner TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    audits_count INTEGER NOT NULL DEFAULT 1,
    completed_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS frameworks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS controls (
    id TEXT PRIMARY KEY,
    framework_id TEXT NOT NULL,
    framework_name TEXT NOT NULL,
    framework_short TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Mapped',
    mapped_frameworks TEXT DEFAULT '[]',
    workspace_id TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS control_assessments (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL,
    control_title TEXT NOT NULL,
    control_domain TEXT NOT NULL,
    requirement TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Not Started',
    assessor TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    evidence_count INTEGER DEFAULT 0,
    findings_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    audit_id TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    framework TEXT NOT NULL,
    generated_by TEXT NOT NULL,
    generated_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    summary_stats TEXT DEFAULT '{}',
    content TEXT DEFAULT '',
    size TEXT DEFAULT '1.5 MB',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_audit_plans_workspace ON audit_plans(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_frameworks_workspace ON frameworks(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_controls_framework ON controls(framework_id);
  CREATE INDEX IF NOT EXISTS idx_controls_workspace ON controls(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_control_assessments_workspace ON control_assessments(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_control_assessments_audit ON control_assessments(audit_id);
  CREATE INDEX IF NOT EXISTS idx_reports_workspace ON reports(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_reports_audit ON reports(audit_id);
`;

async function seedBaselineData(pool: Pool): Promise<void> {
  try {
    for (const fw of FRAMEWORK_PRESETS) {
      await pool.query(
        `
        INSERT INTO frameworks (id, name, short_name, description, category, version, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'Active')
        ON CONFLICT (id) DO NOTHING;
        `,
        [fw.id, fw.name, fw.shortName, fw.description, fw.category, fw.version]
      );

      for (const ctrl of fw.controls) {
        await pool.query(
          `
          INSERT INTO controls (id, framework_id, framework_name, framework_short, title, description, domain, status, mapped_frameworks)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Mapped', $8)
          ON CONFLICT (id) DO NOTHING;
          `,
          [
            ctrl.id,
            fw.id,
            fw.name,
            fw.shortName,
            ctrl.title,
            ctrl.description,
            ctrl.domain,
            JSON.stringify(ctrl.mappedFrameworks || []),
          ]
        );
      }
    }
  } catch (err) {
    console.error("Baseline seeding skipped or failed:", err);
  }
}

async function seedBaselineRequests(pool: Pool): Promise<void> {
  try {
    const reqCount = await pool.query<{ count: string | number }>('SELECT COUNT(*) as count FROM evidence_requests');
    if (Number(reqCount.rows[0]?.count || 0) === 0) {
      const auditRes = await pool.query<{ id: string; workspace_id: string }>('SELECT id, workspace_id FROM audits LIMIT 1');
      if (auditRes.rows.length > 0) {
        const audit = auditRes.rows[0];
        const req1Id = 'REQ-2024-001';
        const req2Id = 'REQ-2024-002';
        const req3Id = 'REQ-2024-003';
        const req4Id = 'REQ-2024-004';

        await pool.query(`
          INSERT INTO evidence_requests (id, workspace_id, audit_id, control_id, control_title, title, description, priority, status, assigned_to, due_date, created_by)
          VALUES
            ($1, $2, $3, 'A.8.2', 'Privileged Access Rights', 'Quarterly IAM Privileged Account Listing & MFA Policy Export', 'Export all active administrator and root accounts from Okta/Entra ID with MFA status verification.', 'High', 'Under Review', 'Michael Lee', '2026-10-15', 'John Carter (Lead Auditor)'),
            ($4, $2, $3, 'A.5.1', 'Policies for information security', 'Annual Master Information Security Policy Sign-off', 'Provide current Information Security Policy approved and countersigned by CISO and executive committee.', 'Critical', 'Approved', 'Alice Smith', '2026-10-10', 'John Carter (Lead Auditor)'),
            ($5, $2, $3, 'A.5.23', 'Cloud Services Security', 'Multi-Cloud Vendor SOC 2 Type II Reports & Risk Assessments', 'Gather latest third-party assurance attestations for AWS, Cloudflare, and primary SaaS infrastructure vendors.', 'Medium', 'Requested', 'David Wilson', '2026-10-25', 'John Carter (Lead Auditor)'),
            ($6, $2, $3, 'A.8.15', 'Logging & SIEM', 'SIEM 365-Day Log Retention Configuration & Hot/Cold Tier Proof', 'Provide architectural configuration screenshot or Terraform definition demonstrating immutable 365-day security log archiving.', 'High', 'Requested', 'Michael Lee', '2026-10-30', 'John Carter (Lead Auditor)')
          ON CONFLICT (id) DO NOTHING;
        `, [req1Id, audit.workspace_id, audit.id, req2Id, req3Id, req4Id]);

        await pool.query(`
          INSERT INTO evidence_comments (id, workspace_id, request_id, user_id, user_name, user_role, message, created_at)
          VALUES
            ('COM-001', $1, $2, 'usr_auditor', 'John Carter', 'Auditor', 'Please ensure the export includes temporary elevated service accounts alongside personal admin accounts.', NOW() - INTERVAL '2 days'),
            ('COM-002', $1, $2, 'usr_auditee', 'Michael Lee', 'Auditee', 'Uploaded the Entra ID privileged report. Root accounts are enrolled in FIDO2 hardware keys as shown on page 3.', NOW() - INTERVAL '1 day'),
            ('COM-003', $1, $2, 'usr_auditor', 'John Carter', 'Auditor', 'Reviewing the submission now. Hardware token enrollment verified; checking break-glass account monitoring.', NOW() - INTERVAL '4 hours')
          ON CONFLICT (id) DO NOTHING;
        `, [audit.workspace_id, req1Id]);
      }
    }
  } catch (err) {
    console.error("Baseline evidence requests seeding skipped or failed:", err);
  }
}

export async function ensureSchema(): Promise<void> {
  if (!schemaInitialized) {
    schemaInitialized = (async () => {
      const pool = getPool();
      await pool.query(POSTGRES_SCHEMA_SQL);
      // Idempotent column migrations for evidence storage and AI review
      await pool.query(`
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS storage_key TEXT DEFAULT '';
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/octet-stream';
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT '';
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS ai_confidence INTEGER DEFAULT 0;
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS ai_analysis TEXT DEFAULT '';
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      `).catch(() => {});
      // Idempotent column migrations for users authentication mapping
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id UUID UNIQUE;
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        ALTER TABLE users ALTER COLUMN password SET DEFAULT '';
        CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
        INSERT INTO users (id, name, email, password, role)
        VALUES ('system', 'System User', 'system@auditplatform.local', '', 'Admin')
        ON CONFLICT (id) DO NOTHING;
        UPDATE users SET role = 'Admin' WHERE role = 'Viewer' OR role = '' OR role IS NULL;
        UPDATE user_workspaces SET role = 'Admin' WHERE role = 'Viewer' OR role = '' OR role IS NULL;
      `).catch(() => {});
      await seedBaselineData(pool);
      await seedBaselineRequests(pool);
    })().catch((err) => {
      schemaInitialized = null;
      console.error("Schema initialization failed:", err);
      throw err;
    });
  }
  return schemaInitialized;
}

const db = {
  getPool,
  query,
  queryOne,
  execute,
  transaction,
  ensureSchema,
};

export default db;
