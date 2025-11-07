import React, { useEffect, useState } from 'react';
import { Activity, Settings, Monitor, Zap } from 'lucide-react';
import AdvancedHealthMonitor from '../../services/advancedHealthMonitor';
import RealTimePerformanceTracker from '../../services/realTimePerformanceTracker';
import ReliabilityMonitoringOrchestrator from '../../services/reliabilityMonitoringOrchestrator';

interface MonitoringState {
  healthMonitoring: boolean;
  performanceTracking: boolean;
  reliabilityOrchestrator: boolean;
  autoStart: boolean;
}

interface MonitoringStats {
  healthScore: number;
  performanceGrade: string;
  activeAlerts: number;
  sessionDuration: number;
  interactions: number;
}

const MonitoringIntegration: React.FC = () => {
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    healthMonitoring: false,
    performanceTracking: false,
    reliabilityOrchestrator: false,
    autoStart: true
  });

  const [stats, setStats] = useState<MonitoringStats>({
    healthScore: 0,
    performanceGrade: 'N/A',
    activeAlerts: 0,
    sessionDuration: 0,
    interactions: 0
  });

  const healthMonitor = AdvancedHealthMonitor.getInstance();
  const performanceTracker = RealTimePerformanceTracker.getInstance();
  const orchestrator = ReliabilityMonitoringOrchestrator.getInstance();

  useEffect(() => {
    // Check initial states
    updateMonitoringState();
    updateStats();

    // Auto-start monitoring if enabled
    if (monitoringState.autoStart) {
      startAllMonitoring();
    }

    // Set up periodic updates
    const interval = setInterval(() => {
      updateMonitoringState();
      updateStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateMonitoringState = () => {
    setMonitoringState(prev => ({
      ...prev,
      healthMonitoring: healthMonitor.isMonitoring(),
      performanceTracking: performanceTracker.isCurrentlyTracking(),
      reliabilityOrchestrator: orchestrator.isMonitoringActive()
    }));
  };

  const updateStats = () => {
    // Get health score
    const systemHealth = healthMonitor.getSystemHealth();
    
    // Get performance data
    const currentSession = performanceTracker.getCurrentSession();
    
    // Get reliability report
    const reliabilityReport = orchestrator.generateReport();

    setStats({
      healthScore: systemHealth.score,
      performanceGrade: reliabilityReport?.performanceGrade || 'N/A',
      activeAlerts: systemHealth.alerts.length,
      sessionDuration: currentSession 
        ? (Date.now() - currentSession.startTime.getTime()) / 1000 
        : 0,
      interactions: currentSession?.metrics.totalInteractions || 0
    });
  };

  const startAllMonitoring = async () => {
    try {
      // Start health monitoring
      if (!healthMonitor.isMonitoring()) {
        await healthMonitor.startMonitoring();
      }

      // Start performance tracking
      if (!performanceTracker.isCurrentlyTracking()) {
        performanceTracker.startTracking();
      }

      // Start reliability orchestrator
      if (!orchestrator.isMonitoringActive()) {
        await orchestrator.startMonitoring();
      }

      updateMonitoringState();
      console.log('[MonitoringIntegration] All monitoring systems started');
    } catch (error) {
      console.error('[MonitoringIntegration] Error starting monitoring:', error);
    }
  };

  const stopAllMonitoring = () => {
    try {
      healthMonitor.stopMonitoring();
      performanceTracker.stopTracking();
      orchestrator.stopMonitoring();

      updateMonitoringState();
      console.log('[MonitoringIntegration] All monitoring systems stopped');
    } catch (error) {
      console.error('[MonitoringIntegration] Error stopping monitoring:', error);
    }
  };

  const toggleHealthMonitoring = async () => {
    try {
      if (monitoringState.healthMonitoring) {
        healthMonitor.stopMonitoring();
      } else {
        await healthMonitor.startMonitoring();
      }
      updateMonitoringState();
    } catch (error) {
      console.error('[MonitoringIntegration] Error toggling health monitoring:', error);
    }
  };

  const togglePerformanceTracking = () => {
    try {
      if (monitoringState.performanceTracking) {
        performanceTracker.stopTracking();
      } else {
        performanceTracker.startTracking();
      }
      updateMonitoringState();
    } catch (error) {
      console.error('[MonitoringIntegration] Error toggling performance tracking:', error);
    }
  };

  const toggleReliabilityOrchestrator = async () => {
    try {
      if (monitoringState.reliabilityOrchestrator) {
        orchestrator.stopMonitoring();
      } else {
        await orchestrator.startMonitoring();
      }
      updateMonitoringState();
    } catch (error) {
      console.error('[MonitoringIntegration] Error toggling reliability orchestrator:', error);
    }
  };

  const getOverallStatus = () => {
    const activeCount = Object.values(monitoringState).filter(Boolean).length;
    if (activeCount >= 3) return { status: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (activeCount >= 2) return { status: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (activeCount >= 1) return { status: 'Partial', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'Inactive', color: 'text-gray-600 bg-gray-100' };
  };

  const overall = getOverallStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Monitor className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Monitoring Integration</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${overall.color}`}>
            {overall.status}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={startAllMonitoring}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Start All
          </button>
          <button
            onClick={stopAllMonitoring}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Stop All
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.healthScore}%</div>
          <div className="text-sm text-gray-600">Health Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.performanceGrade}</div>
          <div className="text-sm text-gray-600">Performance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.activeAlerts}</div>
          <div className="text-sm text-gray-600">Active Alerts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{Math.floor(stats.sessionDuration)}s</div>
          <div className="text-sm text-gray-600">Session Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.interactions}</div>
          <div className="text-sm text-gray-600">Interactions</div>
        </div>
      </div>

      {/* Monitoring Services */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 mb-3">Monitoring Services</h4>
        
        {/* Health Monitoring */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">Advanced Health Monitor</div>
              <div className="text-sm text-gray-600">
                Real-time system health, API response times, and Core Web Vitals
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${monitoringState.healthMonitoring ? 'bg-green-500' : 'bg-gray-300'}`} />
            <button
              onClick={toggleHealthMonitoring}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                monitoringState.healthMonitoring 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {monitoringState.healthMonitoring ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        {/* Performance Tracking */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Real-Time Performance Tracker</div>
              <div className="text-sm text-gray-600">
                User interactions, performance snapshots, and regression detection
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${monitoringState.performanceTracking ? 'bg-green-500' : 'bg-gray-300'}`} />
            <button
              onClick={togglePerformanceTracking}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                monitoringState.performanceTracking 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {monitoringState.performanceTracking ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        {/* Reliability Orchestrator */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-purple-600" />
            <div>
              <div className="font-medium text-gray-900">Reliability Orchestrator</div>
              <div className="text-sm text-gray-600">
                Comprehensive monitoring coordination and automated improvements
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${monitoringState.reliabilityOrchestrator ? 'bg-green-500' : 'bg-gray-300'}`} />
            <button
              onClick={toggleReliabilityOrchestrator}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                monitoringState.reliabilityOrchestrator 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {monitoringState.reliabilityOrchestrator ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-start Setting */}
      <div className="mt-6 pt-4 border-t">
        <label className="flex items-center space-x-3 text-sm">
          <input
            type="checkbox"
            checked={monitoringState.autoStart}
            onChange={(e) => setMonitoringState(prev => ({ ...prev, autoStart: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700">Auto-start monitoring systems on application load</span>
        </label>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Quick Actions:</strong> Monitor health scores, track user interactions, 
          detect performance regressions, and maintain system reliability automatically.
        </p>
      </div>
    </div>
  );
};

export default MonitoringIntegration;
