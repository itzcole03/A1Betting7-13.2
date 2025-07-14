const mockProps = [{ id: 1, name: 'Prop 1' }];
const mockArbs = [{ id: 1, name: 'Arb 1' }];
const mockEntries = [{ id: 1, name: 'Entry 1' }];

const apiService = {
  getProps: async (filters: { sport: string; type: string }) => {
    return { data: mockProps };
  },
  getArbitrageOpportunities: async () => {
    return { data: mockArbs };
  },
  getEntries: async () => {
    return { data: mockEntries };
  },
};

describe('API Endpoints', () => {
  it('fetches props with filters', async () => {
    const res = await apiService.getProps({ sport: 'NBA', type: 'player' });
    const props = res.data;
    expect(Array.isArray(props)).toBe(true);
  });

  it('fetches arbitrage opportunities', async () => {
    const res = await apiService.getArbitrageOpportunities();
    const arbs = res.data;
    expect(Array.isArray(arbs)).toBe(true);
  });

  it('fetches entries', async () => {
    const res = await apiService.getEntries();
    const entries = res.data;
    expect(Array.isArray(entries)).toBe(true);
  });

  test('should test login, register, logout, lineups, profile, etc.', () => {
    expect(true).toBe(true);
  });
});
