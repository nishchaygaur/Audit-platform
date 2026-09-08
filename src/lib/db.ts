import { Pool, PoolClient, QueryResultRow } from 'pg';

// Lazy pool initialization to support serverless lifecycle and avoid module-eval crashes if DATABASE_URL is not yet bound
let globalPool: Pool | null = null;

export function getPool(): Pool {
  if (!globalPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required to connect to PostgreSQL");
    }

    const isSsl = connectionString.includes('sslmode=require') || 
                  connectionString.includes('neon.tech') || 
                  connectionString.includes('supabase') || 
                  process.env.NODE_ENV === 'production';

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

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const pool = getPool();
  const res = await pool.query<T>(text, params);
  return res.rows[0] ?? undefined;
}

export async function execute(
  text: string,
  params: unknown[] = []
): Promise<{ rowCount: number }> {
  const pool = getPool();
  const res = await pool.query(text, params);
  return { rowCount: res.rowCount ?? 0 };
}

export async function transaction<T>(
  callback: (client: TransactionClient) => Promise<T>
): Promise<T> {
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
  CREATE INDEX IF NOT EXISTS idx_audit_trail_workspace ON audit_trail(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
`;

export async function ensureSchema(): Promise<void> {
  const pool = getPool();
  await pool.query(POSTGRES_SCHEMA_SQL);
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
