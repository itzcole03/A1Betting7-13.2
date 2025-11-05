/**
 * My CLV Tab Component
 * 
 * Frontend dashboard component for displaying user CLV analytics, performance metrics,
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  BarChart3,
  DollarSign,
  Percent,
  Star,
  Trophy,
  Medal,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Select } from '../base';
const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => (
  <option value={value}>{children}</option>
);

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ defaultValue, className = '', children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { activeTab, setActiveTab } as Record<string, unknown>) : child
      )}
    </div>
  );
};

const TabsList: React.FC<{ children: React.ReactNode; activeTab?: string; setActiveTab?: (tab: string) => void }> = ({ children, activeTab, setActiveTab }) => (
  <div className="flex space-x-1 border-b border-gray-200 mb-4">
    {React.Children.map(children, child =>
      React.isValidElement(child) ? React.cloneElement(child, { activeTab, setActiveTab } as Record<string, unknown>) : child
    )}
  </div>
);

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, activeTab, setActiveTab }) => (
  <button
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === value
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`}
    onClick={() => setActiveTab?.(value)}
  >
    {children}
  </button>
);

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  className?: string;
}

const TabsContent: React.FC<TabsContentProps> = ({ value, children, activeTab, className = '' }) => (
  activeTab === value ? <div className={className}>{children}</div> : null
);

// Types
interface CLVMetrics {
  avg_clv_percent: number | null;
  median_clv_percent: number | null;
  positive_clv_rate: number;
  total_bets: number;
  bets_with_clv: number;
  clv_distribution: {
    excellent: number;
    good: number;
    positive: number;
    slight_negative: number;
    poor: number;
  };
  best_clv: number | null;
  worst_clv: number | null;
  clv_consistency_score: number | null;
}

interface ProfitabilityMetrics {
  total_stake: number | null;
  total_profit_loss: number | null;
  roi_percent: number | null;
  win_rate: number | null;
  avg_stake: number | null;
  settled_bets: number;
  winning_bets: number;
  losing_bets: number;
  push_bets: number;
}

interface SportMarketBreakdown {
  sport_performance: { [key: string]: { avg_clv: number; count: number; positive_rate: number } };
  market_performance: { [key: string]: { avg_clv: number; count: number; positive_rate: number } };
  best_sport: string | null;
  best_market: string | null;
  worst_sport: string | null;
  worst_market: string | null;
}

interface CLVAnalytics {
  user_id: string;
  period_start: string;
  period_end: string;
  clv_metrics: CLVMetrics;
  profitability: ProfitabilityMetrics;
  breakdowns: SportMarketBreakdown;
  achievements: string[];
  ranking: {
    overall_rank: number | null;
    percentile: number | null;
    total_users: number | null;
  } | null;
  recent_trends: {
    recent_7d_bets: number;
    recent_7d_avg_clv: number | null;
    momentum: string;
  };
  recommendations: string[];
}

interface CLVHistoryPoint {
  period: string;
  period_start: string;
  period_end: string;
  avg_clv_percent: number | null;
  bet_count: number;
  positive_clv_rate: number | null;
  total_stake: number | null;
  profit_loss: number | null;
  roi_percent: number | null;
}

// Main Component
export const MyCLVTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<CLVAnalytics | null>(null);
  const [history, setHistory] = useState<CLVHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  const [refreshing, setRefreshing] = useState(false);
  const lightCardStyles = 'bg-white/95 border-gray-200 text-slate-900';

  // Fetch CLV analytics
  const fetchCLVAnalytics = async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/me/clv?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CLV analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CLV analytics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch CLV history
  const fetchCLVHistory = async (days: number = 90) => {
    try {
      const response = await fetch(`/api/users/me/clv/history?days=${days}&granularity=weekly`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.data_points || []);
      }
    } catch {
      // Failed to fetch CLV history - continue silently
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCLVAnalytics(selectedPeriod),
      fetchCLVHistory(selectedPeriod * 3) // Longer history for trends
    ]);
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    fetchCLVAnalytics(selectedPeriod);
    fetchCLVHistory(selectedPeriod * 3);
  }, [selectedPeriod]);

  // Period change handler
  const handlePeriodChange = (value: string) => {
    const days = parseInt(value);
    setSelectedPeriod(days);
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  // Achievement badge icons
  const getAchievementIcon = (achievement: string) => {
    if (achievement.includes('elite')) return <Trophy className="h-4 w-4" />;
    if (achievement.includes('champion')) return <Medal className="h-4 w-4" />;
    if (achievement.includes('consistent')) return <Target className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return history.map(point => ({
      period: point.period,
      clv: point.avg_clv_percent,
      bets: point.bet_count,
      roi: point.roi_percent
    }));
  }, [history]);

  // Distribution chart data
  const distributionData = useMemo(() => {
    if (!analytics?.clv_metrics?.clv_distribution) return [];
    
    const dist = analytics.clv_metrics.clv_distribution;
    return [
      { name: 'Excellent (10%+)', value: dist.excellent, color: '#22c55e' },
      { name: 'Good (5-10%)', value: dist.good, color: '#3b82f6' },
      { name: 'Positive (0-5%)', value: dist.positive, color: '#eab308' },
      { name: 'Slight Negative (0 to -5%)', value: dist.slight_negative, color: '#f97316' },
      { name: 'Poor (-5%+)', value: dist.poor, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading CLV analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        tone='error'
        className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
      >
        <span>{error}</span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => fetchCLVAnalytics(selectedPeriod)}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert tone='info' className='flex items-center gap-3'>
        <Info className='h-4 w-4' />
        <span className='text-sm'>
          No CLV data available. Start placing bets to see your closing line value analytics!
        </span>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My CLV Performance</h2>
          <p className="text-muted-foreground">
            Track your closing line value and betting performance over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            size='sm'
            className='w-32'
            value={selectedPeriod.toString()}
            onChange={(event) => handlePeriodChange(event.target.value)}
          >
            <option value='7'>7 days</option>
            <option value='30'>30 days</option>
            <option value='90'>90 days</option>
            <option value='365'>1 year</option>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card variant='outline' className={lightCardStyles}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average CLV</p>
                <p className={`text-2xl font-bold ${analytics.clv_metrics.avg_clv_percent && analytics.clv_metrics.avg_clv_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.clv_metrics.avg_clv_percent ? `${analytics.clv_metrics.avg_clv_percent.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <div className="flex items-center">
                {getTrendIcon(analytics.recent_trends.momentum)}
              </div>
            </div>
          </CardContent>
        </Card>

    <Card variant='outline' className={lightCardStyles}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive CLV Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.clv_metrics.positive_clv_rate.toFixed(1)}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

    <Card variant='outline' className={lightCardStyles}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bets</p>
                <p className="text-2xl font-bold">{analytics.clv_metrics.total_bets}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.clv_metrics.bets_with_clv} with CLV
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

    <Card variant='outline' className={lightCardStyles}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className={`text-2xl font-bold ${analytics.profitability.roi_percent && analytics.profitability.roi_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.profitability.roi_percent ? `${analytics.profitability.roi_percent.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CLV Distribution */}
            <Card variant='outline' className={lightCardStyles}>
              <CardHeader>
                <CardTitle>CLV Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No CLV data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card variant='outline' className={lightCardStyles}>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Win Rate</span>
                    <span className="font-semibold">
                      {analytics.profitability.win_rate ? `${analytics.profitability.win_rate.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistency Score</span>
                    <span className="font-semibold">
                      {analytics.clv_metrics.clv_consistency_score ? 
                        `${(analytics.clv_metrics.clv_consistency_score * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best CLV</span>
                    <span className="font-semibold text-green-600">
                      {analytics.clv_metrics.best_clv ? `+${analytics.clv_metrics.best_clv.toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Worst CLV</span>
                    <span className="font-semibold text-red-600">
                      {analytics.clv_metrics.worst_clv ? `${analytics.clv_metrics.worst_clv.toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {analytics.ranking && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Ranking</h4>
                    <div className="space-y-1">
                      {analytics.ranking.overall_rank && (
                        <div className="flex justify-between">
                          <span>Overall Rank</span>
                          <span className="font-semibold">#{analytics.ranking.overall_rank}</span>
                        </div>
                      )}
                      {analytics.ranking.percentile && (
                        <div className="flex justify-between">
                          <span>Percentile</span>
                          <span className="font-semibold">{analytics.ranking.percentile.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {analytics.recommendations.length > 0 && (
            <Card variant='outline' className={lightCardStyles}>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.recommendations.map((recommendation, index) => (
                    <Alert key={index} tone='info' className='flex items-start gap-3'>
                      <Info className='mt-1 h-4 w-4 shrink-0' />
                      <p className='text-sm leading-relaxed'>{recommendation}</p>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card variant='outline' className={lightCardStyles}>
            <CardHeader>
              <CardTitle>CLV Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="clv" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Average CLV (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No historical data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sport Performance */}
            <Card variant='outline' className={lightCardStyles}>
              <CardHeader>
                <CardTitle>Performance by Sport</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.breakdowns.sport_performance).map(([sport, stats]) => (
                    <div key={sport} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">{sport}</p>
                        <p className="text-sm text-muted-foreground">{stats.count} bets</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${stats.avg_clv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.avg_clv.toFixed(2)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stats.positive_rate.toFixed(1)}% positive
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Performance */}
            <Card variant='outline' className={lightCardStyles}>
              <CardHeader>
                <CardTitle>Performance by Market</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.breakdowns.market_performance).map(([market, stats]) => (
                    <div key={market} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold">{market}</p>
                        <p className="text-sm text-muted-foreground">{stats.count} bets</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${stats.avg_clv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.avg_clv.toFixed(2)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stats.positive_rate.toFixed(1)}% positive
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card variant='outline' className={lightCardStyles}>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                      {getAchievementIcon(achievement)}
                      <div>
                        <p className="font-semibold capitalize">
                          {achievement.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Achievement unlocked!
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No achievements yet</p>
                  <p className="text-sm">Keep betting to unlock achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyCLVTab;