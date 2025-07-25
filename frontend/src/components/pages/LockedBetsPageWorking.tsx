import {
  Card,
  Center,
  Container,
  Group,
  Loader,
  Notification,
  Select,
  Text,
  Title,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { LockedBet } from '../types/LockedBet';

const LockedBetsPageWorking: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const _logEvent = (event: string, details?: Record<string, unknown>) => {
    console.log(`[Analytics] ${event}`, details || '');
  };

  const _fetchLockedBets = async (): Promise<LockedBet[]> => {
    const params = new URLSearchParams();
    if (selectedSport !== 'ALL') {
      params.append('sport', selectedSport);
    }
    params.append('min_confidence', minConfidence.toString());
    params.append('enhanced', 'true');
    try {
      const response = await fetch(`/api/prizepicks/props?${params}`);
      if (!response.ok) throw new Error('Failed to fetch locked bets');
      const data = await response.json();
      setLastUpdate(new Date());
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Network response was not ok',
        color: 'red',
      });
      _logEvent('fetch_error', { error });
      throw error;
    }
  };

  const {
    data: lockedBets = [],
    isLoading,
    error: _error, // Renamed error to _error
    refetch,
  } = useQuery<LockedBet[]>({
    queryKey: ['lockedBets', selectedSport, minConfidence],
    queryFn: _fetchLockedBets,
    refetchInterval: 30000,
    retry: 2,
  });

  React.useEffect(() => {
    if (!isLoading && lockedBets.length > 0) {
      _logEvent('fetch_success', { time: new Date().toISOString(), count: lockedBets.length });
    }
  }, [isLoading, lockedBets]);

  const uniqueSports = Array.from(new Set((lockedBets as LockedBet[]).map(bet => bet.sport ?? '')));

  const getBetCard = (bet: LockedBet) => {
    const _confidenceColor =
      (bet.ensemble_confidence ?? 0) >= 85
        ? 'text-green-400'
        : (bet.ensemble_confidence ?? 0) >= 75
        ? 'text-yellow-400'
        : 'text-orange-400';

    return (
      <div
        key={bet.id}
        className='relative bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-xl p-6'
      >
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <div className='text-xl font-bold text-white'>{bet.player_name}</div>
            <div className='text-sm text-gray-400'>({bet.team})</div>
            <div className='px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs font-medium'>
              {bet.sport}
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='text-sm text-gray-400'>{bet.source}</div>
            {(bet.ensemble_confidence ?? 0) >= 85 && (
              <div className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg border border-orange-400/20 animate-pulse'>
                🔥 HOT
              </div>
            )}
          </div>
        </div>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Stat Type</div>
            <div className='text-lg font-semibold text-white'>{bet.stat_type}</div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Line</div>
            <div className='text-lg font-semibold text-white'>{bet.line_score}</div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Recommendation</div>
            <div
              className={`text-lg font-bold ${
                bet.recommendation === 'OVER' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {bet.recommendation}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Expected Value</div>
            <div className='text-lg font-semibold text-cyan-400'>
              +{(bet.expected_value ?? 0).toFixed(2)}
            </div>
          </div>
        </div>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg'>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>ML Confidence</div>
            <div className={`text-lg font-bold ${_confidenceColor}`}>
              {bet.ensemble_confidence ?? 0}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Container size='lg' py='xl'>
      <Title order={1} mb='md'>
        Locked Bets
      </Title>
      <Card shadow='md' radius='md' mb='lg' withBorder>
        <Group grow>
          <Select
            label='Sport'
            value={selectedSport}
            onChange={value => setSelectedSport(value || 'ALL')}
            data={[
              { value: 'ALL', label: 'All' },
              ...uniqueSports.map((sport: string) => ({ value: sport, label: sport })),
            ]}
          />
          <Select
            label='Min Confidence'
            value={minConfidence.toString()}
            onChange={(val: string | null) => setMinConfidence(Number(val))}
            data={[50, 60, 70, 80, 85].map(val => ({ value: val.toString(), label: `${val}%+` }))}
          />
          <Text size='sm' color='dimmed'>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        </Group>
      </Card>
      <Group grow mb='lg'>
        <Card withBorder>
          <Group>
            <Target className='w-5 h-5' color='cyan' />
            <div>
              <Text size='sm' color='dimmed'>
                Total Bets
              </Text>
              <Text size='xl' fw={700}>
                {lockedBets.length}
              </Text>
            </div>
          </Group>
        </Card>
        <Card withBorder>
          <Group>
            <TrendingUp className='w-5 h-5' color='green' />
            <div>
              <Text size='sm' color='dimmed'>
                Avg Confidence
              </Text>
              <Text size='xl' fw={700}>
                {lockedBets.length > 0
                  ? (
                      lockedBets.reduce(
                        (sum: number, bet: LockedBet) => sum + (bet.ensemble_confidence ?? 0),
                        0
                      ) / lockedBets.length
                    ).toFixed(1)
                  : 0}
                %
              </Text>
            </div>
          </Group>
        </Card>
        <Card withBorder>
          <Group>
            <Zap className='w-5 h-5' color='purple' />
            <div>
              <Text size='sm' color='dimmed'>
                High Confidence
              </Text>
              <Text size='xl' fw={700}>
                {lockedBets.filter((bet: LockedBet) => (bet.ensemble_confidence ?? 0) >= 85).length}
              </Text>
            </div>
          </Group>
        </Card>
        <Card withBorder>
          <Group>
            <DollarSign className='w-5 h-5' color='yellow' />
            <div>
              <Text size='sm' color='dimmed'>
                Avg Expected Value
              </Text>
              <Text size='xl' fw={700}>
                +
                {lockedBets.length > 0
                  ? (
                      lockedBets.reduce(
                        (sum: number, bet: LockedBet) => sum + (bet.expected_value ?? 0),
                        0
                      ) / lockedBets.length
                    ).toFixed(2)
                  : 0}
              </Text>
            </div>
          </Group>
        </Card>
      </Group>
      {isLoading && (
        <Center py='xl'>
          <Loader size='xl' color='cyan' />
          <Text mt='md' size='xl' fw={600}>
            Loading Elite Bets
          </Text>
          <Text color='dimmed'>Analyzing ML predictions and market data...</Text>
        </Center>
      )}
      {!isLoading && lockedBets.length > 0 && (
        <Group grow>{lockedBets.map((bet: LockedBet) => getBetCard(bet))}</Group>
      )}
      {!isLoading && lockedBets.length === 0 && (
        <Center py='xl'>
          <Notification
            color='yellow'
            title='No locked bets found'
            withCloseButton={false}
            role='status'
          >
            Try adjusting your filters or check back later for new predictions
          </Notification>
          <Group mt='md'>
            <button
              aria-label='Refresh locked bets data'
              onClick={async () => {
                _logEvent('user_refresh_click', { time: new Date().toISOString() });
                setIsRefreshing(true);
                try {
                  await refetch();
                } catch (err) {
                  showNotification({
                    title: 'Refresh Failed',
                    message: 'Could not refresh locked bets. Please try again.',
                    color: 'red',
                  });
                } finally {
                  setIsRefreshing(false);
                }
              }}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #06b6d4, #2563eb)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(6,182,212,0.25)',
                border: 'none',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                opacity: isRefreshing ? 0.7 : 1,
              }}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </Group>
        </Center>
      )}
    </Container>
  );
};

export default LockedBetsPageWorking;
