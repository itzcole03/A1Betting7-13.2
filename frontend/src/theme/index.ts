export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  isDark: boolean;
  category: 'cyber' | 'modern' | 'premium' | 'sport';
  animations: boolean;
  glassMorphism: boolean;
}

// Enhanced theme configurations
export const THEMES: Theme[] = [
  {
    id: 'cyber-dark',
    name: 'Cyber Dark',
    description: 'High-tech neon aesthetic with dark background',
    isDark: true,
    category: 'cyber',
    animations: true,
    glassMorphism: true,
    colors: {
      primary: '#06ffa5',
      secondary: '#00ff88',
      accent: '#00d4ff',
      background:
        'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)',
      surface: 'rgba(255, 255, 255, 0.05)',
      text: {
        primary: '#ffffff',
        secondary: '#e2e8f0',
        muted: '#94a3b8',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #06ffa5, #00ff88)',
        secondary: 'linear-gradient(45deg, #00d4ff, #7c3aed)',
        accent: 'linear-gradient(45deg, #ff006e, #8338ec)',
      },
    },
  },
  {
    id: 'cyber-light',
    name: 'Cyber Light',
    description: 'High-tech neon aesthetic with light background',
    isDark: false,
    category: 'cyber',
    animations: true,
    glassMorphism: true,
    colors: {
      primary: '#059669',
      secondary: '#0d9488',
      accent: '#0891b2',
      background:
        'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%, #f8fafc 100%)',
      surface: 'rgba(255, 255, 255, 0.8)',
      text: {
        primary: '#0f172a',
        secondary: '#334155',
        muted: '#64748b',
      },
      status: {
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #059669, #0d9488)',
        secondary: 'linear-gradient(45deg, #0891b2, #7c3aed)',
        accent: 'linear-gradient(45deg, #dc2626, #7c3aed)',
      },
    },
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'Clean modern interface with dark mode',
    isDark: true,
    category: 'modern',
    animations: false,
    glassMorphism: false,
    colors: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
      surface: '#1f2937',
      text: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
        muted: '#9ca3af',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #3b82f6, #6366f1)',
        secondary: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
        accent: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
      },
    },
  },
  {
    id: 'modern-light',
    name: 'Modern Light',
    description: 'Clean modern interface with light mode',
    isDark: false,
    category: 'modern',
    animations: false,
    glassMorphism: false,
    colors: {
      primary: '#2563eb',
      secondary: '#4f46e5',
      accent: '#7c3aed',
      background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #ffffff 100%)',
      surface: '#ffffff',
      text: {
        primary: '#111827',
        secondary: '#374151',
        muted: '#6b7280',
      },
      status: {
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #2563eb, #4f46e5)',
        secondary: 'linear-gradient(45deg, #4f46e5, #7c3aed)',
        accent: 'linear-gradient(45deg, #7c3aed, #db2777)',
      },
    },
  },
  {
    id: 'premium-gold',
    name: 'Premium Gold',
    description: 'Luxury gold and black premium theme',
    isDark: true,
    category: 'premium',
    animations: true,
    glassMorphism: true,
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#d97706',
      background:
        'linear-gradient(135deg, #0c0a09 0%, #1c1917 25%, #292524 50%, #1c1917 75%, #0c0a09 100%)',
      surface: 'rgba(251, 191, 36, 0.1)',
      text: {
        primary: '#fbbf24',
        secondary: '#f3f4f6',
        muted: '#d1d5db',
      },
      status: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
        secondary: 'linear-gradient(45deg, #f59e0b, #d97706)',
        accent: 'linear-gradient(45deg, #d97706, #92400e)',
      },
    },
  },
  {
    id: 'premium-purple',
    name: 'Premium Purple',
    description: 'Luxury purple and violet premium theme',
    isDark: true,
    category: 'premium',
    animations: true,
    glassMorphism: true,
    colors: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#6d28d9',
      background:
        'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #312e81 75%, #1e1b4b 100%)',
      surface: 'rgba(139, 92, 246, 0.1)',
      text: {
        primary: '#c4b5fd',
        secondary: '#e2e8f0',
        muted: '#94a3b8',
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
        secondary: 'linear-gradient(45deg, #7c3aed, #6d28d9)',
        accent: 'linear-gradient(45deg, #6d28d9, #581c87)',
      },
    },
  },
  {
    id: 'sport-nba',
    name: 'NBA Theme',
    description: 'NBA-inspired red, white, and blue theme',
    isDark: true,
    category: 'sport',
    animations: true,
    glassMorphism: false,
    colors: {
      primary: '#1d428a',
      secondary: '#c9082a',
      accent: '#ffffff',
      background:
        'linear-gradient(135deg, #0a1428 0%, #1d428a 25%, #c9082a 50%, #1d428a 75%, #0a1428 100%)',
      surface: 'rgba(29, 66, 138, 0.2)',
      text: {
        primary: '#ffffff',
        secondary: '#e2e8f0',
        muted: '#94a3b8',
      },
      status: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #1d428a, #c9082a)',
        secondary: 'linear-gradient(45deg, #c9082a, #ffffff)',
        accent: 'linear-gradient(45deg, #ffffff, #1d428a)',
      },
    },
  },
  {
    id: 'sport-nfl',
    name: 'NFL Theme',
    description: 'NFL-inspired navy and red theme',
    isDark: true,
    category: 'sport',
    animations: true,
    glassMorphism: false,
    colors: {
      primary: '#013369',
      secondary: '#d50a0a',
      accent: '#ffffff',
      background:
        'linear-gradient(135deg, #001122 0%, #013369 25%, #d50a0a 50%, #013369 75%, #001122 100%)',
      surface: 'rgba(1, 51, 105, 0.2)',
      text: {
        primary: '#ffffff',
        secondary: '#e2e8f0',
        muted: '#94a3b8',
      },
      status: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      gradients: {
        primary: 'linear-gradient(45deg, #013369, #d50a0a)',
        secondary: 'linear-gradient(45deg, #d50a0a, #ffffff)',
        accent: 'linear-gradient(45deg, #ffffff, #013369)',
      },
    },
  },
];

// Theme helper functions
export const getThemeById = (id: string): Theme | undefined => {
  return THEMES.find(theme => theme.id === id);
};

export const getThemesByCategory = (category: Theme['category']): Theme[] => {
  return THEMES.filter(theme => theme.category === category);
};

export const getDarkThemes = (): Theme[] => {
  return THEMES.filter(theme => theme.isDark);
};

export const getLightThemes = (): Theme[] => {
  return THEMES.filter(theme => !theme.isDark);
};

export const getAnimatedThemes = (): Theme[] => {
  return THEMES.filter(theme => theme.animations);
};

export const getGlassMorphismThemes = (): Theme[] => {
  return THEMES.filter(theme => theme.glassMorphism);
};

// Theme categories for filtering
export const THEME_CATEGORIES = [
  { id: 'all', label: 'All Themes', count: THEMES.length },
  { id: 'cyber', label: 'Cyber', count: getThemesByCategory('cyber').length },
  { id: 'modern', label: 'Modern', count: getThemesByCategory('modern').length },
  { id: 'premium', label: 'Premium', count: getThemesByCategory('premium').length },
  { id: 'sport', label: 'Sports', count: getThemesByCategory('sport').length },
];

// Default theme
export const DEFAULT_THEME = 'cyber-dark';

// CSS variable mapping
export const applyCSSVariables = (theme: Theme) => {
  const root = document.documentElement;

  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-surface', theme.colors.surface);
  root.style.setProperty('--theme-text-primary', theme.colors.text.primary);
  root.style.setProperty('--theme-text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--theme-text-muted', theme.colors.text.muted);
  root.style.setProperty('--theme-success', theme.colors.status.success);
  root.style.setProperty('--theme-warning', theme.colors.status.warning);
  root.style.setProperty('--theme-error', theme.colors.status.error);
  root.style.setProperty('--theme-info', theme.colors.status.info);
  root.style.setProperty('--theme-gradient-primary', theme.colors.gradients.primary);
  root.style.setProperty('--theme-gradient-secondary', theme.colors.gradients.secondary);
  root.style.setProperty('--theme-gradient-accent', theme.colors.gradients.accent);

  // Apply theme class to body
  document.body.className = document.body.className.replace(/theme-\w+(-\w+)?/g, '');
  document.body.classList.add(`theme-${theme.id}`);

  // Set data attribute for CSS targeting
  document.documentElement.setAttribute('data-theme', theme.id);
};

// Theme persistence
export const saveTheme = (themeId: string) => {
  localStorage.setItem('a1betting-theme', themeId);
};

export const loadTheme = (): string => {
  return localStorage.getItem('a1betting-theme') || DEFAULT_THEME;
};

// Auto theme detection
export const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getRecommendedTheme = (): string => {
  const systemTheme = getSystemTheme();
  return systemTheme === 'dark' ? 'cyber-dark' : 'cyber-light';
};

// Export all themes for components
export { THEMES as AVAILABLE_THEMES };
export default THEMES;
