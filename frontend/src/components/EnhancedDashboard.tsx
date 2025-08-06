/**
 * Enhanced Dashboard Component
 * Showcases peak functionality: real-time data, ML predictions, user auth, bankroll management
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BankrollStatus,
  BettingOpportunity,
  enhancedServiceClient,
  EnhancedUser,
  RiskMetrics,
} from '../services/EnhancedServiceClient';

interface EnhancedDashboardProps {
  className?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: EnhancedUser | null;
  loading: boolean;
}

interface DashboardData {
  opportunities: BettingOpportunity[];
  bankrollStatus: BankrollStatus | null;
  riskMetrics: RiskMetrics | null;
  systemHealth: any;
  loading: boolean;
  error: string | null;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ className = '' }) => {
  // Authentication State
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    opportunities: [],
    bankrollStatus: null,
    riskMetrics: null,
    systemHealth: null,
    loading: false,
    error: null,
  });

  // Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [activeForm, setActiveForm] = useState<'login' | 'register'>('login');

  // Real-time Updates
  const wsRef = useRef<WebSocket | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);

  // Initialize authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (enhancedServiceClient.isAuthenticated()) {
        const user = enhancedServiceClient.getCurrentUser();
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    };

    checkAuthStatus();
  }, []);

  // Load dashboard data when authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      loadDashboardData();
      setupWebSocketConnection();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [authState.isAuthenticated]);

  const loadDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load all dashboard data in parallel
      const [opportunitiesResult, bankrollResult, riskResult, healthResult] = await Promise.all([
        enhancedServiceClient.getBettingOpportunities({ min_confidence: 0.6 }),
        enhancedServiceClient.getBankrollStatus(),
        enhancedServiceClient.getRiskMetrics(),
        enhancedServiceClient.getSystemHealth(),
      ]);

      setDashboardData({
        opportunities: opportunitiesResult.success
          ? opportunitiesResult.data?.opportunities || []
          : [],
        bankrollStatus: bankrollResult.success
          ? bankrollResult.data?.bankroll_status || null
          : null,
        riskMetrics: riskResult.success ? riskResult.data?.risk_metrics || null : null,
        systemHealth: healthResult.success ? healthResult.data : null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  };

  const setupWebSocketConnection = async () => {
    if (!authState.user) return;

    try {
      const ws = await enhancedServiceClient.connectWebSocket(authState.user.user_id);
      wsRef.current = ws;

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          setRealTimeUpdates(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 updates

          // Update specific data based on message type
          if (data.type === 'opportunity_update') {
            loadDashboardData(); // Refresh opportunities
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      const result = await enhancedServiceClient.login(loginForm);

      if (result.success && result.data?.session) {
        setAuthState({
          isAuthenticated: true,
          user: result.data.session.user,
          loading: false,
        });
        setLoginForm({ email: '', password: '' });
      } else {
        alert(result.error || 'Login failed');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      alert('Login error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      const result = await enhancedServiceClient.register(registerForm);

      if (result.success) {
        alert('Registration successful! Please log in.');
        setActiveForm('login');
        setRegisterForm({ email: '', password: '', first_name: '', last_name: '' });
      } else {
        alert(result.error || 'Registration failed');
      }
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      alert('Registration error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await enhancedServiceClient.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      setDashboardData({
        opportunities: [],
        bankrollStatus: null,
        riskMetrics: null,
        systemHealth: null,
        loading: false,
        error: null,
      });
      setRealTimeUpdates([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Authentication Loading
  if (authState.loading) {
    return (
      <div className={`enhanced-dashboard ${className}`}>
        <div className='loading-container'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          <p className='mt-4 text-gray-600'>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Authentication Forms
  if (!authState.isAuthenticated) {
    return (
      <div className={`enhanced-dashboard auth-container ${className}`}>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-lg p-6'>
          <h2 className='text-2xl font-bold text-center mb-6'>A1Betting Enhanced Platform</h2>

          <div className='tab-buttons mb-4'>
            <button
              onClick={() => setActiveForm('login')}
              className={`px-4 py-2 mr-2 rounded ${
                activeForm === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveForm('register')}
              className={`px-4 py-2 rounded ${
                activeForm === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          {activeForm === 'login' ? (
            <form onSubmit={handleLogin} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Email</label>
                <input
                  type='email'
                  value={loginForm.email}
                  onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Password</label>
                <input
                  type='password'
                  value={loginForm.password}
                  onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
              <button
                type='submit'
                disabled={authState.loading}
                className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50'
              >
                {authState.loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>First Name</label>
                <input
                  type='text'
                  value={registerForm.first_name}
                  onChange={e => setRegisterForm(prev => ({ ...prev, first_name: e.target.value }))}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Last Name</label>
                <input
                  type='text'
                  value={registerForm.last_name}
                  onChange={e => setRegisterForm(prev => ({ ...prev, last_name: e.target.value }))}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Email</label>
                <input
                  type='email'
                  value={registerForm.email}
                  onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Password</label>
                <input
                  type='password'
                  value={registerForm.password}
                  onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
              <button
                type='submit'
                disabled={authState.loading}
                className='w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50'
              >
                {authState.loading ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className={`enhanced-dashboard ${className}`}>
      {/* Header */}
      <div className='dashboard-header bg-white shadow-sm border-b p-4'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Enhanced A1Betting Dashboard</h1>
            <p className='text-gray-600'>Welcome back, {authState.user?.first_name}</p>
          </div>
          <div className='flex items-center space-x-4'>
            {dashboardData.systemHealth && (
              <div
                className={`system-status ${
                  dashboardData.systemHealth.status === 'healthy'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}
              >
                <span className='text-sm'>System: {dashboardData.systemHealth.status}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700'
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className='dashboard-content p-6'>
        {dashboardData.loading ? (
          <div className='loading-container text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading dashboard data...</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Bankroll Status */}
            <div className='lg:col-span-1'>
              <div className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-semibold mb-4'>Bankroll Status</h3>
                {dashboardData.bankrollStatus ? (
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm text-gray-600'>Current Balance</span>
                      <p className='text-2xl font-bold text-green-600'>
                        {formatCurrency(dashboardData.bankrollStatus.current_balance)}
                      </p>
                    </div>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-gray-600'>Net Profit</span>
                        <p
                          className={`font-semibold ${
                            dashboardData.bankrollStatus.net_profit >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(dashboardData.bankrollStatus.net_profit)}
                        </p>
                      </div>
                      <div>
                        <span className='text-gray-600'>ROI</span>
                        <p
                          className={`font-semibold ${
                            dashboardData.bankrollStatus.roi >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(dashboardData.bankrollStatus.roi * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span className='text-gray-600'>Win Rate</span>
                        <p className='font-semibold text-blue-600'>
                          {(dashboardData.bankrollStatus.win_rate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span className='text-gray-600'>Avg Bet</span>
                        <p className='font-semibold'>
                          {formatCurrency(dashboardData.bankrollStatus.avg_bet_size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className='text-gray-500'>No bankroll data available</p>
                )}
              </div>

              {/* Risk Metrics */}
              <div className='bg-white rounded-lg shadow p-6 mt-6'>
                <h3 className='text-lg font-semibold mb-4'>Risk Metrics</h3>
                {dashboardData.riskMetrics ? (
                  <div className='space-y-3 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Sharpe Ratio</span>
                      <span className='font-semibold'>
                        {dashboardData.riskMetrics.sharpe_ratio.toFixed(2)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Max Drawdown</span>
                      <span className='font-semibold text-red-600'>
                        {(dashboardData.riskMetrics.max_drawdown * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Risk Score</span>
                      <span
                        className={`font-semibold ${
                          dashboardData.riskMetrics.risk_score <= 5
                            ? 'text-green-600'
                            : dashboardData.riskMetrics.risk_score <= 7
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {dashboardData.riskMetrics.risk_score.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className='text-gray-500'>No risk data available</p>
                )}
              </div>
            </div>

            {/* Betting Opportunities */}
            <div className='lg:col-span-2'>
              <div className='bg-white rounded-lg shadow p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-lg font-semibold'>Top Betting Opportunities</h3>
                  <button
                    onClick={loadDashboardData}
                    className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'
                  >
                    Refresh
                  </button>
                </div>

                {dashboardData.opportunities.length > 0 ? (
                  <div className='space-y-4'>
                    {dashboardData.opportunities.slice(0, 5).map((opportunity, index) => (
                      <div key={opportunity.bet_id} className='border rounded-lg p-4'>
                        <div className='flex justify-between items-start mb-2'>
                          <div>
                            <h4 className='font-semibold'>{opportunity.description}</h4>
                            <p className='text-sm text-gray-600'>
                              {opportunity.sport} • {opportunity.game}
                            </p>
                          </div>
                          <div className='text-right'>
                            <span
                              className={`text-sm font-semibold ${getConfidenceColor(
                                opportunity.confidence
                              )}`}
                            >
                              {(opportunity.confidence * 100).toFixed(1)}% confidence
                            </span>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                          <div>
                            <span className='text-gray-600'>Odds</span>
                            <p className='font-semibold'>
                              {opportunity.odds > 0 ? '+' : ''}
                              {opportunity.odds}
                            </p>
                          </div>
                          <div>
                            <span className='text-gray-600'>Expected Value</span>
                            <p
                              className={`font-semibold ${
                                opportunity.expected_value > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {opportunity.expected_value > 0 ? '+' : ''}
                              {(opportunity.expected_value * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <span className='text-gray-600'>Recommended Stake</span>
                            <p className='font-semibold'>
                              {formatCurrency(opportunity.recommended_stake)}
                            </p>
                          </div>
                          <div>
                            <span className='text-gray-600'>Risk Level</span>
                            <p className={`font-semibold ${getRiskColor(opportunity.risk_level)}`}>
                              {opportunity.risk_level}
                            </p>
                          </div>
                        </div>

                        {opportunity.reasoning && (
                          <div className='mt-3 p-3 bg-gray-50 rounded'>
                            <p className='text-sm text-gray-700'>{opportunity.reasoning}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-gray-500'>No betting opportunities available</p>
                )}
              </div>

              {/* Real-time Updates */}
              {realTimeUpdates.length > 0 && (
                <div className='bg-white rounded-lg shadow p-6 mt-6'>
                  <h3 className='text-lg font-semibold mb-4'>Real-time Updates</h3>
                  <div className='space-y-2'>
                    {realTimeUpdates.slice(0, 5).map((update, index) => (
                      <div key={index} className='text-sm p-2 bg-blue-50 rounded'>
                        <span className='text-blue-600 font-medium'>{update.type}:</span>
                        <span className='ml-2'>
                          {update.message || JSON.stringify(update).slice(0, 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {dashboardData.error && (
          <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600'>Error: {dashboardData.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;
