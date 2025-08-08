interface ConfigStore {
  [key: string]: unknown;
}

export class UnifiedConfig {
  private static instance: UnifiedConfig;
  private config: ConfigStore = {};
  private defaults: ConfigStore = {
    api: {
      // Use getEnvVar for robust env access
      baseUrl: (() => {
        try {
          // @ts-ignore
          const { getEnvVar } = require('../../utils/getEnvVar');
          return getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001');
        } catch (e) {
          return 'http://localhost:3001';
        }
      })(),
      timeout: 10000,
      retries: 3,
    },
    cache: {
      defaultTTL: 300000, // 5 minutes
      maxSize: 1000,
    },
    logging: {
      level: 'info',
      maxEntries: 1000,
    },
    features: {
      realTimeUpdates: true,
      analytics: true,
      notifications: true,
    },
  };

  private constructor() {
    this.config = { ...this.defaults };
  }

  static getInstance(): UnifiedConfig {
    if (!UnifiedConfig.instance) {
      UnifiedConfig.instance = new UnifiedConfig();
    }
    return UnifiedConfig.instance;
  }

  get<T>(key: string, defaultValue?: T): T {
    const _keys = key.split('.');
    let value: any = this.config;

    for (const _k of _keys) {
      if (value && typeof value === 'object' && _k in value) {
        value = value[_k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  set(key: string, value: unknown): void {
    const _keys = key.split('.');
    let current: ConfigStore = this.config;

    for (let i = 0; i < _keys.length - 1; i++) {
      const _k = _keys[i];
      if (!(_k in current) || typeof current[_k] !== 'object' || current[_k] === null) {
        current[_k] = {};
      }
      current = current[_k] as ConfigStore;
    }

    current[_keys[_keys.length - 1]] = value;
  }

  has(key: string): boolean {
    const _keys = key.split('.');
    let value = this.config;

    for (const _k of _keys) {
      if (value && typeof value === 'object' && _k in value) {
        value = (value as any)[_k];
      } else {
        return false;
      }
    }

    return true;
  }

  delete(key: string): void {
    const _keys = key.split('.');
    let current: ConfigStore = this.config;

    for (let i = 0; i < _keys.length - 1; i++) {
      const _k = _keys[i];
      if (!(_k in current) || typeof current[_k] !== 'object' || current[_k] === null) {
        return;
      }
      current = current[_k] as ConfigStore;
    }

    delete current[_keys[_keys.length - 1]];
  }

  reset(): void {
    this.config = { ...this.defaults };
  }

  getAll(): ConfigStore {
    return { ...this.config };
  }

  merge(newConfig: ConfigStore): void {
    this.config = this.deepMerge(this.config, newConfig) as ConfigStore;
  }

  private deepMerge(target: unknown, source: unknown): unknown {
    const result = { ...(target as any) };

    for (const _key in source as any) {
      if (
        (source as any)[_key] &&
        typeof (source as any)[_key] === 'object' &&
        !Array.isArray((source as any)[_key])
      ) {
        result[_key] = this.deepMerge(result[_key] || {}, (source as any)[_key]);
      } else {
        result[_key] = (source as any)[_key];
      }
    }

    return result;
  }

  // Add this method to match the d.ts and provide the API base URL
  getApiUrl(): string {
    return this.get('api.baseUrl', 'http://localhost:3001');
  }
}

export const _unifiedConfig = UnifiedConfig.getInstance();
