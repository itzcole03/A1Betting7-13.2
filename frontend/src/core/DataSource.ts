/**
 * Canonical data source contracts for core/unified services.
 *
 * Adapters across the app can continue to expose lightweight fetch helpers, but
 * the `normalizeDataSource` helper guarantees a consistent surface (connect,
 * disconnect, refresh, ping, health) for orchestration layers such as the
 * master registry or data integration hub.
 */

export type DataSourcePriority = 'low' | 'normal' | 'high';

export type DataSourceStatus = 'unknown' | 'disconnected' | 'connecting' | 'ready' | 'error';

export interface DataSourceRequestOptions {
  signal?: AbortSignal;
  /**
   * Indicates whether the caller explicitly requests fresh data (bypassing any
   * internal caches the adapter might maintain).
   */
  refresh?: boolean;
  [key: string]: unknown;
}

export interface DataSourceMetadata {
  id: string;
  type: string;
  priority: DataSourcePriority;
  labels?: Record<string, string>;
  region?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DataSourceHealth {
  status: DataSourceStatus;
  latencyMs?: number;
  lastChecked: number;
  lastError?: string;
  details?: Record<string, unknown>;
}

export interface DataSource<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly priority?: DataSourcePriority;

  /** Primary data retrieval mechanism. */
  fetchData?(options?: DataSourceRequestOptions): Promise<T>;
  /** Alternate historical fetch signature supported by some legacy adapters. */
  fetch?(options?: DataSourceRequestOptions): Promise<T>;

  /** Establish the underlying connection (websocket, polling, etc.). */
  connect?(): Promise<boolean | void>;
  /** Tear down any live connection or release resources. */
  disconnect?(): Promise<boolean | void>;
  /** Request a manual refresh; default implementation proxies to `fetchData`. */
  refresh?(): Promise<T>;
  /** Lightweight latency check. */
  ping?(): Promise<number>;
  /** Optional health snapshot for dashboards. */
  getHealth?(): Promise<DataSourceHealth>;
  /** Synchronous connection flag (for offline-ready adapters). */
  isConnected?(): boolean;
  /** Metadata describing the source (provider, env, etc.). */
  getMetadata?(): Record<string, unknown>;
}

export interface NormalizedDataSource<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly priority: DataSourcePriority;
  fetchData(options?: DataSourceRequestOptions): Promise<T>;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  refresh(): Promise<T>;
  ping(): Promise<number>;
  getHealth(): Promise<DataSourceHealth>;
  isConnected(): boolean;
  getMetadata(): DataSourceMetadata;
}

const DEFAULT_PRIORITY: DataSourcePriority = 'normal';

const defaultConnect = async (): Promise<boolean> => true;
const defaultDisconnect = async (): Promise<boolean> => true;
const defaultPing = async (): Promise<number> => 0;

const buildDefaultHealth = (status: DataSourceStatus): DataSourceHealth => ({
  status,
  lastChecked: Date.now(),
});

const defaultIsConnected = (): boolean => true;

const coerceBoolean = async (result: Promise<boolean | void>): Promise<boolean> => {
  const value = await result;
  if (typeof value === 'boolean') {
    return value;
  }
  return true;
};

/**
 * Convert a lightweight adapter into the full data source contract with
 * predictable fallbacks.
 */
export const normalizeDataSource = <T>(source: DataSource<T>): NormalizedDataSource<T> => {
  if (!source || typeof source.id !== 'string' || typeof source.type !== 'string') {
    throw new Error('normalizeDataSource requires an object with stable id and type properties');
  }

  const priority = source.priority ?? DEFAULT_PRIORITY;
  const baseFetch = source.fetchData ?? source.fetch;
  if (!baseFetch) {
    throw new Error(`Data source "${source.id}" does not implement fetchData()`);
  }

  const baseIsConnected = source.isConnected ?? defaultIsConnected;

  const connect = source.connect ? () => coerceBoolean(source.connect!()) : defaultConnect;

  const disconnect = source.disconnect
    ? () => coerceBoolean(source.disconnect!())
    : defaultDisconnect;

  const refresh = source.refresh ? () => source.refresh!() : () => baseFetch({ refresh: true });

  const ping = source.ping ?? defaultPing;

  const getHealth = source.getHealth
    ? () => source.getHealth!()
    : async () => buildDefaultHealth(baseIsConnected() ? 'ready' : 'disconnected');

  const getMetadata = (): DataSourceMetadata => {
    const base = source.getMetadata ? source.getMetadata() : {};
    return {
      id: source.id,
      type: source.type,
      priority,
      ...(base as Record<string, unknown>),
    } as DataSourceMetadata;
  };

  const normalized: NormalizedDataSource<T> = {
    id: source.id,
    type: source.type,
    priority,
    fetchData: (options?: DataSourceRequestOptions) => baseFetch(options),
    connect,
    disconnect,
    refresh,
    ping,
    getHealth,
    isConnected: () => baseIsConnected(),
    getMetadata,
  };

  return Object.freeze(normalized) as NormalizedDataSource<T>;
};

export type { NormalizedDataSource as CoreNormalizedDataSource };
