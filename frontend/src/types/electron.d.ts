export interface ElectronAPI {
  // App information
  getAppVersion: () => Promise<string>;
  getAppPath: (name: string) => Promise<string>;

  // File system operations
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  showMessageBox: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>;

  // Theme management
  toggleTheme: () => Promise<boolean>;

  // Updates
  checkForUpdates: () => Promise<{ available: boolean; version: string | null }>;

  // Menu event listeners
  onMenuAction: (callback: (event: unknown, data?: unknown) => void) => void;
  removeMenuListeners: () => void;

  // Platform detection
  platform: NodeJS.Platform;

  // Environment
  isDev: boolean;
}

export interface NotificationAPI {
  showNotification: (title: string, options?: NotificationOptions) => Notification | undefined;
  requestPermission: () => Promise<NotificationPermission>;
  getPermission: () => NotificationPermission;
}

export interface StoreAPI {
  set: (key: string, value: unknown) => void;
  get: (key: string, defaultValue?: unknown) => unknown;
  delete: (key: string) => void;
  clear: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    notificationAPI: NotificationAPI;
    storeAPI: StoreAPI;
  }
}

export {};
