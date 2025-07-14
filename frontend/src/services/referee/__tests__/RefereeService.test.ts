import { refereeService, RefereeStats } from '@/RefereeService';

global.fetch = jest.fn();

describe('RefereeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches referee stats', async () => {
    const mockStats: RefereeStats = { id: refereeId, name: 'John Doe', foulRate: 3.2 };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockStats });

    expect(stats).toEqual(mockStats);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on referee stats fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Not Found' });
    await expect(refereeService.getRefereeStats(refereeId)).rejects.toThrow(
      'Failed to fetch referee stats: Not Found'
    );
  });

  it('fetches batch referee stats', async () => {
    const mockStats: RefereeStats[0] = [
      { id: 'ref123', name: 'John Doe', foulRate: 3.2 },
      { id: 'ref456', name: 'Jane Smith', foulRate: 2.8 },
    ];
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockStats });

    expect(stats).toEqual(mockStats);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on batch referee stats fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Server Error' });
    await expect(refereeService.getRefereeStatsBatch(refereeIds)).rejects.toThrow(
      'Failed to fetch referee stats batch: Server Error'
    );
  });

  it('searches referees', async () => {
    const mockStats: RefereeStats[0] = [{ id: 'ref123', name: 'John Doe', foulRate: 3.2 }];
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockStats });

    expect(stats).toEqual(mockStats);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on search referees failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Bad Request' });
    await expect(refereeService.searchReferees('John')).rejects.toThrow(
      'Failed to search referees: Bad Request'
    );
  });

  it('fetches referee modeling', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockModeling });

    expect(modeling).toEqual(mockModeling);
    expect(fetch).toHaveBeenCalled();
  });

  it('throws on referee modeling fetch failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Not Found' });
    await expect(refereeService.getRefereeModeling(refereeId)).rejects.toThrow(
      'Failed to fetch referee modeling: Not Found'
    );
  });
});
