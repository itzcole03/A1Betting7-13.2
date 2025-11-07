import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  Zap,
  Brain,
  Activity,
  TrendingUp,
  Target,
  RefreshCw,
  Settings,
  BarChart3,
  Atom,
  Waves,
  Timer,
  AlertTriangle,
  CheckCircle,
  Eye,
  Radio,
} from 'lucide-react';
import { Layout } from '../../core/Layout';
import QuantumTransparencyNotice from '../../common/QuantumTransparencyNotice';

interface AIState {
  id: string;
  name: string;
  amplitude: number;
  phase: number;
  correlation: number;
  coherence: number;
  distributionAnalysis: boolean;
  probabilityWeight: number;
}

interface OptimizationAlgorithm {
  id: string;
  name: string;
  operations: Array<{
    type: 'gradient_descent' | 'simulated_annealing' | 'genetic_algorithm' | 'neural_evolution' | 'bayesian_optimization';
    parameter: number;
    node: number;
  }>;
  nodes: number;
  depth: number;
  accuracy: number;
  runtime: number;
  energyEfficiency: number;
}

interface AdvancedPrediction {
  id: string;
  gameId: string;
  market: string;
  classicalPrediction: number;
  optimizedPrediction: number;
  optimizationAdvantage: number;
  correlationFactors: string[];
  probabilityStates: AIState[];
  processingTime: number;
  confidence: number;
  modelError: number;
  timestamp: Date;
}

interface SystemMetrics {
  totalNodes: number;
  correlatedPairs: number;
  coherenceTime: number;
  errorRate: number;
  computationVolume: number;
  classicalSuperiority: boolean;
  processingSpeed: number;
  energyEfficiency: number;
}

const AdvancedAI: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [predictions, setPredictions] = useState<AdvancedPrediction[]>([]);
  const [activeAlgorithms, setActiveAlgorithms] = useState<OptimizationAlgorithm[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'online' | 'calibrating' | 'offline'>('online');
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);

  useEffect(() => {
    loadAdvancedData();
    const interval = setInterval(updateAIStates, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadAdvancedData = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockMetrics: SystemMetrics = {
        totalNodes: 1024,
        correlatedPairs: 256,
        coherenceTime: 847.3,
        errorRate: 0.0008,
        computationVolume: 2048,
        classicalSuperiority: true,
        processingSpeed: 4.7e9,
        energyEfficiency: 96.2,
      };

      const mockPredictions: AdvancedPrediction[] = [
        {
          id: 'ai-pred-001',
          gameId: 'Lakers vs Warriors',
          market: 'Over 225.5 Total Points',
          classicalPrediction: 0.847,
          optimizedPrediction: 0.923,
          optimizationAdvantage: 0.076,
          correlationFactors: [
            'Player Performance Correlation',
            'Pace Synchronization',
            'Strategy Optimization',
          ],
          probabilityStates: [
            {
              id: 'state-1',
              name: 'High Scoring Scenario',
              amplitude: 0.68,
              phase: 1.23,
              correlation: 0.85,
              coherence: 0.92,
              distributionAnalysis: true,
              probabilityWeight: 0.462,
            },
            {
              id: 'state-2',
              name: 'Low Scoring Scenario',
              amplitude: 0.32,
              phase: 2.87,
              correlation: 0.73,
              coherence: 0.89,
              distributionAnalysis: true,
              probabilityWeight: 0.102,
            },
          ],
          processingTime: 156.7,
          confidence: 0.923,
          modelError: 0.008,
          timestamp: new Date(),
        },
        {
          id: 'ai-pred-002',
          gameId: 'Chiefs vs Bills',
          market: 'Chiefs -3.5',
          classicalPrediction: 0.672,
          optimizedPrediction: 0.784,
          optimizationAdvantage: 0.112,
          correlationFactors: [
            'Weather-Performance Coupling',
            'Momentum Analysis',
            'Decision Tree Optimization',
          ],
          probabilityStates: [
            {
              id: 'state-3',
              name: 'Chiefs Victory Scenario',
              amplitude: 0.78,
              phase: 0.95,
              correlation: 0.91,
              coherence: 0.87,
              distributionAnalysis: true,
              probabilityWeight: 0.608,
            },
          ],
          processingTime: 203.4,
          confidence: 0.784,
          modelError: 0.011,
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
      ];

      const mockAlgorithms: OptimizationAlgorithm[] = [
        {
          id: 'algorithm-1',
          name: 'Player Performance Optimizer',
          operations: [
            { type: 'gradient_descent', node: 0, parameter: 0.01 },
            { type: 'simulated_annealing', node: 1, parameter: 0.95 },
            { type: 'bayesian_optimization', node: 2, parameter: 1.57 },
            { type: 'neural_evolution', node: 3, parameter: 0.1 },
          ],
          nodes: 64,
          depth: 12,
          accuracy: 0.9847,
          runtime: 247.3,
          energyEfficiency: 94.7,
        },
        {
          id: 'algorithm-2',
          name: 'Market Distribution Generator',
          operations: [
            { type: 'genetic_algorithm', node: 0, parameter: 0.8 },
            { type: 'gradient_descent', node: 1, parameter: 0.001 },
            { type: 'simulated_annealing', node: 2, parameter: 0.99 },
            { type: 'bayesian_optimization', node: 3, parameter: 2.14 },
          ],
          nodes: 128,
          depth: 18,
          accuracy: 0.9763,
          runtime: 434.7,
          energyEfficiency: 91.2,
        },
      ];

      setSystemMetrics(mockMetrics);
      setPredictions(mockPredictions);
      setActiveAlgorithms(mockAlgorithms);
    } catch (error) {
      console.error('Failed to load advanced AI data:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateAIStates = () => {
    setPredictions(prev =>
      prev.map(pred => ({
        ...pred,
        probabilityStates: pred.probabilityStates.map(state => ({
          ...state,
          amplitude: Math.max(0.1, state.amplitude + (Math.random() - 0.5) * 0.05),
          phase: (state.phase + Math.random() * 0.1) % (2 * Math.PI),
          coherence: Math.max(0.7, state.coherence + (Math.random() - 0.5) * 0.02),
        })),
      }))
    );
  };

  const runOptimizationSimulation = async () => {
    setIsProcessing(true);
    setSystemStatus('calibrating');

    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await loadAdvancedData();
      setSystemStatus('online');
    } catch (error) {
      setSystemStatus('offline');
    } finally {
      setIsProcessing(false);
    }
  };

  const getOptimizationAdvantageColor = (advantage: number) => {
    if (advantage > 0.1) return 'text-green-400';
    if (advantage > 0.05) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400 bg-green-500/20';
      case 'calibrating':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'offline':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const selectedPredictionData = predictions.find(p => p.id === selectedPrediction);

  return (
    <Layout
      title='Advanced AI'
      subtitle='Quantum-Inspired Classical Algorithms • Advanced Prediction Engine'
      headerActions={
        <div className='flex items-center space-x-3'>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-3 h-3 rounded-full ${
                systemStatus === 'online'
                  ? 'bg-green-400 animate-pulse'
                  : systemStatus === 'calibrating'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                systemStatus === 'online'
                  ? 'text-green-400'
                  : systemStatus === 'calibrating'
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {systemStatus.toUpperCase()}
            </span>
          </div>

          <button
            onClick={runOptimizationSimulation}
            disabled={isProcessing}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <Brain className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Processing...' : 'Run Optimization'}</span>
          </button>
        </div>
      }
    >
      {/* Transparency Notice */}
      <div className="mb-6">
        <QuantumTransparencyNotice variant="banner" />
      </div>

      {/* Advanced System Metrics */}
      {systemMetrics && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10'></div>
            <div className='relative'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Processing Nodes</p>
                  <p className='text-2xl font-bold text-purple-400'>{systemMetrics.totalNodes}</p>
                  <p className='text-xs text-purple-300 mt-1'>
                    {systemMetrics.correlatedPairs} correlated pairs
                  </p>
                </div>
                <Cpu className='w-8 h-8 text-purple-400' />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-green-500/10'></div>
            <div className='relative'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Model Coherence</p>
                  <p className='text-2xl font-bold text-cyan-400'>
                    {systemMetrics.coherenceTime}ms
                  </p>
                  <p className='text-xs text-cyan-300 mt-1'>
                    Error: {(systemMetrics.errorRate * 100).toFixed(3)}%
                  </p>
                </div>
                <Timer className='w-8 h-8 text-cyan-400' />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-green-500/10 to-yellow-500/10'></div>
            <div className='relative'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Computation Volume</p>
                  <p className='text-2xl font-bold text-green-400'>
                    {systemMetrics.computationVolume}
                  </p>
                  <p className='text-xs text-green-300 mt-1'>
                    {systemMetrics.classicalSuperiority
                      ? 'Optimization Achieved'
                      : 'Baseline Performance'}
                  </p>
                </div>
                <Brain className='w-8 h-8 text-green-400' />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            <div className='absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10'></div>
            <div className='relative'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-gray-400 text-sm'>Processing Speed</p>
                  <p className='text-2xl font-bold text-yellow-400'>
                    {(systemMetrics.processingSpeed / 1e9).toFixed(1)}B
                  </p>
                  <p className='text-xs text-yellow-300 mt-1'>Operations/sec</p>
                </div>
                <Zap className='w-8 h-8 text-yellow-400' />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Advanced Predictions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Advanced Predictions</h3>
              <p className='text-gray-400 text-sm'>Quantum-inspired optimization forecasting</p>
            </div>
            <Target className='w-5 h-5 text-purple-400' />
          </div>

          <div className='space-y-4'>
            {predictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedPrediction === prediction.id
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50'
                }`}
                onClick={() => setSelectedPrediction(prediction.id)}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h4 className='font-bold text-white'>{prediction.gameId}</h4>
                    <p className='text-sm text-gray-400'>{prediction.market}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prediction.optimizationAdvantage > 0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    AI-OPTIMIZED
                  </span>
                </div>

                <div className='grid grid-cols-2 gap-4 mb-3'>
                  <div>
                    <div className='text-xs text-gray-400'>Classical</div>
                    <div className='text-lg font-bold text-gray-300'>
                      {(prediction.classicalPrediction * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-gray-400'>AI-Optimized</div>
                    <div className='text-lg font-bold text-purple-400'>
                      {(prediction.optimizedPrediction * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className='flex justify-between items-center text-sm'>
                  <span className='text-gray-400'>Optimization Advantage:</span>
                  <span
                    className={`font-bold ${getOptimizationAdvantageColor(prediction.optimizationAdvantage)}`}
                  >
                    +{(prediction.optimizationAdvantage * 100).toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Active Optimization Algorithms</h3>
              <p className='text-gray-400 text-sm'>Real-time classical computations</p>
            </div>
            <Settings className='w-5 h-5 text-cyan-400' />
          </div>

          <div className='space-y-4'>
            {activeAlgorithms.map((algorithm, index) => (
              <motion.div
                key={algorithm.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50'
              >
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='font-bold text-white'>{algorithm.name}</h4>
                  <div className='flex items-center space-x-2'>
                    <Radio className='w-4 h-4 text-green-400' />
                    <span className='text-green-400 text-sm'>ACTIVE</span>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 text-sm mb-3'>
                  <div>
                    <span className='text-gray-400'>Nodes:</span>
                    <span className='text-white ml-2'>{algorithm.nodes}</span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Depth:</span>
                    <span className='text-white ml-2'>{algorithm.depth}</span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Accuracy:</span>
                    <span className='text-cyan-400 ml-2'>
                      {(algorithm.accuracy * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Runtime:</span>
                    <span className='text-white ml-2'>{algorithm.runtime.toFixed(1)}ms</span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='text-xs text-gray-400'>
                    Operations: {algorithm.operations.length} • Efficiency: {algorithm.energyEfficiency}%
                  </div>
                  <div className='w-16 bg-slate-700 rounded-full h-1'>
                    <div
                      className='bg-gradient-to-r from-cyan-400 to-purple-400 h-1 rounded-full transition-all duration-1000'
                      style={{ width: `${algorithm.accuracy * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Detailed Analysis */}
      {selectedPredictionData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Probabilistic State Analysis</h3>
              <p className='text-gray-400 text-sm'>
                {selectedPredictionData.gameId} • {selectedPredictionData.market}
              </p>
            </div>
            <Waves className='w-5 h-5 text-purple-400' />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Probability States */}
            <div>
              <h4 className='font-medium text-white mb-4'>Probability Distribution States</h4>
              <div className='space-y-3'>
                {selectedPredictionData.probabilityStates.map((state, index) => (
                  <motion.div
                    key={state.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className='p-3 bg-slate-900/50 rounded-lg border border-slate-700/50'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-medium text-white'>{state.name}</span>
                      <span className='text-purple-400 text-sm'>
                        {(state.probabilityWeight * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div>
                        <span className='text-gray-400'>Weight:</span>
                        <span className='text-white ml-1'>{state.amplitude.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Phase:</span>
                        <span className='text-white ml-1'>{state.phase.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Correlation:</span>
                        <span className='text-cyan-400 ml-1'>
                          {(state.correlation * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-400'>Coherence:</span>
                        <span className='text-green-400 ml-1'>
                          {(state.coherence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Correlation Factors */}
            <div>
              <h4 className='font-medium text-white mb-4'>Correlation Factors</h4>
              <div className='space-y-3'>
                {selectedPredictionData.correlationFactors.map((factor, index) => (
                  <motion.div
                    key={factor}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'
                  >
                    <span className='text-white'>{factor}</span>
                    <div className='flex items-center space-x-2'>
                      <div className='w-16 bg-slate-700 rounded-full h-1'>
                        <div
                          className='bg-gradient-to-r from-purple-400 to-cyan-400 h-1 rounded-full'
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <CheckCircle className='w-4 h-4 text-green-400' />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className='mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg border border-purple-500/30'>
                <h5 className='font-medium text-white mb-2'>Advanced AI Metrics</h5>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <span className='text-gray-400'>Processing Time:</span>
                    <span className='text-white ml-1'>
                      {selectedPredictionData.processingTime.toFixed(1)}ms
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Model Error:</span>
                    <span className='text-red-400 ml-1'>
                      {(selectedPredictionData.modelError * 100).toFixed(3)}%
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Confidence:</span>
                    <span className='text-green-400 ml-1'>
                      {(selectedPredictionData.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-400'>Optimization:</span>
                    <span className='text-purple-400 ml-1'>
                      +{(selectedPredictionData.optimizationAdvantage * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Layout>
  );
};

export default AdvancedAI;
