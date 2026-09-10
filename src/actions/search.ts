"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";

export interface SearchResultItem {
  id: string;
  type: "Audit" | "Audit Plan" | "Finding" | "Risk" | "Evidence" | "Framework" | "Control" | "Report";
  title: string;
  subtitle: string;
  url: string;
}

export async function globalSearch(workspaceId: string, queryText: string): Promise<{ success: boolean; data: SearchResultItem[]; error?: string }> {
  if (!workspaceId) {
    return { success: false, data: [], error: "Workspace ID is required" };
  }

  const trimmed = queryText?.trim();
  if (!trimmed || trimmed.length < 2) {
    return { success: true, data: [] };
  }

  try {
    await requirePermission("audits.view", workspaceId);
    const searchParam = `%${trimmed}%`;
    const results: SearchResultItem[] = [];

    // 1. Audits
    const audits = await db.query<{ id: string; name: string; framework: string; status: string }>(
      `SELECT id, name, framework, status FROM audits WHERE workspace_id = $1 AND (name ILIKE $2 OR framework ILIKE $2 OR status ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const a of audits) {
      results.push({
        id: a.id,
        type: "Audit",
        title: a.name,
        subtitle: `${a.framework} • Status: ${a.status}`,
        url: `/audits/${a.id}`,
      });
    }

    // 2. Audit Plans
    const plans = await db.query<{ id: string; name: string; framework: string; status: string }>(
      `SELECT id, name, framework, status FROM audit_plans WHERE workspace_id = $1 AND (name ILIKE $2 OR framework ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const p of plans) {
      results.push({
        id: p.id,
        type: "Audit Plan",
        title: p.name,
        subtitle: `${p.framework} • ${p.status}`,
        url: `/audit-plans`,
      });
    }

    // 3. Findings
    const findings = await db.query<{ id: string; title: string; reference: string; severity: string; audit_id: string }>(
      `SELECT id, title, reference, severity, audit_id FROM findings WHERE workspace_id = $1 AND (title ILIKE $2 OR reference ILIKE $2 OR description ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const f of findings) {
      results.push({
        id: f.id,
        type: "Finding",
        title: `${f.reference}: ${f.title}`,
        subtitle: `Severity: ${f.severity}`,
        url: `/findings`,
      });
    }

    // 4. Risks
    const risks = await db.query<{ id: string; title: string; level: string; score: number }>(
      `SELECT id, title, level, score FROM risks WHERE workspace_id = $1 AND (title ILIKE $2 OR description ILIKE $2 OR category ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const r of risks) {
      results.push({
        id: r.id,
        type: "Risk",
        title: r.title,
        subtitle: `Level: ${r.level} (Score: ${r.score})`,
        url: `/risk-management`,
      });
    }

    // 5. Evidence
    const evidence = await db.query<{ id: string; name: string; reference: string; status: string }>(
      `SELECT id, name, reference, status FROM evidence WHERE workspace_id = $1 AND (name ILIKE $2 OR reference ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const e of evidence) {
      results.push({
        id: e.id,
        type: "Evidence",
        title: `${e.reference}: ${e.name}`,
        subtitle: `Status: ${e.status}`,
        url: `/evidence`,
      });
    }

    // 6. Frameworks
    const frameworks = await db.query<{ id: string; name: string; short_name: string; version: string }>(
      `SELECT id, name, short_name, version FROM frameworks WHERE (workspace_id IS NULL OR workspace_id = $1) AND (name ILIKE $2 OR short_name ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const fw of frameworks) {
      results.push({
        id: fw.id,
        type: "Framework",
        title: fw.name,
        subtitle: `${fw.short_name} • Version ${fw.version}`,
        url: `/frameworks`,
      });
    }

    // 7. Controls
    const controls = await db.query<{ id: string; title: string; framework_short: string; domain: string }>(
      `SELECT id, title, framework_short, domain FROM controls WHERE (workspace_id IS NULL OR workspace_id = $1) AND (id ILIKE $2 OR title ILIKE $2 OR description ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const c of controls) {
      results.push({
        id: c.id,
        type: "Control",
        title: `${c.id} - ${c.title}`,
        subtitle: `${c.framework_short} • ${c.domain}`,
        url: `/control-library`,
      });
    }

    // 8. Reports
    const reports = await db.query<{ id: string; name: string; type: string; status: string }>(
      `SELECT id, name, type, status FROM reports WHERE workspace_id = $1 AND (name ILIKE $2 OR type ILIKE $2) LIMIT 5`,
      [workspaceId, searchParam]
    );
    for (const rep of reports) {
      results.push({
        id: rep.id,
        type: "Report",
        title: rep.name,
        subtitle: `${rep.type} • Status: ${rep.status}`,
        url: `/reports`,
      });
    }

    return { success: true, data: results };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return { success: false, data: [], error: message };
  }
}
