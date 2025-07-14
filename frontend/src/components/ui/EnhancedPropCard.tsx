import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Zap,
  Clock,
  User,
  Trophy,
  Activity,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

export interface PlayerProp {
  id: string;
  player: {
    name: string;
    team: string;
    position: string;
    headshot?: string;
  };
  game: {
    opponent: string;
    date: string;
    time: string;
    venue: string;
  };
  prop: {
    type: string;
    line: number;
    overOdds: number;
    underOdds: number;
    recommendation: 'over' | 'under' | 'none';
  };
  analysis: {
    confidence: number;
    aiPrediction: number;
    trend: 'up' | 'down' | 'neutral';
    reasoning: string;
    factors: Array<{
      name: string;
      impact: number;
      description: string;
    }>;
  };
  stats: {
    season: {
      average: number;
      games: number;
      hitRate: number;
    };
    recent: {
      last5: number[];
      average: number;
      hitRate: number;
    };
    vsOpponent: {
      average: number;
      games: number;
      hitRate: number;
    };
  };
  value: {
    expectedValue: number;
    kellyBet: number;
    roi: number;
  };
  tags?: string[];
  isLive?: boolean;
  isPopular?: boolean;
}

export interface EnhancedPropCardProps {
  prop: PlayerProp;
  variant?: 'default' | 'cyber' | 'compact' | 'detailed';
  onSelect?: (prop: PlayerProp, selection: 'over' | 'under') => void;
  className?: string;
  showAnalysis?: boolean;
  showStats?: boolean;
}

export const EnhancedPropCard: React.FC<EnhancedPropCardProps> = ({
  prop,
  variant = 'default',
  onSelect,
  className = '',
  showAnalysis = true,
  showStats = true,
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80)
      return 'text-emerald-400 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30';
    if (confidence >= 65)
      return 'text-amber-400 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30';
    return 'text-orange-400 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='w-4 h-4 text-emerald-400 filter drop-shadow-sm' />;
      case 'down':
        return <TrendingDown className='w-4 h-4 text-red-400 filter drop-shadow-sm' />;
      default:
        return <Minus className='w-4 h-4 text-slate-400' />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'over':
        return 'text-emerald-400 bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/40';
      case 'under':
        return 'text-red-400 bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/40';
      default:
        return 'text-slate-400 bg-gradient-to-br from-slate-500/20 to-gray-500/20 border-slate-500/30';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.25, 0, 1],
      },
    },
    hover: {
      y: -6,
      scale: 1.03,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.25, 0, 1],
      },
    },
  };

  const variantClasses = {
    default:
      'bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border-slate-700/50 p-6 backdrop-blur-xl shadow-xl',
    cyber:
      'bg-gradient-to-br from-slate-900/70 via-cyan-950/30 to-slate-900/70 border-cyan-500/40 shadow-[0_0_30px_rgba(34,211,238,0.15)] p-6 backdrop-blur-xl',
    compact:
      'bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border-slate-700/50 p-4 backdrop-blur-xl shadow-lg',
    detailed:
      'bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border-slate-700/50 p-6 backdrop-blur-xl shadow-xl',
  };

  return (
    <motion.div
      className={`
        group relative rounded-2xl border overflow-hidden
        ${variantClasses[variant]}
        hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/10
        transition-all duration-300 ease-out
        ${className}
      `}
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      whileHover='hover'
    >
      {/* Enhanced gradient overlay */}
      <div className='absolute inset-0 opacity-30 pointer-events-none group-hover:opacity-40 transition-opacity duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent' />
        {variant === 'cyber' && (
          <div
            className='absolute inset-0 opacity-20'
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34,211,238,0.08) 20px, rgba(34,211,238,0.08) 21px), repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(34,211,238,0.05) 20px, rgba(34,211,238,0.05) 21px)',
            }}
          />
        )}
      </div>

      {/* Enhanced Live indicator */}
      {prop.isLive && (
        <div className='absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-500/30 text-red-400 rounded-full text-xs font-semibold shadow-lg'>
          <div className='relative'>
            <div className='w-2 h-2 bg-red-400 rounded-full animate-pulse' />
            <div className='absolute inset-0 w-2 h-2 bg-red-400 rounded-full animate-ping opacity-75' />
          </div>
          <span className='tracking-wide'>LIVE</span>
        </div>
      )}

      {/* Enhanced Popular indicator */}
      {prop.isPopular && (
        <div className='absolute top-4 left-4'>
          <div className='relative'>
            <Star className='w-5 h-5 text-yellow-400 filter drop-shadow-lg' fill='currentColor' />
            <div className='absolute inset-0 w-5 h-5 text-yellow-400 animate-pulse opacity-50'>
              <Star className='w-5 h-5' fill='currentColor' />
            </div>
          </div>
        </div>
      )}

      <div className='relative'>
        {/* Header */}
        <div className='flex items-start space-x-4 mb-4'>
          {/* Player Avatar */}
          <div className='flex-shrink-0'>
            {prop.player.headshot ? (
              <div className='relative'>
                <img
                  src={prop.player.headshot}
                  alt={prop.player.name}
                  className='w-14 h-14 rounded-full bg-slate-700 border-2 border-slate-600/50 shadow-lg'
                />
                <div className='absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              </div>
            ) : (
              <div className='w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 flex items-center justify-center shadow-lg'>
                <User className='w-7 h-7 text-slate-400' />
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className='flex-1'>
            <h3 className='text-lg font-bold text-white mb-1 tracking-wide'>{prop.player.name}</h3>
            <div className='flex items-center space-x-2 text-sm text-slate-300 mb-1'>
              <span className='font-medium'>{prop.player.team}</span>
              <span className='text-slate-500'>•</span>
              <span className='text-slate-400'>{prop.player.position}</span>
            </div>
            <div className='text-xs text-slate-400 font-medium'>
              vs {prop.game.opponent} • {prop.game.date}
            </div>
          </div>

          {/* Enhanced Confidence Badge */}
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border shadow-lg ${getConfidenceColor(prop.analysis.confidence)} border-current/20`}
          >
            <Target className='w-4 h-4 mr-2 filter drop-shadow-sm' />
            <span className='tracking-wide'>{prop.analysis.confidence}%</span>
          </div>
        </div>

        {/* Enhanced Prop Details */}
        <div className='bg-gradient-to-br from-slate-700/40 via-slate-600/30 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 mb-4 shadow-inner'>
          <div className='flex items-center justify-between mb-3'>
            <h4 className='text-sm font-semibold text-slate-300 uppercase tracking-wider'>
              {prop.prop.type}
            </h4>
            {getTrendIcon(prop.analysis.trend)}
          </div>

          <div className='flex items-center justify-between mb-4'>
            <div className='text-3xl font-bold text-white tracking-tight'>{prop.prop.line}</div>
            <div className='text-right'>
              <div className='text-base text-cyan-400 font-bold tracking-wide'>
                AI: {prop.analysis.aiPrediction}
              </div>
              <div className='text-xs text-slate-400 font-medium uppercase tracking-widest'>
                Prediction
              </div>
            </div>
          </div>

          {/* Enhanced Betting Options */}
          <div className='grid grid-cols-2 gap-4'>
            <button
              onClick={() => onSelect?.(prop, 'over')}
              className={`
                group/btn relative p-4 rounded-xl border transition-all duration-300 text-center backdrop-blur-sm
                transform hover:scale-105 hover:shadow-lg
                ${
                  prop.prop.recommendation === 'over'
                    ? getRecommendationColor('over') +
                      ' ring-2 ring-current shadow-lg shadow-current/20'
                    : 'border-slate-600/60 text-slate-300 hover:border-slate-500 hover:bg-slate-700/30'
                }
              `}
            >
              {prop.prop.recommendation === 'over' && (
                <div className='absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-50' />
              )}
              <div className='relative'>
                <div className='text-xl font-bold tracking-wide'>O {prop.prop.line}</div>
                <div className='text-sm font-medium opacity-90'>
                  {prop.prop.overOdds > 0 ? '+' : ''}
                  {prop.prop.overOdds}
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect?.(prop, 'under')}
              className={`
                group/btn relative p-4 rounded-xl border transition-all duration-300 text-center backdrop-blur-sm
                transform hover:scale-105 hover:shadow-lg
                ${
                  prop.prop.recommendation === 'under'
                    ? getRecommendationColor('under') +
                      ' ring-2 ring-current shadow-lg shadow-current/20'
                    : 'border-slate-600/60 text-slate-300 hover:border-slate-500 hover:bg-slate-700/30'
                }
              `}
            >
              {prop.prop.recommendation === 'under' && (
                <div className='absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 opacity-50' />
              )}
              <div className='relative'>
                <div className='text-xl font-bold tracking-wide'>U {prop.prop.line}</div>
                <div className='text-sm font-medium opacity-90'>
                  {prop.prop.underOdds > 0 ? '+' : ''}
                  {prop.prop.underOdds}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Value Metrics */}
        <div className='grid grid-cols-3 gap-4 mb-6'>
          <div className='text-center p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 backdrop-blur-sm'>
            <div className='text-base font-bold text-purple-400 tracking-wide'>
              {prop.value.expectedValue > 0 ? '+' : ''}
              {prop.value.expectedValue.toFixed(2)}
            </div>
            <div className='text-xs text-purple-300/80 font-medium uppercase tracking-widest mt-1'>
              EV
            </div>
          </div>

          <div className='text-center p-3 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 backdrop-blur-sm'>
            <div className='text-base font-bold text-emerald-400 tracking-wide'>
              {prop.value.roi > 0 ? '+' : ''}
              {prop.value.roi.toFixed(1)}%
            </div>
            <div className='text-xs text-emerald-300/80 font-medium uppercase tracking-widest mt-1'>
              ROI
            </div>
          </div>

          <div className='text-center p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 backdrop-blur-sm'>
            <div className='text-base font-bold text-amber-400 tracking-wide'>
              ${prop.value.kellyBet}
            </div>
            <div className='text-xs text-amber-300/80 font-medium uppercase tracking-widest mt-1'>
              Kelly
            </div>
          </div>
        </div>

        {/* Enhanced Statistics */}
        {showStats && variant !== 'compact' && (
          <div className='border-t border-gradient-to-r from-transparent via-slate-600/50 to-transparent pt-5 mb-5'>
            <h4 className='text-sm font-semibold text-slate-300 mb-4 flex items-center'>
              <Activity className='w-4 h-4 mr-2 text-cyan-400 filter drop-shadow-sm' />
              Performance Stats
            </h4>

            <div className='grid grid-cols-3 gap-4 text-center mb-4'>
              <div className='p-3 rounded-lg bg-slate-700/30 border border-slate-600/30'>
                <div className='text-base font-bold text-white'>
                  {prop.stats.season.average.toFixed(1)}
                </div>
                <div className='text-xs text-slate-400 font-medium uppercase tracking-wide mt-1'>
                  Season Avg
                </div>
                <div className='text-xs text-emerald-400 font-medium mt-1'>
                  {prop.stats.season.hitRate.toFixed(0)}% Hit Rate
                </div>
              </div>

              <div className='p-3 rounded-lg bg-slate-700/30 border border-slate-600/30'>
                <div className='text-base font-bold text-white'>
                  {prop.stats.recent.average.toFixed(1)}
                </div>
                <div className='text-xs text-slate-400 font-medium uppercase tracking-wide mt-1'>
                  L5 Avg
                </div>
                <div className='text-xs text-emerald-400 font-medium mt-1'>
                  {prop.stats.recent.hitRate.toFixed(0)}% Hit Rate
                </div>
              </div>

              <div className='p-3 rounded-lg bg-slate-700/30 border border-slate-600/30'>
                <div className='text-base font-bold text-white'>
                  {prop.stats.vsOpponent.average.toFixed(1)}
                </div>
                <div className='text-xs text-slate-400 font-medium uppercase tracking-wide mt-1'>
                  vs {prop.game.opponent}
                </div>
                <div className='text-xs text-emerald-400 font-medium mt-1'>
                  {prop.stats.vsOpponent.hitRate.toFixed(0)}% Hit Rate
                </div>
              </div>
            </div>

            {/* Enhanced Recent Games Trend */}
            <div className='mt-4'>
              <div className='text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider'>
                Last 5 Games
              </div>
              <div className='flex space-x-2'>
                {prop.stats.recent.last5.map((value, index) => {
                  const isOver = value > prop.prop.line;
                  return (
                    <div
                      key={index}
                      className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold backdrop-blur-sm border transition-all duration-200 hover:scale-105 ${
                        isOver
                          ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                          : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-400 border-red-500/30 shadow-sm shadow-red-500/20'
                      }`}
                    >
                      {value}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Analysis */}
        {showAnalysis && variant === 'detailed' && (
          <div className='border-t border-gradient-to-r from-transparent via-slate-600/50 to-transparent pt-5 mb-5'>
            <div className='flex items-start space-x-2 mb-3'>
              <Brain className='w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0 filter drop-shadow-sm' />
              <div>
                <h4 className='text-sm font-semibold text-slate-300 mb-2'>AI Analysis</h4>
                <p className='text-sm text-slate-300 leading-relaxed mb-3'>
                  {prop.analysis.reasoning}
                </p>
              </div>
            </div>

            {/* Key Factors */}
            <div className='space-y-3'>
              <h5 className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                Key Factors
              </h5>
              {prop.analysis.factors.slice(0, 3).map((factor, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-2 rounded-lg bg-slate-700/20'
                >
                  <span className='text-sm text-slate-300 font-medium'>{factor.name}</span>
                  <div className='flex items-center space-x-3'>
                    <div className='w-20 h-2 bg-slate-700 rounded-full overflow-hidden'>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          factor.impact > 0
                            ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                            : 'bg-gradient-to-r from-red-400 to-rose-400'
                        }`}
                        style={{ width: `${Math.abs(factor.impact)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold min-w-[3rem] text-right ${
                        factor.impact > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {factor.impact > 0 ? '+' : ''}
                      {factor.impact}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {prop.tags && prop.tags.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {prop.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className='px-3 py-1 bg-slate-700/50 border border-slate-600/30 text-slate-300 rounded-full text-xs font-medium backdrop-blur-sm'
              >
                {tag}
              </span>
            ))}
            {prop.tags.length > 3 && (
              <span className='px-3 py-1 bg-slate-700/50 border border-slate-600/30 text-slate-400 rounded-full text-xs font-medium backdrop-blur-sm'>
                +{prop.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Bottom accent with gradient */}
      <div className='absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl'>
        <div
          className={`h-full transition-all duration-500 ${
            prop.prop.recommendation === 'over'
              ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 shadow-sm shadow-emerald-400/50'
              : prop.prop.recommendation === 'under'
                ? 'bg-gradient-to-r from-red-400 via-rose-400 to-red-500 shadow-sm shadow-red-400/50'
                : 'bg-gradient-to-r from-slate-400 via-gray-400 to-slate-500'
          } opacity-80 group-hover:opacity-100`}
        />
      </div>
    </motion.div>
  );
};

export default EnhancedPropCard;
