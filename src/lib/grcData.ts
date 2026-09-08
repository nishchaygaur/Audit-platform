"use client";

/* ============================================================
   GRC TYPES
============================================================ */

export type FindingSeverity = "Critical" | "High" | "Medium" | "Low";

export type FindingStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Accepted Risk"
  | "Closed";

export type Finding = {
  id: string; // e.g. FND-2024-001
  findingId?: string; // backwards compatibility alias
  workspaceId: string;
  auditId: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  framework: string;
  control: string;
  owner: string;
  auditor: string;
  identified: string;
  dueDate: string;
  evidence: string;
  recommendation: string;
};

export type EvidenceStatus =
  | "Requested"
  | "Submitted"
  | "Under Review"
  | "Accepted"
  | "Rejected"
  | "Pending Review";

export type EvidenceItem = {
  id: string; // e.g. EVD-2024-001
  evidenceId?: string; // backwards compatibility alias
  workspaceId: string;
  auditId: string;
  name: string;
  type: string;
  size: string;
  control: string;
  framework: string;
  owner: string;
  status: EvidenceStatus;
  uploaded: string;
  reviewedBy: string;
  findingId?: string;
  description?: string;
};

export type RiskLevel = "Critical" | "High" | "Medium" | "Low";
export type RiskStatus = "Open" | "Mitigated" | "Accepted" | "Closed" | "Under Review";

export type RiskItem = {
  id: string; // e.g. RSK-2024-001
  workspaceId: string;
  auditId: string;
  title: string;
  description: string;
  category: string;
  framework: string;
  asset: string;
  owner: string;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  status: RiskStatus;
  identifiedDate: string;
  dueDate: string;
  treatment: string;
  findingId?: string;
};

export type RemediationStatus =
  | "Open"
  | "In Progress"
  | "Pending Review"
  | "Completed"
  | "Overdue";

export type RemediationItem = {
  id: string; // e.g. REM-2024-001
  workspaceId: string;
  auditId: string;
  title: string;
  description: string;
  findingId: string;
  riskId: string;
  framework: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  owner: string;
  dueDate: string;
  status: RemediationStatus;
  progress: number;
  createdDate: string;
};

export type TaskStatus =
  | "Open"
  | "In Progress"
  | "Pending Approval"
  | "Completed";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type TaskItem = {
  id: string; // e.g. TSK-001
  workspaceId: string;
  title: string;
  description: string;
  type: string;
  reference: string;
  owner: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
};

export type ReportStatus = "Completed" | "Generating" | "Failed";

export type ReportItem = {
  id: string; // e.g. RPT-001
  workspaceId: string;
  auditId: string;
  name: string;
  type: string;
  framework: string;
  generatedBy: string;
  generatedDate: string;
  size: string;
  status: ReportStatus;
  summary?: {
    scopeCount: number;
    controlsCount: number;
    compliantCount: number;
    evidenceCount: number;
    findingsCount: number;
    risksCount: number;
    remediationCount: number;
  };
};

/* ============================================================
   INITIAL DATA: FINDINGS
============================================================ */

export const INITIAL_FINDINGS: Finding[] = [
  // ABC Technologies - AUD-2024-001 (ISO 27001)
  {
    id: "FND-2024-001",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Privileged accounts lack MFA and regular review",
    description:
      "Quarterly privileged access reviews were not consistently performed for administrative accounts, and MFA was optional on internal bastion hosts.",
    severity: "Critical",
    status: "Open",
    framework: "ISO 27001",
    control: "A.8.2",
    owner: "Alice Smith",
    auditor: "John Carter",
    identified: "06 May 2024",
    dueDate: "31 May 2024",
    evidence: "EVD-2024-004",
    recommendation:
      "Enforce mandatory multi-factor authentication across all privileged access endpoints and institute a documented quarterly sign-off.",
  },
  {
    id: "FND-2024-002",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Incomplete access review evidence for third-party contractors",
    description:
      "Contractor access listings lacked formal manager approvals for Q1, presenting unauthorized retention risks.",
    severity: "High",
    status: "In Progress",
    framework: "ISO 27001",
    control: "A.5.15",
    owner: "John Carter",
    auditor: "Alice Smith",
    identified: "08 May 2024",
    dueDate: "07 Jun 2024",
    evidence: "EVD-2024-002",
    recommendation:
      "Establish automated identity synchronization and ensure contractor permissions expire unless explicitly re-certified.",
  },
  {
    id: "FND-2024-003",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Security awareness training records outdated",
    description:
      "Training completion records for engineering personnel could not be verified during sample testing.",
    severity: "Medium",
    status: "In Progress",
    framework: "ISO 27001",
    control: "A.6.3",
    owner: "Emily Davis",
    auditor: "John Carter",
    identified: "10 May 2024",
    dueDate: "14 Jun 2024",
    evidence: "EVD-2024-003",
    recommendation:
      "Centralize training records in LMS and automate automated reminders 30 days prior to annual recertification deadlines.",
  },
  {
    id: "FND-2024-004",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Asset inventory contains stale cloud resources",
    description:
      "The hardware and cloud asset inventory had 14 orphaned compute instances without assigned technical owners.",
    severity: "Low",
    status: "Resolved",
    framework: "ISO 27001",
    control: "A.5.1",
    owner: "Michael Lee",
    auditor: "John Carter",
    identified: "12 May 2024",
    dueDate: "28 Jun 2024",
    evidence: "EVD-2024-001",
    recommendation:
      "Deploy automated infrastructure-as-code tagging policies to prevent unassigned asset provisioning.",
  },
  {
    id: "FND-2024-005",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Threat intelligence feed ingestion delays",
    description:
      "Threat intelligence data was ingested manually on a weekly cadence instead of automated near-real-time streaming.",
    severity: "Medium",
    status: "Open",
    framework: "ISO 27001",
    control: "A.5.7",
    owner: "David Wilson",
    auditor: "John Carter",
    identified: "14 May 2024",
    dueDate: "30 Jun 2024",
    evidence: "EVD-2024-005",
    recommendation:
      "Integrate automated STIX/TAXII threat feeds directly into SIEM correlation rules.",
  },
  {
    id: "FND-2024-006",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Cloud service exit plans undocumented",
    description:
      "Critical SaaS providers lacked formalized exit and data portability documentation in the supplier register.",
    severity: "Low",
    status: "Accepted Risk",
    framework: "ISO 27001",
    control: "A.5.23",
    owner: "Alice Smith",
    auditor: "John Carter",
    identified: "16 May 2024",
    dueDate: "15 Jul 2024",
    evidence: "EVD-2024-006",
    recommendation:
      "Incorporate cloud vendor termination and data extraction runbooks into supplier onboarding templates.",
  },
  {
    id: "FND-2024-007",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Centralized logging retention policy shortfall",
    description:
      "Secondary application cluster log retention was set to 45 days instead of the required 365 days.",
    severity: "Medium",
    status: "Closed",
    framework: "ISO 27001",
    control: "A.8.15",
    owner: "Michael Lee",
    auditor: "John Carter",
    identified: "18 May 2024",
    dueDate: "20 Jun 2024",
    evidence: "EVD-2024-007",
    recommendation:
      "Extend cold storage lifecycle rules on log buckets to maintain compliance with 1-year retention mandates.",
  },

  // ABC Technologies - AUD-2024-002 (NIST CSF)
  {
    id: "FND-2024-010",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Vulnerability remediation exceeds defined SLA",
    description:
      "Several critical vulnerabilities remained unresolved beyond the 14-day remediation SLA on perimeter firewalls.",
    severity: "Critical",
    status: "Open",
    framework: "NIST CSF",
    control: "DE.CM-08",
    owner: "David Wilson",
    auditor: "John Carter",
    identified: "09 May 2024",
    dueDate: "25 May 2024",
    evidence: "EVD-2024-010",
    recommendation:
      "Establish automated patch pipelines and an emergency SLA escalation matrix for CVSS 9.0+ findings.",
  },
  {
    id: "FND-2024-011",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Security awareness phishing simulation click rates elevated",
    description:
      "Departmental simulated phishing failure rate reached 18%, exceeding the internal 5% threshold.",
    severity: "Medium",
    status: "In Progress",
    framework: "NIST CSF",
    control: "PR.AT-01",
    owner: "Emily Davis",
    auditor: "John Carter",
    identified: "11 May 2024",
    dueDate: "10 Jun 2024",
    evidence: "EVD-2024-003",
    recommendation:
      "Deliver targeted just-in-time micro-training modules for repeat clickers within 48 hours of failure.",
  },
  {
    id: "FND-2024-012",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Incident response communication channel testing overdue",
    description:
      "Out-of-band communication channels for severe ransomware scenarios had not been tested within the past 12 months.",
    severity: "High",
    status: "Open",
    framework: "NIST CSF",
    control: "RS.CO-03",
    owner: "Alice Smith",
    auditor: "John Carter",
    identified: "13 May 2024",
    dueDate: "18 Jun 2024",
    evidence: "EVD-2024-011",
    recommendation:
      "Conduct a tabletop simulation utilizing satellite and encrypted secondary messaging tools.",
  },
  {
    id: "FND-2024-013",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Continuous diagnostic monitoring coverage incomplete",
    description:
      "Containerized microservices in staging environments were not reporting telemetry into centralized CDM dashboard.",
    severity: "Low",
    status: "Resolved",
    framework: "NIST CSF",
    control: "DE.CM-01",
    owner: "Michael Lee",
    auditor: "John Carter",
    identified: "15 May 2024",
    dueDate: "30 Jun 2024",
    evidence: "EVD-2024-012",
    recommendation:
      "Embed standard telemetry sidecar agents into Kubernetes base pod specs.",
  },

  // ABC Technologies - AUD-2024-004 (Access Control Review)
  {
    id: "FND-2024-020",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-004",
    title: "Dormant service accounts retain domain admin rights",
    description:
      "Two legacy integration service accounts had not logged in for 180 days yet maintained domain admin privileges.",
    severity: "Critical",
    status: "Resolved",
    framework: "NIST 800-53",
    control: "AC-2",
    owner: "Michael Lee",
    auditor: "Alice Smith",
    identified: "02 May 2024",
    dueDate: "20 May 2024",
    evidence: "EVD-2024-020",
    recommendation:
      "Disable inactive service accounts after 60 days of dormancy and downgrade permissions to least privilege.",
  },
  {
    id: "FND-2024-021",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-004",
    title: "Session termination timeout on jump hosts exceeds threshold",
    description:
      "SSH jump host idle timeout was configured to 4 hours instead of policy requirement of 15 minutes.",
    severity: "Medium",
    status: "Closed",
    framework: "NIST 800-53",
    control: "AC-12",
    owner: "Michael Lee",
    auditor: "Alice Smith",
    identified: "04 May 2024",
    dueDate: "25 May 2024",
    evidence: "EVD-2024-021",
    recommendation:
      "Apply hardened SSH configuration via configuration management.",
  },

  // ABC Technologies - AUD-2024-005 (Risk Management Assessment)
  {
    id: "FND-2024-030",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-005",
    title: "Risk register requires periodic formal executive review",
    description:
      "Enterprise risk register did not contain documented sign-off from executive risk committee for Q1.",
    severity: "Medium",
    status: "Open",
    framework: "NIST RMF",
    control: "RM-02",
    owner: "Alice Smith",
    auditor: "John Carter",
    identified: "16 May 2024",
    dueDate: "20 Jun 2024",
    evidence: "EVD-2024-030",
    recommendation:
      "Schedule recurring quarterly risk steering committee reviews and maintain signed minutes in GRC repository.",
  },
  {
    id: "FND-2024-031",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-005",
    title: "Quantitative risk modeling metrics lack standardized methodology",
    description:
      "Cyber risk impact estimates vary across departments without standard FAIR methodology alignment.",
    severity: "High",
    status: "In Progress",
    framework: "NIST RMF",
    control: "RM-03",
    owner: "Alice Smith",
    auditor: "John Carter",
    identified: "18 May 2024",
    dueDate: "25 Jun 2024",
    evidence: "EVD-2024-031",
    recommendation:
      "Adopt calibrated probability-loss distribution guidelines across operational units.",
  },
  {
    id: "FND-2024-032",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-005",
    title: "Supply chain risk assessment criteria unaligned with new tiering",
    description:
      "Tier-1 vendor assessments rely on outdated self-attestation questionnaires rather than SOC 2 Type II reports.",
    severity: "Medium",
    status: "Open",
    framework: "NIST RMF",
    control: "SR-01",
    owner: "Emily Davis",
    auditor: "John Carter",
    identified: "20 May 2024",
    dueDate: "30 Jun 2024",
    evidence: "EVD-2024-032",
    recommendation:
      "Require SOC 2 Type II and continuous vendor threat rating for all Tier-1 suppliers.",
  },

  // XYZ Finance - AUD-2024-011 (SOC 2)
  {
    id: "FND-2024-101",
    workspaceId: "xyz-finance",
    auditId: "AUD-2024-011",
    title: "Database encryption keys rotation schedule exceeds SLA",
    description:
      "Production financial transactional database KMS keys were last rotated 14 months ago against an annual policy requirement.",
    severity: "High",
    status: "Open",
    framework: "SOC 2",
    control: "CC6.1",
    owner: "Sarah Brown",
    auditor: "David Wilson",
    identified: "05 May 2024",
    dueDate: "15 Jun 2024",
    evidence: "EVD-2024-101",
    recommendation:
      "Enable automated 365-day rotation via AWS KMS / Cloud KMS and configure alerting for non-rotated keys.",
  },
  {
    id: "FND-2024-102",
    workspaceId: "xyz-finance",
    auditId: "AUD-2024-011",
    title: "Change management approval missing for emergency deployment",
    description:
      "Emergency hotfix deploy on May 2nd lacked post-implementation CAB approval documentation.",
    severity: "Medium",
    status: "In Progress",
    framework: "SOC 2",
    control: "CC8.1",
    owner: "Sarah Brown",
    auditor: "David Wilson",
    identified: "07 May 2024",
    dueDate: "20 Jun 2024",
    evidence: "EVD-2024-102",
    recommendation:
      "Implement automated workflow block that requires retrospective sign-off within 24 hours of emergency change.",
  },

  // PQR Healthcare - AUD-2024-021 (ISO 27001)
  {
    id: "FND-2024-201",
    workspaceId: "pqr-healthcare",
    auditId: "AUD-2024-021",
    title: "Electronic Protected Health Information (ePHI) access logging gaps",
    description:
      "Access logs for the medical imaging repository did not record read operations on diagnostic ultrasound files.",
    severity: "Critical",
    status: "In Progress",
    framework: "ISO 27001",
    control: "A.8.15",
    owner: "Michael Lee",
    auditor: "Sarah Brown",
    identified: "06 May 2024",
    dueDate: "10 Jun 2024",
    evidence: "EVD-2024-201",
    recommendation:
      "Enable granular S3 access logging and audit trail forwarding to HIPAA compliance monitoring sink.",
  },
];

/* ============================================================
   INITIAL DATA: EVIDENCE
============================================================ */

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  // ABC Technologies - AUD-2024-001
  {
    id: "EVD-2024-001",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "Information Security Policy.pdf",
    type: "PDF",
    size: "1.8 MB",
    control: "A.5.1",
    framework: "ISO 27001",
    owner: "Alice Smith",
    status: "Accepted",
    uploaded: "01 May 2024",
    reviewedBy: "John Carter",
    description: "Approved master information security policy signed by CISO and CEO.",
  },
  {
    id: "EVD-2024-002",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "Access Control Review.xlsx",
    type: "XLSX",
    size: "842 KB",
    control: "A.5.15",
    framework: "ISO 27001",
    owner: "Michael Lee",
    status: "Under Review",
    uploaded: "05 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-002",
    description: "Quarterly user access certification spreadsheet across core identity directories.",
  },
  {
    id: "EVD-2024-003",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "Security Awareness Training Records.pdf",
    type: "PDF",
    size: "3.2 MB",
    control: "A.6.3",
    framework: "ISO 27001",
    owner: "Emily Davis",
    status: "Pending Review",
    uploaded: "06 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-003",
    description: "LMS export of employee training completions and curriculum syllabus.",
  },
  {
    id: "EVD-2024-004",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "Privileged Account Listing & MFA Config.xlsx",
    type: "XLSX",
    size: "420 KB",
    control: "A.8.2",
    framework: "ISO 27001",
    owner: "Michael Lee",
    status: "Under Review",
    uploaded: "07 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-001",
    description: "Identity provider export of all root, global administrator, and superuser accounts.",
  },
  {
    id: "EVD-2024-005",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "Threat Intelligence Feed Integration.docx",
    type: "DOCX",
    size: "1.1 MB",
    control: "A.5.7",
    framework: "ISO 27001",
    owner: "David Wilson",
    status: "Accepted",
    uploaded: "08 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-005",
    description: "Architecture design document for external threat feed ingestion.",
  },
  {
    id: "EVD-2024-006",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "Cloud Provider Exit Strategy.pdf",
    type: "PDF",
    size: "2.4 MB",
    control: "A.5.23",
    framework: "ISO 27001",
    owner: "Alice Smith",
    status: "Pending Review",
    uploaded: "09 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-006",
    description: "Vendor risk management guidelines and multi-cloud migration runbooks.",
  },
  {
    id: "EVD-2024-007",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "SIEM Log Retention Config Export.json",
    type: "JSON",
    size: "180 KB",
    control: "A.8.15",
    framework: "ISO 27001",
    owner: "Michael Lee",
    status: "Accepted",
    uploaded: "10 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-007",
    description: "Terraform configurations and cloud storage lifecycle policy export.",
  },

  // ABC Technologies - AUD-2024-002
  {
    id: "EVD-2024-010",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    name: "Vulnerability Management Report.pdf",
    type: "PDF",
    size: "4.5 MB",
    control: "DE.CM-08",
    framework: "NIST CSF",
    owner: "David Wilson",
    status: "Under Review",
    uploaded: "09 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-010",
    description: "Monthly vulnerability scan report and patch remediation SLA metrics.",
  },
  {
    id: "EVD-2024-011",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    name: "Incident Response Playbooks.docx",
    type: "DOCX",
    size: "2.1 MB",
    control: "RS.CO-03",
    framework: "NIST CSF",
    owner: "Alice Smith",
    status: "Accepted",
    uploaded: "11 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-012",
    description: "Comprehensive incident response runbooks and crisis escalation contacts.",
  },
  {
    id: "EVD-2024-012",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    name: "Continuous Monitoring Architecture.pdf",
    type: "PDF",
    size: "1.6 MB",
    control: "DE.CM-01",
    framework: "NIST CSF",
    owner: "Michael Lee",
    status: "Accepted",
    uploaded: "13 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-013",
    description: "Monitoring network topology, telemetry collection points, and alert thresholds.",
  },

  // ABC Technologies - AUD-2024-004
  {
    id: "EVD-2024-020",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-004",
    name: "Active Directory Service Account Audit.csv",
    type: "CSV",
    size: "340 KB",
    control: "AC-2",
    framework: "NIST 800-53",
    owner: "Michael Lee",
    status: "Accepted",
    uploaded: "03 May 2024",
    reviewedBy: "Alice Smith",
    findingId: "FND-2024-020",
    description: "Directory dump of all non-human service accounts and last logon timestamps.",
  },
  {
    id: "EVD-2024-021",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-004",
    name: "Bastion Host SSH Security Baseline.txt",
    type: "TXT",
    size: "45 KB",
    control: "AC-12",
    framework: "NIST 800-53",
    owner: "Michael Lee",
    status: "Accepted",
    uploaded: "04 May 2024",
    reviewedBy: "Alice Smith",
    findingId: "FND-2024-021",
    description: "Hardened sshd_config showing ClientAliveInterval and ClientAliveCountMax.",
  },

  // ABC Technologies - AUD-2024-005
  {
    id: "EVD-2024-030",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-005",
    name: "Enterprise Risk Register Q1.xlsx",
    type: "XLSX",
    size: "1.3 MB",
    control: "RM-02",
    framework: "NIST RMF",
    owner: "Alice Smith",
    status: "Under Review",
    uploaded: "15 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-030",
    description: "Active corporate risk register including likelihood/impact matrix.",
  },
  {
    id: "EVD-2024-031",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-005",
    name: "Risk Scoring Methodology Specification.pdf",
    type: "PDF",
    size: "890 KB",
    control: "RM-03",
    framework: "NIST RMF",
    owner: "Alice Smith",
    status: "Accepted",
    uploaded: "16 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-031",
    description: "Standard risk calculation criteria and tolerance thresholds.",
  },
  {
    id: "EVD-2024-032",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-005",
    name: "Vendor Tiering & Questionnaire Rubric.pdf",
    type: "PDF",
    size: "750 KB",
    control: "SR-01",
    framework: "NIST RMF",
    owner: "Emily Davis",
    status: "Pending Review",
    uploaded: "18 May 2024",
    reviewedBy: "John Carter",
    findingId: "FND-2024-032",
    description: "Third-party risk questionnaire and compliance evaluation criteria.",
  },

  // XYZ Finance - AUD-2024-011
  {
    id: "EVD-2024-101",
    workspaceId: "xyz-finance",
    auditId: "AUD-2024-011",
    name: "Financial DB KMS Configuration.json",
    type: "JSON",
    size: "112 KB",
    control: "CC6.1",
    framework: "SOC 2",
    owner: "Sarah Brown",
    status: "Accepted",
    uploaded: "04 May 2024",
    reviewedBy: "David Wilson",
    description: "Cloud KMS key policy and automated key rotation settings.",
  },
  {
    id: "EVD-2024-102",
    workspaceId: "xyz-finance",
    auditId: "AUD-2024-011",
    name: "Production Change Tickets Q1.xlsx",
    type: "XLSX",
    size: "2.1 MB",
    control: "CC8.1",
    framework: "SOC 2",
    owner: "Sarah Brown",
    status: "Under Review",
    uploaded: "06 May 2024",
    reviewedBy: "David Wilson",
    description: "Sample of 50 change advisory board tickets and approval records.",
  },

  // PQR Healthcare - AUD-2024-021
  {
    id: "EVD-2024-201",
    workspaceId: "pqr-healthcare",
    auditId: "AUD-2024-021",
    name: "Imaging PACS Access Log Analysis.csv",
    type: "CSV",
    size: "8.4 MB",
    control: "A.8.15",
    framework: "ISO 27001",
    owner: "Michael Lee",
    status: "Under Review",
    uploaded: "05 May 2024",
    reviewedBy: "Sarah Brown",
    description: "Diagnostic imaging audit logs and patient record access events.",
  },
];

/* ============================================================
   INITIAL DATA: RISKS
============================================================ */

export const INITIAL_RISKS: RiskItem[] = [
  // ABC Technologies - AUD-2024-001
  {
    id: "RSK-2024-001",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Privileged access exposure and credential compromise",
    description:
      "Lack of mandatory MFA on secondary management ports may allow unauthorized lateral movement in the event of credential stuffing.",
    category: "Access Control",
    framework: "ISO 27001",
    asset: "Identity & Access Management",
    owner: "Alice Smith",
    likelihood: 5,
    impact: 5,
    score: 25,
    level: "Critical",
    status: "Open",
    identifiedDate: "06 May 2024",
    dueDate: "31 May 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-001",
  },
  {
    id: "RSK-2024-002",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Third-party contractor unauthorized data access",
    description:
      "Stale permissions for offboarded contractor staff pose significant risk of confidential IP exfiltration.",
    category: "Identity Management",
    framework: "ISO 27001",
    asset: "User Accounts",
    owner: "John Carter",
    likelihood: 4,
    impact: 5,
    score: 20,
    level: "High",
    status: "Open",
    identifiedDate: "08 May 2024",
    dueDate: "07 Jun 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-002",
  },
  {
    id: "RSK-2024-003",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Workforce vulnerability to spear-phishing attacks",
    description:
      "Lag in annual security refresher training increases the probability of successful social engineering breaches.",
    category: "People",
    framework: "ISO 27001",
    asset: "Workforce",
    owner: "Emily Davis",
    likelihood: 3,
    impact: 4,
    score: 12,
    level: "Medium",
    status: "Under Review",
    identifiedDate: "10 May 2024",
    dueDate: "14 Jun 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-003",
  },

  // ABC Technologies - AUD-2024-002
  {
    id: "RSK-2024-010",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Exploitable external vulnerabilities exceeding SLA",
    description:
      "Unpatched perimeter infrastructure represents an elevated risk of automated ransomware or botnet exploitation.",
    category: "Vulnerability Management",
    framework: "NIST CSF",
    asset: "External Firewalls",
    owner: "David Wilson",
    likelihood: 5,
    impact: 4,
    score: 20,
    level: "High",
    status: "Open",
    identifiedDate: "09 May 2024",
    dueDate: "25 May 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-010",
  },
  {
    id: "RSK-2024-011",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Prolonged outage during ransomware containment",
    description:
      "Untested out-of-band communication channels could delay critical crisis command response times.",
    category: "Incident Response",
    framework: "NIST CSF",
    asset: "Crisis Management Team",
    owner: "Alice Smith",
    likelihood: 2,
    impact: 5,
    score: 10,
    level: "Medium",
    status: "Open",
    identifiedDate: "13 May 2024",
    dueDate: "18 Jun 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-012",
  },

  // ABC Technologies - AUD-2024-003
  {
    id: "RSK-2024-015",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-003",
    title: "Critical supplier operational dependency failure",
    description:
      "Single point of failure on cloud hosting provider without cross-region backup failover.",
    category: "Vendor Risk",
    framework: "ISO 27001",
    asset: "Cloud Infrastructure",
    owner: "Emily Davis",
    likelihood: 2,
    impact: 5,
    score: 10,
    level: "Medium",
    status: "Open",
    identifiedDate: "20 May 2024",
    dueDate: "20 Jun 2024",
    treatment: "Mitigate",
  },

  // ABC Technologies - AUD-2024-004
  {
    id: "RSK-2024-020",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-004",
    title: "Compromise of dormant high-privilege service accounts",
    description:
      "Unmonitored service account credentials could be harvested by attackers with internal network visibility.",
    category: "Access Control",
    framework: "NIST 800-53",
    asset: "Domain Controllers",
    owner: "Michael Lee",
    likelihood: 4,
    impact: 5,
    score: 20,
    level: "High",
    status: "Mitigated",
    identifiedDate: "02 May 2024",
    dueDate: "20 May 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-020",
  },

  // ABC Technologies - AUD-2024-005
  {
    id: "RSK-2024-030",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-005",
    title: "Uncoordinated risk governance across business units",
    description:
      "Disparate risk frameworks impede accurate executive decision-making and cyber insurance rate optimization.",
    category: "Governance",
    framework: "NIST RMF",
    asset: "Risk Governance",
    owner: "Alice Smith",
    likelihood: 3,
    impact: 4,
    score: 12,
    level: "Medium",
    status: "Open",
    identifiedDate: "16 May 2024",
    dueDate: "20 Jun 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-030",
  },

  // XYZ Finance - AUD-2024-011
  {
    id: "RSK-2024-101",
    workspaceId: "xyz-finance",
    auditId: "AUD-2024-011",
    title: "Cryptographic key aging and unauthorized disclosure",
    description:
      "Expired rotation periods on financial database encryption keys increase vulnerability to cryptanalysis.",
    category: "Cryptography",
    framework: "SOC 2",
    asset: "Core Financial Database",
    owner: "Sarah Brown",
    likelihood: 3,
    impact: 5,
    score: 15,
    level: "High",
    status: "Open",
    identifiedDate: "05 May 2024",
    dueDate: "15 Jun 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-101",
  },

  // PQR Healthcare - AUD-2024-021
  {
    id: "RSK-2024-201",
    workspaceId: "pqr-healthcare",
    auditId: "AUD-2024-021",
    title: "HIPAA violation from unmonitored patient record access",
    description:
      "Absence of granular read access logging in PACS could prevent timely detection of unauthorized chart snooping.",
    category: "Regulatory Compliance",
    framework: "ISO 27001",
    asset: "PACS Imaging Repository",
    owner: "Michael Lee",
    likelihood: 4,
    impact: 5,
    score: 20,
    level: "Critical",
    status: "Open",
    identifiedDate: "06 May 2024",
    dueDate: "10 Jun 2024",
    treatment: "Mitigate",
    findingId: "FND-2024-201",
  },
];

/* ============================================================
   INITIAL DATA: REMEDIATION
============================================================ */

export const INITIAL_REMEDIATION: RemediationItem[] = [
  // ABC Technologies - AUD-2024-001
  {
    id: "REM-2024-001",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Enforce multi-factor authentication on all privileged consoles",
    description:
      "Roll out hardware security key or TOTP requirements to all administrator jump hosts and AWS management consoles.",
    findingId: "FND-2024-001",
    riskId: "RSK-2024-001",
    framework: "ISO 27001",
    priority: "Critical",
    owner: "Alice Smith",
    dueDate: "31 May 2024",
    status: "In Progress",
    progress: 65,
    createdDate: "06 May 2024",
  },
  {
    id: "REM-2024-002",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Complete quarterly contractor access re-certification",
    description:
      "Require vendor managers to review and digitally certify contractor active directory accounts via identity portal.",
    findingId: "FND-2024-002",
    riskId: "RSK-2024-002",
    framework: "ISO 27001",
    priority: "High",
    owner: "John Carter",
    dueDate: "07 Jun 2024",
    status: "In Progress",
    progress: 45,
    createdDate: "10 May 2024",
  },
  {
    id: "REM-2024-003",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Update security awareness refresher campaign",
    description:
      "Enroll all overdue personnel in updated 2024 security training and track completions in LMS.",
    findingId: "FND-2024-003",
    riskId: "RSK-2024-003",
    framework: "ISO 27001",
    priority: "Medium",
    owner: "Emily Davis",
    dueDate: "14 Jun 2024",
    status: "Pending Review",
    progress: 90,
    createdDate: "14 May 2024",
  },
  {
    id: "REM-2024-004",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Decommission unassigned cloud infrastructure assets",
    description:
      "Terminate orphaned EC2 and Cloud Storage buckets identified during the asset inventory review.",
    findingId: "FND-2024-004",
    riskId: "RSK-2024-001",
    framework: "ISO 27001",
    priority: "Low",
    owner: "Michael Lee",
    dueDate: "28 Jun 2024",
    status: "Completed",
    progress: 100,
    createdDate: "15 May 2024",
  },
  {
    id: "REM-2024-005",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    title: "Automate STIX/TAXII threat feed ingestion into SIEM",
    description:
      "Configure automated threat intelligence connectors and alert correlation rule thresholds.",
    findingId: "FND-2024-005",
    riskId: "RSK-2024-001",
    framework: "ISO 27001",
    priority: "Medium",
    owner: "David Wilson",
    dueDate: "30 Jun 2024",
    status: "Open",
    progress: 20,
    createdDate: "16 May 2024",
  },

  // ABC Technologies - AUD-2024-002
  {
    id: "REM-2024-010",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Remediate overdue critical perimeter vulnerabilities",
    description:
      "Apply security firmware updates and configuration patches across edge firewalls.",
    findingId: "FND-2024-010",
    riskId: "RSK-2024-010",
    framework: "NIST CSF",
    priority: "Critical",
    owner: "David Wilson",
    dueDate: "25 May 2024",
    status: "In Progress",
    progress: 50,
    createdDate: "10 May 2024",
  },
  {
    id: "REM-2024-011",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    title: "Establish secondary encrypted emergency communication channel",
    description:
      "Provision out-of-band crisis management application for executive response team.",
    findingId: "FND-2024-012",
    riskId: "RSK-2024-011",
    framework: "NIST CSF",
    priority: "High",
    owner: "Alice Smith",
    dueDate: "18 Jun 2024",
    status: "Open",
    progress: 10,
    createdDate: "14 May 2024",
  },

  // ABC Technologies - AUD-2024-004
  {
    id: "REM-2024-020",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-004",
    title: "Disable dormant privileged service accounts",
    description:
      "Revoke domain admin rights and disable accounts inactive for over 60 days.",
    findingId: "FND-2024-020",
    riskId: "RSK-2024-020",
    framework: "NIST 800-53",
    priority: "High",
    owner: "Michael Lee",
    dueDate: "20 May 2024",
    status: "Completed",
    progress: 100,
    createdDate: "03 May 2024",
  },

  // XYZ Finance - AUD-2024-011
  {
    id: "REM-2024-101",
    workspaceId: "xyz-finance",
    auditId: "AUD-2024-011",
    title: "Automate database KMS key rotation",
    description:
      "Update cloud KMS settings to enforce annual automatic cryptographic key rotation.",
    findingId: "FND-2024-101",
    riskId: "RSK-2024-101",
    framework: "SOC 2",
    priority: "High",
    owner: "Sarah Brown",
    dueDate: "15 Jun 2024",
    status: "In Progress",
    progress: 40,
    createdDate: "06 May 2024",
  },

  // PQR Healthcare - AUD-2024-021
  {
    id: "REM-2024-201",
    workspaceId: "pqr-healthcare",
    auditId: "AUD-2024-021",
    title: "Deploy ePHI read-access audit logging in PACS",
    description:
      "Enable diagnostic imaging object-level access logging and forward into HIPAA compliance SIEM.",
    findingId: "FND-2024-201",
    riskId: "RSK-2024-201",
    framework: "ISO 27001",
    priority: "Critical",
    owner: "Michael Lee",
    dueDate: "10 Jun 2024",
    status: "In Progress",
    progress: 35,
    createdDate: "07 May 2024",
  },
];

/* ============================================================
   INITIAL DATA: REPORTS
============================================================ */

export const INITIAL_REPORTS: ReportItem[] = [
  // ABC Technologies
  {
    id: "RPT-001",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "ISO 27001 Internal Audit Report",
    type: "Audit Report",
    framework: "ISO 27001",
    generatedBy: "Alice Smith",
    generatedDate: "05 Sep 2026",
    size: "2.4 MB",
    status: "Completed",
    summary: {
      scopeCount: 6,
      controlsCount: 114,
      compliantCount: 62,
      evidenceCount: 86,
      findingsCount: 7,
      risksCount: 3,
      remediationCount: 5,
    },
  },
  {
    id: "RPT-002",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "ISO 27001 Executive Audit Summary",
    type: "Executive Summary",
    framework: "ISO 27001",
    generatedBy: "Alice Smith",
    generatedDate: "02 Sep 2026",
    size: "890 KB",
    status: "Completed",
    summary: {
      scopeCount: 6,
      controlsCount: 114,
      compliantCount: 62,
      evidenceCount: 86,
      findingsCount: 7,
      risksCount: 3,
      remediationCount: 5,
    },
  },
  {
    id: "RPT-003",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-001",
    name: "Findings & Remediation Tracking Report",
    type: "Remediation Report",
    framework: "ISO 27001",
    generatedBy: "Compliance Team",
    generatedDate: "01 Sep 2026",
    size: "1.3 MB",
    status: "Completed",
    summary: {
      scopeCount: 6,
      controlsCount: 114,
      compliantCount: 62,
      evidenceCount: 86,
      findingsCount: 7,
      risksCount: 3,
      remediationCount: 5,
    },
  },
  {
    id: "RPT-004",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-002",
    name: "NIST CSF Cybersecurity Posture Report",
    type: "Compliance Report",
    framework: "NIST CSF",
    generatedBy: "John Carter",
    generatedDate: "04 Sep 2026",
    size: "1.8 MB",
    status: "Completed",
    summary: {
      scopeCount: 5,
      controlsCount: 108,
      compliantCount: 58,
      evidenceCount: 94,
      findingsCount: 4,
      risksCount: 2,
      remediationCount: 2,
    },
  },
  {
    id: "RPT-005",
    workspaceId: "abc-technologies",
    auditId: "AUD-2024-004",
    name: "Access Control Verification Summary",
    type: "Audit Report",
    framework: "NIST 800-53",
    generatedBy: "Michael Lee",
    generatedDate: "03 Sep 2026",
    size: "1.1 MB",
    status: "Completed",
    summary: {
      scopeCount: 4,
      controlsCount: 58,
      compliantCount: 31,
      evidenceCount: 58,
      findingsCount: 6,
      risksCount: 1,
      remediationCount: 1,
    },
  },

  // XYZ Finance
  {
    id: "RPT-101",
    workspaceId: "xyz-finance",
    auditId: "AUD-2024-011",
    name: "SOC 2 Type II Readiness Report",
    type: "Compliance Report",
    framework: "SOC 2",
    generatedBy: "Sarah Brown",
    generatedDate: "01 Sep 2026",
    size: "3.1 MB",
    status: "Completed",
    summary: {
      scopeCount: 5,
      controlsCount: 91,
      compliantCount: 48,
      evidenceCount: 47,
      findingsCount: 5,
      risksCount: 3,
      remediationCount: 1,
    },
  },

  // PQR Healthcare
  {
    id: "RPT-201",
    workspaceId: "pqr-healthcare",
    auditId: "AUD-2024-021",
    name: "HIPAA & ISO 27001 Security Audit Report",
    type: "Audit Report",
    framework: "ISO 27001",
    generatedBy: "Michael Lee",
    generatedDate: "02 Sep 2026",
    size: "2.7 MB",
    status: "Completed",
    summary: {
      scopeCount: 5,
      controlsCount: 127,
      compliantCount: 51,
      evidenceCount: 59,
      findingsCount: 8,
      risksCount: 5,
      remediationCount: 1,
    },
  },
];

/* ============================================================
   LOCAL STORAGE KEYS & PERSISTENCE HELPERS
============================================================ */

const STORAGE_KEYS = {
  FINDINGS: "audit-platform-findings",
  EVIDENCE: "audit-platform-evidence",
  RISKS: "audit-platform-risks",
  REMEDIATION: "audit-platform-remediation",
  REPORTS: "audit-platform-reports",
};

export function getStoredFindings(): Finding[] {
  if (typeof window === "undefined") return INITIAL_FINDINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.FINDINGS);
    if (!raw) return INITIAL_FINDINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FINDINGS;
  } catch {
    return INITIAL_FINDINGS;
  }
}

export function saveStoredFindings(findings: Finding[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.FINDINGS, JSON.stringify(findings));
}

export function getStoredEvidence(): EvidenceItem[] {
  if (typeof window === "undefined") return INITIAL_EVIDENCE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.EVIDENCE);
    if (!raw) return INITIAL_EVIDENCE;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EVIDENCE;
  } catch {
    return INITIAL_EVIDENCE;
  }
}

export function saveStoredEvidence(evidence: EvidenceItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(evidence));
}

export function getStoredRisks(): RiskItem[] {
  if (typeof window === "undefined") return INITIAL_RISKS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.RISKS);
    if (!raw) return INITIAL_RISKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RISKS;
  } catch {
    return INITIAL_RISKS;
  }
}

export function saveStoredRisks(risks: RiskItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.RISKS, JSON.stringify(risks));
}

export function getStoredRemediation(): RemediationItem[] {
  if (typeof window === "undefined") return INITIAL_REMEDIATION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.REMEDIATION);
    if (!raw) return INITIAL_REMEDIATION;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REMEDIATION;
  } catch {
    return INITIAL_REMEDIATION;
  }
}

export function saveStoredRemediation(items: RemediationItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.REMEDIATION, JSON.stringify(items));
}

export function getStoredReports(): ReportItem[] {
  if (typeof window === "undefined") return INITIAL_REPORTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) return INITIAL_REPORTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REPORTS;
  } catch {
    return INITIAL_REPORTS;
  }
}

export function saveStoredReports(reports: ReportItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
}
