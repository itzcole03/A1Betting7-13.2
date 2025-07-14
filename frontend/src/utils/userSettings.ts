/**
 * User Settings Utilities;
 * Provides easy access to user settings throughout the application;
 */

interface UserSettings {
  profile: {
    name: string;
    email: string;
    timezone: string;
    currency: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  display: {
    darkMode: boolean;
    compactView: boolean;
    fontSize: number;
  };
  betting: {
    defaultStake: number;
    maxStake: number;
    currency: string;
  };
  privacy: {
    sharePredictions: boolean;
    showStats: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    name: 'User',
    email: 'user@a1betting.com',
    timezone: 'UTC-5',
    currency: 'USD',
  },
  notifications: {
    email: true,
    push: true,
    sound: false,
  },
  display: {
    darkMode: true,
    compactView: false,
    fontSize: 16,
  },
  betting: {
    defaultStake: 10,
    maxStake: 100,
    currency: 'USD',
  },
  privacy: {
    sharePredictions: false,
    showStats: true,
  },
};

/**
 * Get user settings from localStorage;
 */
export const getUserSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem('a1betting-user-settings');
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed) {
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    // console statement removed
  }
  return DEFAULT_SETTINGS;
};

/**
 * Apply settings to the DOM;
 */
export const applySettings = (settings: UserSettings): void => {
  // Dark mode;
  if (settings.display.darkMode) {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#0f172a';
  } else {
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = '#ffffff';
  }

  // Font size;
  document.documentElement.style.fontSize = `${settings.display.fontSize}px`;
};

/**
 * Save user settings to localStorage;
 */
export const saveUserSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem('a1betting-user-settings', JSON.stringify(settings));
    localStorage.setItem('a1betting-user-name', settings.profile.name);
    localStorage.setItem('a1betting-user-email', settings.profile.email);

    // Apply settings immediately;
    applySettings(settings);

    // Notify other components;
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
  } catch (error) {
    // console statement removed
  }
};

/**
 * Get user display name;
 */
export const getUserDisplayName = (): string => {
  try {
    const saved = localStorage.getItem('a1betting-user-name');
    if (saved) return saved;
    const settings = getUserSettings();
    return settings.profile.name;
  } catch (error) {
    // console statement removed
    return 'User';
  }
};

/**
 * Get user email;
 */
export const getUserEmail = (): string => {
  try {
    const saved = localStorage.getItem('a1betting-user-email');
    if (saved) return saved;
    const settings = getUserSettings();
    return settings.profile.email;
  } catch (error) {
    // console statement removed
    return 'user@a1betting.com';
  }
};

/**
 * Check if dark mode is enabled;
 */
export const isDarkMode = (): boolean => {
  try {
    const settings = getUserSettings();
    return settings.display.darkMode;
  } catch (error) {
    // console statement removed
    return true; // Default to dark mode;
  }
};

/**
 * Initialize settings on app startup;
 */
export const initializeSettings = (): void => {
  const settings = getUserSettings();
  applySettings(settings);
};
