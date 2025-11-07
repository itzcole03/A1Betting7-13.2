import type { EnhancedApiClient } from '../../../utils/enhancedApiClient';
import type { UnifiedErrorService } from '../../unified/UnifiedErrorService';
import type { SubscriptionFilter } from '../../WebSocketManager';
import { SportsbookDataService, type SportsbookOdds } from '../SportsbookDataService';

type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
  responseTime: number;
};

class MockCache {
  private store = new Map<string, unknown>();

  get<T>(key: string): T | null {
    return this.store.has(key) ? (this.store.get(key) as T) : null;
  }

  set<T>(key: string, value: T, _ttl?: number): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  getSize(): number {
    return this.store.size;
  }

  getKeys(): string[] {
    return Array.from(this.store.keys());
  }
}

const sampleOdds: SportsbookOdds[] = [
  {
    provider: 'TestBook',
    eventId: 'evt-1',
    marketId: 'mkt-1',
    playerName: 'Player One',
    team: 'Team A',
    opponent: 'Team B',
    league: 'NBA',
    sport: 'nba',
    marketType: 'player_props',
    betType: 'points',
    line: 24.5,
    odds: -110,
    decimalOdds: 1.91,
    side: 'over',
    timestamp: '2024-01-01T00:00:00Z',
    gameTime: '2024-01-02T00:00:00Z',
    status: 'active',
    confidenceScore: 0.72,
  },
];

const createApiResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  status: 200,
  headers: new Headers(),
  cached: false,
  responseTime: 12,
});

const createDeferred = <T>() => {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
};

describe('SportsbookDataService', () => {
  let cache: MockCache;
  let apiGetMock: jest.Mock;
  let apiClient: EnhancedApiClient;
  let errorService: UnifiedErrorService;

  beforeEach(() => {
    cache = new MockCache();
    apiGetMock = jest.fn();
    apiClient = { get: apiGetMock } as unknown as EnhancedApiClient;
    errorService = {
      reportError: jest.fn().mockReturnValue('error-id'),
    } as unknown as UnifiedErrorService;
  });

  it('reuses cached odds responses across identical requests', async () => {
    apiGetMock.mockResolvedValue(createApiResponse(sampleOdds));

    const service = new SportsbookDataService({
      apiClient,
      cache,
      errorService,
      enableRealtime: false,
    });

    const resultA = await service.getAllPlayerProps('nba', 'Player One');
    const resultB = await service.getAllPlayerProps('nba', 'Player One');

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(resultA).toEqual(sampleOdds);
    expect(resultB).toEqual(sampleOdds);
  });

  it('coalesces parallel fetches to a single API invocation', async () => {
    const deferred = createDeferred<ApiResponse<SportsbookOdds[]>>();
    apiGetMock.mockReturnValue(deferred.promise);

    const service = new SportsbookDataService({
      apiClient,
      cache,
      errorService,
      enableRealtime: false,
    });

    const fetchOne = service.getAllPlayerProps('nba');
    const fetchTwo = service.getAllPlayerProps('nba');

    expect(apiGetMock).toHaveBeenCalledTimes(1);

    deferred.resolve(createApiResponse(sampleOdds));

    const [resultOne, resultTwo] = await Promise.all([fetchOne, fetchTwo]);

    expect(resultOne).toEqual(sampleOdds);
    expect(resultTwo).toEqual(sampleOdds);
  });

  it('supports websocket subscription enabling and disabling', async () => {
    const websocketActions = {
      connection: { connected: false, connecting: false },
      connect: jest.fn(async () => {
        websocketActions.connection.connected = true;
      }),
      subscribe: jest.fn(async () => undefined),
      unsubscribe: jest.fn(async () => undefined),
    };

    const websocketStore = {
      getState: jest.fn(() => websocketActions),
      subscribe: jest.fn(
        (_selector: (state: any) => unknown, _listener: (value: unknown) => void) => () => undefined
      ),
    };

    const service = new SportsbookDataService({
      apiClient,
      cache,
      errorService,
      websocketStore,
      enableRealtime: true,
    });

    const filters: SubscriptionFilter = { sport: 'nba' };

    await service.enableRealtimeOdds(filters);

    expect(websocketActions.connect).toHaveBeenCalledTimes(1);
    expect(websocketActions.subscribe).toHaveBeenCalledWith('sportsbook_odds', filters);

    await service.enableRealtimeOdds(filters);
    expect(websocketActions.subscribe).toHaveBeenCalledTimes(1);

    await service.disableRealtimeOdds(filters);
    expect(websocketActions.unsubscribe).toHaveBeenCalledWith('sportsbook_odds', filters);
  });

  it('tracks line movement history from realtime payloads', () => {
    const service = new SportsbookDataService({
      apiClient,
      cache,
      errorService,
      enableRealtime: false,
    });

    const deleteSpy = jest.spyOn(cache, 'deleteByPrefix');

    (service as any).ingestRealtimeOdds([
      {
        provider: 'TestBook',
        playerName: 'Player One',
        betType: 'points',
        line: 24.5,
        odds: -110,
        sport: 'nba',
      },
    ]);

    const history = service.getLineMovementHistory('Player One', 'points', 24.5);
    expect(history).toHaveLength(1);
    expect(deleteSpy).toHaveBeenCalledWith('sportsbook:odds');
  });

  it('invalidates cache entries by prefix', async () => {
    cache.set('sportsbook:odds:something', sampleOdds);
    cache.set('sportsbook:best-odds:other', sampleOdds);

    const service = new SportsbookDataService({
      apiClient,
      cache,
      errorService,
      enableRealtime: false,
    });

    service.invalidateCache('odds');

    expect(cache.get('sportsbook:odds:something')).toBeNull();
    expect(cache.get('sportsbook:best-odds:other')).toEqual(sampleOdds);
  });
});
