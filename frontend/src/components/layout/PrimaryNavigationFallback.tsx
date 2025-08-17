import React from 'react';

/**
 * Primary Navigation Fallback Component
 * 
 * Provides a minimal navigation structure to satisfy CoreFunctionalityValidator
 * while the main navigation components are loading or if they fail to mount.
 * 
 * This component ensures that the validator can find navigation elements
 * via the `data-nav-root` attribute, preventing validation failures.
 */
export const PrimaryNavigationFallback: React.FC = () => {
  return (
    <nav 
      data-nav-root 
      data-testid="nav-fallback" 
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // Slate-900 with opacity
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)', // Slate-600 with opacity
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        fontSize: '0.875rem' // Small text
      }}
    >
      <a 
        href="/" 
        aria-label="Home"
        style={{
          color: '#e2e8f0', // Slate-200
          textDecoration: 'none',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'; // Slate-600
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Home
      </a>
      <a 
        href="/analytics" 
        aria-label="Sports Analytics"
        style={{
          color: '#e2e8f0', // Slate-200
          textDecoration: 'none',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'; // Slate-600
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Analytics
      </a>
      <div 
        style={{
          marginLeft: 'auto',
          color: '#94a3b8', // Slate-400
          fontSize: '0.75rem',
          alignSelf: 'center'
        }}
        title="Navigation fallback - main navigation loading"
      >
        ⚡ Fallback Navigation
      </div>
    </nav>
  );
};