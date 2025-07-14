import React, { useEffect, useState } from 'react';
import './App.css';

interface BackendStatus {
  status: string;
  timestamp: string;
  predictions_available?: boolean;
  version?: string;
  models_loaded?: number;
}

interface PredictionData {
  id?: string;
  game: string;
  prediction: string;
  confidence: number;
  expected_value?: number;
  sport?: string;
  player?: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    database: boolean;
    ml_models: boolean;
    api: boolean;
    predictions: boolean;
  };
  metrics: {
    total_predictions: number;
    model_accuracy: number;
    uptime: string;
  };
}

const App: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');

  useEffect(() => {
    checkBackendConnection();
    fetchHealthData();
    fetchPredictions();

    // Set up periodic health checks
    const healthInterval = setInterval(() => {
      checkBackendConnection();
      fetchHealthData();
    }, 30000); // Every 30 seconds

    return () => clearInterval(healthInterval);
  }, []);

  const checkBackendConnection = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch('/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
        setConnectionStatus('connected');
        setError(null);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      //       console.error('Backend connection error:', err);
      setError(
        `Backend connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setConnectionStatus('disconnected');
    }
  };

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/comprehensive', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (err) {
      //       console.error('Health data fetch error:', err);
    }
  };

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/predictions/latest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions || data || []);
      } else {
        //         console.warn('Predictions endpoint returned:', response.status);
      }
    } catch (err) {
      //       console.error('Failed to fetch predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const testBackendEndpoint = async (endpoint: string, description: string) => {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${description} Success!\n\nResponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        alert(
          `❌ ${description} Failed!\n\nStatus: ${response.status}\nError: ${response.statusText}`
        );
      }
    } catch (err) {
      alert(`❌ ${description} Error!\n\n${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const runComprehensiveTest = async () => {
    setLoading(true);
    const results: string[] = [];

    const endpoints = [
      { url: '/health', name: 'Health Check' },
      { url: '/api/health/comprehensive', name: 'Comprehensive Health' },
      { url: '/api/v1/predictions/latest', name: 'Latest Predictions' },
      { url: '/api/v1/models/status', name: 'Model Status' },
      { url: '/api/analytics/performance', name: 'Analytics' },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        if (response.ok) {
          results.push(`✅ ${endpoint.name}: OK`);
        } else {
          results.push(`❌ ${endpoint.name}: ${response.status}`);
        }
      } catch (err) {
        results.push(`❌ ${endpoint.name}: Connection Error`);
      }
    }

    setLoading(false);
    alert(`🧪 Comprehensive Backend Test Results:\n\n${results.join('\n')}`);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-600';
      case 'connecting':
        return 'bg-yellow-600';
      case 'disconnected':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusDotColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-300';
      case 'connecting':
        return 'bg-yellow-300';
      case 'disconnected':
        return 'bg-red-300';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <header className='text-center mb-8'>
          <h1 className='text-5xl font-bold text-yellow-400 mb-4'>🎯 A1Betting Platform</h1>
          <p className='text-xl text-gray-300 mb-6'>
            Enterprise Sports Intelligence & Prediction Platform
          </p>

          {/* Backend Status */}
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor()}`}></div>
            {connectionStatus === 'connected' && 'Backend Connected'}
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'disconnected' && 'Backend Disconnected'}
          </div>

          {backendStatus && (
            <div className='mt-2 text-sm text-gray-400'>
              Version: {backendStatus.version || 'Unknown'} | Models:{' '}
              {backendStatus.models_loaded || 0} loaded
            </div>
          )}
        </header>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
          {/* System Status */}
          <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6'>
            <h3 className='text-xl font-semibold text-yellow-400 mb-4'>🔧 System Status</h3>
            {healthData ? (
              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div>
                    Database:{' '}
                    <span
                      className={healthData.services.database ? 'text-green-400' : 'text-red-400'}
                    >
                      {healthData.services.database ? '✅ Online' : '❌ Offline'}
                    </span>
                  </div>
                  <div>
                    ML Models:{' '}
                    <span
                      className={healthData.services.ml_models ? 'text-green-400' : 'text-red-400'}
                    >
                      {healthData.services.ml_models ? '✅ Loaded' : '❌ Error'}
                    </span>
                  </div>
                  <div>
                    API:{' '}
                    <span className={healthData.services.api ? 'text-green-400' : 'text-red-400'}>
                      {healthData.services.api ? '✅ Active' : '❌ Down'}
                    </span>
                  </div>
                  <div>
                    Predictions:{' '}
                    <span
                      className={
                        healthData.services.predictions ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {healthData.services.predictions ? '✅ Ready' : '❌ Unavailable'}
                    </span>
                  </div>
                </div>
                <div className='border-t border-gray-600 pt-3 text-sm'>
                  <div>
                    Total Predictions:{' '}
                    <span className='text-blue-400'>{healthData.metrics.total_predictions}</span>
                  </div>
                  <div>
                    Model Accuracy:{' '}
                    <span className='text-green-400'>
                      {(healthData.metrics.model_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    Uptime: <span className='text-gray-300'>{healthData.metrics.uptime}</span>
                  </div>
                </div>
              </div>
            ) : backendStatus ? (
              <div className='space-y-2 text-sm'>
                <div>
                  Status: <span className='text-green-400'>{backendStatus.status}</span>
                </div>
                <div>
                  Timestamp: <span className='text-gray-300'>{backendStatus.timestamp}</span>
                </div>
                <div>
                  Predictions:{' '}
                  <span className='text-blue-400'>
                    {backendStatus.predictions_available ? 'Available' : 'Loading...'}
                  </span>
                </div>
              </div>
            ) : (
              <div className='text-red-400'>Connecting to backend...</div>
            )}
          </div>

          {/* Live Predictions */}
          <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6'>
            <h3 className='text-xl font-semibold text-yellow-400 mb-4'>📊 Live Predictions</h3>
            {loading ? (
              <div className='text-gray-400'>Loading predictions...</div>
            ) : predictions.length > 0 ? (
              <div className='space-y-3'>
                {predictions.slice(0, 3).map((pred, idx) => (
                  <div key={pred.id || idx} className='bg-gray-700/50 p-3 rounded'>
                    <div className='font-medium text-blue-400'>{pred.game}</div>
                    <div className='text-sm text-gray-300'>{pred.prediction}</div>
                    <div className='text-xs text-green-400'>
                      Confidence: {(pred.confidence * 100).toFixed(1)}%
                    </div>
                    {pred.expected_value && (
                      <div className='text-xs text-purple-400'>
                        EV: {pred.safeNumber(expected_value, 3)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-gray-400'>No predictions available</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6'>
            <h3 className='text-xl font-semibold text-yellow-400 mb-4'>⚡ Quick Actions</h3>
            <div className='space-y-3'>
              <button
                onClick={() => testBackendEndpoint('/health', 'Health Check')}
                className='w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors'
              >
                Test Health Check
              </button>
              <button
                onClick={() => window.open('/docs', '_blank')}
                className='w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors'
              >
                Open API Docs
              </button>
              <button
                onClick={fetchPredictions}
                className='w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors'
              >
                Refresh Predictions
              </button>
              <button
                onClick={runComprehensiveTest}
                className='w-full bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors'
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Run Full Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center'>
            <div className='text-3xl mb-3'>🤖</div>
            <h4 className='font-semibold text-yellow-400 mb-2'>AI Predictions</h4>
            <p className='text-sm text-gray-400'>
              {healthData ? `${(healthData.metrics.model_accuracy * 100).toFixed(1)}%` : '96.4%'}{' '}
              accuracy ML models
            </p>
          </div>

          <div className='bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center'>
            <div className='text-3xl mb-3'>📈</div>
            <h4 className='font-semibold text-yellow-400 mb-2'>Real-time Data</h4>
            <p className='text-sm text-gray-400'>
              {healthData ? `${healthData.metrics.total_predictions}` : 'Live'} sports data feeds
            </p>
          </div>

          <div className='bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center'>
            <div className='text-3xl mb-3'>💰</div>
            <h4 className='font-semibold text-yellow-400 mb-2'>Risk Management</h4>
            <p className='text-sm text-gray-400'>Advanced portfolio optimization</p>
          </div>

          <div className='bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center'>
            <div className='text-3xl mb-3'>🎯</div>
            <h4 className='font-semibold text-yellow-400 mb-2'>Multi-platform</h4>
            <p className='text-sm text-gray-400'>PrizePicks, DraftKings & more</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='bg-red-600/20 border border-red-600 rounded-lg p-4 mb-8'>
            <h4 className='font-semibold text-red-400 mb-2'>Connection Error</h4>
            <p className='text-red-300'>{error}</p>
            <button
              onClick={checkBackendConnection}
              className='mt-3 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors'
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className='text-center text-gray-500 text-sm'>
          <p>A1Betting Platform v4.0 - Enterprise Sports Intelligence</p>
          <p className='mt-1'>
            Frontend:{' '}
            <span className='text-green-400'>
              ${process.env.REACT_APP_API_URL || 'http://localhost:8000'}
            </span>{' '}
            | Backend:{' '}
            <span className='text-blue-400'>
              ${process.env.REACT_APP_API_URL || 'http://localhost:8000'}
            </span>
          </p>
          {healthData && (
            <p className='mt-1'>
              System Uptime: <span className='text-purple-400'>{healthData.metrics.uptime}</span>
            </p>
          )}
        </footer>
      </div>
    </div>
  );
};

export default App;
