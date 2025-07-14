import { motion } from 'framer-motion';
import { Activity, Cpu, GitBranch, RotateCcw, Settings, Target } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
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

export const QuantumAI: React.FC = () => {
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
  const generateQuantumNetwork = (): { nodes: QuantumNode[]; connections: QuantumConnection[] } => {
    const networkNodes: QuantumNode[] = [];
    const networkConnections: QuantumConnection[] = [];

    // Input layer
    for (let i = 0; i < 4; i++) {
      networkNodes.push({
        id: `input-${i}`,
        type: 'input',
        position: { x: 50, y: 100 + i * 80 },
        value: Math.random(),
      });
    }

    // Quantum layers
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 6; i++) {
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
    for (let i = 0; i < 4; i++) {
      networkNodes.push({
        id: `neural-${i}`,
        type: 'neural',
        position: { x: 650, y: 100 + i * 80 },
        value: Math.random(),
      });
    }

    // Output layer
    for (let i = 0; i < 2; i++) {
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
        const quantumNodes = networkNodes.filter(n => n.id.startsWith('quantum-0-'));
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
        const layer = parseInt(node.id.split('-')[1]);
        if (layer < 2) {
          const nextLayerNodes = networkNodes.filter(n => n.id.startsWith(`quantum-${layer + 1}-`));
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
          const neuralNodes = networkNodes.filter(n => n.type === 'neural');
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
        const outputNodes = networkNodes.filter(n => n.type === 'output');
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
  const generateQuantumPredictions = (): QuantumPrediction[] => {
    const games = [
      { game: 'Lakers vs Warriors', sport: 'NBA' },
      { game: 'Chiefs vs Bills', sport: 'NFL' },
      { game: 'Celtics vs Heat', sport: 'NBA' },
      { game: 'Yankees vs Red Sox', sport: 'MLB' },
      { game: 'Rangers vs Lightning', sport: 'NHL' },
    ];

    return games.map((g, index) => {
      const classicalProb = 0.5 + (Math.random() - 0.5) * 0.3;
      const quantumAdv = Math.random() * 0.15;

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
  const generateQuantumMetrics = (): QuantumMetrics => ({
    coherenceTime: 50 + Math.random() * 50, // microseconds
    fidelity: 0.95 + Math.random() * 0.04,
    entanglementDegree: Math.random() * 0.8 + 0.2,
    quantumVolume: Math.floor(Math.random() * 64) + 32,
    errorRate: Math.random() * 0.02 + 0.001,
  });

  // Simulate quantum computation
  const runQuantumSimulation = () => {
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
    const interval = setInterval(runQuantumSimulation, 1000 / simulationSpeed);
    return () => clearInterval(interval);
  }, [isQuantumActive, simulationSpeed]);

  const getNodeColor = (node: QuantumNode) => {
    switch (node.type) {
      case 'input':
        return '#3B82F6'; // blue
      case 'quantum':
        if (node.superposition) return '#A855F7'; // purple
        if (node.entangled) return '#06B6D4'; // cyan
        return '#8B5CF6'; // violet
      case 'neural':
        return '#10B981'; // green
      case 'output':
        return '#F59E0B'; // amber
      default:
        return '#6B7280'; // gray
    }
  };

  const getConnectionColor = (connection: QuantumConnection) => {
    if (connection.entanglement) return '#EC4899'; // pink
    return connection.type === 'quantum' ? '#8B5CF6' : '#6B7280';
  };

  const getAlgorithmDescription = (algorithm: string) => {
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
    <div className='space-y-8'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <Card className='p-12 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30'>
          <h1 className='text-5xl font-black bg-gradient-to-r from-purple-400 to-cyan-500 bg-clip-text text-transparent mb-4'>
            QUANTUM AI
          </h1>
          <p className='text-xl text-gray-300 mb-8'>Quantum Computing & Neural Networks</p>

          <div className='flex items-center justify-center gap-8'>
            <motion.div
              animate={{
                rotate: [0, 120, 240, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className='text-purple-500'
            >
              <Cpu className='w-12 h-12' />
            </motion.div>

            <div className='grid grid-cols-4 gap-8 text-center'>
              <div>
                <div className='text-3xl font-bold text-purple-400'>
                  {metrics ? Math.floor(metrics.quantumVolume) : 0}
                </div>
                <div className='text-gray-400'>Quantum Volume</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-cyan-400'>
                  {predictions.reduce((sum, p) => sum + p.quantumStates, 0).toLocaleString()}
                </div>
                <div className='text-gray-400'>Quantum States</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-blue-400'>
                  {predictions.reduce((sum, p) => sum + p.superpositions, 0)}
                </div>
                <div className='text-gray-400'>Superpositions</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-pink-400'>
                  {predictions.reduce((sum, p) => sum + p.entanglements, 0)}
                </div>
                <div className='text-gray-400'>Entanglements</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Controls */}
      <Card className='p-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Quantum Algorithm</label>
            <select
              value={selectedAlgorithm}
              onChange={e => setSelectedAlgorithm(e.target.value as any)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Quantum algorithm'
            >
              <option value='qaoa'>QAOA</option>
              <option value='grover'>Grover's Search</option>
              <option value='shor'>Shor's Algorithm</option>
              <option value='vqe'>VQE</option>
            </select>
            <p className='text-xs text-gray-500 mt-1'>
              {getAlgorithmDescription(selectedAlgorithm)}
            </p>
          </div>

          <div>
            <label className='block text-sm text-gray-400 mb-2'>
              Quantum Depth: {quantumDepth}
            </label>
            <input
              type='range'
              min='4'
              max='16'
              value={quantumDepth}
              onChange={e => setQuantumDepth(parseInt(e.target.value))}
              className='w-full'
              aria-label='Quantum depth'
            />
          </div>

          <div>
            <label className='block text-sm text-gray-400 mb-2'>
              Simulation Speed: {simulationSpeed}x
            </label>
            <input
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

          <div className='flex items-end gap-2'>
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
            <Button
              onClick={() => {
                const { nodes: newNodes, connections: newConnections } = generateQuantumNetwork();
                setNodes(newNodes);
                setConnections(newConnections);
              }}
              variant='outline'
            >
              <RotateCcw className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Quantum Network Visualization */}
        <div className='xl:col-span-2'>
          <Card className='p-6'>
            <h3 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
              <GitBranch className='w-5 h-5 text-purple-400' />
              Quantum Neural Network
            </h3>

            <div
              className='relative bg-slate-800/50 rounded-lg p-4 overflow-hidden'
              style={{ height: '500px' }}
            >
              <svg width='100%' height='100%' className='absolute inset-0'>
                {/* Render connections */}
                {connections.map((connection, index) => {
                  const fromNode = nodes.find(n => n.id === connection.from);
                  const toNode = nodes.find(n => n.id === connection.to);

                  if (!fromNode || !toNode) return null;

                  return (
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
                  <motion.g key={node.id}>
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
              <div className='absolute bottom-4 left-4 space-y-2 text-xs'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                  <span className='text-gray-300'>Input Layer</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-purple-500 rounded-full border-2 border-pink-400'></div>
                  <span className='text-gray-300'>Quantum (Entangled)</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  <span className='text-gray-300'>Neural Processing</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-amber-500 rounded-full'></div>
                  <span className='text-gray-300'>Output Layer</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quantum Metrics & Predictions */}
        <div className='space-y-6'>
          {/* Quantum Metrics */}
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <Activity className='w-5 h-5 text-cyan-400' />
              Quantum Metrics
            </h4>

            {metrics && (
              <div className='space-y-4'>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Coherence Time</span>
                    <span className='text-cyan-400'>{metrics.coherenceTime.toFixed(1)}μs</span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-cyan-400 to-cyan-500 h-2 rounded-full'
                      animate={{ width: `${metrics.coherenceTime}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Fidelity</span>
                    <span className='text-green-400'>{(metrics.fidelity * 100).toFixed(2)}%</span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full'
                      animate={{ width: `${metrics.fidelity * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Entanglement</span>
                    <span className='text-pink-400'>
                      {(metrics.entanglementDegree * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    <motion.div
                      className='bg-gradient-to-r from-pink-400 to-pink-500 h-2 rounded-full'
                      animate={{ width: `${metrics.entanglementDegree * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-400'>Error Rate</span>
                    <span className='text-red-400'>{(metrics.errorRate * 100).toFixed(3)}%</span>
                  </div>
                  <div className='w-full bg-gray-700 rounded-full h-2'>
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
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <Target className='w-5 h-5 text-purple-400' />
              Quantum Predictions
            </h4>

            <div className='space-y-3'>
              {predictions.slice(0, 3).map((prediction, index) => (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <h5 className='font-bold text-white text-sm'>{prediction.game}</h5>
                      <p className='text-purple-400 text-sm'>{prediction.prediction}</p>
                    </div>
                    <Badge variant='outline' className='text-gray-400 border-gray-600'>
                      {prediction.sport}
                    </Badge>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <div>
                      <span className='text-gray-400'>Quantum Advantage:</span>
                      <span className='text-purple-400 font-bold ml-1'>
                        +{(prediction.quantumAdvantage * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-400'>Confidence:</span>
                      <span className='text-green-400 font-bold ml-1'>
                        {prediction.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-400'>States:</span>
                      <span className='text-cyan-400 font-bold ml-1'>
                        {prediction.quantumStates.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-400'>Entangled:</span>
                      <span className='text-pink-400 font-bold ml-1'>
                        {prediction.entanglements}
                      </span>
                    </div>
                  </div>

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
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <Settings className='w-5 h-5 text-blue-400' />
              System Status
            </h4>

            <div className='space-y-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Quantum Computer</span>
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
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Algorithm</span>
                <span className='text-purple-400 font-bold'>{selectedAlgorithm.toUpperCase()}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Circuit Depth</span>
                <span className='text-blue-400 font-bold'>{quantumDepth}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Qubits Active</span>
                <span className='text-cyan-400 font-bold'>
                  {nodes
                    .filter(n => n.type === 'quantum')
                    .reduce((sum, n) => sum + (n.qubits || 0), 0)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-400'>Entangled Pairs</span>
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
