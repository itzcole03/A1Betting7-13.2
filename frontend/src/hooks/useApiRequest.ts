import { useCallback, useState } from 'react';

export function useApiRequest<T>(requestFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestFn();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, deps);

  return { data, isLoading, error, fetchData };
}
