/**
 * BettingOpportunityCard - Displays a single betting opportunity with AI-enhanced metrics
 * 
 * @description A card component that shows betting opportunity details including confidence
 * scores, expected values, and risk assessments. Supports interactive selection and
 * real-time updates.
 * 
 * @example
 * ```tsx
 * <BettingOpportunityCard
 *   opportunity={opportunity}
 *   onSelect={handleOpportunitySelect}
 *   variant="expanded"
 *   className="mb-4"
 * />
 * ```
 */

import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  DollarSign,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BettingOpportunityCardProps, RiskLevel } from '../types';

// Standard color palette following coding standards
const BETTING_COLORS = {
  // Confidence levels
  high: 'text-green-400 bg-green-500/20 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', 
  low: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  
  // Risk levels
  safe: 'text-emerald-400',
  moderate: 'text-amber-400',
  risky: 'text-red-400',
  extreme: 'text-red-500',
  
  // AI/ML features
  ai: 'text-cyan-400 bg-cyan-500/20',
  
  // Status indicators
  live: 'text-green-400 animate-pulse',
} as const;

const BettingOpportunityCard: React.FC<BettingOpportunityCardProps> = ({
  opportunity,
  onSelect,
  onQuickBet,
  isSelected = false,
  isDisabled = false,
  variant = 'default',
  className
}) => {
  // Memoized calculations following performance standards
  const confidenceLevel = useMemo(() => {
    if (opportunity.confidence >= 85) return 'high';
    if (opportunity.confidence >= 70) return 'medium';
    return 'low';
  }, [opportunity.confidence]);

  const riskColor = useMemo(() => {
    switch (opportunity.riskLevel) {
      case 'low': return BETTING_COLORS.safe;
      case 'medium': return BETTING_COLORS.moderate;
      case 'high': return BETTING_COLORS.risky;
      case 'extreme': return BETTING_COLORS.extreme;
      default: return BETTING_COLORS.moderate;
    }
  }, [opportunity.riskLevel]);

  const expectedValueColor = useMemo(() => {
    if (opportunity.expectedValue > 10) return 'text-green-400';
    if (opportunity.expectedValue > 5) return 'text-yellow-400';
    if (opportunity.expectedValue > 0) return 'text-blue-400';
    return 'text-red-400';
  }, [opportunity.expectedValue]);

  // Event handlers following naming conventions
  const handleCardClick = useCallback(() => {
    if (isDisabled) return;
    onSelect(opportunity);
  }, [opportunity, onSelect, isDisabled]);

  const handleQuickBet = useCallback((e: React.MouseEvent, stake: number = 10) => {
    e.stopPropagation();
    if (isDisabled) return;
    onQuickBet(opportunity, stake);
  }, [opportunity, onQuickBet, isDisabled]);

  // Early return for error states
  if (!opportunity) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Invalid opportunity data</p>
      </div>
    );
  }

  const baseClasses = cn(
    'bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6',
    'hover:border-cyan-500/30 transition-all duration-200 cursor-pointer',
    'group relative overflow-hidden',
    isSelected && 'border-cyan-500/50 bg-cyan-500/10',
    isDisabled && 'opacity-50 cursor-not-allowed',
    variant === 'compact' && 'p-4',
    variant === 'expanded' && 'p-8',
    className
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={baseClasses}
      onClick={handleCardClick}
      data-testid={`betting-opportunity-${opportunity.id}`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-bold text-white">{opportunity.player}</h3>
            <span className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-300">
              {opportunity.sport}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {opportunity.team} vs {opportunity.opponent} • {opportunity.timeToGame}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">{opportunity.venue}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full" />
            <span className="text-xs text-gray-500">{opportunity.bookmaker}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {opportunity.odds > 0 ? '+' : ''}{opportunity.odds}
          </div>
          <div className="text-xs text-gray-400">
            {opportunity.impliedProbability.toFixed(1)}% implied
          </div>
        </div>
      </div>

      {/* Market Info */}
      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">Market</div>
            <div className="font-medium text-white">{opportunity.market}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Line</div>
            <div className="font-bold text-cyan-400">
              {opportunity.pick.toUpperCase()} {opportunity.line}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-cyan-400 mr-1" />
            <span className="text-xs text-gray-400">Confidence</span>
          </div>
          <div className={cn(
            'text-lg font-bold px-2 py-1 rounded',
            BETTING_COLORS[confidenceLevel]
          )}>
            {opportunity.confidence.toFixed(1)}%
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-xs text-gray-400">Expected Value</span>
          </div>
          <div className={cn('text-lg font-bold', expectedValueColor)}>
            +{opportunity.expectedValue.toFixed(1)}%
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-xs text-gray-400">Edge</span>
          </div>
          <div className="text-lg font-bold text-yellow-400">
            +{opportunity.edge.toFixed(1)}%
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Shield className="w-4 h-4 mr-1" style={{ color: riskColor }} />
            <span className="text-xs text-gray-400">Risk</span>
          </div>
          <div className={cn('text-sm font-medium capitalize', riskColor)}>
            {opportunity.riskLevel}
          </div>
        </div>
      </div>

      {/* AI Probability vs Market */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-700/30 rounded-lg">
        <div>
          <div className="text-xs text-gray-400 mb-1">AI Probability</div>
          <div className="text-lg font-bold text-cyan-400">
            {opportunity.aiProbability.toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center">
          {opportunity.aiProbability > opportunity.impliedProbability ? (
            <TrendingUp className="w-5 h-5 text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Market</div>
          <div className="text-lg font-medium text-gray-300">
            {opportunity.impliedProbability.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={(e) => handleQuickBet(e, 10)}
          disabled={isDisabled}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
            'bg-cyan-500 text-white hover:bg-cyan-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Quick Bet $10
        </button>
        
        <button
          onClick={(e) => handleQuickBet(e, 25)}
          disabled={isDisabled}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            'bg-purple-500 text-white hover:bg-purple-600',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          $25
        </button>

        <div className="flex items-center text-xs text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          <span>{opportunity.lastUpdate}</span>
        </div>
      </div>

      {/* Expanded view additional info */}
      {variant === 'expanded' && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">AI Model Confidence:</span>
              <span className="ml-2 text-cyan-400">{opportunity.aiProbability.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Last Updated:</span>
              <span className="ml-2 text-white">{opportunity.lastUpdate}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BettingOpportunityCard;
