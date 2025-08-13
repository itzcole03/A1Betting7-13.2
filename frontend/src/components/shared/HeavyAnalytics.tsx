import React from 'react';

// Simulate a heavy analytics component
const HeavyAnalytics: React.FC = () => {
  // Simulate heavy computation or data fetch
  const [data, setData] = React.useState<number[]>([]);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setData(Array.from({ length: 10000 }, (_, i) => Math.sin(i)));
    }, 1200); // Simulate delay
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='p-4 bg-gray-900 text-green-300 rounded shadow-lg'>
      <h2 className='text-xl font-bold mb-2'>Heavy Analytics Loaded</h2>
      <div>Data points: {data.length}</div>
      <div className='mt-2'>
        First 5 values:{' '}
        {data.slice(0, 5).map((v, i) => (
          <span key={i} className='mr-2'>
            {v.toFixed(4)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default HeavyAnalytics;
