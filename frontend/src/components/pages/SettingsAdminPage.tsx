import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Shield,
  Database,
  BarChart3,
  RefreshCw,
  Monitor,
  Bell,
  Palette,
  Key,
  Activity,
  Users,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserProfile {
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
  last_login: string;
}

interface SystemHealth {
  status: string;
  backend_status: string;
  ml_ensemble_status: string;
  database_status: string;
  cache_status: string;
  uptime: number;
  last_update: string;
}

const SettingsAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: 'demo_user',
    email: 'demo@a1betting.com',
    role: 'admin', // For demo purposes, set as admin
    created_at: '2024-01-01T00:00:00Z',
    last_login: new Date().toISOString(),
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/health/status');
      if (response.ok) {
        const health = await response.json();
        setSystemHealth(health);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast.error('Failed to fetch system health');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: User },
    { id: 'preferences', label: '⚙️ Preferences', icon: Settings },
    { id: 'notifications', label: '🔔 Notifications', icon: Bell },
    { id: 'theme', label: '�� Theme', icon: Palette },
    ...(isAdmin
      ? [
          { id: 'admin', label: '🛡️ Admin Panel', icon: Shield },
          { id: 'system', label: '🖥️ System Health', icon: Monitor },
          { id: 'users', label: '👥 User Management', icon: Users },
          { id: 'database', label: '🗄️ Database', icon: Database },
        ]
      : []),
  ];

  const renderProfileTab = () => (
    <div className='space-y-6'>
      <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>Profile Information</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Username</label>
            <input
              type='text'
              value={userProfile.username}
              onChange={e => setUserProfile({ ...userProfile, username: e.target.value })}
              className='w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'
            />
          </div>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Email</label>
            <input
              type='email'
              value={userProfile.email}
              onChange={e => setUserProfile({ ...userProfile, email: e.target.value })}
              className='w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'
            />
          </div>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Role</label>
            <div className='text-white px-3 py-2 bg-gray-700 rounded-lg'>
              {userProfile.role === 'admin'
                ? '🛡️ Administrator'
                : userProfile.role === 'super_admin'
                  ? '👑 Super Admin'
                  : '👤 User'}
            </div>
          </div>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Member Since</label>
            <div className='text-white px-3 py-2 bg-gray-700 rounded-lg'>
              {new Date(userProfile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <button className='mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors'>
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className='space-y-6'>
      <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>Betting Preferences</h3>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-white font-medium'>Auto-refresh Locked Bets</div>
              <div className='text-gray-400 text-sm'>Automatically refresh every 30 seconds</div>
            </div>
            <input type='checkbox' defaultChecked className='toggle' />
          </div>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-white font-medium'>Show High Confidence Only</div>
              <div className='text-gray-400 text-sm'>Only display bets with 85%+ confidence</div>
            </div>
            <input type='checkbox' className='toggle' />
          </div>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-white font-medium'>Kelly Criterion Warnings</div>
              <div className='text-gray-400 text-sm'>
                Warn when bet size exceeds Kelly recommendation
              </div>
            </div>
            <input type='checkbox' defaultChecked className='toggle' />
          </div>
        </div>
      </div>

      <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-white mb-4'>Display Settings</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Default Sport Filter</label>
            <select className='w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'>
              <option value='ALL'>All Sports</option>
              <option value='NBA'>NBA</option>
              <option value='NFL'>NFL</option>
              <option value='MLB'>MLB</option>
              <option value='NHL'>NHL</option>
            </select>
          </div>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Minimum Confidence Threshold</label>
            <select className='w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'>
              <option value='50'>50%</option>
              <option value='60'>60%</option>
              <option value='70'>70%</option>
              <option value='80'>80%</option>
              <option value='85'>85%</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminPanel = () => (
    <div className='space-y-6'>
      <div className='bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6'>
        <div className='flex items-center space-x-2'>
          <AlertTriangle className='w-5 h-5 text-red-400' />
          <div className='text-red-400 font-medium'>Administrator Access</div>
        </div>
        <div className='text-gray-300 text-sm mt-1'>
          You have administrator privileges. Use these tools carefully.
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
          <div className='flex items-center space-x-3 mb-4'>
            <Activity className='w-6 h-6 text-green-400' />
            <div>
              <div className='text-white font-semibold'>System Status</div>
              <div className='text-gray-400 text-sm'>Monitor system health</div>
            </div>
          </div>
          <button
            onClick={fetchSystemHealth}
            className='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors'
          >
            Check Health
          </button>
        </div>

        <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
          <div className='flex items-center space-x-3 mb-4'>
            <Database className='w-6 h-6 text-blue-400' />
            <div>
              <div className='text-white font-semibold'>Database</div>
              <div className='text-gray-400 text-sm'>Manage database operations</div>
            </div>
          </div>
          <button className='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'>
            View Database
          </button>
        </div>

        <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
          <div className='flex items-center space-x-3 mb-4'>
            <BarChart3 className='w-6 h-6 text-purple-400' />
            <div>
              <div className='text-white font-semibold'>Analytics</div>
              <div className='text-gray-400 text-sm'>View system analytics</div>
            </div>
          </div>
          <button className='w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors'>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );

  const renderSystemHealth = () => (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white'>System Health Monitor</h3>
        <button
          onClick={fetchSystemHealth}
          disabled={isLoading}
          className='flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors'
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {systemHealth && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='text-white font-semibold'>Overall Status</div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  systemHealth.status === 'healthy'
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-red-600/20 text-red-400'
                }`}
              >
                {systemHealth.status === 'healthy' ? '✅ Healthy' : '❌ Issues'}
              </div>
            </div>
            <div className='text-gray-400 text-sm'>
              System uptime: {Math.floor(systemHealth.uptime / 3600)}h{' '}
              {Math.floor((systemHealth.uptime % 3600) / 60)}m
            </div>
          </div>

          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='text-white font-semibold'>ML Ensemble</div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  systemHealth.ml_ensemble_status === 'available'
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-yellow-600/20 text-yellow-400'
                }`}
              >
                {systemHealth.ml_ensemble_status === 'available' ? '✅ Active' : '⚠️ Limited'}
              </div>
            </div>
            <div className='text-gray-400 text-sm'>Machine learning models status</div>
          </div>

          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='text-white font-semibold'>Database</div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  systemHealth.database_status === 'healthy'
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-red-600/20 text-red-400'
                }`}
              >
                {systemHealth.database_status === 'healthy' ? '✅ Connected' : '❌ Issues'}
              </div>
            </div>
            <div className='text-gray-400 text-sm'>Database connection status</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'notifications':
        return (
          <div className='text-center py-12 text-gray-400'>Notification settings coming soon</div>
        );
      case 'theme':
        return (
          <div className='text-center py-12 text-gray-400'>Theme customization coming soon</div>
        );
      case 'admin':
        return isAdmin ? renderAdminPanel() : null;
      case 'system':
        return isAdmin ? renderSystemHealth() : null;
      case 'users':
        return isAdmin ? (
          <div className='text-center py-12 text-gray-400'>User management coming soon</div>
        ) : null;
      case 'database':
        return isAdmin ? (
          <div className='text-center py-12 text-gray-400'>Database management coming soon</div>
        ) : null;
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-white mb-2'>
            ⚙️ Settings {isAdmin && '& Admin Panel'}
          </h1>
          <p className='text-gray-400'>
            Configure your preferences and {isAdmin && 'manage system settings'}
          </p>
        </div>

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Sidebar Navigation */}
          <div className='lg:w-64'>
            <div className='bg-gray-800 border border-gray-700 rounded-lg p-4'>
              <nav className='space-y-2'>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-cyan-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className='w-4 h-4' />
                      <span className='font-medium'>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1'>{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsAdminPage;
