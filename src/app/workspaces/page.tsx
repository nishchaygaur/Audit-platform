"use client";

import { useEffect } from "react";
import { Building2, Check, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/actions/auth";

export default function WorkspacesPage() {
  const router = useRouter();
  const { currentWorkspace, workspaces, setWorkspace } = useWorkspace();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  function selectWorkspace(workspaceId: string) {
    setWorkspace(workspaceId);
    router.push("/dashboard");
  }

  async function logout() {
    await signOut();
  }

  if (loading || !user) {
    return null;
  }

  return (
    <main className="fixed inset-0 z-[100] min-h-screen overflow-y-auto bg-[#f6f8fc]">
      <div className="mx-auto min-h-screen max-w-6xl px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-slate-900">
                Audit Platform
              </p>
              <p className="text-[10px] text-slate-400">
                Workspace Selection
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-600">
              Your Organizations
            </p>
            <h1 className="mt-2 text-[29px] font-semibold text-slate-900">
              Select a workspace
            </h1>
            <p className="mt-2 text-[13px] text-slate-500">
              Choose the organization you want to manage.
            </p>
          </div>

          {workspaces.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-900">No workspaces found</p>
              <p className="mt-1 text-sm text-slate-500">You haven&apos;t been added to any workspaces yet. Please contact an administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {workspaces.map((workspace) => {
                const selected = currentWorkspace?.id === workspace.id;

                return (
                  <button
                    key={workspace.id}
                    onClick={() => selectWorkspace(workspace.id)}
                    className={`group relative rounded-xl border bg-white p-5 text-left transition ${
                      selected
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check size={13} />
                      </div>
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Building2 size={21} />
                    </div>
                    <h2 className="mt-5 text-[15px] font-semibold text-slate-800">
                      {workspace.name}
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {workspace.description || 'Organization Workspace'}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-400">
                        Role: {workspace.role}
                      </span>
                      <span className="text-[11px] font-medium text-blue-600 group-hover:text-blue-700">
                        Open workspace →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-16 text-center text-[10px] text-slate-400">
          Audit Platform • Secure Governance, Risk & Compliance
        </div>
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
