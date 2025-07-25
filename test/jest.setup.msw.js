// Polyfill TextEncoder/TextDecoder for Node < 18
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { enhancedBetsEmptyResponse, handlers } from "./msw-handlers";

const server = setupServer(...handlers);
global.server = server;

beforeEach(() => {
  // Check if the current test is the empty state E2E test
  const currentTest = expect.getState().currentTestName;
  if (currentTest && currentTest.includes("App E2E - Empty State")) {
    global.server.use(
      http.get(/\/enhanced-bets/, () => {
        return HttpResponse.json(enhancedBetsEmptyResponse);
      })
    );
  }
});

beforeAll(() => global.server.listen());
afterEach(() => global.server.resetHandlers());
afterAll(() => global.server.close());
