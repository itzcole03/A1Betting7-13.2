import React, { useEffect, useState } from 'react';
import { useElectron, useMenuActions } from '../../hooks/useElectron';
import { toast } from 'react-hot-toast';

interface ElectronIntegrationProps {
  onNewAnalysis?: () => void;
  onExportData?: () => void;
  onSettings?: () => void;
  onStartAnalysis?: () => void;
  onRefreshPredictions?: () => void;
  onPortfolioOptimizer?: () => void;
  onSmartStacking?: () => void;
  onFeedback?: () => void;
}

const ElectronIntegration: React.FC<ElectronIntegrationProps> = ({
  onNewAnalysis,
  onExportData,
  onSettings,
  onStartAnalysis,
  onRefreshPredictions,
  onPortfolioOptimizer,
  onSmartStacking,
  onFeedback,
}) => {
  const { isElectron, appVersion, platform, showNotification, requestNotificationPermission } =
    useElectron();
  const { registerMenuHandlers } = useMenuActions();
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  useEffect(() => {
    if (!isElectron) return;

    // Register menu handlers
    const cleanup = registerMenuHandlers({
      onNewAnalysis: () => {
        toast.success('Starting new analysis...');
        onNewAnalysis?.();
      },

      onExportData: (filePath: string) => {
        toast.success(`Exporting data to ${filePath}...`);
        onExportData?.();
      },

      onSettings: () => {
        // @ts-expect-error TS(2339): Property 'info' does not exist on type '{ (message... Remove this comment to see the full error message
        toast.info('Opening settings...');
        onSettings?.();
      },

      onStartAnalysis: () => {
        toast.success('Starting real-time analysis...');
        onStartAnalysis?.();
      },

      onRefreshPredictions: () => {
        // @ts-expect-error TS(2339): Property 'info' does not exist on type '{ (message... Remove this comment to see the full error message
        toast.info('Refreshing predictions...');
        onRefreshPredictions?.();
      },

      onPortfolioOptimizer: () => {
        // @ts-expect-error TS(2339): Property 'info' does not exist on type '{ (message... Remove this comment to see the full error message
        toast.info('Opening portfolio optimizer...');
        onPortfolioOptimizer?.();
      },

      onSmartStacking: () => {
        // @ts-expect-error TS(2339): Property 'info' does not exist on type '{ (message... Remove this comment to see the full error message
        toast.info('Opening smart stacking panel...');
        onSmartStacking?.();
      },

      onFeedback: () => {
        // @ts-expect-error TS(2339): Property 'info' does not exist on type '{ (message... Remove this comment to see the full error message
        toast.info('Opening feedback dialog...');
        onFeedback?.();
      },
    });

    // Request notification permission
    requestNotificationPermission().then(permission => {
      setHasNotificationPermission(permission === 'granted');
    });

    // Show welcome notification
    if (hasNotificationPermission) {
      showNotification('A1Betting Ready', {
        body: 'Real-time sports intelligence platform is ready to use!',
        icon: './icon.png',
      });
    }

    return cleanup;
  }, [isElectron, registerMenuHandlers, hasNotificationPermission]);

  // Enhanced notification system for betting opportunities
  const showBettingOpportunityNotification = (opportunity: any) => {
    if (!isElectron || !hasNotificationPermission) return;

    showNotification('High-Value Betting Opportunity', {
      body: `${opportunity.player} - ${opportunity.stat_type}: ${opportunity.confidence}% confidence`,
      icon: './icon.png',
      tag: 'betting-opportunity',
      requireInteraction: true,
    });
  };

  // Desktop integration status indicator
  if (!isElectron) {
    return null; // Web version doesn't need this component
  }

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='fixed top-4 right-4 z-50'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-300'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center gap-2'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span>Desktop v{appVersion}</span>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-gray-500'>|</span>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <span className='text-gray-400'>{platform}</span>
        </div>
      </div>
    </div>
  );
};

// Hook for components to trigger desktop notifications
export const useDesktopNotifications = () => {
  const { isElectron, showNotification } = useElectron();

  const notifyBettingOpportunity = (opportunity: {
    player: string;
    stat_type: string;
    confidence: number;
    expected_value: number;
  }) => {
    if (!isElectron) return;

    showNotification('🎯 High-Value Opportunity', {
      body: `${opportunity.player} - ${opportunity.stat_type}\nConfidence: ${opportunity.confidence}%\nEV: +${opportunity.expected_value.toFixed(2)}`,
      icon: './icon.png',
      tag: 'betting-opportunity',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  };

  const notifyAnalysisComplete = (results: { opportunities: number; lineups: number }) => {
    if (!isElectron) return;

    showNotification('🧠 Analysis Complete', {
      body: `Found ${results.opportunities} opportunities and ${results.lineups} optimal lineups`,
      icon: './icon.png',
      tag: 'analysis-complete',
    });
  };

  const notifyError = (error: string) => {
    if (!isElectron) return;

    showNotification('⚠️ A1Betting Error', {
      body: error,
      icon: './icon.png',
      tag: 'error',
    });
  };

  return {
    notifyBettingOpportunity,
    notifyAnalysisComplete,
    notifyError,
    isElectron,
  };
};

export default ElectronIntegration;
