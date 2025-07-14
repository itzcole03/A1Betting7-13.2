import React, { useState, useEffect } from 'react';
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

const calculateExpectedValue = (betAmount: number, odds: number, probability: number): number => {
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  const winAmount = betAmount * (decimalOdds - 1);
  const lossAmount = betAmount;
  return probability * winAmount - (1 - probability) * lossAmount;
};

const calculateKellyPercentage = (odds: number, probability: number): number => {
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
  const q = 1 - probability;
  const b = decimalOdds - 1;
  return Math.max(0, (probability * b - q) / b);
};

const calculateRiskLevel = (
  ev: number,
  kelly: number,
  variance: number
): 'low' | 'medium' | 'high' | 'extreme' => {
  if (ev < 0) return 'extreme';
  if (kelly < 0.02 || variance > 100) return 'high';
  if (kelly < 0.05 || variance > 50) return 'medium';
  return 'low';
};

const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const getRiskColor = (risk: string, variant: string = 'default') => {
  const colors = {
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

export const BetSimulationTool: React.FC<BetSimulationToolProps> = ({
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

  const runSimulation = (scenario: BetScenario): SimulationResult => {
    const decimalOdds =
      scenario.odds > 0 ? scenario.odds / 100 + 1 : 100 / Math.abs(scenario.odds) + 1;
    const winPayout = scenario.betAmount * decimalOdds;
    const winProfit = winPayout - scenario.betAmount;
    const lossAmount = scenario.betAmount;

    const expectedValue = calculateExpectedValue(
      scenario.betAmount,
      scenario.odds,
      scenario.probability
    );
    const variance =
      scenario.probability * Math.pow(winProfit, 2) +
      (1 - scenario.probability) * Math.pow(-lossAmount, 2) -
      Math.pow(expectedValue, 2);
    const sharpeRatio = expectedValue / Math.sqrt(variance);
    const kellyOptimal = calculateKellyPercentage(scenario.odds, scenario.probability) * bankroll;

    const requiredWinRate =
      scenario.odds > 0
        ? 100 / (scenario.odds + 100)
        : Math.abs(scenario.odds) / (Math.abs(scenario.odds) + 100);

    const riskOfRuin = bankroll > 0 ? Math.exp((-2 * expectedValue * bankroll) / variance) : 1;

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

  const runAllSimulations = () => {
    const results = betScenarios.map(runSimulation);
    setSimulationResults(results);
    onSimulationRun?.(results);
  };

  const runMonteCarloSimulation = (iterations: number = 10000) => {
    if (betScenarios.length === 0) return;

    const outcomes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      let portfolioOutcome = 0;

      for (const scenario of betScenarios) {
        const random = Math.random();
        if (random < scenario.probability) {
          // Win
          const decimalOdds =
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
    const mean = outcomes.reduce((sum, val) => sum + val, 0) / outcomes.length;
    const median = outcomes[Math.floor(outcomes.length / 2)];
    const variance =
      outcomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / outcomes.length;
    const stdDev = Math.sqrt(variance);

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

  const addScenario = () => {
    if (
      !newScenario.name ||
      !newScenario.betAmount ||
      !newScenario.odds ||
      !newScenario.probability
    ) {
      return;
    }

    const betAmount = parseFloat(newScenario.betAmount);
    const odds = parseFloat(newScenario.odds);
    const probability = parseFloat(newScenario.probability) / 100;

    const expectedValue = calculateExpectedValue(betAmount, odds, probability);
    const kellyPercentage = calculateKellyPercentage(odds, probability);
    const variance =
      probability * Math.pow((betAmount * odds) / 100, 2) +
      (1 - probability) * Math.pow(betAmount, 2);
    const riskLevel = calculateRiskLevel(expectedValue, kellyPercentage, variance);

    const scenario: BetScenario = {
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

  const removeScenario = (id: string) => {
    setBetScenarios(prev => prev.filter(s => s.id !== id));
    setSimulationResults(prev => prev.filter(r => r.scenario.id !== id));
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    advanced: 'bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded-xl shadow-lg',
    professional: 'bg-white border border-gray-300 rounded-xl shadow-xl',
  };

  return (
    <div className={cn('relative', variantClasses[variant], className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-6 border-b',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        <div>
          <h2
            className={cn(
              'text-xl font-bold',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Bet Simulation Tool
          </h2>
          <p
            className={cn(
              'text-sm mt-1',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600'
            )}
          >
            Bankroll: {formatCurrency(bankroll, currency)}
          </p>
        </div>

        <div className='flex items-center space-x-2'>
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
      <div
        className={cn(
          'p-6 border-b',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        <h3
          className={cn(
            'font-semibold mb-4',
            variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
          )}
        >
          Add Betting Scenario
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
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
        <div className='p-6'>
          <h3
            className={cn(
              'font-semibold mb-4',
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
            )}
          >
            Scenarios ({betScenarios.length})
          </h3>
          <div className='space-y-3'>
            {betScenarios.map(scenario => {
              const result = simulationResults.find(r => r.scenario.id === scenario.id);
              return (
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
        <div
          className={cn(
            'p-6 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          <PortfolioAnalysis results={simulationResults} variant={variant} currency={currency} />
        </div>
      )}

      {/* Monte Carlo Results */}
      {showMonteCarlo && monteCarloResults && (
        <div
          className={cn(
            'p-6 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          <MonteCarloResults results={monteCarloResults} variant={variant} currency={currency} />
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg pointer-events-none' />
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

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  result,
  variant,
  currency,
  showAdvancedMetrics,
  onRemove,
}) => (
  <div
    className={cn(
      'p-4 rounded-lg border',
      variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
    )}
  >
    <div className='flex justify-between items-start mb-3'>
      <div>
        <h4 className={cn('font-medium', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
          {scenario.name}
        </h4>
        <div
          className={cn('text-sm mt-1', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600')}
        >
          {formatCurrency(scenario.betAmount, currency)} @ {formatOdds(scenario.odds)} (
          {(scenario.probability * 100).toFixed(1)}% prob.)
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            getRiskColor(scenario.riskLevel, variant)
          )}
        >
          {scenario.riskLevel}
        </span>
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
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
        <div>
          <div
            className={cn('opacity-70', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}
          >
            Expected Value
          </div>
          <div
            className={cn(
              'font-medium',
              result.expectedValue >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatCurrency(result.expectedValue, currency)}
          </div>
        </div>
        <div>
          <div
            className={cn('opacity-70', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}
          >
            Kelly Optimal
          </div>
          <div
            className={cn('font-medium', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
          >
            {formatCurrency(result.kellyOptimal, currency)}
          </div>
        </div>
        {showAdvancedMetrics && (
          <>
            <div>
              <div
                className={cn(
                  'opacity-70',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                Sharpe Ratio
              </div>
              <div
                className={cn(
                  'font-medium',
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
                )}
              >
                {result.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div>
              <div
                className={cn(
                  'opacity-70',
                  variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
                )}
              >
                Risk of Ruin
              </div>
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

const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({ results, variant, currency }) => {
  const totalExpectedValue = results.reduce((sum, r) => sum + r.expectedValue, 0);
  const totalStake = results.reduce((sum, r) => sum + r.scenario.betAmount, 0);
  const totalRisk = Math.sqrt(results.reduce((sum, r) => sum + r.variance, 0));
  const portfolioSharpe = totalExpectedValue / totalRisk;

  return (
    <div>
      <h3
        className={cn(
          'font-semibold mb-4',
          variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
        )}
      >
        Portfolio Analysis
      </h3>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Total Expected Value
          </div>
          <div
            className={cn('font-bold', totalExpectedValue >= 0 ? 'text-green-600' : 'text-red-600')}
          >
            {formatCurrency(totalExpectedValue, currency)}
          </div>
        </div>
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Total Stake
          </div>
          <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
            {formatCurrency(totalStake, currency)}
          </div>
        </div>
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Portfolio Risk
          </div>
          <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
            {formatCurrency(totalRisk, currency)}
          </div>
        </div>
        <div
          className={cn(
            'p-3 rounded border',
            variant === 'cyber'
              ? 'bg-slate-800/50 border-cyan-500/30'
              : 'bg-gray-50 border-gray-200'
          )}
        >
          <div
            className={cn(
              'text-sm opacity-70',
              variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
            )}
          >
            Sharpe Ratio
          </div>
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

const MonteCarloResults: React.FC<MonteCarloResultsProps> = ({ results, variant, currency }) => (
  <div>
    <h3
      className={cn('font-semibold mb-4', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
    >
      Monte Carlo Simulation ({results.iterations.toLocaleString()} iterations)
    </h3>
    <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          Mean Outcome
        </div>
        <div
          className={cn(
            'font-bold',
            results.statistics.mean >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          {formatCurrency(results.statistics.mean, currency)}
        </div>
      </div>
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          5th Percentile
        </div>
        <div className={cn('font-bold text-red-600')}>
          {formatCurrency(results.statistics.percentiles.p5, currency)}
        </div>
      </div>
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          Median
        </div>
        <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
          {formatCurrency(results.statistics.median, currency)}
        </div>
      </div>
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          95th Percentile
        </div>
        <div className={cn('font-bold text-green-600')}>
          {formatCurrency(results.statistics.percentiles.p95, currency)}
        </div>
      </div>
      <div
        className={cn(
          'p-3 rounded border',
          variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
        )}
      >
        <div
          className={cn(
            'text-sm opacity-70',
            variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'
          )}
        >
          Std Deviation
        </div>
        <div className={cn('font-bold', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}>
          {formatCurrency(results.statistics.stdDev, currency)}
        </div>
      </div>
    </div>
  </div>
);
