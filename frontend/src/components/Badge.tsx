import React from 'react';

interface BadgeProps {
  text: string;
  color?: string;
}

const Badge: React.FC<BadgeProps> = ({ text, color = '#06ffa5' }) => (
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
