import { motion } from 'framer-motion';
import { BarChart3, Brain, Eye, GitBranch, Lightbulb, Target } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// @ts-expect-error TS(6142): Module '../components/ui/badge' was resolved to 'C... Remove this comment to see the full error message
import { Badge } from '../components/ui/badge';
// @ts-expect-error TS(6142): Module '../components/ui/card' was resolved to 'C:... Remove this comment to see the full error message
import { Card } from '../components/ui/card';

interface SHAPValue {
  feature: string;
  value: number;
  contribution: number;
  impact: 'positive' | 'negative' | 'neutral';
  category: 'player' | 'team' | 'game' | 'external' | 'historical';
}

interface Prediction {
  id: string;
  game: string;
  type: string;
  prediction: string;
  confidence: number;
  actualOutcome?: string;
  baseValue: number;
  shapValues: SHAPValue[];
  timestamp: string;
  sport: string;
}

interface ExplanationInsight {
  type: 'key_driver' | 'risk_factor' | 'confidence_booster' | 'unexpected';
  message: string;
  feature: string;
  impact: number;
  icon: string;
}

export const _SHAPAnalysis: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [insights, setInsights] = useState<ExplanationInsight[]>([]);
  const [viewMode, setViewMode] = useState<'waterfall' | 'feature' | 'summary'>('waterfall');
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'detailed' | 'expert'>('detailed');

  // Generate mock SHAP values
  const _generateSHAPValues = (): SHAPValue[] => {
    const _features = [
      { feature: 'Player Recent Form', category: 'player' as const },
      { feature: 'Team Offensive Rating', category: 'team' as const },
      { feature: 'Home Field Advantage', category: 'game' as const },
      { feature: 'Weather Conditions', category: 'external' as const },
      { feature: 'Head-to-Head Record', category: 'historical' as const },
      { feature: 'Injury Status', category: 'player' as const },
      { feature: 'Rest Days', category: 'player' as const },
      { feature: 'Line Movement', category: 'external' as const },
      { feature: 'Season Performance', category: 'historical' as const },
      { feature: 'Opponent Defense', category: 'team' as const },
      { feature: 'Game Importance', category: 'game' as const },
      { feature: 'Travel Distance', category: 'external' as const },
    ];

    // @ts-expect-error TS(2322): Type '({ value: number; contribution: number; impa... Remove this comment to see the full error message
    return features
      .map(f => {
        const _contribution = (Math.random() - 0.5) * 20;
        return {
          ...f,
          value: Math.random() * 100,
          contribution,
          impact: contribution > 5 ? 'positive' : contribution < -5 ? 'negative' : 'neutral',
        };
      })
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  };

  // Generate mock predictions
  const _generatePredictions = (): Prediction[] => {
    const _games = [
      { game: 'Lakers vs Warriors', sport: 'NBA', type: 'Player Props' },
      { game: 'Chiefs vs Bills', sport: 'NFL', type: 'Game Total' },
      { game: 'Celtics vs Heat', sport: 'NBA', type: 'Spread' },
      { game: 'Yankees vs Red Sox', sport: 'MLB', type: 'Moneyline' },
      { game: 'Rangers vs Lightning', sport: 'NHL', type: 'Player Props' },
    ];

    return games.map((g, index) => ({
      id: `pred-${index}`,
      game: g.game,
      sport: g.sport,
      type: g.type,
      prediction: `${Math.random() > 0.5 ? 'Over' : 'Under'} ${(Math.random() * 10 + 20).toFixed(1)}`,
      confidence: 75 + Math.random() * 20,
      baseValue: 0.5 + (Math.random() - 0.5) * 0.3,
      shapValues: generateSHAPValues(),
      timestamp: `${Math.floor(Math.random() * 2) + 1}h ago`,
      actualOutcome:
        Math.random() > 0.3 ? undefined : Math.random() > 0.5 ? 'Correct' : 'Incorrect',
    }));
  };

  // Generate insights
  const _generateInsights = (prediction: Prediction): ExplanationInsight[] => {
    const _shapValues = prediction.shapValues;
    const _insights: ExplanationInsight[] = [];

    // Key driver
    const _keyDriver = shapValues[0];
    if (keyDriver) {
      insights.push({
        type: 'key_driver',
        message: `${keyDriver.feature} is the primary factor driving this prediction`,
        feature: keyDriver.feature,
        impact: Math.abs(keyDriver.contribution),
        icon: '🎯',
      });
    }

    // Risk factor
    const _riskFactor = shapValues.find(
      s => s.impact === 'negative' && Math.abs(s.contribution) > 3
    );
    if (riskFactor) {
      insights.push({
        type: 'risk_factor',
        message: `${riskFactor.feature} poses a significant risk to this prediction`,
        feature: riskFactor.feature,
        impact: Math.abs(riskFactor.contribution),
        icon: '⚠️',
      });
    }

    // Confidence booster
    const _confidenceBooster = shapValues.find(
      s => s.impact === 'positive' && Math.abs(s.contribution) > 4
    );
    if (confidenceBooster) {
      insights.push({
        type: 'confidence_booster',
        message: `${confidenceBooster.feature} strongly supports this prediction`,
        feature: confidenceBooster.feature,
        impact: Math.abs(confidenceBooster.contribution),
        icon: '💪',
      });
    }

    // Unexpected factor
    const _unexpected = shapValues.find(
      s => s.category === 'external' && Math.abs(s.contribution) > 2
    );
    if (unexpected) {
      insights.push({
        type: 'unexpected',
        message: `${unexpected.feature} has an unexpected impact on this prediction`,
        feature: unexpected.feature,
        impact: Math.abs(unexpected.contribution),
        icon: '💡',
      });
    }

    return insights;
  };

  useEffect(() => {
    const _preds = generatePredictions();
    setPredictions(preds);
    if (preds.length > 0) {
      setSelectedPrediction(preds[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedPrediction) {
      setInsights(generateInsights(selectedPrediction));
    }
  }, [selectedPrediction]);

  const _getCategoryColor = (category: string) => {
    switch (category) {
      case 'player':
        return 'text-blue-400 border-blue-400';
      case 'team':
        return 'text-green-400 border-green-400';
      case 'game':
        return 'text-purple-400 border-purple-400';
      case 'external':
        return 'text-orange-400 border-orange-400';
      case 'historical':
        return 'text-cyan-400 border-cyan-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const _getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'key_driver':
        return 'border-yellow-500/30 bg-yellow-900/10';
      case 'risk_factor':
        return 'border-red-500/30 bg-red-900/10';
      case 'confidence_booster':
        return 'border-green-500/30 bg-green-900/10';
      case 'unexpected':
        return 'border-purple-500/30 bg-purple-900/10';
      default:
        return 'border-gray-500/30 bg-gray-900/10';
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-8'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card className='p-12 bg-gradient-to-r from-green-900/20 to-teal-900/20 border-green-500/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-5xl font-black bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent mb-4'>
            SHAP ANALYSIS
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-xl text-gray-300 mb-8'>Explainable AI & Model Interpretability</p>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center gap-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className='text-green-500'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <BarChart3 className='w-12 h-12' />
            </motion.div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-4 gap-8 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-green-400'>{predictions.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Analyzed Predictions</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-blue-400'>
                  {selectedPrediction ? selectedPrediction.shapValues.length : 0}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Features Analyzed</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-purple-400'>
                  {predictions.filter(p => p.actualOutcome === 'Correct').length}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Correct Predictions</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-yellow-400'>
                  {selectedPrediction ? selectedPrediction.confidence.toFixed(0) : 0}%
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Confidence</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Controls */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm text-gray-400'>View Mode:</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                value={viewMode}
                onChange={e => setViewMode(e.target.value as unknown)}
                className='px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg'
                aria-label='View mode'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='waterfall'>Waterfall Chart</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='feature'>Feature Impact</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='summary'>Summary View</option>
              </select>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm text-gray-400'>Analysis Depth:</span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                value={analysisDepth}
                onChange={e => setAnalysisDepth(e.target.value as unknown)}
                className='px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg'
                aria-label='Analysis depth'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='basic'>Basic</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='detailed'>Detailed</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <option value='expert'>Expert</option>
              </select>
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Badge variant='outline' className='text-green-400 border-green-400'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Eye className='w-3 h-3 mr-1' />
            Explainable AI
          </Badge>
        </div>
      </Card>

      {/* Main Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Predictions List */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='space-y-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-xl font-bold text-white'>Recent Predictions</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-3'>
            {predictions.map((prediction, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPrediction?.id === prediction.id
                      ? 'border-green-500/50 bg-green-900/10'
                      : 'border-gray-700/50 hover:border-green-500/30'
                  }`}
                  onClick={() => setSelectedPrediction(prediction)}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-start justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <h4 className='font-bold text-white'>{prediction.game}</h4>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-2 mt-1'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Badge variant='outline' className='text-gray-400 border-gray-600'>
                            {prediction.sport}
                          </Badge>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Badge variant='outline' className='text-gray-400 border-gray-600'>
                            {prediction.type}
                          </Badge>
                        </div>
                      </div>
                      {prediction.actualOutcome && (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Badge
                          variant='outline'
                          className={
                            prediction.actualOutcome === 'Correct'
                              ? 'text-green-400 border-green-400'
                              : 'text-red-400 border-red-400'
                          }
                        >
                          {prediction.actualOutcome}
                        </Badge>
                      )}
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-green-400 font-bold'>{prediction.prediction}</div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400 mt-1'>
                        Confidence: {prediction.confidence.toFixed(1)}% • {prediction.timestamp}
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex justify-between text-xs text-gray-400'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span>Base: {prediction.baseValue.toFixed(3)}</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span>{prediction.shapValues.length} features</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SHAP Analysis */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='lg:col-span-2'>
          {selectedPrediction ? (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-6'>
              {/* Prediction Header */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card className='p-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-start justify-between mb-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h3 className='text-2xl font-bold text-white'>{selectedPrediction.game}</h3>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-green-400 text-lg font-bold mt-1'>
                      {selectedPrediction.prediction}
                    </p>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-right'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-3xl font-bold text-green-400'>
                      {selectedPrediction.confidence.toFixed(1)}%
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-sm text-gray-400'>Confidence</div>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center gap-4 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Badge variant='outline' className={getCategoryColor('team')}>
                    {selectedPrediction.type}
                  </Badge>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>
                    Base Value: {selectedPrediction.baseValue.toFixed(3)}
                  </span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>{selectedPrediction.timestamp}</span>
                </div>
              </Card>

              {/* SHAP Values Visualization */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card className='p-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4 className='text-lg font-bold text-white mb-4'>Feature Impact Analysis</h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='space-y-3'>
                  {selectedPrediction.shapValues
                    .slice(
                      0,
                      analysisDepth === 'basic' ? 6 : analysisDepth === 'detailed' ? 10 : 12
                    )
                    .map((shap, index) => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className='space-y-2'
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-3'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Badge variant='outline' className={getCategoryColor(shap.category)}>
                              {shap.category}
                            </Badge>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span className='text-white font-medium'>{shap.feature}</span>
                          </div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-2'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span className={`font-bold ${getImpactColor(shap.impact)}`}>
                              {shap.contribution > 0 ? '+' : ''}
                              {shap.contribution.toFixed(2)}
                            </span>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Target className={`w-4 h-4 ${getImpactColor(shap.impact)}`} />
                          </div>
                        </div>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='relative'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='w-full bg-gray-700 rounded-full h-2'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.abs(shap.contribution) * 5}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className={`h-2 rounded-full ${
                                shap.impact === 'positive'
                                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                                  : shap.impact === 'negative'
                                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`}
                            />
                          </div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='text-xs text-gray-400 mt-1'>
                            Value: {shap.value.toFixed(1)} | Impact:{' '}
                            {Math.abs(shap.contribution).toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </Card>

              {/* AI Insights */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card className='p-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Lightbulb className='w-5 h-5 text-yellow-400' />
                  AI Insights
                </h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='space-y-3'>
                  {insights.map((insight, index) => (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${getInsightTypeColor(insight.type)}`}
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-start gap-3'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-2xl'>{insight.icon}</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex-1'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='font-medium text-white capitalize'>
                            {insight.type.replace('_', ' ')}
                          </div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='text-gray-300 mt-1'>{insight.message}</div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='text-sm text-gray-400 mt-2'>
                            Impact Score: {insight.impact.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Model Explanation Summary */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Card className='p-6'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Brain className='w-5 h-5 text-purple-400' />
                  Model Decision Summary
                </h4>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='space-y-4'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-2xl font-bold text-green-400'>
                        {selectedPrediction.shapValues.filter(s => s.impact === 'positive').length}
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Supporting Factors</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-2xl font-bold text-red-400'>
                        {selectedPrediction.shapValues.filter(s => s.impact === 'negative').length}
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Risk Factors</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-2xl font-bold text-gray-400'>
                        {selectedPrediction.shapValues.filter(s => s.impact === 'neutral').length}
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm text-gray-400'>Neutral Factors</div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='border-t border-gray-700 pt-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-gray-300 text-sm leading-relaxed'>
                      The model's prediction is primarily driven by{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-green-400 font-bold'>
                        {selectedPrediction.shapValues[0]?.feature}
                      </span>
                      {selectedPrediction.shapValues[1] && (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <>
                          {' '}
                          and{' '}
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-blue-400 font-bold'>
                            {selectedPrediction.shapValues[1].feature}
                          </span>
                        </>
                      )}
                      . The base probability was adjusted by{' '}
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-yellow-400 font-bold'>
                        {selectedPrediction.shapValues
                          .reduce((sum, s) => sum + s.contribution, 0)
                          .toFixed(2)}
                      </span>{' '}
                      percentage points based on the feature analysis.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card className='p-12 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <GitBranch className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-gray-300 mb-2'>Select a Prediction</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400'>Choose a prediction to view detailed SHAP analysis</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
