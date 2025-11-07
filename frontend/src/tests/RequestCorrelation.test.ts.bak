import { httpFetch } from '../services/HttpClient';

// Mock fetch for Jest
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
  if (originalFetch) {
    global.fetch = originalFetch;
  } else {
    // @ts-expect-error allow cleanup when fetch undefined
    delete global.fetch;
  }
});

test('Request correlation IDs are properly generated and injected', async () => {
  // Setup
  const mockResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
  (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

  // Execute
  const url = '/api/test-endpoint';
  await httpFetch(url);

  // Verify
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [calledUrl, options] = (global.fetch as jest.Mock).mock.calls[0];
  expect(calledUrl).toBe(url);
  expect(options.headers).toBeDefined();

  // Check that request ID header is present and properly formatted
  const requestIdHeader = options.headers['X-Request-ID'];
  expect(requestIdHeader).toBeDefined();
  expect(requestIdHeader).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});
