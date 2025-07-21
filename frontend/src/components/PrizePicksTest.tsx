import React, { useEffect, useState } from 'react';
import { fetchPrizePicksProps, PrizePicksProp } from '../services/api';

const PrizePicksTest: React.FC = () => {
  const [data, setData] = useState<PrizePicksProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 PrizePicksTest: Starting fetch...');
        const result = await fetchPrizePicksProps();
        console.log('🔍 PrizePicksTest: Data received:', result);
        setData(result);
      } catch (err) {
        console.error('🔍 PrizePicksTest: Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (loading) return <div className='p-8'>Loading...</div>;
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (error) return <div className='p-8 text-red-500'>Error: {error}</div>;

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='p-8'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h1 className='text-2xl font-bold mb-4'>PrizePicks Test</h1>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p className='mb-4'>Data received: {data.length} items</p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid gap-4'>
        {data.map((item, index) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div key={item.id || index} className='border p-4 rounded'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='font-bold'>{item.player_name}</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p>
              {item.team} - {item.stat_type}: {item.line_score}
            </p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p>Confidence: {item.confidence}%</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p>Recommendation: {item.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrizePicksTest;
