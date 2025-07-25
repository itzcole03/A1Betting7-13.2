import { ChevronRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used for navigation

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

/**
 * Breadcrumb Component
 *
 * An accessible breadcrumb navigation component for the A1Betting platform.
 * Supports custom icons, separators, and integration with react-router-dom.
 *
 * @param items - An array of breadcrumb items (label, href, icon)
 * @param className - Additional CSS classes
 * @param separator - Custom separator element
 */
export const _Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  separator = <ChevronRight className='w-4 h-4 text-gray-500' />,
}) => {
  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <nav aria-label='Breadcrumb' className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <React.Fragment key={index}>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {item.icon && <span className='text-gray-400'>{item.icon}</span>}

            {item.href && index < items.length - 1 ? (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Link
                to={item.href}
                className='text-gray-400 hover:text-cyan-400 transition-colors'
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span
                className='font-medium text-white'
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>

          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          {index < items.length - 1 && <div aria-hidden='true'>{separator}</div>}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
