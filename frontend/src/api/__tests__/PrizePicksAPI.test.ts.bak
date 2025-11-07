import { PrizePicksAPI } from '../PrizePicksAPI';

describe('PrizePicksAPI', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('fetchProjections returns parsed json and includes default league when none provided', async () => {
    const api = new PrizePicksAPI({ baseUrl: 'http://api' });
    const mockResponse = { data: [{ id: 'x' }] };
    (global as any).fetch = jest.fn((url: string) =>
      Promise.resolve({ ok: true, json: async () => mockResponse } as any)
    );

    const res = await api.fetchProjections();
    expect(res).toEqual(mockResponse);
    // ensure fetch was called with league_id param (default NBA)
    expect((global as any).fetch).toHaveBeenCalled();
    const calledUrl = (global as any).fetch.mock.calls[0][0];
    expect(String(calledUrl)).toContain('league_id=NBA');
  });

  it('request throws on non-ok response', async () => {
    const api = new PrizePicksAPI({ baseUrl: 'http://api' });
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500, statusText: 'Err', text: async () => 'bad' } as any)
    );
    await expect(api.fetchProjections()).rejects.toThrow();
  });
});
