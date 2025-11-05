import React, { useEffect, useState } from 'react';

import { isFeatureEnabled } from '@/services/configService';

const FEATURE_KEYS = ['INJURIES', 'NEWS', 'WEATHER', 'REALTIME', 'ESPN', 'ODDS', 'ANALYTICS'];

export const FeatureFlagIndicators: React.FC = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FEATURE_KEYS.map(key => [key, false]))
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFlags = async () => {
      try {
        const entries = await Promise.all(
          FEATURE_KEYS.map(async key => [key, await isFeatureEnabled(key)] as const)
        );

        if (isMounted) {
          setFlags(Object.fromEntries(entries));
        }
      } catch (error) {
        console.error('Failed to load feature flags', error);
        if (isMounted) {
          setFlags(Object.fromEntries(FEATURE_KEYS.map(key => [key, false])));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadFlags();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className='grid grid-cols-2 gap-4 mb-8 md:grid-cols-4'>
      {FEATURE_KEYS.map(key => {
        const isEnabled = flags[key];
        return (
          <div key={key} className='rounded-lg border bg-white p-4 dark:bg-gray-900'>
            <div className='font-semibold'>{key}</div>
            <span className={isEnabled ? 'text-green-600' : 'text-red-600'}>
              {isLoading ? 'Loading...' : isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default FeatureFlagIndicators;
