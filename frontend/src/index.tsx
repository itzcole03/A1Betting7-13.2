import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
// @ts-expect-error TS(6142): Module './App' was resolved to 'C:/Users/bcmad/Dow... Remove this comment to see the full error message
import App from './App';
import './index.css';

// Initialize Master Service Registry for comprehensive integration
import { masterServiceRegistry } from './services/MasterServiceRegistry';

// Performance monitoring
console.log('🚀 A1 Betting Platform - Master Integration Loading...');
const startTime = performance.now();

// Initialize all services
masterServiceRegistry
  .initialize()
  .then(() => {
    const loadTime = performance.now() - startTime;
    console.log(`✅ Master Service Registry initialized in ${loadTime.toFixed(2)}ms`);
    console.log(
      `📊 Services: ${masterServiceRegistry.getSystemStatistics().totalServices} total, ${
        masterServiceRegistry.getSystemStatistics().healthyServices
      } healthy`
    );
  })
  .catch(error => {
    console.error('❌ Failed to initialize Master Service Registry:', error);
  });

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <React.StrictMode>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Suspense fallback={<div className='loading-spinner' />}>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <App />
      </Suspense>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
