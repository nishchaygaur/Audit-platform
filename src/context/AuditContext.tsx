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
import { getAudits, createAudit, updateAudit, deleteAudit } from "@/actions/audits";

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
  addAudit: (audit: NewAudit) => Promise<Audit | undefined>;
  updateAudit: (
    auditId: string,
    updates: Partial<Audit>
  ) => Promise<void>;
  deleteAudit: (auditId: string) => Promise<void>;
};

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const refreshAudits = useCallback(async () => {
    if (!workspaceId) {
      setAudits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getAudits(workspaceId);
    if (res.success && res.data) {
      const mapped = (res.data as Record<string, unknown>[]).map((a) => ({
        ...a,
        startDate: a.start_date as string,
        dueDate: a.due_date as string,
      }));
      setAudits(mapped as Audit[]);
    }
    setLoading(false);
  }, [workspaceId]);

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
          const mapped = (res.data as Record<string, unknown>[]).map((a) => ({
            ...a,
            startDate: a.start_date as string,
            dueDate: a.due_date as string,
          }));
          setAudits(mapped as Audit[]);
        }
        setLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

  const getAuditSync = useCallback(
    (auditId: string) => {
      return audits.find((audit) => audit.id === auditId);
    },
    [audits]
  );

  const addAuditAsync = useCallback(
    async (audit: NewAudit) => {
      if (!workspaceId) return;
      const res = await createAudit(workspaceId, audit);
      if (res.success) {
        await refreshAudits();
        return res.data as Audit;
      }
      return undefined;
    },
    [workspaceId, refreshAudits]
  );

  const updateAuditAsync = useCallback(
    async (auditId: string, updates: Partial<Audit>) => {
      if (!workspaceId) return;
      const res = await updateAudit(workspaceId, auditId, updates);
      if (res.success) {
        await refreshAudits();
      }
    },
    [workspaceId, refreshAudits]
  );

  const deleteAuditAsync = useCallback(
    async (auditId: string) => {
      if (!workspaceId) return;
      const res = await deleteAudit(workspaceId, auditId);
      if (res.success) {
        await refreshAudits();
      }
    },
    [workspaceId, refreshAudits]
  );

  const value = useMemo(
    () => ({
      audits,
      loading,
      refreshAudits,
      getAudit: getAuditSync,
      addAudit: addAuditAsync,
      updateAudit: updateAuditAsync,
      deleteAudit: deleteAuditAsync,
    }),
    [audits, loading, refreshAudits, getAuditSync, addAuditAsync, updateAuditAsync, deleteAuditAsync]
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
