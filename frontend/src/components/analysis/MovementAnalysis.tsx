import { AlertTriangle, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { BookmakerOddsPoint, MultiBookOddsChart } from '../charts/MultiBookOddsChart';

export interface OddsSnapshot {
  prop_id: string;
  sportsbook: string;
  line: number;
  over_odds: number;
  under_odds: number;
  captured_at: string;
  timestamp?: string;
}

export interface MovementAnalysisData {
  prop_id: string;
  sportsbook: string;
  total_snapshots: number;
  date_range: {
    start: string;
    end: string;
  };
  snapshots: OddsSnapshot[];
}

export interface MovementAnalysisProps {
  data: MovementAnalysisData;
  title?: string;
  height?: number;
  showAlerts?: boolean;
  showSteamDetection?: boolean;
}

export interface MovementMetrics {
  totalMovement: number;
  averageMovement: number;
  maxMovement: number;
  movementDirection: 'up' | 'down' | 'stable';
  volatility: number;
  steamIndicators: SteamIndicator[];
  significantMoves: SignificantMove[];
}

export interface SteamIndicator {
  timestamp: string;
  bookmaker: string;
  oddsChange: number;
  confidence: number;
  reason: string;
}

export interface SignificantMove {
  timestamp: string;
  bookmaker: string;
  previousOdds: number;
  currentOdds: number;
  changePercent: number;
  direction: 'up' | 'down';
}

const calculateMovementMetrics = (snapshots: OddsSnapshot[]): MovementMetrics => {
  if (snapshots.length < 2) {
    return {
      totalMovement: 0,
      averageMovement: 0,
      maxMovement: 0,
      movementDirection: 'stable',
      volatility: 0,
      steamIndicators: [],
      significantMoves: [],
    };
  }

  // Sort by timestamp
  const sorted = [...snapshots].sort(
    (a, b) =>
      new Date(a.captured_at || a.timestamp || 0).getTime() -
      new Date(b.captured_at || b.timestamp || 0).getTime()
  );

  const movements: number[] = [];
  const significantMoves: SignificantMove[] = [];
  const steamIndicators: SteamIndicator[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Calculate movement for over_odds (can also do under_odds)
    const prevOdds = prev.over_odds;
    const currOdds = curr.over_odds;
    const change = currOdds - prevOdds;
    const changePercent = prevOdds !== 0 ? Math.abs(change / prevOdds) * 100 : 0;

    movements.push(Math.abs(change));

    // Detect significant moves (>5% change)
    if (changePercent > 5) {
      significantMoves.push({
        timestamp: curr.captured_at || curr.timestamp || '',
        bookmaker: curr.sportsbook,
        previousOdds: prevOdds,
        currentOdds: currOdds,
        changePercent,
        direction: change > 0 ? 'up' : 'down',
      });
    }

    // Steam detection: rapid movement against the market
    if (changePercent > 10 && i > 1) {
      const prevPrev = sorted[i - 2];
      const prevChange = prev.over_odds - prevPrev.over_odds;

      // If movement is in opposite direction of previous move, potential steam
      if ((change > 0 && prevChange < 0) || (change < 0 && prevChange > 0)) {
        steamIndicators.push({
          timestamp: curr.captured_at || curr.timestamp || '',
          bookmaker: curr.sportsbook,
          oddsChange: change,
          confidence: Math.min(changePercent / 20, 1) * 100, // Scale confidence
          reason: 'Rapid movement against recent trend',
        });
      }
    }
  }

  const totalMovement = movements.reduce((sum, move) => sum + move, 0);
  const averageMovement = movements.length > 0 ? totalMovement / movements.length : 0;
  const maxMovement = movements.length > 0 ? Math.max(...movements) : 0;

  // Determine overall direction
  const firstOdds = sorted[0].over_odds;
  const lastOdds = sorted[sorted.length - 1].over_odds;
  const netChange = lastOdds - firstOdds;
  const movementDirection =
    Math.abs(netChange) < averageMovement ? 'stable' : netChange > 0 ? 'up' : 'down';

  // Calculate volatility (standard deviation of movements)
  const variance =
    movements.reduce((sum, move) => sum + Math.pow(move - averageMovement, 2), 0) /
    movements.length;
  const volatility = Math.sqrt(variance);

  return {
    totalMovement,
    averageMovement,
    maxMovement,
    movementDirection,
    volatility,
    steamIndicators,
    significantMoves,
  };
};

export const MovementAnalysis: React.FC<MovementAnalysisProps> = ({
  data,
  title = 'Line Movement Analysis',
  height = 400,
  showAlerts = true,
  showSteamDetection = true,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '24h' | 'all'>('24h');

  // Convert backend data to chart format
  const chartData: BookmakerOddsPoint[] = useMemo(() => {
    return data.snapshots.map(snapshot => ({
      timestamp: snapshot.captured_at || snapshot.timestamp || '',
      bookmaker: snapshot.sportsbook,
      odds: snapshot.over_odds,
    }));
  }, [data.snapshots]);

  // Calculate movement metrics
  const metrics = useMemo(() => calculateMovementMetrics(data.snapshots), [data.snapshots]);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (selectedTimeframe === 'all') return chartData;

    const now = new Date();
    const hoursBack = selectedTimeframe === '1h' ? 1 : selectedTimeframe === '4h' ? 4 : 24;

    const cutoff = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    return chartData.filter(point => new Date(point.timestamp) >= cutoff);
  }, [chartData, selectedTimeframe]);

  const formatPercentage = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  const formatOdds = (value: number) => `${value > 0 ? '+' : ''}${value}`;

  return (
    <div className='w-full bg-white rounded-lg shadow-md border border-slate-100'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-slate-100'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-slate-900'>{title}</h3>
            <p className='text-sm text-slate-500'>
              {data.prop_id} • {data.total_snapshots} data points
            </p>
          </div>

          {/* Timeframe selector */}
          <div className='flex gap-2'>
            {(['1h', '4h', '24h', 'all'] as const).map(timeframe => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {timeframe === 'all' ? 'All' : timeframe}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movement Metrics */}
      <div className='px-6 py-4 border-b border-slate-100'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              {metrics.movementDirection === 'up' && (
                <TrendingUp className='w-4 h-4 text-green-500' />
              )}
              {metrics.movementDirection === 'down' && (
                <TrendingDown className='w-4 h-4 text-red-500' />
              )}
              <span className='text-sm font-medium text-slate-600'>Direction</span>
            </div>
            <span
              className={`text-lg font-bold ${
                metrics.movementDirection === 'up'
                  ? 'text-green-600'
                  : metrics.movementDirection === 'down'
                  ? 'text-red-600'
                  : 'text-slate-600'
              }`}
            >
              {metrics.movementDirection.toUpperCase()}
            </span>
          </div>

          <div className='text-center'>
            <div className='text-sm font-medium text-slate-600 mb-1'>Avg Movement</div>
            <span className='text-lg font-bold text-slate-900'>
              {formatOdds(metrics.averageMovement)}
            </span>
          </div>

          <div className='text-center'>
            <div className='text-sm font-medium text-slate-600 mb-1'>Max Movement</div>
            <span className='text-lg font-bold text-slate-900'>
              {formatOdds(metrics.maxMovement)}
            </span>
          </div>

          <div className='text-center'>
            <div className='text-sm font-medium text-slate-600 mb-1'>Volatility</div>
            <span className='text-lg font-bold text-slate-900'>
              {formatOdds(metrics.volatility)}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(showAlerts || showSteamDetection) && (
        <div className='px-6 py-4 border-b border-slate-100'>
          <div className='space-y-3'>
            {/* Significant Moves */}
            {showAlerts && metrics.significantMoves.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <AlertTriangle className='w-4 h-4 text-orange-500' />
                  <span className='text-sm font-medium text-slate-700'>Significant Moves</span>
                </div>
                <div className='space-y-1'>
                  {metrics.significantMoves.slice(0, 3).map((move, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between text-sm bg-orange-50 px-3 py-2 rounded'
                    >
                      <span className='text-slate-600'>
                        {move.bookmaker} • {new Date(move.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`font-medium ${
                          move.direction === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatPercentage(move.changePercent)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Steam Detection */}
            {showSteamDetection && metrics.steamIndicators.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <Zap className='w-4 h-4 text-purple-500' />
                  <span className='text-sm font-medium text-slate-700'>Steam Indicators</span>
                </div>
                <div className='space-y-1'>
                  {metrics.steamIndicators.slice(0, 2).map((steam, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between text-sm bg-purple-50 px-3 py-2 rounded'
                    >
                      <span className='text-slate-600'>
                        {steam.bookmaker} • {steam.reason}
                      </span>
                      <span className='font-medium text-purple-600'>
                        {steam.confidence.toFixed(0)}% confidence
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className='px-6 py-4'>
        <MultiBookOddsChart
          data={filteredData}
          title='Odds Movement Over Time'
          height={height}
          maxSeries={6}
        />
      </div>
    </div>
  );
};

export default MovementAnalysis;
