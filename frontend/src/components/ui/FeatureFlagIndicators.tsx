// @ts-expect-error TS(2307): Cannot find module '@/services/configService.js' o... Remove this comment to see the full error message
import { isFeatureEnabled } from '@/services/configService.js';
import React from 'react';

const features = ['INJURIES', 'NEWS', 'WEATHER', 'REALTIME', 'ESPN', 'ODDS', 'ANALYTICS'];

/**
 * Displays the enabled/disabled state of all major feature flags.
 * Uses isFeatureEnabled to dynamically query each flag.
 */
export const FeatureFlagIndicators: React.FC = () => {
  const [flags, setFlags] = React.useState<{ [key: string]: boolean }>({});

  React.useEffect(() => {
    const fetchFlags = async () => {
      const results: { [key: string]: boolean } = {};
      for (const feature of features) {
        results[feature] = await isFeatureEnabled(feature);
      }
      setFlags(results);
    };
    fetchFlags();
  }, []);

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
      {features.map(key => (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div key={key} className='p-4 border rounded-lg bg-white dark:bg-gray-900'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='font-semibold'>{key}</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className={flags[key] ? 'text-green-600' : 'text-red-600'}>
            {flags[key] ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      ))}
    </div>
  );
};
