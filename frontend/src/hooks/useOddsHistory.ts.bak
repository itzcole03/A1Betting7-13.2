import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/apiConfig';

export interface OddsHistoryParams {
  prop_id: string;
  sportsbook?: string;
  hours_back?: number;
  limit?: number;
}

export interface OddsSnapshot {
  prop_id: string;
  sportsbook: string;
  line: number;
  over_odds: number;
  under_odds: number;
  captured_at: string;
  timestamp?: string;
}

export interface OddsHistoryResponse {
  success: boolean;
  data?: {
    prop_id: string;
    sportsbook: string;
    total_snapshots: number;
    date_range: {
      start: string;
      end: string;
    };
    snapshots: OddsSnapshot[];
  };
  error?: string;
}

export interface UseOddsHistoryReturn {
  data: OddsSnapshot[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  totalSnapshots: number;
  dateRange: { start: string; end: string } | null;
}

export const useOddsHistory = (
  params: OddsHistoryParams | null,
  enabled: boolean = true
): UseOddsHistoryReturn => {
  const [data, setData] = useState<OddsSnapshot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalSnapshots, setTotalSnapshots] = useState(0);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const apiBaseUrl = API_BASE_URL;

  const fetchOddsHistory = useCallback(async () => {
    if (!params || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        prop_id: params.prop_id,
        ...(params.sportsbook && { sportsbook: params.sportsbook }),
        ...(params.hours_back && { hours_back: params.hours_back.toString() }),
        ...(params.limit && { limit: params.limit.toString() }),
      });

      const response = await fetch(`${apiBaseUrl}/api/odds/history?${queryParams}`);
      const result: OddsHistoryResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch odds history');
      }

      if (result.data) {
        setData(result.data.snapshots);
        setTotalSnapshots(result.data.total_snapshots);
        setDateRange(result.data.date_range);
      } else {
        setData([]);
        setTotalSnapshots(0);
        setDateRange(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
      setTotalSnapshots(0);
      setDateRange(null);
    } finally {
      setLoading(false);
    }
  }, [params, enabled, apiBaseUrl]);

  useEffect(() => {
    fetchOddsHistory();
  }, [fetchOddsHistory]);

  const refetch = useCallback(() => {
    fetchOddsHistory();
  }, [fetchOddsHistory]);

  return {
    data,
    loading,
    error,
    refetch,
    totalSnapshots,
    dateRange,
  };
};

export default useOddsHistory;
