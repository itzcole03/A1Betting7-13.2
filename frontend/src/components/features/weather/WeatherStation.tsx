import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Compass,
  Zap,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface WeatherCondition {
  id: string;
  gameId: string;
  venue: string;
  location: string;
  isOutdoor: boolean;
  currentConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    precipitation: number;
    visibility: number;
    pressure: number;
    condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';
  };
  forecast: Array<{
    time: Date;
    temperature: number;
    windSpeed: number;
    precipitation: number;
    condition: string;
  }>;
  gameTime: Date;
  weatherImpact: {
    passingGame: number;
    runningGame: number;
    kicking: number;
    overall: number;
    severity: 'minimal' | 'moderate' | 'significant' | 'severe';
  };
  historicalData: {
    avgTemperature: number;
    avgWindSpeed: number;
    avgPrecipitation: number;
    gamesPlayed: number;
  };
}

interface WeatherAlert {
  id: string;
  gameId: string;
  type: 'wind' | 'rain' | 'temperature' | 'fog' | 'storm';
  severity: 'watch' | 'warning' | 'advisory';
  title: string;
  description: string;
  issuedAt: Date;
  validUntil: Date;
  affectedAreas: string[];
  recommendedAction: string;
}

interface WeatherTrend {
  metric: string;
  current: number;
  change: number;
  trend: 'improving' | 'worsening' | 'stable';
  impactLevel: 'low' | 'medium' | 'high';
}

const WeatherStation: React.FC = () => {
  const [weatherConditions, setWeatherConditions] = useState<WeatherCondition[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [weatherTrends, setWeatherTrends] = useState<WeatherTrend[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  useEffect(() => {
    loadWeatherData();

    let interval: NodeJS.Timeout;
    if (autoUpdate) {
      interval = setInterval(loadWeatherData, 300000); // Update every 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoUpdate]);

  const loadWeatherData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockWeatherConditions: WeatherCondition[] = [
        {
          id: 'weather-001',
          gameId: 'Chiefs vs Bills',
          venue: 'Arrowhead Stadium',
          location: 'Kansas City, MO',
          isOutdoor: true,
          currentConditions: {
            temperature: 28,
            humidity: 78,
            windSpeed: 22,
            windDirection: 'NW',
            precipitation: 0.15,
            visibility: 6.2,
            pressure: 29.85,
            condition: 'rainy',
          },
          forecast: [
            {
              time: new Date(Date.now() + 2 * 60 * 60 * 1000),
              temperature: 26,
              windSpeed: 25,
              precipitation: 0.25,
              condition: 'Heavy Rain',
            },
            {
              time: new Date(Date.now() + 4 * 60 * 60 * 1000),
              temperature: 24,
              windSpeed: 28,
              precipitation: 0.35,
              condition: 'Storm',
            },
            {
              time: new Date(Date.now() + 6 * 60 * 60 * 1000),
              temperature: 25,
              windSpeed: 20,
              precipitation: 0.1,
              condition: 'Light Rain',
            },
          ],
          gameTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          weatherImpact: {
            passingGame: -35,
            runningGame: -15,
            kicking: -45,
            overall: -32,
            severity: 'significant',
          },
          historicalData: {
            avgTemperature: 42,
            avgWindSpeed: 12,
            avgPrecipitation: 0.05,
            gamesPlayed: 156,
          },
        },
        {
          id: 'weather-002',
          gameId: 'Packers vs Bears',
          venue: 'Lambeau Field',
          location: 'Green Bay, WI',
          isOutdoor: true,
          currentConditions: {
            temperature: 18,
            humidity: 65,
            windSpeed: 15,
            windDirection: 'N',
            precipitation: 0,
            visibility: 10,
            pressure: 30.12,
            condition: 'clear',
          },
          forecast: [
            {
              time: new Date(Date.now() + 2 * 60 * 60 * 1000),
              temperature: 16,
              windSpeed: 18,
              precipitation: 0,
              condition: 'Clear',
            },
            {
              time: new Date(Date.now() + 4 * 60 * 60 * 1000),
              temperature: 15,
              windSpeed: 20,
              precipitation: 0,
              condition: 'Partly Cloudy',
            },
          ],
          gameTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
          weatherImpact: {
            passingGame: -8,
            runningGame: 5,
            kicking: -12,
            overall: -5,
            severity: 'minimal',
          },
          historicalData: {
            avgTemperature: 35,
            avgWindSpeed: 14,
            avgPrecipitation: 0.02,
            gamesPlayed: 98,
          },
        },
      ];

      const mockAlerts: WeatherAlert[] = [
        {
          id: 'alert-001',
          gameId: 'Chiefs vs Bills',
          type: 'storm',
          severity: 'warning',
          title: 'Severe Thunderstorm Warning',
          description:
            'Severe thunderstorms with heavy rain and wind gusts up to 40 mph expected during game time',
          issuedAt: new Date(Date.now() - 30 * 60 * 1000),
          validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
          affectedAreas: ['Kansas City Metropolitan Area', 'Arrowhead Stadium'],
          recommendedAction:
            'Consider significant adjustments to passing game totals and kicking props',
        },
        {
          id: 'alert-002',
          gameId: 'Packers vs Bears',
          type: 'wind',
          severity: 'advisory',
          title: 'Wind Advisory',
          description: 'Sustained winds of 15-20 mph with gusts up to 25 mph',
          issuedAt: new Date(Date.now() - 15 * 60 * 1000),
          validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000),
          affectedAreas: ['Green Bay Area', 'Lambeau Field'],
          recommendedAction: 'Monitor kicking game props and long passing plays',
        },
      ];

      const mockTrends: WeatherTrend[] = [
        {
          metric: 'Wind Speed',
          current: 22,
          change: 8,
          trend: 'worsening',
          impactLevel: 'high',
        },
        {
          metric: 'Precipitation',
          current: 0.15,
          change: 0.1,
          trend: 'worsening',
          impactLevel: 'high',
        },
        {
          metric: 'Temperature',
          current: 28,
          change: -4,
          trend: 'worsening',
          impactLevel: 'medium',
        },
        {
          metric: 'Visibility',
          current: 6.2,
          change: -1.8,
          trend: 'worsening',
          impactLevel: 'medium',
        },
      ];

      setWeatherConditions(mockWeatherConditions);
      setWeatherAlerts(mockAlerts);
      setWeatherTrends(mockTrends);
    } catch (error) {
      console.error('Failed to load weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className='w-5 h-5 text-yellow-400' />;
      case 'cloudy':
        return <Cloud className='w-5 h-5 text-gray-400' />;
      case 'rainy':
        return <CloudRain className='w-5 h-5 text-blue-400' />;
      case 'stormy':
        return <Zap className='w-5 h-5 text-purple-400' />;
      case 'foggy':
        return <Eye className='w-5 h-5 text-gray-500' />;
      default:
        return <Cloud className='w-5 h-5 text-gray-400' />;
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact < -25) return 'text-red-400';
    if (impact < -10) return 'text-orange-400';
    if (impact < 0) return 'text-yellow-400';
    if (impact > 10) return 'text-green-400';
    return 'text-gray-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'text-red-400 bg-red-500/20';
      case 'significant':
        return 'text-orange-400 bg-orange-500/20';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'minimal':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'border-red-500/50 bg-red-500/10';
      case 'watch':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'advisory':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className='w-4 h-4 text-green-400' />;
      case 'worsening':
        return <TrendingDown className='w-4 h-4 text-red-400' />;
      case 'stable':
        return <Activity className='w-4 h-4 text-gray-400' />;
      default:
        return <Activity className='w-4 h-4 text-gray-400' />;
    }
  };

  const selectedWeather = weatherConditions.find(w => w.id === selectedGame);

  return (
    <Layout
      title='Weather Station'
      subtitle='Real-Time Weather Analysis • Game Impact Assessment'
      headerActions={
        <div className='flex items-center space-x-3'>
          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='autoUpdate'
              checked={autoUpdate}
              onChange={e => setAutoUpdate(e.target.checked)}
              className='rounded'
            />
            <label htmlFor='autoUpdate' className='text-sm text-gray-400'>
              Auto Update
            </label>
          </div>

          <button
            onClick={loadWeatherData}
            disabled={isLoading}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white font-medium transition-all disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Update</span>
          </button>
        </div>
      }
    >
      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
            <AlertTriangle className='w-5 h-5 text-red-400' />
            <span>Active Weather Alerts</span>
          </h3>

          <div className='space-y-3'>
            {weatherAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h4 className='font-bold text-white'>{alert.title}</h4>
                    <p className='text-sm text-gray-300 mt-1'>{alert.description}</p>
                  </div>
                  <span className='text-xs text-gray-400'>
                    Until {alert.validUntil.toLocaleTimeString()}
                  </span>
                </div>

                <div className='text-sm text-gray-300 mb-2'>
                  <strong>Recommendation:</strong> {alert.recommendedAction}
                </div>

                <div className='flex flex-wrap gap-1'>
                  {alert.affectedAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className='px-2 py-1 bg-slate-700/50 text-xs text-gray-300 rounded'
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weather Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-8'
      >
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-bold text-white'>Weather Trends</h3>
            <p className='text-gray-400 text-sm'>Current conditions and changes</p>
          </div>
          <BarChart3 className='w-5 h-5 text-blue-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {weatherTrends.map((trend, index) => (
            <motion.div
              key={trend.metric}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className='p-4 bg-slate-900/50 rounded-lg border border-slate-700/50'
            >
              <div className='flex items-center justify-between mb-2'>
                <span className='text-white font-medium'>{trend.metric}</span>
                {getTrendIcon(trend.trend)}
              </div>

              <div className='text-2xl font-bold text-white mb-1'>
                {trend.current}
                {trend.metric.includes('Temperature') && '°F'}
                {trend.metric.includes('Wind') && ' mph'}
                {trend.metric.includes('Precipitation') && '"'}
                {trend.metric.includes('Visibility') && ' mi'}
              </div>

              <div className='flex items-center justify-between text-sm'>
                <span className={`${trend.change > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {trend.change > 0 ? '+' : ''}
                  {trend.change}
                  {trend.metric.includes('Temperature') && '°'}
                  {trend.metric.includes('Wind') && ' mph'}
                  {trend.metric.includes('Precipitation') && '"'}
                  {trend.metric.includes('Visibility') && ' mi'}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    trend.impactLevel === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : trend.impactLevel === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {trend.impactLevel.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Game Weather Conditions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
        >
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-xl font-bold text-white'>Game Conditions</h3>
              <p className='text-gray-400 text-sm'>Current weather for upcoming games</p>
            </div>
            <Cloud className='w-5 h-5 text-blue-400' />
          </div>

          <div className='space-y-4'>
            {weatherConditions.map((weather, index) => (
              <motion.div
                key={weather.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedGame === weather.id
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50'
                }`}
                onClick={() => setSelectedGame(selectedGame === weather.id ? null : weather.id)}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h4 className='font-bold text-white'>{weather.gameId}</h4>
                    <div className='flex items-center space-x-2 text-sm text-gray-400'>
                      <MapPin className='w-3 h-3' />
                      <span>{weather.venue}</span>
                      <span>•</span>
                      <span>{weather.isOutdoor ? 'Outdoor' : 'Dome'}</span>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    {getConditionIcon(weather.currentConditions.condition)}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(weather.weatherImpact.severity)}`}
                    >
                      {weather.weatherImpact.severity.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-3 text-sm mb-3'>
                  <div className='flex items-center space-x-2'>
                    <Thermometer className='w-4 h-4 text-red-400' />
                    <span className='text-white'>{weather.currentConditions.temperature}°F</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Wind className='w-4 h-4 text-cyan-400' />
                    <span className='text-white'>{weather.currentConditions.windSpeed} mph</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Droplets className='w-4 h-4 text-blue-400' />
                    <span className='text-white'>{weather.currentConditions.precipitation}"</span>
                  </div>
                </div>

                <div className='flex justify-between items-center text-sm'>
                  <span className='text-gray-400'>
                    Game time: {weather.gameTime.toLocaleTimeString()}
                  </span>
                  <span className={`font-medium ${getImpactColor(weather.weatherImpact.overall)}`}>
                    Overall Impact: {weather.weatherImpact.overall > 0 ? '+' : ''}
                    {weather.weatherImpact.overall}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Weather Analysis */}
        {selectedWeather && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
          >
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h3 className='text-xl font-bold text-white'>Detailed Analysis</h3>
                <p className='text-gray-400 text-sm'>{selectedWeather.gameId}</p>
              </div>
              <Eye className='w-5 h-5 text-purple-400' />
            </div>

            {/* Current Conditions Detail */}
            <div className='mb-6'>
              <h4 className='font-medium text-white mb-4'>Current Conditions</h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Temperature:</span>
                    <span className='text-white'>
                      {selectedWeather.currentConditions.temperature}°F
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Humidity:</span>
                    <span className='text-white'>
                      {selectedWeather.currentConditions.humidity}%
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Wind Speed:</span>
                    <span className='text-white'>
                      {selectedWeather.currentConditions.windSpeed} mph
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Wind Direction:</span>
                    <span className='text-white'>
                      {selectedWeather.currentConditions.windDirection}
                    </span>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Precipitation:</span>
                    <span className='text-white'>
                      {selectedWeather.currentConditions.precipitation}"
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Visibility:</span>
                    <span className='text-white'>
                      {selectedWeather.currentConditions.visibility} mi
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Pressure:</span>
                    <span className='text-white'>
                      {selectedWeather.currentConditions.pressure}"
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Condition:</span>
                    <span className='text-white capitalize'>
                      {selectedWeather.currentConditions.condition}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Impact Analysis */}
            <div className='mb-6'>
              <h4 className='font-medium text-white mb-4'>Game Impact Analysis</h4>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'>
                  <span className='text-gray-300'>Passing Game</span>
                  <span
                    className={`font-bold ${getImpactColor(selectedWeather.weatherImpact.passingGame)}`}
                  >
                    {selectedWeather.weatherImpact.passingGame > 0 ? '+' : ''}
                    {selectedWeather.weatherImpact.passingGame}%
                  </span>
                </div>

                <div className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'>
                  <span className='text-gray-300'>Running Game</span>
                  <span
                    className={`font-bold ${getImpactColor(selectedWeather.weatherImpact.runningGame)}`}
                  >
                    {selectedWeather.weatherImpact.runningGame > 0 ? '+' : ''}
                    {selectedWeather.weatherImpact.runningGame}%
                  </span>
                </div>

                <div className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'>
                  <span className='text-gray-300'>Kicking Game</span>
                  <span
                    className={`font-bold ${getImpactColor(selectedWeather.weatherImpact.kicking)}`}
                  >
                    {selectedWeather.weatherImpact.kicking > 0 ? '+' : ''}
                    {selectedWeather.weatherImpact.kicking}%
                  </span>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div>
              <h4 className='font-medium text-white mb-4'>Forecast</h4>
              <div className='space-y-3'>
                {selectedWeather.forecast.map((forecast, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-slate-900/50 rounded-lg'
                  >
                    <div>
                      <div className='text-white font-medium'>
                        {forecast.time.toLocaleTimeString()}
                      </div>
                      <div className='text-sm text-gray-400'>{forecast.condition}</div>
                    </div>
                    <div className='text-right'>
                      <div className='text-white'>{forecast.temperature}°F</div>
                      <div className='text-sm text-gray-400'>{forecast.windSpeed} mph</div>
                    </div>
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

export default WeatherStation;
