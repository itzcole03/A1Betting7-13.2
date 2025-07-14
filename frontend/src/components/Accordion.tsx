import React, { useState } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, marginBottom: 12 }}>
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
      {open && <div style={{ padding: '12px 16px', background: '#fafafa' }}>{children}</div>}
    </div>
  );
};

export default Accordion;
