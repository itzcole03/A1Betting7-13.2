import React, { useId, useState } from 'react';

export interface AccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  // Allow ReactNode title while avoiding conflict with the native 'title' attribute
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Accessible accordion primitive with keyboard and screen-reader support.
 */
export const Accordion: React.FC<AccordionProps> = ({
  title,
  defaultOpen = false,
  children,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const panelId = `${baseId}-panel`;

  return (
    <div
      className={`border border-slate-700/70 bg-slate-900/60 rounded-lg ${className}`.trim()}
      {...props}
    >
      <button
        type='button'
        id={triggerId}
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className='w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-base font-semibold text-slate-100 hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-t-lg'
      >
        <span>{title}</span>
        <span
          aria-hidden='true'
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`.trim()}
        >
          ▾
        </span>
      </button>
      <div
        id={panelId}
        role='region'
        aria-labelledby={triggerId}
        hidden={!isOpen}
        className='px-4 py-3 text-sm text-slate-200/90'
      >
        {children}
      </div>
    </div>
  );
};

export default Accordion;
