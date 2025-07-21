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
// @ts-expect-error TS(6142): Module '../../core/Layout' was resolved to 'C:/Use... Remove this comment to see the full error message
import { Layout } from '../../core/Layout';

interface QuantumState {
  id: string;
  name: string;
  amplitude: number;
  phase: number;
  entanglement: number;
  coherence: number;
  superposition: boolean;
  measurementProbability: number;
}

interface QuantumCircuit {
  id: string;
  name: string;
  gates: Array<{
    type: 'hadamard' | 'cnot' | 'pauli_x' | 'pauli_y' | 'pauli_z' | 'rotation';
    qubit: number;
    parameter?: number;
  }>;
  qubits: number;
  depth: number;
  fidelity: number;
  runtime: number;
  energyLevel: number;
}

interface QuantumPrediction {
  id: string;
  gameId: string;
  market: string;
  classicalPrediction: number;
  quantumPrediction: number;
  quantumAdvantage: number;
  entanglementFactors: string[];
  superpositionStates: QuantumState[];
  decoherenceTime: number;
  measurementConfidence: number;
  quantumError: number;
  timestamp: Date;
}

interface QuantumMetrics {
  totalQubits: number;
  entangledPairs: number;
  coherenceTime: number;
  gateErrorRate: number;
  quantumVolume: number;
  quantumSupremacy: boolean;
  processingSpeed: number;
  energyEfficiency: number;
}

const QuantumAI: React.FC = () => {
  const [quantumMetrics, setQuantumMetrics] = useState<QuantumMetrics | null>(null);
  const [quantumPredictions, setQuantumPredictions] = useState<QuantumPrediction[]>([]);
  const [activeCircuits, setActiveCircuits] = useState<QuantumCircuit[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'online' | 'calibrating' | 'offline'>('online');
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);

  useEffect(() => {
    loadQuantumData();
    const interval = setInterval(updateQuantumStates, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadQuantumData = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockMetrics: QuantumMetrics = {
        totalQubits: 127,
        entangledPairs: 45,
        coherenceTime: 247.3,
        gateErrorRate: 0.0012,
        quantumVolume: 512,
        quantumSupremacy: true,
        processingSpeed: 2.3e9,
        energyEfficiency: 98.7,
      };

      const mockPredictions: QuantumPrediction[] = [
        {
          id: 'q-pred-001',
          gameId: 'Lakers vs Warriors',
          market: 'Over 225.5 Total Points',
          classicalPrediction: 0.847,
          quantumPrediction: 0.923,
          quantumAdvantage: 0.076,
          entanglementFactors: [
            'Player Performance Correlation',
            'Pace Synchronization',
            'Coaching Strategy Entanglement',
          ],
          superpositionStates: [
            {
              id: 'state-1',
              name: 'High Scoring State',
              amplitude: 0.68,
              phase: 1.23,
              entanglement: 0.85,
              coherence: 0.92,
              superposition: true,
              measurementProbability: 0.462,
            },
            {
              id: 'state-2',
              name: 'Low Scoring State',
              amplitude: 0.32,
              phase: 2.87,
              entanglement: 0.73,
              coherence: 0.89,
              superposition: true,
              measurementProbability: 0.102,
            },
          ],
          decoherenceTime: 156.7,
          measurementConfidence: 0.923,
          quantumError: 0.008,
          timestamp: new Date(),
        },
        {
          id: 'q-pred-002',
          gameId: 'Chiefs vs Bills',
          market: 'Chiefs -3.5',
          classicalPrediction: 0.672,
          quantumPrediction: 0.784,
          quantumAdvantage: 0.112,
          entanglementFactors: [
            'Weather-Performance Coupling',
            'Momentum Superposition',
            'Decision Tree Entanglement',
          ],
          superpositionStates: [
            {
              id: 'state-3',
              name: 'Chiefs Victory State',
              amplitude: 0.78,
              phase: 0.95,
              entanglement: 0.91,
              coherence: 0.87,
              superposition: true,
              measurementProbability: 0.608,
            },
          ],
          decoherenceTime: 203.4,
          measurementConfidence: 0.784,
          quantumError: 0.011,
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
      ];

      const mockCircuits: QuantumCircuit[] = [
        {
          id: 'circuit-1',
          name: 'Player Performance Entangler',
          gates: [
            { type: 'hadamard', qubit: 0 },
            { type: 'cnot', qubit: 1 },
            { type: 'rotation', qubit: 2, parameter: 1.57 },
            { type: 'pauli_z', qubit: 3 },
          ],
          qubits: 16,
          depth: 12,
          fidelity: 0.9847,
          runtime: 847.3,
          energyLevel: 23.7,
        },
        {
          id: 'circuit-2',
          name: 'Market Superposition Generator',
          gates: [
            { type: 'hadamard', qubit: 0 },
            { type: 'hadamard', qubit: 1 },
            { type: 'cnot', qubit: 2 },
            { type: 'rotation', qubit: 3, parameter: 2.14 },
          ],
          qubits: 24,
          depth: 18,
          fidelity: 0.9763,
          runtime: 1234.7,
          energyLevel: 31.2,
        },
      ];

      setQuantumMetrics(mockMetrics);
      setQuantumPredictions(mockPredictions);
      setActiveCircuits(mockCircuits);
    } catch (error) {
      console.error('Failed to load quantum data:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQuantumStates = () => {
    setQuantumPredictions(prev =>
      prev.map(pred => ({
        ...pred,
        superpositionStates: pred.superpositionStates.map(state => ({
          ...state,
          amplitude: Math.max(0.1, state.amplitude + (Math.random() - 0.5) * 0.05),
          phase: (state.phase + Math.random() * 0.1) % (2 * Math.PI),
          coherence: Math.max(0.7, state.coherence + (Math.random() - 0.5) * 0.02),
        })),
      }))
    );
  };

  const runQuantumSimulation = async () => {
    setIsProcessing(true);
    setSystemStatus('calibrating');

    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await loadQuantumData();
      setSystemStatus('online');
    } catch (error) {
      setSystemStatus('offline');
    } finally {
      setIsProcessing(false);
    }
  };

  const getQuantumAdvantageColor = (advantage: number) => {
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

  const selectedPredictionData = quantumPredictions.find(p => p.id === selectedPrediction);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Layout
      title='Quantum AI'
      subtitle='Quantum-Enhanced Neural Networks • Superposition Prediction Engine'
      headerActions={
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className={`w-3 h-3 rounded-full ${
                systemStatus === 'online'
                  ? 'bg-green-400 animate-pulse'
                  : systemStatus === 'calibrating'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
              }`}
            ></div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={runQuantumSimulation}
            disabled={isProcessing}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Atom className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span>{isProcessing ? 'Processing...' : 'Run Simulation'}</span>
          </button>
        </div>
      }
    >
      {/* Quantum System Metrics */}
      {quantumMetrics && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10'></div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='relative'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-gray-400 text-sm'>Quantum Qubits</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-2xl font-bold text-purple-400'>{quantumMetrics.totalQubits}</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-xs text-purple-300 mt-1'>
                    {quantumMetrics.entangledPairs} entangled pairs
                  </p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Atom className='w-8 h-8 text-purple-400' />
              </div>
            </div>
          </motion.div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-green-500/10'></div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='relative'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-gray-400 text-sm'>Coherence Time</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-2xl font-bold text-cyan-400'>
                    {quantumMetrics.coherenceTime}μs
                  </p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-xs text-cyan-300 mt-1'>
                    Error: {(quantumMetrics.gateErrorRate * 100).toFixed(3)}%
                  </p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Timer className='w-8 h-8 text-cyan-400' />
              </div>
            </div>
          </motion.div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-gradient-to-br from-green-500/10 to-yellow-500/10'></div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='relative'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-gray-400 text-sm'>Quantum Volume</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-2xl font-bold text-green-400'>
                    {quantumMetrics.quantumVolume}
                  </p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-xs text-green-300 mt-1'>
                    {quantumMetrics.quantumSupremacy
                      ? 'Supremacy Achieved'
                      : 'Classical Equivalent'}
                  </p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Brain className='w-8 h-8 text-green-400' />
              </div>
            </div>
          </motion.div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 relative overflow-hidden'
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10'></div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='relative'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-gray-400 text-sm'>Processing Speed</p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-2xl font-bold text-yellow-400'>
                    {(quantumMetrics.processingSpeed / 1e9).toFixed(1)}B
                  </p>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <p className='text-xs text-yellow-300 mt-1'>Operations/sec</p>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Zap className='w-8 h-8 text-yellow-400' />
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quantum Predictions */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-white'>Quantum Predictions</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>Superposition-enhanced forecasting</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Target className='w-5 h-5 text-purple-400' />
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {quantumPredictions.map((prediction, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-start justify-between mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <h4 className='font-bold text-white'>{prediction.gameId}</h4>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <p className='text-sm text-gray-400'>{prediction.market}</p>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prediction.quantumAdvantage > 0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    Q-ADVANTAGE
                  </span>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 gap-4 mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>Classical</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-lg font-bold text-gray-300'>
                      {(prediction.classicalPrediction * 100).toFixed(1)}%
                    </div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400'>Quantum</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-lg font-bold text-purple-400'>
                      {(prediction.quantumPrediction * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex justify-between items-center text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-400'>Quantum Advantage:</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span
                    className={`font-bold ${getQuantumAdvantageColor(prediction.quantumAdvantage)}`}
                  >
                    +{(prediction.quantumAdvantage * 100).toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-white'>Active Quantum Circuits</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>Real-time quantum computations</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Cpu className='w-5 h-5 text-cyan-400' />
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {activeCircuits.map((circuit, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={circuit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h4 className='font-bold text-white'>{circuit.name}</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Radio className='w-4 h-4 text-green-400' />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 text-sm'>ACTIVE</span>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 gap-3 text-sm mb-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Qubits:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white ml-2'>{circuit.qubits}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Depth:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white ml-2'>{circuit.depth}</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Fidelity:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-cyan-400 ml-2'>
                      {(circuit.fidelity * 100).toFixed(2)}%
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Runtime:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white ml-2'>{circuit.runtime.toFixed(1)}μs</span>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center justify-between'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-xs text-gray-400'>
                    Gates: {circuit.gates.length} • Energy: {circuit.energyLevel}mJ
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-16 bg-slate-700 rounded-full h-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div
                      className='bg-gradient-to-r from-cyan-400 to-purple-400 h-1 rounded-full transition-all duration-1000'
                      style={{ width: `${circuit.fidelity * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quantum State Analysis */}
      {selectedPredictionData && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-white'>Quantum State Analysis</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>
                {selectedPredictionData.gameId} • {selectedPredictionData.market}
              </p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Waves className='w-5 h-5 text-purple-400' />
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Superposition States */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h4 className='font-medium text-white mb-4'>Superposition States</h4>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-3'>
                {selectedPredictionData.superpositionStates.map((state, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.div
                    key={state.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className='p-3 bg-slate-900/50 rounded-lg border border-slate-700/50'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between mb-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='font-medium text-white'>{state.name}</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-purple-400 text-sm'>
                        {(state.measurementProbability * 100).toFixed(1)}%
                      </span>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-gray-400'>Amplitude:</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-white ml-1'>{state.amplitude.toFixed(3)}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-gray-400'>Phase:</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-white ml-1'>{state.phase.toFixed(3)}</span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-gray-400'>Entanglement:</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-cyan-400 ml-1'>
                          {(state.entanglement * 100).toFixed(1)}%
                        </span>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-gray-400'>Coherence:</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-green-400 ml-1'>
                          {(state.coherence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Entanglement Factors */}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h4 className='font-medium text-white mb-4'>Entanglement Factors</h4>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-3'>
                {selectedPredictionData.entanglementFactors.map((factor, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.div
                    key={factor}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white'>{factor}</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center space-x-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='w-16 bg-slate-700 rounded-full h-1'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div
                          className='bg-gradient-to-r from-purple-400 to-cyan-400 h-1 rounded-full'
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <CheckCircle className='w-4 h-4 text-green-400' />
                    </div>
                  </motion.div>
                ))}
              </div>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg border border-purple-500/30'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h5 className='font-medium text-white mb-2'>Quantum Metrics</h5>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Decoherence Time:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-white ml-1'>
                      {selectedPredictionData.decoherenceTime.toFixed(1)}μs
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Quantum Error:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-red-400 ml-1'>
                      {(selectedPredictionData.quantumError * 100).toFixed(3)}%
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Confidence:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 ml-1'>
                      {(selectedPredictionData.measurementConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Advantage:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-purple-400 ml-1'>
                      +{(selectedPredictionData.quantumAdvantage * 100).toFixed(1)}%
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

export default QuantumAI;
