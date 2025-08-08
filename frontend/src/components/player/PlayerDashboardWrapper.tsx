/**
 * PlayerDashboardWrapper - Handles URL routing for player dashboard
 * Extracts playerId from URL params and provides fallback behavior
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayerDashboardContainer } from './PlayerDashboardContainer';

const PlayerDashboardWrapper: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  console.log('[PlayerDashboardWrapper] Rendering with playerId:', playerId);

  // If no playerId is provided in URL, show a player selection interface
  if (!playerId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Player Research</h1>
          
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Search for a Player</h2>
            <p className="text-gray-400 mb-6">
              Use the search feature below to find and analyze player performance data.
            </p>
            
            {/* Use the PlayerDashboardContainer with empty playerId to show search interface */}
            <PlayerDashboardContainer 
              playerId=""
              sport="MLB"
              onPlayerChange={(selectedPlayerId) => {
                // Navigate to the specific player URL
                navigate(`/player/${selectedPlayerId}`);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // If playerId is provided, render the player dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PlayerDashboardContainer 
        playerId={playerId}
        sport="MLB"
        onPlayerChange={(selectedPlayerId) => {
          // Navigate to the new player URL
          navigate(`/player/${selectedPlayerId}`);
        }}
      />
    </div>
  );
};

export default PlayerDashboardWrapper;
