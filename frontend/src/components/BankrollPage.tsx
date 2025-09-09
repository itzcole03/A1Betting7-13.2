import React, { useState, useEffect } from 'react';
import { _Card, _CardContent, _CardHeader, _CardTitle } from './ui/card';
import { _Button } from './ui/button';
import { _Input } from './ui/input';
import { _Label } from './ui/label';
import { _Select, _SelectContent, _SelectItem, _SelectTrigger, _SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Wallet, TrendingUp, Calculator, Target, BarChart3, DollarSign } from 'lucide-react';

// Types for bankroll management
interface BetRecordRequest {
  stake: number;
  odds: number;
  bet_type: string;
  selection: string;
  sportsbook: string;
  market: string;
  player_name?: string;
  fair_odds?: number;
  confidence_score?: number;
  notes?: string;
}

interface BankrollSummary {
  current_bankroll: number;
  total_bets: number;
  total_wagered: number;
  total_pnl: number;
  roi_percent: number;
  win_rate: number;
  avg_bet_size: number;
  avg_odds: number;
  market_breakdown: Record<string, { bets: number; wagered: number; pnl: number }>;
  sportsbook_breakdown: Record<string, { bets: number; wagered: number; pnl: number }>;
}

interface KellyCalculationResponse {
  kelly_fraction: number;
  recommended_bet_size: number;
  expected_value: number;
  ev_percent: number;
}

const BankrollPage: React.FC = () => {
  const [summary, setSummary] = useState<BankrollSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bet entry form state
  const [betForm, setBetForm] = useState<BetRecordRequest>({
    stake: 0,
    odds: 2.0,
    bet_type: 'moneyline',
    selection: '',
    sportsbook: '',
    market: 'MLB'
  });

  // Kelly calculator state
  const [kellyCalc, setKellyCalc] = useState({
    fair_probability: 0.55,
    market_odds: 2.0
  });
  const [kellyResult, setKellyResult] = useState<KellyCalculationResponse | null>(null);

  // Load bankroll summary
  const loadSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bankroll/summary');
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
      } else {
        setError(data.error?.message || 'Failed to load summary');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  // Record a bet
  const recordBet = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bankroll/bet-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betForm),
      });
      const data = await response.json();
      
      if (data.success) {
        // Reset form and reload summary
        setBetForm({
          stake: 0,
          odds: 2.0,
          bet_type: 'moneyline',
          selection: '',
          sportsbook: '',
          market: 'MLB'
        });
        loadSummary();
      } else {
        setError(data.error?.message || 'Failed to record bet');
      }
    } catch (err) {
      setError('Failed to record bet');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Kelly recommendation
  const calculateKelly = async () => {
    try {
      const response = await fetch('/api/bankroll/kelly-calculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kellyCalc),
      });
      const data = await response.json();
      
      if (data.success) {
        setKellyResult(data.data);
      } else {
        setError(data.error?.message || 'Failed to calculate Kelly');
      }
    } catch (err) {
      setError('Failed to calculate Kelly');
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading bankroll data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Wallet className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Bankroll Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <_Button 
            onClick={() => setError(null)} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Dismiss
          </_Button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <_Card>
            <_CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <_CardTitle className="text-sm font-medium">Current Bankroll</_CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </_CardHeader>
            <_CardContent>
              <div className="text-2xl font-bold">${summary.current_bankroll.toFixed(2)}</div>
            </_CardContent>
          </_Card>

          <_Card>
            <_CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <_CardTitle className="text-sm font-medium">Total Bets</_CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </_CardHeader>
            <_CardContent>
              <div className="text-2xl font-bold">{summary.total_bets}</div>
              <p className="text-xs text-muted-foreground">
                ${summary.total_wagered.toFixed(2)} wagered
              </p>
            </_CardContent>
          </_Card>

          <_Card>
            <_CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <_CardTitle className="text-sm font-medium">P&L</_CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </_CardHeader>
            <_CardContent>
              <div className={`text-2xl font-bold ${summary.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.total_pnl.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.roi_percent.toFixed(1)}% ROI
              </p>
            </_CardContent>
          </_Card>

          <_Card>
            <_CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <_CardTitle className="text-sm font-medium">Win Rate</_CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </_CardHeader>
            <_CardContent>
              <div className="text-2xl font-bold">{summary.win_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Avg odds: {summary.avg_odds.toFixed(2)}
              </p>
            </_CardContent>
          </_Card>
        </div>
      )}

      <Tabs defaultValue="record-bet" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="record-bet">Record Bet</TabsTrigger>
          <TabsTrigger value="kelly-calc">Kelly Calculator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Record Bet Tab */}
  <TabsContent value="record-bet">
          <_Card>
            <_CardHeader>
              <_CardTitle>Record New Bet</_CardTitle>
            </_CardHeader>
            <_CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <_Label htmlFor="stake">Stake Amount ($)</_Label>
                  <_Input
                    id="stake"
                    type="number"
                    step="0.01"
                    value={betForm.stake}
                    onChange={(e) => setBetForm({...betForm, stake: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <_Label htmlFor="odds">Decimal Odds</_Label>
                  <_Input
                    id="odds"
                    type="number"
                    step="0.01"
                    value={betForm.odds}
                    onChange={(e) => setBetForm({...betForm, odds: parseFloat(e.target.value) || 2.0})}
                  />
                </div>

                <div>
                  <_Label htmlFor="bet-type">Bet Type</_Label>
                  <_Select value={betForm.bet_type} onValueChange={(value) => setBetForm({...betForm, bet_type: value})}>
                    <_SelectTrigger>
                      <_SelectValue />
                    </_SelectTrigger>
                    <_SelectContent>
                      <_SelectItem value="moneyline">Moneyline</_SelectItem>
                      <_SelectItem value="spread">Spread</_SelectItem>
                      <_SelectItem value="total">Total (Over/Under)</_SelectItem>
                      <_SelectItem value="prop">Player Prop</_SelectItem>
                    </_SelectContent>
                  </_Select>
                </div>

                <div>
                  <_Label htmlFor="selection">Selection</_Label>
                  <_Input
                    id="selection"
                    value={betForm.selection}
                    onChange={(e) => setBetForm({...betForm, selection: e.target.value})}
                    placeholder="e.g., Yankees, Over 8.5, etc."
                  />
                </div>

                <div>
                  <_Label htmlFor="sportsbook">Sportsbook</_Label>
                  <_Select value={betForm.sportsbook} onValueChange={(value) => setBetForm({...betForm, sportsbook: value})}>
                    <_SelectTrigger>
                      <_SelectValue placeholder="Select sportsbook" />
                    </_SelectTrigger>
                    <_SelectContent>
                      <_SelectItem value="FanDuel">FanDuel</_SelectItem>
                      <_SelectItem value="DraftKings">DraftKings</_SelectItem>
                      <_SelectItem value="BetMGM">BetMGM</_SelectItem>
                      <_SelectItem value="Caesars">Caesars</_SelectItem>
                      <_SelectItem value="PointsBet">PointsBet</_SelectItem>
                    </_SelectContent>
                  </_Select>
                </div>

                <div>
                  <_Label htmlFor="market">Market</_Label>
                  <_Select value={betForm.market} onValueChange={(value) => setBetForm({...betForm, market: value})}>
                    <_SelectTrigger>
                      <_SelectValue />
                    </_SelectTrigger>
                    <_SelectContent>
                      <_SelectItem value="MLB">MLB</_SelectItem>
                      <_SelectItem value="NBA">NBA</_SelectItem>
                      <_SelectItem value="NFL">NFL</_SelectItem>
                      <_SelectItem value="NHL">NHL</_SelectItem>
                    </_SelectContent>
                  </_Select>
                </div>
              </div>

              <_Button 
                onClick={recordBet} 
                disabled={loading || !betForm.stake || !betForm.selection || !betForm.sportsbook}
                className="w-full"
              >
                {loading ? 'Recording...' : 'Record Bet'}
              </_Button>
            </_CardContent>
          </_Card>
  </TabsContent>

        {/* Kelly Calculator Tab */}
  <TabsContent value="kelly-calc">
          <_Card>
            <_CardHeader>
              <_CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Kelly Criterion Calculator</span>
              </_CardTitle>
            </_CardHeader>
            <_CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <_Label htmlFor="fair-prob">Fair Win Probability</_Label>
                  <_Input
                    id="fair-prob"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    value={kellyCalc.fair_probability}
                    onChange={(e) => setKellyCalc({...kellyCalc, fair_probability: parseFloat(e.target.value) || 0.5})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your estimated probability (0.01 to 0.99)
                  </p>
                </div>

                <div>
                  <_Label htmlFor="market-odds">Market Odds</_Label>
                  <_Input
                    id="market-odds"
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={kellyCalc.market_odds}
                    onChange={(e) => setKellyCalc({...kellyCalc, market_odds: parseFloat(e.target.value) || 2.0})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sportsbook decimal odds
                  </p>
                </div>
              </div>

              <_Button onClick={calculateKelly} className="w-full">
                Calculate Kelly Recommendation
              </_Button>

              {kellyResult && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Kelly Recommendation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Kelly Fraction</p>
                      <p className="text-lg font-bold">{(kellyResult.kelly_fraction * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recommended Bet Size</p>
                      <p className="text-lg font-bold">${kellyResult.recommended_bet_size.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Value</p>
                      <p className="text-lg font-bold">${kellyResult.expected_value.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">EV Percentage</p>
                      <p className="text-lg font-bold">{kellyResult.ev_percent.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </_CardContent>
          </_Card>
  </TabsContent>

        {/* Analytics Tab */}
  <TabsContent value="analytics">
          <_Card>
            <_CardHeader>
              <_CardTitle>Betting Analytics</_CardTitle>
            </_CardHeader>
            <_CardContent>
              {summary && (
                <div className="space-y-6">
                  {/* Market Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3">Market Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(summary.market_breakdown).map(([market, data]) => (
                        <div key={market} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{market}</span>
                          <div className="text-right">
                            <div>{data.bets} bets</div>
                            <div className="text-sm text-muted-foreground">
                              ${data.wagered.toFixed(2)} wagered, ${data.pnl.toFixed(2)} P&L
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sportsbook Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3">Sportsbook Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(summary.sportsbook_breakdown).map(([book, data]) => (
                        <div key={book} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{book}</span>
                          <div className="text-right">
                            <div>{data.bets} bets</div>
                            <div className="text-sm text-muted-foreground">
                              ${data.wagered.toFixed(2)} wagered, ${data.pnl.toFixed(2)} P&L
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </_CardContent>
          </_Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankrollPage;
