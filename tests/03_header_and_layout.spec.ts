import { test, expect } from "@playwright/test";

test.describe("Phase 16, 17 & 26: Header Identity, Controls & Layout Alignment", () => {
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

  test("header displays dynamic authenticated user identity and role badge", async ({ page }) => {
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();

    // Verify authenticated user name is displayed, not static 'Alice Smith'
    const nameText = await userMenuButton.locator("p.font-semibold").innerText();
    expect(nameText).toBe("Alice Owner");

    // Verify role badge is displayed
    const roleBadge = userMenuButton.locator("span.font-medium");
    await expect(roleBadge).toHaveText("Owner");
  });

  test("header interactive controls: user menu, search, notifications, help", async ({ page }) => {
    // 1. User menu dropdown
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await userMenuButton.click();
    const userDropdown = page.locator('[data-testid="user-dropdown-menu"]');
    await expect(userDropdown).toBeVisible();
    await expect(page.locator("text=alice.owner@example.com")).toBeVisible();
    // Close by clicking again or outside
    await userMenuButton.click();
    await expect(userDropdown).not.toBeVisible();

    // 2. Global search modal
    const searchButton = page.locator('[data-testid="header-search-button"]');
    await expect(searchButton).toBeVisible();
    await searchButton.click();

    const searchModal = page.locator('[data-testid="global-search-modal"]');
    await expect(searchModal).toBeVisible();

    const searchInput = page.locator('[data-testid="global-search-input"]');
    await searchInput.fill("ISO");
    // Wait for search debounce
    await page.waitForTimeout(400);

    // Verify search results or category appears
    await expect(page.locator('[data-testid="global-search-results"]')).toBeVisible();

    // Close search modal
    await page.keyboard.press("Escape");
    await expect(searchModal).not.toBeVisible();

    // 3. Notifications popover
    const notifButton = page.locator('[data-testid="header-notifications-button"]');
    await expect(notifButton).toBeVisible();
    await notifButton.click();

    const notifPopover = page.locator('[data-testid="notifications-popover"]');
    await expect(notifPopover).toBeVisible();
    await expect(notifPopover.locator("text=Notifications & Activity")).toBeVisible();
    await notifButton.click();

    // 4. Help modal
    const helpButton = page.locator('[data-testid="header-help-button"]');
    await expect(helpButton).toBeVisible();
    await helpButton.click();

    const helpModal = page.locator('[data-testid="help-modal"]');
    await expect(helpModal).toBeVisible();
    await expect(helpModal.locator("text=Audit & GRC Knowledge Base")).toBeVisible();
    await expect(helpModal.locator("text=5 Roles & Access Model")).toBeVisible();

    // Close help modal
    await page.click('[data-testid="close-help-modal-button"]');
    await expect(helpModal).not.toBeVisible();
  });

  test("audit trail page has correct left padding (X >= 250px) and no sidebar overlap", async ({ page }) => {
    await page.goto("/audit-trail");

    const heading = page.locator("h1:has-text('Audit Trail')");
    await expect(heading).toBeVisible();

    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    // Sidebar width is 250px; heading X must be >= 250px so it's not hidden behind sidebar
    expect(box!.x).toBeGreaterThanOrEqual(250);

    // Verify main content container is also positioned at X >= 250px
    const main = page.locator("main.p-6");
    const mainBox = await main.boundingBox();
    expect(mainBox).not.toBeNull();
    expect(mainBox!.x).toBeGreaterThanOrEqual(250);
  });
});
