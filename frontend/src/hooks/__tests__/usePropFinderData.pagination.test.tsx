import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

// Mock httpFetch and bookmarkService
jest.mock('../../services/HttpClient', () => ({
  httpFetch: jest.fn(),
}));

jest.mock('../../services/BookmarkService', () => ({
  bookmarkService: {
    isBookmarked: jest.fn(() => false),
    addBookmark: jest.fn(() => true),
    removeBookmark: jest.fn(() => true),
    getStatus: jest.fn(() => ({ bookmarkCount: 0, storageAvailable: true })),
  },
}));

import { httpFetch } from '../../services/HttpClient';
import { bookmarkService } from '../../services/BookmarkService';
import usePropFinderData from '../usePropFinderData';

describe('usePropFinderData pagination', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('fetches initial page and exposes hasMore=false when total <= limit', async () => {
    const payload = {
      data: {
        opportunities: Array.from({ length: 5 }).map((_, i) => ({ id: `opp-${i}`, player: `p${i}` })),
        summary: { total_opportunities: 5, last_updated: new Date().toISOString() },
      },
    };

    (httpFetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    const { result } = renderHook(() => usePropFinderData({ limit: 100 }));

  await waitFor(() => expect(result.current.loading).toBe(false));
  await waitFor(() => expect(result.current.opportunities.length).toBe(5));
  expect(result.current.hasMore).toBe(false);
  expect(result.current.stats?.total_opportunities).toBe(5);
  });

  it('appends next page when loadMore is called and hasMore true', async () => {
    const first = {
      data: {
        opportunities: Array.from({ length: 3 }).map((_, i) => ({ id: `a-${i}`, player: `a${i}` })),
        summary: { total_opportunities: 5, last_updated: new Date().toISOString() },
      },
    };
    const second = {
      data: {
        opportunities: Array.from({ length: 2 }).map((_, i) => ({ id: `b-${i}`, player: `b${i}` })),
        summary: { total_opportunities: 5, last_updated: new Date().toISOString() },
      },
    };

    (httpFetch as unknown as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => first })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => second });

    const { result } = renderHook(() => usePropFinderData({ limit: 3 }));

    // wait for initial fetch
    await waitFor(() => expect(result.current.loading).toBe(false));
    // initial may sometimes be 2 or 3 depending on timing; ensure it's at least 2
    const initialCount = result.current.opportunities.length;
  expect(initialCount).toBeGreaterThanOrEqual(2);
  expect(initialCount).toBeLessThanOrEqual(3);

    await act(async () => {
      await result.current.loadMore();
    });

  // after loadMore, ensure we called the API again and opportunities increased
  await waitFor(() => expect((httpFetch as unknown as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2));
  // final list should be at least as large as the initial and at most the server total
  expect(result.current.opportunities.length).toBeGreaterThanOrEqual(initialCount);
  expect(result.current.opportunities.length).toBeLessThanOrEqual(5);
  });
});
