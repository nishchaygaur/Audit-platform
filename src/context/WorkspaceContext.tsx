"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Workspace = {
  id: string;
  name: string;
  description: string;
};

const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: "abc-technologies",
    name: "ABC Technologies",
    description: "Information Security Audit Management",
  },
  {
    id: "xyz-finance",
    name: "XYZ Finance",
    description: "Financial Services Information Security",
  },
  {
    id: "pqr-healthcare",
    name: "PQR Healthcare",
    description: "Healthcare HIPAA & Security Audits",
  },
];

type WorkspaceContextType = {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  setWorkspace: (id: string) => void;
  addWorkspace: (workspace: { name: string; description: string; id?: string }) => Workspace;
};

const WorkspaceContext = createContext<
  WorkspaceContextType | undefined
>(undefined);

const STORAGE_KEY = "audit-platform-workspace";
const WORKSPACES_STORAGE_KEY = "audit-platform-workspaces-list";

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof window === "undefined") return INITIAL_WORKSPACES;
    try {
      const stored = window.localStorage.getItem(WORKSPACES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_WORKSPACES;
  });

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
    if (typeof window === "undefined") return INITIAL_WORKSPACES[0].id;
    try {
      const savedWorkspace = window.localStorage.getItem(STORAGE_KEY);
      if (savedWorkspace) {
        return savedWorkspace;
      }
    } catch {
      // ignore
    }
    return INITIAL_WORKSPACES[0].id;
  });

  const setWorkspace = useCallback((id: string) => {
    setCurrentWorkspaceId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const addWorkspace = useCallback((newWs: { name: string; description: string; id?: string }) => {
    const slug =
      newWs.id ||
      newWs.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      `ws-${Date.now()}`;

    const created: Workspace = {
      id: slug,
      name: newWs.name,
      description: newWs.description || "Security & Compliance Audits",
    };

    setWorkspaces((prev) => {
      const updated = [...prev, created];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    setCurrentWorkspaceId(created.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, created.id);
    }
    return created;
  }, []);

  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) ??
    workspaces[0] ??
    INITIAL_WORKSPACES[0];

  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      setWorkspace,
      addWorkspace,
    }),
    [workspaces, currentWorkspace, setWorkspace, addWorkspace]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      "useWorkspace must be used inside WorkspaceProvider"
    );
  }

  return context;
}