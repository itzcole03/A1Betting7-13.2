import { expect, test } from "@playwright/test";
import { registerDefaultMocks } from "../route-mocks";

test("Predictions list renders mocked prediction", async ({ page }) => {
  await registerDefaultMocks(page);
  await page.goto("/");
  // Assert that mocked prediction appears in UI (text match)
  await expect(page.locator("text=Alice Example")).toBeVisible();
});
