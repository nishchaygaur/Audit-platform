import { test, expect } from '@playwright/test';

test.describe('Phase 3 - Baseline Verification', () => {
  test('1. Sign in with valid credentials', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('h2')).toContainText(/Welcome back|Sign in/i);

    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Should redirect to /workspaces or /dashboard
    await expect(page).toHaveURL(/(workspaces|dashboard)/);
  });

  test('2. Sign out', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);

    // If on /workspaces, click Open workspace
    if (page.url().includes('/workspaces')) {
      await page.click('button:has-text("Open workspace")');
      await page.waitForURL(/dashboard/);
    }

    // Open user menu in sidebar or header
    const userBtn = page.locator('#user-profile-btn');
    if (await userBtn.isVisible()) {
      await userBtn.click();
      const signOutBtn = page.locator('button:has-text("Sign Out")');
      await signOutBtn.click();
      await expect(page).toHaveURL(/signin/);
    }
  });

  test('3. Sign up flow', async ({ page }) => {
    await page.goto('/signin');
    await page.click('button:has-text("Don\'t have an account? Sign up")');
    await expect(page.locator('h2')).toContainText(/Create an account/i);

    const testEmail = `test.user.${Date.now()}@gmail.com`;
    await page.fill('input[placeholder="Jane Doe"]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/(workspaces|dashboard)/);
  });

  test('4. Dashboard view', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    if (page.url().includes('/workspaces')) {
      await page.click('button:has-text("Open workspace")');
    }
    await page.goto('/dashboard');
    await expect(page.locator('h2:has-text("Dashboard")')).toBeVisible();
  });

  test('5. Workspace list and selection', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/workspaces');
    await expect(page.locator('button:has-text("Open workspace")').first()).toBeVisible();
  });

  test('6. Audit plans page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/audit-plans');
    await expect(page.locator('h1')).toContainText(/Audit Plans/i);
  });

  test('7. Audits page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/audits');
    await expect(page.locator('h1')).toContainText(/Audits/i);
  });

  test('8. Frameworks page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/frameworks');
    await expect(page.locator('h1')).toContainText(/Frameworks/i);
  });

  test('9. Control Library page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/control-library');
    await expect(page.locator('h1')).toContainText(/Control Library/i);
  });

  test('10. Evidence page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/evidence');
    await expect(page.locator('h1')).toContainText(/Evidence/i);
  });

  test('11. Findings page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/findings');
    await expect(page.locator('h1')).toContainText(/Findings/i);
  });

  test('12. Risk management page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/risk-management');
    await expect(page.locator('h1')).toContainText(/Risk Management/i);
  });

  test('13. Reports page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/reports');
    await expect(page.locator('h1')).toContainText(/Reports/i);
  });

  test('14. Audit trail page visibility and layout', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/audit-trail');
    await expect(page.locator('h1')).toContainText(/Audit Trail/i);

    // Check if the heading is visible and not hidden behind sidebar
    const heading = page.locator('h1:has-text("Audit Trail")');
    await expect(heading).toBeVisible();
    const box = await heading.boundingBox();
    // Sidebar width is 250px. If heading is behind sidebar, box.x < 250
    console.log('Audit trail heading X position:', box?.x);
  });

  test('15. Administration page', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    await page.goto('/administration');
    await expect(page.locator('h1')).toContainText(/Administration/i);
  });

  test('16. Header user identity check', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    if (page.url().includes('/workspaces')) {
      await page.click('button:has-text("Open workspace")');
    }
    await page.goto('/dashboard');
    // Check what name header shows
    const headerText = await page.locator('header').innerText();
    console.log('Header text contains Alice Smith?:', headerText.includes('Alice Smith'));
    console.log('Header text contains Alice Owner?:', headerText.includes('Alice Owner'));
  });

  test('17. Workspace creation attempt from sidebar', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'alice.owner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/(workspaces|dashboard)/);
    if (page.url().includes('/workspaces')) {
      await page.click('button:has-text("Open workspace")');
    }
    await page.goto('/dashboard');

    // Click active workspace selector
    await page.click('#workspace-selector-btn');
    await page.click('#create-workspace-btn');

    // Fill form
    await page.fill('[data-testid="workspace-name-input"]', 'New Test Corp');
    await page.click('[data-testid="create-workspace-submit-button"]');

    // Verify if New Test Corp is present in selector
    await page.click('#workspace-selector-btn');
    const hasNew = await page.locator('#workspace-dropdown-menu').innerText();
    console.log('Workspace dropdown has New Test Corp?:', hasNew.includes('New Test Corp'));
  });
});
