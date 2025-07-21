import { refereeService, RefereeStats } from '../../RefereeService';

global.fetch = jest.fn();

describe('RefereeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches referee stats', async () => {
    // @ts-expect-error TS(2304): Cannot find name 'refereeId'.
    const mockStats: RefereeStats = { id: refereeId, name: 'John Doe', foulRate: 3.2 };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockStats });

    // @ts-expect-error TS(2552): Cannot find name 'stats'. Did you mean 'status'?
    expect(stats).toEqual(mockStats);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on referee stats fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Not Found' });
    // @ts-expect-error TS(2304): Cannot find name 'refereeId'.
    await expect(refereeService.getRefereeStats(refereeId)).rejects.toThrow(
      'Failed to fetch referee stats: Not Found'
    );
  });

  it('fetches batch referee stats', async () => {
    // @ts-expect-error TS(2339): Property '0' does not exist on type 'RefereeStats'... Remove this comment to see the full error message
    const mockStats: RefereeStats[0] = [
      { id: 'ref123', name: 'John Doe', foulRate: 3.2 },
      { id: 'ref456', name: 'Jane Smith', foulRate: 2.8 },
    ];
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockStats });

    // @ts-expect-error TS(2552): Cannot find name 'stats'. Did you mean 'status'?
    expect(stats).toEqual(mockStats);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on batch referee stats fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Server Error' });
    // @ts-expect-error TS(2304): Cannot find name 'refereeIds'.
    await expect(refereeService.getRefereeStatsBatch(refereeIds)).rejects.toThrow(
      'Failed to fetch referee stats batch: Server Error'
    );
  });

  it('searches referees', async () => {
    // @ts-expect-error TS(2339): Property '0' does not exist on type 'RefereeStats'... Remove this comment to see the full error message
    const mockStats: RefereeStats[0] = [{ id: 'ref123', name: 'John Doe', foulRate: 3.2 }];
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockStats });

    // @ts-expect-error TS(2552): Cannot find name 'stats'. Did you mean 'status'?
    expect(stats).toEqual(mockStats);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on search referees failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Bad Request' });
    // @ts-expect-error TS(2339): Property 'searchReferees' does not exist on type '... Remove this comment to see the full error message
    await expect(refereeService.searchReferees('John')).rejects.toThrow(
      'Failed to search referees: Bad Request'
    );
  });

  it('fetches referee modeling', async () => {
    // @ts-expect-error TS(2304): Cannot find name 'mockModeling'.
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockModeling });

    // @ts-expect-error TS(2304): Cannot find name 'modeling'.
    expect(modeling).toEqual(mockModeling);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on referee modeling fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Not Found' });
    // @ts-expect-error TS(2339): Property 'getRefereeModeling' does not exist on ty... Remove this comment to see the full error message
    await expect(refereeService.getRefereeModeling(refereeId)).rejects.toThrow(
      'Failed to fetch referee modeling: Not Found'
    );
  });
});
