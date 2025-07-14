import { BuilderComponent, builder } from '@builder.io/react';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { CommandSummaryProvider, useCommandSummary } from '../contexts/CommandSummaryContext';

// Import your main app component
import QuantumSportsPlatform from './QuantumSportsPlatform';

// Initialize Builder.io
builder.init('YOUR_BUILDER_API_KEY'); // Replace with your actual API key

interface BuilderIntegrationProps {
  model?: string;
  content?: any;
}

const CommandSummarySidebar: React.FC = () => {
  const { commands, loading, error } = useCommandSummary();
  return (
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
      <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Live Command Summary</h2>
      {loading && <div>Loading commands...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {commands.map(cmd => (
          <li key={cmd.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{cmd.name}</div>
            <div style={{ fontSize: 14, color: '#aaa' }}>{cmd.description}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

const BuilderIntegration: React.FC<BuilderIntegrationProps> = ({ model = 'page', content }) => {
  const location = useLocation();

  // If Builder.io content exists, render it
  if (content) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white'>
        <div className='builder-wrapper'>
          <BuilderComponent model={model} content={content} />
        </div>
        <CommandSummarySidebar />
      </div>
    );
  }

  // Otherwise, render the default A1Betting platform
  return <QuantumSportsPlatform />;
};

export default (props: any) => (
  <CommandSummaryProvider>
    <BuilderIntegration {...props} />
  </CommandSummaryProvider>
);
