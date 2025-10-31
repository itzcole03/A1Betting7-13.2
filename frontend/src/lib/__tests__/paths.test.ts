import { COMPONENT_PATHS, getComponentPath } from '../paths';

describe('lib/paths', () => {
  test('getComponentPath builds expected path', () => {
    const p = getComponentPath('UI', 'Button');
    expect(p).toBe(`${COMPONENT_PATHS.UI}/Button`);
  });
});
