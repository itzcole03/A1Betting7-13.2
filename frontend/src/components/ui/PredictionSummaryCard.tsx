import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Activity,
} from 'lucide-react';

export interface PredictionData {
  id: string;
  sport: string;
  league: string;
  game: string;
  market: string;
  prediction: string;
  confidence: number;
  odds: number;
  expectedValue: number;
  roi: number;
  model: string;
  status: 'pending' | 'won' | 'lost' | 'push' | 'cancelled';
  timeRemaining?: string;
  features?: Array<{
    name: string;
    importance: number;
    value: string;
  }>;
  reasoning?: string;
  tags?: string[];
}

export interface PredictionSummaryCardProps {
  prediction: PredictionData;
  variant?: 'default' | 'cyber' | 'compact' | 'detailed';
  showFeatures?: boolean;
  showReasoning?: boolean;
  onSelect?: (prediction: PredictionData) => void;
  className?: string;
}

export const _PredictionSummaryCard: React.FC<PredictionSummaryCardProps> = ({
  prediction,
  variant = 'default',
  showFeatures = false,
  showReasoning = false,
  onSelect,
  className = '',
}) => {
  const _isClickable = !!onSelect;

  const _getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400 bg-green-500/20';
    if (confidence >= 65) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-orange-400 bg-orange-500/20';
  };

  const _getStatusColor = (status: PredictionData['status']) => {
    switch (status) {
      case 'won':
        return 'text-green-400 bg-green-500/20';
      case 'lost':
        return 'text-red-400 bg-red-500/20';
      case 'push':
        return 'text-gray-400 bg-gray-500/20';
      case 'cancelled':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-blue-400 bg-blue-500/20';
    }
  };

  const _getStatusIcon = (status: PredictionData['status']) => {
    switch (status) {
      case 'won':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <CheckCircle className='w-4 h-4' />;
      case 'lost':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertCircle className='w-4 h-4' />;
      case 'push':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Target className='w-4 h-4' />;
      case 'cancelled':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertCircle className='w-4 h-4' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Clock className='w-4 h-4' />;
    }
  };

  const _getROIColor = (roi: number) => {
    if (roi > 0) return 'text-green-400';
    if (roi < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const _cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    hover: isClickable
      ? {
          y: -4,
          scale: 1.02,
          transition: {
            duration: 0.2,
            ease: 'easeOut',
          },
        }
      : {},
  };

  const _variantClasses = {
    default: 'bg-slate-800/50 border-slate-700/50',
    cyber: 'bg-slate-900/50 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    compact: 'bg-slate-800/50 border-slate-700/50 p-4',
    detailed: 'bg-slate-800/50 border-slate-700/50',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`
        relative rounded-xl border backdrop-blur-sm overflow-hidden
        ${variant === 'compact' ? 'p-4' : 'p-6'}
        ${variantClasses[variant]}
        ${isClickable ? 'cursor-pointer hover:border-cyan-500/50' : ''}
        transition-colors duration-200
        ${className}
      `}
      // @ts-expect-error TS(2322): Type '{ hidden: { opacity: number; y: number; scal... Remove this comment to see the full error message
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      whileHover={!isClickable ? undefined : 'hover'}
      onClick={() => onSelect?.(prediction)}
    >
      {/* Cyber grid overlay */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className='absolute inset-0 opacity-10 pointer-events-none'
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34,211,238,0.1) 20px, rgba(34,211,238,0.1) 21px)',
          }}
        />
      )}

      {/* Shimmer effect for cyber variant */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent'
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      )}

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative'>
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-start justify-between mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex-1'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2 mb-1'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-xs font-medium text-cyan-400 uppercase tracking-wide'>
                {prediction.sport} • {prediction.league}
              </span>
              {prediction.status !== 'pending' && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prediction.status)}`}
                >
                  {getStatusIcon(prediction.status)}
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='capitalize'>{prediction.status}</span>
                </div>
              )}
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-lg font-semibold text-white mb-1'>{prediction.game}</h3>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2 text-sm text-gray-300'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='font-medium'>{prediction.market}:</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-white font-semibold'>{prediction.prediction}</span>
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-right'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xl font-bold text-white mb-1'>
              {prediction.odds > 0 ? `+${prediction.odds}` : prediction.odds}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-gray-400'>{prediction.model}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-3 gap-4 mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Target className='w-3 h-3 mr-1' />
              {prediction.confidence}%
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-gray-400 mt-1'>Confidence</div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`text-sm font-bold ${getROIColor(prediction.roi)}`}>
              {prediction.roi > 0 ? '+' : ''}
              {prediction.roi.toFixed(1)}%
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-gray-400'>ROI</div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm font-bold text-purple-400'>
              {prediction.expectedValue > 0 ? '+' : ''}
              {prediction.expectedValue.toFixed(2)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xs text-gray-400'>EV</div>
          </div>
        </div>

        {/* Time Remaining */}
        {prediction.timeRemaining && prediction.status === 'pending' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-1 text-xs text-gray-400 mb-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Clock className='w-3 h-3' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>{prediction.timeRemaining}</span>
          </div>
        )}

        {/* Tags */}
        {prediction.tags && prediction.tags.length > 0 && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-wrap gap-1 mb-4'>
            {prediction.tags.slice(0, 3).map(tag => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span key={tag} className='px-2 py-1 bg-slate-700/50 text-gray-300 rounded text-xs'>
                {tag}
              </span>
            ))}
            {prediction.tags.length > 3 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='px-2 py-1 bg-slate-700/50 text-gray-400 rounded text-xs'>
                +{prediction.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Features */}
        {showFeatures && prediction.features && variant !== 'compact' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='border-t border-slate-700/50 pt-4 mb-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-sm font-medium text-gray-300 mb-3 flex items-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Brain className='w-4 h-4 mr-2 text-cyan-400' />
              Key Features
            </h4>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-2'>
              {prediction.features.slice(0, 3).map((feature, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div key={index} className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-sm text-gray-300'>{feature.name}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-sm text-white font-medium'>{feature.value}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='w-16 h-1 bg-slate-700 rounded-full overflow-hidden'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        className='h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full'
                        style={{ width: `${feature.importance}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {showReasoning && prediction.reasoning && variant === 'detailed' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='border-t border-slate-700/50 pt-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-start space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Zap className='w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4 className='text-sm font-medium text-gray-300 mb-2'>AI Analysis</h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <p className='text-sm text-gray-300 leading-relaxed'>{prediction.reasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Model Badge */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='absolute top-4 right-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-1 px-2 py-1 bg-slate-700/50 rounded-full'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Activity className='w-3 h-3 text-cyan-400' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-xs text-cyan-400 font-medium'>AI</span>
          </div>
        </div>

        {/* Premium indicator */}
        {prediction.confidence >= 85 && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute top-4 left-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Star className='w-4 h-4 text-yellow-400' />
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 ${getConfidenceColor(prediction.confidence).includes('green') ? 'bg-green-400' : getConfidenceColor(prediction.confidence).includes('yellow') ? 'bg-yellow-400' : 'bg-orange-400'} opacity-60`}
      />
    </motion.div>
  );
};

export default PredictionSummaryCard;
