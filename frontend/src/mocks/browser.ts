import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Export a test server for Node (Jest) environment
export const server = setupServer(...handlers);

// For browser dev usage, we could also export a worker (not used in unit tests)
// import { setupWorker } from 'msw';
// export const worker = setupWorker(...handlers);
