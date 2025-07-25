import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '@/lib/utils' or its correspond... Remove this comment to see the full error message
import { cn } from '@/lib/utils';

// Types for empty state
interface EmptyStateAction {
  label: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  illustration?: string | React.ReactNode;
  variant?: 'default' | 'cyber' | 'minimal' | 'card' | 'centered';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  actions?: EmptyStateAction[];
  showBackground?: boolean;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const _getEmptyStateIcon = (context?: string) => {
  const _icons = {
    search: '🔍',
    data: '📊',
    file: '📄',
    folder: '📁',
    image: '🖼️',
    notification: '🔔',
    message: '💬',
    user: '👤',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
    betting: '🎯',
    money: '💰',
    chart: '📈',
    settings: '⚙️',
    default: '📭',
  };
  return icons[context as keyof typeof icons] || icons.default;
};

const _getSizeClasses = (size: string) => {
  const _sizes = {
    sm: {
      container: 'py-8 px-4',
      icon: 'text-4xl mb-3',
      title: 'text-lg',
      description: 'text-sm',
      actions: 'text-sm',
    },
    md: {
      container: 'py-12 px-6',
      icon: 'text-6xl mb-4',
      title: 'text-xl',
      description: 'text-base',
      actions: 'text-base',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'text-8xl mb-6',
      title: 'text-2xl',
      description: 'text-lg',
      actions: 'text-lg',
    },
    xl: {
      container: 'py-20 px-10',
      icon: 'text-9xl mb-8',
      title: 'text-3xl',
      description: 'text-xl',
      actions: 'text-xl',
    },
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

export const _EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  illustration,
  variant = 'default',
  size = 'md',
  actions = [],
  showBackground = true,
  animated = true,
  className,
  children,
}) => {
  const _sizeClasses = getSizeClasses(size);

  const _variantClasses = {
    default: 'bg-gray-50 border border-gray-200 rounded-lg',
    cyber: 'bg-slate-900/50 border border-cyan-500/30 rounded-lg backdrop-blur-md',
    minimal: 'bg-transparent',
    card: 'bg-white border border-gray-300 rounded-xl shadow-lg',
    centered: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  };

  const _textClasses = {
    default: {
      title: 'text-gray-900',
      description: 'text-gray-600',
    },
    cyber: {
      title: 'text-cyan-300',
      description: 'text-cyan-400/70',
    },
    minimal: {
      title: 'text-gray-900',
      description: 'text-gray-600',
    },
    card: {
      title: 'text-gray-900',
      description: 'text-gray-600',
    },
    centered: {
      title: 'text-gray-900',
      description: 'text-gray-600',
    },
  };

  const _currentTextClasses = textClasses[variant] || textClasses.default;

  const _renderIcon = () => {
    if (illustration) {
      return (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn('mb-6', animated && 'animate-fade-in')}>
          {typeof illustration === 'string' ? (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <img
              src={illustration}
              alt='Empty state illustration'
              className='mx-auto max-w-full h-auto'
              style={{ maxHeight: '200px' }}
            />
          ) : (
            illustration
          )}
        </div>
      );
    }

    if (icon) {
      return (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className={cn(sizeClasses.icon, 'opacity-60', animated && 'animate-bounce')}>
          {typeof icon === 'string' ? icon : icon}
        </div>
      );
    }

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className={cn(sizeClasses.icon, 'opacity-40', animated && 'animate-pulse')}>
        {getEmptyStateIcon('default')}
      </div>
    );
  };

  const _renderActions = () => {
    if (actions.length === 0) return null;

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className={cn('flex flex-wrap gap-2 justify-center mt-6', sizeClasses.actions)}>
        {actions.map((action, index) => (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className={cn(
              'inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',

              // Variant styles
              action.variant === 'primary' &&
                (variant === 'cyber'
                  ? 'bg-cyan-500 text-black hover:bg-cyan-400 focus:ring-cyan-500'
                  : 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500'),

              action.variant === 'secondary' &&
                (variant === 'cyber'
                  ? 'bg-slate-700 text-cyan-300 hover:bg-slate-600 border border-cyan-500/30'
                  : 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-500'),

              action.variant === 'outline' &&
                (variant === 'cyber'
                  ? 'border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'),

              action.variant === 'ghost' &&
                (variant === 'cyber'
                  ? 'text-cyan-400 hover:bg-cyan-500/10'
                  : 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'),

              // Disabled state
              (action.disabled || action.loading) && 'opacity-50 cursor-not-allowed',

              // Hover effects
              !action.disabled && !action.loading && 'hover:transform hover:scale-105'
            )}
          >
            {action.loading && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2' />
            )}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {action.icon && !action.loading && <span className='mr-2'>{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center relative',
        showBackground && variantClasses[variant],
        sizeClasses.container,
        animated && 'animate-fade-in',
        className
      )}
    >
      {/* Background Pattern for Cyber Variant */}
      {variant === 'cyber' && showBackground && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-lg' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute inset-0 bg-grid-white/[0.02] rounded-lg' />
        </>
      )}

      {/* Content */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='relative z-10'>
        {/* Icon/Illustration */}
        {renderIcon()}

        {/* Title */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <h3 className={cn('font-semibold mb-2', sizeClasses.title, currentTextClasses.title)}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p
            className={cn(
              'max-w-md mx-auto leading-relaxed',
              sizeClasses.description,
              currentTextClasses.description
            )}
          >
            {description}
          </p>
        )}

        {/* Custom Children */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        {children && <div className='mt-4'>{children}</div>}

        {/* Actions */}
        {renderActions()}
      </div>

      {/* Decorative Elements for Cyber Variant */}
      {variant === 'cyber' && animated && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute bottom-4 left-4 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-40' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute top-1/3 left-4 w-1 h-8 bg-gradient-to-b from-cyan-500/30 to-transparent' />
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='absolute bottom-1/3 right-4 w-1 h-6 bg-gradient-to-t from-cyan-500/20 to-transparent' />
        </>
      )}
    </div>
  );
};

// Pre-built empty state components for common scenarios
export const _NoDataEmptyState: React.FC<
  Omit<EmptyStateProps, 'title' | 'description' | 'icon'> & { dataType?: string }
> = ({ dataType = 'data', ...props }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <EmptyState
    title={`No ${dataType} available`}
    description={`There's no ${dataType} to display right now. Try adjusting your filters or check back later.`}
    icon={getEmptyStateIcon('data')}
    {...props}
  />
);

export const _NoSearchResultsEmptyState: React.FC<
  Omit<EmptyStateProps, 'title' | 'description' | 'icon'> & { query?: string }
> = ({ query, ...props }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <EmptyState
    title='No results found'
    description={
      query
        ? `No results found for "${query}". Try different keywords or clear your search.`
        : 'No results found. Try different search terms.'
    }
    icon={getEmptyStateIcon('search')}
    {...props}
  />
);

export const _ErrorEmptyState: React.FC<
  Omit<EmptyStateProps, 'title' | 'description' | 'icon'> & { error?: string }
> = ({ error, ...props }) => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <EmptyState
    title='Something went wrong'
    description={error || 'We encountered an error while loading this content. Please try again.'}
    icon={getEmptyStateIcon('error')}
    {...props}
  />
);

export const _LoadingEmptyState: React.FC<
  Omit<EmptyStateProps, 'title' | 'description' | 'icon'>
> = props => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <EmptyState
    title='Loading...'
    description='Please wait while we load your content.'
    icon={
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='animate-spin w-12 h-12 border-4 border-current border-t-transparent rounded-full' />
    }
    animated={false}
    {...props}
  />
);

export const _NoNotificationsEmptyState: React.FC<
  Omit<EmptyStateProps, 'title' | 'description' | 'icon'>
> = props => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <EmptyState
    title='No notifications'
    description="You're all caught up! No new notifications to show."
    icon={getEmptyStateIcon('notification')}
    {...props}
  />
);

export const _NoBetsEmptyState: React.FC<
  Omit<EmptyStateProps, 'title' | 'description' | 'icon'>
> = props => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <EmptyState
    title='No bets yet'
    description="You haven't placed any bets yet. Start exploring opportunities and place your first bet!"
    icon={getEmptyStateIcon('betting')}
    actions={[
      {
        label: 'Explore Opportunities',
        variant: 'primary',
        icon: '🎯',
        onClick: () => console.log('Navigate to opportunities'),
      },
    ]}
    {...props}
  />
);

export const _NoHistoryEmptyState: React.FC<
  Omit<EmptyStateProps, 'title' | 'description' | 'icon'>
> = props => (
  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <EmptyState
    title='No history available'
    description='Your activity history will appear here once you start using the platform.'
    icon={getEmptyStateIcon('chart')}
    {...props}
  />
);
