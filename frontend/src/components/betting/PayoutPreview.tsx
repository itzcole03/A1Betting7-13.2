/**
 * PayoutPreview Component with Real-time Backend Predictions
 * Provides live payout calculations with WebSocket integration and enhanced ML predictions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

// Types
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

interface PayoutCalculation {
  totalStake: number;
  potentialPayout: number;
  potentialProfit: number;
  expectedValue: number;
  riskAdjustedValue: number;
  kellyFraction: number;
  winProbability: number;
  impliedProbability: number;
  confidenceScore: number;
  breakdownByBet: BetPayout[];
}

interface BetPayout {
  betId: string;
  stake: number;
  odds: number;
  potentialPayout: number;
  potentialProfit: number;
  winProbability: number;
  expectedValue: number;
  kellyOptimal: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface RealTimePrediction {
  betId: string;
  updatedPrediction: number;
  confidence: number;
  winProbability: number;
  timestamp: string;
}

interface PayoutPreviewProps {
  bets: Bet[];
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  confidenceThreshold?: number;
  onStakeAdjustment?: (betId: string, newStake: number) => void;
  enableRealTime?: boolean;
  className?: string;
}

const PayoutPreview: React.FC<PayoutPreviewProps> = ({
  bets,
  riskProfile = 'moderate',
  confidenceThreshold = 85,
  onStakeAdjustment,
  enableRealTime = true,
  className = '',
}) => {
  const [payoutData, setPayoutData] = useState<PayoutCalculation | null>(null);
  const [realTimePredictions, setRealTimePredictions] = useState<Map<string, RealTimePrediction>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!enableRealTime || bets.length === 0) return;

    let ws: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://localhost:8000/ws/predictions`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          
          // Subscribe to bet updates
          bets.forEach(bet => {
            ws?.send(JSON.stringify({
              type: 'subscribe',
              channel: 'bet_predictions',
              betId: bet.id,
              gameId: bet.gameId,
            }));
          });
        };

        ws.onmessage = (event) => {
          try {
            const update: RealTimePrediction = JSON.parse(event.data);
            if (update.betId) {
              setRealTimePredictions(prev => new Map(prev.set(update.betId, update)));
              setLastUpdated(new Date());
            }
          } catch (error) {
            // Silently ignore parse errors in production
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.warn('Failed to parse WebSocket message:', error);
            }
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };
      } catch (error) {
        // Silently handle connection errors
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to connect PayoutPreview WebSocket:', error);
        }
      }
    };

    connectWebSocket();

    return () => {
      ws?.close();
    };
  }, [enableRealTime, bets.length]);

  // Calculate risk profile multipliers
  const riskMultipliers = useMemo(() => {
    switch (riskProfile) {
      case 'conservative':
        return { kelly: 0.25, threshold: 0.9, maxStake: 0.02 };
      case 'aggressive':
        return { kelly: 0.75, threshold: 0.7, maxStake: 0.08 };
      default: // moderate
        return { kelly: 0.5, threshold: 0.8, maxStake: 0.05 };
    }
  }, [riskProfile]);

  // Fetch enhanced predictions from ML API
  const fetchEnhancedPredictions = useCallback(async (betData: Bet[]) => {
    if (betData.length === 0) return null;

    setIsLoading(true);
    try {
      const response = await fetch('/api/enhanced-ml/batch-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bets: betData.map(bet => ({
            game_id: bet.gameId,
            player_name: bet.playerName,
            prop_type: bet.propType,
            line: bet.line,
            odds: bet.odds,
            sport: bet.sport,
          })),
          risk_profile: riskProfile,
          confidence_threshold: confidenceThreshold,
        }),
      });

      if (!response.ok) {
        throw new Error(`Enhanced ML API error: ${response.status}`);
      }

      const predictions = await response.json();
      return predictions;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch enhanced predictions:', error);
      }
      toast.error('Failed to load enhanced predictions');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [riskProfile, confidenceThreshold]);

  // Calculate comprehensive payout data
  const calculatePayouts = useCallback(async (betData: Bet[]) => {
    if (betData.length === 0) {
      setPayoutData(null);
      return;
    }

    const enhancedPredictions = await fetchEnhancedPredictions(betData);
    
    // Merge real-time predictions
    const updatedBets = betData.map(bet => {
      const realTimePred = realTimePredictions.get(bet.id);
      return {
        ...bet,
        prediction: realTimePred?.updatedPrediction || bet.prediction,
        confidence: realTimePred?.confidence || bet.confidence,
        winProbability: realTimePred?.winProbability,
      };
    });

    // Calculate individual bet payouts
    const betPayouts: BetPayout[] = updatedBets.map((bet, index) => {
      const enhancedData = enhancedPredictions?.predictions?.[index];
      const odds = bet.odds;
      const stake = bet.stake;
      const winProb = bet.winProbability || enhancedData?.win_probability || (1 / odds) * 0.95;
      
      // Kelly Criterion calculation
      const b = odds - 1; // Net odds
      const q = 1 - winProb; // Probability of losing
      const kelly = (winProb * b - q) / b;
      const kellyOptimal = Math.max(0, kelly * riskMultipliers.kelly * 1000); // Assuming $1000 bankroll
      
      const potentialPayout = stake * odds;
      const potentialProfit = potentialPayout - stake;
      const expectedValue = (winProb * potentialProfit) - ((1 - winProb) * stake);
      
      // Risk level determination
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
      if (winProb > 0.8 && bet.confidence && bet.confidence > 90) riskLevel = 'LOW';
      else if (winProb < 0.6 || (bet.confidence && bet.confidence < 70)) riskLevel = 'HIGH';
      
      return {
        betId: bet.id,
        stake,
        odds,
        potentialPayout,
        potentialProfit,
        winProbability: winProb,
        expectedValue,
        kellyOptimal,
        riskLevel,
      };
    });

    // Calculate totals
    const totalStake = betPayouts.reduce((sum, bet) => sum + bet.stake, 0);
    const potentialPayout = betPayouts.reduce((sum, bet) => sum + bet.potentialPayout, 0);
    const potentialProfit = potentialPayout - totalStake;
    const expectedValue = betPayouts.reduce((sum, bet) => sum + bet.expectedValue, 0);
    
    // Combined win probability for multiple bets (assuming independence)
    const combinedWinProb = betPayouts.reduce((prob, bet) => prob * bet.winProbability, 1);
    
    // Risk-adjusted expected value
    const avgConfidence = updatedBets.reduce((sum, bet) => sum + (bet.confidence || 75), 0) / updatedBets.length;
    const riskAdjustment = avgConfidence / 100;
    const riskAdjustedValue = expectedValue * riskAdjustment;
    
    // Kelly fraction for portfolio
    const impliedProbability = 1 / (betPayouts.reduce((sum, bet) => sum + (1 / bet.odds), 0));
    const portfolioOdds = potentialPayout / totalStake;
    const portfolioKelly = Math.max(0, (combinedWinProb * (portfolioOdds - 1) - (1 - combinedWinProb)) / (portfolioOdds - 1));

    const payoutCalculation: PayoutCalculation = {
      totalStake,
      potentialPayout,
      potentialProfit,
      expectedValue,
      riskAdjustedValue,
      kellyFraction: portfolioKelly,
      winProbability: combinedWinProb,
      impliedProbability,
      confidenceScore: avgConfidence,
      breakdownByBet: betPayouts,
    };

    setPayoutData(payoutCalculation);
  }, [fetchEnhancedPredictions, realTimePredictions, riskMultipliers]);

  // Recalculate when bets change
  useEffect(() => {
    calculatePayouts(bets);
  }, [bets, calculatePayouts]);

  // Handle stake adjustments (currently unused but available for future use)
  const _handleStakeChange = useCallback((betId: string, newStake: number) => {
    if (onStakeAdjustment) {
      onStakeAdjustment(betId, newStake);
    }
  }, [onStakeAdjustment]);

  if (!payoutData) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
        <div className="text-center text-slate-400">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Calculating payouts...</span>
            </div>
          ) : (
            "Add bets to see payout preview"
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Payout Preview</h3>
          <div className="flex items-center gap-2">
            {enableRealTime && (
              <div className={`flex items-center gap-1 text-xs ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                {wsConnected ? 'Live' : 'Offline'}
              </div>
            )}
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Payout Display */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              ${payoutData.totalStake.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">Total Stake</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ${payoutData.potentialPayout.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">Potential Payout</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              ${payoutData.potentialProfit.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">Potential Profit</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${payoutData.expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${payoutData.expectedValue.toFixed(2)}
            </div>
            <div className="text-sm text-slate-400">Expected Value</div>
          </div>
        </div>

        {/* Advanced Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Win Probability</div>
            <div className="text-lg font-semibold text-white">
              {(payoutData.winProbability * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Kelly Fraction</div>
            <div className="text-lg font-semibold text-white">
              {(payoutData.kellyFraction * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-sm text-slate-400 mb-1">Confidence Score</div>
            <div className="text-lg font-semibold text-white">
              {payoutData.confidenceScore.toFixed(1)}/100
            </div>
          </div>
        </div>

        {/* Risk-Adjusted Value */}
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Risk-Adjusted Expected Value</span>
            <span className="text-xs text-slate-400">Profile: {riskProfile}</span>
          </div>
          <div className={`text-xl font-bold ${payoutData.riskAdjustedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${payoutData.riskAdjustedValue.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Adjusted for confidence level and risk profile
          </div>
        </div>

        {/* Individual Bet Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Bet Breakdown</h4>
          {payoutData.breakdownByBet.map((bet, index) => (
            <div key={bet.betId} className="bg-slate-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  Bet {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    bet.riskLevel === 'LOW' ? 'bg-green-600 text-white' :
                    bet.riskLevel === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {bet.riskLevel}
                  </span>
                  <span className="text-xs text-slate-400">
                    {(bet.winProbability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Stake</div>
                  <div className="text-white font-medium">${bet.stake.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Payout</div>
                  <div className="text-white font-medium">${bet.potentialPayout.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400">EV</div>
                  <div className={`font-medium ${bet.expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${bet.expectedValue.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {bet.kellyOptimal > 0 && (
                <div className="mt-2 text-xs text-blue-400">
                  Kelly optimal: ${bet.kellyOptimal.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PayoutPreview;
