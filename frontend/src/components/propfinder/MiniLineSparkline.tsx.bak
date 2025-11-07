import React, { useMemo } from 'react';

interface MiniLineSparklineProps {
  history?: number[] | null; // simple array of line values ordered by time
  className?: string;
}

const MiniLineSparkline: React.FC<MiniLineSparklineProps> = ({ history, className = '' }) => {
  const points = useMemo(() => {
    const lines = Array.isArray(history) ? history : [];
    if (lines.length < 2) return null;
    const min = Math.min(...lines);
    const max = Math.max(...lines);
    const range = max - min || 1;
    const coords = lines.map((v, i) => {
      const x = (i / (lines.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    return { coords, trendUp: lines[lines.length - 1] >= lines[0] };
  }, [history]);

  if (!points) {
    return <span className="text-xs text-gray-500" title="No movement">No movement</span>;
  }

  return (
    <svg className={`w-24 h-6 ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points.coords}
        fill="none"
        stroke={points.trendUp ? '#10b981' : '#ef4444'}
        strokeWidth="2"
      />
    </svg>
  );
};

export default MiniLineSparkline;
