import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Settings,
  BarChart3,
  Target,
  Brain,
  Database,
  Monitor,
  Gauge,
} from 'lucide-react';
import ReliabilityMonitoringOrchestrator, { ReliabilityReport } from '../../services/reliabilityMonitoringOrchestrator';

const ComprehensiveReliabilityDashboard: React.FC = () => {
  const [reliabilityReport, setReliabilityReport] = useState<ReliabilityReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const orchestrator = ReliabilityMonitoringOrchestrator.getInstance();

  useEffect(() => {
    // Check if monitoring is active
    setIsMonitoring(orchestrator.isMonitoringActive());
    
    // Load initial report
    updateReport();
    
    // Set up auto-refresh
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        updateReport();
      }, 10000); // Update every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const updateReport = () => {
    const report = orchestrator.getLatestReport();
    if (report) {
      setReliabilityReport(report);
      setLastUpdate(new Date());
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await orchestrator.startMonitoring();
      setIsMonitoring(true);
      setTimeout(updateReport, 2000);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const handleStopMonitoring = () => {
    orchestrator.stopMonitoring();
    setIsMonitoring(false);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-emerald-400 bg-emerald-500/20';
      case 'good': return 'text-green-400 bg-green-500/20';
      case 'fair': return 'text-yellow-400 bg-yellow-500/20';
      case 'poor': return 'text-orange-400 bg-orange-500/20';
      case 'critical': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('A')) return 'text-emerald-400 bg-emerald-500/20';
    if (grade === 'B') return 'text-blue-400 bg-blue-500/20';
    if (grade === 'C') return 'text-yellow-400 bg-yellow-500/20';
    if (grade === 'D') return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (!reliabilityReport) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Comprehensive Reliability Dashboard
            </h1>
            <p className="text-gray-400">Advanced transparency and reliability monitoring</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isMonitoring ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isMonitoring ? 'MONITORING' : 'STOPPED'}
            </span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
          <div className="text-center">
            <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Reliability Monitoring Not Active
            </h2>
            <p className="text-gray-400 mb-6">
              Start comprehensive monitoring to track performance, reliability, and continuous improvements.
            </p>
            <button
              onClick={handleStartMonitoring}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 mx-auto"
            >
              <Activity className="w-4 h-4" />
              <span>Start Comprehensive Monitoring</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Comprehensive Reliability Dashboard
          </h1>
          <p className="text-gray-400">Advanced transparency and reliability monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isMonitoring ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isMonitoring ? 'MONITORING' : 'STOPPED'}
            </span>
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded border text-sm ${
              autoRefresh 
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                : 'bg-slate-700 text-gray-400 border-slate-600'
            }`}
          >
            Auto Refresh
          </button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Overall Health</h3>
              <p className="text-sm text-gray-400">System-wide status</p>
            </div>
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-center">
            <div className={`inline-flex px-4 py-2 rounded-full text-lg font-bold ${getHealthColor(reliabilityReport.overallHealth)}`}>
              {reliabilityReport.overallHealth.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Performance Grade</h3>
              <p className="text-sm text-gray-400">Overall performance</p>
            </div>
            <Gauge className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="text-center">
            <div className={`inline-flex px-4 py-2 rounded-full text-2xl font-bold ${getGradeColor(reliabilityReport.performanceGrade)}`}>
              {reliabilityReport.performanceGrade}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Uptime</h3>
              <p className="text-sm text-gray-400">System availability</p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatPercentage(reliabilityReport.reliability.uptime)}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Error Rate</h3>
              <p className="text-sm text-gray-400">System reliability</p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${reliabilityReport.reliability.errorRate > 0.05 ? 'text-red-400' : 'text-green-400'}`} />
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${reliabilityReport.reliability.errorRate > 0.05 ? 'text-red-400' : 'text-green-400'}`}>
              {formatPercentage(reliabilityReport.reliability.errorRate * 100)}
            </div>
          </div>
        </div>
      </div>

      {/* Component Health Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demo Performance */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center">
                <Monitor className="w-5 h-5 text-blue-400 mr-2" />
                Demo Performance
              </h3>
              <p className="text-gray-400">Live demo monitoring</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(reliabilityReport.demoPerformance.grade)}`}>
              {reliabilityReport.demoPerformance.grade}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Performance Score</span>
                <span className="text-white font-semibold">{reliabilityReport.demoPerformance.score.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, reliabilityReport.demoPerformance.score)}%` }}
                />
              </div>
            </div>

            {reliabilityReport.demoPerformance.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-2">Critical Issues</h4>
                <div className="space-y-1">
                  {reliabilityReport.demoPerformance.issues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="text-xs text-red-300 bg-red-900/20 border border-red-700/30 rounded p-2">
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reliabilityReport.demoPerformance.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-2">Recommendations</h4>
                <div className="space-y-1">
                  {reliabilityReport.demoPerformance.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="text-xs text-blue-300 bg-blue-900/20 border border-blue-700/30 rounded p-2">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Pipeline Health */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center">
                <Database className="w-5 h-5 text-green-400 mr-2" />
                Data Pipeline Health
              </h3>
              <p className="text-gray-400">Service monitoring</p>
            </div>
            <div className="text-green-400 font-semibold">
              {reliabilityReport.dataPipeline.servicesHealthy}/{reliabilityReport.dataPipeline.totalServices} Healthy
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Pipeline Score</span>
                <span className="text-white font-semibold">{reliabilityReport.dataPipeline.score.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, reliabilityReport.dataPipeline.score)}%` }}
                />
              </div>
            </div>

            {reliabilityReport.dataPipeline.criticalIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-2">Critical Issues</h4>
                <div className="space-y-1">
                  {reliabilityReport.dataPipeline.criticalIssues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="text-xs text-red-300 bg-red-900/20 border border-red-700/30 rounded p-2">
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reliabilityReport.dataPipeline.degradedServices.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">Degraded Services</h4>
                <div className="space-y-1">
                  {reliabilityReport.dataPipeline.degradedServices.map((service, index) => (
                    <div key={index} className="text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700/30 rounded p-2">
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400 mr-2" />
          <h3 className="text-xl font-bold text-white">Trend Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
            <div>
              <div className="text-gray-400 text-sm">Performance</div>
              <div className="text-white font-semibold capitalize">{reliabilityReport.trends.performance}</div>
            </div>
            {getTrendIcon(reliabilityReport.trends.performance)}
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
            <div>
              <div className="text-gray-400 text-sm">Reliability</div>
              <div className="text-white font-semibold capitalize">{reliabilityReport.trends.reliability}</div>
            </div>
            {getTrendIcon(reliabilityReport.trends.reliability)}
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
            <div>
              <div className="text-gray-400 text-sm">User Experience</div>
              <div className="text-white font-semibold capitalize">{reliabilityReport.trends.userSatisfaction}</div>
            </div>
            {getTrendIcon(reliabilityReport.trends.userSatisfaction)}
          </div>
        </div>
      </div>

      {/* Continuous Improvement Recommendations */}
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-xl font-bold text-white">Continuous Improvement Recommendations</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Immediate Actions */}
          {reliabilityReport.improvements.immediate.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-400 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                Immediate
              </h4>
              <div className="space-y-2">
                {reliabilityReport.improvements.immediate.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs text-red-300 bg-red-900/20 border border-red-700/30 rounded p-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Short Term */}
          {reliabilityReport.improvements.shortTerm.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Short Term
              </h4>
              <div className="space-y-2">
                {reliabilityReport.improvements.shortTerm.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700/30 rounded p-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Long Term */}
          {reliabilityReport.improvements.longTerm.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-400 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Long Term
              </h4>
              <div className="space-y-2">
                {reliabilityReport.improvements.longTerm.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs text-blue-300 bg-blue-900/20 border border-blue-700/30 rounded p-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation */}
          {reliabilityReport.improvements.automation.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-400 mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Automation
              </h4>
              <div className="space-y-2">
                {reliabilityReport.improvements.automation.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs text-green-300 bg-green-900/20 border border-green-700/30 rounded p-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Monitoring Control</h3>
            <p className="text-gray-400">Manage comprehensive reliability monitoring</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={updateReport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Report</span>
            </button>
            
            {isMonitoring ? (
              <button
                onClick={handleStopMonitoring}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Stop Monitoring
              </button>
            ) : (
              <button
                onClick={handleStartMonitoring}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Start Monitoring
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveReliabilityDashboard;
