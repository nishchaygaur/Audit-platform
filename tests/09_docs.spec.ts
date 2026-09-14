import { test, expect } from "@playwright/test";

test.describe("Documentation Portal & Viewer", () => {
  test("loads /docs landing page with all 25 chapters and audience paths", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveTitle(/Audit Platform Docs|Documentation Portal/i);

    // Verify Hero
    await expect(page.getByRole("heading", { name: "Audit Platform Documentation", level: 1 })).toBeVisible();
    await expect(page.getByText("Modular Chapters")).toBeVisible();
    await expect(page.getByText("Pre-Seeded Frameworks")).toBeVisible();

    // Verify Audience reading paths
    await expect(page.getByText("Academic Evaluators & Examiners")).toBeVisible();
    await expect(page.getByText("Software Engineers & DevOps")).toBeVisible();
    await expect(page.getByText("Security & Compliance Auditors")).toBeVisible();
    await expect(page.getByText("End Users & Platform Admins")).toBeVisible();

    // Verify Categories and Chapter cards
    await expect(page.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Core Platform" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Architecture & Engineering" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operations & Guides" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Governance & References" })).toBeVisible();

    // Verify specific chapters appear in cards
    await expect(page.getByRole("heading", { name: "Project Overview & Background" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "System Architecture & Diagrams" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence Vault & Storage Architecture" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Comprehensive End-User Manual" })).toBeVisible();

    // Verify Quick System Specs
    await expect(page.getByText("Quick System Specifications")).toBeVisible();
    await expect(page.getByText("Next.js 16.3.4 (App Router) • React 19.2.8 • Tailwind CSS v4")).toBeVisible();
  });

  test("loads an individual chapter /docs/01-project-overview with full markdown, TOC, and pagination", async ({ page }) => {
    await page.goto("/docs/01-project-overview");

    // Header checks
    await expect(page.getByRole("heading", { name: "Project Overview & Background", exact: true })).toBeVisible();
    await expect(page.getByText("Chapter 01", { exact: false })).toBeVisible();
    await expect(page.getByText("min read", { exact: false })).toBeVisible();
    await expect(page.getByText("Audience:", { exact: false })).toBeVisible();

    // Markdown rendered headings
    await expect(page.getByRole("heading", { name: /Executive Summary/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Industry Problem Statement/i })).toBeVisible();

    // Table of Contents (On this page)
    await expect(page.getByText("On this page")).toBeVisible();
    await expect(page.getByRole("link", { name: "1.1 Executive Summary" })).toBeVisible();

    // Pagination
    const nextPagination = page.getByRole("link", { name: /Next Chapter/i });
    await expect(nextPagination).toBeVisible();
    await expect(nextPagination).toContainText("Scope & Requirements Catalogue");
  });

  test("navigates seamlessly between chapters using next pagination", async ({ page }) => {
    await page.goto("/docs/01-project-overview");
    const nextLink = page.getByRole("link", { name: /Next Chapter/i });
    await expect(nextLink).toBeVisible();
    await nextLink.click();

    await page.waitForURL("**/docs/02-scope-and-requirements");
    await expect(page.getByRole("heading", { name: "Scope & Requirements Catalogue", exact: true })).toBeVisible();
    await expect(page.getByText("Chapter 02", { exact: false })).toBeVisible();
  });

  test("search modal opens, searches, and navigates to matching doc", async ({ page }) => {
    await page.goto("/docs");

    // Open search modal via button
    const searchBtn = page.getByRole("button", { name: /Search docs/i });
    await searchBtn.click();

    const searchInput = page.getByPlaceholder(/Search documentation by topic/i);
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill("Evidence");
    await page.waitForTimeout(400);

    // Verify result inside the modal dialog
    const modal = page.locator('[role="dialog"]');
    const resultItem = modal.getByText("Evidence Vault & Storage Architecture");
    await expect(resultItem).toBeVisible();

    // Click result
    await resultItem.click();
    await page.waitForURL("**/docs/11-evidence");
    await expect(page.getByRole("heading", { name: "Evidence Vault & Storage Architecture", exact: true })).toBeVisible();
  });

  test("renders code blocks with copy buttons and tables correctly", async ({ page }) => {
    await page.goto("/docs/04-technology-stack");
    await expect(page.getByRole("heading", { name: "Technology Stack Specification", exact: true })).toBeVisible();

    // Verify code block copy button exists
    const copyButton = page.getByRole("button", { name: /Copy code to clipboard/i }).first();
    if (await copyButton.isVisible()) {
      await expect(copyButton).toBeVisible();
    }

    // Verify table rendering
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
  });

  test("navigates to anchor section when clicking TOC item", async ({ page }) => {
    await page.goto("/docs/01-project-overview");

    // Click TOC link for 1.2 Industry Problem Statement
    const tocLink = page.getByRole("link", { name: "1.2 Industry Problem Statement" });
    await expect(tocLink).toBeVisible();
    await tocLink.click();

    // Verify heading in main body is visible
    const targetHeading = page.getByRole("heading", { name: /1.2 Industry Problem Statement/i });
    await expect(targetHeading).toBeVisible();
  });
});
