/**
 * Simple Direct API Test
 * This bypasses ALL the complex services and managers
 * to directly test the raw API -> UI data flow
 */

import React, { useEffect, useState } from 'react';

interface SimpleProp {
  id: string;
  player: string;
  stat: string;
  line: number;
  confidence: number;
  sport: string;
  matchup: string;
}

const SimpleDirectAPITest: React.FC = () => {
  const [props, setProps] = useState<SimpleProp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const fetchSimpleProps = async () => {
    setIsLoading(true);
    setError(null);
    setProps([]);
    setRawResponse(null);

    try {
      console.log('[SimpleDirectAPITest] Making direct API call...');

      // Direct API call with no services or managers
      const response = await fetch(
        'http://localhost:8000/mlb/odds-comparison/?market_type=playerprops&limit=10'
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      setRawResponse(rawData);

      console.log('[SimpleDirectAPITest] Raw API response:', rawData);

      // Simple direct mapping with no validation
      const mappedProps: SimpleProp[] = rawData.map((item: any) => ({
        id: item.id || `${item.player_name}-${item.stat_type}`,
        player: item.player_name || item.player || 'Unknown Player',
        stat: item.stat_type || item.stat || 'Unknown Stat',
        line: parseFloat(item.line || item.line_score || 0),
        confidence: parseFloat(item.confidence || 0),
        sport: item.sport || 'MLB',
        matchup: item.matchup || item.event_name || 'Unknown Game',
      }));

      setProps(mappedProps);
      console.log('[SimpleDirectAPITest] ✅ Successfully mapped props:', mappedProps);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('[SimpleDirectAPITest] ❌ Error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run on mount
    const timeoutId = setTimeout(() => {
      fetchSimpleProps().catch(error => {
        console.error('[SimpleDirectAPITest] Auto-run failed:', error);
      });
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className='simple-direct-api-test bg-purple-900/20 p-6 rounded-lg border border-purple-500'>
      <h2 className='text-xl font-bold text-purple-400 mb-4'>
        🎯 Simple Direct API Test (No Services/Managers)
      </h2>

      <button
        onClick={fetchSimpleProps}
        disabled={isLoading}
        className='bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-medium mb-6'
      >
        {isLoading ? '🔄 Loading...' : '▶️ Test Direct API Call'}
      </button>

      {error && (
        <div className='bg-red-900/30 border border-red-500 p-4 rounded mb-4'>
          <h3 className='text-red-400 font-medium mb-2'>❌ Error</h3>
          <p className='text-red-300 text-sm'>{error}</p>
        </div>
      )}

      {props.length > 0 && (
        <div className='bg-green-900/20 border border-green-500 p-4 rounded mb-4'>
          <h3 className='text-green-400 font-medium mb-3'>
            ✅ Success - {props.length} Props Loaded
          </h3>
          <div className='grid gap-2 max-h-64 overflow-y-auto'>
            {props.map((prop, index) => (
              <div key={index} className='bg-slate-800/50 p-3 rounded text-sm'>
                <div className='text-white font-medium'>
                  {prop.player} - {prop.stat}
                </div>
                <div className='text-gray-300'>
                  Line: {prop.line} | Confidence: {prop.confidence}%
                </div>
                <div className='text-gray-400 text-xs'>{prop.matchup}</div>
                <div className='text-gray-500 text-xs'>
                  ID: {prop.id} | Sport: {prop.sport}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rawResponse && (
        <details className='bg-slate-900/50 p-4 rounded'>
          <summary className='text-gray-300 cursor-pointer hover:text-white'>
            View Raw API Response (First 2 Items)
          </summary>
          <pre className='text-xs text-gray-400 mt-2 overflow-x-auto'>
            {JSON.stringify(
              Array.isArray(rawResponse) ? rawResponse.slice(0, 2) : rawResponse,
              null,
              2
            )}
          </pre>
        </details>
      )}

      {isLoading && (
        <div className='text-purple-400 text-center py-4 flex items-center justify-center gap-2'>
          <div className='animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full'></div>
          Testing direct API call...
        </div>
      )}
    </div>
  );
};

export default SimpleDirectAPITest;
