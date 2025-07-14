/**
 * DEPRECATED: This component has been consolidated into A1BettingPlatform.tsx
 *
 * All user-friendly features have been integrated into the main platform:
 * - Enhanced user interface with enterprise features
 * - Real-time data integration with live APIs
 * - Advanced performance metrics and analytics
 *
 * This file is kept for compatibility but all functionality
 * is now available in the enhanced A1BettingPlatform component.
 */

import { A1BettingPreview } from './components/A1BettingPreview';
import { AppProvider } from './contexts/AppContext';

export default function App_UserFriendly() {
  return (
    <AppProvider>
      <A1BettingPreview />
      {/* ... existing app content ... */}
    </AppProvider>
  );
}
