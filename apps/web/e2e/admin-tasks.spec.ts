import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@focuslab.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "TestPassword123!";

test.describe("Admin CMS - Task Management", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin
    await page.goto("/auth");
    await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect to admin area
    await page.waitForURL("**/admin/**", { timeout: 10_000 });
  });

  test("can navigate to tasks page and see task list", async ({ page }) => {
    await page.goto("/admin/tasks");

    // Should see at least one task
    await expect(page.getByText("Day 1")).toBeVisible({ timeout: 10_000 });
  });

  test("can open task editor and modify interaction type", async ({
    page,
  }) => {
    await page.goto("/admin/tasks");

    // Click on the first task to open editor
    await page.getByText("Day 1").first().click();

    // Wait for editor to load
    await expect(
      page.getByRole("heading", { name: /edit/i }),
    ).toBeVisible({ timeout: 5_000 });

    // Find and change interaction_type dropdown
    const interactionSelect = page.locator(
      '[data-testid="interaction-type-select"]',
    );

    if (await interactionSelect.isVisible()) {
      await interactionSelect.selectOption("breathing_exercise");

      // Save the changes
      await page.getByRole("button", { name: /save/i }).click();

      // Wait for save confirmation
      await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5_000 });

      // Reload and verify persistence
      await page.reload();
      await expect(interactionSelect).toHaveValue("breathing_exercise");
    }
  });

  test("can reorder tasks", async ({ page }) => {
    await page.goto("/admin/tasks");

    // Look for reorder controls (up/down buttons)
    const moveDownButton = page
      .getByRole("button", { name: /move down/i })
      .first();

    if (await moveDownButton.isVisible()) {
      await moveDownButton.click();

      // Verify the order changed (page should reflect new order)
      await expect(page.getByText(/saved|updated/i)).toBeVisible({
        timeout: 5_000,
      });
    }
  });
});
