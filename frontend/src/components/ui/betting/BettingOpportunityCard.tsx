import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Target, Zap, Star, ArrowRight } from 'lucide-react';

export interface BettingOpportunity {
  id: string;
  sport: string;
  league: string;
  game: string;
  market: string;
  selection: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  roi: number;
  timeToStart: string;
  bookmaker: string;
  tags?: string[];
  analysis?: string;
  isLive?: boolean;
  isPremium?: boolean;
}

export interface BettingOpportunityCardProps {
  opportunity: BettingOpportunity;
  onSelect?: (opportunity: BettingOpportunity) => void;
  className?: string;
  showAnalysis?: boolean;
  compact?: boolean;
}

export const BettingOpportunityCard: React.FC<BettingOpportunityCardProps> = ({
  opportunity,
  onSelect,
  className = '',
  showAnalysis = true,
  compact = false,
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400 bg-green-500/20';
    if (confidence >= 65) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-orange-400 bg-orange-500/20';
  };

  const getROIColor = (roi: number) => {
    if (roi >= 10) return 'text-green-400';
    if (roi >= 5) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      whileHover='hover'
      className={`
        bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden
        cursor-pointer hover:border-cyan-500/50 transition-all
        ${compact ? 'p-4' : 'p-6'}
        ${className}
      `}
      onClick={() => onSelect?.(opportunity)}
    >
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center space-x-2 mb-1'>
            <span className='text-xs font-medium text-cyan-400 uppercase tracking-wide'>
              {opportunity.sport} • {opportunity.league}
            </span>
            {opportunity.isLive && (
              <span className='flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium'>
                <div className='w-2 h-2 bg-red-400 rounded-full animate-pulse' />
                <span>LIVE</span>
              </span>
            )}
            {opportunity.isPremium && <Star className='w-4 h-4 text-yellow-400' />}
          </div>

          <h3 className='text-lg font-semibold text-white mb-1'>{opportunity.game}</h3>

          <div className='flex items-center space-x-2 text-sm text-gray-300'>
            <span className='font-medium'>{opportunity.market}:</span>
            <span className='text-white font-semibold'>{opportunity.selection}</span>
          </div>
        </div>

        <div className='text-right'>
          <div className='text-2xl font-bold text-white mb-1'>
            {opportunity.odds > 0 ? `+${opportunity.odds}` : opportunity.odds}
          </div>
          <div className='text-xs text-gray-400'>{opportunity.bookmaker}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className='grid grid-cols-3 gap-4 mb-4'>
        <div className='text-center'>
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(opportunity.confidence)}`}
          >
            <Target className='w-3 h-3 mr-1' />
            {opportunity.confidence}%
          </div>
          <div className='text-xs text-gray-400 mt-1'>Confidence</div>
        </div>

        <div className='text-center'>
          <div className={`text-sm font-bold ${getROIColor(opportunity.roi)}`}>
            {opportunity.roi > 0 ? '+' : ''}
            {opportunity.roi.toFixed(1)}%
          </div>
          <div className='text-xs text-gray-400'>ROI</div>
        </div>

        <div className='text-center'>
          <div className='text-sm font-bold text-purple-400'>
            {opportunity.expectedValue > 0 ? '+' : ''}
            {opportunity.expectedValue.toFixed(2)}
          </div>
          <div className='text-xs text-gray-400'>EV</div>
        </div>
      </div>

      {/* Time and Tags */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-1 text-xs text-gray-400'>
          <Clock className='w-3 h-3' />
          <span>{opportunity.timeToStart}</span>
        </div>

        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className='flex space-x-1'>
            {opportunity.tags.slice(0, 2).map(tag => (
              <span key={tag} className='px-2 py-1 bg-slate-700/50 text-gray-300 rounded text-xs'>
                {tag}
              </span>
            ))}
            {opportunity.tags.length > 2 && (
              <span className='px-2 py-1 bg-slate-700/50 text-gray-400 rounded text-xs'>
                +{opportunity.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Analysis */}
      {showAnalysis && opportunity.analysis && !compact && (
        <div className='border-t border-slate-700/50 pt-4'>
          <div className='flex items-start space-x-2'>
            <Zap className='w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0' />
            <p className='text-sm text-gray-300 leading-relaxed'>{opportunity.analysis}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className='mt-4 pt-4 border-t border-slate-700/50'>
        <button className='w-full flex items-center justify-center space-x-2 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg text-white font-medium transition-all'>
          <TrendingUp className='w-4 h-4' />
          <span>Place Bet</span>
          <ArrowRight className='w-4 h-4' />
        </button>
      </div>
    </motion.div>
  );
};

export default BettingOpportunityCard;
