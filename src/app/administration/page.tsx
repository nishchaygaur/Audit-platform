"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

type UserStatus = "Active" | "Inactive" | "Pending";

type Role =
  | "Owner"
  | "Admin"
  | "Auditor"
  | "Reviewer"
  | "Viewer";

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: UserStatus;
  lastLogin: string;
};

const workspaceUsers: Record<string, PlatformUser[]> = {
  "abc-technologies": [
    {
      id: "USR-001",
      name: "Alice Smith",
      email: "alice.smith@abctech.com",
      role: "Owner",
      department: "Security",
      status: "Active",
      lastLogin: "2024-07-01",
    },
    {
      id: "USR-002",
      name: "John Carter",
      email: "john.carter@abctech.com",
      role: "Auditor",
      department: "Internal Audit",
      status: "Active",
      lastLogin: "2024-06-30",
    },
    {
      id: "USR-003",
      name: "Emily Davis",
      email: "emily.davis@abctech.com",
      role: "Reviewer",
      department: "Compliance",
      status: "Active",
      lastLogin: "2024-06-28",
    },
    {
      id: "USR-004",
      name: "Michael Lee",
      email: "michael.lee@abctech.com",
      role: "Admin",
      department: "Enterprise Risk",
      status: "Active",
      lastLogin: "2024-06-27",
    },
    {
      id: "USR-005",
      name: "David Wilson",
      email: "david.wilson@abctech.com",
      role: "Viewer",
      department: "IT Operations",
      status: "Inactive",
      lastLogin: "2024-06-15",
    },
  ],

  "xyz-finance": [
    {
      id: "USR-101",
      name: "Robert Wilson",
      email: "robert.wilson@xyzfinance.com",
      role: "Owner",
      department: "Security",
      status: "Active",
      lastLogin: "2024-07-01",
    },
    {
      id: "USR-102",
      name: "Emma Davis",
      email: "emma.davis@xyzfinance.com",
      role: "Auditor",
      department: "Internal Audit",
      status: "Active",
      lastLogin: "2024-06-30",
    },
    {
      id: "USR-103",
      name: "James Miller",
      email: "james.miller@xyzfinance.com",
      role: "Admin",
      department: "Risk",
      status: "Active",
      lastLogin: "2024-06-29",
    },
    {
      id: "USR-104",
      name: "Olivia Taylor",
      email: "olivia.taylor@xyzfinance.com",
      role: "Reviewer",
      department: "Compliance",
      status: "Pending",
      lastLogin: "Never",
    },
  ],

  "pqr-healthcare": [
    {
      id: "USR-201",
      name: "Daniel Smith",
      email: "daniel.smith@pqrhealth.com",
      role: "Owner",
      department: "Security",
      status: "Active",
      lastLogin: "2024-07-01",
    },
    {
      id: "USR-202",
      name: "Sophia Johnson",
      email: "sophia.johnson@pqrhealth.com",
      role: "Auditor",
      department: "Internal Audit",
      status: "Active",
      lastLogin: "2024-06-30",
    },
    {
      id: "USR-203",
      name: "William Brown",
      email: "william.brown@pqrhealth.com",
      role: "Admin",
      department: "Enterprise Risk",
      status: "Active",
      lastLogin: "2024-06-28",
    },
    {
      id: "USR-204",
      name: "Olivia Wilson",
      email: "olivia.wilson@pqrhealth.com",
      role: "Viewer",
      department: "IT",
      status: "Inactive",
      lastLogin: "2024-06-10",
    },
  ],
};

const roleDescriptions: Record<Role, string> = {
  Owner:
    "Full workspace control including billing, deletion, and user management.",
  Admin:
    "Administrative access including users, configuration and audit management.",
  Auditor:
    "Performs audit assessments and manages evidence, findings and audit activities.",
  Reviewer:
    "Reviews audit activities, findings, evidence and reports.",
  Viewer:
    "Read-only access to published audits, reports and metrics.",
};

const roleClasses: Record<Role, string> = {
  Owner: "bg-purple-100 text-purple-700",
  Admin: "bg-blue-100 text-blue-700",
  Auditor: "bg-cyan-100 text-cyan-700",
  Reviewer: "bg-green-100 text-green-700",
  Viewer: "bg-slate-100 text-slate-600",
};

const statusClasses: Record<UserStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-slate-100 text-slate-500",
  Pending: "bg-yellow-100 text-yellow-700",
};

const emptyUser: Omit<PlatformUser, "id" | "lastLogin"> = {
  name: "",
  email: "",
  role: "Auditor",
  department: "",
  status: "Active",
};

export default function AdministrationPage() {
  const { currentWorkspace } = useWorkspace();

  const [users, setUsers] = useState<PlatformUser[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingUser, setEditingUser] =
    useState<PlatformUser | null>(null);

  const [selectedUser, setSelectedUser] =
    useState<PlatformUser | null>(null);

  const [form, setForm] = useState(emptyUser);
  const inputClass =
  "w-full h-9 rounded-lg border border-slate-200 px-2.5 text-[12px] text-slate-700 outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers(
      JSON.parse(
        JSON.stringify(workspaceUsers[currentWorkspace.id] ?? [])
      )
    );

    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
  }, [currentWorkspace.id]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchable =
        `${user.id} ${user.name} ${user.email} ${user.department} ${user.role}`.toLowerCase();

      const matchesSearch = searchable.includes(
        search.toLowerCase()
      );

      const matchesRole =
        roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const pendingUsers = users.filter(
    (user) => user.status === "Pending"
  ).length;

  const administrators = users.filter(
    (user) => user.role === "Owner"
  ).length;

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyUser);
    setShowModal(true);
  }

  function openEditModal(user: PlatformUser) {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    });

    setShowModal(true);
  }

  function saveUser() {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.department.trim()
    ) {
      alert("Please enter name, email and department.");
      return;
    }

    if (editingUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                ...form,
                name: form.name.trim(),
                email: form.email.trim(),
                department: form.department.trim(),
              }
            : user
        )
      );
    } else {
      const nextNumber =
        users.reduce((max, user) => {
          const number = Number(user.id.replace(/\D/g, ""));

          return Number.isFinite(number)
            ? Math.max(max, number)
            : max;
        }, 0) + 1;

      const newUser: PlatformUser = {
        id: `USR-${String(nextNumber).padStart(3, "0")}`,
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        lastLogin: "Never",
      };

      // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers((current) => [newUser, ...current]);
    }

    setShowModal(false);
    setEditingUser(null);
    setForm(emptyUser);
  }

  function deleteUser(id: string) {
    if (!confirm("Remove this user from the workspace?")) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers((current) =>
      current.filter((user) => user.id !== id)
    );

    if (selectedUser?.id === id) {
      setSelectedUser(null);
      setShowDetails(false);
    }
  }

  function toggleStatus(user: PlatformUser) {
    const nextStatus: UserStatus =
      user.status === "Active" ? "Inactive" : "Active";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    if (selectedUser?.id === user.id) {
      setSelectedUser({
        ...user,
        status: nextStatus,
      });
    }
  }

  return (
    <main className="ml-[250px] min-h-screen bg-[#f6f8fc]">
      <div className="px-8 py-7">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-[25px] font-semibold text-slate-900">
              Administration
            </h1>

            <p className="mt-1 text-[13px] text-slate-500">
              Manage workspace users, roles and access
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        {/* Workspace */}
        <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Current Workspace
          </p>

          <div className="mt-0.5 flex items-center justify-between">
            <p className="text-[14px] font-semibold text-slate-800">
              {currentWorkspace.name}
            </p>

            <span className="rounded-md bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700">
              Workspace Administration
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <SummaryCard
            title="Total Users"
            value={users.length}
            icon={<Users size={19} />}
          />

          <SummaryCard
            title="Active Users"
            value={activeUsers}
            icon={<CheckCircle2 size={19} />}
          />

          <SummaryCard
            title="Pending Users"
            value={pendingUsers}
            icon={<ClockIcon />}
          />

          <SummaryCard
            title="Administrators"
            value={administrators}
            icon={<Shield size={19} />}
          />
        </div>

        {/* User Register */}
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
                placeholder="Search users..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>

            <Filter
              size={15}
              className="text-slate-400"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
              <option value="Auditor">Auditor</option>
              <option value="Reviewer">Reviewer</option>
              <option value="Viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500">
                    User
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Role
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Department
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">
                    Last Login
                  </th>

                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[12px] font-semibold text-blue-600">
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>

                        <div>
                          <p className="text-[12px] font-semibold text-slate-800">
                            {user.name}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {user.email}
                          </p>

                          <p className="mt-0.5 text-[9px] text-slate-300">
                            {user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${roleClasses[user.role]}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[11px] text-slate-600">
                      {user.department}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClasses[user.status]}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[11px] text-slate-500">
                      {user.lastLogin}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          title="View"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetails(true);
                          }}
                          className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          title="Edit"
                          onClick={() =>
                            openEditModal(user)
                          }
                          className="rounded-md p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          title={
                            user.status === "Active"
                              ? "Deactivate"
                              : "Activate"
                          }
                          onClick={() =>
                            toggleStatus(user)
                          }
                          className="rounded-md p-2 text-slate-400 hover:bg-green-50 hover:text-green-600"
                        >
                          <UserCog size={15} />
                        </button>

                        <button
                          title="Delete"
                          onClick={() =>
                            deleteUser(user.id)
                          }
                          className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center"
                    >
                      <Users
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />

                      <p className="text-[13px] font-medium text-slate-500">
                        No users found
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

          <div className="border-t border-slate-200 px-5 py-3">
            <p className="text-[11px] text-slate-400">
              Showing {filteredUsers.length} of{" "}
              {users.length} users
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-slate-900">
                  {editingUser ? "Edit User" : "Add User"}
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Manage workspace access
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
              <FormField label="Full Name">
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="John Smith"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="john@company.com"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Role">
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as Role,
                    })
                  }
                  className={inputClass}
                >
                  <option>Owner</option>
                  <option>Admin</option>
                  <option>Auditor</option>
                  <option>Reviewer</option>
                  <option>Viewer</option>
                </select>
              </FormField>

              <FormField label="Department">
                <input
                  value={form.department}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      department: e.target.value,
                    })
                  }
                  placeholder="Internal Audit"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as UserStatus,
                    })
                  }
                  className={inputClass}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
              </FormField>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-blue-700">
                  Role Access
                </p>

                <p className="mt-1 text-[9px] leading-4 text-blue-600">
                  {roleDescriptions[form.role]}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={saveUser}
                className="rounded-lg bg-blue-600 px-5 py-2 text-[12px] font-medium text-white hover:bg-blue-700"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[12px] font-semibold text-blue-600">
                  {selectedUser.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <p className="text-[10px] text-blue-600">
                    {selectedUser.id}
                  </p>

                  <h2 className="text-[16px] font-semibold text-slate-900">
                    {selectedUser.name}
                  </h2>
                </div>
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
                  Email
                </p>

                <p className="text-[12px] text-slate-700">
                  {selectedUser.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <DetailItem
                  label="Role"
                  value={selectedUser.role}
                />

                <DetailItem
                  label="Department"
                  value={selectedUser.department}
                />

                <DetailItem
                  label="Status"
                  value={selectedUser.status}
                />

                <DetailItem
                  label="Last Login"
                  value={selectedUser.lastLogin}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Role Permissions
                </p>

                <p className="mt-2 text-[11px] leading-5 text-slate-600">
                  {roleDescriptions[selectedUser.role]}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowDetails(false);
                  openEditModal(selectedUser);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50"
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                onClick={() => toggleStatus(selectedUser)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700"
              >
                <UserCog size={14} />
                {selectedUser.status === "Active"
                  ? "Deactivate"
                  : "Activate"}
              </button>
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
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
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

function ClockIcon() {
  return (
    <div className="text-blue-600">
      <Clock3 size={19} />
    </div>
  );
}