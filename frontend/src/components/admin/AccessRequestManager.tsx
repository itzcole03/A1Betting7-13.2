import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  User,
  Calendar,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { accessRequestService, AccessRequest } from '../../services/AccessRequestService';

interface AccessRequestManagerProps {
  authToken: string;
  adminEmail: string;
}

const AccessRequestManager: React.FC<AccessRequestManagerProps> = ({ authToken, adminEmail }) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>(
    'all'
  );
  const [showDenyModal, setShowDenyModal] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accessRequestService.getAllAccessRequests(authToken);
      setRequests(data);
    } catch (err) {
      setError('Failed to load access requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (processingRequest) return;

    setProcessingRequest(requestId);
    try {
      const response = await accessRequestService.approveAccessRequest(
        requestId,
        authToken,
        adminEmail
      );

      if (response.success) {
        await loadRequests(); // Reload to get updated data
      }
    } catch (err) {
      setError('Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    if (processingRequest) return;

    setProcessingRequest(requestId);
    try {
      const response = await accessRequestService.denyAccessRequest(
        requestId,
        authToken,
        adminEmail,
        denyReason.trim() || undefined
      );

      if (response.success) {
        await loadRequests(); // Reload to get updated data
        setShowDenyModal(null);
        setDenyReason('');
      }
    } catch (err) {
      setError('Failed to deny request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = request.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const getStatusBadge = (status: AccessRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400'>
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400'>
            <XCircle className='w-3 h-3 mr-1' />
            Denied
          </span>
        );
    }
  };

  const formatDate = (date: Date) => {
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
          <p className='text-gray-400'>Loading access requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-white'>Access Requests</h2>
          <p className='text-gray-400'>Review and manage user access requests</p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className='flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
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
        <div className='flex items-center space-x-2'>
          <Filter className='w-4 h-4 text-gray-400' />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className='px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyber-primary'
          >
            <option value='all'>All Status</option>
            <option value='pending'>Pending</option>
            <option value='approved'>Approved</option>
            <option value='denied'>Denied</option>
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

      {/* Requests List */}
      <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden'>
        {filteredRequests.length === 0 ? (
          <div className='p-8 text-center'>
            <Mail className='w-12 h-12 text-gray-500 mx-auto mb-4' />
            <p className='text-gray-400'>No access requests found</p>
          </div>
        ) : (
          <div className='divide-y divide-slate-700/50'>
            {filteredRequests.map(request => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='p-6 hover:bg-slate-700/25 transition-colors'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <User className='w-5 h-5 text-gray-400' />
                      <span className='font-medium text-white'>{request.email}</span>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className='flex items-center space-x-4 text-sm text-gray-400 mb-3'>
                      <div className='flex items-center space-x-1'>
                        <Calendar className='w-4 h-4' />
                        <span>Requested: {formatDate(request.requestedAt)}</span>
                      </div>
                      {request.approvedAt && (
                        <div className='flex items-center space-x-1'>
                          <Calendar className='w-4 h-4' />
                          <span>
                            {request.status === 'approved' ? 'Approved' : 'Denied'}:{' '}
                            {formatDate(request.approvedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {request.deniedReason && (
                      <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3'>
                        <div className='flex items-start space-x-2'>
                          <MessageSquare className='w-4 h-4 text-red-400 mt-0.5' />
                          <div>
                            <p className='text-red-300 text-sm font-medium'>Denial Reason:</p>
                            <p className='text-red-200/80 text-sm'>{request.deniedReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.approvedBy && (
                      <p className='text-xs text-gray-500'>
                        {request.status === 'approved' ? 'Approved' : 'Denied'} by:{' '}
                        {request.approvedBy}
                      </p>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className='flex items-center space-x-2 ml-4'>
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingRequest === request.id}
                        className='flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50'
                      >
                        {processingRequest === request.id ? (
                          <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                        ) : (
                          <CheckCircle className='w-4 h-4' />
                        )}
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => setShowDenyModal(request.id)}
                        disabled={processingRequest === request.id}
                        className='flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50'
                      >
                        <XCircle className='w-4 h-4' />
                        <span>Deny</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Deny Modal */}
      {showDenyModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full'
          >
            <h3 className='text-lg font-bold text-white mb-4'>Deny Access Request</h3>

            <div className='mb-4'>
              <label htmlFor='deny-reason' className='block text-sm font-medium text-gray-300 mb-2'>
                Reason for denial (optional)
              </label>
              <textarea
                id='deny-reason'
                value={denyReason}
                onChange={e => setDenyReason(e.target.value)}
                placeholder='Provide a reason for denying this request...'
                rows={3}
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary resize-none'
              />
            </div>

            <div className='flex items-center space-x-3'>
              <button
                onClick={() => handleDeny(showDenyModal)}
                disabled={processingRequest === showDenyModal}
                className='flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors disabled:opacity-50'
              >
                {processingRequest === showDenyModal ? (
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <XCircle className='w-4 h-4' />
                )}
                <span>Confirm Deny</span>
              </button>

              <button
                onClick={() => {
                  setShowDenyModal(null);
                  setDenyReason('');
                }}
                className='flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AccessRequestManager;
