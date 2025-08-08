/**
 * Enhanced Sportsbook Dashboard with Real-time Notifications
 * Demonstrates the integration of real-time WebSocket notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingUp, DollarSign, Bell, Settings, RefreshCw } from 'lucide-react';
import RealtimeNotificationCenter from '../notifications/RealtimeNotificationCenter';
import MultipleSportsbookComparison from './MultipleSportsbookComparison';
import { 
  useRealtimeNotifications, 
  useArbitrageNotifications,
  useHighValueBetNotifications 
} from '../../hooks/useRealtimeNotifications';
import { NotificationType, NotificationPriority } from '../../services/RealtimeNotificationService';

interface DashboardProps {
  sport?: string;
  defaultPlayer?: string;
}

const EnhancedSportsbookDashboard: React.FC<DashboardProps> = ({ 
  sport = 'nba', 
  defaultPlayer 
}) => {
  const [selectedSport, setSelectedSport] = useState(sport);
  const [selectedPlayer, setSelectedPlayer] = useState(defaultPlayer || '');
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalOdds: 0,
    arbitrageOpportunities: 0,
    highValueBets: 0,
    activeProviders: 0
  });

  // Real-time notification hooks
  const { 
    isConnected, 
    notifications, 
    unreadCount,
    connect,
    disconnect,
    subscribe
  } = useRealtimeNotifications({
    autoConnect: true,
    filters: [{
      notification_types: [
        NotificationType.ARBITRAGE_OPPORTUNITY,
        NotificationType.HIGH_VALUE_BET,
        NotificationType.ODDS_CHANGE,
        NotificationType.SYSTEM_ALERT
      ],
      min_priority: NotificationPriority.LOW,
      sports: selectedSport ? [selectedSport] : undefined
    }]
  });

  const { arbitrageOpportunities } = useArbitrageNotifications();
  const { highValueBets } = useHighValueBetNotifications();

  // Start live monitoring
  const startLiveMonitoring = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/sportsbook/live-monitoring/${selectedSport}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsLiveMonitoring(true);
        console.log('Live monitoring started for', selectedSport);
      }
    } catch (error) {
      console.error('Failed to start live monitoring:', error);
    }
  }, [selectedSport]);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      const [oddsResponse, arbitrageResponse] = await Promise.all([
        fetch(`/api/v1/sportsbook/odds/all/${selectedSport}`),
        fetch(`/api/v1/sportsbook/arbitrage/${selectedSport}`)
      ]);

      if (oddsResponse.ok && arbitrageResponse.ok) {
        const oddsData = await oddsResponse.json();
        const arbitrageData = await arbitrageResponse.json();

        setDashboardStats({
          totalOdds: oddsData.total_odds || 0,
          arbitrageOpportunities: arbitrageData.opportunities_found || 0,
          highValueBets: highValueBets.length,
          activeProviders: oddsData.providers_active || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  }, [selectedSport, highValueBets.length]);

  // Test notification functions
  const sendTestArbitrageNotification = async () => {
    try {
      await fetch('/api/v1/sportsbook/notifications/test-arbitrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: selectedSport,
          player_name: selectedPlayer || 'Test Player',
          profit_margin: 5.2
        })
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const sendTestOddsChangeNotification = async () => {
    try {
      await fetch('/api/v1/sportsbook/notifications/test-odds-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: selectedSport,
          player_name: selectedPlayer || 'Test Player',
          old_odds: -110,
          new_odds: +105,
          sportsbook: 'DraftKings'
        })
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const sendTestHighValueNotification = async () => {
    try {
      await fetch('/api/v1/sportsbook/notifications/test-high-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: selectedSport,
          player_name: selectedPlayer || 'Test Player',
          expected_value: 12.5,
          confidence: 85.0,
          recommended_stake: 150.0
        })
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  // Effect to fetch stats when sport changes
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Effect to start live monitoring when connected
  useEffect(() => {
    if (isConnected && !isLiveMonitoring) {
      startLiveMonitoring();
    }
  }, [isConnected, isLiveMonitoring, startLiveMonitoring]);

  const availableSports = ['nba', 'nfl', 'mlb', 'nhl'];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Real-time Notification Center */}
      <RealtimeNotificationCenter 
        maxNotifications={100}
        showConnectionStatus={true}
        autoConnect={true}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Enhanced Sportsbook Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time odds comparison with live notifications
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Live Monitoring Status */}
              {isLiveMonitoring && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Live Monitoring</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableSports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Player Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player (Optional)
              </label>
              <input
                type="text"
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                placeholder="Enter player name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Refresh Stats */}
            <div className="flex items-end">
              <button
                onClick={fetchDashboardStats}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Stats</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Odds</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalOdds}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Arbitrage Opportunities</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.arbitrageOpportunities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">High Value Bets</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.highValueBets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Providers</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.activeProviders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Notification Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Notifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={sendTestArbitrageNotification}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center space-x-2"
            >
              <DollarSign className="w-4 h-4" />
              <span>Test Arbitrage Alert</span>
            </button>

            <button
              onClick={sendTestOddsChangeNotification}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Test Odds Change</span>
            </button>

            <button
              onClick={sendTestHighValueNotification}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Test High Value Bet</span>
            </button>
          </div>
        </div>

        {/* Recent Notifications Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recent Arbitrage Opportunities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              Recent Arbitrage Opportunities
            </h3>
            <div className="space-y-3">
              {arbitrageOpportunities.slice(0, 5).map((notification) => (
                <div key={notification.id} className="p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="font-medium text-green-800">{notification.title}</div>
                  <div className="text-sm text-green-600 mt-1">{notification.message}</div>
                  <div className="text-xs text-green-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {arbitrageOpportunities.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No recent arbitrage opportunities
                </div>
              )}
            </div>
          </div>

          {/* Recent High Value Bets */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              Recent High Value Bets
            </h3>
            <div className="space-y-3">
              {highValueBets.slice(0, 5).map((notification) => (
                <div key={notification.id} className="p-3 bg-orange-50 rounded-md border border-orange-200">
                  <div className="font-medium text-orange-800">{notification.title}</div>
                  <div className="text-sm text-orange-600 mt-1">{notification.message}</div>
                  <div className="text-xs text-orange-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {highValueBets.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No recent high value bets
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Sportsbook Comparison */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Live Odds Comparison - {selectedSport.toUpperCase()}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Real-time odds from multiple sportsbooks with arbitrage detection
            </p>
          </div>
          
          <div className="p-6">
            <MultipleSportsbookComparison 
              sport={selectedSport}
              playerFilter={selectedPlayer}
              enableNotifications={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSportsbookDashboard;
