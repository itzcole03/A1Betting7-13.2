interface ConfigStore {
  [key: string]: unknown;
}

export class UnifiedConfig {
  private static instance: UnifiedConfig;
  private config: ConfigStore = {};
  private defaults: ConfigStore = {
    api: {
      // @ts-expect-error TS(1343): The 'import.meta' meta-property is only allowed wh... Remove this comment to see the full error message
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
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
    let _value = this.config;

    for (const _k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  set(key: string, value: unknown): void {
    const _keys = key.split('.');
    let _current = this.config;

    for (let _i = 0; i < keys.length - 1; i++) {
      const _k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  has(key: string): boolean {
    const _keys = key.split('.');
    let _value = this.config;

    for (const _k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return true;
  }

  delete(key: string): void {
    const _keys = key.split('.');
    let _current = this.config;

    for (let _i = 0; i < keys.length - 1; i++) {
      const _k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        return;
      }
      current = current[k];
    }

    delete current[keys[keys.length - 1]];
  }

  reset(): void {
    this.config = { ...this.defaults };
  }

  getAll(): ConfigStore {
    return { ...this.config };
  }

  merge(newConfig: ConfigStore): void {
    this.config = this.deepMerge(this.config, newConfig);
  }

  private deepMerge(target: unknown, source: unknown): unknown {
    const _result = { ...target };

    for (const _key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
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
