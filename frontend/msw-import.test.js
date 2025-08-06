import { setupServer } from 'msw/node';

test('msw/node import works', () => {
  expect(typeof setupServer).toBe('function');
});
