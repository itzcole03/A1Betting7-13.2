/**
 * 🚀 PHASE 5: Real Betting Data Hook
 *
 * Replaces placeholder implementation with real backend integration:
 * - Real API calls to backend endpoints
 * - Live WebSocket data streams
 * - Proper error handling and retry logic
 * - Type-safe data structures
 */

import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiService } from '../services/ApiService';
import { webSocketManager } from '../services/unified/WebSocketManager';
import { useStore } from '../stores/useStore';
import type { OddsUpdate, Opportunity, PlayerProp } from '../types/core';

interface UseBettingDataOptions {
  sport?: string;
  propType?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  minOddsChange?: number;
  onNewOpportunity?: (opportunity: any) => void;
}

interface BettingDataState {
  props: PlayerProp[];
  oddsUpdates: OddsUpdate[];
  opportunities: Opportunity[];
  isLoading: boolean;
  isConnected: boolean;
  error: ApiError | null;
  lastUpdated: string | null;
}

export const useBettingData = ({
  sport,
  propType,
  autoRefresh = true,
  refreshInterval = 30000,
  minOddsChange = 0.1,
  onNewOpportunity,
}: UseBettingDataOptions = {}) => {
  const [state, setState] = useState<BettingDataState>({
    props: [],
    oddsUpdates: [],
    opportunities: [],
    isLoading: true,
    isConnected: false,
    error: null,
    lastUpdated: null,
  });

  // Get addToast from the store
  const { addToast } = useStore();

  /**
   * Fetch initial betting data from backend
   */
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      //       console.log('🎯 Fetching betting data from backend...');

      // Fetch data in parallel for better performance
      const [propsResponse, opportunitiesResponse, unifiedResponse] = await Promise.allSettled([
        apiService.getPrizePicksProps(),
        apiService.getBettingOpportunities(sport),
        apiService.getUnifiedData(),
      ]);

      // Process PrizePicks props
      let propsData: PlayerProp[] = [];
      if (propsResponse.status === 'fulfilled') {
        propsData = propsResponse.value.data || [];
        //         console.log(`✅ Fetched ${propsData.length} PrizePicks props`);
      } else {
        //         console.warn('⚠️ Failed to fetch PrizePicks props:', propsResponse.reason);
      }

      // Process betting opportunities
      let opportunitiesData: Opportunity[] = [];
      if (opportunitiesResponse.status === 'fulfilled') {
        opportunitiesData = opportunitiesResponse.value.data || [];
        //         console.log(`✅ Fetched ${opportunitiesData.length} betting opportunities`);
      } else {
        //         console.warn('⚠️ Failed to fetch betting opportunities:', opportunitiesResponse.reason);
      }

      // Process unified data for additional context
      if (unifiedResponse.status === 'fulfilled') {
        const unifiedData = unifiedResponse.value.data;
        //         console.log('✅ Fetched unified data:', Object.keys(unifiedData || {}));

        // Merge additional data if available
        if (unifiedData?.prizepicks_props) {
          propsData = [...propsData, ...unifiedData.prizepicks_props];
        }
        if (unifiedData?.betting_opportunities) {
          opportunitiesData = [...opportunitiesData, ...unifiedData.betting_opportunities];
        }
      }

      // Filter data based on options
      if (sport) {
        propsData = propsData.filter(prop => prop.sport?.toLowerCase() === sport.toLowerCase());
        opportunitiesData = opportunitiesData.filter(
          opp => opp.sport?.toLowerCase() === sport.toLowerCase()
        );
      }

      if (propType) {
        propsData = propsData.filter(
          prop => prop.stat_type?.toLowerCase() === propType.toLowerCase()
        );
      }

      setState(prev => ({
        ...prev,
        props: propsData,
        opportunities: opportunitiesData,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      }));

      //       console.log(`🎉 Betting data loaded: ${propsData.length} props, ${opportunitiesData.length} opportunities`);
    } catch (error) {
      //       console.error('❌ Failed to fetch betting data:', error);

      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: apiError,
      }));

      addToast('error', `Failed to fetch betting data: ${apiError.message}`);
    }
  }, [sport, propType, addToast]);

  /**
   * Handle WebSocket messages for real-time updates
   */
  const handleWebSocketMessage = useCallback(
    (message: unknown) => {
      if (typeof message !== 'object' || message === null) return;

      const msg = message as any;

      switch (msg.type) {
        case 'prop_update': {
          const data = msg.data as PlayerProp;
          if (!data) return;

          // Apply filters
          if (sport && data.sport?.toLowerCase() !== sport.toLowerCase()) return;
          if (propType && data.stat_type?.toLowerCase() !== propType.toLowerCase()) return;

          setState(prev => {
            const updated = [...prev.props];
            const index = updated.findIndex(p => p.id === data.id);

            if (index === -1) {
              // Add new prop
              updated.push(data);
              //               console.log('📊 New prop added:', data.player_name, data.stat_type);
            } else {
              // Update existing prop
              updated[index] = data;
              //               console.log('🔄 Prop updated:', data.player_name, data.stat_type);
            }

            return {
              ...prev,
              props: updated,
              lastUpdated: new Date().toISOString(),
            };
          });
          break;
        }

        case 'odds_update': {
          const update = msg.data as OddsUpdate & {
            sport?: string;
            propType?: string;
            propName?: string;
          };
          if (!update) return;

          // Apply filters
          if (sport && update.sport !== sport) return;
          if (propType && update.propType !== propType) return;

          const oldOdds = update.oldOdds || update.odds;
          const newOdds = update.newOdds || update.odds;
          const oddsChange = Math.abs(newOdds - oldOdds);

          if (oddsChange < minOddsChange) return;

          setState(prev => ({
            ...prev,
            oddsUpdates: [update, ...prev.oddsUpdates].slice(0, 50),
            lastUpdated: new Date().toISOString(),
          }));

          // Show notification for significant odds changes
          if (oddsChange >= 0.5) {
            addToast(
              'info',
              `Odds updated for ${update.propName || update.propId}: ${oldOdds} → ${newOdds}`
            );
          }

          //           console.log('📈 Odds updated:', update.propName, `${oldOdds} → ${newOdds}`);
          break;
        }

        case 'arbitrage_alert': {
          const opportunity = msg.data as Opportunity;
          if (!opportunity) return;

          setState(prev => ({
            ...prev,
            opportunities: [opportunity, ...prev.opportunities].slice(0, 50),
            lastUpdated: new Date().toISOString(),
          }));

          if (onNewOpportunity) onNewOpportunity(opportunity);

          addToast(
            'success',
            `🚨 New arbitrage opportunity: ${opportunity.description || opportunity.id}`
          );

          //           console.log('🎯 New arbitrage opportunity:', opportunity);
          break;
        }

        case 'connection_status': {
          setState(prev => ({
            ...prev,
            isConnected: msg.data?.connected || false,
          }));
          break;
        }

        default:
          // Ignore unknown message types
          break;
      }
    },
    [sport, propType, minOddsChange, addToast, onNewOpportunity]
  );

  /**
   * Set up WebSocket event listeners
   */
  useEffect(() => {
    //     console.log('🔌 Setting up WebSocket listeners for betting data...');

    webSocketManager.on('message', handleWebSocketMessage);

    // Subscribe to relevant channels
    const channels = ['betting_data', 'props_updates', 'odds_updates', 'arbitrage_alerts'];
    if (sport) channels.push(`sport_${sport.toLowerCase()}`);
    if (propType) channels.push(`prop_${propType.toLowerCase()}`);

    channels.forEach(channel => {
      webSocketManager.subscribe?.(channel);
    });

    return () => {
      try {
        webSocketManager.off('message', handleWebSocketMessage);
        channels.forEach(channel => {
          webSocketManager.unsubscribe?.(channel);
        });
      } catch (error) {
        //         console.warn('⚠️ Error cleaning up WebSocket listeners:', error);
      }
    };
  }, [handleWebSocketMessage, sport, propType]);

  /**
   * Setup auto-refresh interval
   */
  useEffect(() => {
    // Initial data fetch
    fetchData();

    if (autoRefresh) {
      //       console.log(`⏰ Setting up auto-refresh every ${refreshInterval}ms`);

      const interval = setInterval(() => {
        //         console.log('🔄 Auto-refreshing betting data...');
        fetchData();
      }, refreshInterval);

      return () => {
        //         console.log('⏹️ Clearing auto-refresh interval');
        clearInterval(interval);
      };
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    //     console.log('🔄 Manual refresh triggered');
    setState(prev => ({ ...prev, isLoading: true }));
    fetchData();
  }, [fetchData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    refresh,
    clearError,
    // Mock notifications for backward compatibility (to be replaced with real data)
    notifications: [
      {
        id: '1',
        message: `Live data: ${state.props.length} props, ${state.opportunities.length} opportunities`,
        time: state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : 'Never',
        type: 'system' as const,
      },
      {
        id: '2',
        message: state.error ? `Error: ${state.error.message}` : 'All systems operational',
        time: new Date().toLocaleTimeString(),
        type: state.error ? ('error' as const) : ('success' as const),
      },
    ],
  };
};
