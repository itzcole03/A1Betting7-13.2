export type RefereeStats = { id: string; name: string; foulRate: number };

export const refereeService = {
  async getRefereeStats(id: string): Promise<RefereeStats> {
    return { id, name: 'John Doe', foulRate: 3.2 };
  },
  async getRefereeStatsBatch(ids: string[]): Promise<RefereeStats[]> {
    return ids.map(id => ({ id, name: 'John Doe', foulRate: 3.2 }));
  },
};
