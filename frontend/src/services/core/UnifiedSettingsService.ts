import { promises as fs } from 'fs';
import path from 'path';
// @ts-expect-error TS(2307): Cannot find module '@/core/UnifiedLogger' or its c... Remove this comment to see the full error message
import { UnifiedLogger } from '@/core/UnifiedLogger';
// @ts-expect-error TS(2307): Cannot find module '@/unified/UnifiedServiceRegist... Remove this comment to see the full error message
import { UnifiedServiceRegistry } from '@/unified/UnifiedServiceRegistry';

export class UnifiedSettingsService {
  private static instance: UnifiedSettingsService;
  private logger: UnifiedLogger;
  private settings: Map<string, unknown>;
  private settingsFile: string;

  private constructor(registry: UnifiedServiceRegistry) {
    this.logger = UnifiedLogger.getInstance();
    this.settings = new Map();
    this.settingsFile = path.join(process.cwd(), 'config', 'settings.json');
    this.loadSettings();
  }

  public static getInstance(registry: UnifiedServiceRegistry): UnifiedSettingsService {
    if (!UnifiedSettingsService.instance) {
      UnifiedSettingsService.instance = new UnifiedSettingsService(registry);
    }
    return UnifiedSettingsService.instance;
  }

  private async loadSettings(): Promise<void> {
    try {
      // @ts-expect-error TS(2663): Cannot find name 'settings'. Did you mean the inst... Remove this comment to see the full error message
      Object.entries(settings).forEach(([key, value]) => {
        this.settings.set(key, value);
      });
      this.logger.info('Settings loaded successfully', 'settings');
    } catch (error) {
      this.logger.error('Failed to load settings', 'settings');
      // Initialize with default settings;
      this.initializeDefaultSettings();
    }
  }

  private initializeDefaultSettings(): void {
    this.settings.set('backup.enabled', true);
    this.settings.set('backup.schedule', '0 0 * * *');
    this.settings.set('backup.retentionDays', 30);
    this.settings.set('backup.path', './backups');
    this.settings.set('backup.includeDatabases', true);
    this.settings.set('backup.includeFiles', true);
    this.settings.set('backup.includeLogs', true);
    this.settings.set('backup.compression', true);
    this.settings.set('backup.encryption', true);
    this.settings.set('database.postgres', {
      host: 'localhost',
      port: 5432,
      database: 'sports_betting',
      username: 'postgres',
      password: '',
    });
    this.settings.set('database.redis', {
      host: 'localhost',
      port: 6379,
      password: '',
    });
  }

  public get<T>(key: string, defaultValue: T): T {
    // @ts-expect-error TS(2304): Cannot find name 'value'.
    return value !== undefined ? (value as T) : defaultValue;
  }

  public set<T>(key: string, value: T): void {
    this.settings.set(key, value);
    this.saveSettings();
  }

  private async saveSettings(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.settingsFile), { recursive: true });
      // @ts-expect-error TS(2663): Cannot find name 'settings'. Did you mean the inst... Remove this comment to see the full error message
      await fs.writeFile(this.settingsFile, JSON.stringify(settings, null, 2));
      this.logger.info('Settings saved successfully', 'settings');
    } catch (error) {
      this.logger.error('Failed to save settings', 'settings');
    }
  }
}
