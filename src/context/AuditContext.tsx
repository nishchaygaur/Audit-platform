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
  | "Planned"
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Completed"
  | "On Hold";

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

  const refreshAudits = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setAudits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getAudits(currentWorkspace.id);
    if (res.success && res.data) {
      // Map to fit the format, maybe `start_date` to `startDate`
      const mapped = (res.data as any[]).map(a => ({
        ...a,
        startDate: a.start_date,
        dueDate: a.due_date
      }));
      setAudits(mapped);
    }
    setLoading(false);
  }, [currentWorkspace?.id]);

  useEffect(() => {
    refreshAudits();
  }, [refreshAudits]);

  const getAuditSync = useCallback(
    (auditId: string) => {
      return audits.find((audit) => audit.id === auditId);
    },
    [audits]
  );

  const addAuditAsync = useCallback(
    async (audit: NewAudit) => {
      if (!currentWorkspace?.id) return;
      const res = await createAudit(currentWorkspace.id, audit);
      if (res.success) {
        await refreshAudits();
        return res.data as Audit;
      }
      return undefined;
    },
    [currentWorkspace?.id, refreshAudits]
  );

  const updateAuditAsync = useCallback(
    async (auditId: string, updates: Partial<Audit>) => {
      if (!currentWorkspace?.id) return;
      const res = await updateAudit(currentWorkspace.id, auditId, updates);
      if (res.success) {
        await refreshAudits();
      }
    },
    [currentWorkspace?.id, refreshAudits]
  );

  const deleteAuditAsync = useCallback(
    async (auditId: string) => {
      if (!currentWorkspace?.id) return;
      const res = await deleteAudit(currentWorkspace.id, auditId);
      if (res.success) {
        await refreshAudits();
      }
    },
    [currentWorkspace?.id, refreshAudits]
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
