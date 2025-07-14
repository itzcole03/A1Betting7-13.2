import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MarketOdds {
  provider: string;
  odds: number;
  lastUpdated: Date;
}

export interface OpportunityMetrics {
  expectedValue: number;
  kellyPercentage: number;
  confidence: number;
  profitPotential: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MarketOpportunity {
  id: string;
  title: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  marketType: string;
  recommendedBet: string;
  odds: MarketOdds[];
  bestOdds: number;
  averageOdds: number;
  metrics: OpportunityMetrics;
  matchTime: Date;
  expiresAt: Date;
  tags: string[];
}

export interface MarketOpportunityCardProps {
  opportunity: MarketOpportunity;
  variant?: 'default' | 'cyber' | 'compact' | 'detailed';
  className?: string;
  showMetrics?: boolean;
  showOddsComparison?: boolean;
  showCountdown?: boolean;
  onBetClick?: (opportunity: MarketOpportunity) => void;
  onAnalyzeClick?: (opportunity: MarketOpportunity) => void;
  onFavoriteClick?: (opportunity: MarketOpportunity) => void;
  isFavorited?: boolean;
  isLoading?: boolean;
}

export const MarketOpportunityCard: React.FC<MarketOpportunityCardProps> = ({
  opportunity,
  variant = 'default',
  className = '',
  showMetrics = true,
  showOddsComparison = false,
  showCountdown = true,
  onBetClick,
  onAnalyzeClick,
  onFavoriteClick,
  isFavorited = false,
  isLoading = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(opportunity.expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [opportunity.expiresAt]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return variant === 'cyber' ? '#00ff88' : '#10b981';
      case 'medium':
        return variant === 'cyber' ? '#ffaa00' : '#f59e0b';
      case 'high':
        return variant === 'cyber' ? '#ff0044' : '#ef4444';
      default:
        return variant === 'cyber' ? '#666' : '#6b7280';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return variant === 'cyber' ? '#00ff88' : '#10b981';
    if (confidence >= 60) return variant === 'cyber' ? '#ffaa00' : '#f59e0b';
    return variant === 'cyber' ? '#ff0044' : '#ef4444';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  const baseClasses = `
    rounded-lg border transition-all duration-200 overflow-hidden
    ${
      variant === 'cyber'
        ? `bg-black border-cyan-400/30 ${isHovered ? 'shadow-lg shadow-cyan-400/20 border-cyan-400/50' : ''}`
        : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
            isHovered ? 'shadow-lg border-gray-300 dark:border-gray-600' : ''
          }`
    }
    ${isExpired ? 'opacity-60' : ''}
    ${className}
  `;

  return (
    <motion.div
      className={baseClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      layout
    >
      {/* Cyber grid overlay */}
      {variant === 'cyber' && (
        <div className='absolute inset-0 opacity-10 pointer-events-none'>
          <div className='grid grid-cols-8 grid-rows-6 h-full w-full'>
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className='border border-cyan-400/20' />
            ))}
          </div>
        </div>
      )}

      <div className='relative z-10 p-4'>
        {/* Header */}
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1'>
            <div className='flex items-center space-x-2 mb-1'>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  variant === 'cyber'
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {opportunity.sport}
              </span>
              <span
                className={`text-xs ${variant === 'cyber' ? 'text-cyan-300/70' : 'text-gray-500'}`}
              >
                {opportunity.league}
              </span>
            </div>

            <h3
              className={`font-semibold text-sm mb-1 ${
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
              }`}
            >
              {opportunity.homeTeam} vs {opportunity.awayTeam}
            </h3>

            <p
              className={`text-xs ${
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {opportunity.marketType}: {opportunity.recommendedBet}
            </p>
          </div>

          <div className='flex items-center space-x-2'>
            {/* Favorite Button */}
            <button
              onClick={() => onFavoriteClick?.(opportunity)}
              className={`p-1 rounded transition-colors ${
                isFavorited
                  ? variant === 'cyber'
                    ? 'text-cyan-400'
                    : 'text-yellow-500'
                  : variant === 'cyber'
                    ? 'text-cyan-300/50 hover:text-cyan-400'
                    : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <svg
                className='w-4 h-4'
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                />
              </svg>
            </button>

            {/* Countdown */}
            {showCountdown && (
              <div
                className={`text-xs font-mono px-2 py-1 rounded ${
                  isExpired
                    ? variant === 'cyber'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : variant === 'cyber'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {timeRemaining}
              </div>
            )}
          </div>
        </div>

        {/* Best Odds Display */}
        <div className='mb-3'>
          <div className='flex items-center justify-between'>
            <span
              className={`text-xs font-medium ${
                variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Best Odds
            </span>
            <div className='flex items-center space-x-2'>
              <span
                className={`text-2xl font-bold ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {formatOdds(opportunity.bestOdds)}
              </span>
              <span
                className={`text-xs ${variant === 'cyber' ? 'text-cyan-300/70' : 'text-gray-500'}`}
              >
                vs {formatOdds(opportunity.averageOdds)} avg
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {showMetrics && (
          <div className='grid grid-cols-2 gap-3 mb-3'>
            <div
              className={`p-2 rounded ${
                variant === 'cyber'
                  ? 'bg-gray-900/50 border border-cyan-400/20'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Expected Value
              </div>
              <div
                className={`text-lg font-bold ${
                  opportunity.metrics.expectedValue > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {opportunity.metrics.expectedValue > 0 ? '+' : ''}
                {opportunity.metrics.expectedValue.toFixed(1)}%
              </div>
            </div>

            <div
              className={`p-2 rounded ${
                variant === 'cyber'
                  ? 'bg-gray-900/50 border border-cyan-400/20'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Confidence
              </div>
              <div className='flex items-center space-x-2'>
                <span
                  className={`text-lg font-bold`}
                  style={{ color: getConfidenceColor(opportunity.metrics.confidence) }}
                >
                  {opportunity.metrics.confidence}%
                </span>
                <div
                  className={`w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 ${
                    variant === 'cyber' ? 'bg-gray-800' : ''
                  }`}
                >
                  <div
                    className='h-2 rounded-full transition-all duration-500'
                    style={{
                      width: `${opportunity.metrics.confidence}%`,
                      backgroundColor: getConfidenceColor(opportunity.metrics.confidence),
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-2 rounded ${
                variant === 'cyber'
                  ? 'bg-gray-900/50 border border-cyan-400/20'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Kelly %
              </div>
              <div
                className={`text-lg font-bold ${
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                {opportunity.metrics.kellyPercentage.toFixed(1)}%
              </div>
            </div>

            <div
              className={`p-2 rounded ${
                variant === 'cyber'
                  ? 'bg-gray-900/50 border border-cyan-400/20'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Risk Level
              </div>
              <div className='flex items-center space-x-2'>
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: getRiskColor(opportunity.metrics.riskLevel) }}
                />
                <span
                  className={`text-sm font-medium capitalize ${
                    variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {opportunity.metrics.riskLevel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Odds Comparison */}
        {showOddsComparison && opportunity.odds.length > 1 && (
          <div className='mb-3'>
            <h4
              className={`text-xs font-medium mb-2 ${
                variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Odds Comparison
            </h4>
            <div className='space-y-1'>
              {opportunity.odds.slice(0, 3).map((odds, index) => (
                <div key={index} className='flex justify-between items-center'>
                  <span
                    className={`text-xs ${
                      variant === 'cyber' ? 'text-cyan-300/70' : 'text-gray-500'
                    }`}
                  >
                    {odds.provider}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      odds.odds === opportunity.bestOdds
                        ? 'text-green-500 font-bold'
                        : variant === 'cyber'
                          ? 'text-cyan-300'
                          : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatOdds(odds.odds)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {opportunity.tags.length > 0 && (
          <div className='flex flex-wrap gap-1 mb-3'>
            {opportunity.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-1 rounded-full ${
                  variant === 'cyber'
                    ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {tag}
              </span>
            ))}
            {opportunity.tags.length > 3 && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                }`}
              >
                +{opportunity.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex space-x-2'>
          <motion.button
            onClick={() => onBetClick?.(opportunity)}
            disabled={isExpired || isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${
              variant === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {variant === 'cyber' ? 'PLACE BET' : 'Place Bet'}
          </motion.button>

          <motion.button
            onClick={() => onAnalyzeClick?.(opportunity)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              variant === 'cyber'
                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {variant === 'cyber' ? 'ANALYZE' : 'Analyze'}
          </motion.button>
        </div>

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg'
            >
              <div
                className={`animate-spin rounded-full h-6 w-6 border-2 border-transparent ${
                  variant === 'cyber' ? 'border-t-cyan-400' : 'border-t-blue-500'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
