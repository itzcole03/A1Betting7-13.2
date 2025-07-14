import { BettingAutomationService } from '@/services/automation/BettingAutomationService';
import { defaultConfig } from '@/config/automation.config';
import { notificationService } from '@/services/notification';

async function main() {
  try {
    // Set up process handlers;
    process.on('SIGINT', async () => {
      // console statement removed
      await automationService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      // console statement removed
      await automationService.stop();
      process.exit(0);
    });

    process.on('uncaughtException', async error => {
      // console statement removed
      notificationService.notify('error', 'Uncaught Exception', { error });
      await automationService.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      // console statement removed
      notificationService.notify('error', 'Unhandled Rejection', { reason });
      await automationService.stop();
      process.exit(1);
    });

    // Start the automation;
    // console statement removed
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
