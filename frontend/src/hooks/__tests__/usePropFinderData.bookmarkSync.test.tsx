import React from 'react';
import { render, act } from '@testing-library/react';
import usePropFinderData from '../usePropFinderData';

// Mock enhancedLogger to avoid noisy logs
jest.mock('@/utils/enhancedLogger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

describe('usePropFinderData bookmark sync', () => {
  const ORIGINAL_FETCH = global.fetch;
  const ORIGINAL_LOCALSTORAGE = global.localStorage;

  beforeEach(() => {
    jest.resetAllMocks();
    // mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
    ) as any;

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
    global.fetch = ORIGINAL_FETCH;
    global.localStorage = ORIGINAL_LOCALSTORAGE;
  });

  it('posts local bookmarks to server when userId becomes available and clears local stash', async () => {
    // Seed local bookmarks
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

    // Expect fetch to have been called for the two bookmark POSTs
    const calls = (global.fetch as jest.Mock).mock.calls;
    const bookmarkCalls = calls.filter((call: any[]) => {
      const url = typeof call[0] === 'string' ? call[0] : call[0]?.url ?? '';
      const opts = call[1] ?? {};
      return url.includes('/api/propfinder/bookmark') || (opts.method || '').toUpperCase() === 'POST';
    });

    expect(bookmarkCalls.length).toBe(2);

    // local_propfinder_bookmarks should be cleared
    expect(global.localStorage.getItem('local_propfinder_bookmarks')).toBe(null);
  });
});
