import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'maintenance';
  uptime: string;
  responseTime: number;
  version: string;
  lastCheck: Date;
  dependencies?: string[];
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    incoming: number;
    outgoing: number;
  };
  activeConnections: number;
  totalRequests: number;
  errorRate: number;
}

export interface BackendControlProps {
  variant?: 'default' | 'cyber' | 'minimal' | 'dashboard';
  services?: ServiceStatus[];
  metrics?: SystemMetrics;
  className?: string;
  onServiceAction?: (serviceId: string, action: string) => void;
  onSystemAction?: (action: string, params?: any) => void;
  showLogs?: boolean;
  showMetrics?: boolean;
  showServices?: boolean;
  showControls?: boolean;
  realTimeUpdates?: boolean;
}

export const BackendControl: React.FC<BackendControlProps> = ({
  variant = 'default',
  services = [],
  metrics,
  className = '',
  onServiceAction,
  onSystemAction,
  showLogs = true,
  showMetrics = true,
  showServices = true,
  showControls = true,
  realTimeUpdates = false,
}) => {
  const [activeTab, setActiveTab] = useState('services');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultServices: ServiceStatus[] =
    services.length > 0
      ? services
      : [
          {
            id: 'api-gateway',
            name: 'API Gateway',
            status: 'online',
            uptime: '99.9%',
            responseTime: 45,
            version: '2.1.3',
            lastCheck: new Date(),
            dependencies: ['auth-service', 'database'],
          },
          {
            id: 'auth-service',
            name: 'Authentication Service',
            status: 'online',
            uptime: '99.8%',
            responseTime: 23,
            version: '1.8.2',
            lastCheck: new Date(),
          },
          {
            id: 'database',
            name: 'Database Cluster',
            status: 'warning',
            uptime: '98.5%',
            responseTime: 120,
            version: '14.2',
            lastCheck: new Date(),
          },
          {
            id: 'redis-cache',
            name: 'Redis Cache',
            status: 'online',
            uptime: '99.9%',
            responseTime: 2,
            version: '7.0.8',
            lastCheck: new Date(),
          },
          {
            id: 'betting-engine',
            name: 'Betting Engine',
            status: 'online',
            uptime: '99.7%',
            responseTime: 67,
            version: '3.2.1',
            lastCheck: new Date(),
            dependencies: ['database', 'redis-cache'],
          },
        ];

  const defaultMetrics: SystemMetrics = metrics || {
    cpu: 45,
    memory: 67,
    disk: 23,
    network: {
      incoming: 1250,
      outgoing: 890,
    },
    activeConnections: 342,
    totalRequests: 15678,
    errorRate: 0.02,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return variant === 'cyber' ? '#00ff88' : '#10b981';
      case 'warning':
        return variant === 'cyber' ? '#ffaa00' : '#f59e0b';
      case 'offline':
        return variant === 'cyber' ? '#ff0044' : '#ef4444';
      case 'maintenance':
        return variant === 'cyber' ? '#0088ff' : '#3b82f6';
      default:
        return variant === 'cyber' ? '#666' : '#6b7280';
    }
  };

  const handleServiceAction = (serviceId: string, action: string) => {
    setIsLoading(true);
    onServiceAction?.(serviceId, action);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSystemAction = (action: string, params?: any) => {
    setIsLoading(true);
    onSystemAction?.(action, params);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const baseClasses = `
    w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700
    ${variant === 'cyber' ? 'bg-black border-cyan-400 shadow-lg shadow-cyan-400/20' : ''}
    ${className}
  `;

  const cyberGrid =
    variant === 'cyber' ? (
      <div className='absolute inset-0 opacity-10 pointer-events-none'>
        <div className='grid grid-cols-12 grid-rows-8 h-full w-full'>
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className='border border-cyan-400/30' />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className={baseClasses}>
      {cyberGrid}

      <div className='relative z-10 p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2
              className={`text-2xl font-bold ${
                variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
              }`}
            >
              Backend Control Center
            </h2>
            <p
              className={`text-sm ${
                variant === 'cyber' ? 'text-cyan-300/70' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monitor and manage system infrastructure
            </p>
          </div>

          {realTimeUpdates && (
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                variant === 'cyber'
                  ? 'bg-cyan-400/10 border border-cyan-400/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  variant === 'cyber' ? 'bg-cyan-400' : 'bg-green-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  variant === 'cyber' ? 'text-cyan-400' : 'text-green-700 dark:text-green-400'
                }`}
              >
                Live Updates
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className='flex space-x-1 mb-6'>
          {[
            { id: 'services', label: 'Services', show: showServices },
            { id: 'metrics', label: 'Metrics', show: showMetrics },
            { id: 'logs', label: 'Logs', show: showLogs },
            { id: 'controls', label: 'Controls', show: showControls },
          ]
            .filter(tab => tab.show)
            .map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? variant === 'cyber'
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/50'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : variant === 'cyber'
                      ? 'text-cyan-300/70 hover:text-cyan-400 hover:bg-cyan-400/10'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>

        {/* Content */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className='space-y-4'>
                {defaultServices.map(service => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border ${
                      variant === 'cyber'
                        ? 'bg-gray-900/50 border-cyan-400/30'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: getStatusColor(service.status) }}
                        />
                        <div>
                          <h3
                            className={`font-semibold ${
                              variant === 'cyber'
                                ? 'text-cyan-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {service.name}
                          </h3>
                          <p
                            className={`text-sm ${
                              variant === 'cyber'
                                ? 'text-cyan-400/70'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            v{service.version} • {service.responseTime}ms • {service.uptime} uptime
                          </p>
                        </div>
                      </div>

                      <div className='flex space-x-2'>
                        <button
                          onClick={() => handleServiceAction(service.id, 'restart')}
                          disabled={isLoading}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            variant === 'cyber'
                              ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                          } disabled:opacity-50`}
                        >
                          Restart
                        </button>
                        <button
                          onClick={() => setSelectedService(service.id)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            variant === 'cyber'
                              ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          Details
                        </button>
                      </div>
                    </div>

                    {service.dependencies && (
                      <div className='mt-3 pt-3 border-t border-gray-200 dark:border-gray-700'>
                        <p
                          className={`text-xs ${
                            variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
                          }`}
                        >
                          Dependencies: {service.dependencies.join(', ')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {[
                  {
                    label: 'CPU Usage',
                    value: defaultMetrics.cpu,
                    unit: '%',
                    color:
                      defaultMetrics.cpu > 80
                        ? 'red'
                        : defaultMetrics.cpu > 60
                          ? 'yellow'
                          : 'green',
                  },
                  {
                    label: 'Memory Usage',
                    value: defaultMetrics.memory,
                    unit: '%',
                    color:
                      defaultMetrics.memory > 80
                        ? 'red'
                        : defaultMetrics.memory > 60
                          ? 'yellow'
                          : 'green',
                  },
                  {
                    label: 'Disk Usage',
                    value: defaultMetrics.disk,
                    unit: '%',
                    color:
                      defaultMetrics.disk > 80
                        ? 'red'
                        : defaultMetrics.disk > 60
                          ? 'yellow'
                          : 'green',
                  },
                  {
                    label: 'Active Connections',
                    value: defaultMetrics.activeConnections,
                    unit: '',
                    color: 'blue',
                  },
                  {
                    label: 'Total Requests',
                    value: defaultMetrics.totalRequests,
                    unit: '',
                    color: 'blue',
                  },
                  {
                    label: 'Error Rate',
                    value: defaultMetrics.errorRate * 100,
                    unit: '%',
                    color: defaultMetrics.errorRate > 0.05 ? 'red' : 'green',
                  },
                ].map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg ${
                      variant === 'cyber'
                        ? 'bg-gray-900/50 border border-cyan-400/30'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <h3
                      className={`text-sm font-medium ${
                        variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {metric.label}
                    </h3>
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {typeof metric.value === 'number'
                        ? metric.value.toLocaleString()
                        : metric.value}
                      <span className='text-sm'>{metric.unit}</span>
                    </p>
                    {metric.unit === '%' && (
                      <div
                        className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 ${
                          variant === 'cyber' ? 'bg-gray-800' : ''
                        }`}
                      >
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            metric.color === 'red'
                              ? 'bg-red-500'
                              : metric.color === 'yellow'
                                ? 'bg-yellow-500'
                                : metric.color === 'green'
                                  ? 'bg-green-500'
                                  : variant === 'cyber'
                                    ? 'bg-cyan-400'
                                    : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(metric.value, 100)}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div
                className={`h-96 overflow-y-auto rounded-lg border ${
                  variant === 'cyber'
                    ? 'bg-black border-cyan-400/30'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className='p-4 font-mono text-sm space-y-1'>
                  {[
                    {
                      time: '14:32:15',
                      level: 'INFO',
                      message: 'API Gateway started successfully',
                    },
                    { time: '14:32:16', level: 'INFO', message: 'Database connection established' },
                    {
                      time: '14:32:17',
                      level: 'WARN',
                      message: 'High memory usage detected on worker-03',
                    },
                    {
                      time: '14:32:18',
                      level: 'INFO',
                      message: 'Betting engine processing 342 active bets',
                    },
                    {
                      time: '14:32:19',
                      level: 'ERROR',
                      message: 'Cache miss rate above threshold (15%)',
                    },
                    {
                      time: '14:32:20',
                      level: 'INFO',
                      message: 'Auto-scaling triggered: +2 instances',
                    },
                  ].map((log, index) => (
                    <div
                      key={index}
                      className={`flex space-x-3 ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className={variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'}>
                        {log.time}
                      </span>
                      <span
                        className={`font-semibold ${
                          log.level === 'ERROR'
                            ? 'text-red-500'
                            : log.level === 'WARN'
                              ? 'text-yellow-500'
                              : variant === 'cyber'
                                ? 'text-cyan-400'
                                : 'text-blue-600'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls Tab */}
            {activeTab === 'controls' && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3
                    className={`text-lg font-semibold ${
                      variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    System Actions
                  </h3>

                  {[
                    { label: 'Restart All Services', action: 'restart-all', danger: true },
                    { label: 'Clear Cache', action: 'clear-cache', danger: false },
                    { label: 'Run Health Check', action: 'health-check', danger: false },
                    { label: 'Backup Database', action: 'backup-db', danger: false },
                    { label: 'Scale Up', action: 'scale-up', danger: false },
                    { label: 'Emergency Shutdown', action: 'emergency-shutdown', danger: true },
                  ].map(control => (
                    <button
                      key={control.action}
                      onClick={() => handleSystemAction(control.action)}
                      disabled={isLoading}
                      className={`w-full p-3 rounded-lg font-medium text-left transition-all disabled:opacity-50 ${
                        control.danger
                          ? variant === 'cyber'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                            : 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : variant === 'cyber'
                            ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20'
                            : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {control.label}
                    </button>
                  ))}
                </div>

                <div className='space-y-4'>
                  <h3
                    className={`text-lg font-semibold ${
                      variant === 'cyber' ? 'text-cyan-400' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    Configuration
                  </h3>

                  <div className='space-y-3'>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          variant === 'cyber' ? 'text-cyan-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Max Connections
                      </label>
                      <input
                        type='number'
                        defaultValue='1000'
                        className={`w-full p-2 rounded border ${
                          variant === 'cyber'
                            ? 'bg-black border-cyan-400/30 text-cyan-300'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          variant === 'cyber' ? 'text-cyan-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Cache TTL (seconds)
                      </label>
                      <input
                        type='number'
                        defaultValue='3600'
                        className={`w-full p-2 rounded border ${
                          variant === 'cyber'
                            ? 'bg-black border-cyan-400/30 text-cyan-300'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`flex items-center space-x-2 ${
                          variant === 'cyber' ? 'text-cyan-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <input
                          type='checkbox'
                          defaultChecked
                          className={variant === 'cyber' ? 'accent-cyan-400' : ''}
                        />
                        <span>Enable Auto-scaling</span>
                      </label>
                    </div>

                    <div>
                      <label
                        className={`flex items-center space-x-2 ${
                          variant === 'cyber' ? 'text-cyan-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <input
                          type='checkbox'
                          defaultChecked
                          className={variant === 'cyber' ? 'accent-cyan-400' : ''}
                        />
                        <span>Debug Mode</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg'
            >
              <div
                className={`animate-spin rounded-full h-8 w-8 border-2 border-transparent ${
                  variant === 'cyber' ? 'border-t-cyan-400' : 'border-t-blue-500'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
