import { motion } from 'framer-motion';
import { Activity, Shield, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import React from 'react';

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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <TrendingUp className='w-3 h-3 text-green-400' />;
      case 'down':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <TrendingDown className='w-3 h-3 text-red-400' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        ease: 'easeOut' as const,
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
        ease: 'easeOut' as const,
      },
    },
  };

  const renderMinimalVersion = () => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`space-y-2 ${className}`}
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Progress Bar */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={`relative bg-slate-700 rounded-full overflow-hidden ${sizeConfig[size].container}`}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full'
          style={{ width: `${homePercent}%` }}
          variants={meterVariants}
          initial='hidden'
          animate='visible'
        />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          className='absolute inset-y-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full'
          style={{ width: `${awayPercent}%` }}
          variants={meterVariants}
          initial='hidden'
          animate='visible'
        />
        {showTie && tiePercent > 0 && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex justify-between'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className={`${sizeConfig[size].text} text-gray-300`}>
          {homeTeam.name} {homeTeam.probability.toFixed(1)}%
        </span>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className={`${sizeConfig[size].text} text-gray-300`}>
          {awayTeam.name} {awayTeam.probability.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );

  const renderCyberVersion = () => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className='absolute inset-0 opacity-10 pointer-events-none rounded-xl'
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34,211,238,0.1) 20px, rgba(34,211,238,0.1) 21px)',
        }}
      />

      {/* Shimmer effect */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='absolute inset-0 overflow-hidden pointer-events-none rounded-xl'>
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

      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative'>
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-lg font-semibold text-cyan-400 flex items-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Zap className='w-5 h-5 mr-2' />
            Win Probability
          </h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={`text-sm ${getConfidenceColor(confidence)}`}>
            {confidence}% Confidence
          </div>
        </div>

        {/* Teams */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='space-y-4 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            className={`
              flex items-center justify-between p-4 rounded-lg 
              ${
                homePercent > awayPercent
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'bg-slate-800/50'
              }
              ${onTeamClick ? 'cursor-pointer hover:bg-blue-500/30' : ''}
              transition-colors
            `}
            onClick={() => onTeamClick?.('home')}
            whileHover={onTeamClick ? { scale: 1.02 } : undefined}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-3'>
              {homeTeam.logo && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <img src={homeTeam.logo} alt={`Logo for ${homeTeam.name}`} className='w-8 h-8' />
              )}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className={`font-medium text-white ${sizeConfig[size].teamText}`}>
                {homeTeam.name}
              </span>
              {showTrends && getTrendIcon(homeTeam.trend)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`font-bold text-white ${sizeConfig[size].probText}`}>
              {homeTeam.probability.toFixed(1)}%
            </div>
          </motion.div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            className={`
              flex items-center justify-between p-4 rounded-lg 
              ${
                awayPercent > homePercent
                  ? 'bg-red-500/20 border border-red-500/30'
                  : 'bg-slate-800/50'
              }
              ${onTeamClick ? 'cursor-pointer hover:bg-red-500/30' : ''}
              transition-colors
            `}
            onClick={() => onTeamClick?.('away')}
            whileHover={onTeamClick ? { scale: 1.02 } : undefined}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-3'>
              {awayTeam.logo && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <img src={awayTeam.logo} alt={`Logo for ${awayTeam.name}`} className='w-8 h-8' />
              )}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className={`font-medium text-white ${sizeConfig[size].teamText}`}>
                {awayTeam.name}
              </span>
              {showTrends && getTrendIcon(awayTeam.trend)}
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`font-bold text-white ${sizeConfig[size].probText}`}>
              {awayTeam.probability.toFixed(1)}%
            </div>
          </motion.div>

          {showTie && tie && tiePercent > 0 && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div className='flex items-center justify-between p-4 rounded-lg bg-gray-500/20'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className={`font-medium text-gray-300 ${sizeConfig[size].teamText}`}>Tie</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className={`font-bold text-gray-300 ${sizeConfig[size].probText}`}>
                {tie.probability.toFixed(1)}%
              </div>
            </motion.div>
          )}
        </div>

        {/* Visual Meter */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='space-y-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={`relative bg-slate-700 rounded-full overflow-hidden ${sizeConfig[size].container}`}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full'
              style={{ width: `${homePercent}%` }}
              variants={meterVariants}
              initial='hidden'
              animate='visible'
            />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              className='absolute inset-y-0 right-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-full'
              style={{ width: `${awayPercent}%` }}
              variants={meterVariants}
              initial='hidden'
              animate='visible'
            />
            {showTie && tiePercent > 0 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex justify-between text-xs text-gray-400'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>0%</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>50%</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>100%</span>
          </div>
        </div>

        {/* Footer Info */}
        {(data.modelSource || data.lastUpdated) && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-gray-400'>
            {data.modelSource && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-1'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Activity className='w-3 h-3' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>{data.modelSource}</span>
              </div>
            )}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {data.lastUpdated && <span>Updated {data.lastUpdated}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderDefaultVersion = () => (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <motion.div
      className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm ${className}`}
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center justify-between mb-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h3 className='text-lg font-semibold text-white flex items-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Target className='w-5 h-5 mr-2 text-cyan-400' />
          Win Probability
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={`flex items-center space-x-1 text-sm ${getConfidenceColor(confidence)}`}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Shield className='w-4 h-4' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span>{confidence}%</span>
        </div>
      </div>

      {/* Teams Row */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-2 gap-4 mb-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={`font-bold text-white mb-1 ${sizeConfig[size].probText}`}>
            {homeTeam.probability.toFixed(1)}%
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={`text-gray-300 ${sizeConfig[size].teamText}`}>{homeTeam.name}</div>
          {showTrends && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex justify-center mt-1'>{getTrendIcon(homeTeam.trend)}</div>
          )}
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={`font-bold text-white mb-1 ${sizeConfig[size].probText}`}>
            {awayTeam.probability.toFixed(1)}%
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={`text-gray-300 ${sizeConfig[size].teamText}`}>{awayTeam.name}</div>
          {showTrends && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex justify-center mt-1'>{getTrendIcon(awayTeam.trend)}</div>
          )}
        </div>
      </div>

      {/* Visual Meter */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={`relative bg-slate-700 rounded-full overflow-hidden ${sizeConfig[size].container} mb-2`}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full'
          style={{ width: `${homePercent}%` }}
          variants={meterVariants}
          initial='hidden'
          animate='visible'
        />
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center mt-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
