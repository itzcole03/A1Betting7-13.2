import React, { useEffect, useState } from 'react';
import { discoverBackend } from '../../services/backendDiscovery';

const HealthBanner: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'healthy' | 'error' | 'stale' | 'unknown'>(
    'unknown'
  );
  const [dataSources, setDataSources] = useState<Record<
    string,
    {
      status: 'healthy' | 'degraded' | 'unhealthy';
      last_updated?: string;
      error_streak?: number;
      stale?: boolean;
    }
  > | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<{
    status: string;
    opportunities?: number;
    dataSource?: string;
    timestamp?: string;
    error?: string;
  }>({ status: 'idle' });
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);
  const [scraperHealth, setScraperHealth] = useState<any>(null);
  const [scraperHealthError, setScraperHealthError] = useState<string | null>(null);

  // Poll backend health endpoint
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const backendUrl = await discoverBackend();
        if (!backendUrl) throw new Error('No backend discovered');
        const res = await fetch(`${backendUrl}/api/v2/health`);
        if (res.ok) {
          setBackendStatus('healthy');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('error');
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll data source health endpoint
  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        const backendUrl = await discoverBackend();
        if (!backendUrl) throw new Error('No backend discovered');
        const res = await fetch(`${backendUrl}/api/health/data-sources`);
        if (res.ok) {
          const data = await res.json();
          setDataSources(data);
          setDataSourceError(null);
        } else {
          setDataSources(null);
          setDataSourceError('Could not fetch data source health.');
        }
      } catch (error) {
        setDataSources(null);
        setDataSourceError('Could not fetch data source health.');
      }
    };
    fetchDataSources();
    const interval = setInterval(fetchDataSources, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen for analysis events (optional: use a global event bus or context)
  useEffect(() => {
    // This is a placeholder. In a real app, you would subscribe to analysis events or context.
    // For now, just check localStorage for a lastAnalysis entry (set by analysis logic).
    const checkAnalysis = () => {
      const data = localStorage.getItem('lastAnalysis');
      if (data) setLastAnalysis(JSON.parse(data));
    };
    checkAnalysis();
    const interval = setInterval(checkAnalysis, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll PrizePicks scraper health from /status endpoint
  useEffect(() => {
    const fetchScraperHealth = async () => {
      try {
        const backendUrl = await discoverBackend();
        if (!backendUrl) throw new Error('No backend discovered');
        // /status is admin-protected; for demo, skip auth. In production, add auth headers.
        const res = await fetch(`${backendUrl}/status`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setScraperHealth(data.prizepicks_scraper_health);
          setScraperHealthError(null);
        } else {
          setScraperHealth(null);
          setScraperHealthError('Could not fetch PrizePicks scraper health.');
        }
      } catch (error) {
        setScraperHealth(null);
        setScraperHealthError('Could not fetch PrizePicks scraper health.');
      }
    };
    fetchScraperHealth();
    const interval = setInterval(fetchScraperHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <span className='mr-1'>🟢</span>;
      case 'degraded':
        return <span className='mr-1'>🟡</span>;
      case 'unhealthy':
        return <span className='mr-1'>🔴</span>;
      default:
        return <span className='mr-1'>❔</span>;
    }
  };

  return (
    <div className='w-full z-50'>
      {/* Backend status */}
      {backendStatus === 'healthy' ? (
        <div className='bg-emerald-900 text-emerald-200 py-1 px-4 text-sm flex items-center flex-wrap'>
          <span className='mr-2'>🟢 Backend Healthy</span>
          {lastAnalysis.status === 'completed' && (
            <span>
              | Last Analysis: {lastAnalysis.opportunities ?? 0} opportunities
              {lastAnalysis.dataSource ? ` (${lastAnalysis.dataSource})` : ''}
              {lastAnalysis.timestamp
                ? ` at ${new Date(lastAnalysis.timestamp).toLocaleTimeString()}`
                : ''}
            </span>
          )}
        </div>
      ) : backendStatus === 'error' ? (
        <div className='bg-red-900 text-red-200 py-1 px-4 text-sm flex items-center'>
          <span className='mr-2'>🔴 Backend Error</span>
          <span>Check your backend server or network connection.</span>
        </div>
      ) : backendStatus === 'stale' ? (
        <div className='bg-yellow-900 text-yellow-200 py-1 px-4 text-sm flex items-center'>
          <span className='mr-2'>🟡 Backend Stale</span>
          <span>Data may be outdated.</span>
        </div>
      ) : null}
      {/* Data source diagnostics */}
      {dataSourceError && (
        <div className='bg-red-900 text-red-200 py-1 px-4 text-sm flex items-center'>
          <span className='mr-2'>❌ Data Source Health Error:</span>
          <span>{dataSourceError}</span>
        </div>
      )}
      {dataSources && (
        <div className='bg-gray-900 text-gray-200 py-1 px-4 text-xs flex flex-wrap items-center gap-4'>
          {Object.entries(dataSources).map(([source, info]) => (
            <div key={source} className='flex items-center mr-4'>
              {getStatusIcon(info.status)}
              <span className='font-semibold mr-1'>
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </span>
              <span
                className={
                  info.status === 'healthy'
                    ? 'text-emerald-400'
                    : info.status === 'degraded'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }
                data-testid={`service-status-${info.status}`}
              >
                {info.status.charAt(0).toUpperCase() + info.status.slice(1)}
              </span>
              {info.stale && <span className='ml-2 text-yellow-300'>(Stale)</span>}
              {info.last_updated && (
                <span className='ml-2 text-gray-400'>
                  Last updated: {new Date(info.last_updated).toLocaleTimeString()}
                </span>
              )}
              {typeof info.error_streak === 'number' && info.error_streak > 0 && (
                <span className='ml-2 text-red-300'>Errors: {info.error_streak}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Analysis error */}
      {lastAnalysis.status === 'error' && (
        <div className='bg-red-900 text-red-200 py-1 px-4 text-sm flex items-center'>
          <span className='mr-2'>❌ Analysis Error:</span>
          <span>{lastAnalysis.error}</span>
        </div>
      )}
      {/* PrizePicks Scraper Health Banner */}
      {scraperHealthError && (
        <div className='bg-red-900 text-red-200 py-1 px-4 text-sm flex items-center'>
          <span className='mr-2'>❌ PrizePicks Scraper Health Error:</span>
          <span>{scraperHealthError}</span>
        </div>
      )}
      {scraperHealth && (
        <div
          className={
            scraperHealth.is_healthy
              ? 'bg-emerald-900 text-emerald-200'
              : scraperHealth.is_stale
              ? 'bg-yellow-900 text-yellow-200'
              : 'bg-red-900 text-red-200'
          }
          style={{
            padding: '0.25rem 1rem',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <span className='mr-2'>
            {scraperHealth.is_healthy
              ? '🟢 PrizePicks Scraper Healthy'
              : scraperHealth.is_stale
              ? '🟡 PrizePicks Scraper Stale'
              : '🔴 PrizePicks Scraper Error'}
          </span>
          {scraperHealth.last_success && (
            <span className='ml-2 text-gray-300'>
              Last success: {new Date(scraperHealth.last_success).toLocaleTimeString()}
            </span>
          )}
          {typeof scraperHealth.error_streak === 'number' && scraperHealth.error_streak > 0 && (
            <span className='ml-2 text-red-300'>Error streak: {scraperHealth.error_streak}</span>
          )}
          {scraperHealth.is_stale && <span className='ml-2 text-yellow-300'>Data is stale</span>}
          {typeof scraperHealth.last_prop_count === 'number' && (
            <span className='ml-2 text-cyan-200'>Props: {scraperHealth.last_prop_count}</span>
          )}
          {typeof scraperHealth.healing_attempts === 'number' &&
            scraperHealth.healing_attempts > 0 && (
              <span className='ml-2 text-purple-300'>
                Healing attempts: {scraperHealth.healing_attempts}
              </span>
            )}
        </div>
      )}
    </div>
  );
};

export default HealthBanner;
