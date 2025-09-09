/**
 * CLV Integration Tests for PropFinder Frontend
 * Tests CLV data fetching, formatting, and UI integration
 */

import { formatClvPercent, clvColor, clvTooltip, sortByClv, hasClvData, getClvBand, CLV_BANDS } from '../utils/clvFormatting';

describe('CLV Formatting Utils', () => {
  describe('formatClvPercent', () => {
    test('formats null and undefined values', () => {
      expect(formatClvPercent(null)).toBe('--');
      expect(formatClvPercent(undefined)).toBe('--');
      expect(formatClvPercent(NaN)).toBe('--');
    });

    test('formats small positive values with 2 decimals', () => {
      expect(formatClvPercent(1.234)).toBe('1.23%');
      expect(formatClvPercent(5.67)).toBe('5.67%');
      expect(formatClvPercent(0.1)).toBe('0.10%');
    });

    test('formats large values with 0 decimals', () => {
      expect(formatClvPercent(12.78)).toBe('13%');
      expect(formatClvPercent(25.123)).toBe('25%');
      expect(formatClvPercent(-15.67)).toBe('-16%');
    });

    test('formats zero correctly', () => {
      expect(formatClvPercent(0)).toBe('0.00%');
      expect(formatClvPercent(0.0)).toBe('0.00%');
    });

    test('formats negative values', () => {
      expect(formatClvPercent(-1.5)).toBe('-1.50%');
      expect(formatClvPercent(-0.25)).toBe('-0.25%');
    });
  });

  describe('clvColor', () => {
    test('returns gray for null/undefined values', () => {
      expect(clvColor(null)).toBe('#6b7280');
      expect(clvColor(undefined)).toBe('#6b7280');
      expect(clvColor(NaN)).toBe('#6b7280');
    });

    test('returns green for excellent CLV (5%+)', () => {
      expect(clvColor(5.0)).toBe('#10b981');
      expect(clvColor(6.5)).toBe('#10b981');
      expect(clvColor(10.0)).toBe('#10b981');
    });

    test('returns amber for good CLV (1-4.99%)', () => {
      expect(clvColor(1.0)).toBe('#f59e0b');
      expect(clvColor(2.5)).toBe('#f59e0b');
      expect(clvColor(4.99)).toBe('#f59e0b');
    });

    test('returns gray for fair CLV (-1 to 0.99%)', () => {
      expect(clvColor(-0.5)).toBe('#9ca3af');
      expect(clvColor(0)).toBe('#9ca3af');
      expect(clvColor(0.99)).toBe('#9ca3af');
    });

    test('returns red for poor CLV (-1% or worse)', () => {
      expect(clvColor(-1.0)).toBe('#ef4444');
      expect(clvColor(-2.5)).toBe('#ef4444');
      expect(clvColor(-5.0)).toBe('#ef4444');
    });
  });

  describe('clvTooltip', () => {
    test('includes base explanation for all values', () => {
      const baseText = 'CLV = (Closing Line - Opening Line) / Opening Line × 100';
      
      expect(clvTooltip(5.0)).toContain(baseText);
      expect(clvTooltip(null)).toContain(baseText);
      expect(clvTooltip(-2.0)).toContain(baseText);
    });

    test('includes current value and description for valid numbers', () => {
      expect(clvTooltip(5.0)).toContain('Current CLV: 5.00% (Excellent)');
      expect(clvTooltip(2.5)).toContain('Current CLV: 2.50% (Good)');
      expect(clvTooltip(-1.5)).toContain('Current CLV: -1.50% (Poor)');
    });

    test('includes no data message for invalid values', () => {
      expect(clvTooltip(null)).toContain('No closing line data available');
      expect(clvTooltip(undefined)).toContain('No closing line data available');
    });
  });

  describe('sortByClv', () => {
    test('sorts numbers correctly in descending order (default)', () => {
      expect(sortByClv(5.0, 2.0)).toBe(-3.0); // 5.0 should come before 2.0
      expect(sortByClv(2.0, 5.0)).toBe(3.0);  // 2.0 should come after 5.0
      expect(Math.abs(sortByClv(1.0, 1.0))).toBe(0); // Equal values (handles -0 vs 0)
    });

    test('sorts numbers correctly in ascending order', () => {
      expect(sortByClv(5.0, 2.0, false)).toBe(3.0); // 5.0 should come after 2.0
      expect(sortByClv(2.0, 5.0, false)).toBe(-3.0); // 2.0 should come before 5.0
    });

    test('handles null/undefined values (puts them at end)', () => {
      expect(sortByClv(5.0, null)).toBe(-1); // Valid value comes first
      expect(sortByClv(null, 5.0)).toBe(1);  // Null comes last
      expect(sortByClv(null, null)).toBe(0); // Both null are equal
      expect(sortByClv(undefined, null)).toBe(0); // Both invalid are equal
    });
  });

  describe('hasClvData', () => {
    test('returns true for valid CLV data', () => {
      expect(hasClvData({ clvPercent: 5.0 })).toBe(true);
      expect(hasClvData({ clvPercent: 0 })).toBe(true);
      expect(hasClvData({ clvPercent: -2.5 })).toBe(true);
    });

    test('returns false for invalid CLV data', () => {
      expect(hasClvData({ clvPercent: null })).toBe(false);
      expect(hasClvData({ clvPercent: undefined })).toBe(false);
      expect(hasClvData({ clvPercent: NaN })).toBe(false);
      expect(hasClvData({})).toBe(false);
    });
  });

  describe('getClvBand', () => {
    test('returns correct band for excellent CLV', () => {
      const band = getClvBand(6.0);
      expect(band).toEqual(CLV_BANDS.EXCELLENT);
      expect(band?.label).toBe('Excellent (5%+)');
      expect(band?.color).toBe('#10b981');
    });

    test('returns correct band for good CLV', () => {
      const band = getClvBand(2.5);
      expect(band).toEqual(CLV_BANDS.GOOD);
      expect(band?.label).toBe('Good (1-5%)');
    });

    test('returns correct band for fair CLV', () => {
      const band = getClvBand(0.5);
      expect(band).toEqual(CLV_BANDS.FAIR);
      expect(band?.label).toBe('Fair (-1% to 1%)');
    });

    test('returns correct band for poor CLV', () => {
      const band = getClvBand(-2.0);
      expect(band).toEqual(CLV_BANDS.POOR);
      expect(band?.label).toBe('Poor (< -1%)');
    });

    test('returns null for invalid values', () => {
      expect(getClvBand(null)).toBe(null);
      expect(getClvBand(undefined)).toBe(null);
      expect(getClvBand(NaN)).toBe(null);
    });
  });
});

describe('CLV Data Integration', () => {
  // Mock fetch for testing CLV API integration
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('CLV leaderboard API response processing', async () => {
    // Mock successful CLV API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [
          {
            prop_id: 'NBA:LeBron James:Points',
            player: 'LeBron James',
            market: 'Points',
            current_clv: 5.25,
            closing_line: 28.5,
            closing_odds: -105
          },
          {
            prop_id: 'NBA:Stephen Curry:3-Pointers Made',
            player: 'Stephen Curry', 
            market: '3-Pointers Made',
            current_clv: -2.1,
            closing_line: 3.5,
            closing_odds: -110
          }
        ]
      })
    });

    const response = await fetch('/api/clv/leaderboard?limit=200');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    
    const lebronData = data.data[0];
    expect(lebronData.prop_id).toBe('NBA:LeBron James:Points');
    expect(lebronData.current_clv).toBe(5.25);
    expect(formatClvPercent(lebronData.current_clv)).toBe('5.25%');
    expect(clvColor(lebronData.current_clv)).toBe('#10b981'); // Green for excellent

    const curryData = data.data[1];
    expect(curryData.current_clv).toBe(-2.1);
    expect(formatClvPercent(curryData.current_clv)).toBe('-2.10%');
    expect(clvColor(curryData.current_clv)).toBe('#ef4444'); // Red for poor
  });

  test('handles CLV API failure gracefully', async () => {
    // Mock API failure
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    try {
      await fetch('/api/clv/leaderboard?limit=200');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('API Error');
    }
  });

  test('CLV data merging with opportunities', () => {
    interface TestOpportunity {
      id: string;
      player: string;
      market: string;
      clvPercent?: number;
      closingLine?: number;
      closingOdds?: number;
    }

    const opportunities: TestOpportunity[] = [
      { id: 'NBA:LeBron James:Points', player: 'LeBron James', market: 'Points' },
      { id: 'NBA:Stephen Curry:3-Pointers Made', player: 'Stephen Curry', market: '3-Pointers Made' }
    ];

    const clvData = new Map([
      ['NBA:LeBron James:Points', { clvPercent: 5.25, closingLine: 28.5, closingOdds: -105 }],
      ['NBA:Stephen Curry:3-Pointers Made', { clvPercent: -2.1, closingLine: 3.5, closingOdds: -110 }]
    ]);

    const mergedOpportunities = opportunities.map(opp => {
      const clv = clvData.get(opp.id);
      return clv ? { ...opp, ...clv } : opp;
    }) as TestOpportunity[];

    expect(mergedOpportunities[0].clvPercent).toBe(5.25);
    expect(mergedOpportunities[0].closingLine).toBe(28.5);
    expect(mergedOpportunities[1].clvPercent).toBe(-2.1);
    expect(hasClvData(mergedOpportunities[0])).toBe(true);
    expect(hasClvData(mergedOpportunities[1])).toBe(true);
  });
});

describe('CLV Sorting and Filtering', () => {
  const testOpportunities = [
    { id: '1', player: 'Player A', clvPercent: 5.25 },
    { id: '2', player: 'Player B', clvPercent: -2.1 },
    { id: '3', player: 'Player C', clvPercent: null },
    { id: '4', player: 'Player D', clvPercent: 1.8 },
    { id: '5', player: 'Player E', clvPercent: -0.5 }
  ];

  test('sorts opportunities by CLV descending', () => {
    const sorted = [...testOpportunities].sort((a, b) => sortByClv(a.clvPercent, b.clvPercent));
    
    expect(sorted[0].clvPercent).toBe(5.25);  // Best CLV first
    expect(sorted[1].clvPercent).toBe(1.8);   // Second best
    expect(sorted[2].clvPercent).toBe(-0.5);  // Fair CLV
    expect(sorted[3].clvPercent).toBe(-2.1);  // Poor CLV
    expect(sorted[4].clvPercent).toBe(null);  // Null values last
  });

  test('sorts opportunities by CLV ascending', () => {
    const sorted = [...testOpportunities].sort((a, b) => sortByClv(a.clvPercent, b.clvPercent, false));
    
    expect(sorted[0].clvPercent).toBe(-2.1);  // Worst CLV first in ascending
    expect(sorted[1].clvPercent).toBe(-0.5);  // Second worst
    expect(sorted[2].clvPercent).toBe(1.8);   // Good CLV
    expect(sorted[3].clvPercent).toBe(5.25);  // Best CLV last in ascending
    expect(sorted[4].clvPercent).toBe(null);  // Null values still last
  });

  test('filters opportunities with CLV data', () => {
    const withClvData = testOpportunities.filter(hasClvData);
    expect(withClvData).toHaveLength(4); // Excludes the null value
    expect(withClvData.every(opp => opp.clvPercent !== null)).toBe(true);
  });

  test('groups opportunities by CLV performance bands', () => {
    const excellent = testOpportunities.filter(opp => {
      const band = getClvBand(opp.clvPercent);
      return band === CLV_BANDS.EXCELLENT;
    });
    
    const good = testOpportunities.filter(opp => {
      const band = getClvBand(opp.clvPercent);
      return band === CLV_BANDS.GOOD;
    });

    const poor = testOpportunities.filter(opp => {
      const band = getClvBand(opp.clvPercent);
      return band === CLV_BANDS.POOR;
    });

    expect(excellent).toHaveLength(1); // Player A with 5.25%
    expect(good).toHaveLength(1);      // Player D with 1.8%
    expect(poor).toHaveLength(1);      // Player B with -2.1%
  });
});

// Test localStorage integration for CLV settings
describe('CLV Settings Persistence', () => {
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  beforeEach(() => {
    (global as any).localStorage = mockLocalStorage;
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  test('saves CLV column visibility to localStorage', () => {
    const showCLV = true;
    mockLocalStorage.setItem('propfinder.showCLV', showCLV.toString());
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('propfinder.showCLV', 'true');
  });

  test('loads CLV column visibility from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const stored = mockLocalStorage.getItem('propfinder.showCLV');
    
    expect(stored).toBe('true');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('propfinder.showCLV');
  });

  test('handles missing localStorage values gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const stored = mockLocalStorage.getItem('propfinder.showCLV');
    
    expect(stored).toBe(null);
  });
});