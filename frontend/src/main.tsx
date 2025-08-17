/// <reference types="node" />
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Change to import the correct App component
import { bootstrapApp } from './bootstrap/bootstrapApp';
import { logger } from './utils/logger';
import './utils/tracing';
import './utils/consoleErrorSuppression'; // Initialize console error filtering

// Import Builder.io registry to register components
import '../builder-registry';

// import styles exactly like the prototype
import './index.css';
import './styles/enhanced-animations.css';
import './styles/force-prototype.css';
import './styles/global-cyber-theme.css';
import './styles/prototype-override.css';
import './styles/quantum-styles.css';

// Development-only WebSocket URL verification
if (import.meta.env.DEV) {
  import('./websocket/devVerify');
}

/**
 * Main application entry point with idempotent bootstrap
 */
async function start() {
  try {
    // Initialize application with idempotent bootstrap
    const bootstrapResult = await bootstrapApp();
    
    if (bootstrapResult.alreadyBootstrapped) {
      logger.debug('Application already bootstrapped, proceeding to render', bootstrapResult, 'Main');
    }

    // Find root element and render React app
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error('Failed to find the root element');

    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
  } catch (error) {
    logger.error(
      'Application startup failed',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Main'
    );
    
    // Show fallback error UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #1a1a1a;
          color: #fff;
          font-family: system-ui;
          flex-direction: column;
        ">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Startup Failed</h1>
          <p style="margin-bottom: 2rem; opacity: 0.8;">Please refresh the page or contact support.</p>
          <button 
            onclick="window.location.reload()" 
            style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            "
          >
            Retry
          </button>
        </div>
      `;
    }
    
    throw error;
  }
}

// Start the application
start();
