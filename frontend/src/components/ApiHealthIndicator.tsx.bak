import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ApiHealthIndicator = () => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'down'>('checking');

  useEffect(() => {
    let active = true;
    const MIN_DISPLAY_MS = 75; // guarantee users/tests see the Checking state briefly
    const start = Date.now();

    const applyWithMinDelay = (next: 'ok' | 'down') => {
      const elapsed = Date.now() - start;
      const remaining = MIN_DISPLAY_MS - elapsed;
      if (remaining > 0) {
        setTimeout(() => {
          if (active) setStatus(next);
        }, remaining);
      } else {
        if (active) setStatus(next);
      }
    };

    // Slight async deferral so first paint is definitely 'Checking...'
    const initialTimer = setTimeout(() => {
      axios
        .get('/api/v2/health')
        .then(() => applyWithMinDelay('ok'))
        .catch(() => applyWithMinDelay('down'));
    }, 50); // small delay ensures deterministic initial state

    return () => {
      active = false;
      clearTimeout(initialTimer);
    };
  }, []);

  let color = 'gray';
  let text = 'Checking...';
  if (status === 'ok') {
    color = 'green';
    text = 'API Online';
  } else if (status === 'down') {
    color = 'red';
    text = 'API Down';
  }

  return (
    <span
      data-testid='api-health-indicator'
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-${color}-100 text-${color}-700`}
      title='Backend API health'
    >
      <span className={`w-2 h-2 rounded-full bg-${color}-500 mr-2 inline-block`}></span>
      {text}
    </span>
  );
};

export default ApiHealthIndicator;
