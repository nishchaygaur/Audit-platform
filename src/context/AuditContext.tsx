"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useWorkspace } from "./WorkspaceContext";
import { getAudits, getAudit, createAudit, updateAudit, deleteAudit } from "@/actions/audits";

export type AuditStatus =
  | "Planning"
  | "Fieldwork"
  | "Review"
  | "Reporting"
  | "Completed";

export type Audit = {
  id: string;
  name: string;
  framework: string;
  lead: string;
  status: AuditStatus;
  progress: number;
  startDate: string;
  dueDate: string;
  objective: string;
  scope: string;
  controls: number;
  evidence: number;
  findings: number;
  risks: number;
  workspace: string;
};

type NewAudit = Omit<Audit, "id">;

type AuditContextType = {
  audits: Audit[];
  loading: boolean;
  refreshAudits: () => Promise<void>;
  getAudit: (auditId: string) => Audit | undefined;
  fetchAudit: (auditId: string) => Promise<Audit | undefined>;
  addAudit: (audit: NewAudit) => Promise<Audit | undefined>;
  updateAudit: (
    auditId: string,
    updates: Partial<Audit>
  ) => Promise<boolean>;
  deleteAudit: (auditId: string) => Promise<boolean>;
};

const AuditContext = createContext<AuditContextType | undefined>(undefined);

function mapDbRowToAudit(row: Record<string, unknown>, defaultWorkspace: string): Audit {
  return {
    id: String(row.id),
    name: String(row.name),
    framework: String(row.framework || "ISO 27001"),
    lead: String(row.lead || "Unassigned"),
    status: (row.status as AuditStatus) || "Planning",
    progress: Number(row.progress) || 0,
    startDate: String(row.start_date || ""),
    dueDate: String(row.due_date || ""),
    objective: String(row.objective || ""),
    scope: String(row.scope || ""),
    controls: Number(row.controls) || 0,
    evidence: Number(row.evidence) || 0,
    findings: Number(row.findings) || 0,
    risks: Number(row.risks) || 0,
    workspace: defaultWorkspace || String(row.workspace_id || ""),
  };
}

export function AuditProvider({ children }: { children: ReactNode }) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const workspaceName = currentWorkspace?.name || "";

  const refreshAudits = useCallback(async () => {
    if (!workspaceId) {
      setAudits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getAudits(workspaceId);
    if (res.success && res.data) {
      const mapped = (res.data as Record<string, unknown>[]).map((a) =>
        mapDbRowToAudit(a, workspaceName)
      );
      setAudits(mapped);
    }
    setLoading(false);
  }, [workspaceId, workspaceName]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!workspaceId) {
        setAudits([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await getAudits(workspaceId);
      if (!ignore) {
        if (res.success && res.data) {
          const mapped = (res.data as Record<string, unknown>[]).map((a) =>
            mapDbRowToAudit(a, workspaceName)
          );
          setAudits(mapped);
        }
        setLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [workspaceId, workspaceName]);

  const getAuditSync = useCallback(
    (auditId: string) => {
      return audits.find((audit) => audit.id === auditId);
    },
    [audits]
  );

  const fetchAuditAsync = useCallback(
    async (auditId: string): Promise<Audit | undefined> => {
      if (!workspaceId || !auditId) return undefined;
      const res = await getAudit(workspaceId, auditId);
      if (res.success && res.data) {
        return mapDbRowToAudit(res.data as Record<string, unknown>, workspaceName);
      }
      return undefined;
    },
    [workspaceId, workspaceName]
  );

  const addAuditAsync = useCallback(
    async (audit: NewAudit): Promise<Audit | undefined> => {
      if (!workspaceId) return undefined;
      const res = await createAudit(workspaceId, {
        name: audit.name,
        framework: audit.framework,
        lead: audit.lead,
        status: audit.status,
        progress: audit.progress,
        startDate: audit.startDate,
        dueDate: audit.dueDate,
        objective: audit.objective,
        scope: audit.scope,
        controls: audit.controls,
        evidence: audit.evidence,
        findings: audit.findings,
        risks: audit.risks,
      });
      if (res.success && res.data) {
        await refreshAudits();
        return mapDbRowToAudit(res.data as Record<string, unknown>, workspaceName);
      }
      return undefined;
    },
    [workspaceId, workspaceName, refreshAudits]
  );

  const updateAuditAsync = useCallback(
    async (auditId: string, updates: Partial<Audit>): Promise<boolean> => {
      if (!workspaceId) return false;
      const res = await updateAudit(workspaceId, auditId, {
        name: updates.name,
        framework: updates.framework,
        lead: updates.lead,
        status: updates.status,
        progress: updates.progress,
        startDate: updates.startDate,
        dueDate: updates.dueDate,
        objective: updates.objective,
        scope: updates.scope,
        controls: updates.controls,
        evidence: updates.evidence,
        findings: updates.findings,
        risks: updates.risks,
      });
      if (res.success) {
        await refreshAudits();
        return true;
      }
      return false;
    },
    [workspaceId, refreshAudits]
  );

  const deleteAuditAsync = useCallback(
    async (auditId: string): Promise<boolean> => {
      if (!workspaceId) return false;
      const res = await deleteAudit(workspaceId, auditId);
      if (res.success) {
        await refreshAudits();
        return true;
      }
      return false;
    },
    [workspaceId, refreshAudits]
  );

  const value = useMemo(
    () => ({
      audits,
      loading,
      refreshAudits,
      getAudit: getAuditSync,
      fetchAudit: fetchAuditAsync,
      addAudit: addAuditAsync,
      updateAudit: updateAuditAsync,
      deleteAudit: deleteAuditAsync,
    }),
    [audits, loading, refreshAudits, getAuditSync, fetchAuditAsync, addAuditAsync, updateAuditAsync, deleteAuditAsync]
  );

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudits() {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error("useAudits must be used inside AuditProvider");
  }
  return context;
}
