export declare class Application {
  private static instance;
  private readonly serviceRegistry;
  private readonly logger;
  private readonly errorService;
  private readonly websocketService;
  private readonly stateService;
  private readonly settingsService;
  private readonly notificationService;
  private constructor();
  static getInstance(): Application;
  initialize(): Promise<void>;
  private setupErrorHandling;
  private setupWebSocket;
  private loadUserPreferences;
  shutdown(): Promise<void>;
}
