import {
  applySettings,
  DEFAULT_SETTINGS,
  getUserDisplayName,
  getUserEmail,
  getUserSettings,
  initializeSettings,
  isDarkMode,
  saveUserSettings,
  UserSettings,
} from '../userSettings';

describe('userSettings utils', () => {
  const LOCAL_STORAGE_KEY = 'a1betting-user-settings';
  const LOCAL_STORAGE_NAME_KEY = 'a1betting-user-name';
  const LOCAL_STORAGE_EMAIL_KEY = 'a1betting-user-email';

  let localStorageMock: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    clear: jest.Mock;
  };

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn((key: string) => {
        if (key === LOCAL_STORAGE_KEY) return null;
        if (key === LOCAL_STORAGE_NAME_KEY) return null;
        if (key === LOCAL_STORAGE_EMAIL_KEY) return null;
        return null;
      }),
      setItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    // Mock document.documentElement and document.body for applySettings
    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: { add: jest.fn(), remove: jest.fn() },
        style: { fontSize: '' },
      },
      writable: true,
    });
    Object.defineProperty(document, 'body', {
      value: { style: { backgroundColor: '' } },
      writable: true,
    });
    // Mock window.dispatchEvent
    jest.spyOn(window, 'dispatchEvent').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getUserSettings should return default settings if nothing in localStorage', () => {
    expect(getUserSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('getUserSettings should return parsed settings from localStorage', () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      display: { ...DEFAULT_SETTINGS.display, darkMode: false },
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(customSettings));
    expect(getUserSettings()).toEqual(customSettings);
  });

  it('getUserSettings should merge saved settings with defaults', () => {
    const partialSettings: Partial<UserSettings> = {
      profile: { name: 'Test User' } as any,
      display: { compactView: true } as any,
      notifications: {} as any,
      betting: {} as any,
      privacy: {} as any,
    };
    const expectedSettings = {
      ...DEFAULT_SETTINGS,
      profile: { ...DEFAULT_SETTINGS.profile, ...(partialSettings.profile || {}) },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(partialSettings.notifications || {}),
      },
      display: { ...DEFAULT_SETTINGS.display, ...(partialSettings.display || {}) },
      betting: { ...DEFAULT_SETTINGS.betting, ...(partialSettings.betting || {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(partialSettings.privacy || {}) },
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(partialSettings));
    expect(getUserSettings()).toEqual(expectedSettings);
  });

  it('applySettings should apply dark mode class and background color', () => {
    // Test dark mode true
    const settingsDark = {
      ...DEFAULT_SETTINGS,
      display: { ...DEFAULT_SETTINGS.display, darkMode: true },
    };
    applySettings(settingsDark);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    expect(document.documentElement.classList.remove).not.toHaveBeenCalledWith('dark');
    expect(document.body.style.backgroundColor).toBe('#0f172a');

    // Reset mocks for the next assertion within the same test
    (document.documentElement.classList.add as jest.Mock).mockClear();
    (document.documentElement.classList.remove as jest.Mock).mockClear();

    // Test dark mode false
    const settingsLight = {
      ...DEFAULT_SETTINGS,
      display: { ...DEFAULT_SETTINGS.display, darkMode: false },
    };
    applySettings(settingsLight);
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    expect(document.documentElement.classList.add).not.toHaveBeenCalledWith('dark');
    expect(document.body.style.backgroundColor).toBe('#ffffff');
  });

  it('applySettings should set font size', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      display: { ...DEFAULT_SETTINGS.display, fontSize: 18 },
    };
    applySettings(settings);
    expect(document.documentElement.style.fontSize).toBe('18px');
  });

  it('saveUserSettings should save settings to localStorage and apply them', () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      profile: { ...DEFAULT_SETTINGS.profile, name: 'New Name' },
    };
    saveUserSettings(customSettings);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEY,
      JSON.stringify(customSettings)
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(LOCAL_STORAGE_NAME_KEY, 'New Name');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE_EMAIL_KEY,
      DEFAULT_SETTINGS.profile.email
    );
    // Check if applySettings was called
    expect(document.documentElement.classList.add).toHaveBeenCalled(); // Dark mode applied
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      new CustomEvent('settingsChanged', { detail: customSettings })
    );
  });

  it('getUserDisplayName should return name from localStorage if available', () => {
    localStorageMock.getItem.mockReturnValueOnce('User From Storage');
    expect(getUserDisplayName()).toBe('User From Storage');
  });

  it('getUserDisplayName should return name from settings if not in localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === LOCAL_STORAGE_KEY)
        return JSON.stringify({ profile: { name: 'Name From Settings' } });
      return null;
    });
    expect(getUserDisplayName()).toBe('Name From Settings');
  });

  it('getUserDisplayName should return default if no name found', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(getUserDisplayName()).toBe(DEFAULT_SETTINGS.profile.name);
  });

  it('getUserEmail should return email from localStorage if available', () => {
    localStorageMock.getItem.mockReturnValueOnce('email@storage.com');
    expect(getUserEmail()).toBe('email@storage.com');
  });

  it('getUserEmail should return email from settings if not in localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === LOCAL_STORAGE_KEY)
        return JSON.stringify({ profile: { email: 'email@settings.com' } });
      return null;
    });
    expect(getUserEmail()).toBe('email@settings.com');
  });

  it('getUserEmail should return default if no email found', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(getUserEmail()).toBe(DEFAULT_SETTINGS.profile.email);
  });

  it('isDarkMode should return dark mode setting', () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ display: { darkMode: true } }));
    expect(isDarkMode()).toBe(true);

    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ display: { darkMode: false } }));
    expect(isDarkMode()).toBe(false);
  });

  it('isDarkMode should return default if settings not found', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(isDarkMode()).toBe(DEFAULT_SETTINGS.display.darkMode);
  });

  it('initializeSettings should get and apply settings', () => {
    const settingsToApply = {
      ...DEFAULT_SETTINGS,
      display: { ...DEFAULT_SETTINGS.display, darkMode: false },
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(settingsToApply));
    initializeSettings();

    // Verify settings were fetched and applied
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    expect(document.body.style.backgroundColor).toBe('#ffffff');
  });
});
