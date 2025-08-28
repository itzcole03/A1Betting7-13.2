import React from 'react';

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
};

const HeadToHeadToggle: React.FC<Props> = ({ value, onChange, label = 'Head-to-head only' }) => {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
};

export default HeadToHeadToggle;
