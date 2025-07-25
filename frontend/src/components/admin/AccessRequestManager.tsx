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

const _AccessRequestManager: React.FC<AccessRequestManagerProps> = ({ authToken, adminEmail }) => {
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

  const _loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const _data = await accessRequestService.getAllAccessRequests(authToken);
      setRequests(data);
    } catch (err) {
      setError('Failed to load access requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const _handleApprove = async (requestId: string) => {
    if (processingRequest) return;

    setProcessingRequest(requestId);
    try {
      const _response = await accessRequestService.approveAccessRequest(
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

  const _handleDeny = async (requestId: string) => {
    if (processingRequest) return;

    setProcessingRequest(requestId);
    try {
      const _response = await accessRequestService.denyAccessRequest(
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

  const _filteredRequests = requests
    .filter(request => {
      const _matchesSearch = request.email.toLowerCase().includes(searchTerm.toLowerCase());
      const _matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const _getStatusBadge = (status: AccessRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </span>
        );
      case 'approved':
        return (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <CheckCircle className='w-3 h-3 mr-1' />
            Approved
          </span>
        );
      case 'denied':
        return (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <XCircle className='w-3 h-3 mr-1' />
            Denied
          </span>
        );
    }
  };

  const _formatDate = (date: Date) => {
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-center h-64'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='w-8 h-8 border-2 border-cyber-primary/30 border-t-cyber-primary rounded-full animate-spin mx-auto mb-4' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400'>Loading access requests...</p>
        </div>
      </div>
    );
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-6'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-between'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2 className='text-2xl font-bold text-white'>Access Requests</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-gray-400'>Review and manage user access requests</p>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button
          onClick={loadRequests}
          disabled={loading}
          className='flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex flex-col sm:flex-row gap-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex-1'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='relative'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              type='text'
              placeholder='Search by email...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary'
            />
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Filter className='w-4 h-4 text-gray-400' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as unknown)}
            className='px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyber-primary'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='all'>All Status</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='pending'>Pending</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='approved'>Approved</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='denied'>Denied</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-red-500/10 border border-red-500/50 rounded-lg p-4'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AlertTriangle className='w-5 h-5 text-red-400' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-red-300'>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Requests List */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden'>
        {filteredRequests.length === 0 ? (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='p-8 text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Mail className='w-12 h-12 text-gray-500 mx-auto mb-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-400'>No access requests found</p>
          </div>
        ) : (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='divide-y divide-slate-700/50'>
            {filteredRequests.map(request => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='p-6 hover:bg-slate-700/25 transition-colors'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-start justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-3 mb-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <User className='w-5 h-5 text-gray-400' />
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='font-medium text-white'>{request.email}</span>
                      {getStatusBadge(request.status)}
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-4 text-sm text-gray-400 mb-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center space-x-1'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Calendar className='w-4 h-4' />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span>Requested: {formatDate(request.requestedAt)}</span>
                      </div>
                      {request.approvedAt && (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-1'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Calendar className='w-4 h-4' />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>
                            {request.status === 'approved' ? 'Approved' : 'Denied'}:{' '}
                            {formatDate(request.approvedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {request.deniedReason && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-start space-x-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <MessageSquare className='w-4 h-4 text-red-400 mt-0.5' />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <p className='text-red-300 text-sm font-medium'>Denial Reason:</p>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <p className='text-red-200/80 text-sm'>{request.deniedReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.approvedBy && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-xs text-gray-500'>
                        {request.status === 'approved' ? 'Approved' : 'Denied'} by:{' '}
                        {request.approvedBy}
                      </p>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2 ml-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingRequest === request.id}
                        className='flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50'
                      >
                        {processingRequest === request.id ? (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                        ) : (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <CheckCircle className='w-4 h-4' />
                        )}
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span>Approve</span>
                      </button>

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <button
                        onClick={() => setShowDenyModal(request.id)}
                        disabled={processingRequest === request.id}
                        className='flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50'
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <XCircle className='w-4 h-4' />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-lg font-bold text-white mb-4'>Deny Access Request</h3>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='mb-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label htmlFor='deny-reason' className='block text-sm font-medium text-gray-300 mb-2'>
                Reason for denial (optional)
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <textarea
                id='deny-reason'
                value={denyReason}
                onChange={e => setDenyReason(e.target.value)}
                placeholder='Provide a reason for denying this request...'
                rows={3}
                className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyber-primary resize-none'
              />
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={() => handleDeny(showDenyModal)}
                disabled={processingRequest === showDenyModal}
                className='flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors disabled:opacity-50'
              >
                {processingRequest === showDenyModal ? (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <XCircle className='w-4 h-4' />
                )}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>Confirm Deny</span>
              </button>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
