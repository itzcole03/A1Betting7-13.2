import { expect, test } from "@playwright/test";
import { registerDefaultMocks } from "../route-mocks";

test.describe("Mock usage example", () => {
  test.beforeEach(async ({ page }) => {
    // Install default mocks for the key API endpoints
    await registerDefaultMocks(page);
  });

  test("homepage shows mocked player from default mock", async ({ page }) => {
    // Navigate to baseURL configured in playwright.config.ts (can be overridden with E2E_BASE_URL)
    await page.goto("/");

    // The default mock returns a player named 'Alice Example' — assert it appears
    const alice = page.locator("text=Alice Example");
    await expect(alice).toBeVisible({ timeout: 5000 });
  });
});
