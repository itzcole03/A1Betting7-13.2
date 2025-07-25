import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
// @ts-expect-error TS(6142): Module '../components/ui/badge' was resolved to 'C... Remove this comment to see the full error message
import { Badge } from '../components/ui/badge';
// @ts-expect-error TS(6142): Module '../components/ui/button' was resolved to '... Remove this comment to see the full error message
import { Button } from '../components/ui/button';
// @ts-expect-error TS(6142): Module '../components/ui/card' was resolved to 'C:... Remove this comment to see the full error message
import { Card } from '../components/ui/card';

interface AutoBetRule {
  id: string;
  name: string;
  sport: string;
  condition: {
    type: 'confidence' | 'odds' | 'value' | 'composite';
    operator: '>' | '<' | '=' | '>=' | '<=';
    threshold: number;
  };
  action: {
    betType: 'moneyline' | 'spread' | 'total' | 'prop';
    stakeType: 'fixed' | 'percentage' | 'kelly';
    amount: number;
    maxStake: number;
  };
  filters: {
    minOdds: number;
    maxOdds: number;
    leagues: string[];
    timeWindow: string;
  };
  isActive: boolean;
  safetyLimits: {
    maxDailyStake: number;
    maxConsecutiveLosses: number;
    cooldownPeriod: number;
  };
}

interface AutoBetExecution {
  id: string;
  ruleId: string;
  game: string;
  betType: string;
  stake: number;
  odds: string;
  confidence: number;
  status: 'pending' | 'placed' | 'failed' | 'cancelled';
  timestamp: string;
  reasoning: string;
}

interface AutoPilotStats {
  isActive: boolean;
  rulesActive: number;
  betsToday: number;
  totalStaked: number;
  profitLoss: number;
  winRate: number;
  lastExecuted: string;
  safetyStatus: 'safe' | 'warning' | 'critical';
}

export const _AutoPilot: React.FC = () => {
  const [rules, setRules] = useState<AutoBetRule[]>([]);
  const [executions, setExecutions] = useState<AutoBetExecution[]>([]);
  const [stats, setStats] = useState<AutoPilotStats | null>(null);
  const [isGlobalActive, setIsGlobalActive] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  useEffect(() => {
    const _generateMockRules = (): AutoBetRule[] => {
      return [
        {
          id: 'rule-1',
          name: 'High Confidence NBA Totals',
          sport: 'NBA',
          condition: {
            type: 'confidence',
            operator: '>=',
            threshold: 85,
          },
          action: {
            betType: 'total',
            stakeType: 'kelly',
            amount: 2.5,
            maxStake: 250,
          },
          filters: {
            minOdds: -120,
            maxOdds: 120,
            leagues: ['NBA'],
            timeWindow: '2h',
          },
          isActive: true,
          safetyLimits: {
            maxDailyStake: 500,
            maxConsecutiveLosses: 3,
            cooldownPeriod: 30,
          },
        },
        {
          id: 'rule-2',
          name: 'NFL Value Spreads',
          sport: 'NFL',
          condition: {
            type: 'value',
            operator: '>',
            threshold: 3.5,
          },
          action: {
            betType: 'spread',
            stakeType: 'percentage',
            amount: 1.5,
            maxStake: 200,
          },
          filters: {
            minOdds: -115,
            maxOdds: 115,
            leagues: ['NFL'],
            timeWindow: '24h',
          },
          isActive: true,
          safetyLimits: {
            maxDailyStake: 400,
            maxConsecutiveLosses: 2,
            cooldownPeriod: 60,
          },
        },
        {
          id: 'rule-3',
          name: 'MLB Player Props',
          sport: 'MLB',
          condition: {
            type: 'composite',
            operator: '>=',
            threshold: 75,
          },
          action: {
            betType: 'prop',
            stakeType: 'fixed',
            amount: 50,
            maxStake: 100,
          },
          filters: {
            minOdds: -130,
            maxOdds: 130,
            leagues: ['MLB'],
            timeWindow: '4h',
          },
          isActive: false,
          safetyLimits: {
            maxDailyStake: 300,
            maxConsecutiveLosses: 4,
            cooldownPeriod: 15,
          },
        },
      ];
    };

    const _generateMockExecutions = (): AutoBetExecution[] => {
      const _games = [
        'Lakers vs Warriors',
        'Chiefs vs Bills',
        'Yankees vs Red Sox',
        'Celtics vs Heat',
        'Cowboys vs Eagles',
      ];

      return Array.from({ length: 10 }, (_, index) => ({
        id: `exec-${index}`,
        ruleId: `rule-${Math.floor(Math.random() * 3) + 1}`,
        game: games[Math.floor(Math.random() * games.length)],
        betType: ['total', 'spread', 'moneyline', 'prop'][Math.floor(Math.random() * 4)],
        stake: Math.floor(Math.random() * 200) + 50,
        odds:
          Math.random() > 0.5
            ? `+${Math.floor(Math.random() * 150) + 100}`
            : `-${Math.floor(Math.random() * 150) + 100}`,
        confidence: 70 + Math.random() * 25,
        status: ['placed', 'pending', 'failed'][Math.floor(Math.random() * 3)] as unknown,
        timestamp: `${Math.floor(Math.random() * 6) + 1}h ago`,
        reasoning: 'High confidence prediction with favorable value proposition',
      }));
    };

    const _generateMockStats = (): AutoPilotStats => ({
      isActive: isGlobalActive,
      rulesActive: 2,
      betsToday: 7,
      totalStaked: 850,
      profitLoss: 125,
      winRate: 65.5,
      lastExecuted: '15 min ago',
      safetyStatus: 'safe',
    });

    setRules(generateMockRules());
    setExecutions(generateMockExecutions());
    setStats(generateMockStats());
  }, [isGlobalActive]);

  const _toggleRule = (ruleId: string) => {
    setRules(prev =>
      prev.map(rule => (rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule))
    );
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return 'text-green-400 border-green-400';
      case 'pending':
        return 'text-yellow-400 border-yellow-400';
      case 'failed':
        return 'text-red-400 border-red-400';
      case 'cancelled':
        return 'text-gray-400 border-gray-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const _getConditionText = (rule: AutoBetRule) => {
    const { condition } = rule;
    const _typeText = {
      confidence: 'Confidence',
      odds: 'Odds',
      value: 'Expected Value',
      composite: 'Composite Score',
    }[condition.type];

    return `${typeText} ${condition.operator} ${condition.threshold}${condition.type === 'confidence' || condition.type === 'composite' ? '%' : ''}`;
  };

  const _getSafetyStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-green-400 border-green-400';
      case 'warning':
        return 'text-yellow-400 border-yellow-400';
      case 'critical':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-8'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card className='p-12 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent mb-4'>
            AUTO-PILOT
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-xl text-gray-300 mb-8'>Automated Betting & Rules Engine</p>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center gap-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              animate={
                isGlobalActive
                  ? {
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }
                  : {}
              }
              transition={{ duration: 2, repeat: isGlobalActive ? Infinity : 0 }}
              className={isGlobalActive ? 'text-purple-500' : 'text-gray-500'}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Zap className='w-12 h-12' />
            </motion.div>

            {stats && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='grid grid-cols-4 gap-8 text-center'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    className={`text-3xl font-bold ${isGlobalActive ? 'text-green-400' : 'text-gray-400'}`}
                  >
                    {isGlobalActive ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-400'>Status</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-3xl font-bold text-purple-400'>{stats.rulesActive}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-400'>Active Rules</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-3xl font-bold text-blue-400'>{stats.betsToday}</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-400'>Bets Today</div>
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div
                    className={`text-3xl font-bold ${stats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='text-gray-400'>P&L Today</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Master Controls */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Button
              onClick={() => setIsGlobalActive(!isGlobalActive)}
              className={`text-lg px-8 py-3 ${
                isGlobalActive
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
            >
              {isGlobalActive ? (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Pause className='mr-2 h-5 w-5' />
                  Stop Auto-Pilot
                </>
              ) : (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Play className='mr-2 h-5 w-5' />
                  Start Auto-Pilot
                </>
              )}
            </Button>

            {stats && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center gap-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Badge variant='outline' className={getSafetyStatusColor(stats.safetyStatus)}>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Shield className='w-3 h-3 mr-1' />
                  {stats.safetyStatus.toUpperCase()}
                </Badge>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Badge variant='outline' className='text-gray-400 border-gray-600'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Clock className='w-3 h-3 mr-1' />
                  Last: {stats.lastExecuted}
                </Badge>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Badge variant='outline' className='text-blue-400 border-blue-400'>
                  Win Rate: {stats.winRate.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Button onClick={() => setShowRuleBuilder(!showRuleBuilder)} variant='outline'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Settings className='w-4 h-4 mr-2' />
            Rule Builder
          </Button>
        </div>
      </Card>

      {/* Main Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Rules Management */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='xl:col-span-2 space-y-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Betting Rules</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Badge variant='outline' className='text-purple-400 border-purple-400'>
              {rules.filter(r => r.isActive).length} / {rules.length} Active
            </Badge>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-4'>
            {rules.map((rule, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card
                  className={`p-6 transition-all ${
                    rule.isActive ? 'border-purple-500/50 bg-purple-900/10' : 'border-gray-700/50'
                  }`}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h4 className='text-lg font-bold text-white'>{rule.name}</h4>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center gap-2 mt-2'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Badge variant='outline' className='text-gray-400 border-gray-600'>
                          {rule.sport}
                        </Badge>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Badge variant='outline' className='text-blue-400 border-blue-400'>
                          {rule.action.betType.toUpperCase()}
                        </Badge>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Badge
                          variant='outline'
                          className={
                            rule.isActive
                              ? 'text-green-400 border-green-400'
                              : 'text-red-400 border-red-400'
                          }
                        >
                          {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Button
                      onClick={() => toggleRule(rule.id)}
                      size='sm'
                      className={
                        rule.isActive
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }
                    >
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h5 className='font-bold text-white mb-2'>Trigger Condition</h5>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-gray-300 text-sm'>{getConditionText(rule)}</p>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h5 className='font-bold text-white mb-2'>Betting Action</h5>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm space-y-1'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Stake Type:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white capitalize'>{rule.action.stakeType}</span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Amount:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white'>
                            {rule.action.stakeType === 'percentage'
                              ? `${rule.action.amount}%`
                              : rule.action.stakeType === 'kelly'
                                ? `${rule.action.amount}% Kelly`
                                : `$${rule.action.amount}`}
                          </span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Max Stake:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white'>${rule.action.maxStake}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h5 className='font-bold text-white mb-2'>Filters</h5>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm space-y-1'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Odds Range:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white'>
                            {rule.filters.minOdds} to {rule.filters.maxOdds}
                          </span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Time Window:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white'>{rule.filters.timeWindow}</span>
                        </div>
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h5 className='font-bold text-white mb-2'>Safety Limits</h5>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-sm space-y-1'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Daily Max:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white'>${rule.safetyLimits.maxDailyStake}</span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Max Losses:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white'>
                            {rule.safetyLimits.maxConsecutiveLosses}
                          </span>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex justify-between'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-gray-400'>Cooldown:</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-white'>{rule.safetyLimits.cooldownPeriod}min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Executions & Stats */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='space-y-6'>
          {/* Statistics */}
          {stats && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card className='p-6'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <BarChart3 className='w-5 h-5 text-purple-400' />
                Performance Stats
              </h4>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between text-sm mb-1'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Win Rate</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-green-400 font-bold'>{stats.winRate.toFixed(1)}%</span>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='w-full bg-gray-700 rounded-full h-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <motion.div
                      className='bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full'
                      animate={{ width: `${stats.winRate}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Bets Today:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-blue-400 font-bold'>{stats.betsToday}</div>
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Total Staked:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-purple-400 font-bold'>${stats.totalStaked}</div>
                  </div>
                </div>

                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='p-3 bg-slate-800/50 rounded-lg'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex justify-between items-center'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>Safety Status:</span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Badge variant='outline' className={getSafetyStatusColor(stats.safetyStatus)}>
                      {stats.safetyStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Recent Executions */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <CheckCircle className='w-5 h-5 text-green-400' />
              Recent Executions
            </h4>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {executions.slice(0, 8).map((execution, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={execution.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='p-3 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h5 className='font-bold text-white text-sm'>{execution.game}</h5>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-gray-400 text-xs'>{execution.betType.toUpperCase()}</p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Badge variant='outline' className={getStatusColor(execution.status)}>
                      {execution.status.toUpperCase()}
                    </Badge>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-2 text-xs mb-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Stake:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-green-400 font-bold'>${execution.stake}</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Odds:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-blue-400 font-bold'>{execution.odds}</div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-center justify-between text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>
                      Confidence: {execution.confidence.toFixed(0)}%
                    </span>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <span className='text-gray-400'>{execution.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Emergency Controls */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6 border-red-500/30 bg-red-900/10'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <AlertTriangle className='w-5 h-5 text-red-400' />
              Emergency Controls
            </h4>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button
                variant='outline'
                className='w-full text-red-400 border-red-400 hover:bg-red-500/20'
              >
                Pause All Rules
              </Button>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button
                variant='outline'
                className='w-full text-yellow-400 border-yellow-400 hover:bg-yellow-500/20'
              >
                Cancel Pending Bets
              </Button>

              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Button
                variant='outline'
                className='w-full text-orange-400 border-orange-400 hover:bg-orange-500/20'
              >
                Emergency Stop
              </Button>
            </div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='mt-4 p-3 bg-slate-800/50 rounded-lg'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-xs text-gray-400 space-y-1'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>• Auto-pilot will stop if 5 consecutive losses</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>• Daily loss limit: $1,000</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div>• Maximum single bet: $500</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
