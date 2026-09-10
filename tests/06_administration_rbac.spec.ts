import { test, expect } from "@playwright/test";

test.describe("Phase 19 & 26: Administration, User Creation & Workspace Allocation", () => {
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

  test("creates a new user and allocates them to a workspace with an assigned role", async ({ page }) => {
    await page.goto("/administration");

    const heading = page.locator("h1:has-text('Administration')");
    await expect(heading).toBeVisible();

    // Click Add User button
    const addUserBtn = page.locator('button:has-text("Add User")');
    await expect(addUserBtn).toBeVisible();
    await addUserBtn.click();

    // Verify Add User Modal opens with full fields (Name, Email, Workspace, Role, Password)
    const modalHeading = page.locator("h2:has-text('Add User')");
    await expect(modalHeading).toBeVisible();

    const uniqueEmail = `auditor.${Date.now()}@example.com`;
    await page.fill('input[placeholder="e.g. Jane Doe"]', "Marcus Vance");
    await page.fill('input[placeholder="john@company.com"]', uniqueEmail);

    // Select Role: Auditor
    await page.selectOption('div:has-text("Workspace Role") select', "Auditor");

    // Fill optional password
    await page.fill('input[placeholder="Leave blank for default: Password123!"]', "SecretAuditorPass123!");

    // Submit user creation
    await page.click('button:has-text("Create User")');

    // Modal should close
    await expect(modalHeading).not.toBeVisible();

    // Verify user appears in members table
    const userRow = page.locator(`tr:has-text("${uniqueEmail}")`);
    await expect(userRow).toBeVisible();
    await expect(userRow.getByText("Auditor", { exact: true })).toBeVisible();
  });
});
