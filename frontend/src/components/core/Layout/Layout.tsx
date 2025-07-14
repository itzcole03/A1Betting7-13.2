import React from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  title,
  subtitle,
  children,
  headerActions,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`min-h-full ${className}`}
    >
      {/* Page Header */}
      {(title || subtitle || headerActions) && (
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              {title && (
                <h1 className='text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent'>
                  {title}
                </h1>
              )}
              {subtitle && <p className='text-gray-400 mt-2'>{subtitle}</p>}
            </div>
            {headerActions && <div className='flex items-center space-x-4'>{headerActions}</div>}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className='space-y-8'>{children}</div>
    </motion.div>
  );
};

export default Layout;
