"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";
import { logAuditEvent } from "./audit-trail";

export type FrameworkStatus = "Active" | "Available";

export interface FrameworkRecord {
  id: string;
  workspace_id?: string | null;
  name: string;
  short_name: string;
  description: string;
  category: string;
  version: string;
  status: FrameworkStatus;
  controls_count?: number;
  mapped_count?: number;
  audits_count?: number;
  created_at: string;
}

export interface ControlRecord {
  id: string;
  framework_id: string;
  framework_name: string;
  framework_short: string;
  title: string;
  description: string;
  domain: string;
  status: "Mapped" | "Unmapped";
  mapped_frameworks: string[];
  workspace_id?: string | null;
  created_at: string;
}

export interface CreateFrameworkInput {
  name: string;
  shortName: string;
  description: string;
  category?: string;
  version?: string;
  status?: FrameworkStatus;
}

export interface CreateControlInput {
  id: string;
  frameworkId: string;
  frameworkName?: string;
  frameworkShort?: string;
  title: string;
  description?: string;
  domain?: string;
  status?: "Mapped" | "Unmapped";
  mappedFrameworks?: string[];
}

export async function getFrameworks(workspaceId: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audits.view", workspaceId);

    const rows = await db.query<{
      id: string;
      workspace_id: string | null;
      name: string;
      short_name: string;
      description: string;
      category: string;
      version: string;
      status: FrameworkStatus;
      created_at: string;
      controls_count: string | number;
      mapped_count: string | number;
      audits_count: string | number;
    }>(
      `
      SELECT f.*,
        COALESCE((SELECT COUNT(*) FROM controls c WHERE c.framework_id = f.id AND (c.workspace_id IS NULL OR c.workspace_id = $1)), 0) as controls_count,
        COALESCE((SELECT COUNT(*) FROM controls c WHERE c.framework_id = f.id AND c.status = 'Mapped' AND (c.workspace_id IS NULL OR c.workspace_id = $1)), 0) as mapped_count,
        COALESCE((SELECT COUNT(*) FROM audits a WHERE (a.framework ILIKE '%' || f.short_name || '%' OR a.framework ILIKE '%' || f.name || '%') AND a.workspace_id = $1), 0) as audits_count
      FROM frameworks f
      WHERE f.workspace_id IS NULL OR f.workspace_id = $1
      ORDER BY f.name ASC
      `,
      [workspaceId]
    );

    const frameworks: FrameworkRecord[] = rows.map((r) => ({
      id: r.id,
      workspace_id: r.workspace_id,
      name: r.name,
      short_name: r.short_name,
      description: r.description,
      category: r.category,
      version: r.version,
      status: r.status,
      controls_count: Number(r.controls_count),
      mapped_count: Number(r.mapped_count),
      audits_count: Number(r.audits_count),
      created_at: r.created_at,
    }));

    return { success: true, data: frameworks };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch frameworks";
    return { success: false, error: message };
  }
}

export async function createFramework(workspaceId: string, input: CreateFrameworkInput) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("workspace.manage", workspaceId);

    if (!input.name || !input.shortName) {
      return { success: false, error: "Framework name and short name are required" };
    }

    const id = input.shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
    const name = input.name.trim();
    const shortName = input.shortName.trim();
    const description = input.description.trim() || "Custom compliance framework";
    const category = input.category?.trim() || "Cybersecurity";
    const version = input.version?.trim() || "1.0";
    const status: FrameworkStatus = input.status || "Active";

    await db.execute(
      `
      INSERT INTO frameworks (id, workspace_id, name, short_name, description, category, version, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [id, workspaceId, name, shortName, description, category, version, status]
    );

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Audit",
      entityId: id,
      description: `Created framework "${name}" (${shortName})`,
      details: { version, category, status },
    });

    return {
      success: true,
      data: {
        id,
        workspace_id: workspaceId,
        name,
        short_name: shortName,
        description,
        category,
        version,
        status,
        controls_count: 0,
        mapped_count: 0,
        audits_count: 0,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create framework";
    return { success: false, error: message };
  }
}

export async function updateFramework(
  workspaceId: string,
  frameworkId: string,
  updates: Partial<CreateFrameworkInput>
) {
  if (!workspaceId || !frameworkId) {
    return { success: false, error: "Workspace ID and Framework ID are required" };
  }

  try {
    await requirePermission("workspace.manage", workspaceId);

    const existing = await db.queryOne<FrameworkRecord>(
      `SELECT * FROM frameworks WHERE id = $1 AND (workspace_id = $2 OR workspace_id IS NULL)`,
      [frameworkId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Framework not found" };
    }

    const setParts: string[] = [];
    const values: (string | null)[] = [];

    if (updates.name !== undefined) {
      values.push(updates.name.trim());
      setParts.push(`name = $${values.length}`);
    }
    if (updates.shortName !== undefined) {
      values.push(updates.shortName.trim());
      setParts.push(`short_name = $${values.length}`);
    }
    if (updates.description !== undefined) {
      values.push(updates.description.trim());
      setParts.push(`description = $${values.length}`);
    }
    if (updates.category !== undefined) {
      values.push(updates.category.trim());
      setParts.push(`category = $${values.length}`);
    }
    if (updates.version !== undefined) {
      values.push(updates.version.trim());
      setParts.push(`version = $${values.length}`);
    }
    if (updates.status !== undefined) {
      values.push(updates.status);
      setParts.push(`status = $${values.length}`);
    }

    if (setParts.length > 0) {
      values.push(frameworkId);
      await db.execute(
        `UPDATE frameworks SET ${setParts.join(", ")} WHERE id = $${values.length}`,
        values
      );
    }

    await logAuditEvent({
      workspaceId,
      action: updates.status && updates.status !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "Audit",
      entityId: frameworkId,
      description: `Updated framework "${existing.name}"`,
      details: updates,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update framework";
    return { success: false, error: message };
  }
}

export async function deleteFramework(workspaceId: string, frameworkId: string) {
  if (!workspaceId || !frameworkId) {
    return { success: false, error: "Workspace ID and Framework ID are required" };
  }

  try {
    await requirePermission("workspace.manage", workspaceId);

    const existing = await db.queryOne<FrameworkRecord>(
      `SELECT * FROM frameworks WHERE id = $1 AND workspace_id = $2`,
      [frameworkId, workspaceId]
    );

    if (!existing) {
      return { success: false, error: "Custom framework not found or cannot delete global default" };
    }

    await db.execute(`DELETE FROM controls WHERE framework_id = $1 AND workspace_id = $2`, [frameworkId, workspaceId]);
    await db.execute(`DELETE FROM frameworks WHERE id = $1 AND workspace_id = $2`, [frameworkId, workspaceId]);

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Audit",
      entityId: frameworkId,
      description: `Deleted custom framework "${existing.name}"`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete framework";
    return { success: false, error: message };
  }
}

export async function getControls(workspaceId: string, frameworkId?: string) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("audits.view", workspaceId);

    let query = `
      SELECT * FROM controls
      WHERE (workspace_id IS NULL OR workspace_id = $1)
    `;
    const params: unknown[] = [workspaceId];

    if (frameworkId) {
      params.push(frameworkId);
      query += ` AND framework_id = $${params.length}`;
    }

    query += ` ORDER BY id ASC`;

    const rows = await db.query<{
      id: string;
      framework_id: string;
      framework_name: string;
      framework_short: string;
      title: string;
      description: string;
      domain: string;
      status: "Mapped" | "Unmapped";
      mapped_frameworks: string;
      workspace_id: string | null;
      created_at: string;
    }>(query, params);

    const controls: ControlRecord[] = rows.map((r) => {
      let mapped: string[] = [];
      try {
        mapped = JSON.parse(r.mapped_frameworks || "[]");
      } catch {
        mapped = [];
      }
      return {
        ...r,
        mapped_frameworks: Array.isArray(mapped) ? mapped : [],
      };
    });

    return { success: true, data: controls };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch controls";
    return { success: false, error: message };
  }
}

export async function createControl(workspaceId: string, input: CreateControlInput) {
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required" };
  }

  try {
    await requirePermission("workspace.manage", workspaceId);

    if (!input.id || !input.title || !input.frameworkId) {
      return { success: false, error: "Control ID, title, and framework are required" };
    }

    const framework = await db.queryOne<FrameworkRecord>(
      `SELECT * FROM frameworks WHERE id = $1`,
      [input.frameworkId]
    );

    const frameworkName = input.frameworkName || framework?.name || "ISO/IEC 27001:2022";
    const frameworkShort = input.frameworkShort || framework?.short_name || "ISO 27001";
    const domain = input.domain || "General Controls";
    const description = input.description || "";
    const status = input.status || "Unmapped";
    const mappedFrameworks = JSON.stringify(input.mappedFrameworks || []);

    await db.execute(
      `
      INSERT INTO controls (
        id, framework_id, framework_name, framework_short,
        title, description, domain, status, mapped_frameworks, workspace_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        domain = EXCLUDED.domain,
        status = EXCLUDED.status,
        mapped_frameworks = EXCLUDED.mapped_frameworks
      `,
      [
        input.id.trim(),
        input.frameworkId,
        frameworkName,
        frameworkShort,
        input.title.trim(),
        description,
        domain,
        status,
        mappedFrameworks,
        workspaceId,
      ]
    );

    await logAuditEvent({
      workspaceId,
      action: "CREATE",
      entityType: "Audit",
      entityId: input.id.trim(),
      description: `Created control "${input.title.trim()}" (${input.id.trim()}) in ${frameworkShort}`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create control";
    return { success: false, error: message };
  }
}

export async function updateControl(
  workspaceId: string,
  controlId: string,
  updates: Partial<CreateControlInput>
) {
  if (!workspaceId || !controlId) {
    return { success: false, error: "Workspace ID and Control ID are required" };
  }

  try {
    await requirePermission("workspace.manage", workspaceId);

    const existing = await db.queryOne<{ id: string; title: string; mapped_frameworks: string }>(
      `SELECT * FROM controls WHERE id = $1`,
      [controlId]
    );

    if (!existing) {
      return { success: false, error: "Control not found" };
    }

    const setParts: string[] = [];
    const values: (string | null)[] = [];

    if (updates.title !== undefined) {
      values.push(updates.title.trim());
      setParts.push(`title = $${values.length}`);
    }
    if (updates.description !== undefined) {
      values.push(updates.description.trim());
      setParts.push(`description = $${values.length}`);
    }
    if (updates.domain !== undefined) {
      values.push(updates.domain.trim());
      setParts.push(`domain = $${values.length}`);
    }
    if (updates.status !== undefined) {
      values.push(updates.status);
      setParts.push(`status = $${values.length}`);
    }
    if (updates.mappedFrameworks !== undefined) {
      values.push(JSON.stringify(updates.mappedFrameworks));
      setParts.push(`mapped_frameworks = $${values.length}`);
    }

    if (setParts.length > 0) {
      values.push(controlId);
      await db.execute(
        `UPDATE controls SET ${setParts.join(", ")} WHERE id = $${values.length}`,
        values
      );
    }

    await logAuditEvent({
      workspaceId,
      action: "UPDATE",
      entityType: "Audit",
      entityId: controlId,
      description: `Updated control "${existing.title}" (${controlId})`,
      details: updates,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update control";
    return { success: false, error: message };
  }
}

export async function deleteControl(workspaceId: string, controlId: string) {
  if (!workspaceId || !controlId) {
    return { success: false, error: "Workspace ID and Control ID are required" };
  }

  try {
    await requirePermission("workspace.manage", workspaceId);

    await db.execute(`DELETE FROM controls WHERE id = $1`, [controlId]);

    await logAuditEvent({
      workspaceId,
      action: "DELETE",
      entityType: "Audit",
      entityId: controlId,
      description: `Deleted control (${controlId})`,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete control";
    return { success: false, error: message };
  }
}
