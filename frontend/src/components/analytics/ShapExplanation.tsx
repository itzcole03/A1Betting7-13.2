import React from 'react';

// Define the type for feature importances
export interface ShapExplanationProps {
  shap: {
    featureImportances: { feature: string; value: number }[];
  };
  eventId: string;
}

const ShapExplanation: React.FC<ShapExplanationProps> = ({ shap, eventId }) => {
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  if (!shap) return <div key={241917}>No SHAP data available.</div>;
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div key={241917}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <h3 key={661229}>SHAP Feature Importances</h3>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ul key={249713}>
        {shap.featureImportances?.map(f => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <li key={f.feature}>
            {f.feature}: {f.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Usage example:
// <ShapExplanation shap={{ featureImportances: [{ feature: 'PTS', value: 0.42 }] }} eventId="evt123" />

export default ShapExplanation;
