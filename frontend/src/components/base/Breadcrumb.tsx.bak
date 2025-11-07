import React from 'react';

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  ariaLabel?: string;
  current?: boolean;
  disabled?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  itemClassName?: string;
  separatorClassName?: string;
  ellipsisLabel?: React.ReactNode;
}

interface InternalEllipsisItem {
  key: string;
  label: React.ReactNode;
  isEllipsis: true;
}

type RenderableItem = BreadcrumbItem | InternalEllipsisItem;

const defaultSeparator = <span className='text-slate-500/70'>/</span>;

const buildRenderableItems = (
  items: BreadcrumbItem[],
  maxItems: number | undefined,
  ellipsisLabel: React.ReactNode
): RenderableItem[] => {
  if (!maxItems || maxItems < 3 || items.length <= maxItems) {
    return items;
  }

  const startCount = Math.ceil((maxItems - 1) / 2);
  const endCount = Math.floor((maxItems - 1) / 2);

  return [
    ...items.slice(0, startCount),
    { key: 'breadcrumb-ellipsis', label: ellipsisLabel, isEllipsis: true },
    ...items.slice(items.length - endCount),
  ];
};

/**
 * Semantic breadcrumb navigation that keeps routing concerns outside the primitive.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = defaultSeparator,
  maxItems,
  className = '',
  itemClassName = '',
  separatorClassName = '',
  ellipsisLabel = '…',
  ...props
}) => {
  const renderableItems = buildRenderableItems(items, maxItems, ellipsisLabel);

  return (
    <nav aria-label='Breadcrumb' className={className} {...props}>
      <ol className='flex flex-wrap items-center gap-2 text-sm text-slate-300'>
        {renderableItems.map((item, index) => {
          const isLast = index === renderableItems.length - 1;
          const key = 'isEllipsis' in item ? item.key : item.href ?? String(index);

          if ('isEllipsis' in item) {
            return (
              <li key={key} className='flex items-center text-slate-500/70' aria-hidden='true'>
                {item.label}
              </li>
            );
          }

          const { label, href, icon, onClick, ariaLabel, current, disabled } = item;
          const commonClasses = `inline-flex items-center gap-1 ${itemClassName}`.trim();
          const active = current ?? isLast;

          return (
            <li key={key} className='flex items-center gap-2'>
              {href && !active ? (
                <a
                  className={`${commonClasses} text-slate-400 hover:text-cyan-300 transition-colors`.trim()}
                  href={href}
                  aria-label={ariaLabel}
                  onClick={event => {
                    if (disabled) {
                      event.preventDefault();
                      return;
                    }
                    onClick?.(event);
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  {icon ? <span aria-hidden='true'>{icon}</span> : null}
                  <span>{label}</span>
                </a>
              ) : (
                <span
                  className={`${commonClasses} font-medium text-white`.trim()}
                  aria-current={active ? 'page' : undefined}
                >
                  {icon ? <span aria-hidden='true'>{icon}</span> : null}
                  <span>{label}</span>
                </span>
              )}
              {!isLast ? (
                <span
                  className={`text-slate-500/70 ${separatorClassName}`.trim()}
                  aria-hidden='true'
                >
                  {separator}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
