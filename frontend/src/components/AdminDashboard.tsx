import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { AdminRoute } from './auth/RouteGuard';

const AdminDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-300'>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-900'>
      {/* Admin Header Bar */}
      <div className='bg-slate-800/90 backdrop-blur-lg border-b border-slate-700/50 p-4'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center space-x-2 sm:space-x-4 flex-shrink-0'>
            <button
              onClick={() => (window.location.href = '/')}
              className='flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white transition-colors text-sm'
            >
              <ArrowLeft className='w-4 h-4' />
              <span className='hidden sm:inline'>Exit Admin Mode</span>
              <span className='sm:hidden'>Exit</span>
            </button>

            <div className='flex items-center space-x-2'>
              <Shield className='w-4 h-4 sm:w-5 sm:h-5 text-purple-400' />
              <span className='text-white font-medium text-sm sm:text-base hidden sm:inline'>
                Admin Dashboard
              </span>
              <span className='text-white font-medium text-sm sm:hidden'>Admin</span>
            </div>
          </div>

          <div className='flex items-center space-x-2 sm:space-x-4 flex-shrink-0'>
            <div className='text-right hidden sm:block'>
              <p className='text-sm text-gray-300'>{user?.email || 'Admin User'}</p>
              <p className='text-xs text-purple-400'>Administrator</p>
            </div>
            <div className='w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center'>
              <span className='text-white text-sm font-bold'>
                {(user?.email || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Content */}
      <div className='relative'>
        <iframe
          src='/admin-dashboard.html'
          className='w-full h-screen border-0'
          title='Admin Dashboard'
          style={{
            minHeight: 'calc(100vh - 80px)',
            backgroundColor: '#0f172a',
          }}
          onLoad={() => {
            setIsLoading(false);
            console.log('Admin dashboard loaded');
          }}
          onError={() => {
            setIsLoading(false);
            console.error('Admin dashboard failed to load');
          }}
          loading='eager'
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className='absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-10'>
            <div className='text-center'>
              <div className='w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-gray-300 text-lg'>Loading Admin Dashboard...</p>
              <p className='text-gray-500 text-sm mt-2'>Initializing advanced features</p>
            </div>
          </div>
        )}

        {/* Enhanced fallback content */}
        <div className='absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300'>
          <div className='flex items-center justify-center h-full'>
            <div className='bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-xl p-8 max-w-md mx-auto text-center pointer-events-auto'>
              <AlertTriangle className='w-12 h-12 text-yellow-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-white mb-2'>Dashboard Controls</h3>
              <p className='text-gray-300 mb-4 text-sm'>
                Dashboard management and troubleshooting options
              </p>
              <div className='space-y-2'>
                <button
                  onClick={() => window.location.reload()}
                  className='w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all'
                >
                  Refresh Dashboard
                </button>
                <button
                  onClick={() => setIsLoading(true)}
                  className='w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all'
                >
                  Reset Loading State
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = React.memo(() => {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
});

export default AdminDashboard;
