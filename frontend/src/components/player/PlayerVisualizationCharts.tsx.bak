/**
 * PlayerVisualizationCharts - Advanced Chart.js components for player analytics
 * Provides comprehensive visualization for trends, performance, and comparisons
 */

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Activity, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useMemo } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GameLog {
  date: string;
  opponent: string;
  stats: {
    hits?: number;
    home_runs?: number;
    rbis?: number;
    batting_average?: number;
    ops?: number;
  };
}

interface PlayerVisualizationChartsProps {
  gameData: GameLog[];
  playerName: string;
  darkTheme?: boolean;
}

export const PlayerVisualizationCharts: React.FC<PlayerVisualizationChartsProps> = ({
  gameData,
  playerName,
  darkTheme = true,
}) => {
  // Chart theme configuration
  const chartTheme = useMemo(
    () => ({
      backgroundColor: darkTheme ? '#1e293b' : '#ffffff',
      gridColor: darkTheme ? '#334155' : '#e2e8f0',
      textColor: darkTheme ? '#cbd5e1' : '#374151',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      tertiaryColor: '#10b981',
      quaternaryColor: '#f59e0b',
    }),
    [darkTheme]
  );

  // Common chart options
  const commonOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: chartTheme.textColor,
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: chartTheme.backgroundColor,
          titleColor: chartTheme.textColor,
          bodyColor: chartTheme.textColor,
          borderColor: chartTheme.gridColor,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context: any) => {
              const gameIndex = context[0]?.dataIndex;
              if (gameIndex !== undefined && gameData[gameIndex]) {
                return `vs ${gameData[gameIndex].opponent} (${gameData[gameIndex].date})`;
              }
              return context[0]?.label || '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: chartTheme.gridColor,
          },
          ticks: {
            color: chartTheme.textColor,
          },
        },
        y: {
          grid: {
            color: chartTheme.gridColor,
          },
          ticks: {
            color: chartTheme.textColor,
          },
        },
      },
    }),
    [chartTheme, gameData]
  );

  // Performance Trends Line Chart Data
  const performanceTrendsData = useMemo(() => {
    const last10Games = gameData.slice(-10);

    return {
      labels: last10Games.map((_, index) => `Game ${index + 1}`),
      datasets: [
        {
          label: 'Hits',
          data: last10Games.map(game => game.stats.hits || 0),
          borderColor: chartTheme.primaryColor,
          backgroundColor: `${chartTheme.primaryColor}20`,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'Home Runs',
          data: last10Games.map(game => game.stats.home_runs || 0),
          borderColor: chartTheme.secondaryColor,
          backgroundColor: `${chartTheme.secondaryColor}20`,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'RBIs',
          data: last10Games.map(game => game.stats.rbis || 0),
          borderColor: chartTheme.tertiaryColor,
          backgroundColor: `${chartTheme.tertiaryColor}20`,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [gameData, chartTheme]);

  // Batting Average Trend Data
  const battingAverageTrendData = useMemo(() => {
    const last15Games = gameData.slice(-15);

    // Calculate rolling average
    const rollingAvg: number[] = [];
    const runningSum = 0;
    let runningHits = 0;
    let runningAtBats = 0;

    last15Games.forEach((game, index) => {
      runningHits += game.stats.hits || 0;
      runningAtBats += 4; // Assume 4 AB per game for calculation
      const avg = runningAtBats > 0 ? runningHits / runningAtBats : 0;
      rollingAvg.push(Number(avg.toFixed(3)));
    });

    return {
      labels: last15Games.map((_, index) => `Game ${index + 1}`),
      datasets: [
        {
          label: 'Batting Average',
          data: rollingAvg,
          borderColor: chartTheme.primaryColor,
          backgroundColor: `${chartTheme.primaryColor}15`,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Season Average',
          data: Array(last15Games.length).fill(0.285), // Mock season average
          borderColor: chartTheme.quaternaryColor,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0,
        },
      ],
    };
  }, [gameData, chartTheme]);

  // Opponent Performance Bar Chart Data
  const opponentPerformanceData = useMemo(() => {
    // Group by opponent and calculate averages
    const opponentStats: Record<string, { hits: number; hrs: number; games: number }> = {};

    gameData.forEach(game => {
      const opponent = game.opponent;
      if (!opponentStats[opponent]) {
        opponentStats[opponent] = { hits: 0, hrs: 0, games: 0 };
      }
      opponentStats[opponent].hits += game.stats.hits || 0;
      opponentStats[opponent].hrs += game.stats.home_runs || 0;
      opponentStats[opponent].games += 1;
    });

    const opponents = Object.keys(opponentStats).slice(0, 8); // Top 8 opponents
    const avgHits = opponents.map(opp =>
      opponentStats[opp].games > 0
        ? (opponentStats[opp].hits / opponentStats[opp].games).toFixed(1)
        : 0
    );
    const avgHRs = opponents.map(opp =>
      opponentStats[opp].games > 0
        ? (opponentStats[opp].hrs / opponentStats[opp].games).toFixed(1)
        : 0
    );

    return {
      labels: opponents,
      datasets: [
        {
          label: 'Avg Hits per Game',
          data: avgHits,
          backgroundColor: chartTheme.primaryColor,
          borderColor: chartTheme.primaryColor,
          borderWidth: 1,
        },
        {
          label: 'Avg Home Runs per Game',
          data: avgHRs,
          backgroundColor: chartTheme.secondaryColor,
          borderColor: chartTheme.secondaryColor,
          borderWidth: 1,
        },
      ],
    };
  }, [gameData, chartTheme]);

  // Player Strengths Radar Chart Data
  const playerStrengthsData = useMemo(() => {
    // Calculate averages for radar chart
    const totalGames = gameData.length || 1;
    const totals = gameData.reduce(
      (acc, game) => ({
        hits: acc.hits + (game.stats.hits || 0),
        hrs: acc.hrs + (game.stats.home_runs || 0),
        rbis: acc.rbis + (game.stats.rbis || 0),
        avg: acc.avg + (game.stats.batting_average || 0),
        ops: acc.ops + (game.stats.ops || 0),
      }),
      { hits: 0, hrs: 0, rbis: 0, avg: 0, ops: 0 }
    );

    // Normalize to 0-100 scale for radar
    const normalize = (value: number, max: number) => Math.min((value / max) * 100, 100);

    return {
      labels: ['Power', 'Contact', 'Plate Discipline', 'Clutch', 'Consistency'],
      datasets: [
        {
          label: `${playerName} Profile`,
          data: [
            normalize(totals.hrs / totalGames, 1.2), // Power (normalized for ~1.2 HR/game max)
            normalize(totals.hits / totalGames, 4), // Contact (normalized for 4 hits/game max)
            normalize(totals.ops / totalGames, 1.2), // Plate Discipline (OPS normalized)
            85, // Mock clutch rating
            78, // Mock consistency rating
          ],
          backgroundColor: `${chartTheme.primaryColor}30`,
          borderColor: chartTheme.primaryColor,
          borderWidth: 2,
          pointBackgroundColor: chartTheme.primaryColor,
          pointBorderColor: '#fff',
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: 'League Average',
          data: [50, 50, 50, 50, 50], // League average baseline
          backgroundColor: `${chartTheme.gridColor}20`,
          borderColor: chartTheme.gridColor,
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
        },
      ],
    };
  }, [gameData, playerName, chartTheme]);

  const radarOptions = {
    ...commonOptions,
    scales: {
      r: {
        angleLines: {
          color: chartTheme.gridColor,
        },
        grid: {
          color: chartTheme.gridColor,
        },
        pointLabels: {
          color: chartTheme.textColor,
          font: {
            size: 12,
          },
        },
        ticks: {
          color: chartTheme.textColor,
          backdropColor: 'transparent',
          showLabelBackdrop: false,
        },
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* Performance Trends Line Chart */}
      <div className='bg-slate-800 rounded-xl p-6 shadow-lg'>
        <div className='flex items-center space-x-2 mb-6'>
          <Activity className='text-blue-400' size={20} />
          <h3 className='text-lg font-semibold text-white'>Recent Performance Trends</h3>
        </div>
        <div className='h-64'>
          <Line data={performanceTrendsData} options={commonOptions} />
        </div>
        <p className='text-slate-400 text-sm mt-3'>
          Last 10 games showing hits, home runs, and RBIs per game
        </p>
      </div>

      {/* Batting Average Trend */}
      <div className='bg-slate-800 rounded-xl p-6 shadow-lg'>
        <div className='flex items-center space-x-2 mb-6'>
          <TrendingUp className='text-green-400' size={20} />
          <h3 className='text-lg font-semibold text-white'>Batting Average Trend</h3>
        </div>
        <div className='h-64'>
          <Line data={battingAverageTrendData} options={commonOptions} />
        </div>
        <p className='text-slate-400 text-sm mt-3'>
          Rolling batting average vs season average over last 15 games
        </p>
      </div>

      {/* Opponent Performance */}
      <div className='bg-slate-800 rounded-xl p-6 shadow-lg'>
        <div className='flex items-center space-x-2 mb-6'>
          <Target className='text-purple-400' size={20} />
          <h3 className='text-lg font-semibold text-white'>Performance by Opponent</h3>
        </div>
        <div className='h-64'>
          <Bar
            data={opponentPerformanceData}
            options={{
              ...commonOptions,
              scales: {
                ...commonOptions.scales,
                y: {
                  ...commonOptions.scales.y,
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
        <p className='text-slate-400 text-sm mt-3'>
          Average performance against different opponents
        </p>
      </div>

      {/* Player Strengths Radar */}
      <div className='bg-slate-800 rounded-xl p-6 shadow-lg'>
        <div className='flex items-center space-x-2 mb-6'>
          <Zap className='text-yellow-400' size={20} />
          <h3 className='text-lg font-semibold text-white'>Player Profile</h3>
        </div>
        <div className='h-64'>
          <Radar data={playerStrengthsData} options={radarOptions} />
        </div>
        <p className='text-slate-400 text-sm mt-3'>
          Strengths profile compared to league average (0-100 scale)
        </p>
      </div>
    </div>
  );
};

export default PlayerVisualizationCharts;
