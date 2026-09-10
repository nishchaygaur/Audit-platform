import { Pool, PoolClient, QueryResultRow } from 'pg';

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
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Viewer',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
    const fwCountRow = await pool.query<{ count: string | number }>('SELECT COUNT(*) as count FROM frameworks');
    if (Number(fwCountRow.rows[0]?.count || 0) === 0) {
      await pool.query(`
        INSERT INTO frameworks (id, name, short_name, description, category, version, status)
        VALUES
          ('iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Information security management system requirements and control framework.', 'Information Security', '2022', 'Active'),
          ('nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Framework for managing and reducing cybersecurity risk across an organization.', 'Cybersecurity', '2.0', 'Active'),
          ('nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Structured process for managing security and privacy risk throughout system lifecycles.', 'Risk Management', 'Rev. 5', 'Active'),
          ('soc-2', 'SOC 2 Trust Services Criteria', 'SOC 2', 'Assurance standard covering security, availability, integrity, confidentiality and privacy.', 'Assurance', '2023', 'Active')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO controls (id, framework_id, framework_name, framework_short, title, description, domain, status, mapped_frameworks)
        VALUES
          ('ISO-A.5.1', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Policies for information security', 'Information security policies and supporting topic-specific policies shall be defined, approved, published and reviewed.', 'Organizational Controls', 'Mapped', '["NIST CSF", "SOC 2"]'),
          ('ISO-A.5.2', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Information security roles and responsibilities', 'Information security roles and responsibilities shall be defined and allocated according to organizational requirements.', 'Organizational Controls', 'Mapped', '["NIST CSF"]'),
          ('ISO-A.5.7', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Threat intelligence', 'Information relating to information security threats shall be collected and analyzed to produce threat intelligence.', 'Organizational Controls', 'Mapped', '["NIST CSF"]'),
          ('ISO-A.5.15', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Access control', 'Rules to control physical and logical access to information and other associated assets shall be established and documented.', 'Organizational Controls', 'Mapped', '["NIST CSF", "SOC 2"]'),
          ('ISO-A.5.23', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Information security for use of cloud services', 'Processes for acquisition, use, management and exit from cloud services shall be established in accordance with information security requirements.', 'Organizational Controls', 'Mapped', '["SOC 2"]'),
          ('ISO-A.6.1', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Screening', 'Background verification checks on all candidates to become personnel shall be carried out in accordance with relevant laws and regulations.', 'People Controls', 'Mapped', '["NIST CSF"]'),
          ('ISO-A.6.3', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Information security awareness and training', 'Personnel of the organization and relevant contractors shall receive appropriate awareness training.', 'People Controls', 'Mapped', '["NIST CSF"]'),
          ('ISO-A.7.4', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Physical security monitoring', 'Premises shall be continuously monitored for unauthorized physical access.', 'Physical Controls', 'Mapped', '["NIST CSF"]'),
          ('ISO-A.8.2', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Privileged access rights', 'The allocation and use of privileged access rights shall be restricted and managed.', 'Technological Controls', 'Mapped', '["NIST CSF", "SOC 2"]'),
          ('ISO-A.8.5', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Secure authentication', 'Secure authentication technologies and procedures shall be implemented based on information access restrictions and system access policy.', 'Technological Controls', 'Mapped', '["NIST CSF"]'),
          ('ISO-A.8.9', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Configuration management', 'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.', 'Technological Controls', 'Unmapped', '[]'),
          ('ISO-A.8.15', 'iso-27001', 'ISO/IEC 27001:2022', 'ISO 27001', 'Logging', 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analyzed.', 'Technological Controls', 'Mapped', '["NIST CSF"]'),
          ('NIST-GV.OC-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Organizational context', 'The organizational mission, objectives, stakeholders, and legal requirements are understood and inform cybersecurity risk management.', 'Govern', 'Mapped', '["ISO 27001"]'),
          ('NIST-GV.RM-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Risk management strategy', 'Cybersecurity risk management objectives and strategies are established and communicated across the enterprise.', 'Govern', 'Mapped', '["ISO 27001"]'),
          ('NIST-ID.AM-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Asset inventory', 'Inventories of hardware, software, services, and external information systems are maintained.', 'Identify', 'Mapped', '["ISO 27001"]'),
          ('NIST-ID.RA-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Vulnerability identification', 'Vulnerabilities in assets are identified, validated, and recorded.', 'Identify', 'Mapped', '["ISO 27001"]'),
          ('NIST-PR.AA-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Identities and credentials', 'Identities and credentials for authorized users, services, and hardware are managed.', 'Protect', 'Mapped', '["ISO 27001"]'),
          ('NIST-PR.DS-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Data protection at rest', 'Data at rest is protected according to the organization’s risk strategy.', 'Protect', 'Mapped', '["ISO 27001"]'),
          ('NIST-DE.CM-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Continuous monitoring', 'Networks and operational environments are monitored to detect potential cybersecurity events.', 'Detect', 'Mapped', '["ISO 27001"]'),
          ('NIST-RS.MA-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Incident management', 'Incident response plans are executed in response to declared cybersecurity incidents.', 'Respond', 'Mapped', '["ISO 27001"]'),
          ('NIST-RC.RP-01', 'nist-csf', 'NIST Cybersecurity Framework 2.0', 'NIST CSF', 'Recovery plan execution', 'Recovery processes and procedures are executed and maintained to restore impaired systems and services.', 'Recover', 'Mapped', '["ISO 27001"]'),
          ('RMF-1', 'nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Prepare', 'Organizational and system-level activities prepare the entity to manage security and privacy risks using the RMF.', 'Prepare', 'Mapped', '["ISO 27001"]'),
          ('RMF-2', 'nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Categorize', 'Categorize the system and the information processed, stored, and transmitted based on an impact analysis.', 'Categorize', 'Mapped', '["ISO 27001"]'),
          ('RMF-3', 'nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Select', 'Select an initial set of baseline security and privacy controls for the system and tailor them as appropriate.', 'Select', 'Mapped', '["ISO 27001"]'),
          ('RMF-4', 'nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Implement', 'Implement the security and privacy controls and document how the controls are deployed within the system.', 'Implement', 'Unmapped', '[]'),
          ('RMF-5', 'nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Assess', 'Assess the controls to determine if they are implemented correctly, operating as intended, and producing desired outcomes.', 'Assess', 'Mapped', '["ISO 27001"]'),
          ('RMF-6', 'nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Authorize', 'Authorize system operation based on a determination of the risk to organizational operations and assets.', 'Authorize', 'Mapped', '["ISO 27001"]'),
          ('RMF-7', 'nist-rmf', 'NIST Risk Management Framework', 'NIST RMF', 'Monitor', 'Continuously monitor control implementation and system security/privacy posture.', 'Monitor', 'Mapped', '["ISO 27001"]')
        ON CONFLICT (id) DO NOTHING;
      `);
    }
  } catch (err) {
    console.error("Baseline seeding skipped or failed:", err);
  }
}

export async function ensureSchema(): Promise<void> {
  if (!schemaInitialized) {
    schemaInitialized = (async () => {
      const pool = getPool();
      await pool.query(POSTGRES_SCHEMA_SQL);
      // Idempotent column migrations for evidence storage
      await pool.query(`
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS storage_key TEXT DEFAULT '';
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/octet-stream';
        ALTER TABLE evidence ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      `).catch(() => {});
      await seedBaselineData(pool);
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
