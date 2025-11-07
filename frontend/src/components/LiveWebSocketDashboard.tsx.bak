/**
 * WebSocket Integration Example Component
 * Demonstrates how to use the enhanced WebSocket system with room-based subscriptions
 */

import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import {
  WebSocketNotificationCenter,
  WebSocketConnectionStatus,
  WebSocketSubscriptionManager
} from './WebSocketNotifications';
import {
  useWebSocketConnectionHook,
  useWebSocketOdds,
  useWebSocketPredictions,
  useWebSocketArbitrage,
  useWebSocketSport
} from '../hooks/useWebSocketHooks';

interface LiveDashboardProps {
  sport?: string;
  token?: string;
}

export const LiveWebSocketDashboard: React.FC<LiveDashboardProps> = ({ 
  sport = 'MLB', 
  token 
}) => {
  const [selectedSport, setSelectedSport] = useState(sport);
  
  // Connect to WebSocket with auto-reconnection
  const connection = useWebSocketConnectionHook(token, true);
  
  // Subscribe to different data streams
  const { odds, isSubscribed: oddsSubscribed } = useWebSocketOdds({ sport: selectedSport });
  const { predictions, isSubscribed: predictionsSubscribed } = useWebSocketPredictions({ sport: selectedSport });
  const { opportunities, isSubscribed: arbitrageSubscribed } = useWebSocketArbitrage({ sport: selectedSport });
  const { data: sportData, isSubscribed: sportSubscribed } = useWebSocketSport(selectedSport);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* WebSocket Notifications */}
      <WebSocketNotificationCenter />
      
      {/* Header with Connection Status */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Live Sports Dashboard</h1>
          <WebSocketConnectionStatus showDetails={true} />
        </div>
        
        {/* Sport Selector */}
        <div className="mt-4 flex space-x-4">
          {['MLB', 'NBA', 'NFL', 'NHL'].map((sportOption) => (
            <button
              key={sportOption}
              onClick={() => setSelectedSport(sportOption)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSport === sportOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {sportOption}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Odds Updates */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Live Odds</h2>
            {oddsSubscribed && (
              <span className="bg-green-600 text-green-100 text-xs px-2 py-1 rounded-full">
                Live
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {odds && odds.length > 0 ? (
              odds.slice(0, 5).map((odd, index) => (
                <div key={index} className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{odd.home_team} vs {odd.away_team}</p>
                      <p className="text-sm text-gray-300">
                        Spread: {odd.spread?.home || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-400">
                        ML: {odd.moneyline?.home || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {odd.updated_at ? new Date(odd.updated_at).toLocaleTimeString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">
                {oddsSubscribed ? 'Waiting for odds updates...' : 'Not subscribed to odds'}
              </p>
            )}
          </div>
        </div>

        {/* Predictions */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">ML Predictions</h2>
            {predictionsSubscribed && (
              <span className="bg-blue-600 text-blue-100 text-xs px-2 py-1 rounded-full">
                Live
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {predictions && predictions.length > 0 ? (
              predictions.slice(0, 5).map((prediction, index) => (
                <div key={index} className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{prediction.sport}</p>
                      <p className="text-sm text-gray-300">
                        Confidence: {Math.round(prediction.confidence * 100)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-400">
                        {Math.round(prediction.prediction * 100)}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {prediction.models_used} models
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">
                {predictionsSubscribed ? 'Waiting for predictions...' : 'Not subscribed to predictions'}
              </p>
            )}
          </div>
        </div>

        {/* Arbitrage Opportunities */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Arbitrage</h2>
            {arbitrageSubscribed && (
              <span className="bg-yellow-600 text-yellow-100 text-xs px-2 py-1 rounded-full">
                Live
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {opportunities && opportunities.length > 0 ? (
              opportunities.slice(0, 3).map((opportunity, index) => (
                <div key={index} className="bg-gray-700 rounded p-3 border-l-4 border-yellow-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{opportunity.game}</p>
                      <p className="text-xs text-gray-300">
                        {opportunity.book_a?.name} vs {opportunity.book_b?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-400">
                        {opportunity.profit_percentage}%
                      </p>
                      <p className="text-xs text-gray-400">
                        ${opportunity.guaranteed_profit} profit
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <p className="text-xs text-red-300">
                      ⏱️ {opportunity.expires_in}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">
                {arbitrageSubscribed ? 'No arbitrage opportunities' : 'Not subscribed to arbitrage'}
              </p>
            )}
          </div>
        </div>

        {/* Subscription Manager */}
        <div className="lg:col-span-2 xl:col-span-3">
          <WebSocketSubscriptionManager />
        </div>
      </div>

      {/* Connection Statistics */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Connection Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Status</p>
            <p className={connection.connected ? 'text-green-400' : 'text-red-400'}>
              {connection.connected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Authentication</p>
            <p className={connection.authenticated ? 'text-green-400' : 'text-yellow-400'}>
              {connection.authenticated ? 'Authenticated' : 'Anonymous'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Client ID</p>
            <p className="text-white font-mono text-xs">
              {connection.client_id?.slice(0, 12) || 'N/A'}...
            </p>
          </div>
          <div>
            <p className="text-gray-400">Connections</p>
            <p className="text-white">{connection.connection_count}</p>
          </div>
        </div>
        
        {connection.last_ping && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Last heartbeat: {new Date(connection.last_ping).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveWebSocketDashboard;
