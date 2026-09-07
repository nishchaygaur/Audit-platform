"use client";

import { useEffect, useState } from "react";
import { Building2, Check, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";

const workspaces = [
  {
    id: "abc-technologies",
    name: "ABC Technologies",
    description: "Technology & SaaS",
    audits: 8,
    risks: 12,
    findings: 7,
  },
  {
    id: "xyz-finance",
    name: "XYZ Finance",
    description: "Financial Services",
    audits: 5,
    risks: 9,
    findings: 4,
  },
  {
    id: "pqr-healthcare",
    name: "PQR Healthcare",
    description: "Healthcare",
    audits: 6,
    risks: 11,
    findings: 6,
  },
];

export default function WorkspacesPage() {
  const router = useRouter();
  const { currentWorkspace, setWorkspace } = useWorkspace();

  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("audit_authenticated") === "true";
  });

  useEffect(() => {
    const auth = localStorage.getItem("audit_authenticated") === "true";
    if (!auth) {
      router.replace("/signin");
    }
  }, [router]);

  function selectWorkspace(workspaceId: string) {
    setWorkspace(workspaceId);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("audit_authenticated");
    localStorage.removeItem("audit_user");
    router.push("/signin");
  }

  if (!authenticated) {
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {workspaces.map((workspace) => {
              const selected =
                currentWorkspace.id === workspace.id;

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
                    {workspace.description}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                    <WorkspaceMetric
                      label="Audits"
                      value={workspace.audits}
                    />

                    <WorkspaceMetric
                      label="Risks"
                      value={workspace.risks}
                    />

                    <WorkspaceMetric
                      label="Findings"
                      value={workspace.findings}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400">
                      Workspace
                    </span>

                    <span className="text-[11px] font-medium text-blue-600 group-hover:text-blue-700">
                      Open workspace →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-center text-[10px] text-slate-400">
          Audit Platform • Secure Governance, Risk & Compliance
        </div>
      </div>
    </main>
  );
}

function WorkspaceMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[15px] font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}