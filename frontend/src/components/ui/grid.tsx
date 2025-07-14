import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  rows?: 'auto' | 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'cyber' | 'masonry' | 'responsive';
  className?: string;
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  autoRows?: string;
  autoFlow?: 'row' | 'column' | 'dense' | 'row-dense' | 'column-dense';
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  animated?: boolean;
  staggerChildren?: number;
}

export interface GridItemProps {
  children: ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
  colEnd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
  rowStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  rowEnd?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  order?: number;
  className?: string;
  variant?: 'default' | 'cyber' | 'featured' | 'card';
  justifySelf?: 'auto' | 'start' | 'end' | 'center' | 'stretch';
  alignSelf?: 'auto' | 'start' | 'end' | 'center' | 'stretch';
  animated?: boolean;
  delay?: number;
  onClick?: () => void;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 12,
  gap = 'md',
  rows = 'auto',
  variant = 'default',
  className = '',
  responsive,
  autoRows,
  autoFlow = 'row',
  alignItems = 'stretch',
  justifyItems = 'stretch',
  animated = false,
  staggerChildren = 0.1,
}) => {
  const getColsClass = (colCount: number) => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    };
    return colsMap[colCount as keyof typeof colsMap] || 'grid-cols-12';
  };

  const getRowsClass = () => {
    if (rows === 'auto') return '';
    const rowsMap = {
      1: 'grid-rows-1',
      2: 'grid-rows-2',
      3: 'grid-rows-3',
      4: 'grid-rows-4',
      5: 'grid-rows-5',
      6: 'grid-rows-6',
    };
    return rowsMap[rows as keyof typeof rowsMap] || '';
  };

  const getGapClass = () => {
    const gapMap = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    };
    return gapMap[gap];
  };

  const getResponsiveClasses = () => {
    if (!responsive) return '';

    let classes = '';
    if (responsive.sm) classes += ` sm:${getColsClass(responsive.sm)}`;
    if (responsive.md) classes += ` md:${getColsClass(responsive.md)}`;
    if (responsive.lg) classes += ` lg:${getColsClass(responsive.lg)}`;
    if (responsive.xl) classes += ` xl:${getColsClass(responsive.xl)}`;

    return classes;
  };

  const getAutoFlowClass = () => {
    const flowMap = {
      row: 'grid-flow-row',
      column: 'grid-flow-col',
      dense: 'grid-flow-dense',
      'row-dense': 'grid-flow-row-dense',
      'column-dense': 'grid-flow-col-dense',
    };
    return flowMap[autoFlow];
  };

  const getAlignItemsClass = () => {
    const alignMap = {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      stretch: 'items-stretch',
    };
    return alignMap[alignItems];
  };

  const getJustifyItemsClass = () => {
    const justifyMap = {
      start: 'justify-items-start',
      end: 'justify-items-end',
      center: 'justify-items-center',
      stretch: 'justify-items-stretch',
    };
    return justifyMap[justifyItems];
  };

  const baseClasses = `
    grid
    ${getColsClass(cols)}
    ${getRowsClass()}
    ${getGapClass()}
    ${getResponsiveClasses()}
    ${getAutoFlowClass()}
    ${getAlignItemsClass()}
    ${getJustifyItemsClass()}
    ${variant === 'cyber' ? 'relative' : ''}
    ${className}
  `;

  const gridStyle: React.CSSProperties = {
    ...(autoRows && { gridAutoRows: autoRows }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerChildren,
      },
    },
  };

  if (animated) {
    return (
      <motion.div
        className={baseClasses}
        style={gridStyle}
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Cyber grid overlay */}
        {variant === 'cyber' && (
          <div className='absolute inset-0 opacity-10 pointer-events-none'>
            <div className='grid grid-cols-12 grid-rows-8 h-full w-full'>
              {Array.from({ length: 96 }).map((_, i) => (
                <div key={i} className='border border-cyan-400/20' />
              ))}
            </div>
          </div>
        )}

        <div className='relative z-10 contents'>{children}</div>
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} style={gridStyle}>
      {/* Cyber grid overlay */}
      {variant === 'cyber' && (
        <div className='absolute inset-0 opacity-10 pointer-events-none'>
          <div className='grid grid-cols-12 grid-rows-8 h-full w-full'>
            {Array.from({ length: 96 }).map((_, i) => (
              <div key={i} className='border border-cyan-400/20' />
            ))}
          </div>
        </div>
      )}

      <div className='relative z-10 contents'>{children}</div>
    </div>
  );
};

export const GridItem: React.FC<GridItemProps> = ({
  children,
  colSpan,
  rowSpan,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  order,
  className = '',
  variant = 'default',
  justifySelf = 'auto',
  alignSelf = 'auto',
  animated = false,
  delay = 0,
  onClick,
}) => {
  const getColSpanClass = () => {
    if (!colSpan) return '';
    if (colSpan === 'full') return 'col-span-full';

    const spanMap = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
    };
    return spanMap[colSpan as keyof typeof spanMap] || '';
  };

  const getRowSpanClass = () => {
    if (!rowSpan) return '';
    if (rowSpan === 'full') return 'row-span-full';

    const spanMap = {
      1: 'row-span-1',
      2: 'row-span-2',
      3: 'row-span-3',
      4: 'row-span-4',
      5: 'row-span-5',
      6: 'row-span-6',
    };
    return spanMap[rowSpan as keyof typeof spanMap] || '';
  };

  const getColStartClass = () => {
    if (!colStart) return '';
    const startMap = {
      1: 'col-start-1',
      2: 'col-start-2',
      3: 'col-start-3',
      4: 'col-start-4',
      5: 'col-start-5',
      6: 'col-start-6',
      7: 'col-start-7',
      8: 'col-start-8',
      9: 'col-start-9',
      10: 'col-start-10',
      11: 'col-start-11',
      12: 'col-start-12',
      13: 'col-start-13',
    };
    return startMap[colStart as keyof typeof startMap] || '';
  };

  const getColEndClass = () => {
    if (!colEnd) return '';
    const endMap = {
      1: 'col-end-1',
      2: 'col-end-2',
      3: 'col-end-3',
      4: 'col-end-4',
      5: 'col-end-5',
      6: 'col-end-6',
      7: 'col-end-7',
      8: 'col-end-8',
      9: 'col-end-9',
      10: 'col-end-10',
      11: 'col-end-11',
      12: 'col-end-12',
      13: 'col-end-13',
    };
    return endMap[colEnd as keyof typeof endMap] || '';
  };

  const getRowStartClass = () => {
    if (!rowStart) return '';
    const startMap = {
      1: 'row-start-1',
      2: 'row-start-2',
      3: 'row-start-3',
      4: 'row-start-4',
      5: 'row-start-5',
      6: 'row-start-6',
      7: 'row-start-7',
    };
    return startMap[rowStart as keyof typeof startMap] || '';
  };

  const getRowEndClass = () => {
    if (!rowEnd) return '';
    const endMap = {
      1: 'row-end-1',
      2: 'row-end-2',
      3: 'row-end-3',
      4: 'row-end-4',
      5: 'row-end-5',
      6: 'row-end-6',
      7: 'row-end-7',
    };
    return endMap[rowEnd as keyof typeof endMap] || '';
  };

  const getJustifySelfClass = () => {
    const justifyMap = {
      auto: '',
      start: 'justify-self-start',
      end: 'justify-self-end',
      center: 'justify-self-center',
      stretch: 'justify-self-stretch',
    };
    return justifyMap[justifySelf];
  };

  const getAlignSelfClass = () => {
    const alignMap = {
      auto: '',
      start: 'self-start',
      end: 'self-end',
      center: 'self-center',
      stretch: 'self-stretch',
    };
    return alignMap[alignSelf];
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'cyber':
        return 'relative bg-black/50 border border-cyan-400/30 rounded-lg p-4 hover:border-cyan-400/50 transition-all duration-200';
      case 'featured':
        return 'relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-lg';
      case 'card':
        return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200';
      default:
        return '';
    }
  };

  const baseClasses = `
    ${getColSpanClass()}
    ${getRowSpanClass()}
    ${getColStartClass()}
    ${getColEndClass()}
    ${getRowStartClass()}
    ${getRowEndClass()}
    ${getJustifySelfClass()}
    ${getAlignSelfClass()}
    ${getVariantClasses()}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  const itemStyle: React.CSSProperties = {
    ...(order && { order }),
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  if (animated) {
    return (
      <motion.div
        className={baseClasses}
        style={itemStyle}
        variants={itemVariants}
        whileHover={onClick ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        onClick={onClick}
      >
        {/* Cyber grid overlay for cyber variant */}
        {variant === 'cyber' && (
          <div className='absolute inset-0 opacity-10 pointer-events-none'>
            <div className='grid grid-cols-4 grid-rows-3 h-full w-full'>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className='border border-cyan-400/30' />
              ))}
            </div>
          </div>
        )}

        <div className='relative z-10'>{children}</div>
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} style={itemStyle} onClick={onClick}>
      {/* Cyber grid overlay for cyber variant */}
      {variant === 'cyber' && (
        <div className='absolute inset-0 opacity-10 pointer-events-none'>
          <div className='grid grid-cols-4 grid-rows-3 h-full w-full'>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className='border border-cyan-400/30' />
            ))}
          </div>
        </div>
      )}

      <div className='relative z-10'>{children}</div>
    </div>
  );
};
