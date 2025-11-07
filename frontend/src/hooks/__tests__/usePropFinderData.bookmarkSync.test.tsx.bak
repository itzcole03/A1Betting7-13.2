import { act, render } from '@testing-library/react';
import React from 'react';
import usePropFinderData from '../usePropFinderData';

// Mock enhancedLogger to avoid noisy logs
jest.mock('@/utils/enhancedLogger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

// Mock HttpClient so bookmark sync can run without hitting real network logic
jest.mock('../../services/HttpClient', () => ({
  httpFetch: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ success: true }),
    })
  ),
}));

import { httpFetch } from '../../services/HttpClient';

describe('usePropFinderData bookmark sync', () => {
  const ORIGINAL_LOCALSTORAGE = global.localStorage;

  beforeEach(() => {
    jest.resetAllMocks();

    // mock localStorage
    let store: Record<string, string> = {};
    global.localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: 0,
    } as any;
  });

  afterEach(() => {
    global.localStorage = ORIGINAL_LOCALSTORAGE;
  });

  it('does not attempt backend bookmark sync when userId becomes available', async () => {
    // Seed legacy local bookmarks queue (pre-Phase 4.2 format) to ensure the hook
    // gracefully ignores backend sync until the API is implemented.
    const localBookmarks = ['prop-1', 'prop-2'];
    global.localStorage.setItem('local_propfinder_bookmarks', JSON.stringify(localBookmarks));

    // Create a test component which uses the hook and accepts userId prop
    const TestComponent: React.FC<{ userId: string | null }> = ({ userId }) => {
      usePropFinderData({ userId } as any);
      return null;
    };

    const { rerender } = render(<TestComponent userId={null} />);

    // Now provide userId to trigger sync effect
    await act(async () => {
      rerender(<TestComponent userId={'user-123'} />);
      // Wait a tick for effect to run
      await Promise.resolve();
    });

    // Expect no POST attempts because backend sync is intentionally deferred.
    const calls = (httpFetch as jest.Mock).mock.calls;
    const bookmarkCalls = calls.filter(([url, options]: [string, RequestInit]) => {
      const requestUrl = typeof url === 'string' ? url : '';
      const method = (options?.method || 'GET').toUpperCase();
      return requestUrl.includes('/api/propfinder/bookmark') && method === 'POST';
    });

    expect(bookmarkCalls.length).toBe(0);

    // local_propfinder_bookmarks should remain untouched until backend sync ships.
    expect(global.localStorage.getItem('local_propfinder_bookmarks')).toBe(JSON.stringify(localBookmarks));
  });
});
