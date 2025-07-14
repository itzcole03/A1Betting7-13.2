import React, { useState, useEffect, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { motion, AnimatePresence } from 'framer-motion';

// Import ALL the core systems
import { ThemeProvider } from './theme/ThemeProvider';
import { MasterIntegrationProvider, useMasterIntegration } from './core/MasterIntegrationHub';
import { AppShell } from './components/core/AppShell';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorFallback } from './components/ErrorFallback';

// Import ALL feature components (existing + prototype)
const EnhancedDashboard = React.lazy(
  () => import('./components/features/dashboard/EnhancedDashboard')
);
const MoneyMaker = React.lazy(() => import('./components/features/moneymaker/MoneyMaker'));
const Analytics = React.lazy(() => import('./components/features/analytics/Analytics'));
const PrizePicks = React.lazy(() => import('./components/features/prizepicks/PrizePicks'));
const ArbitrageScanner = React.lazy(
  () => import('./components/features/arbitrage/ArbitrageScanner')
);
const LiveBetting = React.lazy(() => import('./components/features/livebetting/LiveBetting'));
const BankrollManager = React.lazy(() => import('./components/features/bankroll/BankrollManager'));
const RiskEngine = React.lazy(() => import('./components/features/risk/RiskEngine'));
const SocialIntelligence = React.lazy(
  () => import('./components/features/social/SocialIntelligence')
);
const SHAPAnalysis = React.lazy(() => import('./components/features/shap/SHAPAnalysis'));
const QuantumAI = React.lazy(() => import('./components/features/quantum/QuantumAI'));
const NewsHub = React.lazy(() => import('./components/features/news/NewsHub'));
const WeatherStation = React.lazy(() => import('./components/features/weather/WeatherStation'));
const InjuryTracker = React.lazy(() => import('./components/features/injuries/InjuryTracker'));
const LineupBuilder = React.lazy(() => import('./components/features/lineup/LineupBuilder'));
const Settings = React.lazy(() => import('./components/features/settings/Settings'));
const SportsManager = React.lazy(() => import('./components/features/sports/SportsManager'));

// Import prototype components that aren't in main app yet
const PrototypeDashboard = React.lazy(
  () => import('../prototype/src/components/dashboard/Dashboard')
);
const HeroSection = React.lazy(() => import('../prototype/src/components/dashboard/HeroSection'));
const RealTimePredictions = React.lazy(
  () => import('../prototype/src/components/dashboard/RealTimePredictions')
);
const DataSourcesPanel = React.lazy(
  () => import('../prototype/src/components/dashboard/DataSourcesPanel')
);
const PortfolioResults = React.lazy(
  () => import('../prototype/src/components/dashboard/PortfolioResults')
);
const PredictionQualityIndicator = React.lazy(
  () => import('../prototype/src/components/dashboard/PredictionQualityIndicator')
);

// Import advanced filtering
import AdvancedFilters, { FilterState } from './components/core/AdvancedFilters';
import ThemeSelector from './components/core/ThemeSelector';

// Import all available utility hooks
import { useAnalytics } from './hooks/useAnalytics';
import { useBettingAnalytics } from './hooks/useBettingAnalytics';
import { useMLAnalytics } from './hooks/useMLAnalytics';
import { usePerformance } from './hooks/usePerformance';
import { useRealtimePredictions } from './hooks/useRealtimePredictions';
import { useSmartAlerts } from './hooks/useSmartAlerts';
import { useTheme } from './theme/ThemeProvider';

interface MasterAppProps {
  enablePrototypeFeatures?: boolean;
  enableAdvancedAnalytics?: boolean;
  enableQuantumFeatures?: boolean;
  enableMLEnhancements?: boolean;
}

const PlaceholderComponent: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className='flex items-center justify-center min-h-96'>
    <div className='text-center'>
      <div className='w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4'>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className='w-8 h-8 border-2 border-white border-t-transparent rounded-full'
        />
      </div>
      <h2 className='text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2'>
        {title}
      </h2>
      <p className='text-gray-400'>{description}</p>
      <div className='mt-4 text-sm text-gray-500'>
        Advanced feature powered by Master Integration Hub
      </div>
    </div>
  </div>
);

// Enhanced component mapping with ALL features
const getComponentMap = (enabledFeatures: MasterAppProps) => ({
  // Core Features (Enhanced)
  dashboard: EnhancedDashboard,
  moneymaker: MoneyMaker,
  analytics: Analytics,
  prizepicks: PrizePicks,
  arbitrage: ArbitrageScanner,
  livebetting: LiveBetting,
  bankroll: BankrollManager,
  risk: RiskEngine,
  social: SocialIntelligence,
  shap: SHAPAnalysis,
  quantum: enabledFeatures.enableQuantumFeatures
    ? QuantumAI
    : () => (
        <PlaceholderComponent title='Quantum AI' description='Quantum-enhanced neural networks' />
      ),
  news: NewsHub,
  weather: WeatherStation,
  injuries: InjuryTracker,
  lineup: LineupBuilder,
  settings: Settings,
  sports: SportsManager,

  // Prototype Features Integration
  prototypeDashboard: enabledFeatures.enablePrototypeFeatures
    ? PrototypeDashboard
    : () => (
        <PlaceholderComponent
          title='Prototype Dashboard'
          description='Advanced prototype features'
        />
      ),
  hero: enabledFeatures.enablePrototypeFeatures
    ? HeroSection
    : () => <PlaceholderComponent title='Hero Analytics' description='Real-time hero section' />,
  realtime: enabledFeatures.enablePrototypeFeatures
    ? RealTimePredictions
    : () => (
        <PlaceholderComponent title='Real-time Predictions' description='Live prediction engine' />
      ),
  datasources: enabledFeatures.enablePrototypeFeatures
    ? DataSourcesPanel
    : () => (
        <PlaceholderComponent title='Data Sources' description='Comprehensive data management' />
      ),
  portfolio: enabledFeatures.enablePrototypeFeatures
    ? PortfolioResults
    : () => (
        <PlaceholderComponent
          title='Portfolio Results'
          description='Advanced portfolio analytics'
        />
      ),
  quality: enabledFeatures.enablePrototypeFeatures
    ? PredictionQualityIndicator
    : () => (
        <PlaceholderComponent title='Quality Indicator' description='Prediction quality metrics' />
      ),

  // Advanced Features
  streaming: () => (
    <PlaceholderComponent
      title='Live Stream'
      description='HD streams & real-time data integration'
    />
  ),
  automation: () => (
    <PlaceholderComponent title='Auto-Pilot' description='Intelligent betting automation with ML' />
  ),
  alerts: () => (
    <PlaceholderComponent title='Alert Center' description='Advanced alert management system' />
  ),
  backtesting: () => (
    <PlaceholderComponent title='Backtesting' description='Strategy testing & validation engine' />
  ),
  education: () => (
    <PlaceholderComponent title='Academy' description='Education & training center' />
  ),
  community: () => (
    <PlaceholderComponent title='Community Hub' description='Social trading & leaderboards' />
  ),
  sportsbooks: () => (
    <PlaceholderComponent title='Sportsbooks' description='Multi-sportsbook account management' />
  ),
  historical: () => (
    <PlaceholderComponent
      title='Historical Data'
      description='Advanced historical analysis engine'
    />
  ),
  predictions: () => (
    <PlaceholderComponent title='AI Predictions' description='Advanced prediction algorithms hub' />
  ),
});

const MasterAppContent: React.FC<MasterAppProps> = props => {
  const [activeView, setActiveView] = useState('dashboard');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sports: [],
    categories: [],
    seasons: ['active'],
    dateRange: { start: null, end: null },
    markets: [],
    minOdds: null,
    maxOdds: null,
    minValue: null,
    maxValue: null,
    search: '',
    favoriteOnly: false,
    liveOnly: false,
    fantasyOnly: false,
    sortBy: 'value',
    sortOrder: 'desc',
    tags: [],
  });

  // Use master integration
  const integration = useMasterIntegration();
  const { currentTheme, currentThemeId, setTheme } = useTheme();

  // Use all available hooks for comprehensive functionality
  const analytics = useAnalytics();
  const bettingAnalytics = useBettingAnalytics();
  const mlAnalytics = useMLAnalytics();
  const performance = usePerformance();
  const realtimePredictions = useRealtimePredictions();
  const smartAlerts = useSmartAlerts();

  useEffect(() => {
    // Initialize comprehensive system
    integration.refreshAllData();

    // Set up real-time updates
    const interval = setInterval(() => {
      integration.syncAllSystems();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const componentMap = getComponentMap(props);
  const ActiveComponent =
    componentMap[activeView as keyof typeof componentMap] || EnhancedDashboard;

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
      {/* Global Advanced Filters */}
      <div className='fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50'>
        <div className='container mx-auto px-4'>
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
            resultCount={integration.realTimeData.opportunities.length}
            isLoading={integration.isLoading}
          />
        </div>
      </div>

      {/* Theme Selector Overlay */}
      <AnimatePresence>
        {themeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'
            onClick={() => setThemeOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-8'
              onClick={e => e.stopPropagation()}
            >
              <ThemeSelector
                currentTheme={currentThemeId}
                onThemeChange={setTheme}
                isOpen={true}
                onToggle={() => setThemeOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Shell with Enhanced Navigation */}
      <AppShell
        activeView={activeView}
        onNavigate={setActiveView}
        className={filtersOpen ? 'pt-32' : 'pt-4'}
        headerActions={
          <div className='flex items-center space-x-3'>
            {/* System Health Indicator */}
            <div className='flex items-center space-x-2 px-3 py-2 bg-slate-800/50 rounded-lg'>
              <div
                className={`w-2 h-2 rounded-full ${
                  integration.systemHealth.uptime > 99
                    ? 'bg-green-400'
                    : integration.systemHealth.uptime > 95
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                }`}
              />
              <span className='text-sm text-gray-300'>
                {integration.systemHealth.uptime.toFixed(1)}%
              </span>
            </div>

            {/* Active Alerts */}
            {integration.realTimeData.alerts.length > 0 && (
              <div className='flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg'>
                <span className='text-sm text-red-400'>
                  {integration.realTimeData.alerts.length} alerts
                </span>
              </div>
            )}

            {/* ML Accuracy */}
            <div className='flex items-center space-x-2 px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg'>
              <span className='text-sm text-purple-400'>
                ML: {integration.mlSystems.accuracy.toFixed(1)}%
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setThemeOpen(true)}
              className='px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-white transition-all'
            >
              🎨 Theme
            </button>

            {/* Performance Optimizer */}
            <button
              onClick={integration.optimizePerformance}
              disabled={integration.isLoading}
              className='px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
            >
              ⚡ Optimize
            </button>
          </div>
        }
      >
        {/* Enhanced Loading with System Status */}
        <Suspense
          fallback={
            <div className='flex items-center justify-center h-96'>
              <div className='text-center'>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className='w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4'
                />
                <div className='text-white font-medium mb-2'>Loading {activeView}...</div>
                <div className='text-sm text-gray-400'>
                  {integration.integrationStatus.servicesConnected}/
                  {integration.integrationStatus.totalServices} services connected
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  Last sync: {integration.integrationStatus.lastSync.toLocaleTimeString()}
                </div>
              </div>
            </div>
          }
        >
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, errorInfo) => {
              console.error('Component error:', error, errorInfo);
              integration.addAlert({
                id: Date.now().toString(),
                type: 'error',
                message: `Component error in ${activeView}: ${error.message}`,
                severity: 'high',
                timestamp: new Date(),
              });
            }}
          >
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ActiveComponent />
            </motion.div>
          </ErrorBoundary>
        </Suspense>
      </AppShell>

      {/* Global System Information Overlay */}
      {integration.isLoading && (
        <div className='fixed bottom-4 right-4 bg-slate-800/90 backdrop-blur-lg border border-slate-700/50 rounded-lg p-4 z-40'>
          <div className='flex items-center space-x-3'>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className='w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full'
            />
            <span className='text-white text-sm'>Syncing all systems...</span>
          </div>
        </div>
      )}
    </div>
  );
};

const MasterApp: React.FC<MasterAppProps> = (
  props = {
    enablePrototypeFeatures: true,
    enableAdvancedAnalytics: true,
    enableQuantumFeatures: true,
    enableMLEnhancements: true,
  }
) => {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className='min-h-screen bg-slate-900 flex items-center justify-center'>
          <div className='text-center p-8'>
            <h1 className='text-2xl font-bold text-red-400 mb-4'>Master App Error</h1>
            <p className='text-gray-400 mb-4'>{error.message}</p>
            <button
              onClick={resetErrorBoundary}
              className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors'
            >
              Restart Application
            </button>
          </div>
        </div>
      )}
    >
      <ThemeProvider enableSystemTheme={true}>
        <MasterIntegrationProvider>
          <MasterAppContent {...props} />
        </MasterIntegrationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default MasterApp;
