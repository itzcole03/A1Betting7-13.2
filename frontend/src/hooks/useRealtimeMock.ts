import { useEffect, useState } from 'react';

// Simple hook to simulate real-time updates by appending randomized data
export function useRealtimeMock<T>(initial: T, updater: (prev: T) => T, intervalMs = 5000) {
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => updater(prev));
    }, intervalMs);

    return () => clearInterval(id);
  }, [updater, intervalMs]);

  return state;
}

export default useRealtimeMock;
