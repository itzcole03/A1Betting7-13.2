import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LineMovementData {
  timeline: string[];
  lines: number[];
  movementMagnitude: number;
  direction: string;
  snapshotCount: number;
}

interface LineAlertConfig {
  user_id: string;
  sport: string;
  player: string;
  market: string;
  book: string;
  delta: number;
  ev: number;
}

interface LineMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: string;
  sport: string;
  market: string;
  book: string;
}

const LineMovementModal: React.FC<LineMovementModalProps> = ({
  isOpen,
  onClose,
  player,
  sport,
  market,
  book
}) => {
  const [movementData, setMovementData] = useState<LineMovementData | null>(null);
  const [alertConfig, setAlertConfig] = useState<LineAlertConfig>({
    user_id: 'user123', // TODO: Get from auth context
    sport,
    player,
    market,
    book,
    delta: 0.5,
    ev: 2.0
  });
  const [loading, setLoading] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMovementData();
    }
  }, [isOpen, sport, player, market, book]);

  const fetchMovementData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport,
        player,
        market,
        book
      });
      
      const response = await fetch(`/api/line-movement/movement?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMovementData(data);
      }
    } catch (error) {
      // Handle fetch error silently
    } finally {
      setLoading(false);
    }
  };

  const saveAlert = async () => {
    try {
      const response = await fetch('/api/line-movement/alerts/line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertConfig)
      });
      
      if (response.ok) {
        setAlertSaved(true);
        setTimeout(() => setAlertSaved(false), 3000);
      }
    } catch {
      // Handle save error silently
    }
  };

  const renderSparkline = () => {
    if (!movementData || movementData.lines.length === 0) {
      return (
        <div className="w-full h-24 flex items-center justify-center bg-gray-800 rounded">
          <span className="text-gray-400">No movement data</span>
        </div>
      );
    }

    const { lines } = movementData;
    const minValue = Math.min(...lines);
    const maxValue = Math.max(...lines);
    const range = maxValue - minValue || 1;
    
    // Create points for sparkline
    const points = lines.map((value, index) => {
      const x = (index / (lines.length - 1)) * 100;
      const y = 100 - ((value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="w-full h-24 bg-gray-800 rounded p-2">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke={movementData.direction === 'up' ? '#10b981' : movementData.direction === 'down' ? '#ef4444' : '#6b7280'}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          {/* Data points */}
          {lines.map((value, index) => {
            const x = (index / (lines.length - 1)) * 100;
            const y = 100 - ((value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={movementData.direction === 'up' ? '#10b981' : movementData.direction === 'down' ? '#ef4444' : '#6b7280'}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const getMovementIcon = () => {
    if (!movementData) return <Minus className="w-4 h-4" />;
    
    switch (movementData.direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-lg mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Line Movement</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Player Info */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <div className="text-lg font-medium text-white">{player}</div>
          <div className="text-sm text-gray-400">
            {sport} • {market} • {book}
          </div>
        </div>

        {/* Movement Data */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Sparkline Chart */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Line History</h4>
              {renderSparkline()}
            </div>

            {/* Movement Stats */}
            {movementData && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    {getMovementIcon()}
                  </div>
                  <div className="text-xs text-gray-400">Direction</div>
                  <div className="text-sm font-medium text-white capitalize">
                    {movementData.direction}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">Magnitude</div>
                  <div className="text-sm font-medium text-white">
                    {movementData.movementMagnitude > 0 ? '+' : ''}{movementData.movementMagnitude.toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">Snapshots</div>
                  <div className="text-sm font-medium text-white">
                    {movementData.snapshotCount}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Alert Configuration */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Set Alert</h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Line Change Threshold</label>
              <input
                type="number"
                step="0.1"
                value={alertConfig.delta}
                onChange={(e) => setAlertConfig({...alertConfig, delta: parseFloat(e.target.value) || 0})}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                placeholder="0.5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">EV Threshold</label>
              <input
                type="number"
                step="0.1"
                value={alertConfig.ev}
                onChange={(e) => setAlertConfig({...alertConfig, ev: parseFloat(e.target.value) || 0})}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                placeholder="2.0"
              />
            </div>
          </div>
          
          <button
            onClick={saveAlert}
            disabled={alertSaved}
            className={`w-full py-2 px-4 rounded font-medium transition-colors ${
              alertSaved 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {alertSaved ? '✓ Alert Saved!' : 'Save Alert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineMovementModal;