import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Calculator, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface ConfidenceFactors {
  sampleSize: number;
  recentForm: number;
  matchupHistory: number;
  parkFactors: number;
  weatherConditions: number;
  injuryStatus: number;
  restDays: number;
  situationalStats: number;
}

interface EVCalculation {
  probability: number;
  impliedProbability: number;
  odds: number;
  expectedValue: number;
  edge: number;
  recommendation: 'STRONG_BET' | 'WEAK_BET' | 'AVOID' | 'NO_PLAY';
}

interface ConfidenceScore {
  overall: number;
  factors: ConfidenceFactors;
  evCalculation: EVCalculation;
  reasoning: string[];
  warnings: string[];
}

const ConfidenceScoreCalculator: React.FC<{
  playerName: string;
  propType: string;
  line: number;
  odds: number;
  recentStats: any[];
  onScoreCalculated?: (score: ConfidenceScore) => void;
}> = ({ playerName, propType, line, odds, recentStats, onScoreCalculated }) => {
  const [confidenceScore, setConfidenceScore] = useState<ConfidenceScore | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (playerName && propType && line && odds) {
      calculateConfidenceScore();
    }
  }, [playerName, propType, line, odds, recentStats]);

  const calculateConfidenceScore = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Calculate individual confidence factors
      const factors = calculateConfidenceFactors();
      
      // Calculate overall confidence (weighted average)
      const weights = {
        sampleSize: 0.20,
        recentForm: 0.18,
        matchupHistory: 0.15,
        parkFactors: 0.12,
        weatherConditions: 0.08,
        injuryStatus: 0.10,
        restDays: 0.07,
        situationalStats: 0.10
      };
      
      const overall = Object.entries(factors).reduce((sum, [key, value]) => {
        return sum + (value * weights[key as keyof typeof weights]);
      }, 0);
      
      // Calculate EV
      const evCalc = calculateExpectedValue(overall, odds);
      
      // Generate reasoning and warnings
      const reasoning = generateReasoning(factors, evCalc);
      const warnings = generateWarnings(factors, evCalc);
      
      const score: ConfidenceScore = {
        overall: Math.round(overall),
        factors,
        evCalculation: evCalc,
        reasoning,
        warnings
      };
      
      setConfidenceScore(score);
      onScoreCalculated?.(score);
      
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateConfidenceFactors = (): ConfidenceFactors => {
    // Mock calculation based on available data
    // In production, this would use actual statistical models
    
    const sampleSize = Math.min(100, (recentStats.length / 20) * 100);
    const recentForm = 70 + Math.random() * 25; // 70-95 range
    const matchupHistory = 60 + Math.random() * 30; // 60-90 range
    const parkFactors = 65 + Math.random() * 25; // 65-90 range
    const weatherConditions = 80 + Math.random() * 15; // 80-95 range
    const injuryStatus = Math.random() > 0.8 ? 40 + Math.random() * 30 : 85 + Math.random() * 15;
    const restDays = 75 + Math.random() * 20; // 75-95 range
    const situationalStats = 65 + Math.random() * 25; // 65-90 range
    
    return {
      sampleSize,
      recentForm,
      matchupHistory,
      parkFactors,
      weatherConditions,
      injuryStatus,
      restDays,
      situationalStats
    };
  };

  const calculateExpectedValue = (confidence: number, odds: number): EVCalculation => {
    // Convert American odds to decimal
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    
    // Calculate implied probability from odds
    const impliedProbability = 1 / decimalOdds;
    
    // Calculate true probability based on confidence score
    // This is a simplified model - in production, you'd use more sophisticated calculations
    const trueProbability = (confidence / 100) * 0.7 + 0.15; // Scale confidence to probability range
    
    // Calculate expected value
    const expectedValue = (trueProbability * (decimalOdds - 1)) - (1 - trueProbability);
    const evPercentage = expectedValue * 100;
    
    // Calculate edge
    const edge = trueProbability - impliedProbability;
    const edgePercentage = edge * 100;
    
    // Determine recommendation
    let recommendation: EVCalculation['recommendation'];
    if (evPercentage > 8 && confidence > 75) {
      recommendation = 'STRONG_BET';
    } else if (evPercentage > 3 && confidence > 60) {
      recommendation = 'WEAK_BET';
    } else if (evPercentage < -5 || confidence < 40) {
      recommendation = 'AVOID';
    } else {
      recommendation = 'NO_PLAY';
    }
    
    return {
      probability: trueProbability,
      impliedProbability,
      odds,
      expectedValue: evPercentage,
      edge: edgePercentage,
      recommendation
    };
  };

  const generateReasoning = (factors: ConfidenceFactors, ev: EVCalculation): string[] => {
    const reasoning = [];
    
    if (factors.recentForm > 80) {
      reasoning.push(`Strong recent form (${factors.recentForm.toFixed(1)}%) supports the over`);
    } else if (factors.recentForm < 50) {
      reasoning.push(`Poor recent form (${factors.recentForm.toFixed(1)}%) suggests caution`);
    }
    
    if (factors.matchupHistory > 75) {
      reasoning.push(`Favorable historical matchup data (${factors.matchupHistory.toFixed(1)}%)`);
    }
    
    if (factors.sampleSize < 60) {
      reasoning.push(`Limited sample size reduces confidence`);
    } else if (factors.sampleSize > 80) {
      reasoning.push(`Strong sample size (${factors.sampleSize.toFixed(1)}%) increases reliability`);
    }
    
    if (ev.edge > 5) {
      reasoning.push(`Significant edge detected (+${ev.edge.toFixed(1)}%)`);
    }
    
    if (factors.parkFactors > 80) {
      reasoning.push(`Park factors strongly favor this prop`);
    }
    
    return reasoning;
  };

  const generateWarnings = (factors: ConfidenceFactors, ev: EVCalculation): string[] => {
    const warnings = [];
    
    if (factors.injuryStatus < 60) {
      warnings.push(`Player has injury concerns - monitor status`);
    }
    
    if (factors.sampleSize < 40) {
      warnings.push(`Very limited sample size - high variance expected`);
    }
    
    if (ev.expectedValue < -3) {
      warnings.push(`Negative expected value - consider avoiding`);
    }
    
    if (factors.weatherConditions < 50) {
      warnings.push(`Weather conditions may negatively impact performance`);
    }
    
    return warnings;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 65) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getEVColor = (ev: number) => {
    if (ev > 5) return 'text-green-400';
    if (ev > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'STRONG_BET': return 'text-green-400 bg-green-500/20';
      case 'WEAK_BET': return 'text-yellow-400 bg-yellow-500/20';
      case 'AVOID': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  if (isCalculating) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
        <div className="flex items-center justify-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full"
          />
          <span className="text-cyan-100">Calculating confidence score...</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-slate-400">Analyzing recent performance trends...</div>
          <div className="text-sm text-slate-400">Evaluating matchup history...</div>
          <div className="text-sm text-slate-400">Calculating expected value...</div>
        </div>
      </div>
    );
  }

  if (!confidenceScore) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30">
        <div className="text-center text-slate-400">
          <Calculator className="w-8 h-8 mx-auto mb-2" />
          <p>Enter player and prop details to calculate confidence score</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-6 border border-cyan-800/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-cyan-100 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Confidence Analysis
          </h3>
          <p className="text-slate-400">{playerName} - {propType} {line}</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getConfidenceColor(confidenceScore.overall)}`}>
            {confidenceScore.overall}%
          </div>
          <div className="text-sm text-slate-400">Overall Confidence</div>
        </div>
      </div>

      {/* Expected Value Card */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getEVColor(confidenceScore.evCalculation.expectedValue)}`}>
              {confidenceScore.evCalculation.expectedValue > 0 ? '+' : ''}
              {confidenceScore.evCalculation.expectedValue.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400">Expected Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {confidenceScore.evCalculation.edge > 0 ? '+' : ''}
              {confidenceScore.evCalculation.edge.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400">Edge</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {(confidenceScore.evCalculation.probability * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400">True Probability</div>
          </div>
          <div className="text-center">
            <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${getRecommendationColor(confidenceScore.evCalculation.recommendation)}`}>
              {confidenceScore.evCalculation.recommendation.replace('_', ' ')}
            </div>
            <div className="text-sm text-slate-400 mt-1">Recommendation</div>
          </div>
        </div>
      </div>

      {/* Confidence Factors */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-cyan-100 mb-3 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Confidence Factors
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(confidenceScore.factors).map(([key, value]) => (
            <div key={key} className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-sm text-slate-400 mb-1">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </div>
              <div className={`text-lg font-bold ${getConfidenceColor(value)}`}>
                {value.toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      {confidenceScore.reasoning.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-cyan-100 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Key Insights
          </h4>
          <div className="space-y-2">
            {confidenceScore.reasoning.map((reason, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-cyan-100">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {confidenceScore.warnings.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risk Factors
          </h4>
          <div className="space-y-2">
            {confidenceScore.warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-yellow-100">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>Track This Bet</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Info className="w-4 h-4" />
          <span>Detailed Analysis</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ConfidenceScoreCalculator;
