# Section 18: End-User Operations Manual

## 1. Getting Started: Account Registration & Sign-In

### 1.1 Account Registration
1. Navigate to the platform landing page at [https://auditplatform-nu.vercel.app/signin](https://auditplatform-nu.vercel.app/signin).
2. Click **Don't have an account? Sign up** at the bottom of the sign-in card.
3. Fill in your details:
   - **Full Name**: e.g., `Jane Doe`
   - **Email Address**: Must be a valid Gmail account (`@gmail.com` or `@googlemail.com`).
   - **Password**: Minimum of 8 characters.
4. Click **Create Account**.
5. Check your Gmail inbox for a confirmation email from Supabase Auth. Click the verification link to confirm your email address.

### 1.2 Signing In
1. Return to `/signin`.
2. Enter your registered Gmail address and password.
3. Click **Sign In**. Upon successful verification, you will be redirected to the **Workspaces** portal.

---

## 2. Organization & Workspace Selection

The Audit Platform organizes audits within isolated workspaces:

1. On the **Workspaces** portal (`/workspaces`), view the list of organizations you belong to along with your role badge (`Owner`, `Admin`, `Auditor`, etc.).
2. Click on any workspace card to enter its dedicated dashboard.
3. To switch workspaces at any time, click the organization selector in the top-left corner of the header bar and choose another workspace.
4. To create a new workspace (Owners/Admins), click **Create Workspace**, provide the organization name, industry, and primary framework, and click **Create**.

---

## 3. Executive Dashboard Navigation (`/dashboard`)

The Executive Dashboard provides real-time visibility across your organization's compliance posture:

- **Key Performance Indicators (KPIs)**:
  - *Active Audits*: Engagements currently in Planning, Fieldwork, or Review.
  - *Compliance Score*: Weighted average of implemented controls across all audits.
  - *Open Findings*: Total non-conformities currently requiring remediation.
  - *Critical Risks*: High-priority operational risks requiring treatment.
- **Compliance Trends Chart**: Visual timeline of control implementation rates.
- **Recent Audit Activity**: Live feed of recent modifications, evidence uploads, and status changes.
- **Quick Action Buttons**: Direct shortcuts to initiate a new audit, upload evidence, or review findings.

---

## 4. Initiating a New Compliance Audit (`/audits`)

1. Navigate to **Audits** in the left sidebar navigation.
2. Click the **+ New Audit** button in the upper-right corner.
3. Complete the audit configuration modal:
   - **Audit Name**: e.g., `Q1 2026 ISO 27001 ISMS Surveillance Audit`
   - **Framework**: Select from the dropdown (`ISO 27001`, `NIST CSF`, `SOC 2`, `NIST SP 800-53`).
   - **Lead Auditor**: Assign the team member responsible for directing fieldwork.
   - **Start Date & Due Date**: Establish testing timelines.
   - **Objective & Scope**: Detail technical and organizational boundaries (e.g., "All production AWS infrastructure and core SaaS APIs").
4. Click **Create Audit**. The platform generates a unique identifier (`AUD-2026-XXXXX`) and auto-populates baseline controls from the selected framework.

---

## 5. Conducting Fieldwork & Assessing Controls (`/audits/[id]`)

Click on any audit to access its central command hub:

1. **Reviewing Baseline Controls**: The main dashboard displays all controls mapped to the audit.
2. **Updating Assessment Status**:
   - Locate the target control (e.g., `A.5.15 Access Control`).
   - Select the appropriate evaluation state from the dropdown:
     - `Implemented`: Verified with supporting evidence.
     - `Partially Implemented`: Process active but has minor gaps.
     - `Not Implemented`: Requirement absent; non-conformity.
     - `Not Applicable`: Legitimate out-of-scope requirement.
3. **Assigning Assessors & Notes**:
   - Enter your name as the active assessor.
   - Enter field testing notes, interview observations, and control design analysis.
   - Click **Save Assessment**. The overall audit progress gauge recalculates automatically.

---

## 6. Uploading and Managing Evidence (`/audits/[id]/evidence`)

1. Click the **Evidence** tab within the audit hub.
2. Click **Upload Evidence** or drag-and-drop supporting files into the upload zone.
3. In the upload dialog:
   - Select the file from your local machine (Allowed: `.pdf`, `.docx`, `.xlsx`, `.csv`, `.png`, `.jpg`; Max: 25MB).
   - Link the file to a specific control (e.g., `A.8.24 Cryptography`).
   - Enter a descriptive reference name (e.g., `AWS KMS Key Rotation Policy Screenshot`).
4. Click **Upload File**. The file is stored securely in the persistent Evidence Vault.
5. To download or verify an item, click the **Download** icon. The system generates a time-limited, signed download URL (15-minute validity).

---

## 7. Logging Findings & Deficiencies (`/audits/[id]/findings`)

When a control fails or exhibits deficiencies:

1. Click the **Findings** tab and select **+ New Finding**.
2. Complete the finding dossier:
   - **Title**: Clear summary of the deficiency (e.g., `Root Account Access Keys Unrotated`).
   - **Severity**: Choose `Critical`, `High`, `Medium`, `Low`, or `Informational`.
   - **Related Control**: Map to the failing control reference.
   - **Description**: Detailed observations and failure modes.
   - **Recommendation**: Concrete remediation steps required.
   - **Remediation Owner & Due Date**: Assign responsibility and target SLA date.
3. Click **Log Finding**. The audit findings counter increments, and an audit trail event is recorded.

---

## 8. Managing Enterprise Risks (`/audits/[id]/risks`)

1. Click the **Risks** tab to view the audit risk register and $5 \times 5$ heatmap.
2. Click **+ Add Risk** to quantify exposure:
   - **Likelihood**: Select qualitative rating (`Rare` to `Almost Certain`).
   - **Impact**: Select severity of business impact (`Minimal` to `Severe`).
   - The platform calculates the **Inherent Score** ($1..25$) and assigns the risk level (`Low`, `Medium`, `High`, `Critical`).
   - **Treatment Strategy**: Designate treatment response (`Mitigate`, `Accept`, `Transfer`, `Avoid`).
   - **Residual Score**: Document anticipated post-treatment score.
3. Click **Save Risk**.

---

## 9. Compiling & Downloading Audit Reports (`/audits/[id]/reports`)

When fieldwork is concluded:

1. Click the **Reports** tab.
2. Click **Generate Report**, select the report type (`Audit Report` or `Executive Summary`), and confirm.
3. The platform synthesizes all 12 sections and opens the interactive **Audit Report Viewer**.
4. Review the executive summary, control statistics, evidence index, and findings table.
5. Choose your export format:
   - **Download PDF**: Generates and downloads an immutable, publication-grade PDF-1.4 document.
   - **Export JSON**: Downloads the structured data payload for integration with external GRC systems.
