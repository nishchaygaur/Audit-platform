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
    if (typeof window === "undefined") return null;
    
    try {
      const savedWorkspace = window.localStorage.getItem(STORAGE_KEY);
      if (savedWorkspace) {
        return savedWorkspace;
      }
    } catch {
      // ignore
    }
    return initialWorkspaces.length > 0 ? initialWorkspaces[0].id : null;
  });

  // Keep ID in sync if the initial list changes and the current ID is invalid
  useEffect(() => {
    if (initialWorkspaces.length > 0) {
      if (!currentWorkspaceId || !initialWorkspaces.some(w => w.id === currentWorkspaceId)) {
        const id = initialWorkspaces[0].id;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentWorkspaceId(id);
        window.localStorage.setItem(STORAGE_KEY, id);
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWorkspaceId(null);
    }
  }, [initialWorkspaces, currentWorkspaceId]);

  const setWorkspace = useCallback((id: string) => {
    setCurrentWorkspaceId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const fallbackWorkspace: Workspace = { id: "", name: "Loading...", description: "" };

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
