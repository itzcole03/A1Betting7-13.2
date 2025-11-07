/**
 * System Testing Dashboard Component
 * Comprehensive testing and validation monitoring
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  BarChart3,
  Shield,
  Zap,
  Database,
  Globe,
  Monitor,
  Code,
  Users,
  Target,
  RefreshCw,
  Eye,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi
} from 'lucide-react';

interface TestSuite {
  id: string;
  name: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'running' | 'passed' | 'failed' | 'pending';
  progress: number;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  lastRun: string;
  coverage?: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

const SystemTestingDashboard: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'unit-core',
      name: 'Core Unit Tests',
      category: 'unit',
      status: 'passed',
      progress: 100,
      duration: 45,
      totalTests: 284,
      passedTests: 284,
      failedTests: 0,
      lastRun: '2024-01-17 16:30:00',
      coverage: 94.7
    },
    {
      id: 'unit-components',
      name: 'Component Unit Tests',
      category: 'unit',
      status: 'passed',
      progress: 100,
      duration: 67,
      totalTests: 156,
      passedTests: 155,
      failedTests: 1,
      lastRun: '2024-01-17 16:25:00',
      coverage: 89.3
    },
    {
      id: 'integration-api',
      name: 'API Integration Tests',
      category: 'integration',
      status: 'running',
      progress: 75,
      duration: 0,
      totalTests: 89,
      passedTests: 67,
      failedTests: 0,
      lastRun: '2024-01-17 16:35:00',
      coverage: 92.1
    },
    {
      id: 'integration-database',
      name: 'Database Integration Tests',
      category: 'integration',
      status: 'passed',
      progress: 100,
      duration: 123,
      totalTests: 45,
      passedTests: 45,
      failedTests: 0,
      lastRun: '2024-01-17 16:20:00',
      coverage: 96.8
    },
    {
      id: 'e2e-user-flows',
      name: 'User Flow E2E Tests',
      category: 'e2e',
      status: 'passed',
      progress: 100,
      duration: 234,
      totalTests: 23,
      passedTests: 22,
      failedTests: 1,
      lastRun: '2024-01-17 16:15:00'
    },
    {
      id: 'e2e-predictions',
      name: 'Prediction System E2E',
      category: 'e2e',
      status: 'failed',
      progress: 100,
      duration: 189,
      totalTests: 18,
      passedTests: 15,
      failedTests: 3,
      lastRun: '2024-01-17 16:10:00'
    },
    {
      id: 'performance-load',
      name: 'Load Testing',
      category: 'performance',
      status: 'passed',
      progress: 100,
      duration: 456,
      totalTests: 12,
      passedTests: 11,
      failedTests: 1,
      lastRun: '2024-01-17 15:45:00'
    },
    {
      id: 'performance-stress',
      name: 'Stress Testing',
      category: 'performance',
      status: 'pending',
      progress: 0,
      duration: 0,
      totalTests: 8,
      passedTests: 0,
      failedTests: 0,
      lastRun: 'Never'
    },
    {
      id: 'security-auth',
      name: 'Authentication Security',
      category: 'security',
      status: 'passed',
      progress: 100,
      duration: 78,
      totalTests: 34,
      passedTests: 34,
      failedTests: 0,
      lastRun: '2024-01-17 14:30:00'
    },
    {
      id: 'security-api',
      name: 'API Security Tests',
      category: 'security',
      status: 'passed',
      progress: 100,
      duration: 145,
      totalTests: 56,
      passedTests: 56,
      failedTests: 0,
      lastRun: '2024-01-17 14:15:00'
    }
  ]);

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    { name: 'API Response Time', value: 145, target: 200, unit: 'ms', status: 'good', trend: 'down' },
    { name: 'Page Load Time', value: 1.8, target: 2.0, unit: 's', status: 'good', trend: 'stable' },
    { name: 'Database Query Time', value: 23, target: 50, unit: 'ms', status: 'good', trend: 'down' },
    { name: 'Memory Usage', value: 67, target: 80, unit: '%', status: 'good', trend: 'stable' },
    { name: 'CPU Usage', value: 23, target: 70, unit: '%', status: 'good', trend: 'stable' },
    { name: 'Error Rate', value: 0.02, target: 0.1, unit: '%', status: 'good', trend: 'down' },
    { name: 'Throughput', value: 1247, target: 1000, unit: 'req/min', status: 'good', trend: 'up' },
    { name: 'Uptime', value: 99.97, target: 99.9, unit: '%', status: 'good', trend: 'stable' }
  ]);

  const categories = [
    { id: 'all', name: 'All Tests', icon: Target },
    { id: 'unit', name: 'Unit Tests', icon: Code },
    { id: 'integration', name: 'Integration', icon: Globe },
    { id: 'e2e', name: 'End-to-End', icon: Users },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  const filteredTestSuites = selectedCategory === 'all' 
    ? testSuites 
    : testSuites.filter(suite => suite.category === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-400 bg-green-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      case 'running': return 'text-yellow-400 bg-yellow-500/20';
      case 'pending': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return CheckCircle;
      case 'failed': return XCircle;
      case 'running': return Clock;
      case 'pending': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const runAllTests = () => {
    setIsRunningTests(true);
    // Simulate running tests
    setTimeout(() => {
      setTestSuites(prev => prev.map(suite => ({
        ...suite,
        status: Math.random() > 0.1 ? 'passed' : 'failed',
        progress: 100,
        lastRun: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })));
      setIsRunningTests(false);
      setLastUpdate(new Date());
    }, 5000);
  };

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
  const overallCoverage = testSuites.reduce((sum, suite) => sum + (suite.coverage || 0), 0) / testSuites.filter(s => s.coverage).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              System Testing Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Comprehensive testing and validation monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${isRunningTests ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span className="text-sm">{isRunningTests ? 'Running Tests' : 'Ready'}</span>
            </div>
            
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg transition-colors"
            >
              {isRunningTests ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunningTests ? 'Running...' : 'Run All Tests'}</span>
            </button>
            
            <button
              onClick={() => setLastUpdate(new Date())}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="text-sm text-slate-500 mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Tests</p>
              <p className="text-2xl font-bold text-white">{totalTests}</p>
              <p className="text-xs text-green-400 mt-1">{totalPassed} passed</p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Success Rate</p>
              <p className="text-2xl font-bold text-white">{((totalPassed / totalTests) * 100).toFixed(1)}%</p>
              <p className="text-xs text-red-400 mt-1">{totalFailed} failed</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Code Coverage</p>
              <p className="text-2xl font-bold text-white">{overallCoverage.toFixed(1)}%</p>
              <p className="text-xs text-green-400 mt-1">Above target</p>
            </div>
            <Eye className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Running Suites</p>
              <p className="text-2xl font-bold text-white">{testSuites.filter(s => s.status === 'running').length}</p>
              <p className="text-xs text-yellow-400 mt-1">In progress</p>
            </div>
            <Activity className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      {/* Category Filters */}
      <div className="flex space-x-2 mb-8 bg-slate-800/50 rounded-lg p-1">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Test Suites */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-white">Test Suites</h2>
          
          <div className="space-y-4">
            {filteredTestSuites.map((suite, index) => {
              const StatusIcon = getStatusIcon(suite.status);
              return (
                <motion.div
                  key={suite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`w-6 h-6 ${getStatusColor(suite.status).split(' ')[0]}`} />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{suite.name}</h3>
                        <p className="text-sm text-slate-400 capitalize">{suite.category} tests</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(suite.status)}`}>
                      {suite.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {suite.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white">{suite.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${suite.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Total Tests</p>
                      <p className="text-lg font-semibold text-white">{suite.totalTests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Passed</p>
                      <p className="text-lg font-semibold text-green-400">{suite.passedTests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Failed</p>
                      <p className="text-lg font-semibold text-red-400">{suite.failedTests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Duration</p>
                      <p className="text-lg font-semibold text-white">{suite.duration}s</p>
                    </div>
                  </div>

                  {suite.coverage && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Code Coverage</span>
                        <span className="text-sm font-semibold text-white">{suite.coverage}%</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500">Last run: {suite.lastRun}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
          
          <div className="space-y-4">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-400">{metric.name}</h3>
                  {getTrendIcon(metric.trend)}
                </div>
                
                <div className="flex items-baseline space-x-1 mb-2">
                  <span className={`text-2xl font-bold ${
                    metric.status === 'good' ? 'text-green-400' :
                    metric.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {metric.value}
                  </span>
                  <span className="text-slate-400 text-sm">{metric.unit}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Target: {metric.target}{metric.unit}</span>
                  <span className={`px-2 py-1 rounded-full ${
                    metric.status === 'good' ? 'text-green-400 bg-green-500/20' :
                    metric.status === 'warning' ? 'text-yellow-400 bg-yellow-500/20' : 'text-red-400 bg-red-500/20'
                  }`}>
                    {metric.status.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTestingDashboard;
