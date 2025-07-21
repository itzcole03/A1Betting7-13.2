import React from 'react';

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

const typeColors: Record<string, string> = {
  success: '#06ffa5',
  warning: '#fbbf24',
  error: '#ff4757',
  info: '#3498db',
};

const Alert: React.FC<AlertProps> = ({ type = 'info', message }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <div
    style={{
      background: typeColors[type],
      color: '#fff',
      borderRadius: 8,
      padding: '12px 20px',
      fontWeight: 600,
      fontSize: 15,
      margin: '12px 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    {message}
  </div>
);

export default Alert;
