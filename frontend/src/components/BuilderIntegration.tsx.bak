import React from 'react';
import { useLocation } from 'react-router-dom';
// @ts-expect-error TS(6142): Module '../contexts/CommandSummaryContext' was res... Remove this comment to see the full error message
import { CommandSummaryProvider, useCommandSummary } from '../contexts/CommandSummaryContext';

// Import your main app component
// @ts-expect-error TS(2306): File 'C:/Users/bcmad/Downloads/A1Betting7-13.2/fro... Remove this comment to see the full error message
import QuantumSportsPlatform from './QuantumSportsPlatform';

// Initialize Builder.io

interface BuilderIntegrationProps {
  model?: string;
  content?: Record<string, unknown> | string | null;
}

const _CommandSummarySidebar: React.FC = () => {
  const { commands, loading, error } = useCommandSummary();
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <aside
      style={{
        width: 320,
        background: '#18181b',
        color: '#fff',
        borderLeft: '1px solid #333',
        padding: 16,
        overflowY: 'auto',
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        zIndex: 100,
      }}
    >
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Live Command Summary</h2>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      {loading && <div>Loading commands...</div>}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      {error && <div style={{ color: 'red' }}>{error}</div>}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {commands.map(cmd => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <li key={cmd.id} style={{ marginBottom: 16 }}>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div style={{ fontWeight: 600 }}>{cmd.name}</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div style={{ fontSize: 14, color: '#aaa' }}>{cmd.description}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

const _BuilderIntegration: React.FC<BuilderIntegrationProps> = ({ model = 'page', content }) => {
  const _location = useLocation();

  // If Builder.io content exists, render it
  if (content) {
    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='builder-wrapper'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
        </div>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <CommandSummarySidebar />
      </div>
    );
  }

  // Otherwise, render the default A1Betting platform
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <QuantumSportsPlatform />;
};

export default function BuilderIntegrationWrapper(_props: Record<string, _unknown>) {
  return (
    <CommandSummaryProvider>
      <BuilderIntegration {...props} />
    </CommandSummaryProvider>
  );
}
