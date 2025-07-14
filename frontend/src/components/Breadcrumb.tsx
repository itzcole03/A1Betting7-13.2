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
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
  separator = <ChevronRight className='w-4 h-4 text-gray-500' />,
}) => {
  return (
    <nav aria-label='Breadcrumb' className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <div className='flex items-center space-x-2'>
            {item.icon && <span className='text-gray-400'>{item.icon}</span>}

            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className='text-gray-400 hover:text-cyan-400 transition-colors'
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className='font-medium text-white'
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>

          {index < items.length - 1 && <div aria-hidden='true'>{separator}</div>}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
