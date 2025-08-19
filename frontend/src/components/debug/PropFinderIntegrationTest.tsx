import React, { useState, useCallback, useEffect } from 'react';
import PropFinderDataService from '../../services/PropFinderDataService';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  data?: unknown;
  error?: string;
  timestamp: string;
}

const PropFinderIntegrationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const propFinderService = PropFinderDataService.getInstance();

  const addResult = (test: string, status: 'pending' | 'success' | 'error', data?: unknown, error?: string) => {
    setResults(prev => [...prev, {
      test,
      status,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runIntegrationTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // Test 1: Fetch games
      addResult('Fetching today\'s games', 'pending');
      const games = await propFinderService.getTodaysGames();
      addResult('Fetching today\'s games', 'success', { count: games.length, sample: games.slice(0, 2) });

      // Test 2: Fetch props for first game (if available)
      if (games.length > 0) {
        const firstGame = games[0];
        addResult(`Fetching props for game ${firstGame.id}`, 'pending');
        const props = await propFinderService.getGameProps(firstGame.id, undefined, 0);
        addResult(`Fetching props for game ${firstGame.id}`, 'success', { count: props.length, sample: props.slice(0, 2) });

        // Test 3: Extract players from props
        if (props.length > 0) {
          addResult(`Extracting players for game ${firstGame.id}`, 'pending');
          const players = await propFinderService.getGamePlayers(firstGame.id);
          addResult(`Extracting players for game ${firstGame.id}`, 'success', { count: players.length, sample: players.slice(0, 2) });
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult('Integration test', 'error', undefined, errorMessage);
    } finally {
      setIsRunning(false);
    }
  }, [propFinderService]);

  useEffect(() => {
    runIntegrationTests();
  }, [runIntegrationTests]);

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">PropFinder Integration Test</h2>
        <button
          onClick={runIntegrationTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getStatusIcon(result.status)}</span>
                <span className={`font-semibold ${getStatusColor(result.status)}`}>
                  {result.test}
                </span>
              </div>
              <span className="text-sm text-gray-400">{result.timestamp}</span>
            </div>
            
            {result.error && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-500 rounded">
                <p className="text-red-400 text-sm">{result.error}</p>
              </div>
            )}
            
            {result.data && (
              <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500 rounded">
                <pre className="text-blue-300 text-sm overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className="text-center text-gray-400 py-8">
          Click "Run Tests" to start the integration test
        </div>
      )}
    </div>
  );
};

export default PropFinderIntegrationTest;