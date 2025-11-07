// Initialize Builder.io with your API key

// Register your A1Betting components with Builder.io
export const _builderConfig = {
  // Your app's base URL for Builder.io to load
  apiKey: 'YOUR_BUILDER_API_KEY',

  // Local development URL
  previewUrl: 'http://localhost:4000',

  // Production URL (when deployed)
  // previewUrl: 'https://your-domain.com',

  // Custom components that Builder.io can use
  customComponents: [
    {
      name: 'A1BettingPlatform',
      // @ts-expect-error TS(2307): Cannot find module '../components/QuantumSportsPla... Remove this comment to see the full error message
      component: () => import('../components/QuantumSportsPlatform'),
      inputs: [
        {
          name: 'theme',
          type: 'string',
          defaultValue: 'quantum-dark',
          enum: ['quantum-dark', 'neural-purple', 'cyber-blue', 'quantum-light'],
        },
      ],
    },
    {
      name: 'MoneyMakerPro',
      // @ts-expect-error TS(2307): Cannot find module '../components/user-friendly/Mo... Remove this comment to see the full error message
      component: () => import('../components/user-friendly/MoneyMakerPro'),
      inputs: [],
    },
    {
      name: 'PrizePicksPro',
      // @ts-expect-error TS(2307): Cannot find module '../components/user-friendly/Pr... Remove this comment to see the full error message
      component: () => import('../components/user-friendly/PrizePicksPro'),
      inputs: [],
    },
    {
      name: 'PrizePicksProUnified',
      // @ts-expect-error TS(2307): Cannot find module '../components/PrizePicksProUni... Remove this comment to see the full error message
      component: () => import('../components/PrizePicksProUnified'),
      inputs: [
        {
          name: 'variant',
          type: 'string',
          defaultValue: 'cyber',
          enum: ['default', 'cyber', 'pro', 'minimal'],
        },
        {
          name: 'maxSelections',
          type: 'number',
          defaultValue: 6,
        },
        {
          name: 'enableMLPredictions',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'enableShapExplanations',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'enableKellyOptimization',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'enableCorrelationAnalysis',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'autoRefresh',
          type: 'boolean',
          defaultValue: true,
        },
        {
          name: 'refreshInterval',
          type: 'number',
          defaultValue: 30000,
        },
      ],
    },
    {
      name: 'MLModelDashboard',
      // @ts-expect-error TS(2307): Cannot find module '../components/ml/MLModelDashbo... Remove this comment to see the full error message
      component: () => import('../components/ml/MLModelDashboard'),
      inputs: [],
    },
  ],
};

export default builderConfig;
