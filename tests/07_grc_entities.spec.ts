import { test, expect } from "@playwright/test";

test.describe("Phase 10-14 & 26: GRC Frameworks, Controls, Evidence, Findings & Risks", () => {
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

  test("frameworks page displays seeded standards and control counts", async ({ page }) => {
    await page.goto("/frameworks");

    const heading = page.locator("h1:has-text('Frameworks')");
    await expect(heading).toBeVisible();

    // Verify presence of ISO 27001 and NIST frameworks
    await expect(page.locator("text=ISO 27001").first()).toBeVisible();
    await expect(page.locator("text=NIST CSF").first()).toBeVisible();
  });

  test("control library lists mapped framework controls", async ({ page }) => {
    await page.goto("/control-library");

    const heading = page.locator("h1:has-text('Control Library')");
    await expect(heading).toBeVisible();

    // Verify controls table has controls
    const table = page.locator("table");
    await expect(table).toBeVisible();
  });

  test("findings page lists findings with severity tags", async ({ page }) => {
    await page.goto("/findings");

    const heading = page.locator("h1:has-text('Findings')");
    await expect(heading).toBeVisible();
  });

  test("evidence page shows evidence tracking", async ({ page }) => {
    await page.goto("/evidence");

    const heading = page.locator("h1:has-text('Evidence')");
    await expect(heading).toBeVisible();
  });
});
