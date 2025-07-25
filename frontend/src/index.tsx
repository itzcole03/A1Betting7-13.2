import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize Master Service Registry for comprehensive integration
import { _masterServiceRegistry } from './services/MasterServiceRegistry';

// Performance monitoring
console.log('🚀 A1 Betting Platform - Master Integration Loading...');
const _startTime = performance.now();

// Initialize all services

_masterServiceRegistry
  .initialize()
  .then(() => {
    const _loadTime = performance.now() - _startTime;
    console.log(`✅ Master Service Registry initialized in ${_loadTime.toFixed(2)}ms`);
    console.log(
      `📊 Services: ${_masterServiceRegistry.getSystemStatistics().totalServices} total, ${
        _masterServiceRegistry.getSystemStatistics().healthyServices
      } healthy`
    );
  })
  .catch(error => {
    console.error('❌ Failed to initialize Master Service Registry:', error);
  });

const _rootElement = document.getElementById('root');
if (_rootElement) {
  const _root = createRoot(_rootElement);
  _root.render(
    <React.StrictMode>
      <Suspense fallback={<div className='loading-spinner' />}>
        <App />
      </Suspense>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
