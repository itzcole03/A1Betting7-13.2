/**
 * FeaturedPropsService Direct Test
 * This component directly tests the FeaturedPropsService methods
 * to isolate where the data fetching issue is occurring
 */

import React, { useEffect, useState } from 'react';
import { FeaturedProp, fetchFeaturedProps } from '../../services/unified/FeaturedPropsService';

interface ServiceTestResult {
  testName: string;
  success: boolean;
  propsCount: number;
  props?: FeaturedProp[];
  error?: string;
  duration: number;
  timestamp: string;
}

const FeaturedPropsServiceTest: React.FC = () => {
  const [results, setResults] = useState<ServiceTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runServiceTests = async () => {
    setIsRunning(true);
    setResults([]);

    console.log('[FeaturedPropsServiceTest] Starting FeaturedPropsService tests...');

    const tests = [
      {
        name: 'MLB Props (Default Options)',
        sport: 'MLB',
        marketType: 'player',
        options: {},
      },
      {
        name: 'MLB Props (No Cache)',
        sport: 'MLB',
        marketType: 'player',
        options: { useCache: false, limit: 5 },
      },
      {
        name: 'MLB Props (With Stat Types)',
        sport: 'MLB',
        marketType: 'player',
        options: { statTypes: ['hits', 'home_runs'], limit: 5 },
      },
      {
        name: 'MLB Props (High Priority)',
        sport: 'MLB',
        marketType: 'player',
        options: { priority: 'high' as const, limit: 3 },
      },
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        console.log(`[FeaturedPropsServiceTest] Running: ${test.name}`);

        const props = await fetchFeaturedProps(test.sport, test.marketType, test.options);
        const duration = Date.now() - startTime;

        setResults(prev => [
          ...prev,
          {
            testName: test.name,
            success: true,
            propsCount: props.length,
            props: props.slice(0, 3), // Keep first 3 for display
            duration,
            timestamp: new Date().toISOString(),
          },
        ]);

        console.log(
          `[FeaturedPropsServiceTest] ✅ ${test.name}: ${props.length} props (${duration}ms)`
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        setResults(prev => [
          ...prev,
          {
            testName: test.name,
            success: false,
            propsCount: 0,
            error: error instanceof Error ? error.message : String(error),
            duration,
            timestamp: new Date().toISOString(),
          },
        ]);

        console.error(`[FeaturedPropsServiceTest] ❌ ${test.name}:`, error);
      }
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on component mount with delay
    setTimeout(runServiceTests, 2000);
  }, []);

  return (
    <div className='featured-props-service-test bg-blue-900/20 p-6 rounded-lg border border-blue-500'>
      <h2 className='text-xl font-bold text-blue-400 mb-4'>🧪 FeaturedPropsService Test</h2>

      <button
        onClick={runServiceTests}
        disabled={isRunning}
        className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-medium mb-6'
      >
        {isRunning ? '🔄 Running Tests...' : '▶️ Test FeaturedPropsService'}
      </button>

      <div className='space-y-4'>
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded border-l-4 ${
              result.success ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'
            }`}
          >
            <div className='flex items-center justify-between mb-2'>
              <span className='font-medium text-white flex items-center gap-2'>
                {result.success ? '✅' : '❌'}
                {result.testName}
              </span>
              <div className='text-xs text-gray-400 flex gap-4'>
                <span>{result.duration}ms</span>
                <span>{result.timestamp.split('T')[1].split('.')[0]}</span>
              </div>
            </div>

            {result.success && (
              <div className='text-sm text-green-300 mb-2'>
                📊 Fetched {result.propsCount} props successfully
              </div>
            )}

            {result.error && (
              <div className='text-sm text-red-300 mb-2'>⚠️ Error: {result.error}</div>
            )}

            {result.props && result.props.length > 0 && (
              <details className='text-xs'>
                <summary className='cursor-pointer text-gray-300 hover:text-white'>
                  View Sample Props (first 3)
                </summary>
                <div className='mt-2 space-y-2'>
                  {result.props.map((prop, propIndex) => (
                    <div key={propIndex} className='bg-slate-800/50 p-3 rounded'>
                      <div className='text-white font-medium'>
                        {prop.player} - {prop.stat}
                      </div>
                      <div className='text-gray-300 text-xs'>
                        {prop.matchup} | Line: {prop.line} | Confidence: {prop.confidence}%
                      </div>
                      <div className='text-gray-400 text-xs mt-1'>
                        ID: {prop.id} | Sport: {prop.sport}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className='text-gray-400 text-center py-8'>
          FeaturedPropsService tests will run automatically...
        </div>
      )}

      {isRunning && (
        <div className='text-blue-400 text-center py-4 flex items-center justify-center gap-2'>
          <div className='animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full'></div>
          Testing FeaturedPropsService...
        </div>
      )}
    </div>
  );
};

export default FeaturedPropsServiceTest;
