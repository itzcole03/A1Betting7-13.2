/**
 * Lean Mode Banner Component
 * Displays a small fixed ribbon when lean mode is active (development only)
 */

import React from 'react';
import { isLeanMode } from '../utils/leanMode';

const LeanModeBanner: React.FC = () => {
  // Only show in development and when lean mode is active
  // Avoid direct `import.meta` usage to keep Jest/Babel parsing stable in test envs
  const isProd =
    (typeof (global as any).importMeta !== 'undefined' && (global as any).importMeta.env && (global as any).importMeta.env.PROD) ||
    process.env.NODE_ENV === 'production';

  if (isProd || !isLeanMode()) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        backgroundColor: '#ff6b35',
        color: 'white',
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        zIndex: 9999,
        borderBottomLeftRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        userSelect: 'none',
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}
      title="Lean Mode Active - Monitoring and heavy features are suppressed for cleaner development experience"
    >
      LEAN MODE ACTIVE – monitoring suppressed
    </div>
  );
};

export default LeanModeBanner;
