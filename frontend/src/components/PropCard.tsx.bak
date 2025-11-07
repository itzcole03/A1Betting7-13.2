import React, { useState } from 'react';

interface StatBar {
  label: string;
  value: number;
}

interface Insight {
  icon: React.ReactNode;
  text: string;
}

export interface PropCardProps {
  player: string;
  team: string;
  position: string;
  score: number;
  maxScore?: number;
  summary: string;
  analysis: React.ReactNode;
  stats: StatBar[];
  insights: Insight[];
  onCollapse?: () => void;
  onRequestAnalysis?: () => void;
  isAnalysisLoading?: boolean;
  hasAnalysis?: boolean;
}

const PropCard: React.FC<PropCardProps> = ({
  player,
  team,
  position,
  score,
  maxScore = 100,
  summary,
  analysis,
  stats,
  insights,
  onCollapse,
  onRequestAnalysis,
  isAnalysisLoading = false,
  hasAnalysis = false,
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Debug: print when PropCard is rendered and its props
  // eslint-disable-next-line no-console
  console.log('[DEBUG] PropCard rendered with props:', {
    player,
    team,
    position,
    score,
    summary,
    analysis,
    stats,
    insights,
    hasAnalysis,
    isAnalysisLoading,
  });

  const handleToggleAnalysis = () => {
    if (!showAnalysis && !hasAnalysis && onRequestAnalysis) {
      // Request analysis if not shown and not available
      onRequestAnalysis();
    }
    setShowAnalysis(!showAnalysis);
  };
  return (
    <div
      className='bg-black rounded-2xl p-5 mb-6 shadow-lg border border-gray-800 max-w-md mx-auto'
      data-testid='prop-card'
    >
      <div className='flex flex-col items-center mb-4'>
        <div className='relative mb-2'>
          <div className='w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center border-4 border-green-500 text-3xl font-bold text-green-400'>
            {score}/{maxScore}
          </div>
        </div>
        <div className='text-xl font-bold text-white text-center'>{player}</div>
        <div className='text-sm text-gray-400 text-center'>
          {position} · {team}
        </div>
      </div>
      <div className='bg-gray-900 rounded-lg p-3 mb-3 border border-gray-700/50'>
        <div className='text-white text-sm font-medium mb-2 flex items-center justify-between'>
          <span>At a Glance</span>
          <div
            className='w-4 h-4 rounded-full bg-gray-600/50 flex items-center justify-center cursor-help border border-gray-500/30'
            title='AI Analysis Summary'
          >
            <svg
              width='10'
              height='10'
              fill='currentColor'
              viewBox='0 0 20 20'
              className='text-gray-400'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        </div>
        <div className='text-gray-200 text-sm leading-relaxed'>{summary}</div>
      </div>

      {/* Deep AI Analysis Toggle Section */}
      <div className='mb-3'>
        {/* Debug: print when Deep AI Analysis button is rendered */}
        // eslint-disable-next-line no-console console.log('[DEBUG] Rendering Deep AI Analysis
        button');
        <button
          onClick={handleToggleAnalysis}
          className='w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-all duration-300 border border-gray-600 hover:border-gray-500 group'
          aria-label='Deep AI Analysis'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-yellow-400'>🧠</span>
              <span className='text-white font-semibold'>Deep AI Analysis</span>
              {isAnalysisLoading && (
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400'></div>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 group-hover:text-white transition-all duration-300 ${
                showAnalysis ? 'rotate-180' : ''
              }`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>
          <div className='text-left text-gray-400 text-xs mt-1'>
            {showAnalysis
              ? 'Click to hide detailed AI analysis'
              : hasAnalysis
              ? 'Click to show detailed AI analysis'
              : 'Click to generate detailed AI analysis'}
          </div>
        </button>
        {/* Analysis Content */}
        {showAnalysis && (
          <div className='bg-gray-900 rounded-lg p-4 mt-2 border-l-4 border-yellow-400'>
            {isAnalysisLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400'></div>
                <span className='ml-3 text-gray-300'>Generating deep analysis...</span>
              </div>
            ) : analysis && analysis !== '' ? (
              <div
                data-testid='ai-take'
                className='text-gray-200 text-sm leading-relaxed whitespace-pre-line'
              >
                AI's Take
                <div>{analysis}</div>
              </div>
            ) : (
              <div data-testid='no-analysis' className='text-gray-400 text-sm italic'>
                No analysis available.
              </div>
            )}
          </div>
        )}
      </div>
      <div className='bg-gray-900 rounded-lg p-4 mb-3'>
        <div className='flex items-center justify-between mb-4'>
          <div className='text-white font-semibold text-lg'>Performance Analytics</div>
          {/* Modern Legend */}
          <div className='flex items-center gap-3 text-xs'>
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm'></div>
              <span className='text-gray-300 font-medium'>Target Hit</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-sm'></div>
              <span className='text-gray-300 font-medium'>Performance</span>
            </div>
          </div>
        </div>

        {/* Recent Games Section */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full'></div>
            <h3 className='text-white font-medium text-sm'>Recent Games</h3>
            <div className='flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent'></div>
          </div>

          {/* Game Performance Chart */}
          <div className='relative'>
            {/* 75% Baseline Reference Line */}
            <div
              className='absolute left-0 right-0 border-t border-gray-600 border-dashed opacity-40'
              style={{ bottom: `${45 + 25}px` }}
            >
              <span className='absolute -right-12 -top-2.5 text-xs text-gray-500 bg-gray-900 px-1 rounded'>
                75%
              </span>
            </div>

            <div className='flex items-end gap-4 pb-6'>
              {stats
                .filter(
                  stat =>
                    !stat.label.toLowerCase().includes('season') &&
                    !stat.label.toLowerCase().includes('vs') &&
                    !stat.label.toLowerCase().includes('opp')
                )
                .map((stat, idx) => {
                  const percentage = Math.round(stat.value * 100);
                  const barHeight = Math.max(stat.value * 60, 6);
                  const isTargetHit = stat.value >= 1.0;

                  // Format label for better readability
                  const formatLabel = (label: string) => {
                    if (label.includes('/')) {
                      return label.replace(/^0/, '');
                    }
                    return label;
                  };

                  return (
                    <div key={idx} className='flex flex-col items-center group relative'>
                      {/* Percentage Label */}
                      <div
                        className={`text-xs font-semibold mb-2 transition-all duration-300 ${
                          isTargetHit ? 'text-green-400' : 'text-white'
                        } group-hover:scale-110`}
                      >
                        {percentage}%
                      </div>

                      {/* Performance Bar */}
                      <div className='relative'>
                        <div
                          className={`w-9 rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 shadow-lg ${
                            isTargetHit
                              ? 'bg-gradient-to-t from-green-600 to-green-400 border-2 border-green-400'
                              : 'bg-gradient-to-t from-yellow-600 to-yellow-400 border-2 border-yellow-400'
                          }`}
                          style={{ height: `${barHeight}px`, minHeight: '6px' }}
                          title={`${stat.label}: ${percentage}% ${
                            isTargetHit ? '(Target Achieved!)' : ''
                          }`}
                          role='button'
                          tabIndex={0}
                        >
                          {/* Shine Effect */}
                          <div className='absolute inset-0 bg-gradient-to-t from-transparent via-white to-transparent opacity-20 rounded-lg'></div>

                          {/* Target Achievement Indicator */}
                          {isTargetHit && (
                            <div className='absolute -top-2 left-1/2 transform -translate-x-1/2 text-sm animate-pulse'>
                              ⭐
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date Label */}
                      <div className='text-xs text-gray-400 group-hover:text-white transition-colors mt-3 font-medium'>
                        {formatLabel(stat.label)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Comparative Statistics Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full'></div>
            <h3 className='text-white font-medium text-sm'>Comparative Analysis</h3>
            <div className='flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent'></div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {stats
              .filter(
                stat =>
                  stat.label.toLowerCase().includes('season') ||
                  stat.label.toLowerCase().includes('vs') ||
                  stat.label.toLowerCase().includes('opp')
              )
              .map((stat, idx) => {
                const percentage = Math.round(stat.value * 100);
                const isSeason = stat.label.toLowerCase().includes('season');
                const isVsOpp =
                  stat.label.toLowerCase().includes('vs') ||
                  stat.label.toLowerCase().includes('opp');

                return (
                  <div
                    key={idx}
                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${
                      isSeason
                        ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 hover:border-blue-500/70'
                        : 'bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700/50 hover:border-red-500/70'
                    } rounded-xl p-4 backdrop-blur-sm`}
                  >
                    {/* Header */}
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isSeason ? 'bg-blue-400' : 'bg-red-400'
                          }`}
                        ></div>
                        <span className='text-xs font-medium text-gray-300'>
                          {isSeason ? 'Season Average' : 'vs Opponent'}
                        </span>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          percentage >= 75
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {percentage >= 75 ? 'Strong' : 'Below Avg'}
                      </div>
                    </div>

                    {/* Main Percentage */}
                    <div className='text-center'>
                      <div
                        className={`text-2xl font-bold mb-1 ${
                          isSeason ? 'text-blue-300' : 'text-red-300'
                        }`}
                      >
                        {percentage}%
                      </div>
                      <div className='text-xs text-gray-400'>of target line</div>
                    </div>

                    {/* Progress Bar */}
                    <div className='mt-3'>
                      <div className='w-full bg-gray-700 rounded-full h-2 overflow-hidden'>
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isSeason
                              ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                              : 'bg-gradient-to-r from-red-600 to-red-400'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Hover Glow Effect */}
                    <div
                      className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        isSeason ? 'bg-blue-500/10' : 'bg-red-500/10'
                      }`}
                    ></div>
                  </div>
                );
              })}
          </div>

          {/* Performance Summary */}
          <div className='bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-4 border border-gray-600/30 backdrop-blur-sm'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-3'>
                <div className='w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full'></div>
                <span className='text-sm text-gray-300'>
                  Recent Performance:{' '}
                  {
                    stats.filter(
                      s =>
                        !s.label.toLowerCase().includes('season') &&
                        !s.label.toLowerCase().includes('vs') &&
                        !s.label.toLowerCase().includes('opp') &&
                        s.value >= 0.75
                    ).length
                  }
                  /
                  {
                    stats.filter(
                      s =>
                        !s.label.toLowerCase().includes('season') &&
                        !s.label.toLowerCase().includes('vs') &&
                        !s.label.toLowerCase().includes('opp')
                    ).length
                  }{' '}
                  above 75%
                </span>
              </div>
              <div className='text-sm text-gray-300'>
                Peak:{' '}
                <span className='text-green-400 font-semibold'>
                  {Math.round(Math.max(...stats.map(s => s.value)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='bg-gray-900 rounded-lg p-3 mb-3'>
        <div className='text-white font-semibold mb-1'>Insights</div>
        <div className='flex flex-col gap-2 mt-2'>
          {insights.map((insight, idx) => (
            <div key={idx} className='flex items-center gap-2'>
              <span className='text-green-400 text-xl'>{insight.icon}</span>
              <span className='text-gray-200 text-sm'>{insight.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Collapse Indicator */}
      <div
        className='flex items-center justify-center pt-4 pb-2 cursor-pointer group'
        onClick={onCollapse}
      >
        <div className='flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-300 border border-gray-600 hover:border-gray-500'>
          <svg
            className='w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
          </svg>
          <span className='text-sm text-gray-400 group-hover:text-white transition-colors duration-300 font-medium'>
            Collapse
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropCard;
