import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'audit.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_workspaces (
    user_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, workspace_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    audit_id TEXT NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    audit_id TEXT NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    audit_id TEXT NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_audits_workspace ON audits(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_findings_workspace ON findings(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_findings_audit ON findings(audit_id);
  CREATE INDEX IF NOT EXISTS idx_risks_workspace ON risks(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_risks_audit ON risks(audit_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_workspace ON evidence(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_evidence_audit ON evidence(audit_id);
`);

// Safe migrations for evidence columns
const evidenceColumns = (db.pragma("table_info(evidence)") as { name: string }[]).map((c) => c.name);
if (!evidenceColumns.includes("description")) {
  db.exec("ALTER TABLE evidence ADD COLUMN description TEXT DEFAULT ''");
}
if (!evidenceColumns.includes("size")) {
  db.exec("ALTER TABLE evidence ADD COLUMN size TEXT DEFAULT ''");
}
if (!evidenceColumns.includes("framework")) {
  db.exec("ALTER TABLE evidence ADD COLUMN framework TEXT DEFAULT ''");
}
if (!evidenceColumns.includes("reviewed_by")) {
  db.exec("ALTER TABLE evidence ADD COLUMN reviewed_by TEXT DEFAULT ''");
}

export default db;
