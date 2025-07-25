import axios from 'axios';

export type RefereeStats = { id: string; name: string; foulRate: number };

const REFEREE_API_BASE_URL = '/api/referee'; // Assuming your backend API route

export const _refereeService = {
  async getRefereeStats(id: string): Promise<RefereeStats> {
    const response = await axios.get(`${REFEREE_API_BASE_URL}/${id}/stats`);
    return response.data;
  },
  async getRefereeStatsBatch(ids: string[]): Promise<RefereeStats[]> {
    const response = await axios.post(`${REFEREE_API_BASE_URL}/batch-stats`, { ids });
    return response.data;
  },
  async searchReferees(query: string): Promise<RefereeStats[]> {
    const response = await axios.get(`${REFEREE_API_BASE_URL}/search?query=${query}`);
    return response.data;
  },
  async getRefereeModeling(id: string): Promise<any> {
    const response = await axios.get(`${REFEREE_API_BASE_URL}/${id}/modeling`);
    return response.data;
  },
};
