import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface HitData {
  id: string;
  x: number; // Field position X (-1 to 1, where 0 is center field)
  y: number; // Field position Y (0 to 1, where 0 is home plate, 1 is fence)
  hitType: 'single' | 'double' | 'triple' | 'homerun' | 'out';
  exitVelocity: number;
  launchAngle: number;
  date: string;
  outcome: string;
  distance?: number;
}

interface SprayChartProps {
  playerName: string;
  hitData: HitData[];
  timeRange: 'L5' | 'L10' | 'L15' | 'L20' | 'L25' | 'season' | 'career';
  pitcherHand?: 'L' | 'R' | 'both';
  onHitSelect?: (hit: HitData) => void;
}

const SprayChartVisualization: React.FC<SprayChartProps> = ({
  playerName,
  hitData,
  timeRange,
  pitcherHand = 'both',
  onHitSelect
}) => {
  const [selectedHitType, setSelectedHitType] = useState<string | null>(null);
  const [hoveredHit, setHoveredHit] = useState<HitData | null>(null);

  const filteredData = useMemo(() => {
    return hitData.filter(hit => {
      if (pitcherHand !== 'both') {
        // In a real implementation, this would filter by pitcher handedness
        return true;
      }
      return true;
    });
  }, [hitData, pitcherHand]);

  const getHitColor = (hitType: string) => {
    switch (hitType) {
      case 'homerun': return '#ef4444'; // red
      case 'triple': return '#f59e0b'; // amber
      case 'double': return '#3b82f6'; // blue
      case 'single': return '#10b981'; // emerald
      case 'out': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  const getHitSize = (hitType: string, exitVelocity: number) => {
    const baseSize = hitType === 'homerun' ? 8 : hitType === 'triple' ? 7 : hitType === 'double' ? 6 : 5;
    const velocityMultiplier = Math.max(0.5, Math.min(1.5, exitVelocity / 95));
    return baseSize * velocityMultiplier;
  };

  // Convert field coordinates to SVG coordinates
  const fieldToSVG = (x: number, y: number) => {
    const fieldWidth = 400;
    const fieldHeight = 300;
    
    // Convert field coordinates (-1 to 1 for x, 0 to 1 for y) to SVG coordinates
    const svgX = (x + 1) * (fieldWidth / 2);
    const svgY = fieldHeight - (y * fieldHeight * 0.8) - 40; // Leave space at bottom for home plate
    
    return { x: svgX, y: svgY };
  };

  const sprayStats = useMemo(() => {
    const hits = filteredData.filter(hit => hit.hitType !== 'out');
    const pullSide = hits.filter(hit => hit.x < -0.2);
    const center = hits.filter(hit => hit.x >= -0.2 && hit.x <= 0.2);
    const opposite = hits.filter(hit => hit.x > 0.2);
    
    return {
      pullPercentage: hits.length > 0 ? ((pullSide.length / hits.length) * 100).toFixed(1) : '0',
      centerPercentage: hits.length > 0 ? ((center.length / hits.length) * 100).toFixed(1) : '0',
      oppositePercentage: hits.length > 0 ? ((opposite.length / hits.length) * 100).toFixed(1) : '0',
      avgExitVelocity: hits.length > 0 ? (hits.reduce((sum, hit) => sum + hit.exitVelocity, 0) / hits.length).toFixed(1) : '0',
      avgLaunchAngle: hits.length > 0 ? (hits.reduce((sum, hit) => sum + hit.launchAngle, 0) / hits.length).toFixed(1) : '0'
    };
  }, [filteredData]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{playerName} Spray Chart</h3>
          <p className="text-sm text-gray-600">
            {timeRange === 'season' ? 'Full Season' : timeRange === 'career' ? 'Career' : `Last ${timeRange.slice(1)} Games`}
            {pitcherHand !== 'both' && ` vs ${pitcherHand}HP`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            className="px-3 py-1 border border-gray-300 rounded text-sm"
            value={pitcherHand}
            onChange={(e) => {}} // Would update parent component
          >
            <option value="both">vs All Pitchers</option>
            <option value="L">vs LHP</option>
            <option value="R">vs RHP</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spray Chart */}
        <div className="lg:col-span-2">
          <div className="relative">
            <svg 
              width="100%" 
              height="350" 
              viewBox="0 0 400 350" 
              className="border border-gray-200 rounded-lg bg-green-50"
            >
              {/* Field Background */}
              <defs>
                <radialGradient id="fieldGradient" cx="50%" cy="100%" r="60%">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0.05" />
                </radialGradient>
              </defs>
              
              {/* Infield */}
              <path
                d="M 200 310 Q 100 250 50 150 Q 100 50 200 50 Q 300 50 350 150 Q 300 250 200 310 Z"
                fill="url(#fieldGradient)"
                stroke="#16a34a"
                strokeWidth="2"
                opacity="0.3"
              />
              
              {/* Foul Lines */}
              <line x1="200" y1="310" x2="50" y2="150" stroke="#16a34a" strokeWidth="2" />
              <line x1="200" y1="310" x2="350" y2="150" stroke="#16a34a" strokeWidth="2" />
              
              {/* Field Zones */}
              <path
                d="M 200 310 Q 130 270 80 200"
                fill="none"
                stroke="#16a34a"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.5"
              />
              <path
                d="M 200 310 Q 270 270 320 200"
                fill="none"
                stroke="#16a34a"
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.5"
              />
              
              {/* Home Plate */}
              <circle cx="200" cy="310" r="5" fill="#8b5cf6" />
              
              {/* Hit Data Points */}
              {filteredData.map((hit, index) => {
                const { x: svgX, y: svgY } = fieldToSVG(hit.x, hit.y);
                const size = getHitSize(hit.hitType, hit.exitVelocity);
                const color = getHitColor(hit.hitType);
                const isSelected = selectedHitType === hit.hitType || selectedHitType === null;
                const opacity = isSelected ? 0.8 : 0.3;
                
                return (
                  <motion.circle
                    key={hit.id}
                    cx={svgX}
                    cy={svgY}
                    r={size}
                    fill={color}
                    opacity={opacity}
                    stroke="white"
                    strokeWidth="1"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredHit(hit)}
                    onMouseLeave={() => setHoveredHit(null)}
                    onClick={() => onHitSelect?.(hit)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    whileHover={{ scale: 1.5, strokeWidth: 2 }}
                  />
                );
              })}
              
              {/* Zone Labels */}
              <text x="100" y="100" textAnchor="middle" className="text-xs fill-green-700" opacity="0.7">
                Pull Side
              </text>
              <text x="200" y="80" textAnchor="middle" className="text-xs fill-green-700" opacity="0.7">
                Center
              </text>
              <text x="300" y="100" textAnchor="middle" className="text-xs fill-green-700" opacity="0.7">
                Opposite
              </text>
            </svg>
            
            {/* Hover Tooltip */}
            {hoveredHit && (
              <motion.div
                className="absolute bg-gray-900 text-white p-2 rounded shadow-lg text-sm z-10 pointer-events-none"
                style={{
                  left: fieldToSVG(hoveredHit.x, hoveredHit.y).x,
                  top: fieldToSVG(hoveredHit.x, hoveredHit.y).y - 60
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="font-semibold">{hoveredHit.outcome}</div>
                <div className="text-xs text-gray-300">
                  {hoveredHit.exitVelocity} mph, {hoveredHit.launchAngle}°
                </div>
                {hoveredHit.distance && (
                  <div className="text-xs text-gray-300">{hoveredHit.distance} ft</div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Legend and Stats */}
        <div className="space-y-6">
          {/* Hit Type Legend */}
          <div>
            <h4 className="font-semibold mb-3">Hit Types</h4>
            <div className="space-y-2">
              {[
                { type: 'homerun', label: 'Home Run', count: filteredData.filter(h => h.hitType === 'homerun').length },
                { type: 'triple', label: 'Triple', count: filteredData.filter(h => h.hitType === 'triple').length },
                { type: 'double', label: 'Double', count: filteredData.filter(h => h.hitType === 'double').length },
                { type: 'single', label: 'Single', count: filteredData.filter(h => h.hitType === 'single').length },
                { type: 'out', label: 'Out', count: filteredData.filter(h => h.hitType === 'out').length }
              ].map(({ type, label, count }) => (
                <div
                  key={type}
                  className={`flex items-center space-x-2 cursor-pointer p-2 rounded ${
                    selectedHitType === type ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedHitType(selectedHitType === type ? null : type)}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getHitColor(type) }}
                  />
                  <span className="text-sm flex-1">{label}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spray Stats */}
          <div>
            <h4 className="font-semibold mb-3">Spray Distribution</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pull Side:</span>
                <span className="font-semibold">{sprayStats.pullPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Center:</span>
                <span className="font-semibold">{sprayStats.centerPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Opposite:</span>
                <span className="font-semibold">{sprayStats.oppositePercentage}%</span>
              </div>
            </div>
          </div>

          {/* Advanced Stats */}
          <div>
            <h4 className="font-semibold mb-3">Advanced Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Exit Velocity:</span>
                <span className="font-semibold">{sprayStats.avgExitVelocity} mph</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Launch Angle:</span>
                <span className="font-semibold">{sprayStats.avgLaunchAngle}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hard Hit %:</span>
                <span className="font-semibold">
                  {filteredData.length > 0 
                    ? ((filteredData.filter(h => h.exitVelocity >= 95).length / filteredData.length) * 100).toFixed(1)
                    : '0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprayChartVisualization;
