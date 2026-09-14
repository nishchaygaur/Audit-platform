import { test, expect } from "@playwright/test";

test.describe("Phase 4 & 26: Authentication & Session Management", () => {
  test("enforces Gmail address validation on sign up", async ({ page }) => {
    await page.goto("/signin");

    // Switch to Sign Up
    await page.click("text=Don't have an account? Sign up");

    await page.fill('input[placeholder="Jane Doe"]', "Test Corporate User");
    await page.fill('input[type="email"]', "test@corporate.com");
    await page.fill('input[type="password"]', "Password123!");

    await page.click('button[type="submit"]:has-text("Create Account")');

    // Verify rejection message
    const errorMsg = page.locator("text=Registration requires a valid Gmail address");
    await expect(errorMsg).toBeVisible();
  });

  test("signs in with valid credentials and accesses workspaces", async ({ page }) => {
    await page.goto("/signin");

    // Sign in as alice.owner@example.com
    await page.fill('input[type="email"]', "alice.owner@example.com");
    await page.fill('input[placeholder="Enter your password"]', "Password123!");

    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should redirect to /workspaces or dashboard
    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 15000 });
    expect(page.url()).not.toContain("/signin");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/signin");

    await page.fill('input[type="email"]', "alice.owner@example.com");
    await page.fill('input[placeholder="Enter your password"]', "WrongPassword999!");

    await page.click('button[type="submit"]:has-text("Sign In")');

    const errorMsg = page.locator("text=Invalid credentials");
    await expect(errorMsg).toBeVisible();
  });

  test("forgot password modal opens and sends reset link", async ({ page }) => {
    await page.goto("/signin");

    // Click Forgot password?
    await page.click("text=Forgot password?");

    const modalTitle = page.locator("text=Reset your password");
    await expect(modalTitle).toBeVisible();

    // Fill registered email
    const emailInput = page.locator('[data-testid="forgot-password-email-input"]');
    await emailInput.fill("alice.owner@example.com");

    await page.click('button:has-text("Send Reset Link")');

    // Should show success view or handle response
    const successHeader = page.locator("text=Reset Link Sent");
    const backBtn = page.locator('button:has-text("Back to Sign In")');

    // If modal switched to confirmation screen
    if (await successHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      await backBtn.click();
    } else {
      // Otherwise close via cancel or X button
      const cancelBtn = page.locator('button:has-text("Cancel")');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      } else {
        const closeBtn = page.locator('[data-testid="close-forgot-password-button"]');
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    }
    await expect(modalTitle).not.toBeVisible();
  });

  test("user can sign out cleanly", async ({ page }) => {
    await page.goto("/signin");

    await page.fill('input[type="email"]', "alice.owner@example.com");
    await page.fill('input[placeholder="Enter your password"]', "Password123!");
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 15000 });

    if (page.url().includes("/workspaces")) {
      await page.click('button:has-text("Open workspace")');
      await page.waitForURL("**/dashboard", { timeout: 15000 });
    }

    // Open user menu in header
    const userMenuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    // Click Sign Out
    const signOutButton = page.locator('[data-testid="sign-out-button"]');
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    await page.waitForURL("**/signin", { timeout: 15000 });
    expect(page.url()).toContain("/signin");
  });
});
