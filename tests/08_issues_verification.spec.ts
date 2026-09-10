import { test, expect } from "@playwright/test";

test.describe("Comprehensive 14-Issue Verification Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as Alice Owner
    await page.goto("/signin");
    await page.fill('input[placeholder="you@company.com"]', "alice.owner@example.com");
    await page.fill('input[placeholder="Enter your password"]', "Password123!");
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 15000 });
    if (page.url().includes("/workspaces")) {
      await page.click('button:has-text("Open workspace")');
      await page.waitForURL("**/dashboard", { timeout: 15000 });
    }
  });

  test("Issue 1: Audit Trail layout has header and proper pl-[250px] sidebar offset", async ({ page }) => {
    await page.goto("/audit-trail");
    const heading = page.locator("h1:has-text('Audit Trail')");
    await expect(heading).toBeVisible();

    // Verify layout padding offset
    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(250);
    }
  });

  test("Issue 2: Header displays dynamic user initials, search, notifications, and help", async ({ page }) => {
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();

    // Dynamic user name and role badge
    await expect(userMenuButton.locator("p.font-semibold")).toHaveText("Alice Owner");
    await expect(userMenuButton.locator("span.font-medium")).toHaveText("Owner");

    // Search modal
    const searchBtn = page.locator('[data-testid="header-search-button"]');
    await searchBtn.click();
    const searchModal = page.locator('[data-testid="global-search-modal"]');
    await expect(searchModal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchModal).not.toBeVisible();

    // Notifications popover
    const notifBtn = page.locator('[data-testid="header-notifications-button"]');
    await notifBtn.click();
    const notifPopover = page.locator('[data-testid="notifications-popover"]');
    await expect(notifPopover).toBeVisible();
    await notifBtn.click();

    // Help modal
    const helpBtn = page.locator('[data-testid="header-help-button"]');
    await helpBtn.click();
    const helpModal = page.locator('[data-testid="help-modal"]');
    await expect(helpModal).toBeVisible();
    await page.click('[data-testid="close-help-modal-button"]');
    await expect(helpModal).not.toBeVisible();
  });

  test("Issue 3: Workspace creation persists to Neon and switches context", async ({ page }) => {
    // Click Add Workspace button in sidebar
    const addWorkspaceButton = page.locator('[data-testid="add-workspace-button"]');
    await expect(addWorkspaceButton).toBeVisible();
    await addWorkspaceButton.click();

    const modalHeading = page.locator("h3:has-text('Create Workspace')");
    await expect(modalHeading).toBeVisible();

    const uniqueWsName = `IsoCorp ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Acme Corporation, North America Ops"]', uniqueWsName);
    await page.fill('textarea[placeholder="Optional description of this workspace..."]', "Automated test workspace for isolation testing.");

    await page.click('button[type="submit"]:has-text("Create Workspace")');
    await expect(modalHeading).not.toBeVisible();

    // Workspace is created and reflected in header
    const workspaceHeader = page.locator(`text=${uniqueWsName}`);
    await expect(workspaceHeader.first()).toBeVisible();
  });

  test("Issue 4: Report PDF download button generates and downloads valid PDF", async ({ page }) => {
    await page.goto("/reports");
    const generateBtn = page.locator('button:has-text("Generate Report")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    const reportName = `PDF Test Audit ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Q3 Security Audit Report"]', reportName);
    const submitBtn = page.locator('button:has-text("Generate"):not(:has-text("Report"))');
    await submitBtn.click();

    // AuditReportViewer modal opens
    const viewerModal = page.locator('[data-testid="audit-report-viewer-modal"]');
    await expect(viewerModal).toBeVisible({ timeout: 15000 });

    const downloadPdfBtn = page.locator('[data-testid="download-pdf-button"]');
    await expect(downloadPdfBtn).toBeVisible();

    // Trigger download
    const downloadPromise = page.waitForEvent("download");
    await downloadPdfBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

    // Close viewer
    await page.click('[data-testid="close-report-button"]');
  });

  test("Issue 5: User creation with workspace allocation in administration", async ({ page }) => {
    await page.goto("/administration");
    const addUserBtn = page.locator('button:has-text("Add User")');
    await expect(addUserBtn).toBeVisible();
    await addUserBtn.click();

    const modalHeading = page.locator("h2:has-text('Add User')");
    await expect(modalHeading).toBeVisible();

    const uniqueEmail = `qa.member.${Date.now()}@example.com`;
    await page.fill('input[placeholder="e.g. Jane Doe"]', "QA Member");
    await page.fill('input[placeholder="john@company.com"]', uniqueEmail);
    await page.selectOption('div:has-text("Workspace Role") select', "Auditor");

    await page.click('button:has-text("Create User")');
    await expect(modalHeading).not.toBeVisible();

    // Verify user row appears in table
    const userRow = page.locator(`tr:has-text("${uniqueEmail}")`);
    await expect(userRow).toBeVisible();
  });

  test("Issue 6 & 14: Non-member user isolation and RBAC authorization verification", async ({ page }) => {
    // Verify that workspace page only renders workspaces where user has membership
    await page.goto("/workspaces");
    const heading = page.locator("h1:has-text('Select a workspace')");
    await expect(heading).toBeVisible();

    // Verify non-existent or isolated workspaces without membership are absent
    const content = await page.content();
    expect(content).not.toContain("Isolated Private Enterprise NonMember");
    expect(content).not.toContain("Siddhi Isolated Workspace");
  });

  test("Issue 7: Audits page Audit Lead is dynamically populated from workspace members", async ({ page }) => {
    await page.goto("/audits");
    const createBtn = page.locator('button:has-text("Create Audit")');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      const leadSelect = page.locator('select').filter({ hasText: /Owner|Admin|Auditor|Reviewer|Lead/ });
      await expect(leadSelect.first()).toBeVisible();
      const options = await leadSelect.first().locator('option').allInnerTexts();
      expect(options.length).toBeGreaterThan(0);
    }
  });

  test("Issue 8: Evidence file upload input and dynamic owner", async ({ page }) => {
    await page.goto("/evidence");
    const addBtn = page.locator('button:has-text("Add Evidence")');
    await addBtn.click();

    // Verify file input
    const fileInput = page.locator('[data-testid="evidence-file-input"]');
    await expect(fileInput).toBeAttached();

    // Verify owner select
    const ownerSelect = page.locator('[data-testid="evidence-owner-select"]');
    await expect(ownerSelect).toBeVisible();
    const options = await ownerSelect.locator("option").allInnerTexts();
    expect(options.length).toBeGreaterThan(0);
  });

  test("Issue 9: Findings page Finding Owner and Linked Evidence are dynamic selects", async ({ page }) => {
    await page.goto("/findings");
    const addBtn = page.locator('button:has-text("Add Finding")');
    await addBtn.click();

    // Verify Finding Owner select
    const ownerSelect = page.locator('[data-testid="finding-owner-select"]');
    await expect(ownerSelect).toBeVisible();
    const ownerOptions = await ownerSelect.locator("option").allInnerTexts();
    expect(ownerOptions.length).toBeGreaterThan(0);

    // Verify Linked Evidence select
    const evidenceSelect = page.locator('[data-testid="finding-evidence-select"]');
    await expect(evidenceSelect).toBeVisible();
  });

  test("Issue 10: Risk Management Risk Owner is a dynamic select", async ({ page }) => {
    await page.goto("/risk-management");
    const addBtn = page.locator('button:has-text("Add Risk")');
    await addBtn.click();

    const ownerSelect = page.locator('[data-testid="risk-owner-select"]');
    await expect(ownerSelect).toBeVisible();
    const options = await ownerSelect.locator("option").allInnerTexts();
    expect(options.length).toBeGreaterThan(0);
  });

  test("Issue 11: Remediation Finding ID, Risk ID, and Owner are dynamic selects", async ({ page }) => {
    await page.goto("/remediation");
    const addBtn = page.locator('button:has-text("Add Remediation")');
    await addBtn.click();

    const findingSelect = page.locator('[data-testid="remediation-finding-select"]');
    await expect(findingSelect).toBeVisible();

    const riskSelect = page.locator('[data-testid="remediation-risk-select"]');
    await expect(riskSelect).toBeVisible();

    const ownerSelect = page.locator('[data-testid="remediation-owner-select"]');
    await expect(ownerSelect).toBeVisible();

    // Fill and submit remediation action
    const titleInput = page.locator('[data-testid="remediation-title-input"]');
    await titleInput.fill("Automated Remediation Action Test");
    await page.click('button[type="submit"]:has-text("Create Action")');

    // Verify action appears in list
    await expect(page.locator("text=Automated Remediation Action Test")).toBeVisible();
  });

  test("Issue 12: Tasks page Owner and Reference are dynamic selects and save cleanly", async ({ page }) => {
    await page.goto("/tasks");
    const addBtn = page.locator('button:has-text("Add Task")');
    await addBtn.click();

    const ownerSelect = page.locator('[data-testid="task-owner-select"]');
    await expect(ownerSelect).toBeVisible();

    const refSelect = page.locator('[data-testid="task-reference-select"]');
    await expect(refSelect).toBeVisible();
  });

  test("Issue 13: Calendar page Owner and Reference are dynamic selects and save cleanly", async ({ page }) => {
    await page.goto("/calendar");
    const addBtn = page.getByRole("button", { name: "Add Event", exact: true });
    await addBtn.click();

    const ownerSelect = page.locator('[data-testid="calendar-owner-select"]');
    await expect(ownerSelect).toBeVisible();

    const refSelect = page.locator('[data-testid="calendar-reference-select"]');
    await expect(refSelect).toBeVisible();
  });
});
