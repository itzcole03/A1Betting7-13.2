import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SprayChartVisualization from './SprayChartVisualization';
import PerformanceTrendsChart from './PerformanceTrendsChart';
import PerformanceHeatmap from './PerformanceHeatmap';

// Mock data for demonstration
const mockSprayData = [
  { id: '1', x: -0.3, y: 0.6, hitType: 'single' as const, exitVelocity: 89, launchAngle: 12, date: '2024-01-15', outcome: 'Single to LF', distance: 285 },
  { id: '2', x: 0.1, y: 0.8, hitType: 'double' as const, exitVelocity: 102, launchAngle: 18, date: '2024-01-16', outcome: 'Double to CF' },
  { id: '3', x: 0.4, y: 0.9, hitType: 'homerun' as const, exitVelocity: 108, launchAngle: 28, date: '2024-01-17', outcome: 'HR to RF', distance: 425 },
  { id: '4', x: -0.1, y: 0.4, hitType: 'out' as const, exitVelocity: 95, launchAngle: 45, date: '2024-01-18', outcome: 'Fly out to CF' },
  { id: '5', x: 0.2, y: 0.7, hitType: 'triple' as const, exitVelocity: 98, launchAngle: 15, date: '2024-01-19', outcome: 'Triple to RC gap' },
  { id: '6', x: -0.4, y: 0.5, hitType: 'single' as const, exitVelocity: 85, launchAngle: 8, date: '2024-01-20', outcome: 'Single to LF' },
  { id: '7', x: 0.0, y: 0.6, hitType: 'double' as const, exitVelocity: 99, launchAngle: 22, date: '2024-01-21', outcome: 'Double to CF' },
  { id: '8', x: 0.3, y: 0.3, hitType: 'out' as const, exitVelocity: 92, launchAngle: 38, date: '2024-01-22', outcome: 'Ground out' },
];

const mockTrendsData = [
  { date: '2024-01-10', gameId: 'game1', opponent: 'NYY', statValue: 2.5, projectedValue: 2.2, gameResult: 'W' as const, homeAway: 'H' as const },
  { date: '2024-01-12', gameId: 'game2', opponent: 'BOS', statValue: 1.8, projectedValue: 2.1, gameResult: 'L' as const, homeAway: 'A' as const },
  { date: '2024-01-14', gameId: 'game3', opponent: 'TB', statValue: 3.2, projectedValue: 2.4, gameResult: 'W' as const, homeAway: 'H' as const },
  { date: '2024-01-16', gameId: 'game4', opponent: 'TOR', statValue: 2.1, projectedValue: 2.3, gameResult: 'W' as const, homeAway: 'A' as const },
  { date: '2024-01-18', gameId: 'game5', opponent: 'BAL', statValue: 2.8, projectedValue: 2.5, gameResult: 'L' as const, homeAway: 'H' as const },
  { date: '2024-01-20', gameId: 'game6', opponent: 'NYY', statValue: 3.5, projectedValue: 2.6, gameResult: 'W' as const, homeAway: 'A' as const },
  { date: '2024-01-22', gameId: 'game7', opponent: 'BOS', statValue: 2.3, projectedValue: 2.4, gameResult: 'L' as const, homeAway: 'H' as const },
  { date: '2024-01-24', gameId: 'game8', opponent: 'TB', statValue: 4.1, projectedValue: 2.7, gameResult: 'W' as const, homeAway: 'A' as const },
];

const mockHeatmapData = [
  { situation: 'vs LHP', value: 0.325, games: 15, category: 'pitcher' as const },
  { situation: 'vs RHP', value: 0.285, games: 25, category: 'pitcher' as const },
  { situation: '0-0 Count', value: 0.310, games: 35, category: 'count' as const },
  { situation: '1-0 Count', value: 0.340, games: 28, category: 'count' as const },
  { situation: '0-1 Count', value: 0.275, games: 22, category: 'count' as const },
  { situation: '2-0 Count', value: 0.385, games: 18, category: 'count' as const },
  { situation: '0-2 Count', value: 0.180, games: 15, category: 'count' as const },
  { situation: '3-1 Count', value: 0.425, games: 12, category: 'count' as const },
  { situation: 'Innings 1-3', value: 0.295, games: 40, category: 'inning' as const },
  { situation: 'Innings 4-6', value: 0.308, games: 40, category: 'inning' as const },
  { situation: 'Innings 7-9', value: 0.285, games: 35, category: 'inning' as const },
  { situation: 'Bases Empty', value: 0.290, games: 75, category: 'baserunner' as const },
  { situation: 'RISP', value: 0.320, games: 35, category: 'baserunner' as const },
  { situation: 'Runners On', value: 0.305, games: 45, category: 'baserunner' as const },
];

interface AdvancedVisualizationsDashboardProps {
  playerName?: string;
  playerId?: string;
  sport?: 'MLB' | 'NBA' | 'NFL' | 'NHL';
  timeRange?: 'L5' | 'L10' | 'L15' | 'L20' | 'L25' | 'season';
}

const AdvancedVisualizationsDashboard: React.FC<AdvancedVisualizationsDashboardProps> = ({
  playerName = 'Mike Trout',
  playerId = 'trout-mike',
  sport = 'MLB',
  timeRange = 'L10'
}) => {
  const [activeTab, setActiveTab] = useState<'spray' | 'trends' | 'heatmap'>('spray');
  const [selectedStat, setSelectedStat] = useState('batting_average');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'spray', label: 'Spray Chart', icon: '⚾', description: 'Field position analysis with exit velocity and launch angle' },
    { id: 'trends', label: 'Performance Trends', icon: '📈', description: 'Game-by-game performance tracking with projections' },
    { id: 'heatmap', label: 'Situational Heatmap', icon: '🔥', description: 'Performance breakdown by game situations' }
  ];

  const statOptions = sport === 'MLB' ? [
    { value: 'batting_average', label: 'Batting Average' },
    { value: 'on_base_percentage', label: 'On-Base Percentage' },
    { value: 'slugging_percentage', label: 'Slugging Percentage' },
    { value: 'ops', label: 'OPS' },
    { value: 'home_runs', label: 'Home Runs' },
    { value: 'rbi', label: 'RBI' },
    { value: 'stolen_bases', label: 'Stolen Bases' },
    { value: 'total_bases', label: 'Total Bases' }
  ] : [
    { value: 'points', label: 'Points' },
    { value: 'rebounds', label: 'Rebounds' },
    { value: 'assists', label: 'Assists' },
    { value: 'steals', label: 'Steals' }
  ];

  const handleExport = (format: 'png' | 'pdf' | 'csv') => {
    // Simulate export functionality
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // In a real implementation, this would trigger actual export
      console.log(`Exporting ${activeTab} visualization as ${format}`);
    }, 1500);
  };

  const getStatLabel = () => {
    const stat = statOptions.find(s => s.value === selectedStat);
    return stat?.label || 'Batting Average';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Advanced Analytics Dashboard</h2>
            <p className="text-blue-100">
              {playerName} • {sport} • {timeRange === 'season' ? 'Full Season' : `Last ${timeRange.slice(1)} Games`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              className="px-3 py-2 bg-white text-gray-900 rounded border-0 text-sm"
              value={selectedStat}
              onChange={(e) => setSelectedStat(e.target.value)}
            >
              {statOptions.map(stat => (
                <option key={stat.value} value={stat.value}>{stat.label}</option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('png')}
                disabled={isLoading}
                className="px-3 py-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors text-sm disabled:opacity-50"
              >
                Export PNG
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={isLoading}
                className="px-3 py-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors text-sm disabled:opacity-50"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-1 p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Tab Descriptions */}
        <div className="px-6 pb-4">
          {tabs.map(tab => (
            activeTab === tab.id && (
              <motion.p
                key={tab.id}
                className="text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {tab.description}
              </motion.p>
            )
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900">Exporting visualization...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualization Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'spray' && sport === 'MLB' && (
            <SprayChartVisualization
              playerName={playerName}
              hitData={mockSprayData}
              timeRange={timeRange}
              onHitSelect={(hit) => console.log('Selected hit:', hit)}
            />
          )}

          {activeTab === 'trends' && (
            <PerformanceTrendsChart
              playerName={playerName}
              statType={getStatLabel()}
              data={mockTrendsData}
              timeRange={timeRange}
              showProjections={true}
              showTrendLine={true}
              onDataPointClick={(point) => console.log('Selected data point:', point)}
            />
          )}

          {activeTab === 'heatmap' && (
            <PerformanceHeatmap
              playerName={playerName}
              statType={getStatLabel()}
              data={mockHeatmapData}
              timeRange={timeRange}
              selectedCategory="all"
              onCellClick={(cell) => console.log('Selected cell:', cell)}
            />
          )}

          {/* Non-baseball sports spray chart placeholder */}
          {activeTab === 'spray' && sport !== 'MLB' && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🏀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Shot Chart Coming Soon</h3>
              <p className="text-gray-600">
                Advanced shot charts and field position analytics for {sport} are under development.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Currently available for MLB players only.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Insights Panel */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">💡</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Insights</h4>
            <div className="space-y-2 text-sm text-gray-700">
              {activeTab === 'spray' && (
                <div>
                  <p>• <strong>Spray Pattern:</strong> {playerName} shows a balanced approach with 35% pull-side hits, suggesting good plate discipline.</p>
                  <p>• <strong>Power Zones:</strong> Higher exit velocities (95+ mph) concentrated in the opposite field gap, indicating strong bat-to-ball skills.</p>
                  <p>• <strong>Launch Angle:</strong> Optimal launch angles (15-25°) account for 68% of extra-base hits.</p>
                </div>
              )}
              {activeTab === 'trends' && (
                <div>
                  <p>• <strong>Recent Form:</strong> {playerName} is trending upward with a +12% improvement over the last 5 games compared to season average.</p>
                  <p>• <strong>Consistency:</strong> Low variance in performance suggests reliable production with minimal streakiness.</p>
                  <p>• <strong>Projections:</strong> Current trends indicate a 85% probability of exceeding season projections.</p>
                </div>
              )}
              {activeTab === 'heatmap' && (
                <div>
                  <p>• <strong>Count Leverage:</strong> Exceptional performance in hitter's counts (2-0, 3-1) with 42% better than league average.</p>
                  <p>• <strong>Situational Hitting:</strong> Strong RISP performance (+31 points above overall average) indicates clutch hitting ability.</p>
                  <p>• <strong>Platoon Advantage:</strong> Notable reverse splits with better performance vs LHP (+40 points).</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVisualizationsDashboard;
