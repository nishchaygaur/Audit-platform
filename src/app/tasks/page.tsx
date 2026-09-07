"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  Filter,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

type TaskStatus =
  | "Open"
  | "In Progress"
  | "Pending Approval"
  | "Completed";

type TaskPriority = "Low" | "Medium" | "High" | "Critical";

type Task = {
  id: string;
  title: string;
  description: string;
  type: string;
  reference: string;
  owner: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
};

const workspaceTasks: Record<string, Task[]> = {
  "abc-technologies": [
    {
      id: "TSK-001",
      title: "Review privileged access controls",
      description:
        "Review privileged account assignments and validate that access is appropriate.",
      type: "Control Review",
      reference: "AUD-2024-001",
      owner: "John Carter",
      priority: "High",
      dueDate: "2024-06-30",
      status: "In Progress",
    },
    {
      id: "TSK-002",
      title: "Upload access review evidence",
      description:
        "Upload the latest quarterly privileged access review evidence.",
      type: "Evidence",
      reference: "AUD-2024-001",
      owner: "Emily Davis",
      priority: "High",
      dueDate: "2024-07-02",
      status: "Open",
    },
    {
      id: "TSK-003",
      title: "Validate remediation action",
      description:
        "Validate that the remediation action has addressed the identified finding.",
      type: "Remediation",
      reference: "REM-002",
      owner: "Alice Smith",
      priority: "Medium",
      dueDate: "2024-07-05",
      status: "In Progress",
    },
    {
      id: "TSK-004",
      title: "Complete security awareness review",
      description:
        "Review employee security awareness completion records.",
      type: "Control Review",
      reference: "AUD-2024-001",
      owner: "Michael Lee",
      priority: "Medium",
      dueDate: "2024-07-08",
      status: "Open",
    },
    {
      id: "TSK-005",
      title: "Approve final audit report",
      description: "Perform final management review and approve the audit report.",
      type: "Approval",
      reference: "RPT-001",
      owner: "Alice Smith",
      priority: "High",
      dueDate: "2024-07-12",
      status: "Pending Approval",
    },
    {
      id: "TSK-006",
      title: "Close completed remediation",
      description:
        "Verify closure documentation and mark the remediation action complete.",
      type: "Remediation",
      reference: "REM-005",
      owner: "David Wilson",
      priority: "Low",
      dueDate: "2024-07-15",
      status: "Completed",
    },
    {
      id: "TSK-007",
      title: "Review backup policy evidence",
      description:
        "Review backup configuration and supporting evidence against the control requirements.",
      type: "Evidence",
      reference: "AUD-2024-002",
      owner: "Sarah Brown",
      priority: "Medium",
      dueDate: "2024-07-18",
      status: "Open",
    },
    {
      id: "TSK-008",
      title: "Assess incident response procedure",
      description:
        "Complete the assessment of the incident response procedure and record the result.",
      type: "Control Review",
      reference: "AUD-2024-002",
      owner: "John Carter",
      priority: "Critical",
      dueDate: "2024-07-20",
      status: "In Progress",
    },
  ],

  "xyz-finance": [
    {
      id: "TSK-101",
      title: "Review financial system access",
      description:
        "Review user access to critical financial applications.",
      type: "Control Review",
      reference: "AUD-2024-101",
      owner: "Robert Wilson",
      priority: "Critical",
      dueDate: "2024-07-03",
      status: "In Progress",
    },
    {
      id: "TSK-102",
      title: "Collect MFA evidence",
      description:
        "Collect evidence demonstrating MFA enforcement for privileged users.",
      type: "Evidence",
      reference: "AUD-2024-101",
      owner: "Emma Davis",
      priority: "High",
      dueDate: "2024-07-05",
      status: "Open",
    },
    {
      id: "TSK-103",
      title: "Validate vendor remediation",
      description:
        "Validate remediation performed for the vendor management finding.",
      type: "Remediation",
      reference: "REM-101",
      owner: "James Miller",
      priority: "High",
      dueDate: "2024-07-08",
      status: "In Progress",
    },
    {
      id: "TSK-104",
      title: "Review business continuity evidence",
      description:
        "Review business continuity and disaster recovery evidence.",
      type: "Evidence",
      reference: "AUD-2024-101",
      owner: "Olivia Taylor",
      priority: "Medium",
      dueDate: "2024-07-10",
      status: "Open",
    },
    {
      id: "TSK-105",
      title: "Approve risk treatment",
      description:
        "Review and approve the proposed treatment for the identified risk.",
      type: "Approval",
      reference: "RSK-101",
      owner: "Robert Wilson",
      priority: "High",
      dueDate: "2024-07-12",
      status: "Pending Approval",
    },
    {
      id: "TSK-106",
      title: "Close access remediation",
      description:
        "Confirm that excessive access has been removed and documented.",
      type: "Remediation",
      reference: "REM-103",
      owner: "Emma Davis",
      priority: "Medium",
      dueDate: "2024-07-15",
      status: "Completed",
    },
  ],

  "pqr-healthcare": [
    {
      id: "TSK-201",
      title: "Review patient data access",
      description:
        "Review access to systems containing sensitive patient information.",
      type: "Control Review",
      reference: "AUD-2024-201",
      owner: "Daniel Smith",
      priority: "Critical",
      dueDate: "2024-07-02",
      status: "In Progress",
    },
    {
      id: "TSK-202",
      title: "Upload encryption evidence",
      description:
        "Upload evidence demonstrating encryption of sensitive information.",
      type: "Evidence",
      reference: "AUD-2024-201",
      owner: "Sophia Johnson",
      priority: "High",
      dueDate: "2024-07-04",
      status: "Open",
    },
    {
      id: "TSK-203",
      title: "Validate backup remediation",
      description:
        "Validate the remediation implemented for backup controls.",
      type: "Remediation",
      reference: "REM-201",
      owner: "William Brown",
      priority: "High",
      dueDate: "2024-07-07",
      status: "In Progress",
    },
    {
      id: "TSK-204",
      title: "Review incident response evidence",
      description:
        "Review incident response records and supporting documentation.",
      type: "Evidence",
      reference: "AUD-2024-201",
      owner: "Sophia Johnson",
      priority: "Medium",
      dueDate: "2024-07-09",
      status: "Open",
    },
    {
      id: "TSK-205",
      title: "Approve audit findings",
      description:
        "Review and approve the final set of audit findings.",
      type: "Approval",
      reference: "AUD-2024-201",
      owner: "Daniel Smith",
      priority: "High",
      dueDate: "2024-07-12",
      status: "Pending Approval",
    },
    {
      id: "TSK-206",
      title: "Complete security training review",
      description:
        "Review staff security training completion records.",
      type: "Control Review",
      reference: "AUD-2024-202",
      owner: "Olivia Wilson",
      priority: "Low",
      dueDate: "2024-07-16",
      status: "Completed",
    },
  ],
};

const emptyTask: Omit<Task, "id"> = {
  title: "",
  description: "",
  type: "Control Review",
  reference: "",
  owner: "",
  priority: "Medium",
  dueDate: "",
  status: "Open",
};

const priorityClasses: Record<TaskPriority, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-blue-100 text-blue-700",
};

const statusClasses: Record<TaskStatus, string> = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  "Pending Approval": "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
};

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(task: Task) {
  if (task.status === "Completed" || !task.dueDate) return false;

  return new Date(`${task.dueDate}T23:59:59`) < new Date();
}

export default function TasksPage() {
  const { currentWorkspace } = useWorkspace();

  const [prevWorkspaceId, setPrevWorkspaceId] = useState(currentWorkspace.id);
  const [tasks, setTasks] = useState<Task[]>(() =>
    JSON.parse(JSON.stringify(workspaceTasks[currentWorkspace.id] ?? []))
  );
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  if (prevWorkspaceId !== currentWorkspace.id) {
    setPrevWorkspaceId(currentWorkspace.id);
    setTasks(JSON.parse(JSON.stringify(workspaceTasks[currentWorkspace.id] ?? [])));
    setSearch("");
    setPriorityFilter("All");
    setStatusFilter("All");
  }

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [form, setForm] = useState(emptyTask);
  const inputClass =
  "w-full h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] text-slate-700 outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const text = `${task.id} ${task.title} ${task.type} ${task.reference} ${task.owner}`
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tasks, search, priorityFilter, statusFilter]);

  const totalTasks = tasks.length;
  const openTasks = tasks.filter((task) => task.status === "Open").length;
  const inProgress = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;
  const completed = tasks.filter(
    (task) => task.status === "Completed"
  ).length;
  const overdue = tasks.filter(isOverdue).length;

  function openCreateModal() {
    setEditingTask(null);
    setForm(emptyTask);
    setShowModal(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      type: task.type,
      reference: task.reference,
      owner: task.owner,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
    });
    setShowModal(true);
  }

  function saveTask() {
    if (!form.title.trim() || !form.owner.trim() || !form.dueDate) {
      alert("Please enter a title, owner and due date.");
      return;
    }

    if (editingTask) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                ...form,
                title: form.title.trim(),
                owner: form.owner.trim(),
              }
            : task
        )
      );
    } else {
      const nextNumber =
        tasks.reduce((max, task) => {
          const number = Number(task.id.replace(/\D/g, ""));
          return Number.isFinite(number) ? Math.max(max, number) : max;
        }, 0) + 1;

      const newTask: Task = {
        id: `TSK-${String(nextNumber).padStart(3, "0")}`,
        ...form,
        title: form.title.trim(),
        owner: form.owner.trim(),
      };

      setTasks((current) => [newTask, ...current]);
    }

    setShowModal(false);
    setEditingTask(null);
    setForm(emptyTask);
  }

  function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;

    setTasks((current) => current.filter((task) => task.id !== id));

    if (selectedTask?.id === id) {
      setSelectedTask(null);
      setShowDetails(false);
    }
  }

  function completeTask(task: Task) {
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, status: "Completed" }
          : item
      )
    );
  }

  function openDetails(task: Task) {
    setSelectedTask(task);
    setShowDetails(true);
  }

  return (
    <main className="ml-[250px] min-h-screen bg-[#f6f8fc]">
      <div className="px-8 py-7">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-[25px] font-semibold text-slate-900">
              Tasks
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Manage audit tasks and track assigned work
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>

        {/* Workspace */}
        <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Current Workspace
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-slate-800">
                {currentWorkspace.name}
              </p>
            </div>

            <div className="rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-700">
              Workspace Tasks
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-5 gap-4">
          <SummaryCard
            title="Total Tasks"
            value={totalTasks}
            icon={<ClipboardList size={19} />}
          />

          <SummaryCard
            title="Open"
            value={openTasks}
            icon={<ListChecks size={19} />}
          />

          <SummaryCard
            title="In Progress"
            value={inProgress}
            icon={<Clock3 size={19} />}
          />

          <SummaryCard
            title="Completed"
            value={completed}
            icon={<CheckCircle2 size={19} />}
          />

          <SummaryCard
            title="Overdue"
            value={overdue}
            icon={<Clock3 size={19} />}
          />
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Filters */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Approval">
                  Pending Approval
                </option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Task
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => {
                  const overdueTask = isOverdue(task);

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <ClipboardList size={15} />
                          </div>

                          <div>
                            <p className="text-[12px] font-semibold text-slate-800">
                              {task.title}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {task.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[11px] text-slate-600">
                        {task.type}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                          {task.reference || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-[11px] text-slate-600">
                        {task.owner}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${priorityClasses[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p
                            className={`text-[11px] ${
                              overdueTask
                                ? "font-semibold text-red-600"
                                : "text-slate-600"
                            }`}
                          >
                            {formatDate(task.dueDate)}
                          </p>

                          {overdueTask && (
                            <p className="mt-0.5 text-[9px] font-medium text-red-500">
                              Overdue
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClasses[task.status]}`}
                        >
                          {task.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View"
                            onClick={() => openDetails(task)}
                            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye size={15} />
                          </button>

                          {task.status !== "Completed" && (
                            <button
                              title="Complete"
                              onClick={() => completeTask(task)}
                              className="rounded-md p-2 text-slate-400 hover:bg-green-50 hover:text-green-600"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          <button
                            title="Edit"
                            onClick={() => openEditModal(task)}
                            className="rounded-md p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            title="Delete"
                            onClick={() => deleteTask(task.id)}
                            className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <ClipboardList
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />
                      <p className="text-[13px] font-medium text-slate-500">
                        No tasks found
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-[11px] text-slate-400">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <MoreHorizontal size={15} />
              Workspace task management
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-slate-900">
                  {editingTask ? "Edit Task" : "Add Task"}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {editingTask
                    ? "Update task information"
                    : "Create a new workspace task"}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              <FormField label="Task Title">
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Enter task title"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Owner">
                <input
                  value={form.owner}
                  onChange={(e) =>
                    setForm({ ...form, owner: e.target.value })
                  }
                  placeholder="Enter owner"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Type">
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  className={inputClass}
                >
                  <option>Control Review</option>
                  <option>Evidence</option>
                  <option>Finding</option>
                  <option>Risk</option>
                  <option>Remediation</option>
                  <option>Approval</option>
                  <option>General</option>
                </select>
              </FormField>

              <FormField label="Reference">
                <input
                  value={form.reference}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
                  }
                  placeholder="AUD-2024-001"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Priority">
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as TaskPriority,
                    })
                  }
                  className={inputClass}
                >
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </FormField>

              <FormField label="Due Date">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as TaskStatus,
                    })
                  }
                  className={inputClass}
                >
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Pending Approval</option>
                  <option>Completed</option>
                </select>
              </FormField>

              <div />

              <FormField label="Description" full>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the task..."
                  rows={4}
                  className={`${inputClass} h-auto resize-none py-2`}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={saveTask}
                className="rounded-lg bg-blue-600 px-5 py-2 text-[12px] font-medium text-white hover:bg-blue-700"
              >
                {editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-[10px] font-medium text-blue-600">
                  {selectedTask.id}
                </p>
                <h2 className="mt-1 text-[17px] font-semibold text-slate-900">
                  {selectedTask.title}
                </h2>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>
                <p className="text-[12px] leading-5 text-slate-600">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Type"
                  value={selectedTask.type}
                />

                <DetailItem
                  label="Reference"
                  value={selectedTask.reference || "—"}
                />

                <DetailItem
                  label="Owner"
                  value={selectedTask.owner}
                />

                <DetailItem
                  label="Due Date"
                  value={formatDate(selectedTask.dueDate)}
                />

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Priority
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${priorityClasses[selectedTask.priority]}`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClasses[selectedTask.status]}`}
                  >
                    {selectedTask.status}
                  </span>
                </div>
              </div>

              {isOverdue(selectedTask) && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-[11px] font-semibold text-red-700">
                    This task is overdue
                  </p>
                  <p className="mt-0.5 text-[10px] text-red-600">
                    The due date has passed and the task is not completed.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowDetails(false);
                  openEditModal(selectedTask);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                <Pencil size={14} />
                Edit
              </button>

              {selectedTask.status !== "Completed" && (
                <button
                  onClick={() => {
                    completeTask(selectedTask);
                    setSelectedTask({
                      ...selectedTask,
                      status: "Completed",
                    });
                  }}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-green-700"
                >
                  <CheckCircle2 size={14} />
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-[11px] font-medium text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-[23px] font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1.5 block text-[11px] font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-[12px] font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}