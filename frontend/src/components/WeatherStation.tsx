import { motion } from 'framer-motion';
import { Cloud, CloudRain, Droplets, Eye, Snowflake, Sun, Thermometer, Wind } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

interface WeatherData {
  gameId: string;
  game: string;
  sport: string;
  venue: string;
  city: string;
  gameTime: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    visibility: number;
    condition: string;
    pressure: number;
  };
  forecast: {
    temperature: number;
    precipitation: number;
    windSpeed: number;
    condition: string;
  };
  impact: {
    overall: 'high' | 'medium' | 'low';
    passing: number;
    kicking: number;
    visibility: number;
    player_comfort: number;
  };
}

export const WeatherStation: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [selectedGame, setSelectedGame] = useState<WeatherData | null>(null);

  useEffect(() => {
    const generateWeatherData = (): WeatherData[] => {
      const games = [
        { game: 'Chiefs vs Bills', sport: 'NFL', venue: 'Arrowhead Stadium', city: 'Kansas City' },
        { game: 'Yankees vs Red Sox', sport: 'MLB', venue: 'Yankee Stadium', city: 'New York' },
        { game: 'Lakers vs Warriors', sport: 'NBA', venue: 'Staples Center', city: 'Los Angeles' },
        {
          game: 'Rangers vs Lightning',
          sport: 'NHL',
          venue: 'Madison Square Garden',
          city: 'New York',
        },
        {
          game: 'Patriots vs Dolphins',
          sport: 'NFL',
          venue: 'Gillette Stadium',
          city: 'Foxborough',
        },
      ];

      return games.map((g, index) => {
        const temp = 32 + Math.random() * 68;
        const windSpeed = Math.random() * 25;
        const humidity = 30 + Math.random() * 50;

        return {
          gameId: `weather-${index}`,
          ...g,
          gameTime: `${6 + Math.floor(Math.random() * 6)}:00 PM ET`,
          current: {
            temperature: temp,
            humidity,
            windSpeed,
            windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][
              Math.floor(Math.random() * 8)
            ],
            visibility: 5 + Math.random() * 5,
            condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Snow'][
              Math.floor(Math.random() * 6)
            ],
            pressure: 29.5 + Math.random() * 1.5,
          },
          forecast: {
            temperature: temp + (Math.random() - 0.5) * 10,
            precipitation: Math.random() * 100,
            windSpeed: windSpeed + (Math.random() - 0.5) * 10,
            condition: ['Clear', 'Cloudy', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
          },
          impact: {
            overall:
              windSpeed > 15 || humidity > 80
                ? 'high'
                : windSpeed > 10 || humidity > 60
                  ? 'medium'
                  : 'low',
            passing: Math.max(0, Math.min(100, 90 - windSpeed * 2)),
            kicking: Math.max(0, Math.min(100, 95 - windSpeed * 3)),
            visibility: Math.max(0, Math.min(100, humidity < 80 ? 95 : 70)),
            player_comfort: Math.max(0, Math.min(100, temp > 45 && temp < 75 ? 90 : 60)),
          },
        };
      });
    };

    const data = generateWeatherData();
    setWeatherData(data);
    setSelectedGame(data[0]);
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className='w-6 h-6 text-yellow-400' />;
      case 'partly cloudy':
        return <Cloud className='w-6 h-6 text-gray-400' />;
      case 'cloudy':
        return <Cloud className='w-6 h-6 text-gray-500' />;
      case 'light rain':
      case 'rain':
        return <CloudRain className='w-6 h-6 text-blue-400' />;
      case 'heavy rain':
        return <CloudRain className='w-6 h-6 text-blue-600' />;
      case 'snow':
        return <Snowflake className='w-6 h-6 text-white' />;
      default:
        return <Cloud className='w-6 h-6 text-gray-400' />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 border-red-400';
      case 'medium':
        return 'text-yellow-400 border-yellow-400';
      case 'low':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <Card className='p-12 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-cyan-500/30'>
          <h1 className='text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4'>
            WEATHER STATION
          </h1>
          <p className='text-xl text-gray-300 mb-8'>Weather Intelligence & Impact Analysis</p>

          <div className='flex items-center justify-center gap-8'>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className='text-cyan-500'
            >
              <Cloud className='w-12 h-12' />
            </motion.div>

            <div className='grid grid-cols-4 gap-8 text-center'>
              <div>
                <div className='text-3xl font-bold text-cyan-400'>{weatherData.length}</div>
                <div className='text-gray-400'>Games Tracked</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-red-400'>
                  {weatherData.filter(w => w.impact.overall === 'high').length}
                </div>
                <div className='text-gray-400'>High Impact</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-blue-400'>
                  {weatherData.filter(w => w.forecast.precipitation > 50).length}
                </div>
                <div className='text-gray-400'>Rain Expected</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-gray-400'>
                  {weatherData.filter(w => w.current.windSpeed > 15).length}
                </div>
                <div className='text-gray-400'>Windy Games</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Main Content */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Games List */}
        <div className='space-y-4'>
          <h3 className='text-xl font-bold text-white'>Games Today</h3>
          <div className='space-y-3'>
            {weatherData.map((weather, index) => (
              <motion.div
                key={weather.gameId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all ${
                    selectedGame?.gameId === weather.gameId
                      ? 'border-cyan-500/50 bg-cyan-900/10'
                      : 'border-gray-700/50 hover:border-cyan-500/30'
                  }`}
                  onClick={() => setSelectedGame(weather)}
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div>
                      <h4 className='font-bold text-white text-sm'>{weather.game}</h4>
                      <p className='text-gray-400 text-xs'>{weather.venue}</p>
                      <p className='text-gray-400 text-xs'>{weather.gameTime}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      {getWeatherIcon(weather.current.condition)}
                      <Badge variant='outline' className={getImpactColor(weather.impact.overall)}>
                        {weather.impact.overall}
                      </Badge>
                    </div>
                  </div>

                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    <div className='text-center'>
                      <div className='text-cyan-400 font-bold'>
                        {weather.current.temperature.toFixed(0)}°F
                      </div>
                      <div className='text-gray-400'>Temp</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-blue-400 font-bold'>
                        {weather.current.windSpeed.toFixed(0)} mph
                      </div>
                      <div className='text-gray-400'>Wind</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-purple-400 font-bold'>
                        {weather.current.humidity.toFixed(0)}%
                      </div>
                      <div className='text-gray-400'>Humidity</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detailed Weather */}
        <div className='xl:col-span-2'>
          {selectedGame ? (
            <div className='space-y-6'>
              {/* Current Conditions */}
              <Card className='p-6'>
                <h3 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
                  {getWeatherIcon(selectedGame.current.condition)}
                  Current Conditions - {selectedGame.city}
                </h3>

                <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='text-center'>
                    <Thermometer className='w-8 h-8 text-red-400 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-red-400'>
                      {selectedGame.current.temperature.toFixed(0)}°F
                    </div>
                    <div className='text-sm text-gray-400'>Temperature</div>
                  </div>

                  <div className='text-center'>
                    <Wind className='w-8 h-8 text-blue-400 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-blue-400'>
                      {selectedGame.current.windSpeed.toFixed(0)} mph
                    </div>
                    <div className='text-sm text-gray-400'>
                      Wind {selectedGame.current.windDirection}
                    </div>
                  </div>

                  <div className='text-center'>
                    <Droplets className='w-8 h-8 text-purple-400 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-purple-400'>
                      {selectedGame.current.humidity.toFixed(0)}%
                    </div>
                    <div className='text-sm text-gray-400'>Humidity</div>
                  </div>

                  <div className='text-center'>
                    <Eye className='w-8 h-8 text-green-400 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-green-400'>
                      {selectedGame.current.visibility.toFixed(1)} mi
                    </div>
                    <div className='text-sm text-gray-400'>Visibility</div>
                  </div>
                </div>

                <div className='mt-6 p-4 bg-slate-800/50 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-300'>Conditions:</span>
                    <span className='text-white font-bold'>{selectedGame.current.condition}</span>
                  </div>
                  <div className='flex items-center justify-between mt-2'>
                    <span className='text-gray-300'>Pressure:</span>
                    <span className='text-white font-bold'>
                      {selectedGame.current.pressure.toFixed(2)} inHg
                    </span>
                  </div>
                </div>
              </Card>

              {/* Game Time Forecast */}
              <Card className='p-6'>
                <h3 className='text-xl font-bold text-white mb-4'>Game Time Forecast</h3>

                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='p-4 bg-slate-800/50 rounded-lg text-center'>
                    <div className='text-lg font-bold text-cyan-400'>
                      {selectedGame.forecast.temperature.toFixed(0)}°F
                    </div>
                    <div className='text-sm text-gray-400'>Temperature</div>
                  </div>

                  <div className='p-4 bg-slate-800/50 rounded-lg text-center'>
                    <div className='text-lg font-bold text-blue-400'>
                      {selectedGame.forecast.precipitation.toFixed(0)}%
                    </div>
                    <div className='text-sm text-gray-400'>Rain Chance</div>
                  </div>

                  <div className='p-4 bg-slate-800/50 rounded-lg text-center'>
                    <div className='text-lg font-bold text-green-400'>
                      {selectedGame.forecast.windSpeed.toFixed(0)} mph
                    </div>
                    <div className='text-sm text-gray-400'>Wind Speed</div>
                  </div>

                  <div className='p-4 bg-slate-800/50 rounded-lg text-center'>
                    <div className='text-lg font-bold text-purple-400'>
                      {selectedGame.forecast.condition}
                    </div>
                    <div className='text-sm text-gray-400'>Conditions</div>
                  </div>
                </div>
              </Card>

              {/* Impact Analysis */}
              <Card className='p-6'>
                <h3 className='text-xl font-bold text-white mb-4'>Weather Impact Analysis</h3>

                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between mb-2'>
                      <span className='text-gray-300'>Passing Game Impact</span>
                      <span className='text-green-400 font-bold'>
                        {selectedGame.impact.passing.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <motion.div
                        className='bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full'
                        animate={{ width: `${selectedGame.impact.passing}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className='flex justify-between mb-2'>
                      <span className='text-gray-300'>Kicking Accuracy</span>
                      <span className='text-blue-400 font-bold'>
                        {selectedGame.impact.kicking.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <motion.div
                        className='bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full'
                        animate={{ width: `${selectedGame.impact.kicking}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className='flex justify-between mb-2'>
                      <span className='text-gray-300'>Visibility Impact</span>
                      <span className='text-purple-400 font-bold'>
                        {selectedGame.impact.visibility.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <motion.div
                        className='bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full'
                        animate={{ width: `${selectedGame.impact.visibility}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className='flex justify-between mb-2'>
                      <span className='text-gray-300'>Player Comfort</span>
                      <span className='text-yellow-400 font-bold'>
                        {selectedGame.impact.player_comfort.toFixed(0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-700 rounded-full h-2'>
                      <motion.div
                        className='bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full'
                        animate={{ width: `${selectedGame.impact.player_comfort}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                </div>

                <div className='mt-6 p-4 bg-slate-800/50 rounded-lg'>
                  <h4 className='font-bold text-white mb-2'>Betting Implications</h4>
                  <div className='space-y-2 text-sm'>
                    {selectedGame.current.windSpeed > 15 && (
                      <div className='text-red-400'>
                        ⚠️ High winds may affect passing and kicking games
                      </div>
                    )}
                    {selectedGame.forecast.precipitation > 70 && (
                      <div className='text-blue-400'>
                        🌧️ Heavy rain expected - favor rushing attacks
                      </div>
                    )}
                    {selectedGame.current.temperature < 40 && (
                      <div className='text-cyan-400'>
                        🥶 Cold weather - potential for slower game pace
                      </div>
                    )}
                    {selectedGame.current.visibility < 5 && (
                      <div className='text-gray-400'>
                        🌫️ Low visibility may impact passing accuracy
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className='p-12 text-center'>
              <Cloud className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-300 mb-2'>Select a Game</h3>
              <p className='text-gray-400'>Choose a game to view detailed weather analysis</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
