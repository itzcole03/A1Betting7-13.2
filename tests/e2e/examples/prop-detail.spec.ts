import { expect, test } from "@playwright/test";
import { registerDefaultMocks } from "../route-mocks";

test("Prop detail page shows mocked prop info", async ({ page }) => {
  await registerDefaultMocks(page);
  // Navigate to a prop detail route; app should request /api/props/:id
  await page.goto("/props/p-alice");
  await expect(page.locator("text=Alice Example")).toBeVisible();
  await expect(page.locator("text=24.5")).toBeVisible();
});
