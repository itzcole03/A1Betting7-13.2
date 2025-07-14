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

  if (loading) return <div className='p-8'>Loading...</div>;
  if (error) return <div className='p-8 text-red-500'>Error: {error}</div>;

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>PrizePicks Test</h1>
      <p className='mb-4'>Data received: {data.length} items</p>
      <div className='grid gap-4'>
        {data.map((item, index) => (
          <div key={item.id || index} className='border p-4 rounded'>
            <h3 className='font-bold'>{item.player_name}</h3>
            <p>
              {item.team} - {item.stat_type}: {item.line_score}
            </p>
            <p>Confidence: {item.confidence}%</p>
            <p>Recommendation: {item.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrizePicksTest;
