/**
 * Backend Connection Test Component
 * Helps diagnose backend connectivity issues
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, Wifi, WifiOff, Server } from 'lucide-react';

interface ConnectionTest {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'failed' | 'testing';
  error?: string;
  responseTime?: number;
}

export const BackendConnectionTest: React.FC = () => {
  const isCloudEnvironment = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  const [tests, setTests] = useState<ConnectionTest[]>(() => {
    if (isCloudEnvironment) {
      // In cloud environment, only test proxy endpoints
      return [
        { name: 'Backend Health (via proxy)', url: '/api/health', status: 'pending' },
        { name: 'Cheatsheets Health', url: '/api/v1/cheatsheets/health', status: 'pending' },
        { name: 'Backend Docs', url: '/api/docs', status: 'pending' },
        { name: 'Root Health', url: '/health', status: 'pending' },
      ];
    } else {
      // Local development - test multiple ports
      return [
        { name: 'Backend Health (Port 8000)', url: '/api/health', status: 'pending' },
        { name: 'Cheatsheets Health', url: '/api/v1/cheatsheets/health', status: 'pending' },
        { name: 'Backend Health Alt (Port 8000)', url: 'http://localhost:8000/health', status: 'pending' },
        { name: 'Backend Health (Port 8001)', url: 'http://localhost:8001/health', status: 'pending' },
        { name: 'Backend Health (Port 3000)', url: 'http://localhost:3000/health', status: 'pending' },
        { name: 'Backend Docs', url: '/api/docs', status: 'pending' },
      ];
    }
  });

  const [isRunning, setIsRunning] = useState(false);

  const testConnection = async (test: ConnectionTest): Promise<ConnectionTest> => {
    const startTime = Date.now();

    try {
      // Skip cross-origin requests in cloud environment
      if (isCloudEnvironment && test.url.startsWith('http://localhost')) {
        return {
          ...test,
          status: 'failed',
          error: 'Cross-origin localhost requests blocked in cloud environment',
          responseTime: 0
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(test.url, {
        method: 'GET',
        signal: controller.signal,
        mode: test.url.startsWith('http') ? 'cors' : 'same-origin'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          ...test,
          status: 'success',
          responseTime
        };
      } else {
        return {
          ...test,
          status: 'failed',
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        ...test,
        status: 'failed',
        error: error.name === 'AbortError' ? 'Timeout (5s)' : errorMessage,
        responseTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < tests.length; i++) {
      setTests(prev => prev.map((t, idx) => 
        idx === i ? { ...t, status: 'testing' } : t
      ));

      const result = await testConnection(tests[i]);
      
      setTests(prev => prev.map((t, idx) => 
        idx === i ? result : t
      ));

      // Short delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsRunning(false);
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ 
      ...test, 
      status: 'pending', 
      error: undefined, 
      responseTime: undefined 
    })));
  };

  const getStatusIcon = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'testing':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-slate-600"></div>;
    }
  };

  const successfulTests = tests.filter(t => t.status === 'success');
  const hasConnection = successfulTests.length > 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Backend Connection Test</h3>
            <p className="text-sm text-slate-400">Diagnose backend connectivity issues</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasConnection ? (
            <div className="flex items-center gap-2 text-green-400">
              <Wifi className="w-5 h-5" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <WifiOff className="w-5 h-5" />
              <span className="text-sm">No Connection</span>
            </div>
          )}
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-2 mb-6">
        {tests.map((test, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(test.status)}
              <div>
                <div className="text-sm font-medium text-white">{test.name}</div>
                <div className="text-xs text-slate-400">{test.url}</div>
              </div>
            </div>
            <div className="text-right">
              {test.responseTime && (
                <div className="text-xs text-slate-400">{test.responseTime}ms</div>
              )}
              {test.error && (
                <div className="text-xs text-red-400 max-w-xs truncate" title={test.error}>
                  {test.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isRunning ? <Loader className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          {isRunning ? 'Testing...' : 'Run Tests'}
        </button>
        <button
          onClick={resetTests}
          disabled={isRunning}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Success message */}
      {hasConnection && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="text-green-400 text-sm font-medium">
            ✅ Found {successfulTests.length} working connection{successfulTests.length > 1 ? 's' : ''}!
          </div>
          <div className="text-green-300 text-xs mt-1">
            Successful endpoints: {successfulTests.map(t => t.name).join(', ')}
          </div>
        </div>
      )}

      {/* Troubleshooting tips */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">Troubleshooting Tips:</h4>
        {isCloudEnvironment ? (
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• This is a cloud environment - backend must be connected via proxy</li>
            <li>• Ensure your local backend is running and accessible</li>
            <li>• Check if the proxy/tunnel to your local backend is configured</li>
            <li>• Verify CORS is properly configured in the backend for cloud domains</li>
            <li>• The backend should respond to proxy endpoints like /api/health</li>
          </ul>
        ) : (
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Ensure the backend is running on the correct port (usually 8000)</li>
            <li>• Check if the backend is binding to 0.0.0.0 (not just 127.0.0.1)</li>
            <li>• Verify CORS is properly configured in the backend</li>
            <li>• Check firewall settings allow connections to the backend port</li>
            <li>• Confirm the backend API routes are properly registered</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default BackendConnectionTest;
