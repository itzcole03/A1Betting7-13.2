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
// @ts-expect-error TS(6142): Module '../components/ui/badge' was resolved to 'C... Remove this comment to see the full error message
import { Badge } from '../components/ui/badge';
// @ts-expect-error TS(6142): Module '../components/ui/button' was resolved to '... Remove this comment to see the full error message
import { Button } from '../components/ui/button';
// @ts-expect-error TS(6142): Module '../components/ui/card' was resolved to 'C:... Remove this comment to see the full error message
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
  // State for injury data, team impacts, filters, and UI feedback
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [teamImpacts, setTeamImpacts] = useState<TeamImpact[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Loading state for API fetch
  const [error, setError] = useState<string | null>(null); // Error state for API fetch

  // Fetch injury data from API
  const fetchInjuryData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace this URL with your real backend endpoint
      const response = await fetch('/api/injuries');
      if (!response.ok) throw new Error('Failed to fetch injury data');
      const data: InjuryReport[] = await response.json();
      setInjuries(data);
      setTeamImpacts(generateTeamImpacts(data));
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      setInjuries([]);
      setTeamImpacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate team impact analysis from injury data
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

  // Fetch data on mount
  useEffect(() => {
    fetchInjuryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter injuries based on user selection
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <AlertTriangle className='w-4 h-4' />;
      case 'moderate':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <TrendingDown className='w-4 h-4' />;
      case 'minor':
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Activity className='w-4 h-4' />;
      default:
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        return <Heart className='w-4 h-4' />;
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
        <Card className='p-12 bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <h1 className='text-5xl font-black bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-4'>
            INJURY TRACKER
          </h1>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-xl text-gray-300 mb-8'>Real-Time Player Health Intelligence</p>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center gap-8'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='text-orange-500'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Heart className='w-12 h-12' />
            </motion.div>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='grid grid-cols-4 gap-8 text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-orange-400'>{injuries.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Total Injuries</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-red-400'>
                  {injuries.filter(i => i.severity === 'severe').length}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Severe</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-yellow-400'>
                  {injuries.filter(i => i.status === 'questionable').length}
                </div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Questionable</div>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-3xl font-bold text-blue-400'>{teamImpacts.length}</div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <div className='text-gray-400'>Teams Affected</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Filters */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Card className='p-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='injury-filter-sport'>Sport</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              id='injury-filter-sport'
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Select sport'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='all'>All Sports</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='NBA'>NBA</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='NFL'>NFL</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='MLB'>MLB</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='NHL'>NHL</option>
            </select>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='injury-filter-severity'>Severity</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <select
              id='injury-filter-severity'
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className='w-full p-2 bg-gray-800 border border-gray-700 rounded-lg'
              aria-label='Select severity'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='all'>All Severities</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='critical'>Critical</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='severe'>Severe</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='moderate'>Moderate</option>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <option value='minor'>Minor</option>
            </select>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <label className='block text-sm text-gray-400 mb-2' htmlFor='injury-filter-search'>Search</label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='relative'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                id='injury-filter-search'
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Player or team...'
                className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg'
                aria-label='Search players or teams'
              />
            </div>
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-end'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Button
              className='w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
              onClick={fetchInjuryData}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* Injury Reports */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='xl:col-span-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='space-y-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-bold text-white'>Active Injury Reports</h3>

            {/* Show loading, error, or empty state as appropriate */}
            {loading && (
              // Use role="status" and aria-live="polite" for screen reader announcement of loading state
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-center items-center h-32' role='status' aria-live='polite'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-orange-400 font-bold'>Loading injury data...</span>
              </div>
            )}
            {error && (
              // Use role="alert" for immediate screen reader announcement of errors
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-center items-center h-32' role='alert'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-red-400 font-bold'>Error: {error}</span>
              </div>
            )}
            {!loading && !error && filteredInjuries.length === 0 && (
              // Use role="status" and aria-live="polite" for empty state feedback
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='flex justify-center items-center h-32' role='status' aria-live='polite'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span className='text-gray-400'>No injuries found for the selected filters.</span>
              </div>
            )}

            {/* Injury list */}
            {!loading && !error && filteredInjuries.length > 0 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='space-y-4'>
                {filteredInjuries.map((injury, index) => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <motion.div
                    key={injury.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <Card className='p-6 hover:border-orange-500/30 transition-all'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-start justify-between mb-4'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-3'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <User className='w-6 h-6 text-white' />
                          </div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <h4 className='text-lg font-bold text-white'>{injury.player}</h4>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <p className='text-gray-400 text-sm'>
                              {injury.team} • {injury.position}
                            </p>
                          </div>
                        </div>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-2'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Badge variant='outline' className={getSeverityColor(injury.severity)}>
                            {getSeverityIcon(injury.severity)}
                            {injury.severity}
                          </Badge>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Badge variant='outline' className={getStatusColor(injury.status)}>
                            {injury.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <h5 className='font-bold text-white mb-2'>Injury Details</h5>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='space-y-1 text-sm'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='flex justify-between'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-gray-400'>Injury:</span>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-white'>{injury.injury}</span>
                            </div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='flex justify-between'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-gray-400'>Body Part:</span>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-white'>{injury.bodyPart}</span>
                            </div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='flex justify-between'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-gray-400'>Expected Return:</span>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-white'>{injury.expectedReturn}</span>
                            </div>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div className='flex justify-between'>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-gray-400'>Reported:</span>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <span className='text-white'>{injury.reportedDate}</span>
                            </div>
                          </div>
                        </div>

                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <h5 className='font-bold text-white mb-2'>Impact Analysis</h5>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='space-y-2'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='flex justify-between text-sm mb-1'>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span className='text-gray-400'>Team Impact</span>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span className='text-orange-400 font-bold'>
                                  {injury.impact.team.toFixed(0)}%
                                </span>
                              </div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='w-full bg-gray-700 rounded-full h-2'>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <motion.div
                                  className='bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full'
                                  animate={{ width: `${injury.impact.team}%` }}
                                  transition={{ duration: 1 }}
                                />
                              </div>
                            </div>

                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='flex justify-between text-sm mb-1'>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span className='text-gray-400'>Fantasy Impact</span>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span className='text-purple-400 font-bold'>
                                  {injury.impact.fantasy.toFixed(0)}%
                                </span>
                              </div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='w-full bg-gray-700 rounded-full h-2'>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <motion.div
                                  className='bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full'
                                  animate={{ width: `${injury.impact.fantasy}%` }}
                                  transition={{ duration: 1 }}
                                />
                              </div>
                            </div>

                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='flex justify-between text-sm mb-1'>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span className='text-gray-400'>Betting Impact</span>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                                <span className='text-blue-400 font-bold'>
                                  {injury.impact.betting.toFixed(0)}%
                                </span>
                              </div>
                              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                              <div className='w-full bg-gray-700 rounded-full h-2'>
                                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-700'>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-4'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>Source: {injury.source}</span>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <div className='flex items-center gap-1'>
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <Target className='w-3 h-3' />
                            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                            <span>Reliability: {injury.reliability.toFixed(0)}%</span>
                          </div>
                        </div>
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <div className='flex items-center gap-1'>
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Clock className='w-3 h-3' />
                          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <span>Updated {injury.timeline}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Impact Analysis */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Card className='p-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h4 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <AlertTriangle className='w-5 h-5 text-orange-400' />
              Team Impact Rankings
            </h4>

            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='space-y-3'>
              {teamImpacts.slice(0, 8).map((team, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <motion.div
                  key={`${team.team}-${team.sport}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-4 bg-slate-800/50 rounded-lg border border-slate-700/50'
                >
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='flex items-start justify-between mb-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <h5 className='font-bold text-white text-sm'>{team.team}</h5>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <p className='text-gray-400 text-xs'>{team.sport}</p>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-right'>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-orange-400 font-bold text-sm'>
                        {team.projectedImpact.toFixed(0)}%
                      </div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-xs text-gray-400'>Impact</div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='grid grid-cols-2 gap-3 text-xs'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Total Injuries:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-red-400 font-bold'>{team.totalInjuries}</div>
                    </div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <span className='text-gray-400'>Key Players:</span>
                      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <div className='text-yellow-400 font-bold'>{team.keyPlayerInjuries}</div>
                    </div>
                  </div>

                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <div className='mt-3'>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='text-xs text-gray-400 mb-1'>Affected Positions:</div>
                    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                    <div className='flex flex-wrap gap-1'>
                      {team.affectedPositions.map((pos, i) => (
                        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
