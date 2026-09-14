# Section 20: Troubleshooting & Operational Diagnostics

## 1. Diagnostic Overview

This guide provides a comprehensive matrix of potential errors, root-cause analyses, and concrete step-by-step remediation procedures across all tiers of the Audit Platform.

---

## 2. Authentication & Identity Diagnostics

### 2.1 "Registration requires a valid Gmail address (@gmail.com or @googlemail.com)"
- **Root Cause**: The user submitted an email address from a corporate domain, Outlook, Yahoo, or temporary email service.
- **Resolution**:
  - The platform enforces strict Gmail domain validation in `src/actions/auth.ts` to prevent spam accounts.
  - Advise the user to sign up using a valid `@gmail.com` or `@googlemail.com` address.

### 2.2 "Please verify your email address before signing in"
- **Root Cause**: The user registered successfully, but has not clicked the confirmation link sent by Supabase Auth.
- **Resolution**:
  - Direct the user to check their Gmail inbox (and Spam/Junk folders) for the Supabase confirmation email.
  - If the email was not received, use the **Resend Confirmation** button or submit a password reset request.

### 2.3 "This confirmation link has expired or has already been used" (`otp_expired`)
- **Root Cause**: The token hash in the verification URL has exceeded Supabase's expiration window (typically 24 hours) or was consumed by a corporate mail scanner.
- **Resolution**:
  - Navigate to `/signin` and click **Forgot password?** to request a fresh magic link.
  - Alternatively, have a Workspace Admin re-invite the user from `/administration`.

### 2.4 "Failed to synchronize user account" during sign-in
- **Root Cause**: `resolveAppUser` failed to find or create the corresponding row in the PostgreSQL `users` table due to database downtime or connection timeout.
- **Resolution**:
  - Check that the Neon database is online and accessible.
  - Verify that `DATABASE_URL` is properly set in the server environment.

---

## 3. Database & Connection Pool Diagnostics

### 3.1 "DATABASE_URL environment variable is required to connect to PostgreSQL"
- **Root Cause**: Next.js server runtime evaluated `getPool()` in `src/lib/db.ts` while `process.env.DATABASE_URL` was undefined.
- **Resolution**:
  - In local development, verify that `.env.local` contains a valid `DATABASE_URL`.
  - In Vercel, check **Project Settings $\rightarrow$ Environment Variables** and confirm `DATABASE_URL` is assigned to Production, Preview, and Development.

### 3.2 "Connection timeout" or "sorry, too many clients already"
- **Root Cause**: High concurrent serverless invocations exhausted the available direct PostgreSQL connections on Neon.
- **Resolution**:
  - Change the `DATABASE_URL` from the direct connection string to the **Neon PgBouncer pooled connection string** (contains `-pooler` in the host).
  - Check `src/lib/db.ts` to ensure `idleTimeoutMillis` is set to `30000` and connections are released in `finally` blocks.

### 3.3 "SSL connection is required" / Certificate validation errors
- **Root Cause**: Neon requires SSL encrypted transport.
- **Resolution**:
  - Append `?sslmode=require` to the end of your `DATABASE_URL`.

---

## 4. Evidence Vault & Dual Storage Diagnostics

### 4.1 "File exceeds 25 MB maximum size limit"
- **Root Cause**: An auditor attempted to upload a video or oversized archive file exceeding the $25\text{MB}$ boundary enforced in `src/actions/evidence.ts`.
- **Resolution**:
  - Compress the evidentiary file or split large PDF packages into smaller, control-specific segments before uploading.

### 4.2 "Unsupported file format '.xyz'"
- **Root Cause**: The file extension is not in the whitelist: `.pdf`, `.docx`, `.xlsx`, `.csv`, `.png`, `.jpg`, `.jpeg`.
- **Resolution**:
  - Convert the artifact into standard PDF or PNG format.
  - Executable, script, and web files (`.exe`, `.sh`, `.html`, `.svg`) are intentionally blocked for security.

### 4.3 "Unauthorized: Invalid session or expired download token"
- **Root Cause**: The signed download link exceeded its 15-minute Time-To-Live (900 seconds) or the user logged out.
- **Resolution**:
  - Refresh the evidence tab in the browser and click **Download** again to obtain a freshly generated token.

### 4.4 AWS S3 "AccessDenied" or "InvalidAccessKeyId"
- **Root Cause**: Incorrect S3 environment variables or IAM policy permissions.
- **Resolution**:
  - Verify `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`.
  - Verify that the IAM user possesses `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions on the targeted `S3_BUCKET`.

---

## 5. Authorization & Multi-Tenancy Diagnostics

### 5.1 "Forbidden: User is not a member of this workspace"
- **Root Cause**: The user's active session is attempting to access an audit or resource belonging to an organization where they have no row in `user_workspaces`.
- **Resolution**:
  - Switch to the correct organization using the workspace switcher in the header.
  - Ask a Workspace Administrator of that organization to invite your account.

### 5.2 "Forbidden: Requires [permission] permission in this workspace"
- **Root Cause**: The user's assigned role in the active workspace does not include the requested permission.
- **Resolution**:
  - Consult the **Section 06 RBAC Matrix**. For example, `Viewer` accounts cannot create findings or upload evidence.
  - An Admin or Owner must update the user's role in `/administration`.

### 5.3 "Referenced evidence belongs to another workspace"
- **Root Cause**: A finding was submitted referencing an evidence UUID from a different organization tenant.
- **Resolution**:
  - Link only evidence uploaded within the current audit engagement. Cross-workspace evidence referencing is strictly blocked.
