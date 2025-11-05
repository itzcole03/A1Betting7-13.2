import React, { useState, useEffect } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for unified UI system
interface UITheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  shadow: string;
}

interface UILayout {
  sidebar: 'left' | 'right' | 'hidden';
  header: 'top' | 'hidden';
  footer: 'bottom' | 'hidden';
  controls: 'top' | 'bottom' | 'floating' | 'hidden';
  density: 'compact' | 'comfortable' | 'spacious';
}

interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface UIState {
  loading: boolean;
  error: string | null;
  notifications: UINotification[];
  sidebarCollapsed: boolean;
  theme: UITheme;
  layout: UILayout;
  fullscreen: boolean;
  focusMode: boolean;
}

interface UnifiedUIProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyber' | 'minimal' | 'professional' | 'gaming';
  initialTheme?: 'light' | 'dark' | 'auto';
  showHeader?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
  showControls?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableThemeToggle?: boolean;
  enableFullscreen?: boolean;
  enableFocusMode?: boolean;
  className?: string;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  controls?: React.ReactNode;
  onStateChange?: (state: Partial<UIState>) => void;
  onNotificationAction?: (notificationId: string, actionIndex: number) => void;
}

const _themes: Record<string, UITheme> = {
  light: {
    name: 'Light',
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-gray-600 text-white',
    accent: 'bg-purple-600 text-white',
    background: 'bg-gray-50',
    surface: 'bg-white',
    text: 'text-gray-900',
    border: 'border-gray-200',
    shadow: 'shadow-sm',
  },
  dark: {
    name: 'Dark',
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    accent: 'bg-purple-500 text-white',
    background: 'bg-gray-900',
    surface: 'bg-gray-800',
    text: 'text-gray-100',
    border: 'border-gray-700',
    shadow: 'shadow-lg',
  },
  cyber: {
    name: 'Cyber',
    primary: 'bg-cyan-500 text-black',
    secondary: 'bg-slate-600 text-white',
    accent: 'bg-purple-500 text-white',
    background: 'bg-slate-900',
    surface: 'bg-slate-800',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    shadow: 'shadow-cyan-500/20',
  },
};

const _getVariantClasses = (variant: string, theme: UITheme) => {
  const _baseClasses = cn('min-h-screen transition-all duration-300', theme.background, theme.text);

  const _variantSpecific = {
    default: '',
    cyber: 'relative overflow-hidden',
    minimal: 'bg-white text-gray-900',
    professional: 'bg-gray-100 text-gray-900',
    gaming: 'bg-black text-green-400',
  };

  return cn(baseClasses, variantSpecific[variant as keyof typeof variantSpecific]);
};

export const _UnifiedUI: React.FC<UnifiedUIProps> = ({
  children,
  variant = 'default',
  initialTheme = 'light',
  showHeader = true,
  showSidebar = true,
  showFooter = false,
  showControls = true,
  enableKeyboardShortcuts = true,
  enableThemeToggle = true,
  enableFullscreen = true,
  enableFocusMode = true,
  className,
  header,
  sidebar,
  footer,
  controls,
  onStateChange,
  onNotificationAction,
}) => {
  const [uiState, setUIState] = useState<UIState>({
    loading: false,
    error: null,
    notifications: [],
    sidebarCollapsed: false,
    theme: themes[initialTheme] || themes.light,
    layout: {
      sidebar: showSidebar ? 'left' : 'hidden',
      header: showHeader ? 'top' : 'hidden',
      footer: showFooter ? 'bottom' : 'hidden',
      controls: showControls ? 'top' : 'hidden',
      density: 'comfortable',
    },
    fullscreen: false,
    focusMode: false,
  });

  // Theme detection for auto mode
  useEffect(() => {
    if (initialTheme === 'auto') {
      const _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const _handleChange = (e: MediaQueryListEvent) => {
        updateUIState({ theme: themes[e.matches ? 'dark' : 'light'] });
      };

      mediaQuery.addEventListener('change', handleChange);
      updateUIState({ theme: themes[mediaQuery.matches ? 'dark' : 'light'] });

      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [initialTheme]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const _handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            toggleSidebar();
            break;
          case 'f':
            if (enableFullscreen) {
              e.preventDefault();
              toggleFullscreen();
            }
            break;
          case '.':
            if (enableFocusMode) {
              e.preventDefault();
              toggleFocusMode();
            }
            break;
          case 't':
            if (enableThemeToggle) {
              e.preventDefault();
              cycleTheme();
            }
            break;
        }
      }

      // Escape key actions
      if (e.key === 'Escape') {
        if (uiState.fullscreen) {
          toggleFullscreen();
        } else if (uiState.focusMode) {
          toggleFocusMode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardShortcuts,
    enableFullscreen,
    enableFocusMode,
    enableThemeToggle,
    uiState.fullscreen,
    uiState.focusMode,
  ]);

  const _updateUIState = (updates: Partial<UIState>) => {
    setUIState(prev => {
      const _newState = { ...prev, ...updates };
      onStateChange?.(updates);
      return newState;
    });
  };

  const _toggleSidebar = () => {
    updateUIState({ sidebarCollapsed: !uiState.sidebarCollapsed });
  };

  const _toggleFullscreen = () => {
    if (!enableFullscreen) return;

    if (!uiState.fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    updateUIState({ fullscreen: !uiState.fullscreen });
  };

  const _toggleFocusMode = () => {
    if (!enableFocusMode) return;
    updateUIState({ focusMode: !uiState.focusMode });
  };

  const _cycleTheme = () => {
    if (!enableThemeToggle) return;

    const _themeNames = Object.keys(themes);
    const _currentIndex = themeNames.findIndex(name => themes[name].name === uiState.theme.name);
    const _nextIndex = (currentIndex + 1) % themeNames.length;
    updateUIState({ theme: themes[themeNames[nextIndex]] });
  };

  const _addNotification = (notification: Omit<UINotification, 'id'>) => {
    const _newNotification: UINotification = {
      ...notification,
      id: Date.now().toString(),
    };
    updateUIState({
      notifications: [...uiState.notifications, newNotification],
    });

    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const _removeNotification = (id: string) => {
    updateUIState({
      notifications: uiState.notifications.filter(n => n.id !== id),
    });
  };

  const _handleNotificationAction = (notificationId: string, actionIndex: number) => {
    const _notification = uiState.notifications.find(n => n.id === notificationId);
    if (notification?.actions?.[actionIndex]) {
      notification.actions[actionIndex].onClick();
      onNotificationAction?.(notificationId, actionIndex);
      removeNotification(notificationId);
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        getVariantClasses(variant, uiState.theme),
        uiState.fullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Global Loading Overlay */}
      {uiState.loading && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={cn('p-6 rounded-lg', uiState.theme.surface, uiState.theme.shadow)}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span>Loading...</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {uiState.notifications.length > 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed top-4 right-4 z-40 space-y-2 max-w-sm'>
          {uiState.notifications.map(notification => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              key={notification.id}
              className={cn(
                'p-4 rounded-lg border shadow-lg transition-all duration-300',
                uiState.theme.surface,
                uiState.theme.border,
                {
                  'border-blue-500': notification.type === 'info',
                  'border-green-500': notification.type === 'success',
                  'border-yellow-500': notification.type === 'warning',
                  'border-red-500': notification.type === 'error',
                }
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-between items-start'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex-1'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h4 className='font-medium'>{notification.title}</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-sm opacity-80 mt-1'>{notification.message}</p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={() => removeNotification(notification.id)}
                  className='ml-2 text-sm opacity-60 hover:opacity-100'
                >
                  ✕
                </button>
              </div>

              {notification.actions && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex space-x-2 mt-3'>
                  {notification.actions.map((action, index) => (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <button
                      key={index}
                      onClick={() => handleNotificationAction(notification.id, index)}
                      className={cn(
                        'px-3 py-1 text-xs rounded transition-colors',
                        action.variant === 'primary'
                          ? uiState.theme.primary
                          : uiState.theme.secondary
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {uiState.error && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed top-4 left-1/2 transform -translate-x-1/2 z-40'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'p-4 rounded-lg border border-red-500 bg-red-50 text-red-700 shadow-lg',
              'flex items-center space-x-3'
            )}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>❌</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>{uiState.error}</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={() => updateUIState({ error: null })}
              className='ml-2 text-red-500 hover:text-red-700'
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      {showHeader && !uiState.focusMode && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <header
          className={cn(
            'border-b backdrop-blur-sm z-30',
            uiState.theme.surface,
            uiState.theme.border
          )}
        >
          {header || (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center justify-between p-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-4'>
                {showSidebar && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={toggleSidebar}
                    className='p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                    title='Toggle Sidebar (Ctrl+B)'
                  >
                    ☰
                  </button>
                )}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h1 className='text-lg font-semibold'>A1 Betting Platform</h1>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                {enableThemeToggle && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={cycleTheme}
                    className='p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                    title='Switch Theme (Ctrl+T)'
                  >
                    🎨
                  </button>
                )}
                {enableFocusMode && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={toggleFocusMode}
                    className='p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                    title='Focus Mode (Ctrl+.)'
                  >
                    🎯
                  </button>
                )}
                {enableFullscreen && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={toggleFullscreen}
                    className='p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                    title='Fullscreen (Ctrl+F)'
                  >
                    {uiState.fullscreen ? '⊡' : '⊞'}
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* Controls Bar */}
      {showControls && !uiState.focusMode && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn('border-b z-20', uiState.theme.surface, uiState.theme.border)}>
          {controls || (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='p-2 flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-sm opacity-70'>
                {uiState.theme.name} Theme • {uiState.layout.density} Density
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-xs opacity-50'>
                Shortcuts: Ctrl+B (sidebar), Ctrl+F (fullscreen), Ctrl+. (focus)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Layout */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex flex-1 relative'>
        {/* Sidebar */}
        {showSidebar && !uiState.focusMode && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <aside
            className={cn(
              'border-r transition-all duration-300 z-10',
              uiState.theme.surface,
              uiState.theme.border,
              uiState.sidebarCollapsed ? 'w-16' : 'w-64'
            )}
          >
            {sidebar || (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='p-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn('text-sm opacity-70', uiState.sidebarCollapsed && 'text-center')}
                >
                  {uiState.sidebarCollapsed ? '☰' : 'Navigation'}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <main className='flex-1 overflow-auto'>{children}</main>
      </div>

      {/* Footer */}
      {showFooter && !uiState.focusMode && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <footer
          className={cn('border-t mt-auto z-10', uiState.theme.surface, uiState.theme.border)}
        >
          {footer || (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='p-4 text-center text-sm opacity-70'>A1 Betting Platform © 2024</div>
          )}
        </footer>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='fixed inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='fixed inset-0 bg-grid-white/[0.02] pointer-events-none' />
          {/* Animated corners */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='fixed top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='fixed top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='fixed bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='fixed bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 pointer-events-none' />
        </>
      )}

      {/* Focus Mode Indicator */}
      {uiState.focusMode && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed top-4 left-4 z-40'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={cn('px-3 py-1 rounded text-sm', uiState.theme.accent)}>🎯 Focus Mode</div>
        </div>
      )}
    </div>
  );
};
