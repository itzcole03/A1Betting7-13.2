/**
 * PlayerChartExample - Demonstrates integration of PlayerLineTrendChart
 * Shows how to use the chart component in prop detail expansion panels
 */

import React, { useState } from 'react';
import PlayerLineTrendChart from '../components/charts/PlayerLineTrendChart';

const PlayerChartExample: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('Aaron Judge');
  const [selectedSport, setSelectedSport] = useState<string>('MLB');
  const [selectedMarket, setSelectedMarket] = useState<string>('HR');

  // Sample players and markets for demo
  const players = ['Aaron Judge', 'Mookie Betts', 'Ronald Acuña Jr.', 'Mike Trout'];
  const markets = ['HR', 'Hits', 'RBI', 'Total Bases'];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Player Performance Chart Demo
        </h1>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {players.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MLB">MLB</option>
              <option value="NBA">NBA</option>
              <option value="NFL">NFL</option>
              <option value="NHL">NHL</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {markets.map((market) => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Component */}
      <PlayerLineTrendChart
        player={selectedPlayer}
        sport={selectedSport}
        market={selectedMarket}
        window={10}
        height={400}
        showStats={true}
      />

      {/* Integration Example */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Integration Examples
        </h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-800">1. Prop Detail Expansion</h3>
            <p className="text-gray-600">
              Add this component to prop card expansion panels when users click on player rows:
            </p>
            <pre className="bg-white p-3 rounded border mt-2 text-xs overflow-x-auto">
{`// In PropCard.tsx expansion panel
{expanded && (
  <div className="mt-4">
    <PlayerLineTrendChart
      player={prop.player}
      sport={prop.sport}
      market={prop.market}
      window={15}
      height={300}
    />
  </div>
)}`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800">2. Mini Sparklines in Table</h3>
            <p className="text-gray-600">
              Use a compact version in prop table cells for quick visualization:
            </p>
            <pre className="bg-white p-3 rounded border mt-2 text-xs overflow-x-auto">
{`// In PropTable.tsx cell
<PlayerLineTrendChart
  player={row.player}
  sport={row.sport}
  market={row.market}
  window={5}
  height={60}
  showStats={false}
/>`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800">3. Modal/Dialog Integration</h3>
            <p className="text-gray-600">
              Open detailed performance analysis in a modal when clicking chart icons:
            </p>
            <pre className="bg-white p-3 rounded border mt-2 text-xs overflow-x-auto">
{`// In PlayerModal.tsx
<PlayerLineTrendChart
  player={selectedPlayer}
  sport="MLB"
  market={selectedMarket}
  window={20}
  height={500}
  showStats={true}
  title="Detailed Performance Analysis"
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerChartExample;