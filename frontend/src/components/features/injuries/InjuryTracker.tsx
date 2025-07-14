import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  AlertTriangle,
  Clock,
  TrendingDown,
  Activity,
  RefreshCw,
  Filter,
  Search,
  User,
  Target,
  BarChart3,
  Calendar,
  MapPin,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Layout } from '../../core/Layout';
import {
  injuryService,
  PlayerInjury,
  InjuryReport,
  InjuryTrend,
  HealthAlert,
} from '../../../services/injuryService';

const InjuryTracker: React.FC = () => {
  const [injuries, setInjuries] = useState<PlayerInjury[]>([]);
  const [injuryReports, setInjuryReports] = useState<InjuryReport[]>([]);
  const [injuryTrends, setInjuryTrends] = useState<InjuryTrend[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInjury, setSelectedInjury] = useState<string | null>(null);

  useEffect(() => {
    loadInjuryData();
    const interval = setInterval(loadInjuryData, 600000); // Update every 10 minutes
    return () => clearInterval(interval);
  }, [selectedSport, selectedSeverity]);

  const loadInjuryData = async () => {
    setIsLoading(true);
    try {
      // Load data from real services
      const [injuriesData, reportsData, trendsData, alertsData] = await Promise.all([
        injuryService.getInjuries({
          sport: selectedSport === 'all' ? undefined : selectedSport,
          severity: selectedSeverity === 'all' ? undefined : selectedSeverity,
        }),
        injuryService.getInjuryReports(),
        injuryService.getInjuryTrends(selectedSport === 'all' ? undefined : selectedSport),
        injuryService.getHealthAlerts(false), // Get non-dismissed alerts
      ]);

      setInjuries(injuriesData);
      setInjuryReports(reportsData);
      setInjuryTrends(trendsData);
      setHealthAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load injury data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const success = await injuryService.dismissAlert(alertId);
      if (success) {
        setHealthAlerts(alerts =>
          alerts.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
        );
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'season_ending':
        return 'text-red-500 bg-red-500/20';
      case 'major':
        return 'text-red-400 bg-red-500/20';
      case 'moderate':
        return 'text-orange-400 bg-orange-500/20';
      case 'minor':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out':
        return 'text-red-400';
      case 'doubtful':
        return 'text-orange-400';
      case 'questionable':
        return 'text-yellow-400';
      case 'probable':
        return 'text-green-400';
      case 'healthy':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'out':
        return <XCircle className='w-4 h-4 text-red-400' />;
      case 'doubtful':
        return <AlertTriangle className='w-4 h-4 text-orange-400' />;
      case 'questionable':
        return <Clock className='w-4 h-4 text-yellow-400' />;
      case 'probable':
        return <CheckCircle className='w-4 h-4 text-green-400' />;
      case 'healthy':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      default:
        return <Clock className='w-4 h-4 text-gray-400' />;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingDown className='w-4 h-4 text-red-400 rotate-180' />;
      case 'decreasing':
        return <TrendingDown className='w-4 h-4 text-green-400' />;
      case 'stable':
        return <Activity className='w-4 h-4 text-gray-400' />;
      default:
        return <Activity className='w-4 h-4 text-gray-400' />;
    }
  };

  const filteredInjuries = injuries.filter(injury => {
    const matchesSport = selectedSport === 'all' || injury.sport === selectedSport;
    const matchesSeverity = selectedSeverity === 'all' || injury.severity === selectedSeverity;
    const matchesSearch =
      searchQuery === '' ||
      injury.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      injury.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      injury.injuryType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSeverity && matchesSearch;
  });

  const selectedInjuryData = injuries.find(i => i.id === selectedInjury);
  const sports = [...new Set(injuries.map(i => i.sport))];
  const severities = ['minor', 'moderate', 'major', 'season_ending'];

  return (
    <Layout
      title='Injury Tracker'
      subtitle='Player Health Monitoring • Market Impact Analysis'
      headerActions={
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search players...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            />
          </div>

          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='all'>All Sports</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className='px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
          >
            <option value='all'>All Severities</option>
            {severities.map(severity => (
              <option key={severity} value={severity}>
                {severity.charAt(0).toUpperCase() + severity.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>

          <button
            onClick={loadInjuryData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Update</span>
          </button>
        </div>
      }
    >
      {/* Health Alerts */}
      {healthAlerts.filter(a => !a.dismissed).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
            <Heart className='w-5 h-5 text-red-400' />
            <span>Health Alerts</span>
          </h3>

          <div className='space-y-3'>
            {healthAlerts
              .filter(a => !a.dismissed)
              .map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <span className='font-bold text-white'>{alert.playerName}</span>
                        <span className='text-gray-400'>•</span>
                        <span className='text-gray-400'>{alert.team}</span>
                        <span className='text-xs text-gray-400'>
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className='text-gray-300 mb-2'>{alert.message}</p>
                      <div className='flex flex-wrap gap-1'>
                        {alert.affectedMarkets.map((market, idx) => (
                          <span
                            key={idx}
                            className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                          >
                            {market}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className='text-gray-400 hover:text-white ml-4'
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Injury Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Injury Trends</h3>
            <p className='text-gray-400 text-sm'>Season injury patterns and recovery data</p>
          </div>
          <BarChart3 className='w-5 h-5 text-red-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {injuryTrends.map((trend, index) => (
            <motion.div
              key={`${trend.bodyPart}-${trend.sport}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50'
            >
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-bold text-white'>{trend.bodyPart}</h4>
                <div className='flex items-center space-x-2'>
                  {getTrendIcon(trend.trend)}
                  <span className='text-xs text-gray-400'>{trend.sport}</span>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div>
                  <div className='text-gray-400'>Total Injuries</div>
                  <div className='text-white font-bold'>{trend.totalInjuries}</div>
                </div>
                <div>
                  <div className='text-gray-400'>Avg Recovery</div>
                  <div className='text-white font-bold'>{trend.avgRecoveryTime} days</div>
                </div>
              </div>

              <div className='mt-3 flex justify-between items-center'>
                <span className='text-xs text-gray-400'>vs Last Season</span>
                <span
                  className={`text-sm font-medium ${
                    trend.seasonComparison > 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {trend.seasonComparison > 0 ? '+' : ''}
                  {trend.seasonComparison}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Injuries List and Detail */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Active Injuries</h3>
              <p className='text-gray-400 text-sm'>Current player injury status</p>
            </div>
            <User className='w-5 h-5 text-red-400' />
          </div>

          <div className='space-y-4'>
            {filteredInjuries.map((injury, index) => (
              <motion.div
                key={injury.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedInjury === injury.id
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50'
                }`}
                onClick={() => setSelectedInjury(selectedInjury === injury.id ? null : injury.id)}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h4 className='font-bold text-white'>{injury.playerName}</h4>
                    <div className='flex items-center space-x-2 text-sm text-gray-400'>
                      <span>{injury.team}</span>
                      <span>•</span>
                      <span>{injury.position}</span>
                      <span>•</span>
                      <span>{injury.sport}</span>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    {getStatusIcon(injury.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(injury.severity)}`}
                    >
                      {injury.severity.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className='mb-3'>
                  <div className='font-medium text-white'>{injury.injuryType}</div>
                  <div className='text-sm text-gray-400'>{injury.bodyPart}</div>
                </div>

                <div className='flex justify-between items-center text-sm'>
                  <span className={`font-medium ${getStatusColor(injury.status)}`}>
                    {injury.status.toUpperCase()}
                  </span>
                  <span className='text-gray-400'>{injury.gamesAffected} games affected</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {selectedInjuryData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h3 className='text-xl font-bold text-white'>Injury Details</h3>
                <p className='text-gray-400 text-sm'>{selectedInjuryData.playerName}</p>
              </div>
              <Eye className='w-5 h-5 text-purple-400' />
            </div>

            {/* Injury Overview */}
            <div className='mb-6'>
              <h4 className='font-medium text-white mb-4'>Overview</h4>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Injury:</span>
                  <span className='text-white'>{selectedInjuryData.injuryType}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Body Part:</span>
                  <span className='text-white'>{selectedInjuryData.bodyPart}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Injury Date:</span>
                  <span className='text-white'>
                    {selectedInjuryData.injuryDate.toLocaleDateString()}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Est. Return:</span>
                  <span className='text-white'>
                    {selectedInjuryData.estimatedReturn?.toLocaleDateString() || 'TBD'}
                  </span>
                </div>
              </div>

              <div className='mt-4 p-3 bg-slate-900/50 rounded-lg'>
                <p className='text-gray-300 text-sm'>{selectedInjuryData.description}</p>
              </div>
            </div>

            {/* Market Impact */}
            <div className='mb-6'>
              <h4 className='font-medium text-white mb-4'>Market Impact</h4>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'>
                  <span className='text-gray-300'>Player Props</span>
                  <span
                    className={`font-bold ${
                      selectedInjuryData.marketImpact.playerProps < 0
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {selectedInjuryData.marketImpact.playerProps}%
                  </span>
                </div>

                <div className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'>
                  <span className='text-gray-300'>Team Performance</span>
                  <span
                    className={`font-bold ${
                      selectedInjuryData.marketImpact.teamPerformance < 0
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {selectedInjuryData.marketImpact.teamPerformance}%
                  </span>
                </div>

                <div className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'>
                  <span className='text-gray-300'>Spread Movement</span>
                  <span className='text-orange-400 font-bold'>
                    {selectedInjuryData.marketImpact.spreadMovement} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Notes */}
            <div>
              <h4 className='font-medium text-white mb-4'>Recent Updates</h4>
              <div className='space-y-3'>
                {selectedInjuryData.progressNotes.map((note, index) => (
                  <div key={index} className='p-3 bg-slate-900/50 rounded-lg'>
                    <div className='flex justify-between items-start mb-2'>
                      <span className='text-xs text-gray-400'>
                        {note.date.toLocaleDateString()}
                      </span>
                      <span className='text-xs text-gray-500'>{note.source}</span>
                    </div>
                    <p className='text-sm text-gray-300'>{note.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default InjuryTracker;
