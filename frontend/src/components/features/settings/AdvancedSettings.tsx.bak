import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Cpu,
  Database,
  Globe,
  HardDrive,
  RefreshCw,
  Save,
  Server,
  Shield,
  Target,
} from 'lucide-react';
import React, { useState } from 'react';
import { Layout } from '../../core/Layout';

interface MLSettings {
  predictionEngine: {
    model: 'xgboost' | 'neural_network' | 'ensemble';
    confidence_threshold: number;
    retraining_frequency: number;
    feature_selection: boolean;
    cross_validation: boolean;
  };
  arbitrageScanner: {
    scan_frequency: number;
    min_profit_threshold: number;
    max_risk_exposure: number;
    bookmaker_filters: string[];
    auto_betting: boolean;
  };
  riskManagement: {
    kelly_fraction: number;
    max_bet_size: number;
    stop_loss_threshold: number;
    diversification_factor: number;
    correlation_limit: number;
  };
}

interface SystemSettings {
  performance: {
    cache_enabled: boolean;
    cache_ttl: number;
    batch_processing: boolean;
    parallel_execution: boolean;
    memory_optimization: boolean;
  };
  api: {
    rate_limiting: boolean;
    max_requests_per_minute: number;
    timeout: number;
    retry_attempts: number;
    compression: boolean;
  };
  security: {
    encryption_enabled: boolean;
    two_factor_required: boolean;
    session_timeout: number;
    ip_whitelist: string[];
    audit_logging: boolean;
  };
  monitoring: {
    real_time_alerts: boolean;
    performance_tracking: boolean;
    error_reporting: boolean;
    usage_analytics: boolean;
    health_checks: boolean;
  };
}

interface DataSettings {
  sources: {
    primary_odds_provider: string;
    backup_providers: string[];
    data_refresh_rate: number;
    historical_data_retention: number;
    real_time_feeds: boolean;
  };
  storage: {
    database_type: string;
    backup_frequency: number;
    compression_enabled: boolean;
    encryption_at_rest: boolean;
    data_archiving: boolean;
  };
  processing: {
    stream_processing: boolean;
    batch_size: number;
    worker_threads: number;
    queue_size: number;
    priority_processing: boolean;
  };
}

const _AdvancedSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('ml');
  const [mlSettings, setMlSettings] = useState<MLSettings>({
    predictionEngine: {
      model: 'ensemble',
      confidence_threshold: 0.75,
      retraining_frequency: 24,
      feature_selection: true,
      cross_validation: true,
    },
    arbitrageScanner: {
      scan_frequency: 30,
      min_profit_threshold: 2.0,
      max_risk_exposure: 10000,
      bookmaker_filters: ['DraftKings', 'FanDuel', 'BetMGM'],
      auto_betting: false,
    },
    riskManagement: {
      kelly_fraction: 0.25,
      max_bet_size: 1000,
      stop_loss_threshold: 0.05,
      diversification_factor: 0.6,
      correlation_limit: 0.7,
    },
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    performance: {
      cache_enabled: true,
      cache_ttl: 300,
      batch_processing: true,
      parallel_execution: true,
      memory_optimization: true,
    },
    api: {
      rate_limiting: true,
      max_requests_per_minute: 1000,
      timeout: 30000,
      retry_attempts: 3,
      compression: true,
    },
    security: {
      encryption_enabled: true,
      two_factor_required: false,
      session_timeout: 3600,
      ip_whitelist: [],
      audit_logging: true,
    },
    monitoring: {
      real_time_alerts: true,
      performance_tracking: true,
      error_reporting: true,
      usage_analytics: true,
      health_checks: true,
    },
  });

  const [dataSettings, setDataSettings] = useState<DataSettings>({
    sources: {
      primary_odds_provider: 'TheOddsAPI',
      backup_providers: ['SportRadar', 'ESPN', 'BetLabs'],
      data_refresh_rate: 30,
      historical_data_retention: 365,
      real_time_feeds: true,
    },
    storage: {
      database_type: 'PostgreSQL',
      backup_frequency: 24,
      compression_enabled: true,
      encryption_at_rest: true,
      data_archiving: true,
    },
    processing: {
      stream_processing: true,
      batch_size: 1000,
      worker_threads: 8,
      queue_size: 10000,
      priority_processing: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const _saveSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save advanced settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const _resetToDefaults = () => {
    // Reset to default values
    setMlSettings({
      predictionEngine: {
        model: 'ensemble',
        confidence_threshold: 0.75,
        retraining_frequency: 24,
        feature_selection: true,
        cross_validation: true,
      },
      arbitrageScanner: {
        scan_frequency: 30,
        min_profit_threshold: 2.0,
        max_risk_exposure: 10000,
        bookmaker_filters: ['DraftKings', 'FanDuel', 'BetMGM'],
        auto_betting: false,
      },
      riskManagement: {
        kelly_fraction: 0.25,
        max_bet_size: 1000,
        stop_loss_threshold: 0.05,
        diversification_factor: 0.6,
        correlation_limit: 0.7,
      },
    });
  };

  const _ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
        enabled ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const _sections = [
    { id: 'ml', label: 'ML & AI', icon: Brain },
    { id: 'system', label: 'System', icon: Server },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
  ];

  const _renderMLSettings = () => (
    <div className='space-y-6'>
      {/* Prediction Engine */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <Brain className='w-5 h-5 text-cyan-400' />
          <span>Prediction Engine</span>
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label className='block text-sm font-medium text-gray-300 mb-2' htmlFor='ml-model-type'>
              Model Type
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <select
              id='ml-model-type'
              value={mlSettings.predictionEngine.model}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  predictionEngine: {
                    ...prev.predictionEngine,
                    model: e.target.value as MLSettings['predictionEngine']['model'],
                  },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='xgboost'>XGBoost</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='neural_network'>Neural Network</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='ensemble'>Ensemble</option>
            </select>
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='ml-confidence-threshold'
            >
              Confidence Threshold ({mlSettings.predictionEngine.confidence_threshold})
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='ml-confidence-threshold'
              type='range'
              min='0.5'
              max='0.95'
              step='0.05'
              value={mlSettings.predictionEngine.confidence_threshold}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  predictionEngine: {
                    ...prev.predictionEngine,
                    confidence_threshold: parseFloat(e.target.value),
                  },
                }))
              }
              className='w-full'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='ml-retraining-frequency'
            >
              Retraining Frequency (hours)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='ml-retraining-frequency'
              type='number'
              min='1'
              max='168'
              value={mlSettings.predictionEngine.retraining_frequency}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  predictionEngine: {
                    ...prev.predictionEngine,
                    retraining_frequency: parseInt(e.target.value),
                  },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div className='space-y-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Feature Selection</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Automatic feature importance ranking</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={mlSettings.predictionEngine.feature_selection}
                onChange={enabled =>
                  setMlSettings(prev => ({
                    ...prev,
                    predictionEngine: { ...prev.predictionEngine, feature_selection: enabled },
                  }))
                }
              />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Cross Validation</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>K-fold cross validation during training</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={mlSettings.predictionEngine.cross_validation}
                onChange={enabled =>
                  setMlSettings(prev => ({
                    ...prev,
                    predictionEngine: { ...prev.predictionEngine, cross_validation: enabled },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </motion.div>
      {/* Arbitrage Scanner */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <Target className='w-5 h-5 text-green-400' />
          <span>Arbitrage Scanner</span>
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='arbitrage-scan-frequency'
            >
              Scan Frequency (seconds)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='arbitrage-scan-frequency'
              type='number'
              min='5'
              max='300'
              value={mlSettings.arbitrageScanner.scan_frequency}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  arbitrageScanner: {
                    ...prev.arbitrageScanner,
                    scan_frequency: parseInt(e.target.value),
                  },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='arbitrage-min-profit-threshold'
            >
              Min Profit Threshold (%)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='arbitrage-min-profit-threshold'
              type='number'
              min='0.5'
              max='10'
              step='0.1'
              value={mlSettings.arbitrageScanner.min_profit_threshold}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  arbitrageScanner: {
                    ...prev.arbitrageScanner,
                    min_profit_threshold: parseFloat(e.target.value),
                  },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='arbitrage-max-risk-exposure'
            >
              Max Risk Exposure ($)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='arbitrage-max-risk-exposure'
              type='number'
              min='1000'
              max='100000'
              step='1000'
              value={mlSettings.arbitrageScanner.max_risk_exposure}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  arbitrageScanner: {
                    ...prev.arbitrageScanner,
                    max_risk_exposure: parseInt(e.target.value),
                  },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p className='text-white font-medium'>Auto Betting</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>Automatically place arbitrage bets</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <ToggleSwitch
              enabled={mlSettings.arbitrageScanner.auto_betting}
              onChange={enabled =>
                setMlSettings(prev => ({
                  ...prev,
                  arbitrageScanner: { ...prev.arbitrageScanner, auto_betting: enabled },
                }))
              }
            />
          </div>
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='mt-6'>
          <label
            htmlFor='bookmaker-filter-DraftKings'
            className='block text-sm font-medium text-gray-300 mb-2'
          >
            Bookmaker Filters
          </label>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
            {['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'WynnBET'].map(
              bookmaker => {
                const _inputId = `bookmaker-filter-${bookmaker}`;
                return (
                  <div key={bookmaker} className='flex items-center space-x-2'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <input
                      id={inputId}
                      type='checkbox'
                      checked={mlSettings.arbitrageScanner.bookmaker_filters.includes(bookmaker)}
                      onChange={e => {
                        const _filters = e.target.checked
                          ? [...mlSettings.arbitrageScanner.bookmaker_filters, bookmaker]
                          : mlSettings.arbitrageScanner.bookmaker_filters.filter(
                              b => b !== bookmaker
                            );
                        setMlSettings(prev => ({
                          ...prev,
                          arbitrageScanner: {
                            ...prev.arbitrageScanner,
                            bookmaker_filters: filters,
                          },
                        }));
                      }}
                      className='rounded border-gray-300'
                    />
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                    provided... Remove this comment to see the full error message
                    <label htmlFor={inputId} className='text-gray-300 text-sm'>
                      {bookmaker}
                    </label>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </motion.div>
      {/* Risk Management */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <Shield className='w-5 h-5 text-red-400' />
          <span>Risk Management</span>
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='risk-kelly-fraction'
            >
              Kelly Fraction ({mlSettings.riskManagement.kelly_fraction})
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='risk-kelly-fraction'
              type='range'
              min='0.1'
              max='0.5'
              step='0.05'
              value={mlSettings.riskManagement.kelly_fraction}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  riskManagement: {
                    ...prev.riskManagement,
                    kelly_fraction: parseFloat(e.target.value),
                  },
                }))
              }
              className='w-full'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='risk-max-bet-size'
            >
              Max Bet Size ($)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='risk-max-bet-size'
              type='number'
              min='10'
              max='10000'
              step='10'
              value={mlSettings.riskManagement.max_bet_size}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  riskManagement: {
                    ...prev.riskManagement,
                    max_bet_size: parseInt(e.target.value),
                  },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='risk-stop-loss-threshold'
            >
              Stop Loss Threshold ({mlSettings.riskManagement.stop_loss_threshold * 100}%)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='risk-stop-loss-threshold'
              type='range'
              min='0.01'
              max='0.1'
              step='0.01'
              value={mlSettings.riskManagement.stop_loss_threshold}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  riskManagement: {
                    ...prev.riskManagement,
                    stop_loss_threshold: parseFloat(e.target.value),
                  },
                }))
              }
              className='w-full'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              className='block text-sm font-medium text-gray-300 mb-2'
              htmlFor='risk-correlation-limit'
            >
              Correlation Limit ({mlSettings.riskManagement.correlation_limit})
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='risk-correlation-limit'
              type='range'
              min='0.3'
              max='0.9'
              step='0.1'
              value={mlSettings.riskManagement.correlation_limit}
              onChange={e =>
                setMlSettings(prev => ({
                  ...prev,
                  riskManagement: {
                    ...prev.riskManagement,
                    correlation_limit: parseFloat(e.target.value),
                  },
                }))
              }
              className='w-full'
            />
          </div>
        </div>
      </motion.div>
    </div>
  );

  const _renderSystemSettings = () => (
    <div className='space-y-6'>
      {/* Performance */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <Cpu className='w-5 h-5 text-blue-400' />
          <span>Performance</span>
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Cache Enabled</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Enable in-memory caching</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={systemSettings.performance.cache_enabled}
                onChange={enabled =>
                  setSystemSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, cache_enabled: enabled },
                  }))
                }
              />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Batch Processing</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Process data in batches</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={systemSettings.performance.batch_processing}
                onChange={enabled =>
                  setSystemSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, batch_processing: enabled },
                  }))
                }
              />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Parallel Execution</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Enable multi-threading</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={systemSettings.performance.parallel_execution}
                onChange={enabled =>
                  setSystemSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, parallel_execution: enabled },
                  }))
                }
              />
            </div>
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-cache-ttl'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Cache TTL (seconds)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='advanced-cache-ttl'
              type='number'
              min='60'
              max='3600'
              value={systemSettings.performance.cache_ttl}
              onChange={e =>
                setSystemSettings(prev => ({
                  ...prev,
                  performance: { ...prev.performance, cache_ttl: parseInt(e.target.value) },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>
        </div>
      </motion.div>
      {/* API Configuration */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <Globe className='w-5 h-5 text-green-400' />
          <span>API Configuration</span>
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-max-requests'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Max Requests/Minute
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='advanced-max-requests'
              type='number'
              min='100'
              max='10000'
              value={systemSettings.api.max_requests_per_minute}
              onChange={e =>
                setSystemSettings(prev => ({
                  ...prev,
                  api: { ...prev.api, max_requests_per_minute: parseInt(e.target.value) },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-timeout'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Timeout (ms)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='advanced-timeout'
              type='number'
              min='1000'
              max='60000'
              value={systemSettings.api.timeout}
              onChange={e =>
                setSystemSettings(prev => ({
                  ...prev,
                  api: { ...prev.api, timeout: parseInt(e.target.value) },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-retry-attempts'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Retry Attempts
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='advanced-retry-attempts'
              type='number'
              min='1'
              max='10'
              value={systemSettings.api.retry_attempts}
              onChange={e =>
                setSystemSettings(prev => ({
                  ...prev,
                  api: { ...prev.api, retry_attempts: parseInt(e.target.value) },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div className='space-y-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Rate Limiting</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Enable API rate limiting</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={systemSettings.api.rate_limiting}
                onChange={enabled =>
                  setSystemSettings(prev => ({
                    ...prev,
                    api: { ...prev.api, rate_limiting: enabled },
                  }))
                }
              />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Compression</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Enable response compression</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={systemSettings.api.compression}
                onChange={enabled =>
                  setSystemSettings(prev => ({
                    ...prev,
                    api: { ...prev.api, compression: enabled },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const _renderDataSettings = () => (
    <div className='space-y-6'>
      {/* Data Sources */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <Database className='w-5 h-5 text-purple-400' />
          <span>Data Sources</span>
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-primary-odds-provider'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Primary Odds Provider
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <select
              id='advanced-primary-odds-provider'
              value={dataSettings.sources.primary_odds_provider}
              onChange={e =>
                setDataSettings(prev => ({
                  ...prev,
                  sources: { ...prev.sources, primary_odds_provider: e.target.value },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='TheOddsAPI'>The Odds API</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='SportRadar'>SportRadar</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='ESPN'>ESPN</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='BetLabs'>BetLabs</option>
            </select>
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-data-refresh-rate'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Data Refresh Rate (seconds)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='advanced-data-refresh-rate'
              type='number'
              min='10'
              max='300'
              value={dataSettings.sources.data_refresh_rate}
              onChange={e =>
                setDataSettings(prev => ({
                  ...prev,
                  sources: { ...prev.sources, data_refresh_rate: parseInt(e.target.value) },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-historical-data-retention'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Historical Data Retention (days)
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              id='advanced-historical-data-retention'
              type='number'
              min='30'
              max='1095'
              value={dataSettings.sources.historical_data_retention}
              onChange={e =>
                setDataSettings(prev => ({
                  ...prev,
                  sources: { ...prev.sources, historical_data_retention: parseInt(e.target.value) },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>

          <div className='flex items-center justify-between'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p className='text-white font-medium'>Real-time Feeds</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p className='text-gray-400 text-sm'>Enable live data streaming</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <ToggleSwitch
              enabled={dataSettings.sources.real_time_feeds}
              onChange={enabled =>
                setDataSettings(prev => ({
                  ...prev,
                  sources: { ...prev.sources, real_time_feeds: enabled },
                }))
              }
            />
          </div>
        </div>
      </motion.div>
      {/* Storage Configuration */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <motion.div
        className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-2'>
          <HardDrive className='w-5 h-5 text-orange-400' />
          <span>Storage Configuration</span>
        </h3>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label
              htmlFor='advanced-database-type'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Database Type
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <select
              id='advanced-database-type'
              value={dataSettings.storage.database_type}
              onChange={e =>
                setDataSettings(prev => ({
                  ...prev,
                  storage: { ...prev.storage, database_type: e.target.value },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='PostgreSQL'>PostgreSQL</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='MongoDB'>MongoDB</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='Redis'>Redis</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <option value='InfluxDB'>InfluxDB</option>
            </select>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Backup Frequency (hours)
              <input
                type='number'
                min='1'
                max='168'
                id='backup-frequency'
                name='backup-frequency'
                className='ml-2'
              />
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <input
              type='number'
              min='1'
              max='168'
              value={dataSettings.storage.backup_frequency}
              onChange={e =>
                setDataSettings(prev => ({
                  ...prev,
                  storage: { ...prev.storage, backup_frequency: parseInt(e.target.value) },
                }))
              }
              className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-cyan-400'
            />
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='space-y-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Compression</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Enable data compression</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={dataSettings.storage.compression_enabled}
                onChange={enabled =>
                  setDataSettings(prev => ({
                    ...prev,
                    storage: { ...prev.storage, compression_enabled: enabled },
                  }))
                }
              />
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center justify-between'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-white font-medium'>Encryption at Rest</p>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <p className='text-gray-400 text-sm'>Encrypt stored data</p>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <ToggleSwitch
                enabled={dataSettings.storage.encryption_at_rest}
                onChange={enabled =>
                  setDataSettings(prev => ({
                    ...prev,
                    storage: { ...prev.storage, encryption_at_rest: enabled },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const _renderSectionContent = () => {
    switch (activeSection) {
      case 'ml':
        return renderMLSettings();
      case 'system':
        return renderSystemSettings();
      case 'data':
        return renderDataSettings();
      case 'security':
        return (
          <div className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white mb-6'>Security Settings</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400'>
              Security configuration options will be implemented here.
            </p>
          </div>
        );
      case 'monitoring':
        return (
          <div className='bg-slate-800/50 rounded-xl p-6 border border-slate-700/50'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white mb-6'>Monitoring Settings</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400'>
              Monitoring and alerting configuration will be implemented here.
            </p>
          </div>
        );
      default:
        return renderMLSettings();
    }
  };

  return (
    <Layout>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='space-y-8'>
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h1 className='text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent'>
              Advanced Settings
            </h1>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 mt-2'>Configure system parameters and advanced features</p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex items-center space-x-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              onClick={resetToDefaults}
              className='bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors'
            >
              Reset Defaults
            </button>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className='bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              {isLoading ? (
                <RefreshCw className='w-4 h-4 animate-spin' />
              ) : (
                <Save className='w-4 h-4' />
              )}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
        {/* Navigation */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50'>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <section.icon className='w-4 h-4' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span className='font-medium'>{section.label}</span>
            </button>
          ))}
        </div>
        {/* Status Indicator */}
        {saveStatus !== 'idle' && (
          <div
            className={`p-4 rounded-lg border ${
              saveStatus === 'saved'
                ? 'bg-green-500/10 border-green-500/20'
                : saveStatus === 'error'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-blue-500/10 border-blue-500/20'
            }`}
          >
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              {saveStatus === 'saving' && (
                <RefreshCw className='w-4 h-4 text-blue-400 animate-spin' />
              )}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              {saveStatus === 'saved' && <CheckCircle className='w-4 h-4 text-green-400' />}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              {saveStatus === 'error' && <AlertTriangle className='w-4 h-4 text-red-400' />}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span
                className={`text-sm font-medium ${
                  saveStatus === 'saved'
                    ? 'text-green-400'
                    : saveStatus === 'error'
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}
              >
                {saveStatus === 'saving' && 'Saving configuration...'}
                {saveStatus === 'saved' && 'Settings saved successfully'}
                {saveStatus === 'error' && 'Failed to save settings'}
              </span>
            </div>
          </div>
        )}
        {/* Content */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderSectionContent()}
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdvancedSettings;
