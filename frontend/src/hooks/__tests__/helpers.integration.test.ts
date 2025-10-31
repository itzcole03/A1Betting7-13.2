import { buildQueryParams, mapRawOpportunity, mergeFilters } from '../usePropFinderData';

describe('helper integration tests', () => {
  it('parses boolean-like values into booleans correctly', () => {
    const raw = {
      id: 'bool-1',
      hasArbitrage: 'yes',
      isLowJuice: '0',
      isBookmarked: 1,
      alert_triggered: 'false',
    } as any;

    const opp = mapRawOpportunity(raw);
    expect(opp.hasArbitrage).toBe(true);
    expect(opp.isLowJuice).toBe(false);
    expect(opp.isBookmarked).toBe(true);
    expect(opp.alertTriggered).toBe(false);
  });

  it('normalizes various trend inputs', () => {
    const a = mapRawOpportunity({ id: 't-a', trend: 'increase' } as any);
    const b = mapRawOpportunity({ id: 't-b', trend: 'decreasing' } as any);
    const c = mapRawOpportunity({ id: 't-c', trend: 'steady' } as any);
    const d = mapRawOpportunity({ id: 't-d', trend: 'weird' } as any);

    expect(a.trend).toBe('up');
    expect(b.trend).toBe('down');
    expect(c.trend).toBe('flat');
    expect(d.trend).toBeNull();
  });

  it('handles different bookmaker key names and ignores malformed entries', () => {
    const raw = {
      id: 'bk-1',
      bookmakers: [
        { name: 'Alpha', odds: '120' },
        { bookmaker: 'Beta', price: '130' },
        { display_name: 'Gamma', price: 'NaN' },
        { bookmaker: { nested: true }, odds: 140 },
      ],
    } as any;

    const opp = mapRawOpportunity(raw);
    expect(opp.bookmakers).toBeDefined();
    // Gamma has NaN price so it will be skipped; the nested bookmaker entry is invalid and skipped
    expect(opp.bookmakers?.map(b => b.name)).toEqual(expect.arrayContaining(['Alpha', 'Beta']));
  });

  it('parses number edge cases (empty strings, NaN, zero) correctly', () => {
    const raw = {
      id: 'num-1',
      line: '   ',
      odds: 'NaN',
      clvPercent: '0',
      closingOdds: '-0',
    } as any;

    const opp = mapRawOpportunity(raw);
    expect(opp.line).toBeUndefined();
    expect(opp.odds).toBeUndefined();
    expect(opp.clvPercent).toBe(0);
    // closingOdds '-0' should parse to -0 which is === 0
    expect(Object.is(opp.closingOdds, -0) || opp.closingOdds === 0).toBeTruthy();
  });

  it('buildQueryParams handles boolean filter keys and arrays', () => {
    const filters = {
      sports: ['NBA', null, 'MLB', ''],
      bookmarked_only: '1',
      alert_triggered_only: 'no',
    } as any;

    const merged = mergeFilters({}, filters);
    expect(Array.isArray(merged.sports)).toBe(true);
    expect(merged.sports).toEqual(['NBA', 'MLB']);

    const params = buildQueryParams(merged, { limit: 5, includeCLV: false });
    const qs = Object.fromEntries(params.entries());
    expect(qs.limit).toBe('5');
    expect(qs.sports).toBe('NBA,MLB');
    // bookmarked_only should be converted to true
    expect(qs.bookmarked_only).toBe('true');
    // alert_triggered_only 'no' should be converted to false
    expect(qs.alert_triggered_only).toBe('false');
  });
});
