import React, { useState, useEffect } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for bet simulation
interface BetScenario {
  id: string;
  name: string;
  description?: string;
  betAmount: number;
  odds: number;
  probability: number; // 0-1, user's estimated probability
  expectedValue?: number;
  kellyPercentage?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

interface SimulationResult {
  scenario: BetScenario;
  outcomes: {
    win: {
      probability: number;
      payout: number;
      profit: number;
    };
    loss: {
      probability: number;
      loss: number;
    };
  };
  expectedValue: number;
  variance: number;
  sharpeRatio: number;
  kellyOptimal: number;
  riskMetrics: {
    maxLoss: number;
    riskOfRuin: number;
    requiredWinRate: number;
  };
}

interface PortfolioSimulation {
  scenarios: BetScenario[];
  totalStake: number;
  expectedReturn: number;
  totalRisk: number;
  diversificationScore: number;
  correlationRisk: number;
}

interface BetSimulationToolProps {
  initialBankroll?: number;
  scenarios?: BetScenario[];
  variant?: 'default' | 'cyber' | 'advanced' | 'professional';
  showAdvancedMetrics?: boolean;
  showPortfolioAnalysis?: boolean;
  showMonteCarlo?: boolean;
  currency?: string;
  className?: string;
  onScenarioAdd?: (scenario: BetScenario) => void;
  onSimulationRun?: (results: SimulationResult[]) => void;
  onPortfolioAnalysis?: (portfolio: PortfolioSimulation) => void;
}

const _calculateExpectedValue = (betAmount: number, odds: number, probability: number): number => {
  const _decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  const _winAmount = betAmount * (decimalOdds - 1);
  const _lossAmount = betAmount;
  return probability * winAmount - (1 - probability) * lossAmount;
};

const _calculateKellyPercentage = (odds: number, probability: number): number => {
  const _decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  const _q = 1 - probability;
  const _b = decimalOdds - 1;
  return Math.max(0, (probability * b - q) / b);
};

const _calculateRiskLevel = (
  ev: number,
  kelly: number,
  variance: number
): 'low' | 'medium' | 'high' | 'extreme' => {
  if (ev < 0) return 'extreme';
  if (kelly < 0.02 || variance > 100) return 'high';
  if (kelly < 0.05 || variance > 50) return 'medium';
  return 'low';
};

const _formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

const _formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const _getRiskColor = (risk: string, variant: string = 'default') => {
  const _colors = {
    default: {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      extreme: 'text-red-600 bg-red-50 border-red-200',
    },
    cyber: {
      low: 'text-green-300 bg-green-500/20 border-green-500/30',
      medium: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
      high: 'text-orange-300 bg-orange-500/20 border-orange-500/30',
      extreme: 'text-red-300 bg-red-500/20 border-red-500/30',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[risk as keyof typeof colors.cyber]
    : colors.default[risk as keyof typeof colors.default];
};

export const _BetSimulationTool: React.FC<BetSimulationToolProps> = ({
  initialBankroll = 1000,
  scenarios = [],
  variant = 'default',
  showAdvancedMetrics = true,
  showPortfolioAnalysis = true,
  showMonteCarlo = false,
  currency = 'USD',
  className,
  onScenarioAdd,
  onSimulationRun,
  onPortfolioAnalysis,
}) => {
  const [betScenarios, setBetScenarios] = useState<BetScenario[]>(scenarios);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [bankroll, setBankroll] = useState(initialBankroll);

  // New scenario form state
  const [newScenario, setNewScenario] = useState({
    name: '',
    betAmount: '',
    odds: '',
    probability: '',
  });

  // Monte Carlo simulation state
  const [monteCarloResults, setMonteCarloResults] = useState<{
    iterations: number;
    outcomes: number[];
    statistics: {
      mean: number;
      median: number;
      stdDev: number;
      percentiles: { p5: number; p25: number; p75: number; p95: number };
    };
  } | null>(null);

  const _runSimulation = (scenario: BetScenario): SimulationResult => {
    const _decimalOdds =
      scenario.odds > 0 ? scenario.odds / 100 + 1 : 100 / Math.abs(scenario.odds) + 1;
    const _winPayout = scenario.betAmount * decimalOdds;
    const _winProfit = winPayout - scenario.betAmount;
    const _lossAmount = scenario.betAmount;

    const _expectedValue = calculateExpectedValue(
      scenario.betAmount,
      scenario.odds,
      scenario.probability
    );
    const _variance =
      scenario.probability * Math.pow(winProfit, 2) +
      (1 - scenario.probability) * Math.pow(-lossAmount, 2) -
      Math.pow(expectedValue, 2);
    const _sharpeRatio = expectedValue / Math.sqrt(variance);
    const _kellyOptimal = calculateKellyPercentage(scenario.odds, scenario.probability) * bankroll;

    const _requiredWinRate =
      scenario.odds > 0
        ? 100 / (scenario.odds + 100)
        : Math.abs(scenario.odds) / (Math.abs(scenario.odds) + 100);

    const _riskOfRuin = bankroll > 0 ? Math.exp((-2 * expectedValue * bankroll) / variance) : 1;

    return {
      scenario,
      outcomes: {
        win: {
          probability: scenario.probability,
          payout: winPayout,
          profit: winProfit,
        },
        loss: {
          probability: 1 - scenario.probability,
          loss: lossAmount,
        },
      },
      expectedValue,
      variance,
      sharpeRatio,
      kellyOptimal,
      riskMetrics: {
        maxLoss: lossAmount,
        riskOfRuin: riskOfRuin * 100,
        requiredWinRate: requiredWinRate * 100,
      },
    };
  };

  const _runAllSimulations = () => {
    const _results = betScenarios.map(runSimulation);
    setSimulationResults(results);
    onSimulationRun?.(results);
  };

  const _runMonteCarloSimulation = (iterations: number = 10000) => {
    if (betScenarios.length === 0) return;

    const _outcomes: number[] = [];

    for (let _i = 0; i < iterations; i++) {
      let _portfolioOutcome = 0;

      for (const _scenario of betScenarios) {
        const _random = Math.random();
        if (random < scenario.probability) {
          // Win
          const _decimalOdds =
            scenario.odds > 0 ? scenario.odds / 100 + 1 : 100 / Math.abs(scenario.odds) + 1;
          portfolioOutcome += scenario.betAmount * (decimalOdds - 1);
        } else {
          // Loss
          portfolioOutcome -= scenario.betAmount;
        }
      }

      outcomes.push(portfolioOutcome);
    }

    outcomes.sort((a, b) => a - b);
    const _mean = outcomes.reduce((sum, val) => sum + val, 0) / outcomes.length;
    const _median = outcomes[Math.floor(outcomes.length / 2)];
    const _variance =
      outcomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / outcomes.length;
    const _stdDev = Math.sqrt(variance);

    setMonteCarloResults({
      iterations,
      outcomes,
      statistics: {
        mean,
        median,
        stdDev,
        percentiles: {
          p5: outcomes[Math.floor(outcomes.length * 0.05)],
          p25: outcomes[Math.floor(outcomes.length * 0.25)],
          p75: outcomes[Math.floor(outcomes.length * 0.75)],
          p95: outcomes[Math.floor(outcomes.length * 0.95)],
        },
      },
    });
  };

  const _addScenario = () => {
    if (
      !newScenario.name ||
      !newScenario.betAmount ||
      !newScenario.odds ||
      !newScenario.probability
    ) {
      return;
    }

    const _betAmount = parseFloat(newScenario.betAmount);
    const _odds = parseFloat(newScenario.odds);
    const _probability = parseFloat(newScenario.probability) / 100;

    const _expectedValue = calculateExpectedValue(betAmount, odds, probability);
    const _kellyPercentage = calculateKellyPercentage(odds, probability);
    const _variance =
      probability * Math.pow((betAmount * odds) / 100, 2) +
      (1 - probability) * Math.pow(betAmount, 2);
    const _riskLevel = calculateRiskLevel(expectedValue, kellyPercentage, variance);

    const _scenario: BetScenario = {
      id: Date.now().toString(),
      name: newScenario.name,
      betAmount,
      odds,
      probability,
      expectedValue,
      kellyPercentage,
      riskLevel,
    };

    setBetScenarios(prev => [...prev, scenario]);
    onScenarioAdd?.(scenario);

    // Reset form
    setNewScenario({ name: '', betAmount: '', odds: '', probability: '' });
  };

  const _removeScenario = (id: string) => {
    setBetScenarios(prev => prev.filter(s => s.id !== id));
    setSimulationResults(prev => prev.filter(r => r.scenario.id !== id));
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    advanced: 'bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-xl shadow-lg',
    professional: 'bg-white border border-gray-300 rounded-xl shadow-xl',
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className={cn('relative', variantClasses[variant], className)}>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'flex items-center justify-between p-6 border-b',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h2
            className={cn(
              'text-xl font-bold',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Bet Simulation Tool
          </h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p
            className={cn(
              'text-sm mt-1',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
            )}
          >
            Bankroll: {formatCurrency(bankroll, currency)}
          </p>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={runAllSimulations}
            disabled={betScenarios.length === 0}
            className={cn(
              'px-4 py-2 rounded font-medium transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500 text-black hover:bg-cyan-400 disabled:bg-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-400'
            )}
          >
            Run Simulation
          </button>
          {showMonteCarlo && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
              onClick={() => runMonteCarloSimulation()}
              disabled={betScenarios.length === 0}
              className={cn(
                'px-4 py-2 rounded font-medium transition-colors',
                variant === 'cyber'
                  ? 'bg-purple-500 text-white hover:bg-purple-400 disabled:bg-gray-600'
                  : 'bg-purple-600 text-white hover:bg-purple-500 disabled:bg-gray-400'
              )}
            >
              Monte Carlo
            </button>
          )}
        </div>
      </div>

      {/* Add Scenario Form */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'p-6 border-b',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h3
          className={cn(
            'font-semibold mb-4',
            variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
          )}
        >
          Add Betting Scenario
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='text'
            placeholder='Scenario name'
            value={newScenario.name}
            onChange={e => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
            className={cn(
              'border rounded px-3 py-2',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                : 'bg-white border-gray-300'
            )}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='number'
            step='0.01'
            placeholder='Bet amount'
            value={newScenario.betAmount}
            onChange={e => setNewScenario(prev => ({ ...prev, betAmount: e.target.value }))}
            className={cn(
              'border rounded px-3 py-2',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                : 'bg-white border-gray-300'
            )}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='number'
            placeholder='Odds (e.g. +150 or -110)'
            value={newScenario.odds}
            onChange={e => setNewScenario(prev => ({ ...prev, odds: e.target.value }))}
            className={cn(
              'border rounded px-3 py-2',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                : 'bg-white border-gray-300'
            )}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='number'
            step='0.1'
            min='0'
            max='100'
            placeholder='Win probability %'
            value={newScenario.probability}
            onChange={e => setNewScenario(prev => ({ ...prev, probability: e.target.value }))}
            className={cn(
              'border rounded px-3 py-2',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                : 'bg-white border-gray-300'
            )}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={addScenario}
            className={cn(
              'px-4 py-2 rounded font-medium transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                : 'bg-blue-600 text-white hover:bg-blue-500'
            )}
          >
            Add Scenario
          </button>
        </div>
      </div>

      {/* Scenarios List */}
      {betScenarios.length > 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='p-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3
            className={cn(
              'font-semibold mb-4',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Scenarios ({betScenarios.length})
          </h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-3'>
            {betScenarios.map(scenario => {
              const _result = simulationResults.find(r => r.scenario.id === scenario.id);
              return (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  result={result}
                  variant={variant}
                  currency={currency}
                  showAdvancedMetrics={showAdvancedMetrics}
                  onRemove={removeScenario}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Portfolio Analysis */}
      {showPortfolioAnalysis && simulationResults.length > 1 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-6 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <PortfolioAnalysis results={simulationResults} variant={variant} currency={currency} />
        </div>
      )}

      {/* Monte Carlo Results */}
      {showMonteCarlo && monteCarloResults && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-6 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <MonteCarloResults results={monteCarloResults} variant={variant} currency={currency} />
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};

// Scenario Card Component
interface ScenarioCardProps {
  scenario: BetScenario;
  result?: SimulationResult;
  variant: string;
  currency: string;
  showAdvancedMetrics: boolean;
  onRemove: (id: string) => void;
}

const _ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  result,
  variant,
  currency,
  showAdvancedMetrics,
  onRemove,
}) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div
    className={cn(
      'p-4 rounded-lg border',
      variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
    )}
  >
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='flex justify-between items-start mb-3'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h4 className={cn('font-medium', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
          {scenario.name}
        </h4>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn('text-sm mt-1', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600')}
        >
          {formatCurrency(scenario.betAmount, currency)} @ {formatOdds(scenario.odds)} (
          {(scenario.probability * 100).toFixed(1)}% prob.)
        </div>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex items-center space-x-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            getRiskColor(scenario.riskLevel, variant)
          )}
        >
          {scenario.riskLevel}
        </span>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <button
          onClick={() => onRemove(scenario.id)}
          className={cn(
            'text-sm px-2 py-1 rounded transition-colors',
            variant === 'cyber'
              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              : 'text-red-600 hover:text-red-800 hover:bg-red-50'
          )}
        >
          Remove
        </button>
      </div>
    </div>

    {result && (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn('opacity-70', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}
          >
            Expected Value
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'font-medium',
              result.expectedValue >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatCurrency(result.expectedValue, currency)}
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn('opacity-70', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}
          >
            Kelly Optimal
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn('font-medium', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
          >
            {formatCurrency(result.kellyOptimal, currency)}
          </div>
        </div>
        {showAdvancedMetrics && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'opacity-70',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                Sharpe Ratio
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'font-medium',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {result.sharpeRatio.toFixed(2)}
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'opacity-70',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                Risk of Ruin
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                className={cn(
                  'font-medium',
                  result.riskMetrics.riskOfRuin > 10 ? 'text-red-600' : 'text-green-600'
                )}
              >
                {result.riskMetrics.riskOfRuin.toFixed(1)}%
              </div>
            </div>
          </>
        )}
      </div>
    )}
  </div>
);

// Portfolio Analysis Component
interface PortfolioAnalysisProps {
  results: SimulationResult[];
  variant: string;
  currency: string;
}

const _PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({ results, variant, currency }) => {
  const _totalExpectedValue = results.reduce((sum, r) => sum + r.expectedValue, 0);
  const _totalStake = results.reduce((sum, r) => sum + r.scenario.betAmount, 0);
  const _totalRisk = Math.sqrt(results.reduce((sum, r) => sum + r.variance, 0));
  const _portfolioSharpe = totalExpectedValue / totalRisk;

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h3
        className={cn(
          'font-semibold mb-4',
          variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
        )}
      >
        Portfolio Analysis
      </h3>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Total Expected Value
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn('font-bold', totalExpectedValue >= 0 ? 'text-green-600' : 'text-red-600')}
          >
            {formatCurrency(totalExpectedValue, currency)}
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Total Stake
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
            {formatCurrency(totalStake, currency)}
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Portfolio Risk
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
            {formatCurrency(totalRisk, currency)}
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Sharpe Ratio
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div
            className={cn('font-bold', portfolioSharpe >= 1 ? 'text-green-600' : 'text-orange-600')}
          >
            {portfolioSharpe.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Monte Carlo Results Component
interface MonteCarloResultsProps {
  results: {
    iterations: number;
    outcomes: number[];
    statistics: {
      mean: number;
      median: number;
      stdDev: number;
      percentiles: { p5: number; p25: number; p75: number; p95: number };
    };
  };
  variant: string;
  currency: string;
}

const _MonteCarloResults: React.FC<MonteCarloResultsProps> = ({ results, variant, currency }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <h3
      className={cn('font-semibold mb-4', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
    >
      Monte Carlo Simulation ({results.iterations.toLocaleString()} iterations)
    </h3>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          Mean Outcome
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'font-bold',
            results.statistics.mean >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          {formatCurrency(results.statistics.mean, currency)}
        </div>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          5th Percentile
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn('font-bold text-red-600')}>
          {formatCurrency(results.statistics.percentiles.p5, currency)}
        </div>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          Median
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
          {formatCurrency(results.statistics.median, currency)}
        </div>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          95th Percentile
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn('font-bold text-green-600')}>
          {formatCurrency(results.statistics.percentiles.p95, currency)}
        </div>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          Std Deviation
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
          {formatCurrency(results.statistics.stdDev, currency)}
        </div>
      </div>
    </div>
  </div>
);
