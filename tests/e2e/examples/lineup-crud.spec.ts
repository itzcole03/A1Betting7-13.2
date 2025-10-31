import { expect, test } from "@playwright/test";
import { registerDefaultMocks } from "../route-mocks";

test.describe("Lineup CRUD (mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await registerDefaultMocks(page);
  });

  test("can list lineups", async ({ page }) => {
    await page.goto("/lineups");
    await expect(page.locator("text=sample-lineup")).toBeVisible();
  });

  test("can create a lineup (UI flow mocked)", async ({ page }) => {
    await page.goto("/lineups/new");
    // Simulate filling a simple form; selectors depend on app but this is an example
    await page.fill('input[name="name"]', "new-mock-lineup");
    await page.click('button:has-text("Save")');
    // After save the app should show the new lineup name (mocked response may vary)
    await expect(page.locator("text=new-mock-lineup")).toHaveCount(1);
  });
});
