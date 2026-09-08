"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Workspace = {
  id: string;
  name: string;
  description?: string;
  role?: string;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  setWorkspace: (id: string) => void;
};

const WorkspaceContext = createContext<
  WorkspaceContextType | undefined
>(undefined);

const STORAGE_KEY = "audit-platform-workspace";

export function WorkspaceProvider({
  children,
  initialWorkspaces = [],
}: {
  children: ReactNode;
  initialWorkspaces?: Workspace[];
}) {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
    return initialWorkspaces.length > 0 ? initialWorkspaces[0].id : null;
  });

  // Hydrate from localStorage and keep ID in sync if the initial list changes
  useEffect(() => {
    if (initialWorkspaces.length > 0) {
      let savedWorkspace: string | null = null;
      try {
        savedWorkspace = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        // ignore
      }

      if (savedWorkspace && initialWorkspaces.some((w) => w.id === savedWorkspace)) {
        if (currentWorkspaceId !== savedWorkspace) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCurrentWorkspaceId(savedWorkspace);
        }
      } else {
        const firstId = initialWorkspaces[0].id;
        if (currentWorkspaceId !== firstId) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCurrentWorkspaceId(firstId);
        }
        try {
          window.localStorage.setItem(STORAGE_KEY, firstId);
        } catch {}
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWorkspaceId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWorkspaces]);

  const setWorkspace = useCallback((id: string) => {
    setCurrentWorkspaceId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const fallbackWorkspace: Workspace = { 
    id: "", 
    name: initialWorkspaces.length === 0 ? "No Workspace" : "Loading...", 
    description: "" 
  };

  const currentWorkspace = currentWorkspaceId
    ? initialWorkspaces.find((w) => w.id === currentWorkspaceId) || fallbackWorkspace
    : fallbackWorkspace;

  const value = useMemo(
    () => ({
      workspaces: initialWorkspaces,
      currentWorkspace,
      setWorkspace,
    }),
    [initialWorkspaces, currentWorkspace, setWorkspace]
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
