console.log('AppStreamlinedContent loaded');
import {
  Crown,
  PlayCircle,
  Settings,
  Target,
  ToggleLeft,
  ToggleRight,
  User,
  Zap,
} from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react';
import HealthBanner from './components/common/HealthBanner';
import { Toaster } from './components/common/notifications/Toaster';
import { ErrorBoundary } from './components/core/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import the admin wrapper component
const AdminWrapper = React.lazy(() => import('./components/comprehensive/AdminWrapper'));

// Import the three main pages with fallbacks
const LockedBetsPage = React.lazy(() =>
  import('./components/pages/EnhancedLockedBetsPage').catch(() => ({
    default: () => (
      <div className='p-8 text-center'>
        <h2 className='text-2xl font-bold text-white mb-4'>🎯 Locked Bets</h2>
        <p className='text-gray-400'>Loading enhanced betting predictions...</p>
      </div>
    ),
  }))
);
const LiveStreamPage = React.lazy(() =>
  import('./components/pages/EnhancedLiveStreamPage').catch(() => ({
    default: () => (
      <div className='p-8 text-center'>
        <h2 className='text-2xl font-bold text-white mb-4'>📺 Live Stream</h2>
        <p className='text-gray-400'>Live streaming functionality coming soon...</p>
      </div>
    ),
  }))
);
const SettingsAdminPage = React.lazy(() =>
  import('./components/pages/UnifiedSettingsAdminPage').catch(() =>
    import('./components/pages/SimpleSettingsPage').catch(() => ({
      default: () => (
        <div className='p-8 text-center'>
          <h2 className='text-2xl font-bold text-white mb-4'>⚙️ Settings</h2>
          <p className='text-gray-400'>Settings panel loading...</p>
        </div>
      ),
    }))
  )
);

// Modern, clean navigation component
const Navigation = ({
  currentPage,
  setCurrentPage,
  showAdminMode,
  setShowAdminMode,
}: {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  showAdminMode: boolean;
  setShowAdminMode: (show: boolean) => void;
}) => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.permissions?.includes('admin');

  const navItems = [
    {
      id: 'locked-bets',
      label: 'Locked Bets',
      icon: Target,
      description: 'AI-Enhanced Predictions',
    },
    {
      id: 'live-stream',
      label: 'Live Stream',
      icon: PlayCircle,
      description: 'Real-time Data',
    },
    {
      id: 'settings',
      label: isAdmin ? 'Admin Panel' : 'Settings',
      icon: Settings,
      description: isAdmin ? 'System Controls' : 'User Preferences',
    },
  ];

  return (
    <div className='fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-r from-slate-900/95 via-gray-900/95 to-slate-900/95 border-b border-cyan-500/20 shadow-xl shadow-black/20'>
      {/* Enhanced Header */}
      <div className='max-w-[1600px] mx-auto px-6 py-4'>
        <div className='flex items-center justify-between'>
          {/* Brand Section */}
          <div className='flex items-center space-x-6'>
            <div className='group flex items-center space-x-3'>
              <div className='relative'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg'>
                  <Zap className='w-6 h-6 text-white' fill='currentColor' />
                </div>
                <div className='absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300' />
              </div>
              <div>
                <h1 className='text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent'>
                  A1Betting
                </h1>
                <p className='text-xs text-slate-400 font-medium'>Ultra-Enhanced Platform</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className='hidden md:flex items-center space-x-3'>
              <div className='flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold'>
                <div className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse' />
                <span>Live</span>
              </div>

              {isAdmin && (
                <div className='relative group'>
                  <div className='absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 opacity-20 blur-sm rounded-full animate-pulse' />
                  <div className='relative flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 backdrop-blur-sm text-white rounded-full text-xs font-bold border border-purple-400/30 shadow-lg'>
                    <Crown className='w-3 h-3 text-yellow-300' fill='currentColor' />
                    <span className='bg-gradient-to-r from-yellow-200 to-cyan-200 bg-clip-text text-transparent'>
                      ADMIN
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Pills */}
          <div className='flex items-center space-x-2'>
            {navItems.map(item => {
              const isActive = currentPage === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  {isActive && (
                    <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse' />
                  )}

                  <div className='relative flex items-center space-x-3'>
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <div className='hidden lg:block'>
                      <div
                        className={`text-sm font-semibold ${
                          isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </div>
                      <div className='text-xs text-slate-500 group-hover:text-slate-400'>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User Section */}
          {isAuthenticated && (
            <div className='flex items-center space-x-4'>
              {/* Admin Mode Toggle */}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminMode(!showAdminMode)}
                  className={`group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    showAdminMode
                      ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/70 border border-slate-600/40 hover:border-slate-500/60'
                  }`}
                  title={showAdminMode ? 'Exit Admin Mode' : 'Enter Admin Mode'}
                >
                  {showAdminMode && (
                    <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-500/20 animate-pulse' />
                  )}

                  <div className='relative flex items-center space-x-2'>
                    {showAdminMode ? (
                      <>
                        <Crown className='w-4 h-4 text-yellow-300' fill='currentColor' />
                        <span className='hidden sm:block text-sm font-bold bg-gradient-to-r from-yellow-200 to-cyan-200 bg-clip-text text-transparent'>
                          Admin
                        </span>
                        <ToggleRight className='w-4 h-4 text-cyan-300' />
                      </>
                    ) : (
                      <>
                        <User className='w-4 h-4' />
                        <span className='hidden sm:block text-sm'>User</span>
                        <ToggleLeft className='w-4 h-4' />
                      </>
                    )}
                  </div>
                </button>
              )}

              {/* User Avatar */}
              <div className='flex items-center space-x-3 px-3 py-2 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-slate-600/70 transition-colors'>
                <div className='w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg'>
                  <span className='text-white text-sm font-bold'>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className='hidden sm:block'>
                  <div className='text-sm font-semibold text-white'>
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className='text-xs text-slate-400'>{isAdmin ? 'Administrator' : 'User'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AppStreamlinedContent: React.FC = () => {
  // Add a visible error boundary for debugging
  const ErrorFallback = ({ error }: { error: any }) => (
    <div style={{ color: 'red', padding: 32 }}>
      <h2>AppStreamlined Error</h2>
      <pre>{error?.message || String(error)}</pre>
      <pre>{error?.stack}</pre>
    </div>
  );
  const [currentPage, setCurrentPage] = useState('locked-bets');
  const [isLoading, setIsLoading] = useState(false); // Start with false for faster loading
  const [settingsPageError, setSettingsPageError] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);

  useEffect(() => {
    console.log('🚀 A1Betting Ultra-Enhanced Platform initialized');
    console.log('📍 AppStreamlined component mounted successfully');
    console.log('📄 Current page:', currentPage);
    setIsLoading(false);
  }, []);

  const renderCurrentPage = () => {
    try {
      switch (currentPage) {
        case 'locked-bets':
          return <LockedBetsPage />;
        case 'live-stream':
          return <LiveStreamPage />;
        case 'settings':
          return <SettingsAdminPage />;
        default:
          return <LockedBetsPage />;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className='flex items-center justify-center h-64 text-white'>
          <div className='text-center'>
            <div className='text-red-400 mb-2'>⚠️ Component Error</div>
            <div className='text-gray-400'>Unable to load {currentPage} page</div>
            <button
              onClick={() => setCurrentPage('locked-bets')}
              className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
            >
              Return to Locked Bets
            </button>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center'>
        <div className='text-center space-y-6'>
          <div className='relative'>
            <div className='w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto'></div>
            <div
              className='absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto'
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
          </div>
          <div className='space-y-2'>
            <h2 className='text-2xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent'>
              A1Betting Platform
            </h2>
            <p className='text-slate-400'>Initializing ultra-enhanced experience...</p>
          </div>
        </div>
      </div>
    );
  }

  // If admin mode is enabled, render the full admin app
  if (showAdminMode) {
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center'>
              <div className='text-center space-y-6'>
                <div className='relative'>
                  <div className='w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto'></div>
                  <div
                    className='absolute inset-0 w-20 h-20 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin mx-auto'
                    style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                  ></div>
                  <Crown
                    className='w-8 h-8 text-yellow-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                    fill='currentColor'
                  />
                </div>
                <div className='space-y-2'>
                  <h2 className='text-xl font-bold bg-gradient-to-r from-purple-200 via-cyan-200 to-yellow-200 bg-clip-text text-transparent'>
                    Admin Mode Loading
                  </h2>
                  <p className='text-slate-400'>Initializing administrative controls...</p>
                </div>
              </div>
            </div>
          }
        >
          <AdminWrapper onToggleUserMode={() => setShowAdminMode(false)} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback error={null} />}>
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white'>
        <Navigation
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          showAdminMode={showAdminMode}
          setShowAdminMode={setShowAdminMode}
        />

        {/* Main Content Area */}
        <main className='relative'>
          {/* Background Enhancement */}
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1),transparent_50%)] pointer-events-none' />

          <div className='relative z-10 min-h-[calc(100vh-80px)] pt-20'>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className='flex flex-col items-center justify-center h-[50vh] space-y-6'>
                    <div className='relative'>
                      <div className='w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin'></div>
                      <div
                        className='absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin'
                        style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                      ></div>
                    </div>
                    <div className='text-center space-y-2'>
                      <div className='text-xl font-semibold text-white'>Loading Component</div>
                      <div className='text-sm text-slate-400'>
                        Initializing enhanced experience...
                      </div>
                    </div>
                  </div>
                }
              >
                <HealthBanner />
                {renderCurrentPage()}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>

        {/* Enhanced Toast Container */}
        <Toaster />
      </div>
    </ErrorBoundary>
  );
};

const AppStreamlined: React.FC = () => {
  return (
    <AuthProvider>
      <AppStreamlinedContent />
    </AuthProvider>
  );
};

export default AppStreamlined;
