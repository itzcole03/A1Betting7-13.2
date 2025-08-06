import React, { useEffect, useState } from 'react';

const getCurrentVersion = () => {
  // Replace with actual version fetch logic (e.g., from package.json or IPC)
  return '1.0.0';
};

const getLastSeenVersion = () => {
  return localStorage.getItem('lastSeenVersion');
};

const setLastSeenVersion = (version: string) => {
  localStorage.setItem('lastSeenVersion', version);
};

const newFeatures = [
  'Improved onboarding experience',
  'Faster performance',
  'New analytics dashboard',
  'Bug fixes and stability improvements',
];

export const UpdateModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const currentVersion = getCurrentVersion();
  const [isPending, startTransition] = React.useTransition();
  const deferredFeatures = React.useDeferredValue(newFeatures);

  useEffect(() => {
    const lastSeen = getLastSeenVersion();
    if (lastSeen !== currentVersion) {
      setShowModal(true);
      setLastSeenVersion(currentVersion);
    }
  }, [currentVersion]);

  if (!showModal) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          maxWidth: 400,
          margin: '80px auto',
          background: '#fff',
          borderRadius: 8,
          padding: 32,
          boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
          color: '#333',
        }}
      >
        <h2 style={{ color: '#333', marginBottom: '16px' }}>What's New in v{currentVersion}?</h2>
        {isPending && <div style={{ color: 'blue', marginBottom: 8 }}>Loading...</div>}
        <ul style={{ color: '#333', paddingLeft: '20px' }}>
          {deferredFeatures.map(f => (
            <li key={f} style={{ marginBottom: '8px' }}>
              {f}
            </li>
          ))}
        </ul>
        <button
          onClick={() => startTransition(() => setShowModal(false))}
          style={{
            marginTop: 24,
            background: '#007bff',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          disabled={isPending}
        >
          Dismiss
        </button>
        <button
          onClick={() => window.open('/release-notes', '_blank')}
          style={{
            marginLeft: 8,
            background: '#6c757d',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
};
