import { motion } from 'framer-motion';
import { Activity, Cpu, GitBranch, RotateCcw, Settings, Target } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// @ts-expect-error TS(6142): Module '../components/ui/badge' was resolved to 'C... Remove this comment to see the full error message
import { Badge } from '../components/ui/badge';
// @ts-expect-error TS(6142): Module '../components/ui/button' was resolved to '... Remove this comment to see the full error message
import { Button } from '../components/ui/button';
// @ts-expect-error TS(6142): Module '../components/ui/card' was resolved to 'C:... Remove this comment to see the full error message
import { Card } from '../components/ui/card';

interface QuantumNode {
  id: string;
  type: 'input' | 'quantum' | 'neural' | 'output';
  position: { x: number; y: number };
  value: number;
  qubits?: number;
  entangled?: boolean;
  superposition?: boolean;
}

interface QuantumConnection {
  from: string;
  to: string;
  strength: number;
  type: 'quantum' | 'classical';
  entanglement?: boolean;
}

interface QuantumPrediction {
  id: string;
  game: string;
  sport: string;
  prediction: string;
  confidence: number;
  quantumStates: number;
  superpositions: number;
  entanglements: number;
  classicalProbability: number;
  quantumAdvantage: number;
  timestamp: string;
}

interface QuantumMetrics {
  coherenceTime: number;
  fidelity: number;
  entanglementDegree: number;
  quantumVolume: number;
  errorRate: number;
}

export const _QuantumAI: React.FC = () => {
  const [nodes, setNodes] = useState<QuantumNode[]>([]);
  const [connections, setConnections] = useState<QuantumConnection[]>([]);
  const [predictions, setPredictions] = useState<QuantumPrediction[]>([]);
  const [metrics, setMetrics] = useState<QuantumMetrics | null>(null);
  const [isQuantumActive, setIsQuantumActive] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'grover' | 'shor' | 'qaoa' | 'vqe'>(
    'qaoa'
  );
  const [quantumDepth, setQuantumDepth] = useState(8);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // Generate quantum network
  const _generateQuantumNetwork = (): { nodes: QuantumNode[]; connections: QuantumConnection[] } => {
    const _networkNodes: QuantumNode[] = [];
    const _networkConnections: QuantumConnection[] = [];

    // Input layer
    for (let _i = 0; i < 4; i++) {
      networkNodes.push({
        id: `input-${i}`,
        type: 'input',
        position: { x: 50, y: 100 + i * 80 },
        value: Math.random(),
      });
    }

    // Quantum layers
    for (let _layer = 0; layer < 3; layer++) {
      for (let _i = 0; i < 6; i++) {
        networkNodes.push({
          id: `quantum-${layer}-${i}`,
          type: 'quantum',
          position: { x: 200 + layer * 150, y: 50 + i * 60 },
          value: Math.random(),
          qubits: Math.floor(Math.random() * 4) + 2,
          entangled: Math.random() > 0.5,
          superposition: Math.random() > 0.3,
        });
      }
    }

    // Neural processing layer
    for (let _i = 0; i < 4; i++) {
      networkNodes.push({
        id: `neural-${i}`,
        type: 'neural',
        position: { x: 650, y: 100 + i * 80 },
        value: Math.random(),
      });
    }

    // Output layer
    for (let _i = 0; i < 2; i++) {
      networkNodes.push({
        id: `output-${i}`,
        type: 'output',
        position: { x: 800, y: 150 + i * 80 },
        value: Math.random(),
      });
    }

    // Generate connections
    networkNodes.forEach(node => {
      if (node.type === 'input') {
        // Connect inputs to first quantum layer
        const _quantumNodes = networkNodes.filter(n => n.id.startsWith('quantum-0-'));
        quantumNodes.forEach(qNode => {
          networkConnections.push({
            from: node.id,
            to: qNode.id,
            strength: Math.random(),
            type: 'quantum',
            entanglement: Math.random() > 0.7,
          });
        });
      } else if (node.type === 'quantum') {
        // Connect quantum layers
        const _layer = parseInt(node.id.split('-')[1]);
        if (layer < 2) {
          const _nextLayerNodes = networkNodes.filter(n => n.id.startsWith(`quantum-${layer + 1}-`));
          nextLayerNodes.forEach(nextNode => {
            if (Math.random() > 0.5) {
              networkConnections.push({
                from: node.id,
                to: nextNode.id,
                strength: Math.random(),
                type: 'quantum',
                entanglement: Math.random() > 0.6,
              });
            }
          });
        } else {
          // Connect to neural layer
          const _neuralNodes = networkNodes.filter(n => n.type === 'neural');
          neuralNodes.forEach(neuralNode => {
            if (Math.random() > 0.4) {
              networkConnections.push({
                from: node.id,
                to: neuralNode.id,
                strength: Math.random(),
                type: 'classical',
              });
            }
          });
        }
      } else if (node.type === 'neural') {
        // Connect neural to output
        const _outputNodes = networkNodes.filter(n => n.type === 'output');
        outputNodes.forEach(outputNode => {
          networkConnections.push({
            from: node.id,
            to: outputNode.id,
            strength: Math.random(),
            type: 'classical',
          });
        });
      }
    });

    return { nodes: networkNodes, connections: networkConnections };
  };

  // Generate quantum predictions
  const _generateQuantumPredictions = (): QuantumPrediction[] => {
    const _games = [
      { game: 'Lakers vs Warriors', sport: 'NBA' },
      { game: 'Chiefs vs Bills', sport: 'NFL' },
      { game: 'Celtics vs Heat', sport: 'NBA' },
      { game: 'Yankees vs Red Sox', sport: 'MLB' },
      { game: 'Rangers vs Lightning', sport: 'NHL' },
    ];

    return games.map((g, index) => {
      const _classicalProb = 0.5 + (Math.random() - 0.5) * 0.3;
      const _quantumAdv = Math.random() * 0.15;

      return {
        id: `qpred-${index}`,
        game: g.game,
        sport: g.sport,
        prediction: `${Math.random() > 0.5 ? 'Over' : 'Under'} ${(Math.random() * 10 + 20).toFixed(1)}`,
        confidence: 75 + Math.random() * 20,
        quantumStates: Math.floor(Math.random() * 512) + 256,
        superpositions: Math.floor(Math.random() * 32) + 16,
        entanglements: Math.floor(Math.random() * 16) + 8,
        classicalProbability: classicalProb,
        quantumAdvantage: quantumAdv,
        timestamp: `${Math.floor(Math.random() * 2) + 1}h ago`,
      };
    });
  };

  // Generate quantum metrics
  const _generateQuantumMetrics = (): QuantumMetrics => ({
    coherenceTime: 50 + Math.random() * 50, // microseconds
    fidelity: 0.95 + Math.random() * 0.04,
    entanglementDegree: Math.random() * 0.8 + 0.2,
    quantumVolume: Math.floor(Math.random() * 64) + 32,
    errorRate: Math.random() * 0.02 + 0.001,
  });

  // Simulate quantum computation
  const _runQuantumSimulation = () => {
    if (!isQuantumActive) return;

    setNodes(prev =>
      prev.map(node => ({
        ...node,
        value:
          node.type === 'quantum'
            ? node.superposition
              ? Math.random()
              : Math.sin(Date.now() * 0.001 + node.position.x * 0.01)
            : node.value + (Math.random() - 0.5) * 0.1,
      }))
    );

    setMetrics(generateQuantumMetrics());
  };

  useEffect(() => {
    const { nodes: networkNodes, connections: networkConnections } = generateQuantumNetwork();
    setNodes(networkNodes);
    setConnections(networkConnections);
    setPredictions(generateQuantumPredictions());
    setMetrics(generateQuantumMetrics());
  }, []);

  useEffect(() => {
    const _interval = setInterval(runQuantumSimulation, 1000 / simulationSpeed);
    return () => clearInterval(interval);
  }, [isQuantumActive, simulationSpeed]);

  const _getNodeColor = (node: QuantumNode) => {
    switch (node.type) {
      case 'input':
        return '#3B82F6'; // blue
      case 'quantum':
        if (node.superposition) return '#A855F7'; // purple
        if (node.entangled) return '#06B6D4'; // cyan
        return '#8B5CF6'; // violet _case 'neural':
        return '#10B981'; // green
      case 'output':
        return '#F59E0B'; // amber
      default:
        return '#6B7280'; // gray
    }
  };

  const _getConnectionColor = (connection: QuantumConnection) => {
    if (connection.entanglement) return '#EC4899'; // pink
    return connection.type === 'quantum' ? '#8B5CF6' : '#6B7280';
  };

  const _getAlgorithmDescription = (algorithm: string) => {
    switch (algorithm) {
      case 'grover':
        return 'Quantum search algorithm for unstructured databases';
      case 'shor':
        return 'Quantum factoring algorithm for cryptographic analysis';
      case 'qaoa':
        return 'Quantum Approximate Optimization Algorithm';
      case 'vqe':
        return 'Variational Quantum Eigensolver for optimization';
      default:
        return 'Advanced quantum computing algorithm';
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
        <Card className='p-12 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-5xl font-black bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-transparent mb-4'>
            QUANTUM AI
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-xl text-gray-300 mb-8'>Quantum Computing & Neural Networks</p>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center gap-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              animate={{
                rotate: [0, 120, 240, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className='text-purple-500'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Cpu className='w-12 h-12' />
            </motion.div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-4 gap-8 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-purple-400'>
                  {metrics ? Math.floor(metrics.quantumVolume) : 0}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Quantum Volume</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-cyan-400'>
                  {predictions.reduce((sum, p) => sum + p.quantumStates, 0).toLocaleString()}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Quantum States</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-blue-400'>
                  {predictions.reduce((sum, p) => sum + p.superpositions, 0)}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Superpositions</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-pink-400'>
                  {predictions.reduce((sum, p) => sum + p.entanglements, 0)}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Entanglements</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Controls */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='quantum-algorithm'>Quantum Algorithm</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              id='quantum-algorithm'
              value={selectedAlgorithm}
              onChange={e => setSelectedAlgorithm(e.target.value as unknown)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Quantum algorithm'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='qaoa'>QAOA</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='grover'>Grover's Search</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='shor'>Shor's Algorithm</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='vqe'>VQE</option>
            </select>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-xs text-gray-500 mt-1'>
              {getAlgorithmDescription(selectedAlgorithm)}
            </p>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='quantum-depth'>
              Quantum Depth: {quantumDepth}
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              id='quantum-depth'
              type='range'
              min='4'
              max='16'
              value={quantumDepth}
              onChange={e => setQuantumDepth(parseInt(e.target.value))}
              className='w-full'
              aria-label='Quantum depth'
            />
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='quantum-simulation-speed'>
              Simulation Speed: {simulationSpeed}x
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <input
              id='quantum-simulation-speed'
              type='range'
              min='0.5'
              max='4'
              step='0.5'
              value={simulationSpeed}
              onChange={e => setSimulationSpeed(parseFloat(e.target.value))}
              className='w-full'
              aria-label='Simulation speed'
            />
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-end gap-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Button
              onClick={() => setIsQuantumActive(!isQuantumActive)}
              className={`flex-1 ${
                isQuantumActive
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {isQuantumActive ? 'Active' : 'Inactive'}
            </Button>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Button
              onClick={() => {
                const { nodes: newNodes, connections: newConnections } = generateQuantumNetwork();
                setNodes(newNodes);
                setConnections(newConnections);
              }}
              variant='outline'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <RotateCcw className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Quantum Network Visualization */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='xl:col-span-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <GitBranch className='w-5 h-5 text-purple-400' />
              Quantum Neural Network
            </h3>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div
              className='relative bg-slate-800/50 rounded-lg p-4 overflow-hidden'
              style={{ height: '500px' }}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <svg width='100%' height='100%' className='absolute inset-0'>
                {/* Render connections */}
                {connections.map((connection, index) => {
                  const _fromNode = nodes.find(n => n.id === connection.from);
                  const _toNode = nodes.find(n => n.id === connection.to);

                  if (!fromNode || !toNode) return null;

                  return (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.line
                      key={`connection-${index}`}
                      x1={fromNode.position.x}
                      y1={fromNode.position.y}
                      x2={toNode.position.x}
                      y2={toNode.position.y}
                      stroke={getConnectionColor(connection)}
                      strokeWidth={connection.strength * 3 + 1}
                      strokeOpacity={connection.entanglement ? 0.8 : 0.4}
                      strokeDasharray={connection.type === 'quantum' ? '5,5' : 'none'}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: index * 0.02 }}
                    />
                  );
                })}

                {/* Render nodes */}
                {nodes.map((node, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.g key={node.id}>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.circle
                      cx={node.position.x}
                      cy={node.position.y}
                      r={node.type === 'quantum' ? 8 : 6}
                      fill={getNodeColor(node)}
                      stroke={node.entangled ? '#EC4899' : 'none'}
                      strokeWidth={2}
                      strokeDasharray={node.superposition ? '3,3' : 'none'}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: 1,
                        opacity: node.superposition ? [0.6, 1, 0.6] : 1,
                      }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.02,
                        opacity: { duration: 2, repeat: Infinity },
                      }}
                    />

                    {/* Quantum indicators */}
                    {node.type === 'quantum' && node.qubits && (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <text
                        x={node.position.x}
                        y={node.position.y - 15}
                        textAnchor='middle'
                        fontSize='10'
                        fill='#A855F7'
                      >
                        Q{node.qubits}
                      </text>
                    )}
                  </motion.g>
                ))}
              </svg>

              {/* Legend */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='absolute bottom-4 left-4 space-y-2 text-xs'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-300'>Input Layer</span>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-3 h-3 bg-purple-500 rounded-full border-2 border-pink-400'></div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-300'>Quantum (Entangled)</span>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-300'>Neural Processing</span>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center gap-2'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-3 h-3 bg-amber-500 rounded-full'></div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-gray-300'>Output Layer</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quantum Metrics & Predictions */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='space-y-6'>
          {/* Quantum Metrics */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Activity className='w-5 h-5 text-cyan-400' />
              Quantum Metrics
            </h4>

            {metrics && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-sm mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Coherence Time</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-cyan-400'>{metrics.coherenceTime.toFixed(1)}μs</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      className='bg-gradient-to-r from-cyan-400 to-cyan-500 h-2 rounded-full'
                      animate={{ width: `${metrics.coherenceTime}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-sm mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Fidelity</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400'>{(metrics.fidelity * 100).toFixed(2)}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      className='bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full'
                      animate={{ width: `${metrics.fidelity * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-sm mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Entanglement</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-pink-400'>
                      {(metrics.entanglementDegree * 100).toFixed(1)}%
                    </span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      className='bg-gradient-to-r from-pink-400 to-pink-500 h-2 rounded-full'
                      animate={{ width: `${metrics.entanglementDegree * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-sm mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Error Rate</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-red-400'>{(metrics.errorRate * 100).toFixed(3)}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      className='bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full'
                      animate={{ width: `${metrics.errorRate * 100 * 50}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Quantum Predictions */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Target className='w-5 h-5 text-purple-400' />
              Quantum Predictions
            </h4>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {predictions.slice(0, 3).map((prediction, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h5 className='font-bold text-white text-sm'>{prediction.game}</h5>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-purple-400 text-sm'>{prediction.prediction}</p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Badge variant='outline' className='text-gray-400 border-gray-600'>
                      {prediction.sport}
                    </Badge>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Quantum Advantage:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-purple-400 font-bold ml-1'>
                        +{(prediction.quantumAdvantage * 100).toFixed(1)}%
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Confidence:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-green-400 font-bold ml-1'>
                        {prediction.confidence.toFixed(1)}%
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>States:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-cyan-400 font-bold ml-1'>
                        {prediction.quantumStates.toLocaleString()}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Entangled:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-pink-400 font-bold ml-1'>
                        {prediction.entanglements}
                      </span>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='mt-2 text-xs text-gray-400'>
                    Classical: {(prediction.classicalProbability * 100).toFixed(1)}% → Quantum:{' '}
                    {(
                      (prediction.classicalProbability + prediction.quantumAdvantage) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Quantum Status */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Settings className='w-5 h-5 text-blue-400' />
              System Status
            </h4>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3 text-sm'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Quantum Computer</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Badge
                  variant='outline'
                  className={
                    isQuantumActive
                      ? 'text-green-400 border-green-400'
                      : 'text-red-400 border-red-400'
                  }
                >
                  {isQuantumActive ? 'Online' : 'Offline'}
                </Badge>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Algorithm</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-purple-400 font-bold'>{selectedAlgorithm.toUpperCase()}</span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Circuit Depth</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-blue-400 font-bold'>{quantumDepth}</span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Qubits Active</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-cyan-400 font-bold'>
                  {nodes
                    .filter(n => n.type === 'quantum')
                    .reduce((sum, n) => sum + (n.qubits || 0), 0)}
                </span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>Entangled Pairs</span>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-pink-400 font-bold'>
                  {connections.filter(c => c.entanglement).length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
