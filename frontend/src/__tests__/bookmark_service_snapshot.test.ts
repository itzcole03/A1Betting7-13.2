import { bookmarkService } from '../services/BookmarkService';

describe('BookmarkService snapshot fallback', () => {
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Mock localStorage so getItem always returns null (simulating test scenario in integration suite)
    const store: Record<string, string> = {};
    global.localStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: jest.fn((k: string) => { delete store[k]; }),
      clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
      key: jest.fn((i: number) => Object.keys(store)[i] || null),
      get length() { return Object.keys(store).length; }
    } as any;

    // Ensure clean slate
    bookmarkService.clearAllBookmarks();
  });

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage;
    bookmarkService.clearAllBookmarks();
  });

  it('returns bookmarks via snapshot when storage returns null', () => {
    // Add two bookmarks (these calls populate lastSnapshot internally)
    bookmarkService.addBookmark('snap-1', { player: 'Player One', sport: 'NBA' });
    bookmarkService.addBookmark('snap-2', { player: 'Player Two', sport: 'MLB' });

    const all = bookmarkService.getAllBookmarks();
    expect(all.map(b => b.opportunityId).sort()).toEqual(['snap-1', 'snap-2']);
    const m1 = all.find(b => b.opportunityId === 'snap-1');
    expect(m1?.metadata?.player).toBe('Player One');
  });

  it('preserves snapshot after invalid import attempt', () => {
    bookmarkService.addBookmark('keep-1');
    const before = bookmarkService.getAllBookmarks();
    expect(before.length).toBe(1);

    // Invalid JSON; should not wipe snapshot
    const result = bookmarkService.importBookmarks('not-json');
    expect(result.success).toBe(false);

    const after = bookmarkService.getAllBookmarks();
    expect(after.length).toBe(1);
    expect(after[0].opportunityId).toBe('keep-1');
  });

  it('clears snapshot on clearAllBookmarks', () => {
    bookmarkService.addBookmark('wipe-me');
    expect(bookmarkService.getAllBookmarks().length).toBe(1);
    bookmarkService.clearAllBookmarks();
    expect(bookmarkService.getAllBookmarks().length).toBe(0);
  });
});
