import { test, expect } from "@playwright/test";

test.describe("Phase 15 & 26: Human-Readable Report Viewer (12 Sections)", () => {
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

  test("generates report and displays all 12 human-readable sections in AuditReportViewer", async ({ page }) => {
    await page.goto("/reports");

    // Click Generate Report button
    const generateBtn = page.locator('button:has-text("Generate Report")');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Fill generate modal
    const reportName = `Q3 Assurance Audit ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Q3 Security Audit Report"]', reportName);

    // Click Generate
    const submitBtn = page.locator('button:has-text("Generate"):not(:has-text("Report"))');
    await submitBtn.click();

    // Viewer should open automatically after generation
    const viewerModal = page.locator('[data-testid="audit-report-viewer-modal"]');
    await expect(viewerModal).toBeVisible({ timeout: 15000 });

    // Verify all 12 required sections
    await expect(page.locator('[data-testid="report-section-organization"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-audit-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-scope"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-objectives"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-frameworks"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-executive-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-evidence"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-findings"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-risks"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-recommendations"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-section-conclusion"]')).toBeVisible();

    // Verify Print and Download JSON buttons
    await expect(page.locator('[data-testid="print-report-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-json-button"]')).toBeVisible();

    // Close viewer
    await page.click('[data-testid="close-report-button"]');
    await expect(viewerModal).not.toBeVisible();

    // Verify report is listed in reports table and can be re-opened
    const reportRow = page.locator(`tr:has-text("${reportName}")`);
    await expect(reportRow).toBeVisible();

    // Click View
    await reportRow.locator('button:has-text("View")').click();
    await expect(viewerModal).toBeVisible();
    await page.click('[data-testid="close-report-button"]');
  });
});
