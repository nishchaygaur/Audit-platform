export type FindingSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Informational";

export type FindingStatus =
  | "Open"
  | "In Progress"
  | "Remediated"
  | "Accepted Risk"
  | "Closed";

export const VALID_FINDING_SEVERITIES: readonly FindingSeverity[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
] as const;

export const VALID_FINDING_STATUSES: readonly FindingStatus[] = [
  "Open",
  "In Progress",
  "Remediated",
  "Accepted Risk",
  "Closed",
] as const;
