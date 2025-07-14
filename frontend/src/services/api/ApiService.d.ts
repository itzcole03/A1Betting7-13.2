interface ApiConfig {
  endpoints: {
    sportradar: string;
    oddsapi: string;
    espn: string;
    social: string;
  };
  apiKeys: {
    sportradar?: string;
    oddsapi?: string;
    espn?: string;
    social?: string;
  };
  websocket: {
    url: string;
    reconnectInterval: number;
    maxRetries: number;
  };
}
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
interface PlayerStats {
  player: string;
  team: string;
  position: string;
  stats: Record<string, number>;
  lastUpdated: string;
}
interface GameOdds {
  game: string;
  timestamp: string;
  bookmaker: string;
  market: string;
  outcomes: {
    name: string;
    price: number;
    point?: number;
  }[];
}
interface InjuryReport {
  player: string;
  team: string;
  status: string;
  injury: string;
  expectedReturn?: string;
}
export declare class ApiService {
  private config;
  private ws;
  private retryCount;
  private dataStream;
  constructor(config: ApiConfig);
  private initializeWebSocket;
  private handleReconnection;
  private subscribeToDataFeeds;
  getDataStream(): import('rxjs').Observable<any>;
  fetchPlayerStats(
    playerId: string,
    options?: {
      days?: number;
      type?: string[];
    }
  ): Promise<ApiResponse<PlayerStats[]>>;
  fetchGameOdds(
    gameId: string,
    options?: {
      markets?: string[];
      books?: string[];
    }
  ): Promise<ApiResponse<GameOdds[]>>;
  fetchInjuryReports(options?: {
    team?: string;
    status?: string[];
  }): Promise<ApiResponse<InjuryReport[]>>;
  getSocialNews(params?: Record<string, any>): Promise<ApiResponse<any>>;
  private getHeaders;
  fetchHistoricalData(options: {
    startDate: string;
    endDate: string;
    players?: string[];
    teams?: string[];
    propTypes?: string[];
  }): Promise<ApiResponse<any[]>>;
  /**
   * Generic GET method for arbitrary endpoints.
   * @param url - The endpoint URL (absolute or relative).
   * @param params - Query parameters as a key-value object.
   * @returns Parsed response data of type T.
   */
  get<T>(url: string, params?: Record<string, any>): Promise<T>;
}
export declare const apiService: ApiService;
