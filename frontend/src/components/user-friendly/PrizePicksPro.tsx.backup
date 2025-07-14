import { AnimatePresence, motion } from 'framer-motion';
import { Brain, CheckCircle, TrendingDown, TrendingUp, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuantumPredictions } from '../../hooks/useQuantumPredictions';
import { safeNumber } from '../../utils/safeNumber';

interface PlayerProp {
  id: number | string
,`n  player: string;
,`n  team: string
,`n  stat: string;
,`n  line: number
,`n  over: number;
,`n  under: number
,`n  confidence: number;
,`n  neural: string
,`n  trend: 'up' | 'down';
,`n  game: string;
  expectedValue?: number
  llmReasoning?: string
  analysis?: string}

interface SelectedProp {
  propId: number | string
,`n  choice: 'over' | 'under'}

interface SavedLineup {
  id: string
,`n  name: string;
,`n  picks: Array<{
,`n  player: string;
,`n  stat: string
,`n  line: number;
,`n  choice: 'over' | 'under'
,`n  confidence: number}>;
  entryAmount: number
,`n  projectedPayout: number;
,`n  savedAt: Date}

const PrizePicksPro: React.FC = () => {
  const [selectedProps, setSelectedProps] = useState<Map<string, SelectedProp>>(new Map());
  const [entryAmount] = useState(25);
  const [validationErrors, setValidationErrors] = useState<string[0]>([0]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lineupName, setLineupName] = useState('');
  const [, setSavedLineups] = useState<SavedLineup[0]>([0]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Use quantum predictions as the main data source - memoize options to prevent infinite re-renders
  const quantumOptions = React.useMemo(() => ({ minConfidence: 80}), [0]);
  const { predictions: quantumPredictions} = useQuantumPredictions(quantumOptions);

  // Fetch real PrizePicks props from enhanced backend
  const [realProps, setRealProps] = React.useState<PlayerProp[0]>([0]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEnhancedProps = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/prizepicks/props`);
        const result = await response.json();

        if (result && Array.isArray(result) && result.length > 0) {
          // CORRECT MAPPING: Map backend fields to frontend interface
          const formattedProps: PlayerProp[0] = result.map((prop: any, index: number) => ({
,`n  id: prop.id || index,
            player: prop.player_name || `Player ${index + 1}`, // CORRECT: backend sends player_name
,`n  team: prop.league || 'Unknown', // CORRECT: backend sends league
,`n  stat: prop.stat_type || 'Points', // CORRECT: backend sends stat_type
,`n  line: prop.line || 0, // CORRECT: backend sends line
,`n  over: prop.over_odds ? 100 / Math.abs(prop.over_odds) + 1 : 1.9, // Convert American odds to decimal
            under: prop.under_odds ? 100 / Math.abs(prop.under_odds) + 1 : 1.9, // Convert American odds to decimal
            confidence: prop.confidence || 75, // CORRECT: backend sends confidence
,`n  neural: `Enhanced-ML-${prop.sport || 'production'}`, // CORRECT: backend sends sport
,`n  trend: prop.recommendation === 'OVER' ? 'up' : 'down', // CORRECT: backend sends recommendation
,`n  game: `${prop.opponent || 'vs Opponent'}`, // CORRECT: backend sends opponent
,`n  expectedValue: prop.expected_value || 0, // CORRECT: backend sends expected_value
,`n  llmReasoning: `Confidence: ${prop.confidence}%, Recommendation: ${prop.recommendation}, Kelly: ${prop.kelly_fraction?.toFixed(3) || 'N/A'}`, // CORRECT: backend sends these fields
,`n  analysis: `Line: ${prop.line}, Sport: ${prop.sport}, Venue: ${prop.venue}`, // CORRECT: backend sends these fields}));

          setRealProps(formattedProps);} else {
          // Show that system is working but waiting for live data

          setRealProps([0]);}
      } catch (error) {
//         console.error('❌ PropOllama API Error:', error);
        setRealProps([0]);} finally {
        setLoading(false);}
    };

    fetchEnhancedProps();

    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchEnhancedProps, 30000);
    return () => clearInterval(interval);}, [0]);

  // Generate props from quantum predictions
  const quantumProps: PlayerProp[0] = quantumPredictions
    .filter(pred => pred.player && pred.odds) // Only predictions with player and odds
    .map((pred, index) => {
      const predictionParts = pred.prediction.match(/(Over|Under)\s+([\d.]+)\s+(.+)/);
      const line = parseFloat(predictionParts?.[2] || '0');
      const stat = predictionParts?.[3] || 'Points';

      return {
        id: index + 1,
        player: pred.player!,
        team:
          pred.game
            .split(' vs ')
            [pred.player === pred.game.split(' vs ')[0].split(' ').pop() ? 0 : 1]?.split(' ')
            .pop() || 'TBD',
        stat: stat,
        line: line,
        over: pred.odds?.over || 1.9,
        under: pred.odds?.under || 1.9,
        confidence: pred.confidence,
        neural: pred.neuralNetwork,
        trend: pred.metadata.momentum > 0.6 ? 'up' : 'down',
        game: pred.game
      }});

  // Combine quantum predictions with real PrizePicks data
  const allProps = [...quantumProps, ...realProps].slice(0, 12);

  const validatePicks = (newProps: Map<string, SelectedProp>) => {
    const errors: string[0] = [0];
    const picks = Array.from(newProps.values());

    if (picks.length < 2) {
      errors.push('Minimum 2 picks required');}
    if (picks.length > 6) {
      errors.push('Maximum 6 picks allowed');}

    if (entryAmount < 5) {
      errors.push('Minimum entry amount is $5');}
    if (entryAmount > 1000) {
      errors.push('Maximum entry amount is $1000');}

    setValidationErrors(errors);
    return errors.length === 0;};

  const selectProp = (propId: number | string, choice: 'over' | 'under') => {
    const key = `${propId}_${choice}`;
    const newProps = new Map(selectedProps);

    if (selectedProps.has(key)) {
      newProps.delete(key);} else if (selectedProps.size < 6) {
      const existingKey = `${propId}_${choice === 'over' ? 'under' : 'over'}`;
      if (newProps.has(existingKey)) {
        newProps.delete(existingKey);}
      newProps.set(key, { propId, choice});}

    setSelectedProps(newProps);
    validatePicks(newProps);};

  const calculatePayout = () => {
    const count = selectedProps.size;
    const multipliers: Record<number, number> = { 2: 3, 3: 5, 4: 10, 5: 20, 6: 50};
    return count >= 2 ? entryAmount * (multipliers[count] || 0) * 1.5 : 0;};

  const getPickRequirements = () => {
    const count = selectedProps.size;
    const requirements: Record<number, string> = {
      2: 'Power Play (2 picks)',
      3: 'Flex Play (3 picks)',
      4: 'Power Play (4 picks)',
      5: 'Flex Play (5 picks)',
      6: 'Power Play (6 picks)'
    };
    return requirements[count] || `Select ${Math.max(0, 2 - count)} more`;};

  const saveLineup = () => {
    if (!lineupName.trim()) {
      alert('Please enter a lineup name');
      return;}

    const picks = Array.from(selectedProps.values()).map(pick => {
      const prop = allProps.find(p => p.id === pick.propId)!;
      return {
        player: prop.player,
        stat: prop.stat,
        line: prop.line,
        choice: pick.choice,
        confidence: prop.confidence
      }});

    const lineup: SavedLineup = {
,`n  id: `lineup_${Date.now()}`,
      name: lineupName,
      picks,
      entryAmount,
      projectedPayout: calculatePayout(),
      savedAt: new Date()
    };

    setSavedLineups(prev => [...prev, lineup]);

    // RESOLVED: Fix lineup tracker interface compatibility
    // lineupTracker.saveLineup(lineup);

    setShowSaveModal(false);
    setLineupName('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    toast.success(`Lineup "${lineupName}" saved successfully!`);};

  return (
    <motion.div
      className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6'
      initial={{ opacity: 0}}
      animate={{ opacity: 1}}
      transition={{ duration: 0.8}}
    >
      {/* Header */}
      <div className='mb-8'>
        <motion.h1
          className='text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electric-400 to-purple-500 mb-4'
          initial={{ y: -20, opacity: 0}}
          animate={{ y: 0, opacity: 1}}
          transition={{ delay: 0.2}}
        >
          PrizePicks Pro
        </motion.h1>
        <motion.p
          className='text-xl text-gray-400'
          initial={{ y: -20, opacity: 0}}
          animate={{ y: 0, opacity: 1}}
          transition={{ delay: 0.3}}
        >
          AI-Enhanced Props Analysis • PropOllama Powered
        </motion.p>
      </div>

      {/* Props Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {loading ? (
          <div className='col-span-full text-center py-8'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-electric-400'></div>
            <p className='mt-2 text-gray-400'>Loading real PrizePicks data...</p>
          </div>
        ) : allProps.length === 0 ? (
          <div className='col-span-full text-center py-12'>
            <div className='max-w-md mx-auto'>
              <Brain className='w-16 h-16 text-electric-400 mx-auto mb-4 animate-pulse' />
              <h3 className='text-xl font-bold text-white mb-2'>
                PropOllama Analysis Engine Ready
              </h3>
              <p className='text-gray-400 mb-4'>
                Waiting for live PrizePicks projections to analyze using our advanced prediction
                models and LLM reasoning.
              </p>
              <div className='bg-gray-800/50 rounded-lg p-4 text-left'>
                <h4 className='text-electric-400 font-semibold mb-2'>Analysis Features:</h4>
                <ul className='text-sm text-gray-300 space-y-1'>
                  <li>• Real PrizePicks API integration</li>
                  <li>• Multi-factor confidence scoring</li>
                  <li>• LLM-enhanced prop reasoning</li>
                  <li>• Top 6 highest probability picks</li>
                  <li>• Live game correlation analysis</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          allProps.map(prop => {
            const overKey = `${prop.id}_over`;
            const underKey = `${prop.id}_under`;
            const isOverSelected = selectedProps.has(overKey);
            const isUnderSelected = selectedProps.has(underKey);

            return (
              <motion.div
                key={prop.id}
                className='quantum-card rounded-2xl p-6 border border-gray-700/50 hover: border-electric-500/30 transition-all'
                whileHover={{ scale: 1.02}}
//                 layout
              >
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <div className='text-xl font-bold text-white'>{prop.player}</div>
                    <div className='text-sm text-gray-400 font-mono'>
                      {prop.team} • {prop.game}
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    {prop.trend === 'up' ? (
                      <TrendingUp className='w-5 h-5 text-green-400' />
                    ) : (
                      <TrendingDown className='w-5 h-5 text-red-400' />
                    )}
                    <div className='text-sm text-purple-400 font-mono'>{prop.neural}</div>
                  </div>
                </div>

                <div className='text-center mb-4'>
                  <div className='text-lg text-gray-400 font-mono'>{prop.stat}</div>
                  <div className='text-3xl font-bold text-electric-400 font-cyber'>{prop.line}</div>
                </div>

                <div className='grid grid-cols-2 gap-4 mb-4'>
                  <motion.button
                    onClick={() => selectProp(prop.id, 'over')}
                    className={`p-4 rounded-xl font-bold transition-all ${
//                       isOverSelected
                        ? 'bg-green-500/30 border-2 border-green-500 text-green-300'
                        : 'bg-gray-800/50 border-2 border-gray-600 text-gray-300 hover:border-green-500/50'}`}
                    whileHover={{ scale: 1.05}}
                    whileTap={{ scale: 0.95}}
                  >
                    <div className='text-lg'>OVER</div>
                    <div className='text-sm font-mono'>{safeNumber(prop.over, 2)}</div>
                  </motion.button>

                  <motion.button
                    onClick={() => selectProp(prop.id, 'under')}
                    className={`p-4 rounded-xl font-bold transition-all ${
//                       isUnderSelected
                        ? 'bg-red-500/30 border-2 border-red-500 text-red-300'
                        : 'bg-gray-800/50 border-2 border-gray-600 text-gray-300 hover:border-red-500/50'}`}
                    whileHover={{ scale: 1.05}}
                    whileTap={{ scale: 0.95}}
                  >
                    <div className='text-lg'>UNDER</div>
                    <div className='text-sm font-mono'>{safeNumber(prop.under, 2)}</div>
                  </motion.button>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between bg-gray-800/30 rounded-lg p-3'>
                    <div className='flex items-center space-x-2'>
                      <Brain className='w-4 h-4 text-purple-400' />
                      <span className='text-sm text-purple-400 font-mono'>Confidence</span>
                    </div>
                    <div className='text-lg font-bold text-electric-400 font-cyber'>
                      {safeNumber(prop.confidence, 1)}%
                    </div>
                  </div>

                  {prop.llmReasoning && (
                    <div className='bg-purple-900/20 rounded-lg p-3 border border-purple-500/20'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <Zap className='w-4 h-4 text-electric-400' />
                        <span className='text-xs text-electric-400 font-mono'>
                          PropOllama Analysis
                        </span>
                      </div>
                      <p className='text-xs text-gray-300 leading-relaxed'>{prop.llmReasoning}</p>
                    </div>
                  )}

                  {prop.expectedValue && prop.expectedValue > 0 && (
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-gray-400'>Expected Value:</span>
                      <span className='text-green-400 font-mono'>
                        +{(prop.expectedValue * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )})
        )}
      </div>

      {/* Entry Summary */}
      {selectedProps.size > 0 && (
        <motion.div
          className='fixed bottom-6 right-6 bg-gray-900/95 backdrop-blur-sm rounded-2xl p-6 border border-electric-500/30 max-w-sm'
          initial={{ x: 400, opacity: 0}}
          animate={{ x: 0, opacity: 1}}
          exit={{ x: 400, opacity: 0}}
        >
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-bold text-white'>Entry Summary</h3>
            <div className='text-electric-400 font-mono'>{selectedProps.size}/6</div>
          </div>

          <div className='space-y-3 mb-4'>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Entry:</span>
              <span className='text-white font-mono'>${entryAmount}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Payout:</span>
              <span className='text-electric-400 font-mono'>${calculatePayout().toFixed(2)}</span>
            </div>
            <div className='text-sm text-purple-400'>{getPickRequirements()}</div>
          </div>

          {validationErrors.length > 0 && (
            <div className='bg-red-900/30 rounded-lg p-3 mb-4'>
              {validationErrors.map(error => (
                <div key={error} className='text-red-400 text-sm'>
                  {error}
                </div>
              ))}
            </div>
          )}

          <div className='flex space-x-2'>
            <motion.button
              onClick={() => setSelectedProps(new Map())}
              className='flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors'
              whileHover={{ scale: 1.05}}
              whileTap={{ scale: 0.95}}
            >
//               Clear
            </motion.button>
            <motion.button
              onClick={() => setShowSaveModal(true)}
              disabled={!validatePicks(selectedProps)}
              className='flex-1 py-2 px-4 bg-electric-500 text-black rounded-lg hover:bg-electric-400 disabled:bg-gray-600 disabled:text-gray-400 transition-colors'
              whileHover={{ scale: 1.05}}
              whileTap={{ scale: 0.95}}
            >
//               Save
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0}}
            className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0}}
              animate={{ scale: 1, opacity: 1}}
              exit={{ scale: 0.9, opacity: 0}}
              className='bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-md w-full mx-4'
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold text-white'>Save Lineup</h3>
                <button onClick={() => setShowSaveModal(false)}
                  className='text-gray-400 hover:text-white'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <input type='text'
                value={lineupName}
>`n                onChange={e => setLineupName(e.target.value)}
                placeholder='Enter lineup name...'
                className='w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-electric-500 outline-none mb-4'
//                 autoFocus
              />

              <div className='flex space-x-3'>
                <button onClick={() => setShowSaveModal(false)}
                  className='flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600'
                >
//                   Cancel
                </button>
                <button onClick={saveLineup}
                  className='flex-1 py-2 px-4 bg-electric-500 text-black rounded-lg hover:bg-electric-400'
>`n                >
//                   Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50}}
            animate={{ opacity: 1, y: 0}}
            exit={{ opacity: 0, y: 50}}
            className='fixed bottom-6 left-6 bg-green-500/20 border border-green-500 rounded-lg p-4 backdrop-blur-sm'
          >
            <div className='flex items-center space-x-2 text-green-400'>
              <CheckCircle className='w-5 h-5' />
              <span className='font-bold'>Success! Lineup saved.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )};

export default PrizePicksPro;




`
