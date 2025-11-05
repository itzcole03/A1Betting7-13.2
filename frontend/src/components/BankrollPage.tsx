import { BarChart3, Calculator, DollarSign, Target, TrendingUp, Wallet } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  TabItem,
  Tabs,
} from './base';

type BetRecordRequest = {
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
};

type BankrollSummary = {
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
};

type KellyCalculationPayload = {
  fair_probability: number;
  market_odds: number;
};

type KellyCalculationResponse = {
  kelly_fraction: number;
  recommended_bet_size: number;
  expected_value: number;
  ev_percent: number;
};

const BET_TYPES: Array<{ value: BetRecordRequest['bet_type']; label: string }> = [
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'spread', label: 'Spread' },
  { value: 'total', label: 'Total (Over/Under)' },
  { value: 'prop', label: 'Player Prop' },
];

const SPORTSBOOKS = ['FanDuel', 'DraftKings', 'BetMGM', 'Caesars', 'PointsBet'];
const MARKETS = ['MLB', 'NBA', 'NFL', 'NHL'];

const INITIAL_BET_FORM: BetRecordRequest = {
  stake: 0,
  odds: 2.0,
  bet_type: 'moneyline',
  selection: '',
  sportsbook: '',
  market: 'MLB',
};

const INITIAL_KELLY_FORM: KellyCalculationPayload = {
  fair_probability: 0.55,
  market_odds: 2.0,
};

const BankrollPage: React.FC = () => {
  const [summary, setSummary] = useState<BankrollSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [betForm, setBetForm] = useState<BetRecordRequest>(INITIAL_BET_FORM);
  const [kellyCalc, setKellyCalc] = useState<KellyCalculationPayload>(INITIAL_KELLY_FORM);
  const [kellyResult, setKellyResult] = useState<KellyCalculationResponse | null>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const loadSummary = async () => {
    try {
      setIsFetching(true);
      setError(null);
      const response = await fetch('/api/bankroll/summary');
      const data = await response.json();

      if (data.success) {
        setSummary(data.data as BankrollSummary);
      } else {
        setError(data.error?.message ?? 'Failed to load summary');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setIsFetching(false);
    }
  };

  const recordBet = async () => {
    try {
      setIsRecording(true);
      setError(null);
      const response = await fetch('/api/bankroll/bet-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(betForm),
      });
      const data = await response.json();

      if (data.success) {
        setBetForm(INITIAL_BET_FORM);
        await loadSummary();
      } else {
        setError(data.error?.message ?? 'Failed to record bet');
      }
    } catch (err) {
      setError('Failed to record bet');
    } finally {
      setIsRecording(false);
    }
  };

  const calculateKelly = async () => {
    try {
      setIsCalculating(true);
      setError(null);
      const response = await fetch('/api/bankroll/kelly-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kellyCalc),
      });
      const data = await response.json();

      if (data.success) {
        setKellyResult(data.data as KellyCalculationResponse);
      } else {
        setError(data.error?.message ?? 'Failed to calculate Kelly');
      }
    } catch (err) {
      setError('Failed to calculate Kelly');
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const summaryCards = useMemo(() => {
    if (!summary) {
      return null;
    }

    return (
      <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card padded={false}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-slate-200'>Current Bankroll</CardTitle>
            <DollarSign className='h-4 w-4 text-slate-400' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-slate-50'>
              ${summary.current_bankroll.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card padded={false}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-slate-200'>Total Bets</CardTitle>
            <Target className='h-4 w-4 text-slate-400' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-slate-50'>{summary.total_bets}</p>
            <p className='text-xs text-slate-400'>${summary.total_wagered.toFixed(2)} wagered</p>
          </CardContent>
        </Card>

        <Card padded={false}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-slate-200'>P&L</CardTitle>
            <TrendingUp className='h-4 w-4 text-slate-400' />
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                summary.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${summary.total_pnl.toFixed(2)}
            </p>
            <p className='text-xs text-slate-400'>{summary.roi_percent.toFixed(1)}% ROI</p>
          </CardContent>
        </Card>

        <Card padded={false}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-slate-200'>Win Rate</CardTitle>
            <BarChart3 className='h-4 w-4 text-slate-400' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-slate-50'>{summary.win_rate.toFixed(1)}%</p>
            <p className='text-xs text-slate-400'>Avg odds: {summary.avg_odds.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
    );
  }, [summary]);

  const recordBetTab = (
    <Card padded={false}>
      <CardHeader>
        <CardTitle className='text-xl font-semibold text-slate-50'>Record New Bet</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Input
            label='Stake Amount ($)'
            type='number'
            step='0.01'
            value={betForm.stake}
            onChange={event =>
              setBetForm(prev => ({ ...prev, stake: parseFloat(event.target.value) || 0 }))
            }
            fullWidth
          />

          <Input
            label='Decimal Odds'
            type='number'
            step='0.01'
            value={betForm.odds}
            onChange={event =>
              setBetForm(prev => ({ ...prev, odds: parseFloat(event.target.value) || 2.0 }))
            }
            fullWidth
          />

          <Select
            label='Bet Type'
            value={betForm.bet_type}
            onChange={event => setBetForm(prev => ({ ...prev, bet_type: event.target.value }))}
            fullWidth
          >
            {BET_TYPES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Input
            label='Selection'
            value={betForm.selection}
            onChange={event => setBetForm(prev => ({ ...prev, selection: event.target.value }))}
            placeholder='e.g., Yankees, Over 8.5, etc.'
            fullWidth
          />

          <Select
            label='Sportsbook'
            value={betForm.sportsbook}
            onChange={event => setBetForm(prev => ({ ...prev, sportsbook: event.target.value }))}
            fullWidth
          >
            <option value=''>Select sportsbook</option>
            {SPORTSBOOKS.map(book => (
              <option key={book} value={book}>
                {book}
              </option>
            ))}
          </Select>

          <Select
            label='Market'
            value={betForm.market}
            onChange={event => setBetForm(prev => ({ ...prev, market: event.target.value }))}
            fullWidth
          >
            {MARKETS.map(market => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </Select>
        </div>

        <Button
          onClick={recordBet}
          disabled={
            isFetching || isRecording || !betForm.stake || !betForm.selection || !betForm.sportsbook
          }
          isLoading={isRecording}
          fullWidth
        >
          Record Bet
        </Button>
      </CardContent>
    </Card>
  );

  const kellyCalculatorTab = (
    <Card padded={false}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl font-semibold text-slate-50'>
          <Calculator className='h-5 w-5 text-cyan-400' />
          Kelly Criterion Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Input
            label='Fair Win Probability'
            type='number'
            step='0.01'
            min='0.01'
            max='0.99'
            value={kellyCalc.fair_probability}
            onChange={event =>
              setKellyCalc(prev => ({
                ...prev,
                fair_probability: parseFloat(event.target.value) || 0.5,
              }))
            }
            helperText='Your estimated probability (0.01 to 0.99)'
            fullWidth
          />

          <Input
            label='Market Odds'
            type='number'
            step='0.01'
            min='1.01'
            value={kellyCalc.market_odds}
            onChange={event =>
              setKellyCalc(prev => ({
                ...prev,
                market_odds: parseFloat(event.target.value) || 2.0,
              }))
            }
            helperText='Sportsbook decimal odds'
            fullWidth
          />
        </div>

        <Button onClick={calculateKelly} isLoading={isCalculating} fullWidth>
          Calculate Kelly Recommendation
        </Button>

        {kellyResult ? (
          <div className='rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-4 text-slate-100'>
            <h3 className='mb-3 text-lg font-semibold'>Kelly Recommendation</h3>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
              <div>
                <p className='text-sm text-slate-300'>Kelly Fraction</p>
                <p className='text-lg font-bold'>
                  {(kellyResult.kelly_fraction * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-300'>Recommended Bet Size</p>
                <p className='text-lg font-bold'>${kellyResult.recommended_bet_size.toFixed(2)}</p>
              </div>
              <div>
                <p className='text-sm text-slate-300'>Expected Value</p>
                <p className='text-lg font-bold'>${kellyResult.expected_value.toFixed(2)}</p>
              </div>
              <div>
                <p className='text-sm text-slate-300'>EV Percentage</p>
                <p className='text-lg font-bold'>{kellyResult.ev_percent.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  const analyticsTab = (
    <Card padded={false}>
      <CardHeader>
        <CardTitle className='text-xl font-semibold text-slate-50'>Betting Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className='space-y-6'>
            <section>
              <h3 className='mb-3 text-lg font-semibold text-slate-100'>Market Breakdown</h3>
              <div className='space-y-2'>
                {Object.entries(summary.market_breakdown).map(([market, data]) => (
                  <div
                    key={market}
                    className='flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/70 p-3'
                  >
                    <span className='font-medium text-slate-100'>{market}</span>
                    <div className='text-right text-sm text-slate-300'>
                      <p>{data.bets} bets</p>
                      <p>${data.wagered.toFixed(2)} wagered</p>
                      <p>${data.pnl.toFixed(2)} P&L</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className='mb-3 text-lg font-semibold text-slate-100'>Sportsbook Breakdown</h3>
              <div className='space-y-2'>
                {Object.entries(summary.sportsbook_breakdown).map(([book, data]) => (
                  <div
                    key={book}
                    className='flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/70 p-3'
                  >
                    <span className='font-medium text-slate-100'>{book}</span>
                    <div className='text-right text-sm text-slate-300'>
                      <p>{data.bets} bets</p>
                      <p>${data.wagered.toFixed(2)} wagered</p>
                      <p>${data.pnl.toFixed(2)} P&L</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <p className='text-sm text-slate-300'>
            No analytics available yet. Record a bet to begin.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const tabItems: TabItem[] = useMemo(
    () => [
      { id: 'record-bet', label: 'Record Bet', content: recordBetTab },
      { id: 'kelly-calc', label: 'Kelly Calculator', content: kellyCalculatorTab },
      { id: 'analytics', label: 'Analytics', content: analyticsTab },
    ],
    [analyticsTab, kellyCalculatorTab, recordBetTab]
  );

  if (isFetching && !summary) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-lg text-slate-200'>Loading bankroll data...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 p-6'>
      <header className='mb-6 flex items-center gap-3'>
        <Wallet className='h-8 w-8 text-cyan-400' />
        <h1 className='text-3xl font-bold text-slate-50'>Bankroll Management</h1>
      </header>

      {error ? (
        <div className='rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200'>
          <div className='flex items-start justify-between gap-3'>
            <p>{error}</p>
            <Button variant='outline' size='sm' onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {summaryCards}

      <Tabs
        tabs={tabItems}
        defaultTabId='record-bet'
        className='space-y-4'
        contentClassName='border-none bg-transparent p-0'
      />
    </div>
  );
};

export default BankrollPage;
