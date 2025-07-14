import React, { useEffect, useState } from 'react';

const PrizePicksApiTest: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        console.log('Testing API connection...');

        // Test backend discovery
        const backendUrl = 'http://localhost:8003';
        console.log('Using backend URL:', backendUrl);

        // Test health endpoint
        const healthResponse = await fetch(`${backendUrl}/api/health/status`);
        console.log('Health response:', healthResponse.status);

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('Health data:', healthData);
        }

        // Test props endpoint
        const propsResponse = await fetch(`${backendUrl}/api/prizepicks/props/enhanced`);
        console.log('Props response:', propsResponse.status);

        if (propsResponse.ok) {
          const propsData = await propsResponse.json();
          console.log('Props data received:', propsData.length, 'items');
          setData(propsData);
        } else {
          throw new Error(`Props API failed: ${propsResponse.status}`);
        }
      } catch (err) {
        console.error('API Test Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) return <div>Loading API test...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>API Test Results</h1>
      <p className='mb-4'>Data loaded: {data ? data.length : 0} items</p>
      <div className='bg-gray-100 p-4 rounded'>
        <h2 className='font-bold mb-2'>First 3 Items:</h2>
        <pre className='text-sm overflow-auto'>{JSON.stringify(data?.slice(0, 3), null, 2)}</pre>
      </div>
    </div>
  );
};

export default PrizePicksApiTest;
