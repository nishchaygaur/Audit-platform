"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Layers3,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getFrameworks,
  createFramework,
  updateFramework,
  deleteFramework as deleteFrameworkAction,
  getControls,
  createControl,
} from "@/actions/frameworks";
import CrossMappingView from "@/components/frameworks/CrossMappingView";
import { FRAMEWORK_PRESETS } from "@/lib/framework-presets";

type FrameworkStatus = "Active" | "Available";

type Framework = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  controls: number;
  mapped: number;
  audits: number;
  status: FrameworkStatus;
  category: string;
  version: string;
};

type Control = {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: "Mapped" | "Unmapped";
};

export default function FrameworksPage() {
  const { currentWorkspace } = useWorkspace();

  const [frameworkTab, setFrameworkTab] = useState<"catalog" | "crosswalk">("catalog");
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controlsByFramework, setControlsByFramework] = useState<
    Record<string, Control[]>
  >({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | FrameworkStatus>("All");

  const [selectedFramework, setSelectedFramework] =
    useState<Framework | null>(null);

  const [menuFramework, setMenuFramework] =
    useState<string | null>(null);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showControlModal, setShowControlModal] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [controlSubmitting, setControlSubmitting] = useState(false);
  const [controlError, setControlError] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [includeBaselineControls, setIncludeBaselineControls] = useState<boolean>(true);

  const selectedPreset = useMemo(() => {
    return FRAMEWORK_PRESETS.find((p) => p.id === selectedPresetId);
  }, [selectedPresetId]);

  const [newFramework, setNewFramework] = useState({
    name: "",
    shortName: "",
    version: "",
    category: "Cybersecurity",
    description: "",
  });

  const [newControl, setNewControl] = useState({
    id: "",
    title: "",
    domain: "",
    description: "",
  });

  const loadData = async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    const res = await getFrameworks(currentWorkspace.id);
    if (res.success && res.data) {
      setFrameworks(
        res.data.map((f: any) => ({
          id: f.id,
          name: f.name,
          shortName: f.short_name,
          description: f.description,
          controls: f.controls_count || 0,
          mapped: f.mapped_count || 0,
          audits: f.audits_count || 0,
          status: f.status,
          category: f.category,
          version: f.version,
        }))
      );
    }

    const cRes = await getControls(currentWorkspace.id);
    if (cRes.success && cRes.data) {
      const grouped: Record<string, Control[]> = {};
      for (const c of cRes.data) {
        if (!grouped[c.framework_id]) {
          grouped[c.framework_id] = [];
        }
        grouped[c.framework_id].push({
          id: c.id,
          title: c.title,
          description: c.description,
          domain: c.domain,
          status: c.status,
        });
      }
      setControlsByFramework(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.id]);

  const filteredFrameworks = useMemo(() => {
    return frameworks.filter((framework) => {
      const matchesSearch =
        framework.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        framework.shortName
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        framework.category
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        framework.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [frameworks, search, statusFilter]);

  const totalFrameworks = frameworks.length;

  const activeFrameworks = frameworks.filter(
    (framework) => framework.status === "Active"
  ).length;

  const mappedControls = frameworks.reduce(
    (sum, framework) => sum + framework.mapped,
    0
  );

  const controlLibraries = frameworks.length;

  async function toggleFrameworkStatus(id: string) {
    const fw = frameworks.find((f) => f.id === id);
    if (!fw || !currentWorkspace?.id) return;
    const nextStatus: FrameworkStatus =
      fw.status === "Active" ? "Available" : "Active";

    setActionLoadingId(id);
    try {
      const res = await updateFramework(currentWorkspace.id, id, {
        status: nextStatus,
      });
      if (!res.success) {
        alert(res.error || "Failed to update framework status");
        return;
      }
      await loadData();
    } finally {
      setActionLoadingId(null);
      setMenuFramework(null);
    }
  }

  async function deleteFramework(id: string) {
    const framework = frameworks.find(
      (item) => item.id === id
    );

    if (!framework || !currentWorkspace?.id) return;

    const confirmed = window.confirm(
      `Delete ${framework.name}?`
    );

    if (!confirmed) return;

    setActionLoadingId(id);
    try {
      const res = await deleteFrameworkAction(currentWorkspace.id, id);
      if (!res.success) {
        alert(res.error || "Cannot delete framework");
        return;
      }

      await loadData();
      if (selectedFramework?.id === id) {
        setSelectedFramework(null);
      }
    } finally {
      setActionLoadingId(null);
      setMenuFramework(null);
    }
  }

  async function addFramework() {
    setFormError(null);

    if (!currentWorkspace?.id) {
      setFormError("No active workspace found. Please select a workspace from the sidebar or reload the page.");
      return;
    }

    if (
      !newFramework.name.trim() ||
      !newFramework.shortName.trim() ||
      !newFramework.version.trim()
    ) {
      setFormError("Please select a standard framework preset from the dropdown or fill in Framework Name, Short Name, and Version.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createFramework(currentWorkspace.id, {
        name: newFramework.name.trim(),
        shortName: newFramework.shortName.trim(),
        version: newFramework.version.trim(),
        category: newFramework.category,
        description:
          newFramework.description.trim() ||
          "Custom compliance framework added to the workspace.",
        status: "Available",
        initialControls:
          includeBaselineControls && selectedPreset ? selectedPreset.controls : undefined,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to create framework");
        return;
      }

      await loadData();
      setNewFramework({
        name: "",
        shortName: "",
        version: "",
        category: "Cybersecurity",
        description: "",
      });

      setSelectedPresetId("");
      setShowAddModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create framework";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function addControl() {
    setControlError(null);

    if (!selectedFramework) return;

    if (!currentWorkspace?.id) {
      setControlError("No active workspace selected.");
      return;
    }

    if (
      !newControl.id.trim() ||
      !newControl.title.trim()
    ) {
      setControlError("Control ID and Control Name are required.");
      return;
    }

    setControlSubmitting(true);
    try {
      const res = await createControl(currentWorkspace.id, {
        id: newControl.id.trim(),
        frameworkId: selectedFramework.id,
        frameworkName: selectedFramework.name,
        frameworkShort: selectedFramework.shortName,
        title: newControl.title.trim(),
        domain: newControl.domain.trim() || "General Controls",
        description:
          newControl.description.trim() ||
          "Control requirement added to the framework library.",
        status: "Unmapped",
      });

      if (!res.success) {
        setControlError(res.error || "Failed to add control");
        return;
      }

      await loadData();

      setNewControl({
        id: "",
        title: "",
        domain: "",
        description: "",
      });

      setShowControlModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add control";
      setControlError(msg);
    } finally {
      setControlSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">
      <main className="ml-[250px] min-h-screen">
        <section className="px-8 py-7">

          {/* HEADER */}

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Layers3
                  className="h-5 w-5 text-blue-600"
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h1 className="text-[23px] font-semibold">
                  Frameworks
                </h1>

                <p className="mt-1 text-[11px] text-slate-500">
                  Manage compliance frameworks, control libraries
                  and mappings for {currentWorkspace.name}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowAddModal(true);
              }}
              className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Framework
            </button>
          </div>

          {/* TAB NAVIGATION */}
          <div className="mb-6 flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setFrameworkTab("catalog")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                frameworkTab === "catalog"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers3 className="h-4 w-4" />
              Framework Catalog & Libraries
            </button>
            <button
              type="button"
              onClick={() => setFrameworkTab("crosswalk")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                frameworkTab === "crosswalk"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Cross-Walk Matrix & Multi-Mapping (ISO ↔ SOC 2 ↔ NIST)
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">P2</span>
            </button>
          </div>

          {frameworkTab === "crosswalk" ? (
            <CrossMappingView workspaceId={currentWorkspace.id} />
          ) : (
            <>
              {/* SUMMARY */}

          <div className="mb-5 grid grid-cols-4 gap-4">

            <SummaryCard
              icon={
                <BookOpenCheck className="h-4 w-4" />
              }
              label="Total Frameworks"
              value={String(totalFrameworks)}
              loading={loading}
            />

            <SummaryCard
              icon={
                <ShieldCheck className="h-4 w-4" />
              }
              label="Active"
              value={String(activeFrameworks)}
              valueClass="text-emerald-600"
              loading={loading}
            />

            <SummaryCard
              icon={
                <ClipboardCheck className="h-4 w-4" />
              }
              label="Mapped Controls"
              value={String(mappedControls)}
              valueClass="text-blue-600"
              loading={loading}
            />

            <SummaryCard
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Control Libraries"
              value={String(controlLibraries)}
              valueClass="text-violet-600"
              loading={loading}
            />

          </div>

          {/* MAIN PANEL */}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

            {/* TOOLBAR */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search frameworks..."
                  className="h-9 w-[330px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter("All")
                  }
                  className={`rounded-md px-3 py-2 text-[10px] font-medium ${
                    statusFilter === "All"
                      ? "bg-slate-100 text-slate-700"
                      : "text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter("Active")
                  }
                  className={`rounded-md px-3 py-2 text-[10px] font-medium ${
                    statusFilter === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  Active
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter("Available")
                  }
                  className={`rounded-md px-3 py-2 text-[10px] font-medium ${
                    statusFilter === "Available"
                      ? "bg-slate-100 text-slate-700"
                      : "text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  Available
                </button>

              </div>

            </div>

            {/* FRAMEWORK LIST */}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
                <p className="mt-3 text-[13px] font-semibold text-slate-800">
                  Loading compliance frameworks...
                </p>
                <p className="mt-1 max-w-sm text-[11px] text-slate-400">
                  Retrieving control catalogs, mapped frameworks, and audit stats for {currentWorkspace?.name || "workspace"}
                </p>
              </div>
            ) : filteredFrameworks.length > 0 ? (
              <div className="divide-y divide-slate-100">

                {filteredFrameworks.map(
                  (framework) => (
                    <FrameworkRow
                      key={framework.id}
                      framework={framework}
                      menuOpen={
                        menuFramework === framework.id
                      }
                      actionLoading={actionLoadingId === framework.id}
                      onMenu={() =>
                        setMenuFramework(
                          menuFramework === framework.id
                            ? null
                            : framework.id
                        )
                      }
                      onView={() => {
                        setSelectedFramework(
                          framework
                        );
                        setMenuFramework(null);
                      }}
                      onToggle={() =>
                        toggleFrameworkStatus(
                          framework.id
                        )
                      }
                      onDelete={() =>
                        deleteFramework(
                          framework.id
                        )
                      }
                    />
                  )
                )}

              </div>
            ) : (
              <div className="px-5 py-16 text-center">
                <Layers3 className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-[12px] font-medium text-slate-600">
                  No frameworks found
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Try changing your search or filter.
                </p>
              </div>
            )}

          </div>

          {/* INFO */}

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/50 px-5 py-4">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-blue-900">
                  Framework mapping
                </p>

                <p className="mt-1 max-w-3xl text-[10px] leading-4 text-blue-700">
                  Framework mappings allow the same organizational
                  control to satisfy requirements across multiple
                  standards. This helps reduce duplicate audit work
                  and provides a unified view of compliance.
                </p>
              </div>

            </div>

          </div>
            </>
          )}

        </section>
      </main>

      {/* =====================================================
          FRAMEWORK DETAILS / CONTROL LIBRARY
      ===================================================== */}

      {selectedFramework && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/30 px-6">

          <div className="max-h-[88vh] w-full max-w-[1100px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <BookOpenCheck className="h-5 w-5 text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-[15px] font-semibold text-slate-800">
                    {selectedFramework.name}
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {selectedFramework.shortName} ·{" "}
                    {selectedFramework.version} ·{" "}
                    {selectedFramework.category}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedFramework(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* SUMMARY */}

            <div className="grid grid-cols-4 gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">

              <DetailStat
                label="Status"
                value={selectedFramework.status}
              />

              <DetailStat
                label="Controls"
                value={String(
                  selectedFramework.controls
                )}
              />

              <DetailStat
                label="Mapped"
                value={`${selectedFramework.mapped}`}
              />

              <DetailStat
                label="Audits"
                value={String(
                  selectedFramework.audits
                )}
              />

            </div>

            {/* CONTROL LIBRARY */}

            <div className="max-h-[58vh] overflow-y-auto px-6 py-5">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h3 className="text-[13px] font-semibold text-slate-800">
                    Control Library
                  </h3>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Controls available for mapping into audits.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowControlModal(true)
                  }
                  className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[10px] font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Control
                </button>

              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">

                <table className="w-full border-collapse">

                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">

                      <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Control
                      </th>

                      <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Domain
                      </th>

                      <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </th>

                      <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Mapping
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {(controlsByFramework[
                      selectedFramework.id
                    ] ?? []).map((control) => (
                      <tr
                        key={control.id}
                        className="hover:bg-slate-50/60"
                      >

                        <td className="px-4 py-3 align-top">

                          <p className="text-[11px] font-semibold text-blue-600">
                            {control.id}
                          </p>

                          <p className="mt-1 text-[10px] font-medium text-slate-700">
                            {control.title}
                          </p>

                        </td>

                        <td className="px-4 py-3 align-top">

                          <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
                            {control.domain}
                          </span>

                        </td>

                        <td className="max-w-[430px] px-4 py-3 align-top text-[10px] leading-4 text-slate-400">
                          {control.description}
                        </td>

                        <td className="px-4 py-3 align-top">

                          {control.status ===
                          "Mapped" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-medium text-emerald-700">
                              <Check className="h-3 w-3" />
                              Mapped
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-medium text-slate-500">
                              Unmapped
                            </span>
                          )}

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <p className="mt-2 text-[11px] font-medium text-slate-600">
                      Loading control catalog...
                    </p>
                  </div>
                ) : (controlsByFramework[
                  selectedFramework.id
                ] ?? []).length === 0 ? (
                  <div className="px-5 py-12 text-center">

                    <FileText className="mx-auto h-7 w-7 text-slate-300" />

                    <p className="mt-2 text-[11px] font-medium text-slate-600">
                      No controls in this library
                    </p>

                    <p className="mt-1 text-[9px] text-slate-400">
                      Add the first control to begin building the library.
                    </p>

                  </div>
                ) : null}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ADD FRAMEWORK MODAL
      ===================================================== */}

      {showAddModal && (
        <ModalOverlay
          onClose={() => {
            if (!submitting) {
              setShowAddModal(false);
              setFormError(null);
            }
          }}
        >

          <div className="w-full max-w-[560px] rounded-xl bg-white shadow-2xl overflow-hidden">

            <ModalHeader
              title="Add Framework"
              subtitle="Create or import a compliance framework into this workspace."
              disabled={submitting}
              onClose={() => {
                if (!submitting) {
                  setShowAddModal(false);
                  setFormError(null);
                }
              }}
            />

            <div className="space-y-4 px-6 py-5 max-h-[75vh] overflow-y-auto">

              {formError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900">Cannot create framework</p>
                    <p className="mt-0.5 text-red-700 leading-relaxed">{formError}</p>
                  </div>
                </div>
              )}

              {submitting && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3.5 text-[11px] text-blue-900 shadow-xs">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-950">Provisioning Framework...</p>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      {includeBaselineControls && selectedPreset
                        ? `Registering ${newFramework.name || selectedPreset.name} and importing ${selectedPreset.controls.length} curated baseline controls...`
                        : "Writing framework records into workspace database..."}
                    </p>
                  </div>
                </div>
              )}

              <FormField label="Select Framework Preset / Standard Template">
                <select
                  disabled={submitting}
                  value={selectedPresetId}
                  onChange={(e) => {
                    setFormError(null);
                    const presetId = e.target.value;
                    setSelectedPresetId(presetId);
                    if (presetId === "custom" || !presetId) {
                      setNewFramework({
                        name: "",
                        shortName: "",
                        version: "1.0",
                        category: "Cybersecurity",
                        description: "",
                      });
                    } else {
                      const preset = FRAMEWORK_PRESETS.find((p) => p.id === presetId);
                      if (preset) {
                        setNewFramework({
                          name: preset.name,
                          shortName: preset.shortName,
                          version: preset.version,
                          category: preset.category,
                          description: preset.description,
                        });
                      }
                    }
                  }}
                  className={`${inputClass} font-medium text-slate-800 bg-slate-50 border-slate-300 focus:bg-white disabled:opacity-60`}
                >
                  <option value="">-- Choose from Pre-configured Standards Catalog --</option>
                  <option value="custom">⚙️ Custom / Blank Framework (Manual Entry)</option>
                  
                  <optgroup label="Cybersecurity & Information Security">
                    <option value="iso-27001">ISO/IEC 27001:2022 - Information Security Management</option>
                    <option value="nist-csf">NIST Cybersecurity Framework 2.0 (CSF 2.0)</option>
                    <option value="cis-v8">CIS Critical Security Controls v8 (CIS 18)</option>
                    <option value="nist-800-53">NIST SP 800-53 Rev. 5 - Federal Security Controls</option>
                    <option value="csa-ccm">CSA CCM v4 - Cloud Security Alliance Matrix</option>
                  </optgroup>

                  <optgroup label="Assurance & Financial Compliance">
                    <option value="soc-2">AICPA SOC 2 Type II - Trust Services Criteria</option>
                    <option value="pci-dss">PCI DSS v4.0 - Payment Card Industry Standard</option>
                    <option value="soc-1">SOC 1 / SSAE 18 (ISAE 3402) - Financial Controls</option>
                  </optgroup>

                  <optgroup label="Privacy & Healthcare">
                    <option value="hipaa">HIPAA Security & Privacy Rule (45 CFR Part 160/164)</option>
                    <option value="gdpr">GDPR - General Data Protection Regulation (EU 2016/679)</option>
                    <option value="iso-27701">ISO/IEC 27701:2019 - Privacy Information Management</option>
                  </optgroup>

                  <optgroup label="Risk Management & Government">
                    <option value="nist-rmf">NIST Risk Management Framework (RMF Rev. 5)</option>
                    <option value="fedramp">FedRAMP Moderate Baseline (Rev. 5 Tailored)</option>
                    <option value="dora">DORA - Digital Operational Resilience Act (EU 2022/2554)</option>
                  </optgroup>
                </select>
              </FormField>

              {selectedPreset && (
                <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-3.5 text-[11px] text-blue-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {selectedPreset.shortName}
                      </span>
                      <span className="font-semibold text-slate-800">{selectedPreset.name}</span>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-800">
                      {selectedPreset.controls.length} Baseline Controls
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {selectedPreset.description}
                  </p>
                  <label className="mt-2.5 flex cursor-pointer items-center gap-2 border-t border-blue-100/80 pt-2">
                    <input
                      type="checkbox"
                      disabled={submitting}
                      checked={includeBaselineControls}
                      onChange={(e) => setIncludeBaselineControls(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-blue-900">
                      Automatically import {selectedPreset.controls.length} curated baseline controls into workspace
                    </span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">

                <FormField label="Framework Name">
                  <input
                    disabled={submitting}
                    value={newFramework.name}
                    onChange={(event) => {
                      setFormError(null);
                      setNewFramework({
                        ...newFramework,
                        name: event.target.value,
                      });
                    }}
                    placeholder="e.g. ISO/IEC 27001:2022"
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </FormField>

                <FormField label="Short Name">
                  <input
                    disabled={submitting}
                    value={newFramework.shortName}
                    onChange={(event) => {
                      setFormError(null);
                      setNewFramework({
                        ...newFramework,
                        shortName:
                          event.target.value,
                      });
                    }}
                    placeholder="e.g. ISO 27001"
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </FormField>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <FormField label="Version">
                  <input
                    disabled={submitting}
                    value={newFramework.version}
                    onChange={(event) => {
                      setFormError(null);
                      setNewFramework({
                        ...newFramework,
                        version:
                          event.target.value,
                      });
                    }}
                    placeholder="e.g. 2022"
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </FormField>

                <FormField label="Category">
                  <select
                    disabled={submitting}
                    value={newFramework.category}
                    onChange={(event) =>
                      setNewFramework({
                        ...newFramework,
                        category:
                          event.target.value,
                      })
                    }
                    className={`${inputClass} disabled:opacity-60`}
                  >
                    <option>
                      Information Security
                    </option>
                    <option>
                      Cybersecurity
                    </option>
                    <option>
                      Risk Management
                    </option>
                    <option>
                      Compliance
                    </option>
                    <option>
                      Assurance
                    </option>
                    <option>Privacy</option>
                  </select>
                </FormField>

              </div>

              <FormField label="Description">
                <textarea
                  disabled={submitting}
                  value={newFramework.description}
                  onChange={(event) =>
                    setNewFramework({
                      ...newFramework,
                      description:
                        event.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Describe the framework..."
                  className={`${inputClass} resize-none py-2 disabled:opacity-60`}
                />
              </FormField>

            </div>

            <ModalFooter
              onCancel={() => {
                if (!submitting) {
                  setShowAddModal(false);
                  setFormError(null);
                }
              }}
              onConfirm={addFramework}
              confirmLabel="Add Framework"
              loading={submitting}
              loadingLabel={
                includeBaselineControls && selectedPreset
                  ? `Importing ${selectedPreset.shortName} & Controls...`
                  : "Creating Framework..."
              }
              disabled={submitting}
            />

          </div>

        </ModalOverlay>
      )}

      {/* =====================================================
          ADD CONTROL MODAL
      ===================================================== */}

      {showControlModal &&
        selectedFramework && (
          <ModalOverlay
            onClose={() => {
              if (!controlSubmitting) {
                setShowControlModal(false);
                setControlError(null);
              }
            }}
          >

            <div className="w-full max-w-[520px] rounded-xl bg-white shadow-2xl overflow-hidden">

              <ModalHeader
                title="Add Control"
                subtitle={`Add a control requirement to ${selectedFramework.shortName}.`}
                disabled={controlSubmitting}
                onClose={() => {
                  if (!controlSubmitting) {
                    setShowControlModal(false);
                    setControlError(null);
                  }
                }}
              />

              <div className="space-y-4 px-6 py-5 max-h-[75vh] overflow-y-auto">

                {controlError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Cannot create control</p>
                      <p className="mt-0.5 text-red-700 leading-relaxed">{controlError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">

                  <FormField label="Control ID">
                    <input
                      disabled={controlSubmitting}
                      value={newControl.id}
                      onChange={(event) => {
                        setControlError(null);
                        setNewControl({
                          ...newControl,
                          id: event.target.value,
                        });
                      }}
                      placeholder="e.g. A.5.3"
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </FormField>

                  <FormField label="Domain">
                    <input
                      disabled={controlSubmitting}
                      value={newControl.domain}
                      onChange={(event) => {
                        setControlError(null);
                        setNewControl({
                          ...newControl,
                          domain:
                            event.target.value,
                        });
                      }}
                      placeholder="e.g. Access Control"
                      className={`${inputClass} disabled:opacity-60`}
                    />
                  </FormField>

                </div>

                <FormField label="Control Name">
                  <input
                    disabled={controlSubmitting}
                    value={newControl.title}
                    onChange={(event) => {
                      setControlError(null);
                      setNewControl({
                        ...newControl,
                        title:
                          event.target.value,
                      });
                    }}
                    placeholder="Enter control name"
                    className={`${inputClass} disabled:opacity-60`}
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    disabled={controlSubmitting}
                    value={newControl.description}
                    onChange={(event) => {
                      setControlError(null);
                      setNewControl({
                        ...newControl,
                        description:
                          event.target.value,
                      });
                    }}
                    rows={4}
                    placeholder="Describe the control requirement..."
                    className={`${inputClass} resize-none py-2 disabled:opacity-60`}
                  />
                </FormField>

              </div>

              <ModalFooter
                onCancel={() => {
                  if (!controlSubmitting) {
                    setShowControlModal(false);
                    setControlError(null);
                  }
                }}
                onConfirm={addControl}
                confirmLabel="Add Control"
                loading={controlSubmitting}
                loadingLabel="Adding Control..."
                disabled={controlSubmitting}
              />

            </div>

          </ModalOverlay>
        )}

    </div>
  );
}

/* ============================================================
   FRAMEWORK ROW
============================================================ */

function FrameworkRow({
  framework,
  menuOpen,
  actionLoading = false,
  onMenu,
  onView,
  onToggle,
  onDelete,
}: {
  framework: Framework;
  menuOpen: boolean;
  actionLoading?: boolean;
  onMenu: () => void;
  onView: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const percentage =
    framework.controls === 0
      ? 0
      : Math.round(
          (framework.mapped /
            framework.controls) *
            100
        );

  const active =
    framework.status === "Active";

  return (
    <div className="px-5 py-5 transition hover:bg-slate-50/60">

      <div className="flex items-center gap-5">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <BookOpenCheck
            className="h-5 w-5 text-indigo-600"
            strokeWidth={1.7}
          />
        </div>

        <div className="w-[290px] shrink-0">

          <div className="flex items-center gap-2">

            <h3 className="text-[13px] font-semibold text-slate-800">
              {framework.name}
            </h3>

            {active ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-medium text-emerald-700">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-medium text-slate-500">
                Available
              </span>
            )}

          </div>

          <p className="mt-1 text-[9px] font-medium text-blue-600">
            {framework.shortName} ·{" "}
            {framework.version}
          </p>

          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">
            {framework.description}
          </p>

        </div>

        <div className="w-[135px] shrink-0">

          <p className="mb-1 text-[9px] uppercase tracking-wide text-slate-400">
            Category
          </p>

          <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
            {framework.category}
          </span>

        </div>

        <div className="w-[120px] shrink-0">

          <p className="mb-1 text-[9px] uppercase tracking-wide text-slate-400">
            Controls
          </p>

          <p className="text-[13px] font-semibold text-slate-800">
            {framework.controls}
          </p>

        </div>

        <div className="w-[145px] shrink-0">

          <div className="mb-1 flex items-center justify-between">

            <p className="text-[9px] uppercase tracking-wide text-slate-400">
              Mapped
            </p>

            <span className="text-[9px] font-medium text-slate-500">
              {percentage}%
            </span>

          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${percentage}%`,
              }}
            />

          </div>

          <p className="mt-1 text-[9px] text-slate-400">
            {framework.mapped} of{" "}
            {framework.controls}
          </p>

        </div>

        <div className="w-[70px] shrink-0">

          <p className="mb-1 text-[9px] uppercase tracking-wide text-slate-400">
            Audits
          </p>

          <p className="text-[13px] font-semibold text-slate-800">
            {framework.audits}
          </p>

        </div>

        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          {actionLoading ? (
            <div className="flex h-8 items-center gap-1.5 rounded-md bg-blue-50 px-3 text-[11px] font-medium text-blue-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onMenu}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-blue-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-[92px] top-9 z-30 w-[155px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={onView}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
                  >
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    View Library
                  </button>

                  <button
                    type="button"
                    onClick={onToggle}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-slate-600 hover:bg-slate-50"
                  >
                    {active ? (
                      <>
                        <X className="h-3.5 w-3.5" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Activate
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onView}
                className="flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
              >
                View
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon,
  label,
  value,
  valueClass = "text-slate-900",
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">

      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>

      {loading ? (
        <div className="h-6 w-14 animate-pulse rounded bg-slate-200 my-0.5" />
      ) : (
        <p
          className={`text-[20px] font-semibold ${valueClass}`}
        >
          {value}
        </p>
      )}

      <p className="mt-1 text-[10px] text-slate-400">
        {label}
      </p>

    </div>
  );
}

/* ============================================================
   DETAIL STAT
============================================================ */

function DetailStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">

      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[13px] font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-[10px] font-medium text-slate-600">
        {label}
      </label>

      {children}

    </div>
  );
}

/* ============================================================
   MODAL
============================================================ */

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

      <div>
        <h2 className="text-[15px] font-semibold text-slate-800">
          {title}
        </h2>

        <p className="mt-1 text-[10px] text-slate-400">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <X className="h-4 w-4" />
      </button>

    </div>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel,
  loading = false,
  loadingLabel,
  disabled = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end items-center gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50">

      <button
        type="button"
        disabled={loading || disabled}
        onClick={onCancel}
        className="h-9 rounded-md border border-slate-200 bg-white px-4 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Cancel
      </button>

      <button
        type="button"
        disabled={loading || disabled}
        onClick={onConfirm}
        className="inline-flex items-center justify-center gap-2 h-9 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-xs min-w-[110px]"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>{loading ? (loadingLabel || "Saving...") : confirmLabel}</span>
      </button>

    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
export const dynamic = 'force-dynamic';
