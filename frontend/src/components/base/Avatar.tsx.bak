import React, { useMemo, useState } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'none' | 'online' | 'offline' | 'busy';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  fallback?: React.ReactNode;
  size?: AvatarSize;
  status?: AvatarStatus;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[0.625rem]',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

const statusClasses: Record<Exclude<AvatarStatus, 'none'>, string> = {
  online: 'bg-emerald-400',
  offline: 'bg-slate-500',
  busy: 'bg-amber-400',
};

/**
 * Lightweight avatar that gracefully falls back to initials or custom nodes.
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      initials,
      fallback,
      size = 'md',
      status = 'none',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const derivedInitials = useMemo(() => {
      if (initials) {
        return initials;
      }
      if (typeof alt === 'string' && alt.trim().length > 0) {
        return alt
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map(part => part.charAt(0).toUpperCase())
          .join('');
      }
      return undefined;
    }, [initials, alt]);

    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center rounded-full bg-slate-800 text-slate-200 font-semibold uppercase overflow-hidden ${sizeClasses[size]} ${className}`.trim()}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || derivedInitials || 'Avatar'}
            className='w-full h-full object-cover'
            onError={() => setImageError(true)}
          />
        ) : fallback ? (
          fallback
        ) : derivedInitials ? (
          <span>{derivedInitials}</span>
        ) : (
          <span aria-hidden='true'>•</span>
        )}
        {children}
        {status !== 'none' ? (
          <span
            aria-hidden='true'
            className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full border-2 border-slate-900 ${statusClasses[status]}`.trim()}
          />
        ) : null}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
