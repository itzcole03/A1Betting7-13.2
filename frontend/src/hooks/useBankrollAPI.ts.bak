import { useState, useCallback } from 'react';
import {
  BetRecordRequest,
  BetResponse,
  KellyCalculationRequest,
  KellyCalculationResponse,
  BankrollSummaryResponse,
  PerformanceStats,
  APIResponse
} from '../types/bankroll';

const API_BASE = '/api/bankroll';

export const useBankrollAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordBet = useCallback(async (betData: BetRecordRequest): Promise<BetResponse> => {
    const response = await apiCall<BetResponse>('/bet-record', {
      method: 'POST',
      body: JSON.stringify(betData),
    });
    return response.data;
  }, [apiCall]);

  const calculateKelly = useCallback(async (kellyData: KellyCalculationRequest): Promise<KellyCalculationResponse> => {
    const response = await apiCall<KellyCalculationResponse>('/kelly-calculation', {
      method: 'POST',
      body: JSON.stringify(kellyData),
    });
    return response.data;
  }, [apiCall]);

  const getBankrollSummary = useCallback(async (days: number = 30): Promise<BankrollSummaryResponse> => {
    const response = await apiCall<BankrollSummaryResponse>(`/summary?days=${days}`);
    return response.data;
  }, [apiCall]);

  const getBets = useCallback(async (params: {
    limit?: number;
    offset?: number;
    status?: string;
    sport?: string;
    sportsbook?: string;
  } = {}): Promise<BetResponse[]> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await apiCall<BetResponse[]>(`/bets?${queryParams}`);
    return response.data;
  }, [apiCall]);

  const settleBet = useCallback(async (betId: number, result: string, closingOdds?: number): Promise<BetResponse> => {
    const queryParams = new URLSearchParams({ result });
    if (closingOdds) {
      queryParams.append('closing_odds', closingOdds.toString());
    }
    
    const response = await apiCall<BetResponse>(`/bet-settle/${betId}?${queryParams}`, {
      method: 'PUT',
    });
    return response.data;
  }, [apiCall]);

  const getPerformanceStats = useCallback(async (days: number = 30): Promise<PerformanceStats> => {
    const response = await apiCall<PerformanceStats>(`/stats/performance?days=${days}`);
    return response.data;
  }, [apiCall]);

  const adjustBankroll = useCallback(async (amount: number, reason: string) => {
    const queryParams = new URLSearchParams({ 
      amount: amount.toString(), 
      reason 
    });
    
    const response = await apiCall(`/bankroll-adjustment?${queryParams}`, {
      method: 'POST',
    });
    return response.data;
  }, [apiCall]);

  return {
    loading,
    error,
    recordBet,
    calculateKelly,
    getBankrollSummary,
    getBets,
    settleBet,
    getPerformanceStats,
    adjustBankroll,
  };
};

export default useBankrollAPI;