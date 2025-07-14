import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Zap, Shield, Activity } from 'lucide-react';

export interface WinProbabilityData {
  homeTeam: {
    name: string;
    logo?: string;
    probability: number;
    trend?: 'up' | 'down' | 'stable';
  };
  awayTeam: {
    name: string;
    logo?: string;
    probability: number;
    trend?: 'up' | 'down' | 'stable';
  };
  tie?: {
    probability: number;
  };
  confidence: number;
  lastUpdated?: string;
  modelSource?: string;
}

export interface WinProbabilityMeterProps {
  data: WinProbabilityData;
  variant?: 'default' | 'cyber' | 'minimal' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  showTrends?: boolean;
  showTie?: boolean;
  animate?: boolean;
  className?: string;
  onTeamClick?: (team: 'home' | 'away') => void;
}

export const WinProbabilityMeter: React.FC<WinProbabilityMeterProps> = ({
  data,
  variant = 'default',
  size = 'md',
  showTrends = true,
  showTie = false,
  animate = true,
  className = '',
  onTeamClick,
}) => {
  const { homeTeam, awayTeam, tie, confidence } = data;
  const totalProb = homeTeam.probability + awayTeam.probability + (tie?.probability || 0);

  // Normalize probabilities to 100%
  const homePercent = (homeTeam.probability / totalProb) * 100;
  const awayPercent = (awayTeam.probability / totalProb) * 100;
  const tiePercent = tie ? (tie.probability / totalProb) * 100 : 0;

  const sizeConfig = {
    sm: {
      container: 'h-3',
      text: 'text-xs',
      teamText: 'text-sm',
      probText: 'text-lg',
    },
    md: {
      container: 'h-4',
      text: 'text-sm',
      teamText: 'text-base',
      probText: 'text-xl',
    },
    lg: {
      container: 'h-6',
      text: 'text-base',
      teamText: 'text-lg',
      probText: 'text-2xl',
    },
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='w-3 h-3 text-green-400' />;
      case 'down':
        return <TrendingDown className='w-3 h-3 text-red-400' />;
      default:
        return <Target className='w-3 h-3 text-gray-400' />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 65) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const meterVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: animate ? 1.5 : 0,
        ease: 'easeOut',
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const renderMinimalVersion = () => (
    <motion.div
      className={`space-y-2 ${className}`}
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Progress Bar */}
      <div
        className={`relative bg-slate-700 rounded-full overflow-hidden ${sizeConfig[size].container}`}
      >
        <motion.div
          className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full'
          style={{ width: `${homePercent}%` }}
          variants={meterVariants}
          initial='hidden'
          animate='visible'
        />
        <motion.div
          className='absolute inset-y-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full'
          style={{ width: `${awayPercent}%` }}
          variants={meterVariants}
          initial='hidden'
          animate='visible'
        />
        {showTie && tiePercent > 0 && (
          <motion.div
            className='absolute inset-y-0 bg-gray-500 rounded-full'
            style={{
              left: `${homePercent}%`,
              width: `${tiePercent}%`,
            }}
            variants={meterVariants}
            initial='hidden'
            animate='visible'
          />
        )}
      </div>

      {/* Team Labels */}
      <div className='flex justify-between'>
        <span className={`${sizeConfig[size].text} text-gray-300`}>
          {homeTeam.name} {homeTeam.probability.toFixed(1)}%
        </span>
        <span className={`${sizeConfig[size].text} text-gray-300`}>
          {awayTeam.name} {awayTeam.probability.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );

  const renderCyberVersion = () => (
    <motion.div
      className={`
        relative bg-slate-900/50 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-lg
        shadow-[0_0_20px_rgba(34,211,238,0.2)]
        ${className}
      `}
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Cyber grid overlay */}
      <div
        className='absolute inset-0 opacity-10 pointer-events-none rounded-xl'
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34,211,238,0.1) 20px, rgba(34,211,238,0.1) 21px)',
        }}
      />

      {/* Shimmer effect */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none rounded-xl'>
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

      <div className='relative'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold text-cyan-400 flex items-center'>
            <Zap className='w-5 h-5 mr-2' />
            Win Probability
          </h3>
          <div className={`text-sm ${getConfidenceColor(confidence)}`}>
            {confidence}% Confidence
          </div>
        </div>

        {/* Teams */}
        <div className='space-y-4 mb-6'>
          <motion.div
            className={`
              flex items-center justify-between p-4 rounded-lg 
              ${homePercent > awayPercent ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-slate-800/50'}
              ${onTeamClick ? 'cursor-pointer hover:bg-blue-500/30' : ''}
              transition-colors
            `}
            onClick={() => onTeamClick?.('home')}
            whileHover={onTeamClick ? { scale: 1.02 } : undefined}
          >
            <div className='flex items-center space-x-3'>
              {homeTeam.logo && <img src={homeTeam.logo} alt={homeTeam.name} className='w-8 h-8' />}
              <span className={`font-medium text-white ${sizeConfig[size].teamText}`}>
                {homeTeam.name}
              </span>
              {showTrends && getTrendIcon(homeTeam.trend)}
            </div>
            <div className={`font-bold text-white ${sizeConfig[size].probText}`}>
              {homeTeam.probability.toFixed(1)}%
            </div>
          </motion.div>

          <motion.div
            className={`
              flex items-center justify-between p-4 rounded-lg 
              ${awayPercent > homePercent ? 'bg-red-500/20 border border-red-500/30' : 'bg-slate-800/50'}
              ${onTeamClick ? 'cursor-pointer hover:bg-red-500/30' : ''}
              transition-colors
            `}
            onClick={() => onTeamClick?.('away')}
            whileHover={onTeamClick ? { scale: 1.02 } : undefined}
          >
            <div className='flex items-center space-x-3'>
              {awayTeam.logo && <img src={awayTeam.logo} alt={awayTeam.name} className='w-8 h-8' />}
              <span className={`font-medium text-white ${sizeConfig[size].teamText}`}>
                {awayTeam.name}
              </span>
              {showTrends && getTrendIcon(awayTeam.trend)}
            </div>
            <div className={`font-bold text-white ${sizeConfig[size].probText}`}>
              {awayTeam.probability.toFixed(1)}%
            </div>
          </motion.div>

          {showTie && tie && tiePercent > 0 && (
            <motion.div className='flex items-center justify-between p-4 rounded-lg bg-gray-500/20'>
              <span className={`font-medium text-gray-300 ${sizeConfig[size].teamText}`}>Tie</span>
              <div className={`font-bold text-gray-300 ${sizeConfig[size].probText}`}>
                {tie.probability.toFixed(1)}%
              </div>
            </motion.div>
          )}
        </div>

        {/* Visual Meter */}
        <div className='space-y-3'>
          <div
            className={`relative bg-slate-700 rounded-full overflow-hidden ${sizeConfig[size].container}`}
          >
            <motion.div
              className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full'
              style={{ width: `${homePercent}%` }}
              variants={meterVariants}
              initial='hidden'
              animate='visible'
            />
            <motion.div
              className='absolute inset-y-0 right-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-full'
              style={{ width: `${awayPercent}%` }}
              variants={meterVariants}
              initial='hidden'
              animate='visible'
            />
            {showTie && tiePercent > 0 && (
              <motion.div
                className='absolute inset-y-0 bg-gray-500 rounded-full'
                style={{
                  left: `${homePercent}%`,
                  width: `${tiePercent}%`,
                }}
                variants={meterVariants}
                initial='hidden'
                animate='visible'
              />
            )}
          </div>

          {/* Percentage Labels */}
          <div className='flex justify-between text-xs text-gray-400'>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Footer Info */}
        {(data.modelSource || data.lastUpdated) && (
          <div className='mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-gray-400'>
            {data.modelSource && (
              <div className='flex items-center space-x-1'>
                <Activity className='w-3 h-3' />
                <span>{data.modelSource}</span>
              </div>
            )}
            {data.lastUpdated && <span>Updated {data.lastUpdated}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderDefaultVersion = () => (
    <motion.div
      className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm ${className}`}
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-white flex items-center'>
          <Target className='w-5 h-5 mr-2 text-cyan-400' />
          Win Probability
        </h3>
        <div className={`flex items-center space-x-1 text-sm ${getConfidenceColor(confidence)}`}>
          <Shield className='w-4 h-4' />
          <span>{confidence}%</span>
        </div>
      </div>

      {/* Teams Row */}
      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div className='text-center'>
          <div className={`font-bold text-white mb-1 ${sizeConfig[size].probText}`}>
            {homeTeam.probability.toFixed(1)}%
          </div>
          <div className={`text-gray-300 ${sizeConfig[size].teamText}`}>{homeTeam.name}</div>
          {showTrends && (
            <div className='flex justify-center mt-1'>{getTrendIcon(homeTeam.trend)}</div>
          )}
        </div>

        <div className='text-center'>
          <div className={`font-bold text-white mb-1 ${sizeConfig[size].probText}`}>
            {awayTeam.probability.toFixed(1)}%
          </div>
          <div className={`text-gray-300 ${sizeConfig[size].teamText}`}>{awayTeam.name}</div>
          {showTrends && (
            <div className='flex justify-center mt-1'>{getTrendIcon(awayTeam.trend)}</div>
          )}
        </div>
      </div>

      {/* Visual Meter */}
      <div
        className={`relative bg-slate-700 rounded-full overflow-hidden ${sizeConfig[size].container} mb-2`}
      >
        <motion.div
          className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full'
          style={{ width: `${homePercent}%` }}
          variants={meterVariants}
          initial='hidden'
          animate='visible'
        />
        <motion.div
          className='absolute inset-y-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full'
          style={{ width: `${awayPercent}%` }}
          variants={meterVariants}
          initial='hidden'
          animate='visible'
        />
      </div>

      {/* Tie Option */}
      {showTie && tie && tiePercent > 0 && (
        <div className='text-center mt-3'>
          <span className='text-sm text-gray-400'>Tie: {tie.probability.toFixed(1)}%</span>
        </div>
      )}
    </motion.div>
  );

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return renderMinimalVersion();
    case 'cyber':
      return renderCyberVersion();
    case 'detailed':
      return renderCyberVersion(); // Use cyber version for detailed
    default:
      return renderDefaultVersion();
  }
};

export default WinProbabilityMeter;
