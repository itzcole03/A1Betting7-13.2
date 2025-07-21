import React from 'react';

interface BadgeProps {
  text: string;
  color?: string;
}

const Badge: React.FC<BadgeProps> = ({ text, color = '#06ffa5' }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <span
    style={{
      background: color,
      color: '#fff',
      borderRadius: 8,
      padding: '4px 12px',
      fontWeight: 600,
      fontSize: 14,
      display: 'inline-block',
      margin: '0 4px',
    }}
  >
    {text}
  </span>
);

export default Badge;
