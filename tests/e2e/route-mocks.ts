import type { Page, Route } from "@playwright/test";

export async function registerDefaultMocks(
  page: Page,
  overrides: Record<string, any> = {}
) {
  const defaultProps = overrides["/api/props"] || {
    success: true,
    data: [
      {
        id: "p-alice",
        player: "Alice Example",
        team: "ALC",
        stat_type: "points",
        market: "player_points",
        start_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        confidence: 72,
        line: 24.5,
      },
    ],
  };

  const defaultOpportunities = overrides["/api/propfinder/opportunities"] || {
    success: true,
    data: defaultProps.data,
    count: defaultProps.data.length,
  };

  const defaultPredictions = overrides["/api/predictions"] || {
    success: true,
    data: [
      {
        id: "pr-1",
        prop_id: "p-alice",
        player: "Alice Example",
        confidence: 72,
        source: "mock",
      },
    ],
  };

  const defaultLineups = overrides["/api/lineup"] || {
    success: true,
    data: [
      {
        id: "l-1",
        user_id: "u-1",
        name: "sample-lineup",
        selections: [defaultProps.data[0].id],
      },
    ],
  };

  await page.route("**/api/propfinder/opportunities**", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultOpportunities),
    });
  });

  await page.route("**/api/props**", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultProps),
    });
  });

  // Prop detail
  await page.route("**/api/props/*", (route: Route) => {
    // Extract id from URL
    const url = route.request().url();
    const idMatch = url.match(/\/api\/props\/(.+)$/);
    const id = idMatch ? idMatch[1] : defaultProps.data[0].id;
    const prop =
      defaultProps.data.find((p: any) => p.id === id) || defaultProps.data[0];
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: prop }),
    });
  });

  await page.route("**/api/predictions**", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultPredictions),
    });
  });

  await page.route("**/api/lineup**", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultLineups),
    });
  });

  // Markets/books
  await page.route("**/api/markets**", (route: Route) => {
    // respond with books for the first mocked prop
    const books = (defaultProps.data[0] && defaultProps.data[0].books) || [];
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: books }),
    });
  });
}

export async function mockEndpoint(
  page: Page,
  pathGlob: string,
  response: any,
  status = 200
) {
  await page.route(pathGlob, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

export default { registerDefaultMocks, mockEndpoint };
