import { test, expect } from "@playwright/test";

test.describe("Phase 8, 9 & 26: Audit Plans & Audit Lifecycle", () => {
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

  test("creates an audit plan with Approved status and filters plans", async ({ page }) => {
    await page.goto("/audit-plans");

    // Click New Audit Plan button
    const newPlanButton = page.locator('button:has-text("New Audit Plan")');
    await expect(newPlanButton).toBeVisible();
    await newPlanButton.click();

    // Fill modal form
    const planName = `FY26 Security Assessment ${Date.now()}`;
    await page.fill('input[placeholder="e.g. 2024 Information Security Audit Plan"]', planName);
    await page.fill('textarea[placeholder="Describe the purpose and scope of this audit plan..."]', "Annual evaluation of controls.");

    // Select Status: Approved
    await page.selectOption('[data-testid="select-status"]', "Approved");

    // Save
    await page.click('button:has-text("Create Audit Plan")');

    // Verify plan appears in table
    const createdRow = page.locator(`tr:has-text("${planName}")`);
    await expect(createdRow).toBeVisible();
    await expect(createdRow.locator("text=Approved")).toBeVisible();
  });

  test("views audits page and verifies 5 lifecycle stages", async ({ page }) => {
    await page.goto("/audits");

    const heading = page.locator("h1:has-text('Audits')");
    await expect(heading).toBeVisible();

    // Verify filter tabs or statuses: Planning, Fieldwork, Review, Reporting, Completed
    const stages = ["Planning", "Fieldwork", "Review", "Reporting", "Completed"];
    for (const stage of stages) {
      const stageOption = page.locator(`option:has-text("${stage}")`).first();
      await expect(stageOption).toBeAttached();
    }
  });
});
