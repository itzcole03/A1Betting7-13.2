import type { Page, Route } from '@playwright/test';

// Lightweight helpers to register route.fulfill mocks in Playwright tests.

type MockOverrides = {
  '/api/propfinder/opportunities'?: any;
  '/api/props'?: any;
  '/api/predictions'?: any;
  [path: string]: any;
};

export async function registerDefaultMocks(page: Page, overrides: MockOverrides = {}) {
  // Default responses mirror the mock-server.cjs shapes.
  const defaultProps = overrides['/api/props'] || {
    success: true,
    data: [
      {
        id: 'p-alice',
        player: 'Alice Example',
        team: 'ALC',
        stat_type: 'points',
        market: 'player_points',
        start_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        confidence: 72,
        line: 24.5,
      },
    ],
  };

  const defaultOpportunities = overrides['/api/propfinder/opportunities'] || {
    success: true,
    data: defaultProps.data,
    count: defaultProps.data.length,
  };

  const defaultPredictions = overrides['/api/predictions'] || {
    success: true,
    data: [
      { id: 'pr-1', prop_id: 'p-alice', player: 'Alice Example', confidence: 72, source: 'mock' },
    ],
  };

  // route for opportunities
  await page.route('**/api/propfinder/opportunities**', (route: Route) => {
    const body = JSON.stringify(defaultOpportunities);
    route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  // route for props
  await page.route('**/api/props**', (route: Route) => {
    const body = JSON.stringify(defaultProps);
    route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  // route for predictions
  await page.route('**/api/predictions**', (route: Route) => {
    const body = JSON.stringify(defaultPredictions);
    route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  // Allow tests to override arbitrary endpoints by registering their own
  // route handlers — they can call page.route in their beforeEach and use
  // the same patterns.
}

export async function mockEndpoint(page: Page, pathGlob: string, response: any, status = 200) {
  await page.route(pathGlob, async (route: Route) => {
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) });
  });
}

export default { registerDefaultMocks, mockEndpoint };
