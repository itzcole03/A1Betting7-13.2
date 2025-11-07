/**
 * Test suite for PropFinder EV integration components
 * Tests EV formatting utilities, BookmarkService, and sorting functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  formatEvPercent,
  getEvColorClass,
  getEvBadgeColorClass,
  shouldShowEvBadge,
  formatEvValue,
  createEvTooltip,
  getEvDisplayPriority,
  isValuePlay,
  EVDisplayConfig
} from '../utils/evFormatting';
import { bookmarkService, BookmarkData } from '../services/BookmarkService';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('EV Formatting Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear localStorage mock data
    localStorageMock.clear();
    // Clear service state
    bookmarkService.clearAllBookmarks();
  });

  describe('formatEvPercent', () => {
    it('should format positive EV with plus sign and percent', () => {
      expect(formatEvPercent(12.34)).toBe('+12.3%');
      expect(formatEvPercent(8.0)).toBe('+8.0%');
    });

    it('should format negative EV without plus sign', () => {
      expect(formatEvPercent(-5.67)).toBe('-5.7%');
      expect(formatEvPercent(-0.1)).toBe('-0.1%');
    });

    it('should format zero EV correctly', () => {
      expect(formatEvPercent(0)).toBe('0.0%'); // Zero doesn't get + sign by default
    });

    it('should handle null/undefined values', () => {
      expect(formatEvPercent(null)).toBe('--');
      expect(formatEvPercent(undefined)).toBe('--');
      expect(formatEvPercent(NaN)).toBe('--');
    });

    it('should respect custom configuration', () => {
      const config: Partial<EVDisplayConfig> = {
        showPositiveSign: false,
        showPercentSymbol: false,
        decimalPlaces: 2
      };
      expect(formatEvPercent(12.345, config)).toBe('12.35');
      expect(formatEvPercent(-5.67, config)).toBe('-5.67');
    });
  });

  describe('getEvColorClass', () => {
    it('should return correct color classes for EV ranges', () => {
      expect(getEvColorClass(10.0)).toBe('text-green-400'); // Excellent (8%+)
      expect(getEvColorClass(8.0)).toBe('text-green-400');
      expect(getEvColorClass(6.0)).toBe('text-amber-400'); // Good (4-7.99%)
      expect(getEvColorClass(4.0)).toBe('text-amber-400');
      expect(getEvColorClass(2.0)).toBe('text-yellow-400'); // Positive (0%+)
      expect(getEvColorClass(0.0)).toBe('text-yellow-400');
      expect(getEvColorClass(-2.0)).toBe('text-gray-500'); // Negative
    });

    it('should handle null/undefined values', () => {
      expect(getEvColorClass(null)).toBe('text-gray-400');
      expect(getEvColorClass(undefined)).toBe('text-gray-400');
      expect(getEvColorClass(NaN)).toBe('text-gray-400');
    });

    it('should respect custom color scale', () => {
      const config: Partial<EVDisplayConfig> = {
        colorScale: {
          excellent: 10.0,
          good: 5.0,
          neutral: 1.0
        }
      };
      expect(getEvColorClass(12.0, config)).toBe('text-green-400');
      expect(getEvColorClass(7.0, config)).toBe('text-amber-400');
      expect(getEvColorClass(2.0, config)).toBe('text-yellow-400');
      expect(getEvColorClass(0.5, config)).toBe('text-gray-500');
    });
  });

  describe('getEvBadgeColorClass', () => {
    it('should return correct badge colors', () => {
      expect(getEvBadgeColorClass(10.0)).toBe('bg-green-600');
      expect(getEvBadgeColorClass(6.0)).toBe('bg-amber-600');
      expect(getEvBadgeColorClass(2.0)).toBe('bg-gray-600');
      expect(getEvBadgeColorClass(-2.0)).toBe('bg-gray-600');
    });

    it('should handle null values', () => {
      expect(getEvBadgeColorClass(null)).toBe('bg-gray-600');
    });
  });

  describe('shouldShowEvBadge', () => {
    it('should show badge for EV above threshold', () => {
      expect(shouldShowEvBadge(5.0, 4.0)).toBe(true);
      expect(shouldShowEvBadge(4.0, 4.0)).toBe(true);
      expect(shouldShowEvBadge(3.9, 4.0)).toBe(false);
    });

    it('should use default threshold of 4%', () => {
      expect(shouldShowEvBadge(5.0)).toBe(true);
      expect(shouldShowEvBadge(3.0)).toBe(false);
    });

    it('should handle null values', () => {
      expect(shouldShowEvBadge(null)).toBe(false);
      expect(shouldShowEvBadge(undefined)).toBe(false);
    });
  });

  describe('formatEvValue', () => {
    it('should format positive values with plus sign', () => {
      expect(formatEvValue(2.45)).toBe('+$2.45');
      expect(formatEvValue(10.0)).toBe('+$10.00');
    });

    it('should format negative values with minus sign', () => {
      expect(formatEvValue(-1.23)).toBe('-$1.23');
    });

    it('should format zero correctly', () => {
      expect(formatEvValue(0)).toBe('$0.00');
    });

    it('should handle null values', () => {
      expect(formatEvValue(null)).toBe('--');
      expect(formatEvValue(undefined)).toBe('--');
    });

    it('should respect decimal places parameter', () => {
      expect(formatEvValue(2.456, 1)).toBe('+$2.5');
      expect(formatEvValue(-1.234, 3)).toBe('-$1.234');
    });
  });

  describe('createEvTooltip', () => {
    it('should create basic tooltip for EV percentage', () => {
      const tooltip = createEvTooltip(5.5);
      expect(tooltip).toContain('Expected Value: +5.5%');
      expect(tooltip).toContain('Positive EV indicates expected profit');
    });

    it('should include EV value when provided', () => {
      const tooltip = createEvTooltip(5.5, 2.75);
      expect(tooltip).toContain('(+$2.75 per bet)');
    });

    it('should handle negative EV', () => {
      const tooltip = createEvTooltip(-3.2);
      expect(tooltip).toContain('Expected Value: -3.2%');
      expect(tooltip).toContain('Negative EV indicates expected loss');
    });

    it('should handle zero EV', () => {
      const tooltip = createEvTooltip(0);
      expect(tooltip).toContain('Breakeven expected value');
    });

    it('should handle null values', () => {
      const tooltip = createEvTooltip(null);
      expect(tooltip).toBe('Expected Value not calculated');
    });
  });

  describe('getEvDisplayPriority', () => {
    it('should return higher priority for higher EV', () => {
      expect(getEvDisplayPriority(8.0)).toBeGreaterThan(getEvDisplayPriority(4.0));
      expect(getEvDisplayPriority(4.0)).toBeGreaterThan(getEvDisplayPriority(0.0));
    });

    it('should add bonus for outlier status', () => {
      expect(getEvDisplayPriority(5.0, true)).toBeGreaterThan(getEvDisplayPriority(5.0, false));
      expect(getEvDisplayPriority(5.0, true)).toBe(15.0); // 5.0 + 10 bonus
    });

    it('should handle null values gracefully', () => {
      expect(getEvDisplayPriority(null)).toBe(0);
      expect(getEvDisplayPriority(null, true)).toBe(10); // Outlier bonus only
    });
  });

  describe('isValuePlay', () => {
    it('should return true for backend outlier flag', () => {
      expect(isValuePlay(3.0, true, 5.0)).toBe(true); // EV below threshold but outlier flag
    });

    it('should return true for EV above custom threshold', () => {
      expect(isValuePlay(6.0, false, 5.0)).toBe(true);
      expect(isValuePlay(5.0, false, 5.0)).toBe(true);
    });

    it('should return false for EV below threshold without outlier flag', () => {
      expect(isValuePlay(4.0, false, 5.0)).toBe(false);
      expect(isValuePlay(4.0, undefined, 5.0)).toBe(false);
    });

    it('should use default threshold', () => {
      expect(isValuePlay(6.0)).toBe(true);
      expect(isValuePlay(4.0)).toBe(false);
    });

    it('should handle null values', () => {
      expect(isValuePlay(null, false, 5.0)).toBe(false);
    });
  });
});

describe('BookmarkService', () => {
  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    // Clear service state
    bookmarkService.clearAllBookmarks();
  });

  afterEach(() => {
    bookmarkService.clearAllBookmarks();
  });

  describe('Basic Operations', () => {
    it('should add and check bookmarks', () => {
      expect(bookmarkService.isBookmarked('test-1')).toBe(false);
      
      const success = bookmarkService.addBookmark('test-1', {
        player: 'Test Player',
        market: 'Points',
        sport: 'NBA',
        evPercent: 5.5
      });
      
      expect(success).toBe(true);
      expect(bookmarkService.isBookmarked('test-1')).toBe(true);
      expect(bookmarkService.getBookmarkCount()).toBe(1);
    });

    it('should remove bookmarks', () => {
      bookmarkService.addBookmark('test-1');
      expect(bookmarkService.isBookmarked('test-1')).toBe(true);
      
      const success = bookmarkService.removeBookmark('test-1');
      expect(success).toBe(true);
      expect(bookmarkService.isBookmarked('test-1')).toBe(false);
      expect(bookmarkService.getBookmarkCount()).toBe(0);
    });

    it('should toggle bookmarks', () => {
      expect(bookmarkService.toggleBookmark('test-1')).toBe(true);
      expect(bookmarkService.isBookmarked('test-1')).toBe(true);
      
      expect(bookmarkService.toggleBookmark('test-1')).toBe(false);
      expect(bookmarkService.isBookmarked('test-1')).toBe(false);
    });

    it('should return all bookmark IDs', () => {
      bookmarkService.addBookmark('test-1');
      bookmarkService.addBookmark('test-2');
      
      const ids = bookmarkService.getAllBookmarkIds();
      expect(ids).toContain('test-1');
      expect(ids).toContain('test-2');
      expect(ids.length).toBe(2);
    });

    it('should clear all bookmarks', () => {
      bookmarkService.addBookmark('test-1');
      bookmarkService.addBookmark('test-2');
      expect(bookmarkService.getBookmarkCount()).toBe(2);
      
      const success = bookmarkService.clearAllBookmarks();
      expect(success).toBe(true);
      expect(bookmarkService.getBookmarkCount()).toBe(0);
    });
  });

  describe('Metadata Handling', () => {
    it('should store and retrieve bookmark metadata', () => {
      const metadata = {
        player: 'LeBron James',
        market: 'Points',
        sport: 'NBA',
        evPercent: 8.5
      };
      
      // Add bookmark
      const addResult = bookmarkService.addBookmark('lebron-points', metadata);
      expect(addResult).toBe(true);
      
      // Verify it's bookmarked
      expect(bookmarkService.isBookmarked('lebron-points')).toBe(true);
      
      // Check localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Get all bookmarks and verify metadata
      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks.length).toBeGreaterThan(0);
      
      const bookmark = bookmarks.find(b => b.opportunityId === 'lebron-points');
      expect(bookmark).toBeDefined();
      expect(bookmark?.opportunityId).toBe('lebron-points');
      expect(bookmark?.metadata).toBeDefined();
      expect(bookmark?.metadata?.player).toBe('LeBron James');
      expect(bookmark?.metadata?.evPercent).toBe(8.5);
    });

    it('should update existing bookmark metadata', () => {
      // Add initial bookmark
      bookmarkService.addBookmark('test-1', { player: 'Player A' });
      expect(bookmarkService.isBookmarked('test-1')).toBe(true);
      
      // Update with new metadata
      bookmarkService.addBookmark('test-1', { player: 'Player B', sport: 'NBA' });
      
      const bookmarks = bookmarkService.getAllBookmarks();
      const bookmark = bookmarks.find(b => b.opportunityId === 'test-1');
      
      expect(bookmark).toBeDefined();
      expect(bookmark?.metadata?.player).toBe('Player B');
      expect(bookmark?.metadata?.sport).toBe('NBA');
    });
  });

  describe('Import/Export', () => {
    it('should export bookmarks as JSON', () => {
      // Clear any existing bookmarks
      bookmarkService.clearAllBookmarks();
      
      // Add a test bookmark with metadata
      const success = bookmarkService.addBookmark('test-1', { player: 'Test Player' });
      expect(success).toBe(true);
      
      const exported = bookmarkService.exportBookmarks();
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      
      const testBookmark = parsed.find((b: BookmarkData) => b.opportunityId === 'test-1');
      expect(testBookmark).toBeDefined();
      expect(testBookmark?.opportunityId).toBe('test-1');
      expect(testBookmark?.metadata?.player).toBe('Test Player');
    });

    it('should import bookmarks from JSON', () => {
      const bookmarkData: BookmarkData[] = [
        {
          opportunityId: 'import-1',
          timestamp: Date.now(),
          metadata: { player: 'Imported Player' }
        }
      ];
      
      const result = bookmarkService.importBookmarks(JSON.stringify(bookmarkData));
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(bookmarkService.isBookmarked('import-1')).toBe(true);
    });

    it('should merge imported bookmarks when specified', () => {
      bookmarkService.addBookmark('existing-1');
      
      const importData = [
        { opportunityId: 'import-1', timestamp: Date.now() }
      ];
      
      const result = bookmarkService.importBookmarks(JSON.stringify(importData), true);
      
      expect(result.success).toBe(true);
      expect(bookmarkService.getBookmarkCount()).toBe(2);
      expect(bookmarkService.isBookmarked('existing-1')).toBe(true);
      expect(bookmarkService.isBookmarked('import-1')).toBe(true);
    });

    it('should handle invalid import data', () => {
      const result = bookmarkService.importBookmarks('invalid json');
      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('Service Status', () => {
    it('should return service status', () => {
      const status = bookmarkService.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(typeof status.storageAvailable).toBe('boolean');
      expect(typeof status.bookmarkCount).toBe('number');
      expect(status.backendEnabled).toBe(false); // Not implemented yet
    });
  });

  describe('Backend Integration Stubs', () => {
    it('should have syncToBackend stub that returns unimplemented', async () => {
      const result = await bookmarkService.syncToBackend('user123');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Backend sync not implemented');
    });

    it('should have loadFromBackend stub that returns unimplemented', async () => {
      const result = await bookmarkService.loadFromBackend('user123');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Backend load not implemented');
    });

    it('should have enableAutoSync stub that does nothing', () => {
      expect(() => {
        bookmarkService.enableAutoSync('user123');
      }).not.toThrow();
    });
  });
});

describe('Sorting Integration', () => {
  const mockOpportunities = [
    { id: '1', player: 'Player A', evPercent: 8.5, confidence: 85, arbitrageProfitPct: 2.0 },
    { id: '2', player: 'Player B', evPercent: 4.2, confidence: 70, arbitrageProfitPct: 0 },
    { id: '3', player: 'Player C', evPercent: 12.1, confidence: 90, arbitrageProfitPct: 1.5 },
    { id: '4', player: 'Player D', evPercent: null, confidence: 60, arbitrageProfitPct: 0 },
  ];

  describe('EV Sorting', () => {
    it('should sort opportunities by EV descending', () => {
      const sorted = [...mockOpportunities].sort((a, b) => {
        return (b.evPercent || 0) - (a.evPercent || 0);
      });
      
      expect(sorted[0].id).toBe('3'); // 12.1%
      expect(sorted[1].id).toBe('1'); // 8.5%
      expect(sorted[2].id).toBe('2'); // 4.2%
      expect(sorted[3].id).toBe('4'); // null -> 0%
    });

    it('should sort opportunities by confidence', () => {
      const sorted = [...mockOpportunities].sort((a, b) => {
        return (b.confidence || 0) - (a.confidence || 0);
      });
      
      expect(sorted[0].id).toBe('3'); // 90%
      expect(sorted[1].id).toBe('1'); // 85%
      expect(sorted[2].id).toBe('2'); // 70%
      expect(sorted[3].id).toBe('4'); // 60%
    });

    it('should sort opportunities by arbitrage profit', () => {
      const sorted = [...mockOpportunities].sort((a, b) => {
        return (b.arbitrageProfitPct || 0) - (a.arbitrageProfitPct || 0);
      });
      
      expect(sorted[0].id).toBe('1'); // 2.0%
      expect(sorted[1].id).toBe('3'); // 1.5%
      expect([sorted[2].id, sorted[3].id]).toEqual(expect.arrayContaining(['2', '4'])); // Both 0%
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete EV workflow', () => {
    // Test the complete workflow from EV calculation to bookmark to display
    const opportunity = {
      id: 'workflow-test',
      player: 'Test Player',
      market: 'Points',
      sport: 'NBA',
      evPercent: 7.5,
      isOutlier: false
    };

    // Format EV for display
    const formattedEv = formatEvPercent(opportunity.evPercent);
    expect(formattedEv).toBe('+7.5%');

    // Get color class
    const colorClass = getEvColorClass(opportunity.evPercent);
    expect(colorClass).toBe('text-amber-400'); // Good EV range

    // Check if should show badge
    const showBadge = shouldShowEvBadge(opportunity.evPercent);
    expect(showBadge).toBe(true);

    // Check if is value play
    const valuePlay = isValuePlay(opportunity.evPercent, opportunity.isOutlier, 5.0);
    expect(valuePlay).toBe(true);

    // Bookmark the opportunity
    const bookmarkSuccess = bookmarkService.addBookmark(opportunity.id, {
      player: opportunity.player,
      market: opportunity.market,
      sport: opportunity.sport,
      evPercent: opportunity.evPercent
    });

    expect(bookmarkSuccess).toBe(true);
    expect(bookmarkService.isBookmarked(opportunity.id)).toBe(true);

    // Verify bookmark contains EV data
    const bookmarks = bookmarkService.getAllBookmarks();
    const bookmark = bookmarks.find(b => b.opportunityId === opportunity.id);
    expect(bookmark).toBeDefined();
    expect(bookmark?.metadata?.evPercent).toBe(7.5);

    // Create tooltip
    const tooltip = createEvTooltip(opportunity.evPercent);
    expect(tooltip).toContain('+7.5%');
    expect(tooltip).toContain('expected profit');
  });

  it('should treat edgePct as trigger for EV pill display logic', () => {
    // Simulate an opportunity that only has edgePct (backend snake_case mapping)
    const opportunity = {
      id: 'edge-trigger',
      player: 'Edge Case',
      market: 'Points',
      sport: 'NBA',
      edgePct: 6.2, // expected to map to evPercent-like display logic in UI layer
      isOutlier: false
    } as any;

    // Reuse formatting utilities expecting evPercent – treat edgePct analogously
    const derivedEvPercent = opportunity.edgePct;
    const formatted = formatEvPercent(derivedEvPercent);
    expect(formatted).toBe('+6.2%');
    const showBadge = shouldShowEvBadge(derivedEvPercent);
    expect(showBadge).toBe(true);
  });
});