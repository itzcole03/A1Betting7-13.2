import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  User,
  Mail,
  Clock,
  Ban,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  UserX,
  Edit,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  lastLogin?: Date;
  isFirstLogin?: boolean;
  permissions: string[];
}

interface UserManagementProps {
  authToken: string;
  adminEmail: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ authToken, adminEmail }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>(
    'all'
  );
  const [showUserModal, setShowUserModal] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // In production, this would fetch from an API
      const mockUsers: UserData[] = [
        {
          id: 'user_001',
          email: 'cole@example.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 30),
          lastLogin: new Date(Date.now() - 3600000),
          permissions: ['admin', 'user'],
        },
        {
          id: 'user_002',
          email: 'admin@a1betting.com',
          role: 'admin',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 25),
          lastLogin: new Date(Date.now() - 7200000),
          permissions: ['admin', 'user'],
        },
        {
          id: 'user_003',
          email: 'user1@example.com',
          role: 'user',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000 * 5),
          lastLogin: new Date(Date.now() - 86400000),
          permissions: ['user'],
        },
        {
          id: 'user_004',
          email: 'user2@example.com',
          role: 'user',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000 * 2),
          isFirstLogin: true,
          permissions: ['user'],
        },
        {
          id: 'user_005',
          email: 'suspended@example.com',
          role: 'user',
          status: 'suspended',
          createdAt: new Date(Date.now() - 86400000 * 10),
          lastLogin: new Date(Date.now() - 86400000 * 3),
          permissions: ['user'],
        },
      ];

      setUsers(mockUsers);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status: UserData['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400'>
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400'>
            <Ban className='w-3 h-3 mr-1' />
            Suspended
          </span>
        );
    }
  };

  const getRoleBadge = (role: UserData['role']) => {
    return role === 'admin' ? (
      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400'>
        <Shield className='w-3 h-3 mr-1' />
        Admin
      </span>
    ) : (
      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400'>
        <User className='w-3 h-3 mr-1' />
        User
      </span>
    );
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-cyber-primary/30 border-t-cyber-primary rounded-full animate-spin mx-auto mb-4' />
          <p className='text-gray-400'>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-white'>User Management</h2>
          <p className='text-gray-400'>Manage user accounts and permissions</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className='flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4'>
          <div className='flex items-center space-x-3'>
            <Users className='w-8 h-8 text-blue-400' />
            <div>
              <p className='text-2xl font-bold text-white'>{users.length}</p>
              <p className='text-sm text-gray-400'>Total Users</p>
            </div>
          </div>
        </div>

        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4'>
          <div className='flex items-center space-x-3'>
            <CheckCircle className='w-8 h-8 text-green-400' />
            <div>
              <p className='text-2xl font-bold text-white'>
                {users.filter(u => u.status === 'active').length}
              </p>
              <p className='text-sm text-gray-400'>Active</p>
            </div>
          </div>
        </div>

        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4'>
          <div className='flex items-center space-x-3'>
            <Clock className='w-8 h-8 text-yellow-400' />
            <div>
              <p className='text-2xl font-bold text-white'>
                {users.filter(u => u.status === 'pending').length}
              </p>
              <p className='text-sm text-gray-400'>Pending</p>
            </div>
          </div>
        </div>

        <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4'>
          <div className='flex items-center space-x-3'>
            <Shield className='w-8 h-8 text-purple-400' />
            <div>
              <p className='text-2xl font-bold text-white'>
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className='text-sm text-gray-400'>Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-col lg:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search by email...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary'
            />
          </div>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <Filter className='w-4 h-4 text-gray-400' />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className='px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyber-primary'
            >
              <option value='all'>All Roles</option>
              <option value='admin'>Admin</option>
              <option value='user'>User</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className='px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyber-primary'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='pending'>Pending</option>
            <option value='suspended'>Suspended</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-red-500/10 border border-red-500/50 rounded-lg p-4'
        >
          <div className='flex items-center space-x-3'>
            <AlertTriangle className='w-5 h-5 text-red-400' />
            <p className='text-red-300'>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden'>
        {filteredUsers.length === 0 ? (
          <div className='p-8 text-center'>
            <UserX className='w-12 h-12 text-gray-500 mx-auto mb-4' />
            <p className='text-gray-400'>No users found</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-700/50'>
                <tr>
                  <th className='text-left px-6 py-4 text-sm font-medium text-gray-300'>User</th>
                  <th className='text-left px-6 py-4 text-sm font-medium text-gray-300'>Role</th>
                  <th className='text-left px-6 py-4 text-sm font-medium text-gray-300'>Status</th>
                  <th className='text-left px-6 py-4 text-sm font-medium text-gray-300'>Created</th>
                  <th className='text-left px-6 py-4 text-sm font-medium text-gray-300'>
                    Last Login
                  </th>
                  <th className='text-right px-6 py-4 text-sm font-medium text-gray-300'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-700/50'>
                {filteredUsers.map(user => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='hover:bg-slate-700/25 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 rounded-full bg-gradient-to-r from-cyber-primary to-cyber-accent flex items-center justify-center'>
                          <span className='text-slate-900 text-sm font-bold'>
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium text-white'>{user.email}</p>
                          {user.isFirstLogin && (
                            <p className='text-xs text-yellow-400'>First login pending</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>{getRoleBadge(user.role)}</td>
                    <td className='px-6 py-4'>{getStatusBadge(user.status)}</td>
                    <td className='px-6 py-4'>
                      <p className='text-sm text-gray-300'>{formatDate(user.createdAt)}</p>
                    </td>
                    <td className='px-6 py-4'>
                      <p className='text-sm text-gray-300'>{formatDate(user.lastLogin)}</p>
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <button
                        onClick={() => setShowUserModal(user.id)}
                        className='p-2 hover:bg-slate-600 rounded-lg transition-colors'
                      >
                        <MoreVertical className='w-4 h-4 text-gray-400' />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
