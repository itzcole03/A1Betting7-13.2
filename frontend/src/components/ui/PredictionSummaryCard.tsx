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

export const PredictionSummaryCard: React.FC<PredictionSummaryCardProps> = ({
  prediction,
  variant = 'default',
  showFeatures = false,
  showReasoning = false,
  onSelect,
  className = '',
}) => {
  const isClickable = !!onSelect;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400 bg-green-500/20';
    if (confidence >= 65) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-orange-400 bg-orange-500/20';
  };

  const getStatusColor = (status: PredictionData['status']) => {
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

  const getStatusIcon = (status: PredictionData['status']) => {
    switch (status) {
      case 'won':
        return <CheckCircle className='w-4 h-4' />;
      case 'lost':
        return <AlertCircle className='w-4 h-4' />;
      case 'push':
        return <Target className='w-4 h-4' />;
      case 'cancelled':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const getROIColor = (roi: number) => {
    if (roi > 0) return 'text-green-400';
    if (roi < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const cardVariants = {
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

  const variantClasses = {
    default: 'bg-slate-800/50 border-slate-700/50',
    cyber: 'bg-slate-900/50 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    compact: 'bg-slate-800/50 border-slate-700/50 p-4',
    detailed: 'bg-slate-800/50 border-slate-700/50',
  };

  return (
    <motion.div
      className={`
        relative rounded-xl border backdrop-blur-sm overflow-hidden
        ${variant === 'compact' ? 'p-4' : 'p-6'}
        ${variantClasses[variant]}
        ${isClickable ? 'cursor-pointer hover:border-cyan-500/50' : ''}
        transition-colors duration-200
        ${className}
      `}
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      whileHover={!isClickable ? undefined : 'hover'}
      onClick={() => onSelect?.(prediction)}
    >
      {/* Cyber grid overlay */}
      {variant === 'cyber' && (
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
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
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

      <div className='relative'>
        {/* Header */}
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <div className='flex items-center space-x-2 mb-1'>
              <span className='text-xs font-medium text-cyan-400 uppercase tracking-wide'>
                {prediction.sport} • {prediction.league}
              </span>
              {prediction.status !== 'pending' && (
                <div
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prediction.status)}`}
                >
                  {getStatusIcon(prediction.status)}
                  <span className='capitalize'>{prediction.status}</span>
                </div>
              )}
            </div>

            <h3 className='text-lg font-semibold text-white mb-1'>{prediction.game}</h3>

            <div className='flex items-center space-x-2 text-sm text-gray-300'>
              <span className='font-medium'>{prediction.market}:</span>
              <span className='text-white font-semibold'>{prediction.prediction}</span>
            </div>
          </div>

          <div className='text-right'>
            <div className='text-xl font-bold text-white mb-1'>
              {prediction.odds > 0 ? `+${prediction.odds}` : prediction.odds}
            </div>
            <div className='text-xs text-gray-400'>{prediction.model}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className='grid grid-cols-3 gap-4 mb-4'>
          <div className='text-center'>
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}
            >
              <Target className='w-3 h-3 mr-1' />
              {prediction.confidence}%
            </div>
            <div className='text-xs text-gray-400 mt-1'>Confidence</div>
          </div>

          <div className='text-center'>
            <div className={`text-sm font-bold ${getROIColor(prediction.roi)}`}>
              {prediction.roi > 0 ? '+' : ''}
              {prediction.roi.toFixed(1)}%
            </div>
            <div className='text-xs text-gray-400'>ROI</div>
          </div>

          <div className='text-center'>
            <div className='text-sm font-bold text-purple-400'>
              {prediction.expectedValue > 0 ? '+' : ''}
              {prediction.expectedValue.toFixed(2)}
            </div>
            <div className='text-xs text-gray-400'>EV</div>
          </div>
        </div>

        {/* Time Remaining */}
        {prediction.timeRemaining && prediction.status === 'pending' && (
          <div className='flex items-center space-x-1 text-xs text-gray-400 mb-4'>
            <Clock className='w-3 h-3' />
            <span>{prediction.timeRemaining}</span>
          </div>
        )}

        {/* Tags */}
        {prediction.tags && prediction.tags.length > 0 && (
          <div className='flex flex-wrap gap-1 mb-4'>
            {prediction.tags.slice(0, 3).map(tag => (
              <span key={tag} className='px-2 py-1 bg-slate-700/50 text-gray-300 rounded text-xs'>
                {tag}
              </span>
            ))}
            {prediction.tags.length > 3 && (
              <span className='px-2 py-1 bg-slate-700/50 text-gray-400 rounded text-xs'>
                +{prediction.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Features */}
        {showFeatures && prediction.features && variant !== 'compact' && (
          <div className='border-t border-slate-700/50 pt-4 mb-4'>
            <h4 className='text-sm font-medium text-gray-300 mb-3 flex items-center'>
              <Brain className='w-4 h-4 mr-2 text-cyan-400' />
              Key Features
            </h4>
            <div className='space-y-2'>
              {prediction.features.slice(0, 3).map((feature, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-sm text-gray-300'>{feature.name}</span>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-white font-medium'>{feature.value}</span>
                    <div className='w-16 h-1 bg-slate-700 rounded-full overflow-hidden'>
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
          <div className='border-t border-slate-700/50 pt-4'>
            <div className='flex items-start space-x-2'>
              <Zap className='w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0' />
              <div>
                <h4 className='text-sm font-medium text-gray-300 mb-2'>AI Analysis</h4>
                <p className='text-sm text-gray-300 leading-relaxed'>{prediction.reasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Model Badge */}
        <div className='absolute top-4 right-4'>
          <div className='flex items-center space-x-1 px-2 py-1 bg-slate-700/50 rounded-full'>
            <Activity className='w-3 h-3 text-cyan-400' />
            <span className='text-xs text-cyan-400 font-medium'>AI</span>
          </div>
        </div>

        {/* Premium indicator */}
        {prediction.confidence >= 85 && (
          <div className='absolute top-4 left-4'>
            <Star className='w-4 h-4 text-yellow-400' />
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 ${getConfidenceColor(prediction.confidence).includes('green') ? 'bg-green-400' : getConfidenceColor(prediction.confidence).includes('yellow') ? 'bg-yellow-400' : 'bg-orange-400'} opacity-60`}
      />
    </motion.div>
  );
};

export default PredictionSummaryCard;
