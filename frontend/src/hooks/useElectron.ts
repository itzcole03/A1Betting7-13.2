import { useEffect, useState, useCallback } from 'react';

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Check if running in Electron
    const isElectronApp = !!window.electronAPI;
    setIsElectron(isElectronApp);

    if (isElectronApp) {
      // Get app version
      window.electronAPI.getAppVersion().then(setAppVersion);

      // Get platform
      setPlatform(window.electronAPI.platform);

      // Set up menu listeners
      window.electronAPI.onMenuAction((event, data) => {
        // Handle menu actions
        console.log('Menu action:', event, data);
      });
    }

    return () => {
      if (isElectronApp) {
        window.electronAPI.removeMenuListeners();
      }
    };
  }, []);

  const showSaveDialog = useCallback(
    // @ts-expect-error TS(2503): Cannot find namespace 'Electron'.
    async (options: Electron.SaveDialogOptions) => {
      if (!isElectron) return null;
      return await window.electronAPI.showSaveDialog(options);
    },
    [isElectron]
  );

  const showOpenDialog = useCallback(
    // @ts-expect-error TS(2503): Cannot find namespace 'Electron'.
    async (options: Electron.OpenDialogOptions) => {
      if (!isElectron) return null;
      return await window.electronAPI.showOpenDialog(options);
    },
    [isElectron]
  );

  const showMessageBox = useCallback(
    // @ts-expect-error TS(2503): Cannot find namespace 'Electron'.
    async (options: Electron.MessageBoxOptions) => {
      if (!isElectron) return null;
      return await window.electronAPI.showMessageBox(options);
    },
    [isElectron]
  );

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isElectron) {
        // Fallback to web notifications
        if ('Notification' in window && Notification.permission === 'granted') {
          return new Notification(title, options);
        }
        return null;
      }
      return window.notificationAPI.showNotification(title, options);
    },
    [isElectron]
  );

  const requestNotificationPermission = useCallback(async () => {
    if (!isElectron) {
      if ('Notification' in window) {
        return await Notification.requestPermission();
      }
      return 'denied';
    }
    return await window.notificationAPI.requestPermission();
  }, [isElectron]);

  const toggleTheme = useCallback(async () => {
    if (!isElectron) return false;
    return await window.electronAPI.toggleTheme();
  }, [isElectron]);

  const checkForUpdates = useCallback(async () => {
    if (!isElectron) return { available: false, version: null };
    return await window.electronAPI.checkForUpdates();
  }, [isElectron]);

  // Store API wrapper
  const store = {
    set: useCallback(
      (key: string, value: any) => {
        if (isElectron) {
          window.storeAPI.set(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      },
      [isElectron]
    ),

    get: useCallback(
      (key: string, defaultValue: any = null) => {
        if (isElectron) {
          return window.storeAPI.get(key, defaultValue);
        } else {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
        }
      },
      [isElectron]
    ),

    delete: useCallback(
      (key: string) => {
        if (isElectron) {
          window.storeAPI.delete(key);
        } else {
          localStorage.removeItem(key);
        }
      },
      [isElectron]
    ),

    clear: useCallback(() => {
      if (isElectron) {
        window.storeAPI.clear();
      } else {
        localStorage.clear();
      }
    }, [isElectron]),
  };

  return {
    isElectron,
    appVersion,
    platform,
    showSaveDialog,
    showOpenDialog,
    showMessageBox,
    showNotification,
    requestNotificationPermission,
    toggleTheme,
    checkForUpdates,
    store,
  };
};

// Menu action hooks
export const useMenuActions = () => {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(!!window.electronAPI);
  }, []);

  const registerMenuHandlers = useCallback(
    (handlers: {
      onNewAnalysis?: () => void;
      onExportData?: (filePath: string) => void;
      onSettings?: () => void;
      onStartAnalysis?: () => void;
      onRefreshPredictions?: () => void;
      onPortfolioOptimizer?: () => void;
      onSmartStacking?: () => void;
      onFeedback?: () => void;
    }) => {
      if (!isElectron) return;

      const handleMenuAction = (event: any, data?: any) => {
        switch (event.type) {
          case 'menu-new-analysis':
            handlers.onNewAnalysis?.();
            break;
          case 'menu-export-data':
            handlers.onExportData?.(data);
            break;
          case 'menu-settings':
            handlers.onSettings?.();
            break;
          case 'menu-start-analysis':
            handlers.onStartAnalysis?.();
            break;
          case 'menu-refresh-predictions':
            handlers.onRefreshPredictions?.();
            break;
          case 'menu-portfolio-optimizer':
            handlers.onPortfolioOptimizer?.();
            break;
          case 'menu-smart-stacking':
            handlers.onSmartStacking?.();
            break;
          case 'menu-feedback':
            handlers.onFeedback?.();
            break;
        }
      };

      window.electronAPI.onMenuAction(handleMenuAction);

      return () => {
        window.electronAPI.removeMenuListeners();
      };
    },
    [isElectron]
  );

  return { registerMenuHandlers, isElectron };
};
