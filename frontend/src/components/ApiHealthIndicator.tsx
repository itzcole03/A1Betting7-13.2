import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ApiHealthIndicator = () => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    axios
      .get('/api/health')
      .then(() => setStatus('ok'))
      .catch(() => setStatus('down'));
  }, []);

  const color = 'gray';
  const text = 'Checking...';
  if (status === 'ok') {
    // @ts-expect-error TS(2588): Cannot assign to 'color' because it is a constant.
    color = 'green';
    // @ts-expect-error TS(2588): Cannot assign to 'text' because it is a constant.
    text = 'API Online';
  }
  if (status === 'down') {
    // @ts-expect-error TS(2588): Cannot assign to 'color' because it is a constant.
    color = 'red';
    // @ts-expect-error TS(2588): Cannot assign to 'text' because it is a constant.
    text = 'API Down';
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-${color}-100 text-${color}-700`}
      title='Backend API health'
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <span className={`w-2 h-2 rounded-full bg-${color}-500 mr-2 inline-block`}></span>
      {text}
    </span>
  );
};

export default ApiHealthIndicator;
