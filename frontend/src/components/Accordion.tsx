import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

const _Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, marginBottom: 12 }}>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <button
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '12px 16px',
          fontWeight: 700,
          fontSize: 16,
          textAlign: 'left',
          cursor: 'pointer',
          outline: 'none',
        }}
        onClick={() => setOpen(o => !o)}
      >
        {title}
      </button>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      {open && <div style={{ padding: '12px 16px', background: '#fafafa' }}>{children}</div>}
    </div>
  );
};

export default Accordion;
