import React, { useEffect, useState } from 'react';

const DebugTest: React.FC = () => {
  const [status, setStatus] = useState('Starting...');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setStatus('Testing backend connection...');

        // Test direct connection
        const response = await fetch('http://localhost:8002/api/prizepicks/props/enhanced');
        setStatus(`Response status: ${response.status}`);

        if (response.ok) {
          const result = await response.json();
          setStatus(`SUCCESS: Got ${result.length} items`);
          setData(result);
        } else {
          setStatus(`ERROR: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        setStatus(`ERROR: ${error}`);
      }
    };

    testAPI();
  }, []);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h1>Debug Test</h1>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <p>Status: {status}</p>
      {data && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2>Data Preview:</h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <pre>{JSON.stringify(data.slice(0, 2), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugTest;
