import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, Calculator, RefreshCw, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface ArbitrageOpportunity {
  id: string;
  game: string;
  type: string;
  book1: string;
  book1Odds: string;
  book2: string;
  book2Odds: string;
  roi: number;
  stake: number;
  profit: number;
  confidence: number;
  timeRemaining: string;
  sport: string;
  league: string;
  isLive?: boolean;
}

interface SportsbookOdds {
  book: string;
  odds: string;
  movement: 'up' | 'down' | 'stable';
  lastUpdate: string;
}

export const ArbitrageScanner: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedSports, setSelectedSports] = useState(['all']);
  const [minROI, setMinROI] = useState(1);
  const [maxStake, setMaxStake] = useState(1000);
  const [lastScan, setLastScan] = useState(new Date());

  // Mock data generation
  const generateOpportunities = () => {
    const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis'];
    const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'Barstool'];
    const gameTypes = ['Spread', 'Total', 'Moneyline', 'Player Props'];

    const mockOpportunities: ArbitrageOpportunity[] = [];

    for (let i = 0; i < 5; i++) {
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const roi = 1 + Math.random() * 8; // 1-9% ROI
      const stake = 100 + Math.floor(Math.random() * 900);

      mockOpportunities.push({
        id: `arb-${Date.now()}-${i}`,
        game: generateGameName(sport),
        type: gameTypes[Math.floor(Math.random() * gameTypes.length)],
        book1: sportsbooks[Math.floor(Math.random() * sportsbooks.length)],
        book1Odds: generateOdds(),
        book2: sportsbooks[Math.floor(Math.random() * sportsbooks.length)],
        book2Odds: generateOdds(),
        roi: roi,
        stake: stake,
        profit: stake * (roi / 100),
        confidence: 85 + Math.random() * 14,
        timeRemaining: `${Math.floor(Math.random() * 59 + 1)}:${Math.floor(Math.random() * 59)
          .toString()
          .padStart(2, '0')}`,
        sport: sport,
        league: getLeague(sport),
        isLive: Math.random() > 0.7,
      });
    }

    return mockOpportunities.sort((a, b) => b.roi - a.roi);
  };

  const generateGameName = (sport: string) => {
    const teams = {
      NBA: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Bucks', 'Suns'],
      NFL: ['Chiefs', 'Bills', 'Eagles', 'Cowboys', 'Ravens', '49ers'],
      MLB: ['Yankees', 'Dodgers', 'Astros', 'Braves', 'Cardinals', 'Giants'],
      NHL: ['Rangers', 'Maple Leafs', 'Lightning', 'Avalanche', 'Panthers', 'Oilers'],
      Soccer: ['Real Madrid', 'Barcelona', 'Man City', 'Liverpool', 'Bayern', 'PSG'],
      Tennis: ['Djokovic', 'Alcaraz', 'Medvedev', 'Sinner', 'Ruud', 'Rublev'],
    };

    const sportTeams = teams[sport as keyof typeof teams] || teams.NBA;
    const team1 = sportTeams[Math.floor(Math.random() * sportTeams.length)];
    let team2 = sportTeams[Math.floor(Math.random() * sportTeams.length)];
    while (team2 === team1) {
      team2 = sportTeams[Math.floor(Math.random() * sportTeams.length)];
    }

    return `${team1} vs ${team2}`;
  };

  const generateOdds = () => {
    const american =
      Math.random() > 0.5
        ? `+${Math.floor(Math.random() * 200 + 100)}`
        : `-${Math.floor(Math.random() * 200 + 100)}`;
    return american;
  };

  const getLeague = (sport: string) => {
    const leagues: Record<string, string> = {
      NBA: 'NBA',
      NFL: 'NFL',
      MLB: 'MLB',
      NHL: 'NHL',
      Soccer: 'Premier League',
      Tennis: 'ATP Tour',
    };
    return leagues[sport] || 'Other';
  };

  const scanForArbitrage = async () => {
    setIsScanning(true);

    // Simulate scanning delay
    setTimeout(() => {
      const newOpportunities = generateOpportunities();
      setOpportunities(newOpportunities);
      setLastScan(new Date());
      setIsScanning(false);
    }, 2000);
  };

  const executeArbitrage = (opportunity: ArbitrageOpportunity) => {
    // Simulate arbitrage execution
    alert(
      `Executing arbitrage:\n${opportunity.game}\nExpected profit: $${opportunity.profit.toFixed(2)}`
    );
  };

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        scanForArbitrage();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Initial scan
  useEffect(() => {
    scanForArbitrage();
  }, []);

  const filteredOpportunities = opportunities.filter(
    opp =>
      opp.roi >= minROI &&
      opp.stake <= maxStake &&
      (selectedSports.includes('all') || selectedSports.includes(opp.sport.toLowerCase()))
  );

  return (
    <div className='space-y-8'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center'
      >
        <Card className='p-12 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30'>
          <h1 className='text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4'>
            ARBITRAGE SCANNER
          </h1>
          <p className='text-xl text-gray-300 mb-8'>Real-Time Cross-Book Opportunity Detection</p>

          <div className='flex items-center justify-center gap-8'>
            <motion.div
              animate={{ rotate: isScanning ? 360 : 0 }}
              transition={{ duration: 2, repeat: isScanning ? Infinity : 0, ease: 'linear' }}
              className='text-6xl'
            >
              ⚡
            </motion.div>

            <div className='text-left'>
              <div className='text-3xl font-bold text-yellow-400'>
                {filteredOpportunities.length}
              </div>
              <div className='text-gray-400'>Active Opportunities</div>
            </div>

            <div className='text-left'>
              <div className='text-3xl font-bold text-green-400'>
                ${filteredOpportunities.reduce((sum, opp) => sum + opp.profit, 0).toFixed(2)}
              </div>
              <div className='text-gray-400'>Total Potential Profit</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Controls */}
      <Card className='p-6'>
        <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
          <div className='flex items-center gap-4'>
            <Button
              onClick={scanForArbitrage}
              disabled={isScanning}
              className='bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
            >
              {isScanning ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Scanning...
                </>
              ) : (
                <>
                  <Zap className='mr-2 h-4 w-4' />
                  Scan Now
                </>
              )}
            </Button>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className='form-checkbox text-yellow-500'
              />
              <span className='text-sm'>Auto-refresh (30s)</span>
            </label>
          </div>

          <div className='text-sm text-gray-400'>Last scan: {lastScan.toLocaleTimeString()}</div>
        </div>

        {/* Filters */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label htmlFor='min-roi-input' className='block text-sm font-medium text-gray-400 mb-2'>
              Min ROI (%)
            </label>
            <input
              id='min-roi-input'
              type='range'
              min='0'
              max='10'
              step='0.5'
              value={minROI}
              onChange={e => setMinROI(parseFloat(e.target.value))}
              className='w-full'
              aria-label='Minimum ROI'
            />
            <div className='text-center text-yellow-400 font-bold mt-1'>{minROI}%</div>
          </div>

          <div>
            <label
              htmlFor='max-stake-input'
              className='block text-sm font-medium text-gray-400 mb-2'
            >
              Max Stake ($)
            </label>
            <input
              id='max-stake-input'
              type='number'
              value={maxStake}
              onChange={e => setMaxStake(parseInt(e.target.value) || 0)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Maximum stake amount'
              placeholder='Max stake'
            />
          </div>

          <div>
            <label htmlFor='sports-filter' className='block text-sm font-medium text-gray-400 mb-2'>
              Sports
            </label>
            <select
              id='sports-filter'
              value={selectedSports[0]}
              onChange={e => setSelectedSports([e.target.value])}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Select sports filter'
            >
              <option value='all'>All Sports</option>
              <option value='nba'>NBA</option>
              <option value='nfl'>NFL</option>
              <option value='mlb'>MLB</option>
              <option value='nhl'>NHL</option>
              <option value='soccer'>Soccer</option>
              <option value='tennis'>Tennis</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Opportunities List */}
      <AnimatePresence>
        {filteredOpportunities.map((opportunity, index) => (
          <motion.div
            key={opportunity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className='p-6 border-yellow-500/30 hover:border-yellow-500/50 transition-all'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h3 className='text-xl font-bold text-white'>{opportunity.game}</h3>
                    {opportunity.isLive && (
                      <Badge variant='destructive' className='animate-pulse'>
                        LIVE
                      </Badge>
                    )}
                    <Badge variant='outline' className='text-yellow-400 border-yellow-400'>
                      {opportunity.sport}
                    </Badge>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                    <div className='space-y-1'>
                      <div className='text-sm text-gray-400'>Book 1: {opportunity.book1}</div>
                      <div className='text-lg font-mono font-bold text-green-400'>
                        {opportunity.book1Odds}
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <div className='text-sm text-gray-400'>Book 2: {opportunity.book2}</div>
                      <div className='text-lg font-mono font-bold text-red-400'>
                        {opportunity.book2Odds}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 text-sm'>
                    <span className='text-gray-400'>Type: {opportunity.type}</span>
                    <span className='text-gray-400'>•</span>
                    <span className='text-gray-400'>
                      Confidence: {opportunity.confidence.toFixed(1)}%
                    </span>
                    <span className='text-gray-400'>•</span>
                    <span className='text-yellow-400 flex items-center'>
                      <Activity className='w-4 h-4 mr-1' />
                      {opportunity.timeRemaining}
                    </span>
                  </div>
                </div>

                <div className='text-center space-y-3'>
                  <div>
                    <div className='text-3xl font-bold text-yellow-400'>
                      +{opportunity.roi.toFixed(2)}%
                    </div>
                    <div className='text-sm text-gray-400'>ROI</div>
                  </div>

                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <div className='font-bold text-white'>${opportunity.stake}</div>
                      <div className='text-gray-400'>Stake</div>
                    </div>
                    <div>
                      <div className='font-bold text-green-400'>
                        +${opportunity.profit.toFixed(2)}
                      </div>
                      <div className='text-gray-400'>Profit</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => executeArbitrage(opportunity)}
                    size='sm'
                    className='w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                  >
                    <Calculator className='mr-2 h-4 w-4' />
                    Execute
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {filteredOpportunities.length === 0 && !isScanning && (
        <Card className='p-12 text-center'>
          <AlertTriangle className='w-12 h-12 text-yellow-400 mx-auto mb-4' />
          <h3 className='text-xl font-bold text-gray-300 mb-2'>No Arbitrage Opportunities Found</h3>
          <p className='text-gray-400'>Try adjusting your filters or wait for the next scan.</p>
        </Card>
      )}

      {/* Stats Summary */}
      <Card className='p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50'>
        <h3 className='text-xl font-bold text-white mb-4'>Session Summary</h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-yellow-400'>{opportunities.length}</div>
            <div className='text-sm text-gray-400'>Total Found</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-400'>
              {opportunities.filter(o => o.roi > 5).length}
            </div>
            <div className='text-sm text-gray-400'>High Value (&gt;5%)</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-400'>
              {opportunities.filter(o => o.isLive).length}
            </div>
            <div className='text-sm text-gray-400'>Live Games</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-400'>
              {Math.max(...opportunities.map(o => o.roi), 0).toFixed(1)}%
            </div>
            <div className='text-sm text-gray-400'>Best ROI</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
