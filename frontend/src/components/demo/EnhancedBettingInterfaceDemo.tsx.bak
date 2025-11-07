/**
 * Enhanced Betting Interface Demo
 * Demonstrates integration of PayoutPreview, SmartControlsBar, and EnhancedGlobalErrorBoundary
 */

import React, { useState, useCallback } from 'react';

// Types for the demo
interface RiskProfile {
  id: string;
  name: string;
  description: string;
  kellyFraction: number;
  maxBankrollPercent: number;
  confidenceThreshold: number;
  color: string;
  icon: string;
}

interface BankrollSettings {
  totalBankroll: number;
  maxDailyRisk: number;
  maxSingleBet: number;
  stopLossThreshold: number;
}

interface Bet {
  id: string;
  gameId: string;
  playerName: string;
  propType: string;
  line: number;
  odds: number;
  stake: number;
  sport: string;
  confidence?: number;
  prediction?: number;
  projectedValue?: number;
}
import PayoutPreview from '../betting/PayoutPreview';
import SmartControlsBar from '../controls/SmartControlsBar';
import EnhancedGlobalErrorBoundary from '../error/EnhancedGlobalErrorBoundary';

// Sample bet data for demonstration
const sampleBets = [
  {
    id: '1',
    gameId: 'mlb_001',
    playerName: 'Mike Trout',
    propType: 'hits',
    line: 1.5,
    odds: 1.85,
    stake: 100,
    sport: 'MLB',
    confidence: 87,
    prediction: 1.8,
    projectedValue: 0.15,
  },
  {
    id: '2',
    gameId: 'mlb_002',
    playerName: 'Mookie Betts',
    propType: 'total_bases',
    line: 2.5,
    odds: 2.10,
    stake: 75,
    sport: 'MLB',
    confidence: 91,
    prediction: 2.7,
    projectedValue: 0.22,
  },
  {
    id: '3',
    gameId: 'mlb_003',
    playerName: 'Aaron Judge',
    propType: 'runs',
    line: 0.5,
    odds: 1.95,
    stake: 150,
    sport: 'MLB',
    confidence: 79,
    prediction: 0.8,
    projectedValue: 0.08,
  },
];

const EnhancedBettingInterfaceDemo: React.FC = () => {
  const [bets, setBets] = useState(sampleBets);
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  const handleRiskProfileChange = useCallback((profile: RiskProfile) => {
    setRiskProfile(profile.id);
    // Profile changed successfully
  }, []);

  const handleConfidenceThresholdChange = useCallback((threshold: number) => {
    setConfidenceThreshold(threshold);
    // Threshold changed successfully
  }, []);

  const handleBankrollSettingsChange = useCallback((_settings: BankrollSettings) => {
    // Settings changed successfully
  }, []);

  const handleParameterUpdate = useCallback((params: RiskProfile | BankrollSettings | { riskProfile: RiskProfile; confidenceThreshold: number; bankrollSettings: BankrollSettings }) => {
    // Parameters updated successfully 
    const _ = params; // Mark as used
  }, []);

  const handleStakeAdjustment = useCallback((betId: string, newStake: number) => {
    setBets(prevBets =>
      prevBets.map(bet =>
        bet.id === betId ? { ...bet, stake: newStake } : bet
      )
    );
  }, []);

  return (
    <EnhancedGlobalErrorBoundary enableToast={true}>
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Enhanced Betting Interface
            </h1>
            <p className="text-slate-400">
              Complete integration with error boundaries, real-time payouts, and smart controls
            </p>
          </div>

          {/* Smart Controls Bar */}
          <SmartControlsBar
            onRiskProfileChange={handleRiskProfileChange}
            onConfidenceThresholdChange={handleConfidenceThresholdChange}
            onBankrollSettingsChange={handleBankrollSettingsChange}
            onParameterUpdate={handleParameterUpdate}
            initialRiskProfile={riskProfile}
            initialConfidenceThreshold={confidenceThreshold}
            initialBankroll={5000}
            enableRealTimeUpdates={true}
            className="mb-6"
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Payout Preview */}
            <div className="space-y-6">
              <PayoutPreview
                bets={bets}
                riskProfile={riskProfile as 'conservative' | 'moderate' | 'aggressive'}
                confidenceThreshold={confidenceThreshold}
                onStakeAdjustment={handleStakeAdjustment}
                enableRealTime={true}
                className="h-fit"
              />
            </div>

            {/* Right Column - Bet Management */}
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Bets</h3>
                <div className="space-y-3">
                  {bets.map((bet) => (
                    <div key={bet.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-medium">
                            {bet.playerName}
                          </div>
                          <div className="text-sm text-slate-400">
                            {bet.propType} {bet.line > 0 ? 'over' : 'under'} {Math.abs(bet.line)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            ${bet.stake}
                          </div>
                          <div className="text-sm text-slate-400">
                            @{bet.odds}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            bet.confidence >= 90 ? 'bg-green-600 text-white' :
                            bet.confidence >= 80 ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {bet.confidence}% confident
                          </span>
                          <span className="text-slate-400">
                            Proj: {bet.prediction}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStakeAdjustment(bet.id, bet.stake - 25)}
                            className="text-slate-400 hover:text-white px-2 py-1 bg-slate-600 rounded text-xs"
                            disabled={bet.stake <= 25}
                          >
                            -$25
                          </button>
                          <button
                            onClick={() => handleStakeAdjustment(bet.id, bet.stake + 25)}
                            className="text-slate-400 hover:text-white px-2 py-1 bg-slate-600 rounded text-xs"
                          >
                            +$25
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      // Simulate adding a new bet
                      const newBet = {
                        id: Date.now().toString(),
                        gameId: 'mlb_004',
                        playerName: 'Shohei Ohtani',
                        propType: 'strikeouts',
                        line: 7.5,
                        odds: 2.25,
                        stake: 100,
                        sport: 'MLB',
                        confidence: 85,
                        prediction: 8.2,
                        projectedValue: 0.18,
                      };
                      setBets(prev => [...prev, newBet]);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Add Sample Bet
                  </button>
                  
                  <button
                    onClick={() => setBets([])}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Clear All Bets
                  </button>
                  
                  <button
                    onClick={() => setBets(sampleBets)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Reset to Samples
                  </button>
                  
                  <button
                    onClick={() => {
                      // Simulate an error to test error boundary
                      throw new Error('Test error for error boundary demo');
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded font-medium transition-colors"
                  >
                    Test Error Boundary
                  </button>
                </div>
              </div>

              {/* Status Display */}
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Profile:</span>
                    <span className="text-white font-medium capitalize">{riskProfile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence Threshold:</span>
                    <span className="text-white font-medium">{confidenceThreshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Bets:</span>
                    <span className="text-white font-medium">{bets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Staked:</span>
                    <span className="text-white font-medium">
                      ${bets.reduce((sum, bet) => sum + bet.stake, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-slate-400 text-sm mt-8">
            Enhanced Betting Interface with Real-time Updates, Error Boundaries, and Smart Controls
          </div>
        </div>
      </div>
    </EnhancedGlobalErrorBoundary>
  );
};

export default EnhancedBettingInterfaceDemo;
