// Jest E2E setup: start MSW server for all E2E tests
import { server } from './test/msw-server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
