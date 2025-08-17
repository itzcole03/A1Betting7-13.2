/**
 * Minimal Shell - Simple component for isolating runtime errors
 * 
 * Renders only essential providers and a basic div to determine if the
 * "Cannot convert undefined or null to object" error persists without
 * complex dashboard components.
 * 
 * Usage: Temporarily replace main app render with this component to isolate
 * whether the error comes from providers or from complex child components.
 * 
 * @module debug/MinimalShell
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundaryVersion } from '../components/ErrorBoundaryVersion';
import { _AppProvider } from '../contexts/AppContext';
import { _ThemeProvider } from '../contexts/ThemeContext';
import { _WebSocketProvider } from '../contexts/WebSocketContext';
import { _AuthProvider } from '../contexts/AuthContext';

const queryClient = new QueryClient();

/**
 * Minimal shell component with only providers and basic content
 */
export const MinimalShell: React.FC = () => {
  return (
    <ErrorBoundaryVersion>
      <QueryClientProvider client={queryClient}>
        <_AppProvider>
          <_ThemeProvider>
            <_WebSocketProvider>
              <_AuthProvider>
                <BrowserRouter>
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    backgroundColor: '#1a1a1a',
                    color: 'white',
                    minHeight: '100vh'
                  }}>
                    <h1>Minimal Shell</h1>
                    <p>This is a minimal test shell with only providers.</p>
                    <p>If you see this without errors, the issue is in complex components.</p>
                    <p>Timestamp: {new Date().toISOString()}</p>
                    
                    {/* Test basic object operations */}
                    <div style={{ marginTop: '20px' }}>
                      <h3>Basic Object Operations Test:</h3>
                      <pre style={{ textAlign: 'left', backgroundColor: '#333', padding: '10px' }}>
                        {JSON.stringify({
                          keys: Object.keys({ test: 'value' }),
                          entries: Object.entries({ test: 'value' }),
                          values: Object.values({ test: 'value' })
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </BrowserRouter>
              </_AuthProvider>
            </_WebSocketProvider>
          </_ThemeProvider>
        </_AppProvider>
      </QueryClientProvider>
    </ErrorBoundaryVersion>
  );
};

export default MinimalShell;