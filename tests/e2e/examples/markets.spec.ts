import { expect, test } from "@playwright/test";
import { registerDefaultMocks } from "../route-mocks";

test("Markets/books render for a prop", async ({ page }) => {
  await registerDefaultMocks(page);
  await page.goto("/props/p-alice");
  // The page should request /api/markets?prop_id=p-alice; mock returns MockBook
  await expect(page.locator("text=MockBook")).toBeVisible();
});
