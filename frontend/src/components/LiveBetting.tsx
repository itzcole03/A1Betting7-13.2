import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertCircle, Radio, TrendingUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// @ts-expect-error TS(6142): Module '../components/ui/badge' was resolved to 'C... Remove this comment to see the full error message
import { Badge } from '../components/ui/badge';
// @ts-expect-error TS(6142): Module '../components/ui/button' was resolved to '... Remove this comment to see the full error message
import { Button } from '../components/ui/button';
// @ts-expect-error TS(6142): Module '../components/ui/card' was resolved to 'C:... Remove this comment to see the full error message
import { Card } from '../components/ui/card';

interface LiveGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: string;
  timeRemaining: string;
  status: 'live' | 'halftime' | 'timeout' | 'review';
  momentum: 'home' | 'away' | 'neutral';
  lastPlay?: string;
  hasVideo?: boolean;
}

interface LiveBet {
  id: string;
  gameId: string;
  type: string;
  line: string;
  odds: string;
  movement: 'up' | 'down' | 'stable';
  confidence: number;
  aiRecommendation?: string;
}

interface QuickBet {
  amount: number;
  type: 'spread' | 'total' | 'moneyline' | 'prop';
  selection: string;
}

export const LiveBetting: React.FC = () => {
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<LiveGame | null>(null);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [quickBet, setQuickBet] = useState<QuickBet>({
    amount: 50,
    type: 'spread',
    selection: '',
  });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [betSlip, setBetSlip] = useState<LiveBet[]>([]);

  // Generate mock live games
  const generateLiveGames = (): LiveGame[] => {
    const sports = ['NBA', 'NFL', 'NHL', 'MLB', 'Soccer'];
    const teams = {
      NBA: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Bucks', 'Suns', 'Nets', 'Clippers'],
      NFL: ['Chiefs', 'Bills', 'Eagles', 'Cowboys', 'Packers', 'Ravens', '49ers', 'Bengals'],
      NHL: ['Rangers', 'Lightning', 'Avalanche', 'Maple Leafs', 'Oilers', 'Panthers'],
      MLB: ['Yankees', 'Dodgers', 'Astros', 'Braves', 'Red Sox', 'Giants'],
      Soccer: ['Real Madrid', 'Barcelona', 'Man City', 'Liverpool', 'Bayern', 'PSG'],
    };

    const games: LiveGame[] = [];

    for (let i = 0; i < 8; i++) {
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const sportTeams = teams[sport as keyof typeof teams];
      const homeTeam = sportTeams[Math.floor(Math.random() * sportTeams.length)];
      let awayTeam = sportTeams[Math.floor(Math.random() * sportTeams.length)];
      while (awayTeam === homeTeam) {
        awayTeam = sportTeams[Math.floor(Math.random() * sportTeams.length)];
      }

      const period =
        sport === 'NBA' || sport === 'NFL'
          ? `Q${Math.floor(Math.random() * 4) + 1}`
          : sport === 'NHL' || sport === 'Soccer'
            ? `P${Math.floor(Math.random() * 3) + 1}`
            : `T${Math.floor(Math.random() * 9) + 1}`;

      games.push({
        id: `game-${i}`,
        sport,
        league: sport,
        homeTeam,
        awayTeam,
        homeScore: Math.floor(Math.random() * 100),
        awayScore: Math.floor(Math.random() * 100),
        period,
        timeRemaining: `${Math.floor(Math.random() * 12)}:${Math.floor(Math.random() * 59)
          .toString()
          .padStart(2, '0')}`,
        status: Math.random() > 0.8 ? 'timeout' : 'live',
        momentum: ['home', 'away', 'neutral'][Math.floor(Math.random() * 3)] as any,
        lastPlay: generateLastPlay(sport),
        hasVideo: Math.random() > 0.5,
      });
    }

    return games;
  };

  const generateLastPlay = (sport: string): string => {
    const plays = {
      NBA: ['Three-pointer made', 'Slam dunk', 'Free throw', 'Turnover', 'Timeout called'],
      NFL: ['Touchdown pass', 'Field goal', 'Interception', 'Fumble recovery', 'First down'],
      NHL: ['Goal scored', 'Power play', 'Penalty', 'Save made', 'Icing called'],
      MLB: ['Home run', 'Strike out', 'Double play', 'Base hit', 'Stolen base'],
      Soccer: ['Goal scored', 'Yellow card', 'Corner kick', 'Penalty kick', 'Offside'],
    };

    const sportPlays = plays[sport as keyof typeof plays] || plays.NBA;
    return sportPlays[Math.floor(Math.random() * sportPlays.length)];
  };

  // Generate live bets for selected game
  const generateLiveBets = (game: LiveGame): LiveBet[] => {
    const betTypes = ['Spread', 'Total', 'Moneyline', 'Next Score', 'Player Props'];
    const bets: LiveBet[] = [];

    betTypes.forEach((type, index) => {
      bets.push({
        id: `bet-${game.id}-${index}`,
        gameId: game.id,
        type,
        line: generateBetLine(type, game),
        odds: generateOdds(),
        movement: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
        confidence: 80 + Math.random() * 19,
        aiRecommendation: Math.random() > 0.5 ? 'Strong Play' : undefined,
      });
    });

    return bets;
  };

  const generateBetLine = (type: string, game: LiveGame): string => {
    switch (type) {
      case 'Spread':
        return `${game.homeTeam} ${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 10 + 1).toFixed(1)}`;
      case 'Total':
        return `O/U ${game.homeScore + game.awayScore + Math.floor(Math.random() * 50 + 20)}`;
      case 'Moneyline':
        return game.homeScore > game.awayScore ? game.awayTeam : game.homeTeam;
      case 'Next Score':
        return 'Next Team to Score';
      default:
        return 'Special Bet';
    }
  };

  const generateOdds = (): string => {
    return Math.random() > 0.5
      ? `+${Math.floor(Math.random() * 150 + 100)}`
      : `-${Math.floor(Math.random() * 150 + 100)}`;
  };

  // Update games and scores
  useEffect(() => {
    setLiveGames(generateLiveGames());

    if (isAutoRefresh) {
      const interval = setInterval(() => {
        setLiveGames(prevGames =>
          prevGames.map(game => ({
            ...game,
            homeScore: game.homeScore + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0),
            awayScore: game.awayScore + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0),
            timeRemaining: updateTime(game.timeRemaining),
            lastPlay: Math.random() > 0.5 ? generateLastPlay(game.sport) : game.lastPlay,
            momentum:
              Math.random() > 0.8
                ? (['home', 'away', 'neutral'][Math.floor(Math.random() * 3)] as any)
                : game.momentum,
          }))
        );

        // Update live bets if game is selected
        if (selectedGame) {
          setLiveBets(prev =>
            prev.map(bet => ({
              ...bet,
              odds: Math.random() > 0.7 ? generateOdds() : bet.odds,
              movement:
                Math.random() > 0.8
                  ? (['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any)
                  : bet.movement,
            }))
          );
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, selectedGame]);

  const updateTime = (time: string): string => {
    const [minutes, seconds] = time.split(':').map(Number);
    let newSeconds = seconds - 5;
    let newMinutes = minutes;

    if (newSeconds < 0) {
      newSeconds = 59;
      newMinutes = Math.max(0, minutes - 1);
    }

    return `${newMinutes}:${newSeconds.toString().padStart(2, '0')}`;
  };

  const selectGame = (game: LiveGame) => {
    setSelectedGame(game);
    setLiveBets(generateLiveBets(game));
  };

  const addToBetSlip = (bet: LiveBet) => {
    if (!betSlip.find(b => b.id === bet.id)) {
      setBetSlip([...betSlip, bet]);
    }
  };

  const removeFromBetSlip = (betId: string) => {
    setBetSlip(betSlip.filter(b => b.id !== betId));
  };

  const placeBets = () => {
    if (betSlip.length > 0) {
      alert(`Placing ${betSlip.length} bet(s) for $${quickBet.amount * betSlip.length}`);
      setBetSlip([]);
    }
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='space-y-8'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Card className='p-12 bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-500/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-5xl font-black bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mb-4'>
            LIVE BETTING
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-xl text-gray-300 mb-8'>In-Game Action & Real-Time Odds</p>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center gap-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='text-red-500'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Radio className='w-12 h-12' />
            </motion.div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-3 gap-8 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-red-400'>{liveGames.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Live Games</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-yellow-400'>
                  {liveGames.filter(g => g.momentum !== 'neutral').length}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Hot Games</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-green-400'>{betSlip.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Active Selections</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Controls */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                type='checkbox'
                checked={isAutoRefresh}
                onChange={e => setIsAutoRefresh(e.target.checked)}
                className='form-checkbox text-red-500'
              />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm'>Auto-refresh scores</span>
            </label>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Badge variant='outline' className='text-green-400 border-green-400'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Activity className='w-3 h-3 mr-1' />
              Live Updates
            </Badge>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center gap-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <span className='text-sm text-gray-400'>Quick Bet Amount:</span>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              value={quickBet.amount}
              onChange={e => setQuickBet({ ...quickBet, amount: parseInt(e.target.value) })}
              className='px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Quick bet amount'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value={25}>$25</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value={50}>$50</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value={100}>$100</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value={250}>$250</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value={500}>$500</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Live Games Grid */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Games List */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='space-y-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h3 className='text-xl font-bold text-white mb-4'>Live Games</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AnimatePresence>
            {liveGames.map((game, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card
                  className={`p-6 cursor-pointer transition-all ${
                    selectedGame?.id === game.id
                      ? 'border-red-500/50 bg-red-900/10'
                      : 'border-gray-700/50 hover:border-red-500/30'
                  }`}
                  onClick={() => selectGame(game)}
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center gap-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Badge variant='destructive' className='animate-pulse'>
                        LIVE
                      </Badge>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Badge variant='outline' className='text-gray-400 border-gray-600'>
                        {game.sport}
                      </Badge>
                      {game.hasVideo && (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Badge variant='outline' className='text-blue-400 border-blue-400'>
                          📺 Stream
                        </Badge>
                      )}
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-sm text-gray-400'>
                      {game.period} • {game.timeRemaining}
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span
                        className={`font-semibold ${game.homeScore > game.awayScore ? 'text-green-400' : 'text-white'}`}
                      >
                        {game.homeTeam}
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-2xl font-bold text-white'>{game.homeScore}</span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span
                        className={`font-semibold ${game.awayScore > game.homeScore ? 'text-green-400' : 'text-white'}`}
                      >
                        {game.awayTeam}
                      </span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-2xl font-bold text-white'>{game.awayScore}</span>
                    </div>
                  </div>

                  {game.lastPlay && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-4 pt-4 border-t border-gray-700'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center gap-2 text-sm'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <Activity className='w-4 h-4 text-yellow-400' />
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-gray-400'>Last:</span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-white'>{game.lastPlay}</span>
                      </div>
                    </div>
                  )}

                  {game.momentum !== 'neutral' && (
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='mt-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Badge
                        variant='outline'
                        className={`${
                          game.momentum === 'home'
                            ? 'text-blue-400 border-blue-400'
                            : 'text-orange-400 border-orange-400'
                        }`}
                      >
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <TrendingUp className='w-3 h-3 mr-1' />
                        {game.momentum === 'home' ? game.homeTeam : game.awayTeam} Momentum
                      </Badge>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Selected Game Betting */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          {selectedGame ? (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex items-center justify-between mb-4'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <h3 className='text-xl font-bold text-white'>
                  {selectedGame.awayTeam} @ {selectedGame.homeTeam}
                </h3>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Badge variant='destructive' className='animate-pulse'>
                  {selectedGame.period} • {selectedGame.timeRemaining}
                </Badge>
              </div>

              {/* Live Bets */}
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-3'>
                {liveBets.map(bet => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Card
                    key={bet.id}
                    className='p-4 border-gray-700/50 hover:border-yellow-500/30 transition-all'
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between mb-2'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='font-semibold text-white'>{bet.type}</div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='text-sm text-gray-400'>{bet.line}</div>
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-right'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span className='text-xl font-bold text-yellow-400'>{bet.odds}</span>
                          {bet.movement === 'up' && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <TrendingUp className='w-4 h-4 text-green-400' />
                          )}
                          {bet.movement === 'down' && (
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <TrendingUp className='w-4 h-4 text-red-400 rotate-180' />
                          )}
                        </div>
                        {bet.aiRecommendation && (
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Badge
                            variant='outline'
                            className='text-green-400 border-green-400 text-xs'
                          >
                            {bet.aiRecommendation}
                          </Badge>
                        )}
                      </div>
                    </div>

                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between mt-3'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>
                        AI Confidence: {bet.confidence.toFixed(1)}%
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Button
                        size='sm'
                        onClick={() => addToBetSlip(bet)}
                        disabled={betSlip.some(b => b.id === bet.id)}
                        className='bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                      >
                        {betSlip.some(b => b.id === bet.id) ? 'Added' : 'Add to Slip'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Bet Slip */}
              {betSlip.length > 0 && (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Card className='p-6 border-yellow-500/30 bg-yellow-900/10'>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <h4 className='text-lg font-bold text-yellow-400 mb-4'>Bet Slip</h4>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='space-y-2 mb-4'>
                    {betSlip.map(bet => (
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div key={bet.id} className='flex items-center justify-between text-sm'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <span className='text-gray-300'>
                          {bet.type} • {bet.odds}
                        </span>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <button
                          onClick={() => removeFromBetSlip(bet.id)}
                          className='text-red-400 hover:text-red-300'
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='border-t border-gray-700 pt-4'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex items-center justify-between mb-4'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Total Stake:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-xl font-bold text-white'>
                        ${quickBet.amount * betSlip.length}
                      </span>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Button
                      onClick={placeBets}
                      className='w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    >
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <Zap className='mr-2 h-4 w-4' />
                      Place {betSlip.length} Bet{betSlip.length > 1 ? 's' : ''}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Card className='p-12 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h3 className='text-xl font-bold text-gray-300 mb-2'>Select a Game</h3>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400'>Choose a live game to view betting options</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
