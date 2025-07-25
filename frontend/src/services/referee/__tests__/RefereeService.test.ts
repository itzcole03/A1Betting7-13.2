import { _refereeService as refereeService, RefereeStats } from '../../RefereeService';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RefereeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches referee stats', async () => {
    const refereeId = 'testRef123';
    const mockStats: RefereeStats = { id: refereeId, name: 'John Doe', foulRate: 3.2 };
    mockedAxios.get.mockResolvedValueOnce({ data: mockStats });

    const stats = await refereeService.getRefereeStats(refereeId);
    expect(stats).toEqual(mockStats);
    expect(mockedAxios.get).toHaveBeenCalledWith(`/api/referee/${refereeId}/stats`);
  });

  it('throws on referee stats fetch failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Not Found'));
    const refereeId = 'testRef123';
    await expect(refereeService.getRefereeStats(refereeId)).rejects.toThrow(
      'Not Found'
    );
  });

  it('fetches batch referee stats', async () => {
    const mockStats: RefereeStats[] = [
      { id: 'ref123', name: 'John Doe', foulRate: 3.2 },
      { id: 'ref456', name: 'Jane Smith', foulRate: 2.8 },
    ];
    mockedAxios.post.mockResolvedValueOnce({ data: mockStats });

    const refereeIds = ['ref123', 'ref456'];
    const stats = await refereeService.getRefereeStatsBatch(refereeIds);
    expect(stats).toEqual(mockStats);
    expect(mockedAxios.post).toHaveBeenCalledWith(`/api/referee/batch-stats`, { ids: refereeIds });
  });

  it('throws on batch referee stats fetch failure', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Server Error'));
    const refereeIds = ['ref123', 'ref456'];
    await expect(refereeService.getRefereeStatsBatch(refereeIds)).rejects.toThrow(
      'Server Error'
    );
  });

  it('searches referees', async () => {
    const mockStats: RefereeStats[] = [{ id: 'ref123', name: 'John Doe', foulRate: 3.2 }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockStats });

    const stats = await refereeService.searchReferees('John');
    expect(stats).toEqual(mockStats);
    expect(mockedAxios.get).toHaveBeenCalledWith(`/api/referee/search?query=John`);
  });

  it('throws on search referees failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Bad Request'));
    await expect(refereeService.searchReferees('John')).rejects.toThrow(
      'Bad Request'
    );
  });

  it('fetches referee modeling', async () => {
    const mockModeling = { id: 'testRef123', modelData: 'some modeling data' };
    mockedAxios.get.mockResolvedValueOnce({ data: mockModeling });

    const refereeId = 'testRef123';
    const modeling = await refereeService.getRefereeModeling(refereeId);
    expect(modeling).toEqual(mockModeling);
    expect(mockedAxios.get).toHaveBeenCalledWith(`/api/referee/${refereeId}/modeling`);
  });

  it('throws on referee modeling fetch failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Not Found'));
    const refereeId = 'testRef123';
    await expect(refereeService.getRefereeModeling(refereeId)).rejects.toThrow(
      'Not Found'
    );
  });
});
