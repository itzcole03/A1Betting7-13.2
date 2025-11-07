import React from 'react';
import { Database, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const DataQualityMonitor: React.FC = () => {
  const qualityMetrics = [
    { name: 'Data Freshness', value: 98.2, status: 'excellent' },
    { name: 'Source Reliability', value: 96.7, status: 'excellent' },
    { name: 'Completeness', value: 94.1, status: 'good' },
    { name: 'Accuracy', value: 97.8, status: 'excellent' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400 bg-green-500/20';
      case 'good': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-red-400 bg-red-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Data Quality Monitor</h3>
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-gray-400">Live monitoring</span>
        </div>
      </div>

      <div className="space-y-4">
        {qualityMetrics.map((metric) => (
          <div key={metric.name} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${getStatusColor(metric.status)}`}>
                {getStatusIcon(metric.status)}
              </div>
              <span className="text-white font-medium">{metric.name}</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{metric.value}%</div>
              <div className={`text-xs ${getStatusColor(metric.status).split(' ')[0]}`}>
                {metric.status.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-700/20 rounded-lg">
        <div className="text-sm text-gray-400 mb-2">Overall Data Quality Score</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-green-400">96.7%</div>
          <div className="text-sm text-green-400">Excellent</div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityMonitor;
