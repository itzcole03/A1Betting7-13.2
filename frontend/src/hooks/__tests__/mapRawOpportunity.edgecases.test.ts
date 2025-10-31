import fs from 'fs';
import path from 'path';
import {
  buildQueryParams,
  mapRawOpportunity,
  mapSummaryToStats,
  mergeFilters,
} from '../usePropFinderData';

describe('mapRawOpportunity edge cases and helpers', () => {
  it('sanitizes arrays with empty and NaN-like strings', () => {
    const raw = {
      id: 'edge-1',
      recent_form: ['', 'NaN', '5', null, 0],
      sparkline: ['1', null, 'abc', '2.5', ''],
    } as any;

    const opp = mapRawOpportunity(raw);
    // recentForm should keep only valid numeric values (5 and 0)
    expect(Array.isArray(opp.recentForm)).toBe(true);
    expect(opp.recentForm).toEqual(expect.arrayContaining([5, 0]));
    // sparkline should parse 1 and 2.5 and ignore invalid entries
    expect(opp.sparkline).toEqual(expect.arrayContaining([1, 2.5]));
  });

  it('skips malformed bookmaker entries and handles nested unexpected objects', () => {
    const raw = {
      id: 'edge-2',
      bookmakers: [
        { bookmaker: { name: 'Bad' }, odds: 'NaN' },
        { name: 'GoodBook', price: '200', total: '10' },
        { display_name: null, odds: '150' },
      ],
    } as any;

    const opp = mapRawOpportunity(raw);
    // only the valid bookmaker should be kept
    expect(opp.bookmakers).toBeDefined();
    expect(opp.bookmakers?.length).toBe(1);
    expect(opp.bookmakers?.[0].name).toBe('GoodBook');
  });

  it('handles empty tags gracefully', () => {
    const raw = { id: 'edge-3', tags: ['', null, 'tag1'] } as any;
    const opp = mapRawOpportunity(raw);
    expect(opp.tags).toEqual(['tag1']);
  });

  it('snapshot of a full sample payload maps consistently', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'fullPayload.sample.json');
    const rawText = fs.readFileSync(fixturePath, 'utf8');
    const parsed = JSON.parse(rawText);
    const data = parsed.data ?? parsed;
    const rawOpps = Array.isArray(data.opportunities) ? data.opportunities : [];
    const mapped = rawOpps.map((r: any) => mapRawOpportunity(r));
    expect(mapped).toMatchSnapshot();
    const stats = mapSummaryToStats(data.summary ?? data);
    expect(stats).toMatchSnapshot('summary-stats');
  });

  it('buildQueryParams and mergeFilters behave correctly for edge inputs', () => {
    const filters = {
      sports: ['NBA', '', null, 'NHL'],
      bookmarked_only: 'true',
      min_confidence: '7.5',
      stray: undefined,
    } as any;

    const merged = mergeFilters({}, filters);
    // sports should be sanitized to only the valid strings
    expect(Array.isArray(merged.sports)).toBe(true);
    expect(merged.sports as string[]).toEqual(['NBA', 'NHL']);
    expect(merged.bookmarked_only).toBe('true');

    const params = buildQueryParams(merged, { limit: 10, search: 'test', includeCLV: true });
    const qs = params.toString();
    expect(qs).toContain('limit=10');
    expect(qs).toContain('sports=NBA%2CNHL');
    expect(qs).toContain('include_clv=true');
    expect(qs).toContain('search=test');
  });
});
