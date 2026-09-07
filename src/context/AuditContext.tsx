"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuditStatus =
  | "Planned"
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Completed"
  | "On Hold";

export type Audit = {
  id: string;
  name: string;
  framework: string;
  lead: string;
  status: AuditStatus;
  progress: number;
  startDate: string;
  dueDate: string;
  objective: string;
  scope: string;
  controls: number;
  evidence: number;
  findings: number;
  risks: number;
  workspace: string;
};

type NewAudit = Omit<Audit, "id">;

type AuditContextType = {
  audits: Audit[];
  getAudit: (auditId: string) => Audit | undefined;
  addAudit: (audit: NewAudit) => Audit;
  updateAudit: (
    auditId: string,
    updates: Partial<Audit>
  ) => void;
  deleteAudit: (auditId: string) => void;
};

const AuditContext = createContext<
  AuditContextType | undefined
>(undefined);

const STORAGE_KEY = "audit-platform-audits";

const INITIAL_AUDITS: Audit[] = [
  {
    id: "AUD-2024-001",
    name: "ISO 27001 Internal Audit",
    framework: "ISO 27001",
    lead: "Alice Smith",
    status: "In Progress",
    progress: 68,
    startDate: "01 May 2024",
    dueDate: "12 Jun 2024",
    objective:
      "Assess the organization's Information Security Management System against ISO 27001 requirements and identify areas requiring improvement.",
    scope:
      "Information security management system, access control, asset management, supplier relationships, incident management and business continuity.",
    controls: 114,
    evidence: 86,
    findings: 7,
    risks: 3,
    workspace: "ABC Technologies",
  },
  {
    id: "AUD-2024-002",
    name: "NIST CSF Assessment",
    framework: "NIST CSF",
    lead: "John Carter",
    status: "In Review",
    progress: 86,
    startDate: "06 May 2024",
    dueDate: "15 Jun 2024",
    objective:
      "Evaluate the organization's cybersecurity posture against the NIST Cybersecurity Framework.",
    scope:
      "Identify, Protect, Detect, Respond and Recover functions across the organization's information systems.",
    controls: 108,
    evidence: 94,
    findings: 4,
    risks: 2,
    workspace: "ABC Technologies",
  },
  {
    id: "AUD-2024-003",
    name: "Vendor Risk Assessment",
    framework: "ISO 27001",
    lead: "Emily Davis",
    status: "Not Started",
    progress: 0,
    startDate: "20 May 2024",
    dueDate: "20 Jun 2024",
    objective:
      "Assess information-security risks associated with critical third-party suppliers.",
    scope:
      "Supplier security controls, contracts, data protection, access management and supplier monitoring.",
    controls: 42,
    evidence: 0,
    findings: 0,
    risks: 4,
    workspace: "ABC Technologies",
  },
  {
    id: "AUD-2024-004",
    name: "Access Control Review",
    framework: "NIST 800-53",
    lead: "Michael Lee",
    status: "Completed",
    progress: 100,
    startDate: "01 May 2024",
    dueDate: "05 Jun 2024",
    objective:
      "Review logical and physical access controls and verify implementation against applicable security requirements.",
    scope:
      "Identity management, authentication, authorization, privileged access and account lifecycle management.",
    controls: 58,
    evidence: 58,
    findings: 6,
    risks: 1,
    workspace: "ABC Technologies",
  },
  {
    id: "AUD-2024-005",
    name: "Risk Management Assessment",
    framework: "NIST RMF",
    lead: "Alice Smith",
    status: "In Progress",
    progress: 42,
    startDate: "15 May 2024",
    dueDate: "25 Jun 2024",
    objective:
      "Evaluate the organization's risk management process using the NIST Risk Management Framework.",
    scope:
      "Categorize, select, implement, assess, authorize and continuously monitor information systems.",
    controls: 76,
    evidence: 31,
    findings: 3,
    risks: 5,
    workspace: "ABC Technologies",
  },
  {
    id: "AUD-2024-011",
    name: "Financial Security Controls Review",
    framework: "SOC 2",
    lead: "Sarah Brown",
    status: "In Progress",
    progress: 57,
    startDate: "03 May 2024",
    dueDate: "28 Jun 2024",
    objective:
      "Assess security and availability controls supporting financial systems and services.",
    scope:
      "Financial applications, identity controls, change management, monitoring and service operations.",
    controls: 91,
    evidence: 47,
    findings: 5,
    risks: 3,
    workspace: "XYZ Finance",
  },
  {
    id: "AUD-2024-012",
    name: "Incident Response Assessment",
    framework: "NIST CSF",
    lead: "David Wilson",
    status: "In Review",
    progress: 74,
    startDate: "08 May 2024",
    dueDate: "30 Jun 2024",
    objective:
      "Evaluate incident response capabilities and supporting cybersecurity processes.",
    scope:
      "Incident detection, response procedures, communications, recovery and lessons learned.",
    controls: 63,
    evidence: 51,
    findings: 4,
    risks: 2,
    workspace: "XYZ Finance",
  },
  {
    id: "AUD-2024-021",
    name: "Healthcare Information Security Audit",
    framework: "ISO 27001",
    lead: "Michael Lee",
    status: "In Progress",
    progress: 49,
    startDate: "04 May 2024",
    dueDate: "30 Jun 2024",
    objective:
      "Assess information security controls supporting healthcare information systems.",
    scope:
      "Clinical applications, patient information systems, identity management, logging and suppliers.",
    controls: 127,
    evidence: 59,
    findings: 8,
    risks: 5,
    workspace: "PQR Healthcare",
  },
];

export function AuditProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [audits, setAudits] = useState<Audit[]>(() => {
    if (typeof window === "undefined") return INITIAL_AUDITS;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (audit) =>
              typeof audit.name === "string" &&
              typeof audit.workspace === "string"
          )
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_AUDITS;
  });

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(audits)
    );
  }, [audits, hydrated]);

  const getAudit = useCallback(
    (auditId: string) => {
      return audits.find((audit) => audit.id === auditId);
    },
    [audits]
  );

  const addAudit = useCallback(
    (audit: NewAudit) => {
      const existingNumbers = audits
        .map((item) => {
          const match = item.id.match(/^AUD-\d+-(\d+)$/);
          return match ? Number(match[1]) : 0;
        })
        .filter(Boolean);

      const nextNumber = Math.max(0, ...existingNumbers) + 1;

      const newAudit: Audit = {
        ...audit,
        id: `AUD-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`,
      };

      setAudits((current) => [newAudit, ...current]);

      return newAudit;
    },
    [audits]
  );

  const updateAudit = useCallback(
    (auditId: string, updates: Partial<Audit>) => {
      setAudits((current) =>
        current.map((audit) =>
          audit.id === auditId
            ? {
                ...audit,
                ...updates,
              }
            : audit
        )
      );
    },
    []
  );

  const deleteAudit = useCallback(
    (auditId: string) => {
      setAudits((current) => current.filter((audit) => audit.id !== auditId));
    },
    []
  );

  const value = useMemo(
    () => ({
      audits,
      getAudit,
      addAudit,
      updateAudit,
      deleteAudit,
    }),
    [audits, getAudit, addAudit, updateAudit, deleteAudit]
  );

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudits() {
  const context = useContext(AuditContext);

  if (!context) {
    throw new Error(
      "useAudits must be used inside AuditProvider"
    );
  }

  return context;
}