import React from 'react';
import { createRoot } from 'react-dom/client';
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
      `📊 Services: ${masterServiceRegistry.getSystemStatistics().totalServices} total, ${masterServiceRegistry.getSystemStatistics().healthyServices} healthy`
    );
  })
  .catch(error => {
    console.error('❌ Failed to initialize Master Service Registry:', error);
  });

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
