import React, { useState, useEffect } from 'react';
import { _Card as Card, _CardContent as CardContent, _CardHeader as CardHeader, _CardTitle as CardTitle } from '../components/ui/card';
import { _Button as Button } from '../components/ui/button';
import { _Input as Input } from '../components/ui/input';
import { _Label as Label } from '../components/ui/label';
import { _Select as Select, _SelectContent as SelectContent, _SelectItem as SelectItem, _SelectTrigger as SelectTrigger, _SelectValue as SelectValue } from '../components/ui/select';
import { _Alert as Alert, _AlertDescription as AlertDescription } from '../components/ui/alert';
import { _Badge as Badge } from '../components/ui/badge';
import { Calculator, TrendingUp, Target, DollarSign, Activity, BarChart3 } from 'lucide-react';
import useBankrollAPI from '../hooks/useBankrollAPI';
import { BetRecordRequest, KellyCalculationResponse, BankrollSummaryResponse } from '../types/bankroll';

// Simple Textarea component
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }> = ({ className = '', ...props }) => (
  <textarea
    className={`min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const BankrollPage: React.FC = () => {
  const {
    loading,
    error,
    recordBet,
    calculateKelly,
    getBankrollSummary,
  } = useBankrollAPI();

  // Form state
  const [betForm, setBetForm] = useState<Partial<BetRecordRequest>>({
    stake: 0,
    odds: 0,
    bet_type: '',
    selection: '',
    sportsbook: '',
    market: '',
    fair_odds: 0,
    confidence_score: 5,
    notes: '',
  });

  // Kelly calculation state
  const [kellyResult, setKellyResult] = useState<KellyCalculationResponse | null>(null);
  const [autoKellyEnabled, setAutoKellyEnabled] = useState(true);

  // Bankroll summary state
  const [bankrollSummary, setBankrollSummary] = useState<BankrollSummaryResponse | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'bet-entry' | 'summary' | 'history'>('bet-entry');
  const [showKellyCalculator, setShowKellyCalculator] = useState(false);

  // Load bankroll summary on component mount
  useEffect(() => {
    loadBankrollSummary();
  }, []);

  // Auto-calculate Kelly when fair odds or market odds change
  useEffect(() => {
    if (autoKellyEnabled && betForm.fair_odds && betForm.odds && betForm.fair_odds > 1 && betForm.odds > 1) {
      calculateKellyRecommendation();
    }
  }, [betForm.fair_odds, betForm.odds, autoKellyEnabled]);

  const loadBankrollSummary = async () => {
    try {
      const summary = await getBankrollSummary(30);
      setBankrollSummary(summary);
    } catch (err) {
      console.error('Failed to load bankroll summary:', err);
    }
  };

  const calculateKellyRecommendation = async () => {
    if (!betForm.fair_odds || !betForm.odds) return;

    try {
      const fairProbability = 1 / betForm.fair_odds;
      const result = await calculateKelly({
        fair_probability: fairProbability,
        market_odds: betForm.odds,
        variant: 'fractional',
        fraction_cap: 0.25,
      });
      setKellyResult(result);

      // Auto-suggest stake based on Kelly
      if (result.recommended_bet_size > 0) {
        setBetForm((prev: Partial<BetRecordRequest>) => ({ ...prev, stake: Math.round(result.recommended_bet_size) }));
      }
    } catch (err) {
      console.error('Kelly calculation failed:', err);
    }
  };

  const handleSubmitBet = async () => {
    if (!betForm.stake || !betForm.odds || !betForm.bet_type || !betForm.selection || !betForm.sportsbook || !betForm.market) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await recordBet(betForm as BetRecordRequest);
      
      // Reset form
      setBetForm({
        stake: 0,
        odds: 0,
        bet_type: '',
        selection: '',
        sportsbook: '',
        market: '',
        fair_odds: 0,
        confidence_score: 5,
        notes: '',
      });
      setKellyResult(null);
      
      // Reload summary
      await loadBankrollSummary();
      
      alert('Bet recorded successfully!');
    } catch (err) {
      console.error('Failed to record bet:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-500';
    if (confidence >= 8) return 'bg-green-500';
    if (confidence >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getKellyRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bankroll Management</h1>
        <p className="text-gray-600">Track your bets, analyze performance, and optimize your betting strategy with Kelly criterion.</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {bankrollSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Bankroll</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bankrollSummary.current_bankroll)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ROI</p>
                  <p className={`text-2xl font-bold ${
                    bankrollSummary.roi_percent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(bankrollSummary.roi_percent)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(bankrollSummary.win_rate)}
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bankrollSummary.total_bets}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'bet-entry', label: 'Record Bet', icon: DollarSign },
          { id: 'summary', label: 'Performance', icon: BarChart3 },
          { id: 'history', label: 'Bet History', icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Bet Entry Tab */}
      {activeTab === 'bet-entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bet Entry Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Record New Bet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bet-type">Bet Type *</Label>
                    <Select
                      value={betForm.bet_type}
                      onValueChange={(value) => setBetForm((prev: Partial<BetRecordRequest>) => ({ ...prev, bet_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moneyline">Moneyline</SelectItem>
                        <SelectItem value="spread">Point Spread</SelectItem>
                        <SelectItem value="total">Over/Under</SelectItem>
                        <SelectItem value="prop">Player Prop</SelectItem>
                        <SelectItem value="futures">Futures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="market">Market *</Label>
                    <Input
                      id="market"
                      value={betForm.market || ''}
                      onChange={(e) => setBetForm((prev: Partial<BetRecordRequest>) => ({ ...prev, market: e.target.value }))}
                      placeholder="e.g., NBA, NFL, MLB"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="selection">Selection *</Label>
                    <Input
                      id="selection"
                      value={betForm.selection || ''}
                      onChange={(e) => setBetForm((prev: Partial<BetRecordRequest>) => ({ ...prev, selection: e.target.value })))
                      placeholder="e.g., Lakers +5.5, Over 8.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sportsbook">Sportsbook *</Label>
                    <Select
                      value={betForm.sportsbook}
                      onValueChange={(value) => setBetForm((prev: Partial<BetRecordRequest>) => ({ ...prev, sportsbook: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sportsbook" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draftkings">DraftKings</SelectItem>
                        <SelectItem value="fanduel">FanDuel</SelectItem>
                        <SelectItem value="betmgm">BetMGM</SelectItem>
                        <SelectItem value="caesars">Caesars</SelectItem>
                        <SelectItem value="pointsbet">PointsBet</SelectItem>
                        <SelectItem value="barstool">Barstool</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="odds">Market Odds * (Decimal)</Label>
                    <Input
                      id="odds"
                      type="number"
                      step="0.01"
                      value={betForm.odds || ''}
                      onChange={(e) => setBetForm((prev: Partial<BetRecordRequest>) => ({ ...prev, odds: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 1.91"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fair-odds">Your Fair Odds (Decimal)</Label>
                    <Input
                      id="fair-odds"
                      type="number"
                      step="0.01"
                      value={betForm.fair_odds || ''}
                      onChange={(e) => setBetForm(prev => ({ ...prev, fair_odds: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 1.80"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stake">Stake Amount * ($)</Label>
                    <Input
                      id="stake"
                      type="number"
                      step="1"
                      value={betForm.stake || ''}
                      onChange={(e) => setBetForm(prev => ({ ...prev, stake: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="confidence">Confidence (1-10)</Label>
                    <Input
                      id="confidence"
                      type="number"
                      min="1"
                      max="10"
                      value={betForm.confidence_score || 5}
                      onChange={(e) => setBetForm(prev => ({ ...prev, confidence_score: parseInt(e.target.value) || 5 }))}
                    />
                    <div className="flex items-center mt-1">
                      <div className={`h-2 w-2 rounded-full mr-1 ${getConfidenceColor(betForm.confidence_score)}`}></div>
                      <span className="text-xs text-gray-500">
                        {betForm.confidence_score && betForm.confidence_score >= 8 ? 'High' : 
                         betForm.confidence_score && betForm.confidence_score >= 6 ? 'Medium' : 'Low'} Confidence
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="player-name">Player Name (if applicable)</Label>
                    <Input
                      id="player-name"
                      value={betForm.player_name || ''}
                      onChange={(e) => setBetForm(prev => ({ ...prev, player_name: e.target.value }))}
                      placeholder="e.g., LeBron James"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={betForm.notes || ''}
                    onChange={(e) => setBetForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this bet..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleSubmitBet}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Recording...' : 'Record Bet'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowKellyCalculator(!showKellyCalculator)}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Kelly Calculator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kelly Calculator & Recommendations */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Kelly Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kellyResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Recommended Bet Size</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(kellyResult.recommended_bet_size)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Kelly Fraction</span>
                        <span className="text-sm font-semibold">
                          {formatPercentage(kellyResult.kelly_fraction * 100)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Expected Value</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatPercentage(kellyResult.ev_percent)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Edge</span>
                        <span className="text-sm font-medium">
                          {formatPercentage(kellyResult.risk_assessment.edge_percent)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Max Risk</span>
                        <span className="text-sm font-medium">
                          {formatPercentage(kellyResult.risk_assessment.max_loss_percent)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Recommendation</span>
                        <Badge 
                          variant="outline" 
                          className={getKellyRecommendationColor(kellyResult.risk_assessment.recommendation)}
                        >
                          {kellyResult.risk_assessment.recommendation.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBetForm((prev: Partial<BetRecordRequest>) => ({ ...prev, stake: Math.round(kellyResult.recommended_bet_size) })))
                      className="w-full"
                    >
                      Use Kelly Suggestion
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">
                      Enter fair odds and market odds to get Kelly recommendation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Performance Summary Tab */}
      {activeTab === 'summary' && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Performance analytics coming soon...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bet History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Bet History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bet history table coming soon...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankrollPage;
