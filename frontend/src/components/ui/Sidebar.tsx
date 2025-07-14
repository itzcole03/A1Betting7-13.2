import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Types for sidebar navigation
interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  badge?: string | number;
  children?: SidebarItem[];
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface SidebarSection {
  id: string;
  title?: string;
  items: SidebarItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface SidebarProps {
  sections: SidebarSection[];
  variant?: 'default' | 'cyber' | 'minimal' | 'compact' | 'floating';
  position?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg' | 'xl';
  collapsible?: boolean;
  collapsed?: boolean;
  showIcons?: boolean;
  showBadges?: boolean;
  className?: string;
  onItemClick?: (item: SidebarItem) => void;
  onCollapse?: (collapsed: boolean) => void;
}

const getWidthClasses = (width: string, collapsed: boolean = false) => {
  if (collapsed) return 'w-16';

  const widths = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96',
  };
  return widths[width as keyof typeof widths] || widths.md;
};

const getVariantClasses = (variant: string) => {
  const variants = {
    default: 'bg-white border-r border-gray-200 shadow-sm',
    cyber:
      'bg-slate-900/95 border-r border-cyan-500/30 shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    minimal: 'bg-gray-50 border-r border-gray-100',
    compact: 'bg-white border-r border-gray-200 shadow-sm',
    floating: 'bg-white border border-gray-200 rounded-lg shadow-lg m-4',
  };
  return variants[variant as keyof typeof variants] || variants.default;
};

export const Sidebar: React.FC<SidebarProps> = ({
  sections,
  variant = 'default',
  position = 'left',
  width = 'md',
  collapsible = true,
  collapsed = false,
  showIcons = true,
  showBadges = true,
  className,
  onItemClick,
  onCollapse,
}) => {
  const [localCollapsed, setLocalCollapsed] = useState(collapsed);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => !s.defaultCollapsed).map(s => s.id))
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isCollapsed = collapsible ? localCollapsed : false;

  const handleCollapse = () => {
    const newCollapsed = !localCollapsed;
    setLocalCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  const toggleSection = (sectionId: string) => {
    if (isCollapsed) return;

    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    if (isCollapsed) return;

    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled) return;

    if (item.children && item.children.length > 0) {
      toggleItem(item.id);
    } else {
      onItemClick?.(item);
      item.onClick?.();
    }
  };

  return (
    <div
      className={cn(
        'relative h-full flex flex-col transition-all duration-300',
        getWidthClasses(width, isCollapsed),
        getVariantClasses(variant),
        position === 'right' && 'border-r-0 border-l border-l-gray-200',
        variant === 'cyber' && position === 'right' && 'border-l-cyan-500/30',
        className
      )}
    >
      {/* Header */}
      {collapsible && (
        <div
          className={cn(
            'flex items-center justify-between p-4 border-b',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          {!isCollapsed && (
            <h2
              className={cn(
                'font-semibold',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
              )}
            >
              Navigation
            </h2>
          )}
          <button
            onClick={handleCollapse}
            className={cn(
              'p-2 rounded transition-colors',
              variant === 'cyber'
                ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              isCollapsed && 'mx-auto'
            )}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>
      )}

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {sections.map(section => (
          <div key={section.id} className='py-2'>
            {/* Section Header */}
            {section.title && !isCollapsed && (
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-2',
                  section.collapsible && 'cursor-pointer hover:bg-gray-50',
                  variant === 'cyber' && section.collapsible && 'hover:bg-cyan-500/5'
                )}
                onClick={() => section.collapsible && toggleSection(section.id)}
              >
                <span
                  className={cn(
                    'text-xs font-medium uppercase tracking-wider',
                    variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
                  )}
                >
                  {section.title}
                </span>
                {section.collapsible && (
                  <span
                    className={cn(
                      'text-xs transition-transform',
                      expandedSections.has(section.id) ? 'rotate-90' : 'rotate-0'
                    )}
                  >
                    ▶
                  </span>
                )}
              </div>
            )}

            {/* Section Items */}
            {(!section.collapsible || expandedSections.has(section.id)) && (
              <div className='space-y-1 px-2'>
                {section.items.map(item => (
                  <SidebarItemComponent
                    key={item.id}
                    item={item}
                    variant={variant}
                    collapsed={isCollapsed}
                    showIcons={showIcons}
                    showBadges={showBadges}
                    expanded={expandedItems.has(item.id)}
                    onClick={handleItemClick}
                    level={0}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {variant === 'cyber' && !isCollapsed && (
        <div className='p-4 border-t border-cyan-500/30'>
          <div className='text-xs text-cyan-400/50 text-center'>A1 Betting Platform</div>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-blue-500/5 pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] pointer-events-none' />
        </>
      )}
    </div>
  );
};

// Individual sidebar item component
interface SidebarItemComponentProps {
  item: SidebarItem;
  variant: string;
  collapsed: boolean;
  showIcons: boolean;
  showBadges: boolean;
  expanded: boolean;
  onClick: (item: SidebarItem) => void;
  level: number;
}

const SidebarItemComponent: React.FC<SidebarItemComponentProps> = ({
  item,
  variant,
  collapsed,
  showIcons,
  showBadges,
  expanded,
  onClick,
  level,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = collapsed ? 'pl-2' : `pl-${4 + level * 4}`;

  return (
    <div>
      {/* Main Item */}
      <button
        onClick={() => onClick(item)}
        disabled={item.disabled}
        className={cn(
          'w-full flex items-center justify-between p-2 rounded transition-all duration-200',
          paddingLeft,
          // Active state
          item.active &&
            (variant === 'cyber'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'),
          // Hover state
          !item.active &&
            !item.disabled &&
            (variant === 'cyber'
              ? 'text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/10'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'),
          // Disabled state
          item.disabled && 'opacity-50 cursor-not-allowed',
          // Collapsed state
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.label : undefined}
      >
        <div className='flex items-center space-x-3'>
          {/* Icon */}
          {showIcons && item.icon && <span className='text-lg flex-shrink-0'>{item.icon}</span>}

          {/* Label */}
          {!collapsed && <span className='font-medium truncate'>{item.label}</span>}
        </div>

        {!collapsed && (
          <div className='flex items-center space-x-2'>
            {/* Badge */}
            {showBadges && item.badge && (
              <span
                className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  variant === 'cyber' ? 'bg-cyan-500/30 text-cyan-300' : 'bg-gray-200 text-gray-700'
                )}
              >
                {item.badge}
              </span>
            )}

            {/* Expand Arrow */}
            {hasChildren && (
              <span
                className={cn('text-xs transition-transform', expanded ? 'rotate-90' : 'rotate-0')}
              >
                ▶
              </span>
            )}
          </div>
        )}
      </button>

      {/* Children */}
      {hasChildren && expanded && !collapsed && (
        <div className='mt-1 space-y-1'>
          {item.children?.map(child => (
            <SidebarItemComponent
              key={child.id}
              item={child}
              variant={variant}
              collapsed={collapsed}
              showIcons={showIcons}
              showBadges={showBadges}
              expanded={false}
              onClick={onClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
