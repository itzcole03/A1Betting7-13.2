import { useEffect, useState } from 'react';
import { PrizePicksApiService } from '../services/unified/PrizePicksApiService';
import type { PrizePicksProjection, UsePrizePicksPropsResult } from '../types/prizePicksUnified';

export function usePrizePicksProps(): UsePrizePicksPropsResult {
  const [data, setData] = useState<PrizePicksProjection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const service = new PrizePicksApiService({ baseURL: '/api/prizepicks' });
    setLoading(true);
    setError(null);
    service
      .getAvailableProps()
      .then(projections => {
        if (isMounted) {
          setData(projections || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err?.message || 'Failed to load PrizePicks props');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
}
