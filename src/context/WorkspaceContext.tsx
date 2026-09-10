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
import { getUserWorkspaces } from "@/actions/workspace";

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
  addWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
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
  const [workspacesList, setWorkspacesList] = useState<Workspace[]>(initialWorkspaces);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
    return initialWorkspaces.length > 0 ? initialWorkspaces[0].id : null;
  });

  // Keep workspacesList in sync with server initialWorkspaces
  useEffect(() => {
    setWorkspacesList(initialWorkspaces);
  }, [initialWorkspaces]);

  // Hydrate from localStorage and keep ID in sync if the list changes
  useEffect(() => {
    if (workspacesList.length > 0) {
      let savedWorkspace: string | null = null;
      try {
        savedWorkspace = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        // ignore
      }

      if (savedWorkspace && workspacesList.some((w) => w.id === savedWorkspace)) {
        if (currentWorkspaceId !== savedWorkspace) {
          setCurrentWorkspaceId(savedWorkspace);
        }
      } else {
        const firstId = workspacesList[0].id;
        if (currentWorkspaceId !== firstId) {
          setCurrentWorkspaceId(firstId);
        }
        try {
          window.localStorage.setItem(STORAGE_KEY, firstId);
        } catch {}
      }
    } else {
      setCurrentWorkspaceId(null);
    }
  }, [workspacesList]);

  const setWorkspace = useCallback((id: string) => {
    setCurrentWorkspaceId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const addWorkspace = useCallback((workspace: Workspace) => {
    setWorkspacesList((prev) => {
      const exists = prev.some((w) => w.id === workspace.id);
      if (exists) return prev;
      return [workspace, ...prev];
    });
    setWorkspace(workspace.id);
  }, [setWorkspace]);

  const refreshWorkspaces = useCallback(async () => {
    try {
      const list = await getUserWorkspaces();
      if (list && Array.isArray(list)) {
        setWorkspacesList(list);
      }
    } catch {
      // ignore
    }
  }, []);

  const fallbackWorkspace: Workspace = { 
    id: "", 
    name: workspacesList.length === 0 ? "No Workspace" : "Loading...", 
    description: "" 
  };

  const currentWorkspace = currentWorkspaceId
    ? workspacesList.find((w) => w.id === currentWorkspaceId) || fallbackWorkspace
    : fallbackWorkspace;

  const value = useMemo(
    () => ({
      workspaces: workspacesList,
      currentWorkspace,
      setWorkspace,
      addWorkspace,
      refreshWorkspaces,
    }),
    [workspacesList, currentWorkspace, setWorkspace, addWorkspace, refreshWorkspaces]
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
