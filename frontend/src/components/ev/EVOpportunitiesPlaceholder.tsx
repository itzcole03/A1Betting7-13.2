// Phase 1 Positive EV Engine Placeholder
// Intentionally minimal: real UI deferred to later phase.
// Serves as an integration anchor so routes/components naming is stable.

import React from 'react';

export const EVOpportunitiesPlaceholder: React.FC = () => {
  return (
    <div className="p-4 text-sm text-neutral-500">
      <strong>Positive EV</strong> module initialized (Phase 1 backend only). UI coming soon.
    </div>
  );
};

export default EVOpportunitiesPlaceholder;
