import UnifiedErrorService from './errorService.ts';
import UnifiedNotificationService from './notificationService.ts';
import UnifiedLoggingService from './loggingService.ts';
import UnifiedSettingsService from './settingsService.ts';
import { UnifiedServiceRegistry } from './UnifiedServiceRegistry.ts';
export declare abstract class UnifiedServiceBase {
  protected readonly errorService: UnifiedErrorService;
  protected readonly notificationService: UnifiedNotificationService;
  protected readonly loggingService: UnifiedLoggingService;
  protected readonly settingsService: UnifiedSettingsService;
  protected readonly serviceRegistry: UnifiedServiceRegistry;
  protected constructor(serviceName: string, registry: UnifiedServiceRegistry);
  protected handleServiceOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    serviceName: string,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T>;
  protected handleWebSocketError(error: any, serviceName: string, context?: any): void;
  protected logOperation(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    serviceName: string,
    data?: any
  ): void;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  protected getCacheKey(...parts: (string | number)[0]): string;
  protected getService<T>(name: string): T | undefined;
  protected emit(event: string, data: any): void;
}
