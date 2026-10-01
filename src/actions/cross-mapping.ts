"use server";

import db from "@/lib/db";
import { requirePermission } from "@/lib/server-rbac";

export type OverlapLevel = "Full Equivalent" | "High Overlap" | "Partial Overlap";

export interface ControlCrossMapping {
  id: string;
  domain: string;
  sourceFramework: string;
  sourceControlId: string;
  sourceControlTitle: string;
  targetFramework: string;
  targetControlId: string;
  targetControlTitle: string;
  overlapPercentage: number;
  coverageLevel: OverlapLevel;
  mappingJustification: string;
}

export interface CrossReadinessResult {
  sourceFramework: string;
  auditId: string;
  auditName: string;
  totalSourceControls: number;
  implementedSourceControls: number;
  targets: Array<{
    framework: string;
    readinessScore: number;
    satisfiedControlsCount: number;
    totalTargetControlsCount: number;
    gapControlsCount: number;
    status: "Strong Coverage" | "Moderate Coverage" | "Action Required";
  }>;
}

export const CANONICAL_CROSS_MAPPINGS: ControlCrossMapping[] = [
  // 1. Governance & Policies
  {
    id: "MAP-001",
    domain: "Governance & Policies",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.5.1",
    sourceControlTitle: "Policies for information security",
    targetFramework: "SOC 2",
    targetControlId: "CC1.2",
    targetControlTitle: "Board independence and governance oversight of internal control",
    overlapPercentage: 90,
    coverageLevel: "High Overlap",
    mappingJustification: "Both standards mandate documented, executive-approved information security policies reviewed at planned intervals.",
  },
  {
    id: "MAP-002",
    domain: "Governance & Policies",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.5.1",
    sourceControlTitle: "Policies for information security",
    targetFramework: "NIST CSF",
    targetControlId: "GV.OC-01",
    targetControlTitle: "Organizational context and mission priorities",
    overlapPercentage: 100,
    coverageLevel: "Full Equivalent",
    mappingJustification: "Establishing organizational cybersecurity policy directly satisfies NIST CSF Governance Organizational Context category.",
  },
  {
    id: "MAP-003",
    domain: "Governance & Policies",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.5.1",
    sourceControlTitle: "Policies for information security",
    targetFramework: "NIST RMF",
    targetControlId: "RMF-1",
    targetControlTitle: "Prepare - Institutional risk management preparation",
    overlapPercentage: 85,
    coverageLevel: "High Overlap",
    mappingJustification: "RMF Step 1 organization-level preparation requires published governance rules and security program baselines.",
  },

  // 2. Identity & Access Management
  {
    id: "MAP-004",
    domain: "Access Control & IAM",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.5.15",
    sourceControlTitle: "Access control",
    targetFramework: "SOC 2",
    targetControlId: "CC6.1",
    targetControlTitle: "Logical access controls to prevent unauthorized access",
    overlapPercentage: 100,
    coverageLevel: "Full Equivalent",
    mappingJustification: "Enforces principle of least privilege, role-based access control, and formal authorization procedures.",
  },
  {
    id: "MAP-005",
    domain: "Access Control & IAM",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.8.2",
    sourceControlTitle: "Privileged access rights",
    targetFramework: "SOC 2",
    targetControlId: "CC6.2",
    targetControlTitle: "User registration, modification, and privileged credentials",
    overlapPercentage: 95,
    coverageLevel: "High Overlap",
    mappingJustification: "Privileged access restrictions and credential management directly satisfy SOC 2 administrative access control criteria.",
  },
  {
    id: "MAP-006",
    domain: "Access Control & IAM",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.8.5",
    sourceControlTitle: "Secure authentication",
    targetFramework: "NIST CSF",
    targetControlId: "PR.AA-01",
    targetControlTitle: "Identities and credentials are authenticated and managed",
    overlapPercentage: 95,
    coverageLevel: "High Overlap",
    mappingJustification: "Multi-factor authentication (MFA) and strong password policies map 1:1 between ISO 27001 A.8.5 and NIST PR.AA-01.",
  },
  {
    id: "MAP-007",
    domain: "Access Control & IAM",
    sourceFramework: "SOC 2",
    sourceControlId: "CC6.1",
    sourceControlTitle: "Logical access and perimeter controls",
    targetFramework: "NIST RMF",
    targetControlId: "RMF-4",
    targetControlTitle: "Implement - Technical access enforcement (AC-2/AC-3)",
    overlapPercentage: 90,
    coverageLevel: "High Overlap",
    mappingJustification: "SOC 2 logical boundary controls satisfy NIST SP 800-53 Account Management (AC-2) and Access Enforcement (AC-3).",
  },

  // 3. Threat Intelligence & Vulnerability Management
  {
    id: "MAP-008",
    domain: "Threat & Vulnerability Management",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.5.7",
    sourceControlTitle: "Threat intelligence",
    targetFramework: "NIST CSF",
    targetControlId: "ID.RA-01",
    targetControlTitle: "Vulnerabilities and external threat intelligence identified",
    overlapPercentage: 90,
    coverageLevel: "High Overlap",
    mappingJustification: "Collecting, analyzing, and ingesting external threat feeds fulfills NIST CSF risk identification requirements.",
  },
  {
    id: "MAP-009",
    domain: "Threat & Vulnerability Management",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.8.9",
    sourceControlTitle: "Configuration management & secure baselines",
    targetFramework: "SOC 2",
    targetControlId: "CC6.8",
    targetControlTitle: "Prevention of unauthorized configuration changes and malware",
    overlapPercentage: 85,
    coverageLevel: "High Overlap",
    mappingJustification: "Hardened system configuration baselines and patch management fulfill SOC 2 change integrity requirements.",
  },

  // 4. Cloud Services & Supplier Relations
  {
    id: "MAP-010",
    domain: "Cloud & Vendor Security",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.5.23",
    sourceControlTitle: "Information security for use of cloud services",
    targetFramework: "SOC 2",
    targetControlId: "CC6.6",
    targetControlTitle: "Boundary protection and cloud infrastructure segmentation",
    overlapPercentage: 80,
    coverageLevel: "High Overlap",
    mappingJustification: "Vendor SOC 2 collection, cloud shared responsibility matrix, and exit strategies satisfy third-party assurance requirements.",
  },

  // 5. Personnel & Awareness Training
  {
    id: "MAP-011",
    domain: "Personnel & Training",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.6.3",
    sourceControlTitle: "Information security awareness and training",
    targetFramework: "NIST CSF",
    targetControlId: "PR.AT-01",
    targetControlTitle: "Personnel receive mandatory cybersecurity training",
    overlapPercentage: 100,
    coverageLevel: "Full Equivalent",
    mappingJustification: "Annual employee security awareness and anti-phishing simulation curricula map completely across both frameworks.",
  },
  {
    id: "MAP-012",
    domain: "Personnel & Training",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.6.1",
    sourceControlTitle: "Screening & Background Checks",
    targetFramework: "SOC 2",
    targetControlId: "CC2.2",
    targetControlTitle: "Competence and human resource hiring background verifications",
    overlapPercentage: 90,
    coverageLevel: "High Overlap",
    mappingJustification: "Pre-employment background verification checks fulfill both ISO 27001 A.6.1 and SOC 2 CC2.2 human capital requirements.",
  },

  // 6. Logging, Monitoring & SIEM
  {
    id: "MAP-013",
    domain: "Logging & Monitoring",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.8.15",
    sourceControlTitle: "Logging & activity recording",
    targetFramework: "NIST CSF",
    targetControlId: "DE.CM-01",
    targetControlTitle: "Continuous monitoring of network and systems",
    overlapPercentage: 95,
    coverageLevel: "High Overlap",
    mappingJustification: "Centralized SIEM ingestion, log retention, and tampering protection satisfy continuous detection monitoring.",
  },
  {
    id: "MAP-014",
    domain: "Logging & Monitoring",
    sourceFramework: "ISO 27001",
    sourceControlId: "A.8.15",
    sourceControlTitle: "Logging & activity recording",
    targetFramework: "SOC 2",
    targetControlId: "CC7.2",
    targetControlTitle: "System anomaly detection and monitoring of security events",
    overlapPercentage: 90,
    coverageLevel: "High Overlap",
    mappingJustification: "Automated event alerting and log analysis fulfill SOC 2 Trust Services Criteria for incident monitoring.",
  },
  {
    id: "MAP-015",
    domain: "Logging & Monitoring",
    sourceFramework: "NIST CSF",
    sourceControlId: "DE.CM-01",
    sourceControlTitle: "Continuous network & asset monitoring",
    targetFramework: "NIST RMF",
    targetControlId: "RMF-7",
    targetControlTitle: "Monitor - Ongoing security and privacy control monitoring",
    overlapPercentage: 100,
    coverageLevel: "Full Equivalent",
    mappingJustification: "NIST RMF Step 7 Continuous Monitoring is directly equivalent to the NIST CSF Detect (DE.CM) function.",
  },

  // 7. Incident Response & Recovery
  {
    id: "MAP-016",
    domain: "Incident Response",
    sourceFramework: "NIST CSF",
    sourceControlId: "RS.MA-01",
    sourceControlTitle: "Incident management and response execution",
    targetFramework: "SOC 2",
    targetControlId: "CC7.3",
    targetControlTitle: "Evaluation and response to identified security incidents",
    overlapPercentage: 95,
    coverageLevel: "High Overlap",
    mappingJustification: "Formal containment playbooks, incident classification severity, and root cause analysis satisfy both standards.",
  },
  {
    id: "MAP-017",
    domain: "Incident Response",
    sourceFramework: "NIST CSF",
    sourceControlId: "RC.RP-01",
    sourceControlTitle: "Recovery plan execution and restoration",
    targetFramework: "SOC 2",
    targetControlId: "A1.2",
    targetControlTitle: "Environmental failover, data backup restoration and recovery tests",
    overlapPercentage: 90,
    coverageLevel: "High Overlap",
    mappingJustification: "Annual disaster recovery exercises and RTO/RPO testing demonstrate compliance across NIST and SOC 2 Availability criteria.",
  },
];

export async function getCrossFrameworkMappings(filter?: {
  domain?: string;
  sourceFramework?: string;
  targetFramework?: string;
}): Promise<{ success: boolean; data: ControlCrossMapping[] }> {
  let list = [...CANONICAL_CROSS_MAPPINGS];

  if (filter?.domain && filter.domain !== "All") {
    list = list.filter((m) => m.domain === filter.domain);
  }
  if (filter?.sourceFramework && filter.sourceFramework !== "All") {
    list = list.filter(
      (m) =>
        m.sourceFramework.toLowerCase().includes(filter.sourceFramework!.toLowerCase()) ||
        m.targetFramework.toLowerCase().includes(filter.sourceFramework!.toLowerCase())
    );
  }

  return { success: true, data: list };
}

export async function calculateCrossFrameworkReadiness(
  workspaceId: string,
  auditId: string
): Promise<{ success: boolean; data?: CrossReadinessResult; error?: string }> {
  if (!workspaceId || !auditId) {
    return { success: false, error: "Workspace ID and Audit ID are required" };
  }

  try {
    await requirePermission("audits.view", workspaceId);

    const audit = await db.queryOne<{ id: string; name: string; framework: string; progress: number }>(
      `SELECT id, name, framework, progress FROM audits WHERE id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    if (!audit) {
      return { success: false, error: "Audit not found" };
    }

    // Fetch implemented controls from control_assessments
    const assessments = await db.query<{ control_id: string; status: string }>(
      `SELECT control_id, status FROM control_assessments WHERE audit_id = $1 AND workspace_id = $2`,
      [auditId, workspaceId]
    );

    const implementedControlIds = new Set(
      assessments
        .filter((a) => a.status === "Implemented" || a.status === "Compliant")
        .map((a) => a.control_id.toUpperCase())
    );

    const allFrameworks = ["ISO 27001", "SOC 2", "NIST CSF", "NIST RMF"];
    const targetFrameworks = allFrameworks.filter(
      (f) => !audit.framework.toLowerCase().includes(f.toLowerCase())
    );

    const targets = targetFrameworks.map((targetFw) => {
      // Find mappings where target is targetFw
      const relevantMappings = CANONICAL_CROSS_MAPPINGS.filter(
        (m) =>
          (m.targetFramework.toLowerCase().includes(targetFw.toLowerCase()) &&
            audit.framework.toLowerCase().includes(m.sourceFramework.toLowerCase())) ||
          (m.sourceFramework.toLowerCase().includes(targetFw.toLowerCase()) &&
            audit.framework.toLowerCase().includes(m.targetFramework.toLowerCase()))
      );

      const totalTargetControls = Math.max(relevantMappings.length, 6);
      let satisfiedCount = 0;

      for (const m of relevantMappings) {
        if (
          implementedControlIds.has(m.sourceControlId.toUpperCase()) ||
          implementedControlIds.has(m.targetControlId.toUpperCase()) ||
          audit.progress >= 70
        ) {
          satisfiedCount++;
        }
      }

      // If no explicit assessments recorded, derive based on audit progress
      if (assessments.length === 0) {
        satisfiedCount = Math.round((audit.progress / 100) * totalTargetControls);
      }

      const score = Math.min(100, Math.round((satisfiedCount / totalTargetControls) * 100));
      const status: "Strong Coverage" | "Moderate Coverage" | "Action Required" =
        score >= 80 ? "Strong Coverage" : score >= 50 ? "Moderate Coverage" : "Action Required";

      return {
        framework: targetFw,
        readinessScore: score,
        satisfiedControlsCount: satisfiedCount,
        totalTargetControlsCount: totalTargetControls,
        gapControlsCount: totalTargetControls - satisfiedCount,
        status,
      };
    });

    const result: CrossReadinessResult = {
      sourceFramework: audit.framework,
      auditId: audit.id,
      auditName: audit.name,
      totalSourceControls: assessments.length || 12,
      implementedSourceControls: implementedControlIds.size || Math.round((audit.progress / 100) * 12),
      targets,
    };

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate cross readiness";
    return { success: false, error: message };
  }
}
