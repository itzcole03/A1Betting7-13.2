import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Clock,
  Heart,
  Search,
  Target,
  TrendingDown,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

interface InjuryReport {
  id: string;
  player: string;
  team: string;
  sport: string;
  position: string;
  injury: string;
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  status: 'questionable' | 'doubtful' | 'out' | 'ir' | 'healthy';
  expectedReturn: string;
  impact: {
    team: number;
    fantasy: number;
    betting: number;
  };
  timeline: string;
  reportedDate: string;
  source: string;
  reliability: number;
}

interface TeamImpact {
  team: string;
  sport: string;
  totalInjuries: number;
  keyPlayerInjuries: number;
  projectedImpact: number;
  affectedPositions: string[];
}

export const InjuryTracker: React.FC = () => {
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [teamImpacts, setTeamImpacts] = useState<TeamImpact[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const generateInjuryReports = (): InjuryReport[] => {
      const sports = ['NBA', 'NFL', 'MLB', 'NHL'];
      const teams = {
        NBA: ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Nets', 'Knicks'],
        NFL: ['Chiefs', 'Bills', 'Cowboys', 'Patriots', 'Packers', 'Ravens'],
        MLB: ['Yankees', 'Red Sox', 'Dodgers', 'Astros', 'Giants', 'Mets'],
        NHL: ['Rangers', 'Lightning', 'Bruins', 'Kings', 'Penguins', 'Capitals'],
      };

      const positions = {
        NBA: ['PG', 'SG', 'SF', 'PF', 'C'],
        NFL: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'],
        MLB: ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'],
        NHL: ['C', 'LW', 'RW', 'D', 'G'],
      };

      const injuries = [
        'Ankle Sprain',
        'Knee Injury',
        'Hamstring Strain',
        'Shoulder Injury',
        'Concussion',
        'Back Spasms',
        'Groin Strain',
        'Wrist Injury',
        'Hip Injury',
        'Calf Strain',
        'Neck Injury',
        'Foot Injury',
      ];

      const bodyParts = [
        'Ankle',
        'Knee',
        'Hamstring',
        'Shoulder',
        'Head',
        'Back',
        'Groin',
        'Wrist',
        'Hip',
        'Calf',
        'Neck',
        'Foot',
      ];

      return Array.from({ length: 20 }, (_, index) => {
        const sport = sports[Math.floor(Math.random() * sports.length)];
        const team = teams[sport][Math.floor(Math.random() * teams[sport].length)];
        const severity =
          Math.random() > 0.7 ? 'severe' : Math.random() > 0.4 ? 'moderate' : 'minor';

        return {
          id: `injury-${index}`,
          player: `Player ${Math.floor(Math.random() * 100) + 1}`,
          team,
          sport,
          position: positions[sport][Math.floor(Math.random() * positions[sport].length)],
          injury: injuries[Math.floor(Math.random() * injuries.length)],
          bodyPart: bodyParts[Math.floor(Math.random() * bodyParts.length)],
          severity,
          status: severity === 'severe' ? 'out' : Math.random() > 0.5 ? 'questionable' : 'doubtful',
          expectedReturn:
            severity === 'severe'
              ? '4-6 weeks'
              : severity === 'moderate'
                ? '1-2 weeks'
                : '3-5 days',
          impact: {
            team:
              severity === 'severe'
                ? 80 + Math.random() * 20
                : severity === 'moderate'
                  ? 50 + Math.random() * 30
                  : 20 + Math.random() * 30,
            fantasy:
              severity === 'severe'
                ? 90 + Math.random() * 10
                : severity === 'moderate'
                  ? 60 + Math.random() * 30
                  : 30 + Math.random() * 40,
            betting:
              severity === 'severe'
                ? 70 + Math.random() * 30
                : severity === 'moderate'
                  ? 40 + Math.random() * 40
                  : 15 + Math.random() * 35,
          },
          timeline: `${Math.floor(Math.random() * 12) + 1}h ago`,
          reportedDate: `${Math.floor(Math.random() * 7) + 1} days ago`,
          source: ['Team Report', 'Beat Reporter', 'Medical Staff', 'Player Statement'][
            Math.floor(Math.random() * 4)
          ],
          reliability: 70 + Math.random() * 30,
        };
      });
    };

    const generateTeamImpacts = (injuryData: InjuryReport[]): TeamImpact[] => {
      const teamMap = new Map<string, InjuryReport[]>();

      injuryData.forEach(injury => {
        const key = `${injury.team}-${injury.sport}`;
        if (!teamMap.has(key)) {
          teamMap.set(key, []);
        }
        teamMap.get(key)!.push(injury);
      });

      return Array.from(teamMap.entries())
        .map(([key, teamInjuries]) => {
          const [team, sport] = key.split('-');
          const keyPlayerInjuries = teamInjuries.filter(
            i => i.severity === 'severe' || i.severity === 'moderate'
          ).length;

          return {
            team,
            sport,
            totalInjuries: teamInjuries.length,
            keyPlayerInjuries,
            projectedImpact: Math.min(
              100,
              teamInjuries.reduce((sum, i) => sum + i.impact.team, 0) / 3
            ),
            affectedPositions: [...new Set(teamInjuries.map(i => i.position))],
          };
        })
        .sort((a, b) => b.projectedImpact - a.projectedImpact);
    };

    const injuryData = generateInjuryReports();
    setInjuries(injuryData);
    setTeamImpacts(generateTeamImpacts(injuryData));
  }, []);

  // Filter injuries
  const filteredInjuries = injuries.filter(injury => {
    if (selectedSport !== 'all' && injury.sport !== selectedSport) return false;
    if (selectedSeverity !== 'all' && injury.severity !== selectedSeverity) return false;
    if (
      searchQuery &&
      !injury.player.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !injury.team.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 border-red-600 bg-red-900/20';
      case 'severe':
        return 'text-red-400 border-red-400 bg-red-900/10';
      case 'moderate':
        return 'text-yellow-400 border-yellow-400 bg-yellow-900/10';
      case 'minor':
        return 'text-green-400 border-green-400 bg-green-900/10';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out':
      case 'ir':
        return 'text-red-400 border-red-400';
      case 'doubtful':
        return 'text-orange-400 border-orange-400';
      case 'questionable':
        return 'text-yellow-400 border-yellow-400';
      case 'healthy':
        return 'text-green-400 border-green-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'severe':
        return <AlertTriangle className='w-4 h-4' />;
      case 'moderate':
        return <TrendingDown className='w-4 h-4' />;
      case 'minor':
        return <Activity className='w-4 h-4' />;
      default:
        return <Heart className='w-4 h-4' />;
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
        <Card className='p-12 bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30'>
          <h1 className='text-5xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-4'>
            INJURY TRACKER
          </h1>
          <p className='text-xl text-gray-300 mb-8'>Real-Time Player Health Intelligence</p>

          <div className='flex items-center justify-center gap-8'>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='text-orange-500'
            >
              <Heart className='w-12 h-12' />
            </motion.div>

            <div className='grid grid-cols-4 gap-8 text-center'>
              <div>
                <div className='text-3xl font-bold text-orange-400'>{injuries.length}</div>
                <div className='text-gray-400'>Total Injuries</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-red-400'>
                  {injuries.filter(i => i.severity === 'severe').length}
                </div>
                <div className='text-gray-400'>Severe</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-yellow-400'>
                  {injuries.filter(i => i.status === 'questionable').length}
                </div>
                <div className='text-gray-400'>Questionable</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-blue-400'>{teamImpacts.length}</div>
                <div className='text-gray-400'>Teams Affected</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filters */}
      <Card className='p-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm text-gray-400 mb-2'>Sport</label>
            <select
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Select sport'
            >
              <option value='all'>All Sports</option>
              <option value='NBA'>NBA</option>
              <option value='NFL'>NFL</option>
              <option value='MLB'>MLB</option>
              <option value='NHL'>NHL</option>
            </select>
          </div>

          <div>
            <label className='block text-sm text-gray-400 mb-2'>Severity</label>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Select severity'
            >
              <option value='all'>All Severities</option>
              <option value='critical'>Critical</option>
              <option value='severe'>Severe</option>
              <option value='moderate'>Moderate</option>
              <option value='minor'>Minor</option>
            </select>
          </div>

          <div>
            <label className='block text-sm text-gray-400 mb-2'>Search</label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Player or team...'
                className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg'
                aria-label='Search players or teams'
              />
            </div>
          </div>

          <div className='flex items-end'>
            <Button className='w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'>
              Refresh Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Injury Reports */}
        <div className='xl:col-span-2'>
          <div className='space-y-6'>
            <h3 className='text-xl font-bold text-white'>Active Injury Reports</h3>

            <div className='space-y-4'>
              {filteredInjuries.map((injury, index) => (
                <motion.div
                  key={injury.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className='p-6 hover:border-orange-500/30 transition-all'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center'>
                          <User className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <h4 className='text-lg font-bold text-white'>{injury.player}</h4>
                          <p className='text-gray-400 text-sm'>
                            {injury.team} • {injury.position}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Badge variant='outline' className={getSeverityColor(injury.severity)}>
                          {getSeverityIcon(injury.severity)}
                          {injury.severity}
                        </Badge>
                        <Badge variant='outline' className={getStatusColor(injury.status)}>
                          {injury.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
                      <div>
                        <h5 className='font-bold text-white mb-2'>Injury Details</h5>
                        <div className='space-y-1 text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-gray-400'>Injury:</span>
                            <span className='text-white'>{injury.injury}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-400'>Body Part:</span>
                            <span className='text-white'>{injury.bodyPart}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-400'>Expected Return:</span>
                            <span className='text-white'>{injury.expectedReturn}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-400'>Reported:</span>
                            <span className='text-white'>{injury.reportedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className='font-bold text-white mb-2'>Impact Analysis</h5>
                        <div className='space-y-2'>
                          <div>
                            <div className='flex justify-between text-sm mb-1'>
                              <span className='text-gray-400'>Team Impact</span>
                              <span className='text-orange-400 font-bold'>
                                {injury.impact.team.toFixed(0)}%
                              </span>
                            </div>
                            <div className='w-full bg-gray-700 rounded-full h-2'>
                              <motion.div
                                className='bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full'
                                animate={{ width: `${injury.impact.team}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className='flex justify-between text-sm mb-1'>
                              <span className='text-gray-400'>Fantasy Impact</span>
                              <span className='text-purple-400 font-bold'>
                                {injury.impact.fantasy.toFixed(0)}%
                              </span>
                            </div>
                            <div className='w-full bg-gray-700 rounded-full h-2'>
                              <motion.div
                                className='bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full'
                                animate={{ width: `${injury.impact.fantasy}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className='flex justify-between text-sm mb-1'>
                              <span className='text-gray-400'>Betting Impact</span>
                              <span className='text-blue-400 font-bold'>
                                {injury.impact.betting.toFixed(0)}%
                              </span>
                            </div>
                            <div className='w-full bg-gray-700 rounded-full h-2'>
                              <motion.div
                                className='bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full'
                                animate={{ width: `${injury.impact.betting}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-700'>
                      <div className='flex items-center gap-4'>
                        <span>Source: {injury.source}</span>
                        <div className='flex items-center gap-1'>
                          <Target className='w-3 h-3' />
                          <span>Reliability: {injury.reliability.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        <span>Updated {injury.timeline}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Impact Analysis */}
        <div>
          <Card className='p-6'>
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-orange-400' />
              Team Impact Rankings
            </h4>

            <div className='space-y-3'>
              {teamImpacts.slice(0, 8).map((team, index) => (
                <motion.div
                  key={`${team.team}-${team.sport}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div>
                      <h5 className='font-bold text-white text-sm'>{team.team}</h5>
                      <p className='text-gray-400 text-xs'>{team.sport}</p>
                    </div>
                    <div className='text-right'>
                      <div className='text-orange-400 font-bold text-sm'>
                        {team.projectedImpact.toFixed(0)}%
                      </div>
                      <div className='text-xs text-gray-400'>Impact</div>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-3 text-xs'>
                    <div>
                      <span className='text-gray-400'>Total Injuries:</span>
                      <div className='text-red-400 font-bold'>{team.totalInjuries}</div>
                    </div>
                    <div>
                      <span className='text-gray-400'>Key Players:</span>
                      <div className='text-yellow-400 font-bold'>{team.keyPlayerInjuries}</div>
                    </div>
                  </div>

                  <div className='mt-3'>
                    <div className='text-xs text-gray-400 mb-1'>Affected Positions:</div>
                    <div className='flex flex-wrap gap-1'>
                      {team.affectedPositions.map((pos, i) => (
                        <Badge
                          key={i}
                          variant='outline'
                          className='text-xs text-gray-400 border-gray-600'
                        >
                          {pos}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
