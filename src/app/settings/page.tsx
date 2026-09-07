"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Globe,
  Lock,
  Save,
  Settings,
  Shield,
  User,
  X,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

type SettingsTab =
  | "General"
  | "Security"
  | "Notifications"
  | "Audit Configuration";

type WorkspaceSettings = {
  organizationName: string;
  industry: string;
  timezone: string;
  dateFormat: string;
  defaultFramework: string;
  auditApprovalRequired: boolean;
  evidenceReviewRequired: boolean;
  findingApprovalRequired: boolean;
  emailNotifications: boolean;
  taskReminders: boolean;
  overdueAlerts: boolean;
  sessionTimeout: string;
  passwordExpiry: string;
  twoFactorRequired: boolean;
};

const workspaceSettings: Record<string, WorkspaceSettings> = {
  "abc-technologies": {
    organizationName: "ABC Technologies",
    industry: "Technology",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    defaultFramework: "ISO 27001",
    auditApprovalRequired: true,
    evidenceReviewRequired: true,
    findingApprovalRequired: true,
    emailNotifications: true,
    taskReminders: true,
    overdueAlerts: true,
    sessionTimeout: "30 minutes",
    passwordExpiry: "90 days",
    twoFactorRequired: false,
  },

  "xyz-finance": {
    organizationName: "XYZ Finance",
    industry: "Financial Services",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    defaultFramework: "NIST CSF",
    auditApprovalRequired: true,
    evidenceReviewRequired: true,
    findingApprovalRequired: true,
    emailNotifications: true,
    taskReminders: true,
    overdueAlerts: true,
    sessionTimeout: "15 minutes",
    passwordExpiry: "60 days",
    twoFactorRequired: true,
  },

  "pqr-healthcare": {
    organizationName: "PQR Healthcare",
    industry: "Healthcare",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    defaultFramework: "ISO 27001",
    auditApprovalRequired: true,
    evidenceReviewRequired: true,
    findingApprovalRequired: false,
    emailNotifications: true,
    taskReminders: true,
    overdueAlerts: true,
    sessionTimeout: "30 minutes",
    passwordExpiry: "90 days",
    twoFactorRequired: true,
  },
};

const defaultSettings: WorkspaceSettings = {
  organizationName: "",
  industry: "",
  timezone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  defaultFramework: "ISO 27001",
  auditApprovalRequired: true,
  evidenceReviewRequired: true,
  findingApprovalRequired: true,
  emailNotifications: true,
  taskReminders: true,
  overdueAlerts: true,
  sessionTimeout: "30 minutes",
  passwordExpiry: "90 days",
  twoFactorRequired: false,
};

export default function SettingsPage() {
  const { currentWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] =
    useState<SettingsTab>("General");

  const [prevWorkspaceId, setPrevWorkspaceId] = useState(currentWorkspace.id);
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    const workspaceSettings = workspaceSettingsMap[currentWorkspace.id];
    return JSON.parse(
      JSON.stringify(workspaceSettings ?? defaultSettings)
    );
  });

  const [saved, setSaved] = useState(false);

  if (prevWorkspaceId !== currentWorkspace.id) {
    setPrevWorkspaceId(currentWorkspace.id);
    const workspaceSettings = workspaceSettingsMap[currentWorkspace.id];
    setSettings(
      JSON.parse(
        JSON.stringify(workspaceSettings ?? defaultSettings)
      )
    );
    setSaved(false);
    setActiveTab("General");
  }

  function updateSetting<K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  }

  function saveSettings() {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <main className="ml-[250px] min-h-screen bg-[#f6f8fc]">
      <div className="px-8 py-7">
        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-[25px] font-semibold text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-[13px] text-slate-500">
              Configure workspace preferences and audit platform settings
            </p>
          </div>

          <button
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Save size={15} />
            Save Changes
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
              Workspace Settings
            </span>
          </div>
        </div>

        {/* Saved notification */}
        {saved && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[12px] font-medium text-green-700">
            <CheckCircle2 size={16} />
            Settings saved successfully.
          </div>
        )}

        <div className="grid grid-cols-[220px_1fr] gap-5">
          {/* Sidebar */}
          <div className="h-fit rounded-xl border border-slate-200 bg-white p-2">
            <SettingsNav
              active={activeTab === "General"}
              icon={<Settings size={16} />}
              label="General"
              onClick={() => setActiveTab("General")}
            />

            <SettingsNav
              active={activeTab === "Security"}
              icon={<Shield size={16} />}
              label="Security"
              onClick={() => setActiveTab("Security")}
            />

            <SettingsNav
              active={activeTab === "Notifications"}
              icon={<Bell size={16} />}
              label="Notifications"
              onClick={() => setActiveTab("Notifications")}
            />

            <SettingsNav
              active={activeTab === "Audit Configuration"}
              icon={<CheckCircle2 size={16} />}
              label="Audit Configuration"
              onClick={() =>
                setActiveTab("Audit Configuration")
              }
            />
          </div>

          {/* Content */}
          <div className="rounded-xl border border-slate-200 bg-white">
            {activeTab === "General" && (
              <GeneralSettings
                settings={settings}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === "Security" && (
              <SecuritySettings
                settings={settings}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === "Notifications" && (
              <NotificationSettings
                settings={settings}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === "Audit Configuration" && (
              <AuditSettings
                settings={settings}
                updateSetting={updateSetting}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* General                                                                     */
/* -------------------------------------------------------------------------- */

function GeneralSettings({
  settings,
  updateSetting,
}: {
  settings: WorkspaceSettings;
  updateSetting: <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => void;
}) {
  return (
    <>
      <SectionHeader
        icon={<Globe size={17} />}
        title="General Settings"
        description="Manage organization and regional workspace preferences."
      />

      <div className="grid grid-cols-2 gap-5 px-6 py-6">
        <FormField label="Organization Name">
          <input
            value={settings.organizationName}
            onChange={(e) =>
              updateSetting(
                "organizationName",
                e.target.value
              )
            }
            className="input-field"
          />
        </FormField>

        <FormField label="Industry">
          <select
            value={settings.industry}
            onChange={(e) =>
              updateSetting("industry", e.target.value)
            }
            className="input-field"
          >
            <option>Technology</option>
            <option>Financial Services</option>
            <option>Healthcare</option>
            <option>Manufacturing</option>
            <option>Government</option>
            <option>Education</option>
            <option>Other</option>
          </select>
        </FormField>

        <FormField label="Timezone">
          <select
            value={settings.timezone}
            onChange={(e) =>
              updateSetting("timezone", e.target.value)
            }
            className="input-field"
          >
            <option value="Asia/Kolkata">
              Asia/Kolkata
            </option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">
              America/New_York
            </option>
            <option value="Europe/London">
              Europe/London
            </option>
            <option value="Asia/Singapore">
              Asia/Singapore
            </option>
          </select>
        </FormField>

        <FormField label="Date Format">
          <select
            value={settings.dateFormat}
            onChange={(e) =>
              updateSetting("dateFormat", e.target.value)
            }
            className="input-field"
          >
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </FormField>

        <FormField label="Default Framework">
          <select
            value={settings.defaultFramework}
            onChange={(e) =>
              updateSetting(
                "defaultFramework",
                e.target.value
              )
            }
            className="input-field"
          >
            <option>ISO 27001</option>
            <option>NIST CSF</option>
            <option>NIST RMF</option>
            <option>SOC 2</option>
            <option>CIS Controls</option>
          </select>
        </FormField>
      </div>

      <InfoBox>
        These settings apply to the selected workspace and are
        independent from other workspaces.
      </InfoBox>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Security                                                                    */
/* -------------------------------------------------------------------------- */

function SecuritySettings({
  settings,
  updateSetting,
}: {
  settings: WorkspaceSettings;
  updateSetting: <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => void;
}) {
  return (
    <>
      <SectionHeader
        icon={<Lock size={17} />}
        title="Security Settings"
        description="Configure workspace authentication and session policies."
      />

      <div className="space-y-1 px-6 py-5">
        <SettingRow
          title="Require Two-Factor Authentication"
          description="Require users to use an additional authentication factor."
          checked={settings.twoFactorRequired}
          onChange={(value) =>
            updateSetting("twoFactorRequired", value)
          }
        />

        <div className="grid grid-cols-2 gap-5 border-b border-slate-100 py-5">
          <FormField label="Session Timeout">
            <select
              value={settings.sessionTimeout}
              onChange={(e) =>
                updateSetting(
                  "sessionTimeout",
                  e.target.value
                )
              }
              className="input-field"
            >
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>60 minutes</option>
              <option>120 minutes</option>
            </select>
          </FormField>

          <FormField label="Password Expiry">
            <select
              value={settings.passwordExpiry}
              onChange={(e) =>
                updateSetting(
                  "passwordExpiry",
                  e.target.value
                )
              }
              className="input-field"
            >
              <option>30 days</option>
              <option>60 days</option>
              <option>90 days</option>
              <option>180 days</option>
              <option>Never</option>
            </select>
          </FormField>
        </div>
      </div>

      <InfoBox>
        Security policies affect users belonging to this workspace.
      </InfoBox>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

function NotificationSettings({
  settings,
  updateSetting,
}: {
  settings: WorkspaceSettings;
  updateSetting: <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => void;
}) {
  return (
    <>
      <SectionHeader
        icon={<Bell size={17} />}
        title="Notification Settings"
        description="Control workspace alerts and automated reminders."
      />

      <div className="space-y-1 px-6 py-5">
        <SettingRow
          title="Email Notifications"
          description="Send important audit and workspace updates through email."
          checked={settings.emailNotifications}
          onChange={(value) =>
            updateSetting("emailNotifications", value)
          }
        />

        <SettingRow
          title="Task Reminders"
          description="Notify users when assigned tasks are approaching their due date."
          checked={settings.taskReminders}
          onChange={(value) =>
            updateSetting("taskReminders", value)
          }
        />

        <SettingRow
          title="Overdue Alerts"
          description="Notify responsible users when tasks or remediation actions become overdue."
          checked={settings.overdueAlerts}
          onChange={(value) =>
            updateSetting("overdueAlerts", value)
          }
        />
      </div>

      <InfoBox>
        Notification preferences are applied to activities within
        the current workspace.
      </InfoBox>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Audit Configuration                                                         */
/* -------------------------------------------------------------------------- */

function AuditSettings({
  settings,
  updateSetting,
}: {
  settings: WorkspaceSettings;
  updateSetting: <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => void;
}) {
  return (
    <>
      <SectionHeader
        icon={<CheckCircle2 size={17} />}
        title="Audit Configuration"
        description="Configure approval and review requirements for audits."
      />

      <div className="space-y-1 px-6 py-5">
        <SettingRow
          title="Audit Approval Required"
          description="Require an authorized user to approve an audit before completion."
          checked={settings.auditApprovalRequired}
          onChange={(value) =>
            updateSetting(
              "auditApprovalRequired",
              value
            )
          }
        />

        <SettingRow
          title="Evidence Review Required"
          description="Require evidence to be reviewed before it is accepted for an audit."
          checked={settings.evidenceReviewRequired}
          onChange={(value) =>
            updateSetting(
              "evidenceReviewRequired",
              value
            )
          }
        />

        <SettingRow
          title="Finding Approval Required"
          description="Require findings to be reviewed before finalization."
          checked={settings.findingApprovalRequired}
          onChange={(value) =>
            updateSetting(
              "findingApprovalRequired",
              value
            )
          }
        />
      </div>

      <InfoBox>
        These controls define the workflow behavior for new audits
        created in this workspace.
      </InfoBox>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                         */
/* -------------------------------------------------------------------------- */

function SettingsNav({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-medium transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-0.5 text-[11px] text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4">
      <div className="pr-8">
        <p className="text-[12px] font-medium text-slate-700">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
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

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-6 mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
      <p className="text-[10px] leading-4 text-blue-600">
        {children}
      </p>
    </div>
  );
}

const workspaceSettingsMap = workspaceSettings;