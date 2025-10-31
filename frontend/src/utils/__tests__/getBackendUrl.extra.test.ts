/* eslint-disable @typescript-eslint/no-var-requires */
import { getBackendUrl } from '../getBackendUrl';

describe('getBackendUrl (env variants)', () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...oldEnv };
  });

  it('falls back to DEFAULT_BACKEND_URL when no env vars set', () => {
    delete process.env.VITE_BACKEND_URL;
    delete process.env.VITE_API_URL;
    delete process.env.BACKEND_URL;
    delete process.env.API_URL;

    const url = getBackendUrl();
    expect(typeof url).toBe('string');
    expect(url).toMatch(/localhost|http/);
  });

  it('prefers VITE_BACKEND_URL from process.env in Jest', () => {
    process.env.VITE_BACKEND_URL = 'https://env-backend.example';
    const url = getBackendUrl();
    expect(url).toBe('https://env-backend.example');
  });

  it('falls back to API_URL when only API_URL provided', () => {
    delete process.env.VITE_BACKEND_URL;
    process.env.API_URL = 'https://api.example';
    const url = getBackendUrl();
    expect(url).toBe('https://api.example');
  });
});
