/* eslint-disable @typescript-eslint/no-var-requires */
// backendStarter is a minimal module; ensure it loads without side-effects
describe('backendStarter module', () => {
  it('imports without throwing', () => {
    const mod = require('../backendStarter');
    expect(mod).toBeDefined();
  });
});
