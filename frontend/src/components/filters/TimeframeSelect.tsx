import React from 'react';

type Props = {
  value?: number | undefined;
  onChange: (v?: number) => void;
  options?: Array<number | 'all'>;
};

const TimeframeSelect: React.FC<Props> = ({ value, onChange, options = [5, 10, 20, 'all'] }) => {
  return (
    <label>
      Last N games:
      <select
        value={String(value ?? 'all')}
        onChange={(e) => onChange(e.target.value === 'all' ? undefined : Number(e.target.value))}
        className="ml-2"
      >
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {opt === 'all' ? 'All' : String(opt)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default TimeframeSelect;
