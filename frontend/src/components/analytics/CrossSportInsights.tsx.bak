/**
 * Cross-Sport Insights Component
 * Displays correlation patterns and insights across different sports
 */

import React, { useState } from 'react';
import { CrossSportInsight } from '../../types/analytics';

interface CrossSportInsightsProps {
  insights: CrossSportInsight[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

interface InsightCardProps {
  insight: CrossSportInsight;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, isExpanded, onToggleExpand }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8)
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (confidence >= 0.6)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cross_sport_correlation':
        return (
          <svg
            className='w-4 h-4 text-blue-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
            />
          </svg>
        );
      case 'seasonal_pattern':
        return (
          <svg
            className='w-4 h-4 text-yellow-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
            />
          </svg>
        );
      default:
        return (
          <svg
            className='w-4 h-4 text-gray-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 17l9.2-9.2M17 7H7v10'
            />
          </svg>
        );
    }
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center space-x-2 mb-2'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {formatType(insight.type)}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(
                insight.confidence
              )}`}
            >
              {Math.round(insight.confidence * 100)}% confident
            </span>
          </div>

          <div className='flex items-center space-x-4 mb-3'>
            <div className='flex items-center space-x-1'>
              <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>Sports:</span>
              <div className='flex space-x-1'>
                {insight.sports.map((sport: string, index: number) => (
                  <span
                    key={sport}
                    className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs font-medium'
                  >
                    {sport}
                    {index < insight.sports.length - 1 && (
                      <span className='text-gray-400 ml-1'>↔</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className='flex items-center space-x-1'>
              {getTypeIcon(insight.type)}
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                {formatType(insight.type)}
              </span>
            </div>
          </div>

          <p className='text-gray-700 dark:text-gray-300 mb-3 text-sm'>{insight.description}</p>

          <div className='flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400'>
            <div>
              <span className='font-medium'>Correlation:</span> {insight.correlation.toFixed(3)}
            </div>
            <div>
              <span className='font-medium'>Significance:</span> {insight.significance.toFixed(4)}
            </div>
          </div>

          {isExpanded && (
            <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-600'>
              <div className='space-y-4'>
                <div>
                  <h4 className='text-sm font-semibold text-gray-900 dark:text-white mb-2'>
                    Recommendation
                  </h4>
                  <p className='text-sm text-gray-700 dark:text-gray-300 p-3 bg-blue-50 dark:bg-blue-900/20 rounded'>
                    {insight.recommendation}
                  </p>
                </div>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium text-gray-900 dark:text-white'>Type:</span>
                    <p className='text-gray-700 dark:text-gray-300'>{formatType(insight.type)}</p>
                  </div>
                  <div>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      Sports Involved:
                    </span>
                    <p className='text-gray-700 dark:text-gray-300'>{insight.sports.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleExpand}
          className='ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          title={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </button>
      </div>
    </div>
  );
};

const CrossSportInsights: React.FC<CrossSportInsightsProps> = ({
  insights,
  isLoading,
  error,
  onRefresh,
}) => {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [filterBySport, setFilterBySport] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'correlation' | 'type'>('confidence');

  const toggleExpand = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  if (error) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Cross-Sport Insights
          </h2>
        </div>
        <div className='text-center py-8'>
          <div className='text-red-500 mb-2'>
            <svg
              className='w-12 h-12 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            Failed to Load Insights
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>{error}</p>
          <button
            onClick={onRefresh}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Cross-Sport Insights
          </h2>
        </div>
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='animate-pulse border border-gray-200 dark:border-gray-700 rounded-lg p-4'
            >
              <div className='space-y-3'>
                <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
                <div className='flex space-x-2'>
                  <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
                  <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-16'></div>
                </div>
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get all unique sports for filtering
  const allSports = Array.from(new Set(insights.flatMap(insight => insight.sports))).sort();

  // Filter and sort insights
  let filteredInsights = insights;
  if (filterBySport !== 'all') {
    filteredInsights = insights.filter(insight => insight.sports.includes(filterBySport));
  }

  filteredInsights = [...filteredInsights].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'correlation':
        return b.correlation - a.correlation;
      case 'type':
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return b.correlation - a.correlation;
      default:
        return 0;
    }
  });

  if (filteredInsights.length === 0) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Cross-Sport Insights
          </h2>
          <button
            onClick={onRefresh}
            className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            title='Refresh insights'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          </button>
        </div>
        <div className='text-center py-8'>
          <div className='text-gray-400 mb-4'>
            <svg
              className='w-16 h-16 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            No Insights Available
          </h3>
          <p className='text-gray-600 dark:text-gray-400'>
            {filterBySport !== 'all'
              ? `No cross-sport insights found for ${filterBySport}.`
              : 'No cross-sport insights have been generated yet. Check back later as more data becomes available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Cross-Sport Insights ({filteredInsights.length})
        </h2>
        <button
          onClick={onRefresh}
          className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          title='Refresh insights'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <div className='flex items-center space-x-2'>
          <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Filter by Sport:
          </label>
          <select
            value={filterBySport}
            onChange={e => setFilterBySport(e.target.value)}
            className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
          >
            <option value='all'>All Sports</option>
            {allSports.map(sport => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
        <div className='flex items-center space-x-2'>
          <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>Sort by:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'confidence' | 'correlation' | 'type')}
            className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
          >
            <option value='confidence'>Confidence</option>
            <option value='correlation'>Correlation</option>
            <option value='type'>Type</option>
          </select>
        </div>
      </div>

      {/* Insights */}
      <div className='space-y-4'>
        {filteredInsights.map((insight, index) => {
          const insightId = `${insight.type}-${insight.sports.join('-')}-${index}`;
          return (
            <InsightCard
              key={insightId}
              insight={insight}
              isExpanded={expandedInsights.has(insightId)}
              onToggleExpand={() => toggleExpand(insightId)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(CrossSportInsights);
