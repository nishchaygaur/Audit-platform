"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  Edit3,
  FileText,
  Link2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getControls,
  createControl,
  updateControl,
  deleteControl,
} from "@/actions/frameworks";

type MappingStatus = "Mapped" | "Unmapped";

type Control = {
  id: string;
  framework: string;
  frameworkShort: string;
  title: string;
  domain: string;
  description: string;
  status: MappingStatus;
  mappedFrameworks: string[];
};

const frameworkOptions = [
  "All Frameworks",
  "ISO 27001",
  "NIST CSF",
  "NIST RMF",
  "SOC 2",
  "CIS Controls",
  "PCI DSS",
];

const domainOptions = [
  "All Domains",
  "Organizational Controls",
  "Technological Controls",
  "People Controls",
  "Govern",
  "Identify",
  "Protect",
  "Detect",
  "Respond",
  "Recover",
  "Common Criteria",
  "Access Control",
];

export default function ControlLibraryPage() {
  const { currentWorkspace } = useWorkspace();

  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [frameworkFilter, setFrameworkFilter] =
    useState("All Frameworks");
  const [domainFilter, setDomainFilter] =
    useState("All Domains");
  const [statusFilter, setStatusFilter] =
    useState<"All" | MappingStatus>("All");

  const [selectedControl, setSelectedControl] =
    useState<Control | null>(null);

  const [editingControl, setEditingControl] =
    useState<Control | null>(null);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showMappingModal, setShowMappingModal] =
    useState(false);

  const [newControl, setNewControl] = useState({
    id: "",
    framework: "ISO 27001",
    title: "",
    domain: "Organizational Controls",
    description: "",
  });

  const [mappingFramework, setMappingFramework] =
    useState("NIST CSF");

  const loadControls = async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    const res = await getControls(currentWorkspace.id);
    if (res.success && res.data) {
      setControls(
        res.data.map((c: any) => ({
          id: c.id,
          framework: c.framework_name || c.framework_short || "ISO 27001",
          frameworkShort: c.framework_short || "ISO 27001",
          title: c.title,
          domain: c.domain,
          description: c.description,
          status: c.status,
          mappedFrameworks: c.mapped_frameworks || [],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadControls();
  }, [currentWorkspace?.id]);

  const filteredControls = useMemo(() => {
    return controls.filter((control) => {
      const query = search.toLowerCase();

      const matchesSearch =
        control.id.toLowerCase().includes(query) ||
        control.title.toLowerCase().includes(query) ||
        control.description.toLowerCase().includes(query) ||
        control.frameworkShort
          .toLowerCase()
          .includes(query);

      const matchesFramework =
        frameworkFilter === "All Frameworks" ||
        control.frameworkShort === frameworkFilter;

      const matchesDomain =
        domainFilter === "All Domains" ||
        control.domain === domainFilter;

      const matchesStatus =
        statusFilter === "All" ||
        control.status === statusFilter;

      return (
        matchesSearch &&
        matchesFramework &&
        matchesDomain &&
        matchesStatus
      );
    });
  }, [
    controls,
    search,
    frameworkFilter,
    domainFilter,
    statusFilter,
  ]);

  const mappedCount = controls.filter(
    (control) => control.status === "Mapped"
  ).length;

  const unmappedCount = controls.filter(
    (control) => control.status === "Unmapped"
  ).length;

  const frameworkCount = new Set(
    controls.map((control) => control.frameworkShort)
  ).size;

  async function addControl() {
    if (
      !newControl.id.trim() ||
      !newControl.title.trim()
    ) {
      return;
    }

    const frameworkShort = newControl.framework;
    const frameworkName =
      newControl.framework === "ISO 27001"
        ? "ISO/IEC 27001:2022"
        : newControl.framework;
    const frameworkId = frameworkShort.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const res = await createControl(currentWorkspace.id, {
      id: newControl.id.trim(),
      frameworkId,
      frameworkName,
      frameworkShort,
      title: newControl.title.trim(),
      domain: newControl.domain,
      description:
        newControl.description.trim() ||
        "Control requirement added to the workspace control library.",
      status: "Unmapped",
      mappedFrameworks: [],
    });

    if (!res.success) {
      alert(res.error || "Failed to add control");
      return;
    }

    await loadControls();

    setNewControl({
      id: "",
      framework: "ISO 27001",
      title: "",
      domain: "Organizational Controls",
      description: "",
    });

    setShowAddModal(false);
  }

  async function saveEdit() {
    if (
      !editingControl ||
      !editingControl.id.trim() ||
      !editingControl.title.trim()
    ) {
      return;
    }

    const res = await updateControl(currentWorkspace.id, editingControl.id, {
      title: editingControl.title.trim(),
      domain: editingControl.domain,
      description: editingControl.description.trim(),
      status: editingControl.status,
      mappedFrameworks: editingControl.mappedFrameworks,
    });

    if (!res.success) {
      alert(res.error || "Failed to update control");
      return;
    }

    await loadControls();
    setSelectedControl(editingControl);
    setEditingControl(null);
  }

  async function toggleMapping(
    controlId: string,
    framework: string
  ) {
    const control = controls.find((c) => c.id === controlId);
    if (!control) return;

    const exists = control.mappedFrameworks.includes(framework);
    const mappedFrameworks = exists
      ? control.mappedFrameworks.filter((item) => item !== framework)
      : [...control.mappedFrameworks, framework];
    const nextStatus: MappingStatus =
      mappedFrameworks.length > 0 ? "Mapped" : "Unmapped";

    const res = await updateControl(currentWorkspace.id, controlId, {
      mappedFrameworks,
      status: nextStatus,
    });

    if (!res.success) {
      alert(res.error || "Failed to update mapping");
      return;
    }

    await loadControls();

    setSelectedControl((current) => {
      if (!current || current.id !== controlId) return current;
      return {
        ...current,
        mappedFrameworks,
        status: nextStatus,
      };
    });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this control from the library?"
    );

    if (!confirmed) return;

    const res = await deleteControl(currentWorkspace.id, id);
    if (!res.success) {
      alert(res.error || "Failed to delete control");
      return;
    }

    await loadControls();

    if (selectedControl?.id === id) {
      setSelectedControl(null);
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
                <BookOpenCheck
                  className="h-5 w-5 text-blue-600"
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h1 className="text-[23px] font-semibold">
                  Control Library
                </h1>

                <p className="mt-1 text-[11px] text-slate-500">
                  Manage controls and cross-framework mappings
                  for {currentWorkspace.name}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Control
            </button>
          </div>

          {/* SUMMARY */}

          <div className="mb-5 grid grid-cols-4 gap-4">
            <SummaryCard
              label="Total Controls"
              value={String(controls.length)}
              icon={
                <FileText className="h-4 w-4" />
              }
            />

            <SummaryCard
              label="Mapped"
              value={String(mappedCount)}
              valueClass="text-emerald-600"
              icon={
                <Check className="h-4 w-4" />
              }
            />

            <SummaryCard
              label="Unmapped"
              value={String(unmappedCount)}
              valueClass="text-amber-600"
              icon={
                <Link2 className="h-4 w-4" />
              }
            />

            <SummaryCard
              label="Frameworks"
              value={String(frameworkCount)}
              valueClass="text-violet-600"
              icon={
                <ShieldCheck className="h-4 w-4" />
              }
            />
          </div>

          {/* FILTER PANEL */}

          <div className="mb-4 rounded-lg border border-slate-200 bg-white px-5 py-4">

            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />

              <span className="text-[11px] font-semibold text-slate-700">
                Control Filters
              </span>
            </div>

            <div className="grid grid-cols-[1.7fr_1fr_1fr_auto] gap-3">

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by control ID, name or description..."
                  className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-[11px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              <SelectFilter
                value={frameworkFilter}
                onChange={setFrameworkFilter}
                options={frameworkOptions}
              />

              <SelectFilter
                value={domainFilter}
                onChange={setDomainFilter}
                options={domainOptions}
              />

              <div className="flex items-center rounded-md border border-slate-200 p-1">

                {(
                  ["All", "Mapped", "Unmapped"] as const
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setStatusFilter(status)
                    }
                    className={`rounded px-3 py-1.5 text-[9px] font-medium ${
                      statusFilter === status
                        ? "bg-slate-100 text-slate-700"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}

              </div>

            </div>
          </div>

          {/* CONTROL TABLE */}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">

              <div>
                <p className="text-[12px] font-semibold text-slate-800">
                  Controls
                </p>

                <p className="mt-0.5 text-[9px] text-slate-400">
                  Showing {filteredControls.length} of{" "}
                  {controls.length} controls
                </p>
              </div>

              <div className="text-[9px] text-slate-400">
                Cross-framework mappings enabled
              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px] border-collapse">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">

                    <th className="px-5 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Control
                    </th>

                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Framework
                    </th>

                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Domain
                    </th>

                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Mapped To
                    </th>

                    <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="w-[100px] px-4 py-3" />

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredControls.map((control) => (
                    <tr
                      key={control.id}
                      className="hover:bg-slate-50/60"
                    >

                      <td className="px-5 py-4 align-top">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedControl(control)
                          }
                          className="text-left"
                        >
                          <p className="text-[10px] font-semibold text-blue-600 hover:text-blue-700">
                            {control.id}
                          </p>

                          <p className="mt-1 max-w-[350px] text-[11px] font-medium text-slate-700">
                            {control.title}
                          </p>

                          <p className="mt-1 max-w-[390px] line-clamp-2 text-[9px] leading-4 text-slate-400">
                            {control.description}
                          </p>
                        </button>

                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className="rounded bg-indigo-50 px-2 py-1 text-[9px] font-medium text-indigo-700">
                          {control.frameworkShort}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-600">
                          {control.domain}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">

                        {control.mappedFrameworks.length >
                        0 ? (
                          <div className="flex max-w-[230px] flex-wrap gap-1">

                            {control.mappedFrameworks.map(
                              (framework) => (
                                <span
                                  key={framework}
                                  className="rounded-full bg-blue-50 px-2 py-1 text-[8px] font-medium text-blue-700"
                                >
                                  {framework}
                                </span>
                              )
                            )}

                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400">
                            No mappings
                          </span>
                        )}

                      </td>

                      <td className="px-4 py-4 align-top">

                        {control.status === "Mapped" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-medium text-emerald-700">
                            <Check className="h-3 w-3" />
                            Mapped
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-medium text-amber-700">
                            Unmapped
                          </span>
                        )}

                      </td>

                      <td className="px-4 py-4 align-top">

                        <div className="flex items-center justifynd gap-1">

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedControl(
                                control
                              );
                              setShowMappingModal(
                                true
                              );
                            }}
                            title="Manage mapping"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditingControl(
                                control
                              )
                            }
                            title="Edit control"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                control.id
                              )
                            }
                            title="Delete control"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

              {filteredControls.length === 0 && (
                <div className="px-5 py-16 text-center">

                  <FileText className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-[12px] font-medium text-slate-600">
                    No controls found
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Try changing your filters or add a new control.
                  </p>

                </div>
              )}

            </div>

          </div>

        </section>
      </main>

      {/* CONTROL DETAILS */}

      {selectedControl &&
        !showMappingModal &&
        !editingControl && (
          <ModalOverlay
            onClose={() =>
              setSelectedControl(null)
            }
          >
            <div className="w-full max-w-[700px] rounded-xl bg-white shadow-2xl">

              <ModalHeader
                title={selectedControl.title}
                subtitle={`${selectedControl.id} · ${selectedControl.frameworkShort}`}
                onClose={() =>
                  setSelectedControl(null)
                }
              />

              <div className="space-y-5 px-6 py-5">

                <div className="grid grid-cols-3 gap-3">

                  <DetailBox
                    label="Framework"
                    value={
                      selectedControl.frameworkShort
                    }
                  />

                  <DetailBox
                    label="Domain"
                    value={
                      selectedControl.domain
                    }
                  />

                  <DetailBox
                    label="Status"
                    value={
                      selectedControl.status
                    }
                  />

                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold text-slate-600">
                    Requirement
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-[11px] leading-5 text-slate-600">
                    {selectedControl.description}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold text-slate-600">
                    Cross-framework mappings
                  </p>

                  {selectedControl.mappedFrameworks.length >
                  0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedControl.mappedFrameworks.map(
                        (framework) => (
                          <span
                            key={framework}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-medium text-blue-700"
                          >
                            <Link2 className="h-3 w-3" />
                            {framework}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      This control has no cross-framework mappings.
                    </p>
                  )}
                </div>

              </div>

              <div className="flex justifynd gap-2 border-t border-slate-100 px-6 py-4">

                <button
                  type="button"
                  onClick={() => {
                    setShowMappingModal(true);
                  }}
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-4 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Manage Mapping
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingControl(
                      selectedControl
                    );
                    setSelectedControl(null);
                  }}
                  className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Control
                </button>

              </div>

            </div>
          </ModalOverlay>
        )}

      {/* ADD CONTROL */}

      {showAddModal && (
        <ModalOverlay
          onClose={() => setShowAddModal(false)}
        >
          <div className="w-full max-w-[570px] rounded-xl bg-white shadow-2xl">

            <ModalHeader
              title="Add Control"
              subtitle={`Add a control to ${currentWorkspace.name}.`}
              onClose={() =>
                setShowAddModal(false)
              }
            />

            <div className="space-y-4 px-6 py-5">

              <div className="grid grid-cols-2 gap-4">

                <FormField label="Control ID">
                  <input
                    value={newControl.id}
                    onChange={(event) =>
                      setNewControl({
                        ...newControl,
                        id: event.target.value,
                      })
                    }
                    placeholder="e.g. ISO-A.5.3"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Framework">
                  <select
                    value={newControl.framework}
                    onChange={(event) =>
                      setNewControl({
                        ...newControl,
                        framework:
                          event.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    {frameworkOptions
                      .filter(
                        (item) =>
                          item !== "All Frameworks"
                      )
                      .map((framework) => (
                        <option
                          key={framework}
                          value={framework}
                        >
                          {framework}
                        </option>
                      ))}
                  </select>
                </FormField>

              </div>

              <FormField label="Control Name">
                <input
                  value={newControl.title}
                  onChange={(event) =>
                    setNewControl({
                      ...newControl,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter control name"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Domain">
                <select
                  value={newControl.domain}
                  onChange={(event) =>
                    setNewControl({
                      ...newControl,
                      domain: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  {domainOptions
                    .filter(
                      (item) =>
                        item !== "All Domains"
                    )
                    .map((domain) => (
                      <option
                        key={domain}
                        value={domain}
                      >
                        {domain}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={4}
                  value={newControl.description}
                  onChange={(event) =>
                    setNewControl({
                      ...newControl,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Describe the control requirement..."
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </FormField>

            </div>

            <ModalFooter
              onCancel={() =>
                setShowAddModal(false)
              }
              onConfirm={addControl}
              confirmLabel="Add Control"
            />

          </div>
        </ModalOverlay>
      )}

      {/* EDIT CONTROL */}

      {editingControl && (
        <ModalOverlay
          onClose={() =>
            setEditingControl(null)
          }
        >
          <div className="w-full max-w-[570px] rounded-xl bg-white shadow-2xl">

            <ModalHeader
              title="Edit Control"
              subtitle={`Update ${editingControl.id}.`}
              onClose={() =>
                setEditingControl(null)
              }
            />

            <div className="space-y-4 px-6 py-5">

              <FormField label="Control ID">
                <input
                  value={editingControl.id}
                  disabled
                  className={`${inputClass} bg-slate-50 text-slate-400`}
                />
              </FormField>

              <FormField label="Control Name">
                <input
                  value={editingControl.title}
                  onChange={(event) =>
                    setEditingControl({
                      ...editingControl,
                      title: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Domain">
                <select
                  value={editingControl.domain}
                  onChange={(event) =>
                    setEditingControl({
                      ...editingControl,
                      domain: event.target.value,
                    })
                  }
                  className={inputClass}
                >
                  {domainOptions
                    .filter(
                      (item) =>
                        item !== "All Domains"
                    )
                    .map((domain) => (
                      <option
                        key={domain}
                        value={domain}
                      >
                        {domain}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={4}
                  value={editingControl.description}
                  onChange={(event) =>
                    setEditingControl({
                      ...editingControl,
                      description:
                        event.target.value,
                    })
                  }
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </FormField>

            </div>

            <ModalFooter
              onCancel={() =>
                setEditingControl(null)
              }
              onConfirm={saveEdit}
              confirmLabel="Save Changes"
            />

          </div>
        </ModalOverlay>
      )}

      {/* MAPPING */}

      {showMappingModal &&
        selectedControl && (
          <ModalOverlay
            onClose={() => {
              setShowMappingModal(false);
            }}
          >
            <div className="w-full max-w-[560px] rounded-xl bg-white shadow-2xl">

              <ModalHeader
                title="Control Mapping"
                subtitle={`${selectedControl.id} · ${selectedControl.title}`}
                onClose={() =>
                  setShowMappingModal(false)
                }
              />

              <div className="px-6 py-5">

                <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">

                  <div className="flex items-start gap-3">

                    <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                    <p className="text-[10px] leading-4 text-blue-700">
                      Map this control to equivalent requirements
                      in other frameworks. A mapping automatically
                      marks the control as mapped.
                    </p>

                  </div>

                </div>

                <div className="space-y-2">

                  {frameworkOptions
                    .filter(
                      (framework) =>
                        framework !==
                          "All Frameworks" &&
                        framework !==
                          selectedControl.frameworkShort
                    )
                    .map((framework) => {
                      const mapped =
                        selectedControl.mappedFrameworks.includes(
                          framework
                        );

                      return (
                        <button
                          key={framework}
                          type="button"
                          onClick={() => {
                            toggleMapping(
                              selectedControl.id,
                              framework
                            );

                            setMappingFramework(
                              framework
                            );
                          }}
                          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                            mapped
                              ? "border-blue-200 bg-blue-50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                                mapped
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="text-[11px] font-medium text-slate-700">
                                {framework}
                              </p>

                              <p className="mt-0.5 text-[9px] text-slate-400">
                                Cross-framework mapping
                              </p>
                            </div>

                          </div>

                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border ${
                              mapped
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {mapped && (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </div>

                        </button>
                      );
                    })}

                </div>

              </div>

              <div className="flex justifynd border-t border-slate-100 px-6 py-4">

                <button
                  type="button"
                  onClick={() => {
                    setShowMappingModal(false);
                    setSelectedControl(
                      controls.find(
                        (control) =>
                          control.id ===
                          selectedControl.id
                      ) ?? null
                    );
                  }}
                  className="h-9 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700"
                >
                  Done
                </button>

              </div>

            </div>
          </ModalOverlay>
        )}
    </div>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function SummaryCard({
  icon,
  label,
  value,
  valueClass = "text-slate-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">

      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p
        className={`text-[20px] font-semibold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {label}
      </p>

    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-[10px] text-slate-600 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <ChevronDown className="pointervents-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">

      <p className="text-[9px] uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[11px] font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}

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
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
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
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  return (
    <div className="flex justifynd gap-2 border-t border-slate-100 px-6 py-4">

      <button
        type="button"
        onClick={onCancel}
        className="h-9 rounded-md border border-slate-200 px-4 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onConfirm}
        className="h-9 rounded-md bg-blue-600 px-4 text-[10px] font-medium text-white hover:bg-blue-700"
      >
        {confirmLabel}
      </button>

    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
export const dynamic = 'force-dynamic';
