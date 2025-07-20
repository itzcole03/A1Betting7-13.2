import { useEffect, useState } from 'react';

// Type definitions (should be imported from types file in future)
export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: string;
  icon: React.ReactNode | null;
  description: string;
  gradient: string;
}

export interface LiveOpportunity {
  id: string;
  game: string;
  type: string;
  roi: number;
  stake: number;
  expectedProfit: number;
  confidence: number;
}

export function useKeyMetrics() {
  const [keyMetrics, setKeyMetrics] = useState<MetricCard[]>([]);
  useEffect(() => {
    fetch('http://localhost:8000/api/prizepicks/props/enhanced')
      .then(res => res.json())
      .then(data => {
        // Expecting array of props with real metrics
        if (!Array.isArray(data)) {
          setKeyMetrics([]);
          return;
        }
        // Aggregate metrics from props (example: win rate, profit, accuracy, ROI, Sharpe)
        const winRate = (data.filter((p: any) => p.result === 'win').length / data.length) * 100;
        const totalProfit = data.reduce((acc: number, p: any) => acc + (p.profit || 0), 0);
        const aiAccuracy =
          data.reduce((acc: number, p: any) => acc + (p.confidence || 0), 0) / data.length;
        const roi = data.reduce((acc: number, p: any) => acc + (p.roi || 0), 0) / data.length;
        const sharpeRatio =
          data.reduce((acc: number, p: any) => acc + (p.sharpe_ratio || 0), 0) / data.length;
        const metrics = [
          {
            id: 'win-rate',
            title: 'Win Rate',
            value: !isNaN(winRate) ? `${winRate.toFixed(1)}%` : 'N/A',
            change: '+0.0%',
            changeType: 'neutral',
            icon: null,
            description: 'Current prediction accuracy',
            gradient: 'from-green-400 to-green-600',
          },
          {
            id: 'total-profit',
            title: 'Total Profit',
            value: !isNaN(totalProfit) ? `$${totalProfit.toFixed(2)}` : 'N/A',
            change: '+0.0%',
            changeType: 'neutral',
            icon: null,
            description: 'Total realized profits',
            gradient: 'from-purple-400 to-purple-600',
          },
          {
            id: 'ai-accuracy',
            title: 'AI Accuracy',
            value: !isNaN(aiAccuracy) ? `${aiAccuracy.toFixed(1)}%` : 'N/A',
            change: '+0.0%',
            changeType: 'neutral',
            icon: null,
            description: 'ML model performance',
            gradient: 'from-cyan-400 to-cyan-600',
          },
          {
            id: 'live-opportunities',
            title: 'Live Opportunities',
            value: `${data.length}`,
            change: '+0.0%',
            changeType: 'neutral',
            icon: null,
            description: 'Active betting opportunities',
            gradient: 'from-yellow-400 to-yellow-600',
          },
          {
            id: 'roi',
            title: 'ROI',
            value: !isNaN(roi) ? `${roi.toFixed(2)}%` : 'N/A',
            change: '+0.0%',
            changeType: 'neutral',
            icon: null,
            description: 'Return on investment',
            gradient: 'from-pink-400 to-pink-600',
          },
          {
            id: 'sharpe-ratio',
            title: 'Sharpe Ratio',
            value: !isNaN(sharpeRatio) ? `${sharpeRatio.toFixed(2)}` : 'N/A',
            change: '+0.0',
            changeType: 'neutral',
            icon: null,
            description: 'Risk-adjusted return',
            gradient: 'from-indigo-400 to-indigo-600',
          },
        ];
        setKeyMetrics(metrics);
      })
      .catch(() => setKeyMetrics([]));
  }, []);
  return keyMetrics;
}

export function useLiveOpportunities() {
  const [liveOpportunities, setLiveOpportunities] = useState<LiveOpportunity[]>([]);
  useEffect(() => {
    fetch('http://localhost:8000/api/prizepicks/props')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setLiveOpportunities([]);
          return;
        }
        // Map API response to LiveOpportunity type
        const mapped = data.map((op: any) => ({
          id: op.id,
          game: op.player_name || op.name || '',
          roi: op.roi || 0,
          stake: op.stake || 0,
          expectedProfit: op.expected_profit || 0,
          confidence: op.confidence || 0,
          type: op.stat_type || op.type || '',
          source: op.source || '',
          timestamp: op.timestamp || '',
        }));
        setLiveOpportunities(mapped);
      })
      .catch(() => setLiveOpportunities([]));
  }, []);
  return liveOpportunities;
}

export function useMlModelStats() {
  const [mlModelStats, setMlModelStats] = useState<any[]>([]);
  useEffect(() => {
    fetch('http://localhost:8000/api/prizepicks/props/enhanced')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setMlModelStats([]);
          return;
        }
        // Extract model stats from enhanced props (example: accuracy, f1, auc, last_trained)
        const models = data.map((p: any) => ({
          name: p.model_name || p.player_name || '',
          accuracy: p.confidence || 0,
          f1_score: p.f1_score || null,
          auc: p.auc || null,
          last_trained: p.last_trained || '',
        }));
        setMlModelStats(models);
      })
      .catch(() => setMlModelStats([]));
  }, []);
  return mlModelStats;
}
