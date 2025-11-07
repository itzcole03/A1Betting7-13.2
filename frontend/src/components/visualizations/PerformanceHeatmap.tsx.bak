import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
  situation: string;
  value: number;
  games: number;
  category: 'pitcher' | 'count' | 'inning' | 'baserunner' | 'stadium';
  subcategory?: string;
}

interface PerformanceHeatmapProps {
  playerName: string;
  statType: string;
  data: HeatmapData[];
  timeRange: 'L5' | 'L10' | 'L15' | 'L20' | 'L25' | 'season';
  selectedCategory?: 'pitcher' | 'count' | 'inning' | 'baserunner' | 'stadium' | 'all';
  onCellClick?: (cell: HeatmapData) => void;
}

const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({
  playerName,
  statType,
  data,
  timeRange,
  selectedCategory = 'all',
  onCellClick
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'games'>('value');

  const filteredData = useMemo(() => {
    return selectedCategory === 'all' 
      ? data 
      : data.filter(item => item.category === selectedCategory);
  }, [data, selectedCategory]);

  const { maxValue, minValue, avgValue } = useMemo(() => {
    const values = filteredData.map(d => d.value);
    return {
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
      avgValue: values.reduce((sum, val) => sum + val, 0) / values.length
    };
  }, [filteredData]);

  const getHeatmapColor = (value: number, games: number) => {
    // Minimum games threshold for reliable data
    const minGamesForReliability = 3;
    const reliability = games >= minGamesForReliability ? 1 : games / minGamesForReliability;
    
    // Normalize value between 0 and 1
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    
    // Color scale from red (low) to yellow (medium) to green (high)
    let red, green, blue;
    
    if (normalizedValue < 0.5) {
      // Red to yellow
      red = 255;
      green = Math.round(255 * (normalizedValue * 2));
      blue = 0;
    } else {
      // Yellow to green
      red = Math.round(255 * (2 - normalizedValue * 2));
      green = 255;
      blue = 0;
    }
    
    // Apply reliability factor to opacity
    const opacity = 0.3 + (0.7 * reliability);
    
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  };

  const getTextColor = (value: number) => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    return normalizedValue > 0.7 ? 'white' : 'black';
  };

  const groupedData = useMemo(() => {
    const groups: { [key: string]: HeatmapData[] } = {};
    
    filteredData.forEach(item => {
      const groupKey = item.category;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    // Sort within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => sortBy === 'value' ? b.value - a.value : b.games - a.games);
    });
    
    return groups;
  }, [filteredData, sortBy]);

  const categoryLabels = {
    pitcher: 'vs Pitcher Type',
    count: 'By Count',
    inning: 'By Inning',
    baserunner: 'Base Situation',
    stadium: 'By Stadium'
  };

  const formatValue = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(3);
  };

  const getPerformanceLevel = (value: number) => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    if (normalizedValue >= 0.8) return 'Excellent';
    if (normalizedValue >= 0.6) return 'Good';
    if (normalizedValue >= 0.4) return 'Average';
    if (normalizedValue >= 0.2) return 'Below Average';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{playerName} Performance Heatmap</h3>
          <p className="text-sm text-gray-600">
            {statType} by Situation - {timeRange === 'season' ? 'Full Season' : `Last ${timeRange.slice(1)} Games`}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            className="px-3 py-1 border border-gray-300 rounded text-sm"
            value={selectedCategory}
            onChange={(e) => {}} // Would update parent component
          >
            <option value="all">All Situations</option>
            <option value="pitcher">vs Pitcher Type</option>
            <option value="count">Count Situations</option>
            <option value="inning">By Inning</option>
            <option value="baserunner">Base Situations</option>
            <option value="stadium">Stadium Effects</option>
          </select>
          <select 
            className="px-3 py-1 border border-gray-300 rounded text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'value' | 'games')}
          >
            <option value="value">Sort by Performance</option>
            <option value="games">Sort by Sample Size</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Heatmap */}
        <div className="xl:col-span-3">
          <div className="space-y-6">
            {Object.entries(groupedData).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold text-gray-800">{categoryLabels[category as keyof typeof categoryLabels]}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.situation}-${index}`}
                      className="relative p-3 rounded-lg border cursor-pointer min-h-[80px] flex flex-col justify-center"
                      style={{ 
                        backgroundColor: getHeatmapColor(item.value, item.games),
                        borderColor: hoveredCell === item ? '#3b82f6' : '#e5e7eb',
                        borderWidth: hoveredCell === item ? '2px' : '1px'
                      }}
                      onMouseEnter={() => setHoveredCell(item)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => onCellClick?.(item)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-center">
                        <div 
                          className="text-xs font-medium mb-1 truncate"
                          style={{ color: getTextColor(item.value) }}
                        >
                          {item.situation}
                        </div>
                        <div 
                          className="text-lg font-bold"
                          style={{ color: getTextColor(item.value) }}
                        >
                          {formatValue(item.value)}
                        </div>
                        <div 
                          className="text-xs opacity-75"
                          style={{ color: getTextColor(item.value) }}
                        >
                          {item.games} games
                        </div>
                      </div>
                      
                      {/* Sample size indicator */}
                      <div className="absolute top-1 right-1">
                        <div className={`w-2 h-2 rounded-full ${
                          item.games >= 10 ? 'bg-green-500' : 
                          item.games >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Hover Tooltip */}
          {hoveredCell && (
            <motion.div
              className="fixed bg-gray-900 text-white p-3 rounded shadow-lg text-sm z-50 pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -120%)'
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="font-semibold">{hoveredCell.situation}</div>
              <div className="text-gray-300 text-xs mb-2">{categoryLabels[hoveredCell.category]}</div>
              <div className="space-y-1">
                <div>{statType}: <span className="font-semibold">{formatValue(hoveredCell.value)}</span></div>
                <div>Sample Size: <span className="font-semibold">{hoveredCell.games} games</span></div>
                <div>Performance Level: <span className="font-semibold">{getPerformanceLevel(hoveredCell.value)}</span></div>
                <div className="text-xs text-gray-400 mt-2">
                  vs League Average: {avgValue ? (((hoveredCell.value / avgValue - 1) * 100).toFixed(1)) : '0'}%
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          {/* Color Scale Legend */}
          <div>
            <h4 className="font-semibold mb-3">Performance Scale</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Excellent</span>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(0, 255, 0, 0.8)' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Good</span>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(128, 255, 0, 0.8)' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Average</span>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 0, 0.8)' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Below Avg</span>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 128, 0, 0.8)' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Poor</span>
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 0, 0, 0.8)' }} />
              </div>
            </div>
          </div>

          {/* Sample Size Legend */}
          <div>
            <h4 className="font-semibold mb-3">Sample Size</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>10+ games (Reliable)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>5-9 games (Moderate)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>&lt;5 games (Limited)</span>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div>
            <h4 className="font-semibold mb-3">Summary Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overall Average:</span>
                <span className="font-semibold">{formatValue(avgValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Best Situation:</span>
                <span className="font-semibold text-green-600">{formatValue(maxValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Worst Situation:</span>
                <span className="font-semibold text-red-600">{formatValue(minValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Range:</span>
                <span className="font-semibold">{formatValue(maxValue - minValue)}</span>
              </div>
            </div>
          </div>

          {/* Top/Bottom Performers */}
          <div>
            <h4 className="font-semibold mb-3">Top Situations</h4>
            <div className="space-y-2">
              {filteredData
                .filter(item => item.games >= 3) // Only show reliable data
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((item, index) => (
                  <div key={`top-${index}`} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{item.situation}</span>
                    <span className="font-semibold text-green-600">{formatValue(item.value)}</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Challenging Situations</h4>
            <div className="space-y-2">
              {filteredData
                .filter(item => item.games >= 3) // Only show reliable data
                .sort((a, b) => a.value - b.value)
                .slice(0, 3)
                .map((item, index) => (
                  <div key={`bottom-${index}`} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{item.situation}</span>
                    <span className="font-semibold text-red-600">{formatValue(item.value)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceHeatmap;
