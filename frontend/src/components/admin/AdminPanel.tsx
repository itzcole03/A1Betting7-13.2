import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Settings,
  Activity,
  Shield,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Ban,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreVertical,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Zap,
  BarChart3,
  Globe,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
} from 'lucide-react';
import { Layout } from '../core/Layout';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'suspended' | 'banned' | 'pending';
  subscription: {
    plan: 'free' | 'pro' | 'elite';
    status: 'active' | 'expired' | 'cancelled';
    expiresAt: Date;
    revenue: number;
  };
  stats: {
    totalBets: number;
    winRate: number;
    profit: number;
    lastActive: Date;
  };
  joinedAt: Date;
  location: string;
  riskProfile: 'low' | 'medium' | 'high';
}

interface SystemMetrics {
  uptime: number;
  activeUsers: number;
  apiCalls: number;
  errorRate: number;
  responseTime: number;
  revenue: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface APIEndpoint {
  name: string;
  path: string;
  method: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  uptime: number;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls
      await Promise.all([loadUsers(), loadSystemMetrics(), loadAPIEndpoints()]);
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUsers: User[] = [
      {
        id: 'user-001',
        username: 'pro_bettor_2024',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        subscription: {
          plan: 'pro',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          revenue: 299,
        },
        stats: {
          totalBets: 1247,
          winRate: 67.3,
          profit: 8420,
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        location: 'New York, NY',
        riskProfile: 'medium',
      },
      {
        id: 'user-002',
        username: 'elite_trader',
        email: 'sarah@example.com',
        firstName: 'Sarah',
        lastName: 'Smith',
        status: 'active',
        subscription: {
          plan: 'elite',
          status: 'active',
          expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          revenue: 999,
        },
        stats: {
          totalBets: 3891,
          winRate: 72.8,
          profit: 24670,
          lastActive: new Date(Date.now() - 30 * 60 * 1000),
        },
        joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        location: 'Los Angeles, CA',
        riskProfile: 'high',
      },
      {
        id: 'user-003',
        username: 'casual_user',
        email: 'mike@example.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        status: 'suspended',
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: new Date(Date.now() + 999 * 24 * 60 * 60 * 1000),
          revenue: 0,
        },
        stats: {
          totalBets: 89,
          winRate: 43.2,
          profit: -340,
          lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        location: 'Chicago, IL',
        riskProfile: 'low',
      },
    ];

    setUsers(mockUsers);
  };

  const loadSystemMetrics = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockMetrics: SystemMetrics = {
      uptime: 99.7,
      activeUsers: 1847,
      apiCalls: 847320,
      errorRate: 0.023,
      responseTime: 247,
      revenue: 127840,
      cpu: 34.7,
      memory: 68.2,
      disk: 45.8,
      network: 12.4,
    };

    setSystemMetrics(mockMetrics);
  };

  const loadAPIEndpoints = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockEndpoints: APIEndpoint[] = [
      {
        name: 'User Authentication',
        path: '/api/auth',
        method: 'POST',
        status: 'healthy',
        responseTime: 156,
        errorRate: 0.001,
        lastChecked: new Date(),
        uptime: 99.9,
      },
      {
        name: 'Odds Data',
        path: '/api/odds',
        method: 'GET',
        status: 'healthy',
        responseTime: 234,
        errorRate: 0.012,
        lastChecked: new Date(),
        uptime: 99.8,
      },
      {
        name: 'Predictions',
        path: '/api/predictions',
        method: 'GET',
        status: 'degraded',
        responseTime: 847,
        errorRate: 0.089,
        lastChecked: new Date(),
        uptime: 98.7,
      },
      {
        name: 'Arbitrage Scanner',
        path: '/api/arbitrage',
        method: 'GET',
        status: 'healthy',
        responseTime: 345,
        errorRate: 0.003,
        lastChecked: new Date(),
        uptime: 99.6,
      },
      {
        name: 'Payment Processing',
        path: '/api/payments',
        method: 'POST',
        status: 'healthy',
        responseTime: 189,
        errorRate: 0.0,
        lastChecked: new Date(),
        uptime: 99.99,
      },
    ];

    setApiEndpoints(mockEndpoints);
  };

  const updateUserStatus = async (userId: string, status: User['status']) => {
    setUsers(prev => prev.map(user => (user.id === userId ? { ...user, status } : user)));
  };

  const bulkUpdateUsers = async (action: string) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        selectedUsers.forEach(userId => updateUserStatus(userId, 'active'));
        break;
      case 'suspend':
        selectedUsers.forEach(userId => updateUserStatus(userId, 'suspended'));
        break;
      case 'ban':
        selectedUsers.forEach(userId => updateUserStatus(userId, 'banned'));
        break;
    }

    setSelectedUsers([]);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesPlan = planFilter === 'all' || user.subscription.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/10';
      case 'suspended':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'banned':
        return 'text-red-400 bg-red-400/10';
      case 'pending':
        return 'text-blue-400 bg-blue-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'elite':
        return 'text-purple-400 bg-purple-400/10';
      case 'pro':
        return 'text-cyan-400 bg-cyan-400/10';
      case 'free':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor((uptime * 365) / 100);
    const hours = Math.floor(((uptime * 365 * 24) / 100) % 24);
    return `${days}d ${hours}h`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'system', label: 'System Health', icon: Activity },
    { id: 'api', label: 'API Status', icon: Server },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const renderOverview = () => (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Active Users</p>
              <p className='text-3xl font-bold text-white'>
                {systemMetrics?.activeUsers.toLocaleString()}
              </p>
              <p className='text-green-400 text-sm mt-1'>+12.3% from last month</p>
            </div>
            <div className='bg-green-500/10 p-3 rounded-lg'>
              <Users className='w-6 h-6 text-green-400' />
            </div>
          </div>
        </motion.div>

        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>Revenue</p>
              <p className='text-3xl font-bold text-white'>
                ${systemMetrics?.revenue.toLocaleString()}
              </p>
              <p className='text-green-400 text-sm mt-1'>+8.7% from last month</p>
            </div>
            <div className='bg-cyan-500/10 p-3 rounded-lg'>
              <DollarSign className='w-6 h-6 text-cyan-400' />
            </div>
          </div>
        </motion.div>

        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>API Calls</p>
              <p className='text-3xl font-bold text-white'>
                {systemMetrics?.apiCalls.toLocaleString()}
              </p>
              <p className='text-green-400 text-sm mt-1'>+23.1% from last week</p>
            </div>
            <div className='bg-purple-500/10 p-3 rounded-lg'>
              <Zap className='w-6 h-6 text-purple-400' />
            </div>
          </div>
        </motion.div>

        <motion.div
          className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-400 text-sm'>System Uptime</p>
              <p className='text-3xl font-bold text-white'>{systemMetrics?.uptime}%</p>
              <p className='text-green-400 text-sm mt-1'>
                {formatUptime(systemMetrics?.uptime || 0)}
              </p>
            </div>
            <div className='bg-green-500/10 p-3 rounded-lg'>
              <Activity className='w-6 h-6 text-green-400' />
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Performance */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className='text-xl font-bold text-white mb-6'>System Performance</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-400 text-sm'>CPU Usage</span>
              <span className='text-white font-medium'>{systemMetrics?.cpu}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2'>
              <div
                className='h-2 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full'
                style={{ width: `${systemMetrics?.cpu}%` }}
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-400 text-sm'>Memory Usage</span>
              <span className='text-white font-medium'>{systemMetrics?.memory}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2'>
              <div
                className='h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full'
                style={{ width: `${systemMetrics?.memory}%` }}
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-400 text-sm'>Disk Usage</span>
              <span className='text-white font-medium'>{systemMetrics?.disk}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2'>
              <div
                className='h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full'
                style={{ width: `${systemMetrics?.disk}%` }}
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-400 text-sm'>Network I/O</span>
              <span className='text-white font-medium'>{systemMetrics?.network}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2'>
              <div
                className='h-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full'
                style={{ width: `${systemMetrics?.network}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className='text-xl font-bold text-white mb-6'>Recent Activity</h3>
        <div className='space-y-4'>
          {[
            {
              type: 'user',
              message: 'New user registration: pro_bettor_2024',
              time: '2 minutes ago',
              icon: UserCheck,
              color: 'text-green-400',
            },
            {
              type: 'payment',
              message: 'Payment processed: $299 Pro subscription',
              time: '5 minutes ago',
              icon: CreditCard,
              color: 'text-cyan-400',
            },
            {
              type: 'alert',
              message: 'High API error rate detected on /api/predictions',
              time: '12 minutes ago',
              icon: AlertTriangle,
              color: 'text-yellow-400',
            },
            {
              type: 'system',
              message: 'System backup completed successfully',
              time: '1 hour ago',
              icon: CheckCircle,
              color: 'text-green-400',
            },
            {
              type: 'security',
              message: 'Suspicious login attempt blocked',
              time: '2 hours ago',
              icon: Shield,
              color: 'text-red-400',
            },
          ].map((activity, index) => (
            <div key={index} className='flex items-center space-x-4 p-3 bg-slate-900/50 rounded-lg'>
              <div className={`p-2 rounded-lg bg-slate-800 ${activity.color}`}>
                <activity.icon className='w-4 h-4' />
              </div>
              <div className='flex-1'>
                <p className='text-white text-sm'>{activity.message}</p>
                <p className='text-gray-400 text-xs'>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderUserManagement = () => (
    <div className='space-y-6'>
      {/* User Management Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
        <div>
          <h3 className='text-2xl font-bold text-white'>User Management</h3>
          <p className='text-gray-400'>Manage user accounts, subscriptions, and permissions</p>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={() => setShowUserModal(true)}
            className='bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-colors flex items-center space-x-2'
          >
            <Plus className='w-4 h-4' />
            <span>Add User</span>
          </button>
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Search users...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className='px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='suspended'>Suspended</option>
            <option value='banned'>Banned</option>
            <option value='pending'>Pending</option>
          </select>

          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className='px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
          >
            <option value='all'>All Plans</option>
            <option value='free'>Free</option>
            <option value='pro'>Pro</option>
            <option value='elite'>Elite</option>
          </select>

          {selectedUsers.length > 0 && (
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => bulkUpdateUsers('activate')}
                className='bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm'
              >
                Activate ({selectedUsers.length})
              </button>
              <button
                onClick={() => bulkUpdateUsers('suspend')}
                className='bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm'
              >
                Suspend
              </button>
              <button
                onClick={() => bulkUpdateUsers('ban')}
                className='bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm'
              >
                Ban
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-slate-900/50'>
              <tr>
                <th className='text-left p-4'>
                  <input
                    type='checkbox'
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className='rounded border-gray-300'
                  />
                </th>
                <th className='text-left p-4 text-gray-300 font-medium'>User</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Status</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Plan</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Stats</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Revenue</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Last Active</th>
                <th className='text-left p-4 text-gray-300 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700/50'>
              {filteredUsers.map(user => (
                <tr key={user.id} className='hover:bg-slate-700/30 transition-colors'>
                  <td className='p-4'>
                    <input
                      type='checkbox'
                      checked={selectedUsers.includes(user.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className='rounded border-gray-300'
                    />
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-medium text-sm'>
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className='text-white font-medium'>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className='text-gray-400 text-sm'>@{user.username}</p>
                        <p className='text-gray-400 text-xs'>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className='p-4'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className='p-4'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.subscription.plan)}`}
                    >
                      {user.subscription.plan}
                    </span>
                  </td>
                  <td className='p-4'>
                    <div className='text-sm'>
                      <p className='text-white'>{user.stats.totalBets} bets</p>
                      <p className='text-green-400'>{user.stats.winRate}% win rate</p>
                      <p className={user.stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${user.stats.profit.toLocaleString()} profit
                      </p>
                    </div>
                  </td>
                  <td className='p-4'>
                    <p className='text-white font-medium'>${user.subscription.revenue}</p>
                  </td>
                  <td className='p-4'>
                    <p className='text-gray-400 text-sm'>
                      {new Date(user.stats.lastActive).toLocaleDateString()}
                    </p>
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserModal(true);
                        }}
                        className='text-cyan-400 hover:text-cyan-300 transition-colors'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() =>
                          updateUserStatus(
                            user.id,
                            user.status === 'active' ? 'suspended' : 'active'
                          )
                        }
                        className='text-yellow-400 hover:text-yellow-300 transition-colors'
                      >
                        {user.status === 'active' ? (
                          <Lock className='w-4 h-4' />
                        ) : (
                          <Unlock className='w-4 h-4' />
                        )}
                      </button>
                      <button className='text-red-400 hover:text-red-300 transition-colors'>
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <p className='text-gray-400 text-sm'>
          Showing {filteredUsers.length} of {users.length} users
        </p>
        <div className='flex items-center space-x-2'>
          <button
            className='px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50'
            disabled
          >
            Previous
          </button>
          <span className='px-3 py-2 bg-cyan-500 text-white rounded-lg'>1</span>
          <button
            className='px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50'
            disabled
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const renderSystemHealth = () => (
    <div className='space-y-6'>
      <h3 className='text-2xl font-bold text-white'>System Health</h3>

      {/* Resource Usage */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h4 className='text-xl font-bold text-white mb-6'>Resource Usage</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <Cpu className='w-5 h-5 text-blue-400' />
                <span className='text-white font-medium'>CPU</span>
              </div>
              <span className='text-blue-400 font-bold'>{systemMetrics?.cpu}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
              <div
                className='h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full'
                style={{ width: `${systemMetrics?.cpu}%` }}
              />
            </div>
            <div className='text-xs text-gray-400'>8 cores @ 3.2GHz</div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <MemoryStick className='w-5 h-5 text-purple-400' />
                <span className='text-white font-medium'>Memory</span>
              </div>
              <span className='text-purple-400 font-bold'>{systemMetrics?.memory}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
              <div
                className='h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full'
                style={{ width: `${systemMetrics?.memory}%` }}
              />
            </div>
            <div className='text-xs text-gray-400'>32GB DDR4</div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <HardDrive className='w-5 h-5 text-green-400' />
                <span className='text-white font-medium'>Storage</span>
              </div>
              <span className='text-green-400 font-bold'>{systemMetrics?.disk}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
              <div
                className='h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full'
                style={{ width: `${systemMetrics?.disk}%` }}
              />
            </div>
            <div className='text-xs text-gray-400'>1TB NVMe SSD</div>
          </div>

          <div className='bg-slate-900/50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <Network className='w-5 h-5 text-orange-400' />
                <span className='text-white font-medium'>Network</span>
              </div>
              <span className='text-orange-400 font-bold'>{systemMetrics?.network}%</span>
            </div>
            <div className='w-full bg-slate-700 rounded-full h-2 mb-2'>
              <div
                className='h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full'
                style={{ width: `${systemMetrics?.network}%` }}
              />
            </div>
            <div className='text-xs text-gray-400'>1Gbps Bandwidth</div>
          </div>
        </div>
      </motion.div>

      {/* Error Monitoring */}
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h4 className='text-xl font-bold text-white mb-6'>Error Monitoring</h4>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-3xl font-bold text-red-400 mb-2'>{systemMetrics?.errorRate}%</div>
            <div className='text-gray-400 text-sm'>Error Rate</div>
            <div className='text-xs text-red-300 mt-1'>Last 24 hours</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-3xl font-bold text-yellow-400 mb-2'>
              {systemMetrics?.responseTime}ms
            </div>
            <div className='text-gray-400 text-sm'>Avg Response Time</div>
            <div className='text-xs text-yellow-300 mt-1'>Last hour</div>
          </div>
          <div className='bg-slate-900/50 rounded-lg p-4 text-center'>
            <div className='text-3xl font-bold text-green-400 mb-2'>{systemMetrics?.uptime}%</div>
            <div className='text-gray-400 text-sm'>Uptime</div>
            <div className='text-xs text-green-300 mt-1'>Last 30 days</div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderAPIStatus = () => (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-2xl font-bold text-white'>API Status</h3>
        <button
          onClick={loadAPIEndpoints}
          className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2'
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {apiEndpoints.map((endpoint, index) => (
          <motion.div
            key={index}
            className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <div
                  className={`w-3 h-3 rounded-full ${
                    endpoint.status === 'healthy'
                      ? 'bg-green-400'
                      : endpoint.status === 'degraded'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                  }`}
                />
                <div>
                  <h4 className='text-white font-medium'>{endpoint.name}</h4>
                  <p className='text-gray-400 text-sm'>
                    {endpoint.method} {endpoint.path}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className={`font-medium ${getHealthStatusColor(endpoint.status)}`}>
                  {endpoint.status.toUpperCase()}
                </p>
                <p className='text-gray-400 text-sm'>
                  Last checked: {endpoint.lastChecked.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='bg-slate-900/50 rounded-lg p-3 text-center'>
                <p className='text-2xl font-bold text-white'>{endpoint.responseTime}ms</p>
                <p className='text-gray-400 text-sm'>Response Time</p>
              </div>
              <div className='bg-slate-900/50 rounded-lg p-3 text-center'>
                <p className='text-2xl font-bold text-white'>{endpoint.errorRate}%</p>
                <p className='text-gray-400 text-sm'>Error Rate</p>
              </div>
              <div className='bg-slate-900/50 rounded-lg p-3 text-center'>
                <p className='text-2xl font-bold text-white'>{endpoint.uptime}%</p>
                <p className='text-gray-400 text-sm'>Uptime</p>
              </div>
              <div className='bg-slate-900/50 rounded-lg p-3 text-center'>
                <p className='text-2xl font-bold text-green-400'>Healthy</p>
                <p className='text-gray-400 text-sm'>Status</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUserManagement();
      case 'system':
        return renderSystemHealth();
      case 'api':
        return renderAPIStatus();
      case 'settings':
        return (
          <div className='space-y-6'>
            <h3 className='text-2xl font-bold text-white'>System Settings</h3>
            <div className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'>
              <p className='text-gray-400'>
                System configuration settings will be implemented here.
              </p>
            </div>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <Layout>
      <div className='space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent'>
              Admin Panel
            </h1>
            <p className='text-gray-400 mt-2'>System administration and monitoring dashboard</p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20'>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-400 rounded-full' />
                <span className='text-green-400 text-sm font-medium'>System Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className='flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className='w-4 h-4' />
              <span className='font-medium'>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminPanel;
