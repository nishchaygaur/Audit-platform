"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAudits } from "@/context/AuditContext";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  TriangleAlert,
  UsersRound,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";

import Header from "@/components/layout/Header";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/lib/rbac";
import { getStoredEvidence, saveStoredEvidence, EvidenceItem } from "@/lib/grcData";

/* ============================================================
   FRAMEWORK CONTROLS CATALOG
============================================================ */

type FrameworkControl = {
  id: string;
  title: string;
  category: string;
  description: string;
};

const FRAMEWORK_CONTROLS: Record<string, FrameworkControl[]> = {
  "ISO 27001": [
    { id: "A.5.1", title: "Policies for information security", category: "Organizational Controls", description: "Information security policies defined, approved, published and reviewed." },
    { id: "A.5.2", title: "Information security roles and responsibilities", category: "Organizational Controls", description: "Security responsibilities defined and allocated according to business needs." },
    { id: "A.5.15", title: "Access control", category: "Organizational Controls", description: "Rules for access to information and other associated assets defined and applied." },
    { id: "A.5.23", title: "Information security for cloud services", category: "Organizational Controls", description: "Processes for acquisition, use, management, and exit of cloud services." },
    { id: "A.6.3", title: "Information security awareness and training", category: "People Controls", description: "Appropriate awareness education and regular updates for all staff." },
    { id: "A.8.2", title: "Privileged access rights", category: "Technological Controls", description: "Allocation and use of privileged access rights restricted and monitored." },
    { id: "A.8.7", title: "Protection against malware", category: "Technological Controls", description: "Protection against malware implemented and supported by user awareness." },
    { id: "A.8.15", title: "Logging and monitoring", category: "Technological Controls", description: "Logs recording user activities, exceptions, and faults produced and kept." },
    { id: "A.8.20", title: "Network security", category: "Technological Controls", description: "Networks and network services secured, monitored, and controlled." },
    { id: "A.8.28", title: "Secure coding", category: "Technological Controls", description: "Principles for secure coding applied to software development." },
  ],
  "NIST CSF": [
    { id: "GV.OC-01", title: "Organizational Context", category: "Govern", description: "Organizational mission and objectives inform cybersecurity risk management." },
    { id: "ID.AM-01", title: "Inventories of Hardware", category: "Identify", description: "Physical devices and systems within the organization are inventoried." },
    { id: "PR.AA-01", title: "Identity & Credentials", category: "Protect", description: "Identities and credentials are authenticated and access managed." },
    { id: "PR.AT-01", title: "Awareness & Training", category: "Protect", description: "Personnel are informed and trained to perform cybersecurity duties." },
    { id: "PR.DS-01", title: "Data-at-Rest Protection", category: "Protect", description: "Data at rest is protected using cryptographic mechanisms." },
    { id: "DE.CM-01", title: "Network Monitoring", category: "Detect", description: "The network is monitored to identify potential cybersecurity events." },
    { id: "DE.CM-08", title: "Vulnerability Management", category: "Detect", description: "Vulnerability scans are performed and deficiencies prioritized." },
    { id: "RS.MA-01", title: "Incident Response Execution", category: "Respond", description: "Response plan is executed during or after an incident." },
    { id: "RC.RP-01", title: "Recovery Plan Execution", category: "Recover", description: "Recovery processes and procedures are executed to restore systems." },
  ],
  "SOC 2": [
    { id: "CC5.1", title: "Control Environment & Integrity", category: "Common Criteria", description: "Demonstrates commitment to integrity and ethical values." },
    { id: "CC6.1", title: "Logical and Physical Access Security", category: "Common Criteria", description: "Logical access to assets is restricted to authorized personnel." },
    { id: "CC6.3", title: "Role Lifecycle & Access Revocation", category: "Common Criteria", description: "Role changes and access terminations are handled in a timely manner." },
    { id: "CC7.1", title: "Vulnerability & Threat Detection", category: "Common Criteria", description: "Monitors infrastructure to identify unauthorized changes or events." },
    { id: "CC7.3", title: "Incident Response Procedures", category: "Common Criteria", description: "Incidents are detected, escalated, analyzed, and mitigated." },
    { id: "CC8.1", title: "Change Management & Authorization", category: "Common Criteria", description: "Authorizes, tests, and documents changes to infrastructure." },
    { id: "A1.2", title: "Availability & Capacity Monitoring", category: "Availability", description: "Capacity planning and availability monitoring for continuous operations." },
  ],
  "NIST 800-53": [
    { id: "AC-2", title: "Account Management", category: "Access Control", description: "Manages information system accounts including creation, review, and termination." },
    { id: "AC-3", title: "Access Enforcement", category: "Access Control", description: "Enforces approved authorizations for logical access." },
    { id: "AT-2", title: "Security Awareness Training", category: "Awareness & Training", description: "Basic security awareness training for all users." },
    { id: "AU-2", title: "Event Logging", category: "Audit & Accountability", description: "Identifies which event types the system is capable of logging." },
    { id: "IA-2", title: "Identification & Authentication", category: "Identification", description: "Uniquely identifies and authenticates organizational users." },
    { id: "SI-4", title: "Information System Monitoring", category: "System Integrity", description: "Monitors systems to detect attacks and indicators of compromise." },
  ],
  "NIST RMF": [
    { id: "RMF-1", title: "Categorize Information System", category: "Categorize", description: "Categorize the system and information processed based on impact." },
    { id: "RMF-2", title: "Select Security Controls", category: "Select", description: "Select an initial set of baseline controls and tailor them." },
    { id: "RMF-3", title: "Implement Security Controls", category: "Implement", description: "Implement the security controls and describe how they are employed." },
    { id: "RMF-4", title: "Assess Security Controls", category: "Assess", description: "Assess security controls using appropriate assessment procedures." },
    { id: "RMF-5", title: "Authorize System", category: "Authorize", description: "Authorize system operation based on risk determination." },
    { id: "RMF-6", title: "Monitor Security Controls", category: "Monitor", description: "Continuously monitor controls and security posture." },
  ],
};

/* ============================================================
   AUDIT DATA
============================================================ */

// type Audit = {
//   id: string;
//   name: string;
//   framework: string;
//   lead: string;
//   status: string;
//   progress: number;
//   startDate: string;
//   dueDate: string;
//   objective: string;
//   scope: string;
//   controls: number;
//   evidence: number;
//   findings: number;
//   risks: number;
//   workspace: string;
// };

// const initialAudits: Audit[] = [
//   {
//     id: "AUD-2024-001",
//     name: "ISO 27001 Internal Audit",
//     framework: "ISO 27001",
//     lead: "Alice Smith",
//     status: "In Progress",
//     progress: 68,
//     startDate: "01 May 2024",
//     dueDate: "12 Jun 2024",
//     objective:
//       "Assess the organization's Information Security Management System against ISO 27001 requirements and identify areas requiring improvement.",
//     scope:
//       "Information security management system, access control, asset management, supplier relationships, incident management and business continuity.",
//     controls: 114,
//     evidence: 86,
//     findings: 7,
//     risks: 3,
//     workspace: "ABC Technologies",
//   },
//   {
//     id: "AUD-2024-002",
//     name: "NIST CSF Assessment",
//     framework: "NIST CSF",
//     lead: "John Carter",
//     status: "In Review",
//     progress: 86,
//     startDate: "06 May 2024",
//     dueDate: "15 Jun 2024",
//     objective:
//       "Evaluate the organization's cybersecurity posture against the NIST Cybersecurity Framework.",
//     scope:
//       "Identify, Protect, Detect, Respond and Recover functions across the organization's information systems.",
//     controls: 108,
//     evidence: 94,
//     findings: 4,
//     risks: 2,
//     workspace: "ABC Technologies",
//   },
//   {
//     id: "AUD-2024-003",
//     name: "Vendor Risk Assessment",
//     framework: "ISO 27001",
//     lead: "Emily Davis",
//     status: "Not Started",
//     progress: 0,
//     startDate: "20 May 2024",
//     dueDate: "20 Jun 2024",
//     objective:
//       "Assess information-security risks associated with critical third-party suppliers.",
//     scope:
//       "Supplier security controls, contracts, data protection, access management and supplier monitoring.",
//     controls: 42,
//     evidence: 0,
//     findings: 0,
//     risks: 4,
//     workspace: "ABC Technologies",
//   },
//   {
//     id: "AUD-2024-004",
//     name: "Access Control Review",
//     framework: "NIST 800-53",
//     lead: "Michael Lee",
//     status: "Completed",
//     progress: 100,
//     startDate: "01 May 2024",
//     dueDate: "05 Jun 2024",
//     objective:
//       "Review logical and physical access controls and verify implementation against applicable security requirements.",
//     scope:
//       "Identity management, authentication, authorization, privileged access and account lifecycle management.",
//     controls: 58,
//     evidence: 58,
//     findings: 6,
//     risks: 1,
//     workspace: "ABC Technologies",
//   },
//   {
//     id: "AUD-2024-005",
//     name: "Risk Management Assessment",
//     framework: "NIST RMF",
//     lead: "Alice Smith",
//     status: "In Progress",
//     progress: 42,
//     startDate: "15 May 2024",
//     dueDate: "25 Jun 2024",
//     objective:
//       "Evaluate the organization's risk management process using the NIST Risk Management Framework.",
//     scope:
//       "Categorize, select, implement, assess, authorize and continuously monitor information systems.",
//     controls: 76,
//     evidence: 31,
//     findings: 3,
//     risks: 5,
//     workspace: "ABC Technologies",
//   },
//   {
//     id: "AUD-2024-011",
//     name: "Financial Security Controls Review",
//     framework: "SOC 2",
//     lead: "Sarah Brown",
//     status: "In Progress",
//     progress: 57,
//     startDate: "03 May 2024",
//     dueDate: "28 Jun 2024",
//     objective:
//       "Assess security and availability controls supporting financial systems and services.",
//     scope:
//       "Financial applications, identity controls, change management, monitoring and service operations.",
//     controls: 91,
//     evidence: 47,
//     findings: 5,
//     risks: 3,
//     workspace: "XYZ Finance",
//   },
//   {
//     id: "AUD-2024-012",
//     name: "Incident Response Assessment",
//     framework: "NIST CSF",
//     lead: "David Wilson",
//     status: "In Review",
//     progress: 74,
//     startDate: "08 May 2024",
//     dueDate: "30 Jun 2024",
//     objective:
//       "Evaluate incident response capabilities and supporting cybersecurity processes.",
//     scope:
//       "Incident detection, response procedures, communications, recovery and lessons learned.",
//     controls: 63,
//     evidence: 51,
//     findings: 4,
//     risks: 2,
//     workspace: "XYZ Finance",
//   },
//   {
//     id: "AUD-2024-021",
//     name: "Healthcare Information Security Audit",
//     framework: "ISO 27001",
//     lead: "Michael Lee",
//     status: "In Progress",
//     progress: 49,
//     startDate: "04 May 2024",
//     dueDate: "30 Jun 2024",
//     objective:
//       "Assess information security controls supporting healthcare information systems.",
//     scope:
//       "Clinical applications, patient information systems, identity management, logging and suppliers.",
//     controls: 127,
//     evidence: 59,
//     findings: 8,
//     risks: 5,
//     workspace: "PQR Healthcare",
//   },
// ];

/* ============================================================
   HELPERS
============================================================ */

function getStatusClass(status: string) {
  switch (status) {
    case "Completed":
      return "bgmerald-50 textmerald-700";

    case "In Review":
      return "bg-blue-50 text-blue-700";

    case "Not Started":
      return "bg-slate-100 text-slate-600";

    case "In Progress":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* ============================================================
   PAGE
============================================================ */

export default function AuditsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const workspace = useWorkspace();
  const { audits, addAudit } = useAudits();
  const workspaceValue =
    typeof workspace === "object" &&
    workspace !== null &&
    "currentWorkspace" in workspace
      ? workspace.currentWorkspace
      : null;

  const workspaceName =
    typeof workspaceValue === "string"
      ? workspaceValue
      : typeof workspaceValue === "object" &&
          workspaceValue !== null &&
          "name" in workspaceValue
        ? String(workspaceValue.name)
        : "ABC Technologies";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [frameworkFilter, setFrameworkFilter] = useState("All Frameworks");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);

  const [newAudit, setNewAudit] = useState({
    name: "",
    framework: "ISO 27001",
    lead: "Alice Smith",
    startDate: "",
    dueDate: "",
    objective: "",
    scope: "",
  });

  const [inScopeDomains, setInScopeDomains] = useState<string[]>([
    "Cloud Infrastructure",
    "Identity & Access Management",
    "Production Systems",
  ]);

  const [selectedControlIds, setSelectedControlIds] = useState<string[]>(() => {
    return (FRAMEWORK_CONTROLS["ISO 27001"] || []).map((c) => c.id);
  });

  const handleFrameworkChange = (fw: string) => {
    setNewAudit((prev) => ({ ...prev, framework: fw }));
    const controls = FRAMEWORK_CONTROLS[fw] || [];
    setSelectedControlIds(controls.map((c) => c.id));
  };

  const toggleControl = (id: string) => {
    setSelectedControlIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAllControls = () => {
    const controls = FRAMEWORK_CONTROLS[newAudit.framework] || [];
    setSelectedControlIds(controls.map((c) => c.id));
  };

  const deselectAllControls = () => {
    setSelectedControlIds([]);
  };

  const toggleDomain = (domain: string) => {
    setInScopeDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const workspaceAudits = useMemo(() => {
    return audits.filter((audit) => audit.workspace === workspaceName);
  }, [audits, workspaceName]);

  const filteredAudits = useMemo(() => {
    const query = search.toLowerCase().trim();

    return workspaceAudits.filter((audit) => {
      const matchesSearch =
        !query ||
        audit.name.toLowerCase().includes(query) ||
        audit.id.toLowerCase().includes(query) ||
        audit.framework.toLowerCase().includes(query) ||
        audit.lead.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        audit.status === statusFilter;

      const matchesFramework =
        frameworkFilter === "All Frameworks" ||
        audit.framework === frameworkFilter;

      return matchesSearch && matchesStatus && matchesFramework;
    });
  }, [
    workspaceAudits,
    search,
    statusFilter,
    frameworkFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: workspaceAudits.length,
      inProgress: workspaceAudits.filter(
        (audit) => audit.status === "In Progress",
      ).length,
      review: workspaceAudits.filter(
        (audit) => audit.status === "In Review",
      ).length,
      completed: workspaceAudits.filter(
        (audit) => audit.status === "Completed",
      ).length,
    };
  }, [workspaceAudits]);

  function handleOpenCreateModal() {
    setNewAudit({
      name: "",
      framework: "ISO 27001",
      lead: "Alice Smith",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      objective: "Assess and verify information security controls against standard requirements to identify gaps.",
      scope: "Core cloud infrastructure, IAM systems, network perimeters, and critical customer data repositories.",
    });
    setSelectedControlIds((FRAMEWORK_CONTROLS["ISO 27001"] || []).map((c) => c.id));
    setInScopeDomains(["Cloud Infrastructure", "Identity & Access Management", "Production Systems"]);
    setCreateStep(1);
    setShowCreateModal(true);
  }

  async function createAudit() {
    if (!newAudit.name.trim()) {
      return;
    }

    const controlsList = FRAMEWORK_CONTROLS[newAudit.framework] || [];
    const chosenControls = controlsList.filter((c) => selectedControlIds.includes(c.id));
    const totalControls = chosenControls.length > 0 ? chosenControls.length : controlsList.length;

    // Build enriched scope string
    const scopeString = `${newAudit.scope.trim()}${
      inScopeDomains.length > 0 ? ` | In-scope domains: ${inScopeDomains.join(", ")}` : ""
    }`;

    // Add to AuditContext
    const created = await addAudit({
      name: newAudit.name.trim(),
      framework: newAudit.framework,
      lead: newAudit.lead,
      status: "Planned",
      progress: 0,
      startDate: newAudit.startDate || new Date().toISOString().split("T")[0],
      dueDate: newAudit.dueDate || "30 days from now",
      objective: newAudit.objective.trim() || "Audit objective defined during intake.",
      scope: scopeString,
      controls: totalControls,
      evidence: chosenControls.length > 0 ? chosenControls.length : 3,
      findings: 0,
      risks: 0,
      workspace: workspaceName,
    });

    // Seed initial evidence placeholders into localStorage
    if (!created) return;

    const allEvidence = getStoredEvidence();
    const seededEvidence: EvidenceItem[] = chosenControls.map((c, index) => ({
      id: `EVD-${created.id.replace("AUD-", "")}-${String(index + 1).padStart(3, "0")}`,
      workspaceId: workspaceName.toLowerCase().replace(/\s+/g, "-"),
      auditId: created.id,
      name: `${c.id} - ${c.title} Evidence Package`,
      type: "PDF",
      size: "1.2 MB",
      control: c.id,
      framework: newAudit.framework,
      owner: newAudit.lead,
      status: "Pending Review",
      uploaded: "Just now",
      reviewedBy: "—",
      description: `Formal evidence artifact verifying implementation of control ${c.id} (${c.title}).`,
    }));

    if (seededEvidence.length > 0) {
      saveStoredEvidence([...allEvidence, ...seededEvidence]);
    }

    setShowCreateModal(false);

    // Redirect to the newly created audit detail page
    router.push(`/audits/${created.id}`);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#111827]">

      <main className="ml-[250px] min-h-screen">

        <Header />

        <section className="px-8 py-7">

          {/* ==================================================
              PAGE HEADER
          ================================================== */}

          <div className="flex items-start justify-between">

            <div>
              <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-slate-900">
                Audits
              </h1>

              <p className="mt-1 text-[12px] text-slate-500">
                Plan, execute, and manage audits for {workspaceName}.
              </p>
            </div>

            {hasPermission(workspace.currentWorkspace?.role || user?.role, "audits.create") && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-[12px] font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Audit
            </button>
          )}

          </div>

          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <div className="mt-6 grid grid-cols-4 gap-4">

            <SummaryCard
              label="Total Audits"
              value={stats.total}
              icon={
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
              }
            />

            <SummaryCard
              label="In Progress"
              value={stats.inProgress}
              icon={
                <Clock3 className="h-4 w-4 text-amber-600" />
              }
            />

            <SummaryCard
              label="In Review"
              value={stats.review}
              icon={
                <FileText className="h-4 w-4 text-violet-600" />
              }
            />

            <SummaryCard
              label="Completed"
              value={stats.completed}
              icon={
                <CheckCircle2 className="h-4 w-4 textmerald-600" />
              }
            />

          </div>

          {/* ==================================================
              FILTER BAR
          ================================================== */}

          <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">

              <div className="relative">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search audits..."
                  className="h-9 w-[300px] rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />

              </div>

              <div className="flex items-center gap-2">

                <FilterButton
                  value={statusFilter}
                  options={[
                    "All Statuses",
                    "In Progress",
                    "In Review",
                    "Not Started",
                    "Completed",
                  ]}
                  onChange={setStatusFilter}
                />

                <FilterButton
                  value={frameworkFilter}
                  options={[
                    "All Frameworks",
                    "ISO 27001",
                    "NIST CSF",
                    "NIST 800-53",
                    "NIST RMF",
                    "SOC 2",
                  ]}
                  onChange={setFrameworkFilter}
                />

              </div>

            </div>

            {/* ==================================================
                AUDIT TABLE
            ================================================== */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px] border-collapse">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left">

                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Audit
                    </th>

                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Framework
                    </th>

                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Lead
                    </th>

                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Progress
                    </th>

                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Due Date
                    </th>

                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Findings
                    </th>

                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Risks
                    </th>

                    <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="w-10 px-3 py-3" />

                  </tr>

                </thead>

                <tbody>

                  {filteredAudits.map((audit) => (

                    <tr
                      key={audit.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >

                      {/* Audit */}

                      <td className="px-5 py-4">

                        <Link
                          href={`/audits/${audit.id}`}
                          className="group flex items-start gap-3"
                        >

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
                            <ClipboardCheck className="h-4 w-4 text-blue-600" />
                          </div>

                          <div className="min-w-0">

                            <p className="text-[12px] font-medium text-slate-800 group-hover:text-blue-600">
                              {audit.name}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              {audit.id}
                            </p>

                          </div>

                        </Link>

                      </td>

                      {/* Framework */}

                      <td className="px-3 py-4">

                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                          {audit.framework}
                        </span>

                      </td>

                      {/* Lead */}

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-2">

                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                            <UsersRound className="h-3.5 w-3.5 text-slate-500" />
                          </div>

                          <span className="text-[11px] text-slate-600">
                            {audit.lead}
                          </span>

                        </div>

                      </td>

                      {/* Progress */}

                      <td className="px-3 py-4">

                        <div className="w-[130px]">

                          <div className="flex items-center justify-between">

                            <span className="text-[10px] font-medium text-slate-600">
                              {audit.progress}%
                            </span>

                          </div>

                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{
                                width: `${audit.progress}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>

                      {/* Due */}

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-1.5">

                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                          <span className="text-[11px] text-slate-600">
                            {audit.dueDate}
                          </span>

                        </div>

                      </td>

                      {/* Findings */}

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-1.5">

                          <TriangleAlert
                            className={`h-3.5 w-3.5 ${
                              audit.findings > 0
                                ? "text-orange-500"
                                : "text-slate-300"
                            }`}
                          />

                          <span className="text-[11px] font-medium text-slate-700">
                            {audit.findings}
                          </span>

                        </div>

                      </td>

                      {/* Risks */}

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-1.5">

                          <ShieldAlert
                            className={`h-3.5 w-3.5 ${
                              audit.risks > 0
                                ? "text-red-500"
                                : "text-slate-300"
                            }`}
                          />

                          <span className="text-[11px] font-medium text-slate-700">
                            {audit.risks}
                          </span>

                        </div>

                      </td>

                      {/* Status */}

                      <td className="px-3 py-4">

                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                            audit.status,
                          )}`}
                        >
                          {audit.status}
                        </span>

                      </td>

                      {/* Actions */}

                      <td className="px-3 py-4">

                        <button
                          type="button"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* ==================================================
                EMPTY STATE
            ================================================== */}

            {filteredAudits.length === 0 && (

              <div className="px-5 py-14 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>

                <p className="mt-3 text-[13px] font-medium text-slate-700">
                  No audits found
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  Try changing your search or filters.
                </p>

              </div>

            )}

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">

              <span className="text-[10px] text-slate-400">
                Showing {filteredAudits.length} of{" "}
                {workspaceAudits.length} audits
              </span>

              <span className="text-[10px] text-slate-400">
                Workspace: {workspaceName}
              </span>

            </div>

          </section>

        </section>

      </main>

      {/* ======================================================
          CREATE AUDIT MODAL
      ====================================================== */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            {/* Wizard Header & Stepper */}
            <div className="border-b border-slate-100 px-6 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      {createStep}
                    </span>
                    <h2 className="text-[16px] font-semibold text-slate-900">
                      {createStep === 1 && "Create Audit — Step 1: Basic Information"}
                      {createStep === 2 && "Create Audit — Step 2: Scope & Objectives"}
                      {createStep === 3 && "Create Audit — Step 3: Select Applicable Controls"}
                      {createStep === 4 && "Create Audit — Step 4: Review & Launch"}
                    </h2>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {createStep === 1 && `Configure core parameters and governance framework for ${workspaceName}.`}
                    {createStep === 2 && "Define audit charter, strategic objectives, and systems in scope."}
                    {createStep === 3 && `Select baseline controls from ${newAudit.framework} to test during this assessment.`}
                    {createStep === 4 && "Review configuration and launch the audit with automated evidence baseline."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Steps bar */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { step: 1, label: "1. Basics" },
                  { step: 2, label: "2. Scope" },
                  { step: 3, label: "3. Controls" },
                  { step: 4, label: "4. Review" },
                ].map((item) => {
                  const isCurrent = createStep === item.step;
                  const isCompleted = createStep > item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => {
                        // Allow clicking back to earlier steps or to next step if name is valid
                        if (item.step < createStep || newAudit.name.trim()) {
                          setCreateStep(item.step as 1 | 2 | 3 | 4);
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                        isCurrent
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : isCompleted
                          ? "bgmerald-50 textmerald-700 border bordermerald-100"
                          : "bg-slate-50 text-slate-400 border border-slate-100"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3 textmerald-600" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-current text-[8px] flex items-center justify-center">
                          {item.step}
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* STEP 1: BASIC INFORMATION */}
              {createStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Audit Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={newAudit.name}
                      onChange={(e) => setNewAudit({ ...newAudit, name: e.target.value })}
                      placeholder="e.g. Q3 ISO 27001 Surveillance Audit"
                      className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Governance Framework
                      </label>
                      <div className="relative mt-1.5">
                        <select
                          value={newAudit.framework}
                          onChange={(e) => handleFrameworkChange(e.target.value)}
                          className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-[12px] outline-none focus:border-blue-400"
                        >
                          <option value="ISO 27001">ISO 27001:2022</option>
                          <option value="NIST CSF">NIST Cybersecurity Framework (CSF)</option>
                          <option value="SOC 2">SOC 2 Type II</option>
                          <option value="NIST 800-53">NIST SP 800-53 Rev. 5</option>
                          <option value="NIST RMF">NIST Risk Management Framework</option>
                        </select>
                        <ChevronDown className="pointervents-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>

                    <FormSelect
                      label="Audit Lead"
                      value={newAudit.lead}
                      options={[
                        "Alice Smith",
                        "John Carter",
                        "Emily Davis",
                        "Michael Lee",
                        "Sarah Brown",
                        "David Wilson",
                      ]}
                      onChange={(value) => setNewAudit({ ...newAudit, lead: value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Audit Start Date"
                      type="date"
                      value={newAudit.startDate}
                      onChange={(value) => setNewAudit({ ...newAudit, startDate: value })}
                    />

                    <FormInput
                      label="Target Completion Date"
                      type="date"
                      value={newAudit.dueDate}
                      onChange={(value) => setNewAudit({ ...newAudit, dueDate: value })}
                    />
                  </div>

                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-[11px] text-blue-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Governance Alignment
                    </div>
                    <p className="mt-1 text-slate-600">
                      Selecting <strong>{newAudit.framework}</strong> will preload standard baseline controls in Step 3, which you can selectively tailor to your organizational boundaries.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: SCOPE & OBJECTIVES */}
              {createStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Audit Objective
                    </label>
                    <textarea
                      value={newAudit.objective}
                      onChange={(e) => setNewAudit({ ...newAudit, objective: e.target.value })}
                      rows={3}
                      placeholder="Assess information security posture and compliance with policies..."
                      className="mt-1.5 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Boundary & Scope Narrative
                    </label>
                    <textarea
                      value={newAudit.scope}
                      onChange={(e) => setNewAudit({ ...newAudit, scope: e.target.value })}
                      rows={3}
                      placeholder="Specify organizational boundaries, physical facilities, and logical systems..."
                      className="mt-1.5 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      In-Scope Technology & Operational Domains
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        "Cloud Infrastructure",
                        "Identity & Access Management",
                        "Production Systems",
                        "Corporate Network",
                        "Customer Data Repositories",
                        "CI/CD & DevOps",
                        "Third-Party SaaS",
                        "Physical Security",
                      ].map((domain) => {
                        const active = inScopeDomains.includes(domain);
                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => toggleDomain(domain)}
                            className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                              active
                                ? "bg-blue-600 text-white shadow-xs"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {active ? "✓ " : "+ "}
                            {domain}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTROL SELECTION */}
              {createStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-[13px] font-semibold text-slate-900">
                        {newAudit.framework} Baseline Controls
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {selectedControlIds.length} of {(FRAMEWORK_CONTROLS[newAudit.framework] || []).length} controls selected for evaluation
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllControls}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllControls}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {(FRAMEWORK_CONTROLS[newAudit.framework] || []).map((ctrl) => {
                      const checked = selectedControlIds.includes(ctrl.id);
                      return (
                        <div
                          key={ctrl.id}
                          onClick={() => toggleControl(ctrl.id)}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                            checked
                              ? "border-blue-300 bg-blue-50/40"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                                {ctrl.id}
                              </span>
                              <span className="text-[12px] font-medium text-slate-900 truncate">
                                {ctrl.title}
                              </span>
                              <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                {ctrl.category}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                              {ctrl.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & LAUNCH */}
              {createStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-800">
                          {newAudit.framework}
                        </span>
                        <h3 className="mt-1 text-[15px] font-semibold text-slate-900">
                          {newAudit.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Assigned Lead: <strong className="text-slate-700">{newAudit.lead}</strong> | Workspace: {workspaceName}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Status: Planned
                        </span>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {newAudit.startDate} → {newAudit.dueDate}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200/60 pt-3 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-600">Strategic Objective:</span>
                        <p className="text-slate-500 line-clamp-2">{newAudit.objective || "Standard security evaluation."}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">Operational Scope:</span>
                        <p className="text-slate-500 line-clamp-2">{newAudit.scope || "Default enterprise boundaries."}</p>
                      </div>
                    </div>

                    {inScopeDomains.length > 0 && (
                      <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">In-Scope Domains</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {inScopeDomains.map((d) => (
                            <span key={d} className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls & Evidence seeding summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-600" />
                        <span className="text-[12px] font-semibold text-slate-800">
                          {selectedControlIds.length} Controls In Scope
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Controls will be mapped into the audit&apos;s active checklist for testing, evidence collection, and scoring.
                      </p>
                    </div>

                    <div className="rounded-lg border bordermerald-200 bgmerald-50/40 p-3.5">
                      <div className="flex items-center gap-2 textmerald-800">
                        <Sparkles className="h-4 w-4 textmerald-600" />
                        <span className="text-[12px] font-semibold">
                          Automated Evidence Seeding
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] textmerald-900/80">
                        {selectedControlIds.length} initial evidence placeholders will be auto-generated in &apos;Pending Review&apos; status ready for auditor inspection.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Stepper Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              {createStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCreateStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}

              <div className="flex items-center gap-2">
                {createStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAudit.name.trim()) return;
                      setCreateStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
                    }}
                    disabled={!newAudit.name.trim() || (createStep === 3 && selectedControlIds.length === 0)}
                    className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-[11px] font-medium text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next Step
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={createAudit}
                    disabled={!newAudit.name.trim()}
                    className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Create & Launch Audit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

      <div className="flex items-center justify-between">

        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50">
          {icon}
        </div>

        <span className="text-[20px] font-semibold text-slate-900">
          {value}
        </span>

      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        {label}
      </p>

    </div>
  );
}

/* ============================================================
   FILTER BUTTON
============================================================ */

function FilterButton({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 appearance-none rounded-md border border-slate-200 bg-white py-0 pl-3 pr-8 text-[11px] font-medium text-slate-600 outline-none hover:bg-slate-50 focus:border-blue-400"
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

/* ============================================================
   FORM INPUT
============================================================ */

function FormInput({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-9 w-full rounded-md border border-slate-200 px-3 text-[12px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      />

    </div>
  );
}

/* ============================================================
   FORM SELECT
============================================================ */

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>

      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="relative">

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1.5 h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-[12px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointervents-none absolute right-2.5 top-[19px] h-3.5 w-3.5 text-slate-400" />

      </div>

    </div>
  );
}
export const dynamic = 'force-dynamic';
