// @ts-expect-error TS(2307): Cannot find module '@/services/automation/BettingA... Remove this comment to see the full error message
import { BettingAutomationService } from '@/services/automation/BettingAutomationService';
// @ts-expect-error TS(2307): Cannot find module '@/config/automation.config' or... Remove this comment to see the full error message
import { defaultConfig } from '@/config/automation.config';
// @ts-expect-error TS(2307): Cannot find module '@/services/notification' or it... Remove this comment to see the full error message
import { notificationService } from '@/services/notification';

async function main() {
  try {
    // Set up process handlers;
    process.on('SIGINT', async () => {
      // console statement removed
      // @ts-expect-error TS(2304): Cannot find name 'automationService'.
      await automationService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      // console statement removed
      // @ts-expect-error TS(2304): Cannot find name 'automationService'.
      await automationService.stop();
      process.exit(0);
    });

    process.on('uncaughtException', async error => {
      // console statement removed
      notificationService.notify('error', 'Uncaught Exception', { error });
      // @ts-expect-error TS(2304): Cannot find name 'automationService'.
      await automationService.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      // console statement removed
      notificationService.notify('error', 'Unhandled Rejection', { reason });
      // @ts-expect-error TS(2304): Cannot find name 'automationService'.
      await automationService.stop();
      process.exit(1);
    });

    // Start the automation;
    // console statement removed
    // @ts-expect-error TS(2304): Cannot find name 'automationService'.
    await automationService.start();

    // Log startup success;
    // console statement removed
    notificationService.notify('success', 'Betting automation started successfully');
  } catch (error) {
    // console statement removed
    process.exit(1);
  }
}

// Run the automation;
main().catch(error => {
  // console statement removed
  process.exit(1);
});
