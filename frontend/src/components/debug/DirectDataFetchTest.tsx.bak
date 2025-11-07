/**
 * Direct PropOllama Data Fetching Test
 * This component bypasses all the complex hooks and data managers
 * to directly test the API endpoints that PropOllama should be using
 */

import React, { useState } from 'react';
import { activateSport } from '../../services/SportsService';

interface DirectTestResult {
  endpoint: string;
  method: string;
  success: boolean;
  dataCount: number;
  data?: any;
  error?: string;
  duration: number;
  timestamp: string;
  versionUsed?: string;
}

const DirectDataFetchTest: React.FC = () => {
  const [results, setResults] = useState<DirectTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      name: 'Backend Health Check',
      endpoint: 'http://localhost:8000/health',
      method: 'GET',
    },
    {
      name: 'V2 API Health Check',
      endpoint: 'http://localhost:8000/api/v2/health',
      method: 'GET',
    },
    {
      name: "Today's MLB Games",
      endpoint: 'http://localhost:8000/mlb/todays-games',
      method: 'GET',
    },
    {
      name: 'MLB Player Props (Direct)',
      endpoint: 'http://localhost:8000/mlb/odds-comparison/?market_type=playerprops&limit=10',
      method: 'GET',
    },
    {
      name: 'Sport Activation - MLB (v2)',
      endpoint: '/api/v2/sports/activate',
      method: 'POST',
      useV2: true,
    },
    {
      name: 'Frontend Health (via proxy)',
      endpoint: '/api/health',
      method: 'GET',
    },
  ];

  const runDirectTests = async () => {
    setIsRunning(true);
    setResults([]);

    console.log('[DirectDataFetchTest] Starting direct API tests...');

    for (const test of tests) {
      const startTime = Date.now();
      try {
        console.log(`[DirectDataFetchTest] Testing: ${test.name} - ${test.endpoint}`);
        let data;
        let dataCount = 0;
        let ok = false;
        let status = 0;
        if (test.useV2) {
          // Use new versioned service with fallback and logging
          data = await activateSport('MLB');
          ok = data?.success;
          dataCount = 1;
          status = 200;
        } else {
          const fetchOptions: RequestInit = {
            method: test.method,
            headers: {
              'Content-Type': 'application/json',
            },
          };
          const response = await fetch(test.endpoint, fetchOptions);
          status = response.status;
          try {
            data = await response.json();
            dataCount = Array.isArray(data) ? data.length : data?.games?.length || 0;
            ok = response.ok;
          } catch (err) {
            data = null;
          }
        }
        const duration = Date.now() - startTime;
        setResults(prev => [
          ...prev,
          {
            endpoint: test.endpoint,
            method: test.method,
            success: ok,
            dataCount,
            data: Array.isArray(data) ? `Array(${data.length})` : data,
            duration,
            timestamp: new Date().toISOString(),
            versionUsed: data?.version_used,
          },
        ]);
        console.log(`[DirectDataFetchTest] ✅ ${test.name}: ${status} (${duration}ms)`, data);
      } catch (error) {
        const duration = Date.now() - startTime;
        setResults(prev => [
          ...prev,
          {
            endpoint: test.endpoint,
            method: test.method,
            success: false,
            dataCount: 0,
            error: error instanceof Error ? error.message : String(error),
            duration,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
    setIsRunning(false);
  };

  return (
    <div className='p-6'>
      <button
        className='bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded mb-6 font-bold shadow'
        onClick={runDirectTests}
        disabled={isRunning}
      >
        {isRunning ? '🔄 Running Tests...' : '▶️ Run Direct API Tests'}
      </button>

      <div className='grid gap-4'>
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded border-l-4 ${
              result.success
                ? 'bg-green-900/20 border-green-500 text-green-100'
                : 'bg-red-900/20 border-red-500 text-red-100'
            }`}
          >
            <div className='flex items-center justify-between mb-2'>
              <span className='font-medium flex items-center gap-2'>
                {result.success ? '✅' : '❌'}
                <span className='text-sm opacity-75'>{result.method}</span>
              </span>
              <div className='text-xs opacity-75 flex gap-4'>
                <span>{result.duration}ms</span>
                <span>{result.timestamp.split('T')[1].split('.')[0]}</span>
              </div>
            </div>

            <div className='text-sm mb-2 font-mono break-all opacity-90'>{result.endpoint}</div>

            {result.success && result.dataCount > 0 && (
              <div className='text-xs bg-green-900/30 p-2 rounded mb-2'>
                📊 Data received: {result.dataCount} items
                {result.versionUsed && (
                  <span className='ml-2 text-yellow-300'>[API version: {result.versionUsed}]</span>
                )}
              </div>
            )}

            {result.error && (
              <div className='text-xs bg-red-900/30 p-2 rounded mb-2'>⚠️ Error: {result.error}</div>
            )}

            {result.data && typeof result.data === 'object' && (
              <details className='text-xs'>
                <summary className='cursor-pointer opacity-75 hover:opacity-100'>
                  View Response Data
                </summary>
                <pre className='bg-slate-800/50 p-2 rounded mt-2 overflow-x-auto'>
                  {JSON.stringify(result.data, null, 2).substring(0, 1000)}
                  {JSON.stringify(result.data).length > 1000 && '\n...truncated'}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className='text-gray-400 text-center py-8'>
          No tests run yet - click the button above to start
        </div>
      )}

      {isRunning && (
        <div className='text-yellow-400 text-center py-4 flex items-center justify-center gap-2'>
          <div className='animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full'></div>
          Running API tests...
        </div>
      )}
    </div>
  );
};

export default DirectDataFetchTest;
