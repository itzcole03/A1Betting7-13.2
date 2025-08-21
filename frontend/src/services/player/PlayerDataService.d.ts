export interface PlayerSearchResult {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
}

export interface PlayerDataService {
  searchPlayers(query: string, sport?: string, limit?: number): Promise<PlayerSearchResult[]>;
  // Add other methods as needed by the registry consumers
}
