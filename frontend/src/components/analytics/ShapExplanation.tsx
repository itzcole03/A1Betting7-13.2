import React from 'react';

// Define the type for feature importances
export interface ShapExplanationProps {
  shap: {
    featureImportances: { feature: string; value: number }[];
  };
  eventId: string;
}

const ShapExplanation: React.FC<ShapExplanationProps> = ({ shap, eventId }) => {
  if (!shap) return <div key={241917}>No SHAP data available.</div>;
  return (
    <div key={241917}>
      <h3 key={661229}>SHAP Feature Importances</h3>
      <ul key={249713}>
        {shap.featureImportances?.map(f => (
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
