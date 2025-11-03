// backendStarter is a minimal module; ensure it loads without side-effects
describe('backendStarter module', () => {
  it('imports without throwing', async () => {
    const mod = await import('../backendStarter');
    expect(mod).toBeDefined();
  });
});
