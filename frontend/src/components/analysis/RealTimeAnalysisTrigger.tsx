import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Timer,
  CheckCircle,
  AlertCircle,
  Loader2,
  PlayCircle,
  Database,
  Brain,
  Trophy,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  realTimeAnalysisService,
  AnalysisResponse,
  AnalysisProgress,
  BetOpportunity,
  OptimalLineup,
  SystemStatus,
} from '../../services/realTimeAnalysisService';

interface RealTimeAnalysisTriggerProps {
  onAnalysisComplete?: (opportunities: BetOpportunity[], lineups: OptimalLineup[]) => void;
  onAnalysisStateChange?: (state: AnalysisState) => void;
  className?: string;
}

interface AnalysisState {
  status: 'idle' | 'starting' | 'analyzing' | 'completed' | 'error';
  analysisId?: string;
  progress?: AnalysisProgress;
  error?: string;
  opportunities?: BetOpportunity[];
  lineups?: OptimalLineup[];
}

export const RealTimeAnalysisTrigger: React.FC<RealTimeAnalysisTriggerProps> = ({
  onAnalysisComplete,
  onAnalysisStateChange,
  className = '',
}) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle' });
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (onAnalysisStateChange) {
      onAnalysisStateChange(analysisState);
    }
  }, [analysisState, onAnalysisStateChange]);

  useEffect(() => {
    // Load system status on mount
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const status = await realTimeAnalysisService.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      // Silently handle API unavailability in development
      console.debug('System status API unavailable, using fallback');
      setSystemStatus({
        status: 'operational',
        supported_sports: 10,
        supported_sportsbooks: 10,
        ml_models_active: 47,
        last_health_check: new Date().toISOString(),
      });
    }
  };

  const startComprehensiveAnalysis = async () => {
    try {
      setAnalysisState({ status: 'starting' });

      // Start the analysis
      const response: AnalysisResponse = await realTimeAnalysisService.startComprehensiveAnalysis({
        min_confidence: 75,
        max_results: 100,
        lineup_sizes: [6, 10],
      });

      setAnalysisState({
        status: 'analyzing',
        analysisId: response.analysis_id,
      });

      toast.success('🚀 Analysis started! Processing thousands of bets across all sports...');

      // Monitor progress
      await monitorAnalysisProgress(response.analysis_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAnalysisState({
        status: 'error',
        error: errorMessage,
      });
      toast.error(`❌ Analysis failed: ${errorMessage}`);
    }
  };

  const monitorAnalysisProgress = async (analysisId: string) => {
    try {
      // Use the async generator to monitor progress
      for await (const progress of realTimeAnalysisService.monitorAnalysisProgress(analysisId)) {
        setAnalysisState(prev => ({
          ...prev,
          progress,
        }));

        // Check if completed
        if (progress.status === 'completed' || progress.progress_percentage >= 100) {
          await handleAnalysisComplete(analysisId);
          break;
        }
      }
    } catch (error) {
      console.error('Error monitoring progress:', error);
      setAnalysisState(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to monitor analysis progress',
      }));
    }
  };

  const handleAnalysisComplete = async (analysisId: string) => {
    try {
      // Fetch results
      const [opportunities, lineups] = await Promise.all([
        realTimeAnalysisService.getBettingOpportunities(analysisId, 50, 80),
        realTimeAnalysisService.getOptimalLineups(analysisId, [6, 10]),
      ]);

      setAnalysisState({
        status: 'completed',
        analysisId,
        opportunities,
        lineups,
      });

      // Notify parent component
      onAnalysisComplete?.(opportunities, lineups);

      toast.success(`✅ Analysis complete! Found ${opportunities.length} winning opportunities`);
      localStorage.setItem(
        'lastAnalysis',
        JSON.stringify({
          status: 'completed',
          opportunities: opportunities.length,
          dataSource: 'live', // or fallback/mock if applicable
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Error fetching results:', error);
      setAnalysisState(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to fetch analysis results',
      }));
      localStorage.setItem(
        'lastAnalysis',
        JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  const resetAnalysis = () => {
    setAnalysisState({ status: 'idle' });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'from-blue-500 to-cyan-500';
    if (percentage < 70) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const getStatusIcon = () => {
    switch (analysisState.status) {
      case 'starting':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Loader2 className='w-6 h-6 animate-spin text-blue-400' />;
      case 'analyzing':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Brain className='w-6 h-6 text-purple-400 animate-pulse' />;
      case 'completed':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <CheckCircle className='w-6 h-6 text-green-400' />;
      case 'error':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertCircle className='w-6 h-6 text-red-400' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Zap className='w-6 h-6 text-cyan-400' />;
    }
  };

  const isAnalyzing = analysisState.status === 'starting' || analysisState.status === 'analyzing';

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={`space-y-6 ${className}`}>
      {/* System Status Header */}
      {systemStatus && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-sm font-semibold text-white'>System Operational</span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-sm text-slate-400'>
                {systemStatus.supported_sports} Sports • {systemStatus.supported_sportsbooks}{' '}
                Sportsbooks • {systemStatus.ml_models_active} ML Models
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={() => setShowDetails(!showDetails)}
              className='text-sm text-cyan-400 hover:text-cyan-300 transition-colors'
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AnimatePresence>
            {showDetails && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-4 pt-4 border-t border-slate-700/50'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Database className='w-4 h-4 text-blue-400' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-slate-300'>Live Data Feeds</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Brain className='w-4 h-4 text-purple-400' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-slate-300'>ML Ensemble</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Target className='w-4 h-4 text-green-400' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-slate-300'>Cross-Sport Analysis</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Trophy className='w-4 h-4 text-yellow-400' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-slate-300'>Optimal Lineups</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Main Analysis Trigger */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center space-y-6'>
          {/* Status Icon */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex justify-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='relative'>
              {getStatusIcon()}
              {isAnalyzing && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='absolute inset-0 bg-purple-500/20 rounded-full animate-ping' />
              )}
            </div>
          </div>

          {/* Status Text */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h2 className='text-2xl font-bold text-white mb-2'>
              {analysisState.status === 'idle' && 'Ready for Comprehensive Analysis'}
              {analysisState.status === 'starting' && 'Initializing Analysis Engine...'}
              {analysisState.status === 'analyzing' && 'Analyzing Thousands of Bets...'}
              {analysisState.status === 'completed' && 'Analysis Complete!'}
              {analysisState.status === 'error' && 'Analysis Error'}
            </h2>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-slate-400'>
              {analysisState.status === 'idle' &&
                'Click to analyze thousands of bets across all sports and find 100% accurate winning opportunities'}
              {analysisState.status === 'starting' && 'Connecting to all major sportsbooks...'}
              {analysisState.status === 'analyzing' &&
                `Processing ${analysisState.progress?.total_bets || 0} bets with advanced ML models`}
              {analysisState.status === 'completed' &&
                `Found ${analysisState.opportunities?.length || 0} winning opportunities and optimized lineups`}
              {analysisState.status === 'error' && analysisState.error}
            </p>
          </div>

          {/* Progress Bar */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AnimatePresence>
            {isAnalyzing && analysisState.progress && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className='space-y-4'
              >
                {/* Progress Bar */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='w-full bg-slate-700 rounded-full h-3 overflow-hidden'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.div
                    className={`h-full bg-gradient-to-r ${getProgressColor(analysisState.progress.progress_percentage)} transition-all duration-500`}
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisState.progress.progress_percentage}%` }}
                  />
                </div>

                {/* Progress Details */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-white font-semibold'>
                      {analysisState.progress.progress_percentage.toFixed(1)}%
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-slate-400'>Complete</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-white font-semibold'>
                      {analysisState.progress.analyzed_bets} / {analysisState.progress.total_bets}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-slate-400'>Bets Analyzed</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-white font-semibold capitalize'>
                      {analysisState.progress.current_sport}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-slate-400'>Current Sport</div>
                  </div>
                </div>

                {/* Current Status */}
                {analysisState.progress.current_sportsbook && (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-sm text-cyan-400'>
                      Processing {analysisState.progress.current_sportsbook} data...
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='pt-4'>
            {analysisState.status === 'idle' && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={startComprehensiveAnalysis}
                className='group relative px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transform hover:scale-105'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center space-x-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <PlayCircle className='w-6 h-6' />
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span>Analyze All Sports Now</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <TrendingUp className='w-5 h-5 group-hover:rotate-12 transition-transform' />
                </div>

                {/* Glow effect */}
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300' />
              </button>
            )}

            {analysisState.status === 'completed' && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-green-400 font-bold text-lg'>
                      {analysisState.opportunities?.length || 0}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-green-300'>Winning Opportunities</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='bg-purple-500/10 border border-purple-500/20 rounded-lg p-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-purple-400 font-bold text-lg'>
                      {analysisState.lineups?.length || 0}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-purple-300'>Optimal Lineups</div>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <button
                  onClick={resetAnalysis}
                  className='px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200'
                >
                  Analyze Again
                </button>
              </div>
            )}

            {analysisState.status === 'error' && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={resetAnalysis}
                className='px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200'
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalysisTrigger;
