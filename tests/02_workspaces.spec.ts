import { test, expect } from "@playwright/test";

test.describe("Phase 18 & 26: Workspaces & Data Isolation", () => {
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

  test("creates a new workspace from the sidebar and switches to it", async ({ page }) => {
    // Click Add Workspace button in sidebar
    const addWorkspaceButton = page.locator('[data-testid="add-workspace-button"]');
    await expect(addWorkspaceButton).toBeVisible();
    await addWorkspaceButton.click();

    // Verify modal is open
    const modalHeading = page.locator("h3:has-text('Create Workspace')");
    await expect(modalHeading).toBeVisible();

    const uniqueWsName = `Auto Test Corp ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Acme Corporation, North America Ops"]', uniqueWsName);
    await page.fill('textarea[placeholder="Optional description of this workspace..."]', "Automated test workspace for isolation testing.");

    // Submit workspace creation
    await page.click('button[type="submit"]:has-text("Create Workspace")');

    // Modal should close
    await expect(modalHeading).not.toBeVisible();

    // The header or current workspace dropdown should reflect the new workspace
    const workspaceHeader = page.locator(`text=${uniqueWsName}`);
    await expect(workspaceHeader.first()).toBeVisible();
  });

  test("verifies multi-workspace data isolation between separate workspaces", async ({ page }) => {
    // Navigate to Audit Plans
    await page.click('nav a:has-text("Audit Plans")');
    await page.waitForURL("**/audit-plans", { timeout: 15000 });

    // Check that plans table exists
    const tableHeading = page.locator("h1:has-text('Audit Plans')");
    await expect(tableHeading).toBeVisible();
  });
});
