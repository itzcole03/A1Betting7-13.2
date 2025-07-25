import React, { useEffect, useState } from 'react';

const _PrizePicksApiTest: React.FC = () => {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const _testApi = async () => {
      try {
        console.log('Testing API connection...');

        // Test backend discovery
        const _backendUrl = 'http://localhost:8003';
        console.log('Using backend URL:', backendUrl);

        // Test health endpoint
        const _healthResponse = await fetch(`${backendUrl}/api/health/status`);
        console.log('Health response:', healthResponse.status);

        if (healthResponse.ok) {
          const _healthData = await healthResponse.json();
          console.log('Health data:', healthData);
        }

        // Test props endpoint
        const _propsResponse = await fetch(`${backendUrl}/api/prizepicks/props/enhanced`);
        console.log('Props response:', propsResponse.status);

        if (propsResponse.ok) {
          const _propsData = await propsResponse.json();
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

  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (loading) return <div>Loading API test...</div>;
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (error) return <div>Error: {error}</div>;

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='p-4'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h1 className='text-2xl font-bold mb-4'>API Test Results</h1>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p className='mb-4'>Data loaded: {data ? data.length : 0} items</p>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='bg-gray-100 p-4 rounded'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h2 className='font-bold mb-2'>First 3 Items:</h2>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <pre className='text-sm overflow-auto'>{JSON.stringify(data?.slice(0, 3), null, 2)}</pre>
      </div>
    </div>
  );
};

export default PrizePicksApiTest;
