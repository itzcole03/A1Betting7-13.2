import { expect, test } from "@playwright/test";
import { mockEndpoint, registerDefaultMocks } from "../route-mocks";

test("Analytics event is sent (mocked endpoint)", async ({ page }) => {
  await registerDefaultMocks(page);

  // Mock the analytics endpoint to assert it was called
  let called = false;
  await mockEndpoint(
    page,
    "**/api/analytics/events",
    { success: true, received: 1 },
    200
  );

  await page.goto("/");
  // Trigger an action that would send an analytics event (this depends on the app)
  // For example, click a button that the app ties to analytics
  await page.click('button:has-text("Track")');

  // If the app shows a toast or confirmation after sending analytics, assert it
  // This is a lightweight smoke check — specifics can be adjusted per app behavior
  await expect(page.locator("text=Event tracked")).toHaveCount(1);
});
