import React from 'react';

interface ArbitrageBadgeProps {
  profitPct?: number | null;
  books?: Array<{ name: string } | string> | null;
}

const ArbitrageBadge: React.FC<ArbitrageBadgeProps> = ({ profitPct, books }) => {
  if (!profitPct || profitPct <= 0) return null;

  const bookNames = (books || []).map((b) => typeof b === 'string' ? b : b?.name).filter(Boolean) as string[];
  const tooltip = `Arbitrage opportunity: +${profitPct.toFixed(2)}%\nBooks: ${bookNames.length > 0 ? bookNames.join(', ') : 'N/A'}`;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white"
      title={tooltip}
      data-testid="arb-badge"
    >
      🔁 Arb {profitPct.toFixed(2)}%
    </span>
  );
};

export default ArbitrageBadge;
