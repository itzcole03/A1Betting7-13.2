import { UnifiedServiceRegistry } from '@/unified/UnifiedServiceRegistry.ts';
export declare class UnifiedSettingsService {
  private static instance;
  private logger;
  private settings;
  private settingsFile;
  private constructor();
  static getInstance(registry: UnifiedServiceRegistry): UnifiedSettingsService;
  private loadSettings;
  private initializeDefaultSettings;
  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, value: T): void;
  private saveSettings;
}
