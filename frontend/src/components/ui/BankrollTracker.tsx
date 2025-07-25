import React, { useState, useEffect } from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for bankroll management
interface BankrollEntry {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'loss' | 'bonus' | 'fee';
  amount: number;
  description: string;
  timestamp: Date;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface BankrollStats {
  currentBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;
  roi: number; // Return on Investment percentage
  winRate: number; // Percentage of winning bets
  averageBetSize: number;
  longestWinStreak: number;
  longestLossStreak: number;
  profitToday: number;
  profitThisWeek: number;
  profitThisMonth: number;
}

interface BankrollGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  description?: string;
  active: boolean;
}

interface BankrollTrackerProps {
  initialBalance?: number;
  entries?: BankrollEntry[];
  goals?: BankrollGoal[];
  variant?: 'default' | 'cyber' | 'minimal' | 'detailed' | 'dashboard';
  currency?: string;
  showChart?: boolean;
  showGoals?: boolean;
  showStats?: boolean;
  showRecentActivity?: boolean;
  autoSave?: boolean;
  className?: string;
  onBalanceChange?: (balance: number) => void;
  onEntryAdd?: (entry: BankrollEntry) => void;
  onGoalAdd?: (goal: BankrollGoal) => void;
  onExport?: (data: { entries: BankrollEntry[]; stats: BankrollStats }) => void;
}

const _calculateStats = (entries: BankrollEntry[], initialBalance: number = 0): BankrollStats => {
  const _deposits = entries.filter(e => e.type === 'deposit').reduce((sum, e) => sum + e.amount, 0);
  const _withdrawals = entries
    .filter(e => e.type === 'withdrawal')
    .reduce((sum, e) => sum + e.amount, 0);
  const _bets = entries.filter(e => e.type === 'bet').reduce((sum, e) => sum + e.amount, 0);
  const _winnings = entries.filter(e => e.type === 'win').reduce((sum, e) => sum + e.amount, 0);
  const _losses = entries.filter(e => e.type === 'loss').reduce((sum, e) => sum + e.amount, 0);

  const _currentBalance = initialBalance + deposits - withdrawals + winnings - losses - bets;
  const _netProfit = winnings - losses - bets;
  const _totalInvested = deposits;
  const _roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  const _betEntries = entries.filter(e => e.type === 'bet');
  const _winEntries = entries.filter(e => e.type === 'win');
  const _winRate = betEntries.length > 0 ? (winEntries.length / betEntries.length) * 100 : 0;
  const _averageBetSize = betEntries.length > 0 ? bets / betEntries.length : 0;

  // Calculate streaks
  let _currentWinStreak = 0;
  let _currentLossStreak = 0;
  let _longestWinStreak = 0;
  let _longestLossStreak = 0;

  const _gambleEntries = entries
    .filter(e => e.type === 'win' || e.type === 'loss')
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (const _entry of gambleEntries) {
    if (entry.type === 'win') {
      currentWinStreak++;
      currentLossStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
    }
  }

  // Calculate time-based profits
  const _now = new Date();
  const _today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const _thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const _thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const _profitToday = entries
    .filter(e => e.timestamp >= today && (e.type === 'win' || e.type === 'loss'))
    .reduce((sum, e) => sum + (e.type === 'win' ? e.amount : -e.amount), 0);

  const _profitThisWeek = entries
    .filter(e => e.timestamp >= thisWeek && (e.type === 'win' || e.type === 'loss'))
    .reduce((sum, e) => sum + (e.type === 'win' ? e.amount : -e.amount), 0);

  const _profitThisMonth = entries
    .filter(e => e.timestamp >= thisMonth && (e.type === 'win' || e.type === 'loss'))
    .reduce((sum, e) => sum + (e.type === 'win' ? e.amount : -e.amount), 0);

  return {
    currentBalance,
    totalDeposits: deposits,
    totalWithdrawals: withdrawals,
    totalBets: bets,
    totalWinnings: winnings,
    totalLosses: losses,
    netProfit,
    roi,
    winRate,
    averageBetSize,
    longestWinStreak,
    longestLossStreak,
    profitToday,
    profitThisWeek,
    profitThisMonth,
  };
};

const _formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const _getEntryIcon = (type: string) => {
  const _icons = {
    deposit: '💰',
    withdrawal: '🏧',
    bet: '🎲',
    win: '🎉',
    loss: '😞',
    bonus: '🎁',
    fee: '💸',
  };
  return icons[type as keyof typeof icons] || '📝';
};

const _getEntryColor = (type: string, variant: string = 'default') => {
  const _colors = {
    default: {
      deposit: 'text-green-600 bg-green-50 border-green-200',
      withdrawal: 'text-blue-600 bg-blue-50 border-blue-200',
      bet: 'text-orange-600 bg-orange-50 border-orange-200',
      win: 'text-green-600 bg-green-50 border-green-200',
      loss: 'text-red-600 bg-red-50 border-red-200',
      bonus: 'text-purple-600 bg-purple-50 border-purple-200',
      fee: 'text-gray-600 bg-gray-50 border-gray-200',
    },
    cyber: {
      deposit: 'text-green-300 bg-green-500/20 border-green-500/30',
      withdrawal: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
      bet: 'text-orange-300 bg-orange-500/20 border-orange-500/30',
      win: 'text-green-300 bg-green-500/20 border-green-500/30',
      loss: 'text-red-300 bg-red-500/20 border-red-500/30',
      bonus: 'text-purple-300 bg-purple-500/20 border-purple-500/30',
      fee: 'text-gray-300 bg-gray-500/20 border-gray-500/30',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[type as keyof typeof colors.cyber] || colors.cyber.fee
    : colors.default[type as keyof typeof colors.default] || colors.default.fee;
};

export const _BankrollTracker: React.FC<BankrollTrackerProps> = ({
  initialBalance = 0,
  entries = [],
  goals = [],
  variant = 'default',
  currency = 'USD',
  showChart = true,
  showGoals = true,
  showStats = true,
  showRecentActivity = true,
  autoSave = true,
  className,
  onBalanceChange,
  onEntryAdd,
  onGoalAdd,
  onExport,
}) => {
  const [bankrollEntries, setBankrollEntries] = useState<BankrollEntry[]>(entries);
  const [bankrollGoals, setBankrollGoals] = useState<BankrollGoal[]>(goals);
  const [stats, setStats] = useState<BankrollStats>(calculateStats(entries, initialBalance));
  const [newEntryType, setNewEntryType] = useState<BankrollEntry['type']>('deposit');
  const [newEntryAmount, setNewEntryAmount] = useState('');
  const [newEntryDescription, setNewEntryDescription] = useState('');

  // Recalculate stats when entries change
  useEffect(() => {
    const _newStats = calculateStats(bankrollEntries, initialBalance);
    setStats(newStats);
    onBalanceChange?.(newStats.currentBalance);
  }, [bankrollEntries, initialBalance, onBalanceChange]);

  const _addEntry = () => {
    if (!newEntryAmount || !newEntryDescription.trim()) return;

    const _entry: BankrollEntry = {
      id: Date.now().toString(),
      type: newEntryType,
      amount: parseFloat(newEntryAmount),
      description: newEntryDescription.trim(),
      timestamp: new Date(),
    };

    setBankrollEntries(prev => [entry, ...prev]);
    onEntryAdd?.(entry);

    // Reset form
    setNewEntryAmount('');
    setNewEntryDescription('');
  };

  const _addGoal = (name: string, targetAmount: number, deadline?: Date) => {
    const _goal: BankrollGoal = {
      id: Date.now().toString(),
      name,
      targetAmount,
      currentAmount: stats.currentBalance,
      deadline,
      active: true,
    };

    setBankrollGoals(prev => [...prev, goal]);
    onGoalAdd?.(goal);
  };

  const _exportData = () => {
    onExport?.({ entries: bankrollEntries, stats });
  };

  const _variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cyber:
      'bg-slate-900/95 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-50 border border-gray-200 rounded-md shadow-sm',
    detailed: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    dashboard:
      'bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-xl',
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
            Bankroll Tracker
          </h2>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p
            className={cn(
              'text-lg font-semibold mt-1',
              stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
              variant === 'cyber' && (stats.netProfit >= 0 ? 'text-green-300' : 'text-red-300')
            )}
          >
            {formatCurrency(stats.currentBalance, currency)}
          </p>
        </div>

        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center space-x-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={exportData}
            className={cn(
              'px-3 py-1 text-sm rounded transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {showStats && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='p-6 grid grid-cols-2 md:grid-cols-4 gap-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatCard
            label='Net Profit'
            value={formatCurrency(stats.netProfit, currency)}
            variant={variant}
            positive={stats.netProfit >= 0}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatCard
            label='ROI'
            value={`${stats.roi.toFixed(1)}%`}
            variant={variant}
            positive={stats.roi >= 0}
          />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatCard label='Win Rate' value={`${stats.winRate.toFixed(1)}%`} variant={variant} />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StatCard
            label='Avg Bet'
            value={formatCurrency(stats.averageBetSize, currency)}
            variant={variant}
          />
        </div>
      )}

      {/* Goals */}
      {showGoals && bankrollGoals.length > 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-6 border-t',
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
            Goals
          </h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-3'>
            {bankrollGoals
              .filter(g => g.active)
              .map(goal => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <GoalProgress
                  key={goal.id}
                  goal={goal}
                  currentBalance={stats.currentBalance}
                  variant={variant}
                  currency={currency}
                />
              ))}
          </div>
        </div>
      )}

      {/* Add Entry Form */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn(
          'p-6 border-t',
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
          Add Entry
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <select
            value={newEntryType}
            onChange={e => setNewEntryType(e.target.value as BankrollEntry['type'])}
            className={cn(
              'border rounded px-3 py-2',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300'
                : 'bg-white border-gray-300'
            )}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='deposit'>Deposit</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='withdrawal'>Withdrawal</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='bet'>Bet</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='win'>Win</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='loss'>Loss</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='bonus'>Bonus</option>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <option value='fee'>Fee</option>
          </select>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='number'
            step='0.01'
            placeholder='Amount'
            value={newEntryAmount}
            onChange={e => setNewEntryAmount(e.target.value)}
            className={cn(
              'border rounded px-3 py-2',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                : 'bg-white border-gray-300'
            )}
          />

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <input
            type='text'
            placeholder='Description'
            value={newEntryDescription}
            onChange={e => setNewEntryDescription(e.target.value)}
            className={cn(
              'border rounded px-3 py-2',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                : 'bg-white border-gray-300'
            )}
          />

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            onClick={addEntry}
            disabled={!newEntryAmount || !newEntryDescription.trim()}
            className={cn(
              'px-4 py-2 rounded font-medium transition-colors',
              variant === 'cyber'
                ? 'bg-cyan-500 text-black hover:bg-cyan-400 disabled:bg-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-400'
            )}
          >
            Add Entry
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {showRecentActivity && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'p-6 border-t',
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
            Recent Activity
          </h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-2 max-h-64 overflow-y-auto'>
            {bankrollEntries.slice(0, 10).map(entry => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div
                key={entry.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded border',
                  getEntryColor(entry.type, variant)
                )}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='flex items-center space-x-3'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <span className='text-lg'>{getEntryIcon(entry.type)}</span>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='font-medium'>{entry.description}</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs opacity-70'>
                      {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div
                  className={cn(
                    'font-bold',
                    entry.type === 'win' || entry.type === 'deposit' || entry.type === 'bonus'
                      ? 'text-green-600'
                      : entry.type === 'loss' ||
                          entry.type === 'bet' ||
                          entry.type === 'withdrawal' ||
                          entry.type === 'fee'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  )}
                >
                  {entry.type === 'loss' ||
                  entry.type === 'bet' ||
                  entry.type === 'withdrawal' ||
                  entry.type === 'fee'
                    ? '-'
                    : '+'}
                  {formatCurrency(entry.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-lg pointer-events-none' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg pointer-events-none' />
        </>
      )}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  variant: string;
  positive?: boolean;
}

const _StatCard: React.FC<StatCardProps> = ({ label, value, variant, positive }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div
    className={cn(
      'p-4 rounded-lg border',
      variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
    )}
  >
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn('text-sm opacity-70', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}
    >
      {label}
    </div>
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'text-lg font-bold',
        positive === true
          ? 'text-green-600'
          : positive === false
            ? 'text-red-600'
            : variant === 'cyber'
              ? 'text-cyan-300'
              : 'text-gray-900'
      )}
    >
      {value}
    </div>
  </div>
);

// Goal Progress Component
interface GoalProgressProps {
  goal: BankrollGoal;
  currentBalance: number;
  variant: string;
  currency: string;
}

const _GoalProgress: React.FC<GoalProgressProps> = ({ goal, currentBalance, variant, currency }) => {
  const _progress = Math.min((currentBalance / goal.targetAmount) * 100, 100);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'p-4 rounded-lg border',
        variant === 'cyber' ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-gray-50 border-gray-200'
      )}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='flex justify-between items-center mb-2'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span
          className={cn('font-medium', variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900')}
        >
          {goal.name}
        </span>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <span className={cn('text-sm', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}>
          {formatCurrency(currentBalance, currency)} / {formatCurrency(goal.targetAmount, currency)}
        </span>
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn('w-full bg-gray-200 rounded-full h-2', variant === 'cyber' && 'bg-slate-700')}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            variant === 'cyber' ? 'bg-cyan-500' : 'bg-blue-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        className={cn('text-xs mt-1', variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500')}
      >
        {progress.toFixed(1)}% complete
      </div>
    </div>
  );
};
