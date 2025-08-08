/**
 * Kelly Calculator Component - Advanced bankroll management tool
 * Implements full and fractional Kelly criterion with risk validation
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Target,
  Info,
  Save,
  History,
  Download
} from 'lucide-react';

interface KellyInputs {
  winProbability: number;   // 0-100%
  odds: number;             // American odds
  bankroll: number;         // Total bankroll amount
  kellyFraction: number;    // 0.1 = 10% Kelly, 1.0 = Full Kelly
  maxBetPercentage: number; // Maximum bet as % of bankroll
}

interface KellyResult {
  optimalBetSize: number;
  optimalBetPercentage: number;
  expectedValue: number;
  expectedReturn: number;
  kellyPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  warnings: string[];
  recommendations: string[];
}

interface BetSession {
  id: string;
  timestamp: string;
  inputs: KellyInputs;
  result: KellyResult;
  actualBet?: number;
  outcome?: 'win' | 'loss' | 'push';
  profit?: number;
}

const DEFAULT_INPUTS: KellyInputs = {
  winProbability: 55,
  odds: -110,
  bankroll: 1000,
  kellyFraction: 0.25, // Quarter Kelly
  maxBetPercentage: 5
};

export const KellyCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<KellyInputs>(DEFAULT_INPUTS);
  const [sessions, setSessions] = useState<BetSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('kelly-sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.warn('Failed to load Kelly sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage
  const saveSessions = useCallback((newSessions: BetSession[]) => {
    setSessions(newSessions);
    localStorage.setItem('kelly-sessions', JSON.stringify(newSessions));
  }, []);

  // Calculate Kelly result
  const kellyResult = useMemo((): KellyResult => {
    const { winProbability, odds, bankroll, kellyFraction, maxBetPercentage } = inputs;
    
    // Convert American odds to decimal
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    const netOdds = decimalOdds - 1; // Net return per dollar
    
    // Convert probability to decimal
    const p = winProbability / 100;
    const q = 1 - p; // Probability of loss
    
    // Calculate Kelly percentage: (bp - q) / b
    // where b = net odds, p = win prob, q = loss prob
    const kellyPercentage = (netOdds * p - q) / netOdds;
    
    // Apply Kelly fraction
    const adjustedKelly = kellyPercentage * kellyFraction;
    
    // Calculate recommended bet size
    let optimalBetPercentage = Math.max(0, adjustedKelly * 100);
    
    // Apply maximum bet limit
    if (optimalBetPercentage > maxBetPercentage) {
      optimalBetPercentage = maxBetPercentage;
    }
    
    const optimalBetSize = (optimalBetPercentage / 100) * bankroll;
    
    // Calculate expected value
    const expectedValue = (p * netOdds - q) * optimalBetSize;
    const expectedReturn = (expectedValue / optimalBetSize) * 100;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    if (optimalBetPercentage > 10) riskLevel = 'extreme';
    else if (optimalBetPercentage > 5) riskLevel = 'high';
    else if (optimalBetPercentage > 2) riskLevel = 'medium';
    
    // Generate warnings and recommendations
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    if (kellyPercentage <= 0) {
      warnings.push('Negative expected value - this bet is not recommended');
    }
    
    if (winProbability < 52 && odds > -120) {
      warnings.push('Low win probability with poor odds');
    }
    
    if (optimalBetPercentage > 10) {
      warnings.push('Very high bet size - consider reducing Kelly fraction');
    }
    
    if (kellyFraction > 0.5) {
      warnings.push('High Kelly fraction increases volatility significantly');
    }
    
    if (kellyPercentage > 0 && optimalBetSize < 10) {
      recommendations.push('Bet size may be too small for meaningful profit');
    }
    
    if (riskLevel === 'low') {
      recommendations.push('Conservative sizing - good for long-term growth');
    }
    
    if (kellyFraction < 0.5 && kellyPercentage > 0.05) {
      recommendations.push('Consider increasing Kelly fraction for higher edge opportunities');
    }
    
    return {
      optimalBetSize: Math.round(optimalBetSize * 100) / 100,
      optimalBetPercentage: Math.round(optimalBetPercentage * 100) / 100,
      expectedValue: Math.round(expectedValue * 100) / 100,
      expectedReturn: Math.round(expectedReturn * 100) / 100,
      kellyPercentage: Math.round(kellyPercentage * 10000) / 100,
      riskLevel,
      warnings,
      recommendations
    };
  }, [inputs]);

  // Save current calculation as session
  const saveSession = useCallback(() => {
    const session: BetSession = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      inputs: { ...inputs },
      result: { ...kellyResult }
    };

    const newSessions = [session, ...sessions.slice(0, 49)]; // Keep last 50
    saveSessions(newSessions);

    // Try to save to backend but don't block on failure
    try {
      fetch('/v1/risk/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelly_inputs: inputs,
          actual_bet_size: null,
          outcome: null,
          profit_loss: null
        }),
        signal: AbortSignal.timeout(1000)
      }).catch(() => {
        // Silently handle backend unavailability
        console.log('[KellyCalculator] Backend unavailable, session saved locally only');
      });
    } catch (err) {
      // Silently continue with local storage only
    }
  }, [inputs, kellyResult, sessions, saveSessions]);

  // Update session with actual bet outcome
  const updateSessionOutcome = useCallback((
    sessionId: string, 
    actualBet: number, 
    outcome: 'win' | 'loss' | 'push'
  ) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        let profit = 0;
        if (outcome === 'win') {
          const decimalOdds = session.inputs.odds > 0 
            ? (session.inputs.odds / 100) + 1 
            : (100 / Math.abs(session.inputs.odds)) + 1;
          profit = actualBet * (decimalOdds - 1);
        } else if (outcome === 'loss') {
          profit = -actualBet;
        }
        
        return {
          ...session,
          actualBet,
          outcome,
          profit
        };
      }
      return session;
    });
    
    saveSessions(updatedSessions);
  }, [sessions, saveSessions]);

  // Export sessions to CSV
  const exportSessionsCSV = useCallback(() => {
    const headers = [
      'Date',
      'Win Probability',
      'Odds',
      'Bankroll',
      'Kelly Fraction',
      'Recommended Bet',
      'Actual Bet',
      'Outcome',
      'Profit/Loss',
      'Expected Value'
    ];

    const csvContent = [
      headers.join(','),
      ...sessions.map(session => [
        new Date(session.timestamp).toLocaleDateString(),
        session.inputs.winProbability + '%',
        session.inputs.odds,
        '$' + session.inputs.bankroll,
        (session.inputs.kellyFraction * 100) + '%',
        '$' + session.result.optimalBetSize,
        session.actualBet ? '$' + session.actualBet : '',
        session.outcome || '',
        session.profit ? '$' + session.profit.toFixed(2) : '',
        '$' + session.result.expectedValue.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kelly-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessions]);

  // Calculate session statistics
  const sessionStats = useMemo(() => {
    const completedSessions = sessions.filter(s => s.outcome && s.profit !== undefined);
    
    if (completedSessions.length === 0) {
      return {
        totalSessions: 0,
        winRate: 0,
        totalProfit: 0,
        averageProfit: 0,
        roiPercentage: 0
      };
    }

    const wins = completedSessions.filter(s => s.outcome === 'win').length;
    const totalProfit = completedSessions.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalBet = completedSessions.reduce((sum, s) => sum + (s.actualBet || 0), 0);

    return {
      totalSessions: completedSessions.length,
      winRate: (wins / completedSessions.length) * 100,
      totalProfit,
      averageProfit: totalProfit / completedSessions.length,
      roiPercentage: totalBet > 0 ? (totalProfit / totalBet) * 100 : 0
    };
  }, [sessions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Kelly Criterion Calculator</h1>
              <p className="text-slate-300">Optimal bet sizing for long-term growth</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={saveSession}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Calculator Inputs</h3>
            </div>

            <div className="space-y-6">
              {/* Win Probability */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Win Probability: {inputs.winProbability}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="99"
                  step="0.1"
                  value={inputs.winProbability}
                  onChange={(e) => setInputs(prev => ({ 
                    ...prev, 
                    winProbability: parseFloat(e.target.value) 
                  }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1%</span>
                  <span>50%</span>
                  <span>99%</span>
                </div>
              </div>

              {/* Odds */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  American Odds
                </label>
                <input
                  type="number"
                  value={inputs.odds}
                  onChange={(e) => setInputs(prev => ({ 
                    ...prev, 
                    odds: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., -110, +150"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Negative odds (favorites): -110, -150 | Positive odds (underdogs): +120, +200
                </p>
              </div>

              {/* Bankroll */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Bankroll ($)
                </label>
                <input
                  type="number"
                  value={inputs.bankroll}
                  onChange={(e) => setInputs(prev => ({ 
                    ...prev, 
                    bankroll: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000"
                />
              </div>

              {/* Kelly Fraction */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kelly Fraction: {(inputs.kellyFraction * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={inputs.kellyFraction}
                  onChange={(e) => setInputs(prev => ({ 
                    ...prev, 
                    kellyFraction: parseFloat(e.target.value) 
                  }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10% (Conservative)</span>
                  <span>25% (Moderate)</span>
                  <span>100% (Full Kelly)</span>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Info className="w-4 h-4" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Maximum Bet Percentage: {inputs.maxBetPercentage}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={inputs.maxBetPercentage}
                        onChange={(e) => setInputs(prev => ({ 
                          ...prev, 
                          maxBetPercentage: parseFloat(e.target.value) 
                        }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Recommended Bet Size</h3>
            </div>

            {/* Main Result */}
            <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  ${kellyResult.optimalBetSize.toLocaleString()}
                </div>
                <div className="text-lg text-slate-300">
                  {kellyResult.optimalBetPercentage}% of bankroll
                </div>
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm mt-3 ${
                  kellyResult.riskLevel === 'low' ? 'bg-green-900/50 text-green-300' :
                  kellyResult.riskLevel === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                  kellyResult.riskLevel === 'high' ? 'bg-orange-900/50 text-orange-300' :
                  'bg-red-900/50 text-red-300'
                }`}>
                  {kellyResult.riskLevel.charAt(0).toUpperCase() + kellyResult.riskLevel.slice(1)} Risk
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">Expected Value</span>
                </div>
                <div className="text-xl font-bold text-white">
                  ${kellyResult.expectedValue >= 0 ? '+' : ''}{kellyResult.expectedValue}
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">Expected Return</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {kellyResult.expectedReturn >= 0 ? '+' : ''}{kellyResult.expectedReturn.toFixed(2)}%
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-slate-300">Kelly %</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {kellyResult.kellyPercentage.toFixed(2)}%
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">Fraction Used</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {(inputs.kellyFraction * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Warnings */}
            {kellyResult.warnings.length > 0 && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-300 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Warnings</span>
                </div>
                <ul className="text-sm text-red-200 space-y-1">
                  {kellyResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {kellyResult.recommendations.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Recommendations</span>
                </div>
                <ul className="text-sm text-blue-200 space-y-1">
                  {kellyResult.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Session History */}
        {showHistory && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Session History</h3>
              </div>
              <div className="flex items-center gap-3">
                {sessions.length > 0 && (
                  <button
                    onClick={exportSessionsCSV}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Session Statistics */}
            {sessionStats.totalSessions > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{sessionStats.totalSessions}</div>
                  <div className="text-xs text-slate-400">Total Bets</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{sessionStats.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-slate-400">Win Rate</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${sessionStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${sessionStats.totalProfit >= 0 ? '+' : ''}{sessionStats.totalProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400">Total P&L</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${sessionStats.averageProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${sessionStats.averageProfit >= 0 ? '+' : ''}{sessionStats.averageProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400">Avg P&L</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${sessionStats.roiPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sessionStats.roiPercentage >= 0 ? '+' : ''}{sessionStats.roiPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400">ROI</div>
                </div>
              </div>
            )}

            {/* Sessions List */}
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No saved sessions yet</p>
                <p className="text-sm text-slate-500 mt-2">Click "Save" to track your Kelly calculations</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Probability</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Odds</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Recommended</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Expected Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Outcome</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {sessions.slice(0, 10).map((session) => (
                      <tr key={session.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300">
                          {session.inputs.winProbability}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-mono">
                          {session.inputs.odds > 0 ? '+' : ''}{session.inputs.odds}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                          ${session.result.optimalBetSize} ({session.result.optimalBetPercentage}%)
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-400">
                          ${session.result.expectedValue >= 0 ? '+' : ''}{session.result.expectedValue}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {session.outcome ? (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              session.outcome === 'win' ? 'bg-green-900/50 text-green-300' :
                              session.outcome === 'loss' ? 'bg-red-900/50 text-red-300' :
                              'bg-gray-900/50 text-gray-300'
                            }`}>
                              {session.outcome.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {session.profit !== undefined ? (
                            <span className={session.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                              ${session.profit >= 0 ? '+' : ''}{session.profit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 text-xs text-slate-500 bg-slate-800/30 rounded-lg p-4">
          <p className="font-semibold mb-2">⚠️ Important Risk Disclaimers:</p>
          <ul className="space-y-1">
            <li>• The Kelly Criterion is a mathematical model based on historical probabilities</li>
            <li>• Past performance does not guarantee future results</li>
            <li>• Never bet money you cannot afford to lose (18+/21+ depending on jurisdiction)</li>
            <li>• Consider using fractional Kelly to reduce volatility and drawdown risk</li>
            <li>• Bankroll management is crucial for long-term success</li>
            <li>• Seek professional advice if gambling becomes problematic: 1-800-522-4700</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KellyCalculator;
