import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { discoverBackend } from '../services/backendDiscovery';

interface BestBet {
  id: string;
  player_name: string;
  sport: string;
  stat_type: string;
  line: number;
  recommendation: 'OVER' | 'UNDER';
  confidence: number;
  reasoning: string;
  expected_value: number;
}

interface BestBetsDisplayProps {
  // Define any props this component might need from its parent
}

const BestBetsDisplay: React.FC<BestBetsDisplayProps> = () => {
  const [bestBets, setBestBets] = useState<BestBet[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh best bets on component mount
  useEffect(() => {
    fetchBestBets();
    // Set up auto-refresh every 30 minutes
    const interval = setInterval(fetchBestBets, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBestBets = async () => {
    setIsRefreshing(true);
    try {
      const backendUrl = (await Promise.race([
        discoverBackend(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Discovery timeout')), 3000)),
      ])) as string;

      const response = await fetch(`${backendUrl}/api/prizepicks/props?min_confidence=70`, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        const bets = Array.isArray(data) ? data : Array.isArray(data.props) ? data.props : [];
        const sortedBets = bets.sort(
          (a: BestBet, b: BestBet) => (b.confidence || 0) - (a.confidence || 0)
        );
        setBestBets(sortedBets);
        setLastRefresh(new Date());
      } else {
        console.log('Failed to fetch best bets:', response.status);
        setBestBets([]);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.log('Error fetching best bets:', error);
      setBestBets([]);
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className='w-2/5 flex flex-col bg-gray-900/30'>
      {/* Sidebar Header */}
      <div className='p-6 border-b border-cyan-400/30 bg-gradient-to-r from-green-900/50 to-blue-900/50'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-bold text-green-300'>🏆 Today's Best Bets</h2>
            <p className='text-sm text-green-400/70'>Top 12 AI-Powered Recommendations</p>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={fetchBestBets}
              disabled={isRefreshing}
              className='px-3 py-1 rounded-lg bg-green-400/10 border border-green-400/30 text-green-400 hover:bg-green-400/20 transition-all text-sm disabled:opacity-50'
            >
              {isRefreshing ? '🔄' : '↻'} Refresh
            </button>
            <div className='text-xs text-green-400/70'>
              Updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
      {/* Best Bets List */}
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {bestBets.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-4xl mb-4'>🎯</div>
            <p className='text-cyan-400/70 mb-4'>Loading today's best bets...</p>
            <button
              onClick={fetchBestBets}
              className='px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20 transition-all'
              aria-label='Load Best Bets'
            >
              Load Best Bets
            </button>
          </div>
        ) : (
          bestBets.map((bet, index) => <BestBetCard key={bet.id} bet={bet} index={index} />)
        )}
      </div>
    </div>
  );
};

export default BestBetsDisplay;

interface BestBetCardProps {
  bet: BestBet;
  index: number;
}

const BestBetCard: React.FC<BestBetCardProps> = ({ bet, index }) => {
  const [expanded, setExpanded] = React.useState(false);
  const confidenceColor =
    bet.confidence >= 80
      ? 'bg-green-400 text-green-900'
      : bet.confidence >= 65
      ? 'bg-yellow-400 text-yellow-900'
      : 'bg-red-400 text-red-100';
  const barColor =
    bet.confidence >= 80 ? 'bg-green-400' : bet.confidence >= 65 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className='p-4 rounded-lg bg-gray-800/50 border border-cyan-400/20 hover:border-cyan-400/40 transition-all shadow-md'
      aria-label={`Best bet for ${bet.player_name} - ${bet.stat_type}`}
    >
      <div className='flex items-center justify-between mb-2'>
        <div className='text-lg font-bold text-cyan-200' style={{ fontSize: '1.1rem' }}>
          {bet.player_name} <span className='text-cyan-400 font-normal'>({bet.sport})</span>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-bold ${confidenceColor}`}
          aria-label={`Confidence: ${bet.confidence}%`}
        >
          {bet.confidence}%
        </div>
      </div>
      <div className='flex items-center mb-2'>
        <span className='text-sm text-cyan-300 mr-2'>{bet.stat_type}:</span>
        <span className='text-cyan-100 font-semibold mr-2'>{bet.line}</span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            bet.recommendation === 'OVER'
              ? 'bg-green-400/20 text-green-400'
              : 'bg-red-400/20 text-red-400'
          }`}
          aria-label={`Recommendation: ${bet.recommendation}`}
        >
          {bet.recommendation}
        </span>
        <span className='ml-2 text-xs text-blue-300'>EV: {bet.expected_value}</span>
      </div>
      {/* Confidence Bar */}
      <div className='w-full h-2 rounded bg-cyan-900/30 mb-2' aria-hidden='true'>
        <div
          className={`${barColor} h-2 rounded`}
          style={{ width: `${bet.confidence}%`, transition: 'width 0.4s' }}
        ></div>
      </div>
      {/* Expandable Reasoning */}
      <button
        className='mt-2 text-xs text-cyan-400 underline focus:outline-none focus:ring-2 focus:ring-cyan-400/50'
        onClick={() => setExpanded(v => !v)}
        aria-expanded={!!expanded}
        aria-controls={`reasoning-${bet.id}`}
      >
        {expanded ? 'Hide Explanation' : 'Show Explanation'}
      </button>
      {expanded && (
        <div
          id={`reasoning-${bet.id}`}
          className='mt-2 p-2 rounded bg-cyan-900/30 text-cyan-100 text-sm shadow-inner'
          style={{ fontSize: '1rem' }}
        >
          {bet.reasoning}
        </div>
      )}
    </motion.div>
  );
}; 