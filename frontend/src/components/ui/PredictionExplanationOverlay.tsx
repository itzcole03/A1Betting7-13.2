// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

// Types for prediction explanation
interface PredictionFactor {
  id: string;
  name: string;
  description: string;
  impact: number; // -1 to 1, negative means decreases prediction confidence
  importance: number; // 0 to 1, how important this factor is
  category: 'statistical' | 'historical' | 'contextual' | 'external' | 'behavioral';
  value: number | string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  confidence: number; // 0 to 1
}

interface PredictionModel {
  id: string;
  name: string;
  type: 'neural_network' | 'random_forest' | 'logistic_regression' | 'ensemble' | 'deep_learning';
  version: string;
  accuracy: number;
  lastTrained: Date;
  features: number;
  confidence: number;
}

interface PredictionExplanation {
  prediction: {
    value: number | string;
    confidence: number;
    probability?: number;
    category?: string;
  };
  model: PredictionModel;
  factors: PredictionFactor[];
  reasoning: {
    summary: string;
    keyInsights: string[];
    warnings: string[];
    recommendations: string[];
  };
  alternatives: Array<{
    value: number | string;
    probability: number;
    reasoning: string;
  }>;
  metadata: {
    timestamp: Date;
    processingTime: number;
    dataPoints: number;
    reliability: 'high' | 'medium' | 'low';
  };
}

interface PredictionExplanationOverlayProps {
  explanation: PredictionExplanation;
  isOpen: boolean;
  variant?: 'default' | 'cyber' | 'technical' | 'simplified' | 'detailed';
  position?: 'center' | 'right' | 'left' | 'bottom';
  showFactorDetails?: boolean;
  showModelInfo?: boolean;
  showAlternatives?: boolean;
  showRecommendations?: boolean;
  enableInteraction?: boolean;
  className?: string;
  onClose?: () => void;
  onFactorClick?: (factor: PredictionFactor) => void;
  onModelClick?: (model: PredictionModel) => void;
  onExportExplanation?: () => void;
}

const _getFactorIcon = (category: string) => {
  const _icons = {
    statistical: '📊',
    historical: '📈',
    contextual: '🎯',
    external: '🌐',
    behavioral: '🧠',
  };
  return icons[category as keyof typeof icons] || '📋';
};

const _getModelIcon = (type: string) => {
  const _icons = {
    neural_network: '🧠',
    random_forest: '🌳',
    logistic_regression: '📈',
    ensemble: '🎭',
    deep_learning: '🤖',
  };
  return icons[type as keyof typeof icons] || '🔬';
};

const _getImpactColor = (impact: number, variant: string = 'default') => {
  const _intensity = Math.abs(impact);

  if (impact > 0) {
    // Positive impact
    const _colors = {
      default:
        intensity > 0.7
          ? 'text-green-700 bg-green-100'
          : intensity > 0.4
          ? 'text-green-600 bg-green-50'
          : 'text-green-500 bg-green-25',
      cyber:
        intensity > 0.7
          ? 'text-green-300 bg-green-500/30'
          : intensity > 0.4
          ? 'text-green-300 bg-green-500/20'
          : 'text-green-300 bg-green-500/10',
    };
    return variant === 'cyber' ? colors.cyber : colors.default;
  } else {
    // Negative impact
    const _colors = {
      default:
        intensity > 0.7
          ? 'text-red-700 bg-red-100'
          : intensity > 0.4
          ? 'text-red-600 bg-red-50'
          : 'text-red-500 bg-red-25',
      cyber:
        intensity > 0.7
          ? 'text-red-300 bg-red-500/30'
          : intensity > 0.4
          ? 'text-red-300 bg-red-500/20'
          : 'text-red-300 bg-red-500/10',
    };
    return variant === 'cyber' ? colors.cyber : colors.default;
  }
};

const _getConfidenceColor = (confidence: number, variant: string = 'default') => {
  const _colors = {
    default: {
      high: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-red-600 bg-red-100',
    },
    cyber: {
      high: 'text-green-300 bg-green-500/20',
      medium: 'text-yellow-300 bg-yellow-500/20',
      low: 'text-red-300 bg-red-500/20',
    },
  };

  const _level = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
  return variant === 'cyber' ? colors.cyber[level] : colors.default[level];
};

const _formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const _formatTime = (date: Date): string => {
  return date.toLocaleString();
};

export const _PredictionExplanationOverlay: React.FC<PredictionExplanationOverlayProps> = ({
  explanation,
  isOpen,
  variant = 'default',
  position = 'center',
  showFactorDetails = true,
  showModelInfo = true,
  showAlternatives = true,
  showRecommendations = true,
  enableInteraction = true,
  className,
  onClose,
  onFactorClick,
  onModelClick,
  onExportExplanation,
}) => {
  const [activeTab, setActiveTab] = useState<'factors' | 'model' | 'alternatives' | 'reasoning'>(
    'factors'
  );
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());

  // Close on escape key
  useEffect(() => {
    const _handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const _toggleFactorExpansion = (factorId: string) => {
    const _newExpanded = new Set(expandedFactors);
    if (newExpanded.has(factorId)) {
      newExpanded.delete(factorId);
    } else {
      newExpanded.add(factorId);
    }
    setExpandedFactors(newExpanded);
  };

  const _positionClasses = {
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    right: 'top-0 right-0 h-full',
    left: 'top-0 left-0 h-full',
    bottom: 'bottom-0 left-0 right-0',
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-xl',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    technical: 'bg-gray-900 border border-green-500/30 rounded-lg shadow-xl text-green-100',
    simplified: 'bg-white border border-blue-200 rounded-lg shadow-lg',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-2xl',
  };

  const _topFactors = explanation.factors.sort((a, b) => b.importance - a.importance).slice(0, 5);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
        role='button'
        tabIndex={0}
      />

      {/* Overlay Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'relative max-w-4xl max-h-[90vh] overflow-hidden',
          positionClasses[position],
          variantClasses[variant],
          position === 'center' ? 'w-full mx-4' : '',
          position === 'right' || position === 'left' ? 'w-96' : '',
          position === 'bottom' ? 'w-full mx-4 max-h-96' : '',
          className
        )}
      >
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex items-center justify-between p-6 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h2
              className={cn(
                'text-xl font-bold',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
              )}
            >
              Prediction Explanation
            </h2>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'text-sm mt-1',
                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
              )}
            >
              {explanation.model.name} • Confidence:{' '}
              {formatPercentage(explanation.prediction.confidence)}
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            {onExportExplanation && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={onExportExplanation}
                className={cn(
                  'px-3 py-1 text-sm rounded transition-colors',
                  variant === 'cyber'
                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                Export
              </button>
            )}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded transition-colors',
                variant === 'cyber'
                  ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Prediction Summary */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-6 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'p-4 rounded-lg border',
                variant === 'cyber'
                  ? 'bg-slate-800/50 border-cyan-500/30'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'text-sm opacity-70',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                Prediction
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'text-lg font-bold',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {explanation.prediction.value}
              </div>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'p-4 rounded-lg border',
                variant === 'cyber'
                  ? 'bg-slate-800/50 border-cyan-500/30'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'text-sm opacity-70',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                Confidence
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'text-lg font-bold',
                  getConfidenceColor(explanation.prediction.confidence, variant)
                )}
              >
                {formatPercentage(explanation.prediction.confidence)}
              </div>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={cn(
                'p-4 rounded-lg border',
                variant === 'cyber'
                  ? 'bg-slate-800/50 border-cyan-500/30'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'text-sm opacity-70',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                Reliability
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'text-lg font-bold capitalize',
                  explanation.metadata.reliability === 'high'
                    ? 'text-green-600'
                    : explanation.metadata.reliability === 'medium'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                )}
              >
                {explanation.metadata.reliability}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'flex border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          {['factors', 'model', 'alternatives', 'reasoning'].map(tab => (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              key={tab}
              onClick={() => setActiveTab(tab as unknown)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors capitalize',
                activeTab === tab
                  ? variant === 'cyber'
                    ? 'text-cyan-300 border-b-2 border-cyan-500'
                    : 'text-blue-600 border-b-2 border-blue-500'
                  : variant === 'cyber'
                  ? 'text-cyan-400/70 hover:text-cyan-300'
                  : 'text-gray-600 hover:text-gray-800'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex-1 overflow-y-auto'>
          {/* Factors Tab */}
          {activeTab === 'factors' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='p-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3
                className={cn(
                  'font-semibold mb-4',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                Key Factors ({explanation.factors.length})
              </h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-3'>
                {topFactors.map(factor => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    key={factor.id}
                    className={cn(
                      'border rounded-lg transition-all duration-200',
                      variant === 'cyber'
                        ? 'bg-slate-800/30 border-cyan-500/20 hover:border-cyan-500/40'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300',
                      enableInteraction && 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (enableInteraction) {
                        toggleFactorExpansion(factor.id);
                        onFactorClick?.(factor);
                      }
                    }}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='p-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center justify-between'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-3'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-lg'>{getFactorIcon(factor.category)}</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div
                              className={cn(
                                'font-medium',
                                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                              )}
                            >
                              {factor.name}
                            </div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div
                              className={cn(
                                'text-sm',
                                variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                              )}
                            >
                              {factor.category} • Trend: {factor.trend}
                            </div>
                          </div>
                        </div>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center space-x-3'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='text-right'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div
                              className={cn(
                                'text-sm font-medium',
                                getImpactColor(factor.impact, variant)
                              )}
                            >
                              Impact: {factor.impact > 0 ? '+' : ''}
                              {(factor.impact * 100).toFixed(1)}%
                            </div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div
                              className={cn(
                                'text-xs mt-1',
                                variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
                              )}
                            >
                              Importance: {formatPercentage(factor.importance)}
                            </div>
                          </div>

                          {enableInteraction && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span
                              className={cn(
                                'text-sm transition-transform',
                                expandedFactors.has(factor.id) ? 'rotate-90' : 'rotate-0'
                              )}
                            >
                              ▶
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Factor Details */}
                      {showFactorDetails && expandedFactors.has(factor.id) && (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className={cn(
                            'mt-4 pt-4 border-t',
                            variant === 'cyber' ? 'border-cyan-500/20' : 'border-gray-200'
                          )}
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div
                                className={cn(
                                  'text-sm font-medium mb-2',
                                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                                )}
                              >
                                Description
                              </div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <p
                                className={cn(
                                  'text-sm',
                                  variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-700'
                                )}
                              >
                                {factor.description}
                              </p>
                            </div>

                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div
                                className={cn(
                                  'text-sm font-medium mb-2',
                                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                                )}
                              >
                                Current Value
                              </div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <p
                                className={cn(
                                  'text-sm',
                                  variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-700'
                                )}
                              >
                                {factor.value} (Confidence: {formatPercentage(factor.confidence)})
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Tab */}
          {activeTab === 'model' && showModelInfo && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='p-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3
                className={cn(
                  'font-semibold mb-4',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                Model Information
              </h3>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'p-4 rounded-lg border',
                  variant === 'cyber'
                    ? 'bg-slate-800/30 border-cyan-500/20'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center space-x-3 mb-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-2xl'>{getModelIcon(explanation.model.type)}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4
                      className={cn(
                        'font-medium text-lg',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      {explanation.model.name}
                    </h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p
                      className={cn(
                        'text-sm',
                        variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
                      )}
                    >
                      {explanation.model.type.replace('_', ' ')} • Version{' '}
                      {explanation.model.version}
                    </p>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-sm opacity-70',
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                      )}
                    >
                      Accuracy
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-lg font-bold',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      {formatPercentage(explanation.model.accuracy)}
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-sm opacity-70',
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                      )}
                    >
                      Features
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-lg font-bold',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      {explanation.model.features.toLocaleString()}
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-sm opacity-70',
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                      )}
                    >
                      Data Points
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-lg font-bold',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      {explanation.metadata.dataPoints.toLocaleString()}
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-sm opacity-70',
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                      )}
                    >
                      Last Trained
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className={cn(
                        'text-sm font-bold',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      {explanation.model.lastTrained.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alternatives Tab */}
          {activeTab === 'alternatives' && showAlternatives && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='p-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3
                className={cn(
                  'font-semibold mb-4',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                Alternative Outcomes
              </h3>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-3'>
                {explanation.alternatives.map((alt, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    key={index}
                    className={cn(
                      'p-4 rounded-lg border',
                      variant === 'cyber'
                        ? 'bg-slate-800/30 border-cyan-500/20'
                        : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex justify-between items-start'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className={cn(
                            'font-medium',
                            variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                          )}
                        >
                          {alt.value}
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className={cn(
                            'text-sm mt-1',
                            variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-700'
                          )}
                        >
                          {alt.reasoning}
                        </div>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div
                        className={cn(
                          'text-sm font-medium px-2 py-1 rounded',
                          variant === 'cyber'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-purple-100 text-purple-700'
                        )}
                      >
                        {formatPercentage(alt.probability)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning Tab */}
          {activeTab === 'reasoning' && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='p-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3
                className={cn(
                  'font-semibold mb-4',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                AI Reasoning
              </h3>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-6'>
                {/* Summary */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h4
                    className={cn(
                      'font-medium mb-2',
                      variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                    )}
                  >
                    Summary
                  </h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p
                    className={cn(
                      'text-sm',
                      variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-700'
                    )}
                  >
                    {explanation.reasoning.summary}
                  </p>
                </div>

                {/* Key Insights */}
                {explanation.reasoning.keyInsights.length > 0 && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4
                      className={cn(
                        'font-medium mb-2',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      Key Insights
                    </h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <ul className='space-y-2'>
                      {explanation.reasoning.keyInsights.map((insight, index) => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <li
                          key={index}
                          className={cn(
                            'flex items-start space-x-2 text-sm',
                            variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-700'
                          )}
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-green-500 mt-0.5'>💡</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {explanation.reasoning.warnings.length > 0 && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4
                      className={cn(
                        'font-medium mb-2',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      Warnings
                    </h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <ul className='space-y-2'>
                      {explanation.reasoning.warnings.map((warning, index) => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <li
                          key={index}
                          className={cn(
                            'flex items-start space-x-2 text-sm',
                            variant === 'cyber' ? 'text-yellow-300' : 'text-yellow-700'
                          )}
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-yellow-500 mt-0.5'>⚠️</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {showRecommendations && explanation.reasoning.recommendations.length > 0 && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4
                      className={cn(
                        'font-medium mb-2',
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                      )}
                    >
                      Recommendations
                    </h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <ul className='space-y-2'>
                      {explanation.reasoning.recommendations.map((rec, index) => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <li
                          key={index}
                          className={cn(
                            'flex items-start space-x-2 text-sm',
                            variant === 'cyber' ? 'text-cyan-400/80' : 'text-gray-700'
                          )}
                        >
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-blue-500 mt-0.5'>💡</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-4 border-t text-center',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn('text-xs', variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500')}
          >
            Generated at {formatTime(explanation.metadata.timestamp)} • Processing time:{' '}
            {explanation.metadata.processingTime}ms
          </div>
        </div>

        {/* Cyber Effects */}
        {variant === 'cyber' && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
          </>
        )}
      </div>
    </div>
  );
};
