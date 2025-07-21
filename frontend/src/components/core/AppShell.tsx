import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Menu,
  X,
  Settings,
  User,
  Bell,
  TrendingUp,
  Shield,
  LogOut,
  Crown,
} from 'lucide-react';
// @ts-expect-error TS(6142): Module './Navigation' was resolved to 'C:/Users/bc... Remove this comment to see the full error message
import { Navigation } from './Navigation';
import { cn } from '../../lib/utils';
import { HolographicText, CyberButton, GlowCard, ParticleField } from '../ui';
// @ts-expect-error TS(6142): Module '../../contexts/AuthContext' was resolved t... Remove this comment to see the full error message
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
// @ts-expect-error TS(6142): Module '../auth/PermissionGuard' was resolved to '... Remove this comment to see the full error message
import { AdminOnly } from '../auth/PermissionGuard';

interface AppShellProps {
  children: React.ReactNode;
  activeView?: string;
  onNavigate?: (viewId: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { user, logout } = useAuth();
  const { canAccessAdminDashboard, isSuperAdmin, getHighestRole } = usePermissions();

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Mock search results - replace with actual search logic
      const mockResults = [
        {
          id: 'moneymaker',
          title: 'Money Maker',
          description: 'AI-powered betting recommendations',
        },
        { id: 'analytics', title: 'ML Analytics', description: '47+ machine learning models' },
        {
          id: 'arbitrage',
          title: 'Arbitrage Scanner',
          description: 'Real-time arbitrage opportunities',
        },
        { id: 'prizepicks', title: 'PrizePicks Pro', description: 'Daily fantasy optimization' },
      ].filter(
        item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(mockResults);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative'>
      {/* Enhanced Cyber Background Effects */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='fixed inset-0 z-0 pointer-events-none'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ParticleField variant='cyber' density='medium' speed='slow' interactive={true} />
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='fixed inset-0 z-0 pointer-events-none'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className='absolute inset-0 opacity-30'
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(6, 255, 165, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(0, 212, 255, 0.05) 0%, transparent 50%)
            `,
          }}
        />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className='absolute inset-0 opacity-20'
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(6, 255, 165, 0.15) 1px, transparent 0)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Mobile Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <header className='lg:hidden relative z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between p-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='p-2 rounded-lg text-white hover:bg-slate-800/50 transition-colors'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              {isMobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </button>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <HolographicText size='lg' intensity='medium' glow={true}>
              A1BETTING
            </HolographicText>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CyberButton
              variant='primary'
              size='sm'
              glow={true}
              onClick={() => {
                console.log('Notifications clicked');
              }}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Bell className='w-5 h-5' />
            </CyberButton>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AdminOnly showFallback={false}>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CyberButton
                variant='primary'
                size='sm'
                glow={true}
                className='bg-gradient-to-r from-purple-500 to-cyan-500'
                onClick={() => {
                  window.location.href = '/admin';
                }}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Crown className='w-4 h-4' />
              </CyberButton>
            </AdminOnly>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CyberButton
              variant='neon'
              size='sm'
              glow={true}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <User className='w-5 h-5' />
            </CyberButton>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <header className='hidden lg:block relative z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='max-w-7xl mx-auto px-6 py-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            {/* Logo */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-3'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <TrendingUp className='w-6 h-6 text-white' />
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <HolographicText size='xl' intensity='high' glow={true}>
                    A1BETTING
                  </HolographicText>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-xs text-gray-400'>Ultimate Sports Intelligence Platform</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex-1 max-w-2xl mx-8 relative'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='relative'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <input
                  type='text'
                  placeholder='Search features, games, or insights...'
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all'
                />
              </div>

              {/* Search Results */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <AnimatePresence>
                {isSearchOpen && searchResults.length > 0 && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden z-50'
                  >
                    {searchResults.map(result => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <button
                        key={result.id}
                        className='w-full px-4 py-3 text-left hover:bg-slate-700/50 border-b border-slate-700/30 last:border-b-0 transition-colors'
                        onClick={() => {
                          // Handle navigation to result
                          if (onNavigate) {
                            onNavigate(result.id);
                          }
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='font-medium text-white'>{result.title}</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-sm text-gray-400'>{result.description}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='hidden md:flex items-center space-x-4 text-sm'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-green-400 font-medium'>+$18,420</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-cyan-400'>ROI: +847%</div>
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CyberButton
                  variant='primary'
                  size='sm'
                  glow={true}
                  className='relative'
                  onClick={() => {
                    // Handle notifications
                    console.log('Notifications clicked');
                  }}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Bell className='w-5 h-5' />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center'>
                    3
                  </span>
                </CyberButton>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <CyberButton
                  variant='secondary'
                  size='sm'
                  glow={true}
                  onClick={() => {
                    // Handle settings
                    if (onNavigate) {
                      onNavigate('settings');
                    }
                    console.log('Settings clicked');
                  }}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Settings className='w-5 h-5' />
                </CyberButton>

                {/* Admin Dashboard Access */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <AdminOnly>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <CyberButton
                    variant='primary'
                    size='sm'
                    glow={true}
                    className='bg-gradient-to-r from-purple-500 to-cyan-500 border-purple-500/50'
                    onClick={() => {
                      window.location.href = '/admin';
                    }}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Crown className='w-4 h-4 mr-1' />
                    Admin
                  </CyberButton>
                </AdminOnly>

                {/* User Menu */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='relative user-menu-container'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className='flex items-center space-x-3 ml-2 p-2 rounded-lg hover:bg-slate-700/50 transition-colors'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='w-8 h-8 rounded-full bg-gradient-to-r from-cyber-primary to-cyber-accent flex items-center justify-center'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-slate-900 font-bold text-sm'>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='hidden xl:block text-left'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm font-medium text-white'>
                        {user?.email?.split('@')[0] || 'User'}
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400 capitalize'>
                        {getHighestRole() || 'user'}
                      </div>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <AnimatePresence>
                    {showUserMenu && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className='absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-xl z-50'
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='p-4 border-b border-slate-700/50'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center space-x-3'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='w-10 h-10 rounded-full bg-gradient-to-r from-cyber-primary to-cyber-accent flex items-center justify-center'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-slate-900 font-bold'>
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='font-medium text-white'>{user?.email}</div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='text-sm text-gray-400 capitalize flex items-center space-x-2'>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                {isSuperAdmin() && <Shield className='w-3 h-3 text-purple-400' />}
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span>{getHighestRole()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='p-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <button
                            onClick={() => {
                              if (onNavigate) onNavigate('settings');
                              setShowUserMenu(false);
                            }}
                            className='w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-slate-700/50 rounded-lg transition-colors'
                          >
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Settings className='w-4 h-4 text-gray-400' />
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span className='text-white'>Settings</span>
                          </button>

                          {canAccessAdminDashboard() && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <button
                              onClick={() => {
                                window.location.href = '/admin';
                                setShowUserMenu(false);
                              }}
                              className='w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-slate-700/50 rounded-lg transition-colors'
                            >
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <Crown className='w-4 h-4 text-purple-400' />
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-white'>Admin Dashboard</span>
                            </button>
                          )}

                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='my-2 border-t border-slate-700/50' />

                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className='w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-red-500/10 rounded-lg transition-colors text-red-400'
                          >
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <LogOut className='w-4 h-4' />
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex relative z-30'>
        {/* Navigation Sidebar */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Navigation
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          activeView={activeView}
          onNavigate={onNavigate}
        />

        {/* Main Content Area */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <main className='flex-1 min-h-screen'>
          {/* Mobile Menu Overlay */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AnimatePresence>
            {isMobileMenuOpen && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='lg:hidden fixed inset-0 bg-black/50 z-40'
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Page Content */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='p-6 lg:p-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <GlowCard
              variant='cyber'
              intensity='medium'
              animate={true}
              hover={false}
              className='min-h-full'
            >
              {children}
            </GlowCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
