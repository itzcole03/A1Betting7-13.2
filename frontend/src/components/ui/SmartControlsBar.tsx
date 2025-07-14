import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Types for smart controls
interface SmartControl {
  id: string;
  type: 'button' | 'toggle' | 'dropdown' | 'slider' | 'input' | 'badge';
  label: string;
  icon?: string;
  value?: any;
  options?: Array<{ label: string; value: any; icon?: string }>;
  category: 'primary' | 'secondary' | 'filter' | 'view' | 'action' | 'ai';
  priority: number; // 1-10, higher = more visible
  contextual?: boolean; // Shows only in relevant contexts
  aiSuggested?: boolean;
  shortcut?: string;
  tooltip?: string;
  disabled?: boolean;
  loading?: boolean;
  notification?: {
    type: 'info' | 'warning' | 'error' | 'success';
    count?: number;
    pulse?: boolean;
  };
  onChange?: (value: any) => void;
  onClick?: () => void;
}

interface ControlGroup {
  id: string;
  label: string;
  controls: SmartControl[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface SmartContext {
  currentView: string;
  selectedItems: string[];
  filters: Record<string, any>;
  userPreferences: {
    preferredControls: string[];
    hiddenControls: string[];
    customLayout: string[];
  };
  aiRecommendations: {
    suggestedActions: string[];
    contextualControls: string[];
    automationSuggestions: string[];
  };
}

interface SmartControlsBarProps {
  controls: SmartControl[];
  groups?: ControlGroup[];
  context: SmartContext;
  variant?: 'default' | 'cyber' | 'compact' | 'floating' | 'adaptive';
  layout?: 'horizontal' | 'vertical' | 'grid' | 'adaptive';
  position?: 'top' | 'bottom' | 'left' | 'right';
  smartMode?: boolean;
  showCategories?: boolean;
  showShortcuts?: boolean;
  compactMode?: boolean;
  className?: string;
  onControlChange?: (control: SmartControl, value: any) => void;
  onContextUpdate?: (context: Partial<SmartContext>) => void;
}

const getControlIcon = (type: string) => {
  const icons = {
    button: '🔘',
    toggle: '🔄',
    dropdown: '📋',
    slider: '🎚️',
    input: '📝',
    badge: '🏷️',
  };
  return icons[type as keyof typeof icons] || '⚙️';
};

const getCategoryColor = (category: string, variant: string = 'default') => {
  const colors = {
    default: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white',
      filter: 'bg-green-500 text-white',
      view: 'bg-purple-500 text-white',
      action: 'bg-orange-500 text-white',
      ai: 'bg-pink-500 text-white',
    },
    cyber: {
      primary: 'bg-cyan-500 text-black shadow-cyan-500/50',
      secondary: 'bg-slate-500 text-white shadow-slate-500/50',
      filter: 'bg-green-500 text-black shadow-green-500/50',
      view: 'bg-purple-500 text-white shadow-purple-500/50',
      action: 'bg-orange-500 text-black shadow-orange-500/50',
      ai: 'bg-pink-500 text-white shadow-pink-500/50',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[category as keyof typeof colors.cyber] || colors.cyber.secondary
    : colors.default[category as keyof typeof colors.default] || colors.default.secondary;
};

const sortControlsByPriority = (controls: SmartControl[], context: SmartContext) => {
  return [...controls].sort((a, b) => {
    let scoreA = a.priority * 10;
    let scoreB = b.priority * 10;

    // Boost AI suggested controls
    if (a.aiSuggested) scoreA += 20;
    if (b.aiSuggested) scoreB += 20;

    // Boost preferred controls
    if (context.userPreferences.preferredControls.includes(a.id)) scoreA += 15;
    if (context.userPreferences.preferredControls.includes(b.id)) scoreB += 15;

    // Contextual relevance
    if (a.contextual && context.aiRecommendations.contextualControls.includes(a.id)) scoreA += 25;
    if (b.contextual && context.aiRecommendations.contextualControls.includes(b.id)) scoreB += 25;

    return scoreB - scoreA;
  });
};

export const SmartControlsBar: React.FC<SmartControlsBarProps> = ({
  controls,
  groups,
  context,
  variant = 'default',
  layout = 'horizontal',
  position = 'top',
  smartMode = true,
  showCategories = true,
  showShortcuts = false,
  compactMode = false,
  className,
  onControlChange,
  onContextUpdate,
}) => {
  const [smartControls, setSmartControls] = useState<SmartControl[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Update smart controls based on context
  useEffect(() => {
    if (smartMode) {
      const filtered = controls.filter(control => {
        // Hide controls marked as hidden
        if (context.userPreferences.hiddenControls.includes(control.id)) {
          return false;
        }

        // Show contextual controls only when relevant
        if (control.contextual) {
          return context.aiRecommendations.contextualControls.includes(control.id);
        }

        return true;
      });

      const sorted = sortControlsByPriority(filtered, context);
      setSmartControls(sorted);
    } else {
      setSmartControls(controls);
    }
  }, [controls, context, smartMode]);

  const handleControlChange = (control: SmartControl, value: any) => {
    onControlChange?.(control, value);
    control.onChange?.(value);

    // Update user preferences
    if (!context.userPreferences.preferredControls.includes(control.id)) {
      onContextUpdate?.({
        userPreferences: {
          ...context.userPreferences,
          preferredControls: [...context.userPreferences.preferredControls, control.id],
        },
      });
    }
  };

  const handleControlClick = (control: SmartControl) => {
    control.onClick?.();

    // Track usage for AI recommendations
    onContextUpdate?.({
      aiRecommendations: {
        ...context.aiRecommendations,
        suggestedActions: [control.id, ...context.aiRecommendations.suggestedActions.slice(0, 4)],
      },
    });
  };

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const positionClasses = {
    top: 'top-0 left-0 right-0 border-b',
    bottom: 'bottom-0 left-0 right-0 border-t',
    left: 'top-0 bottom-0 left-0 border-r',
    right: 'top-0 bottom-0 right-0 border-l',
  };

  const variantClasses = {
    default: 'bg-white border-gray-200 shadow-sm',
    cyber: 'bg-slate-900/95 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    compact: 'bg-gray-50 border-gray-200',
    floating: 'bg-white border-gray-200 rounded-lg shadow-lg m-4',
    adaptive: 'bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-md',
  };

  const layoutClasses = {
    horizontal: 'flex flex-row items-center space-x-2',
    vertical: 'flex flex-col space-y-2',
    grid: 'grid grid-cols-auto gap-2',
    adaptive: 'flex flex-wrap gap-2',
  };

  // Filter controls by category
  const filteredControls =
    activeCategory === 'all'
      ? smartControls
      : smartControls.filter(control => control.category === activeCategory);

  // Get unique categories
  const categories = Array.from(new Set(smartControls.map(control => control.category)));

  return (
    <div
      className={cn(
        'relative z-40',
        positionClasses[position],
        variantClasses[variant],
        compactMode ? 'p-2' : 'p-4',
        className
      )}
    >
      {/* Category Tabs */}
      {showCategories && categories.length > 1 && !compactMode && (
        <div className='flex space-x-1 mb-3'>
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-3 py-1 text-xs rounded transition-colors',
              activeCategory === 'all'
                ? variant === 'cyber'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-blue-100 text-blue-700'
                : variant === 'cyber'
                  ? 'text-cyan-400/70 hover:text-cyan-300'
                  : 'text-gray-600 hover:text-gray-800'
            )}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'px-3 py-1 text-xs rounded transition-colors capitalize',
                activeCategory === category
                  ? variant === 'cyber'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-blue-100 text-blue-700'
                  : variant === 'cyber'
                    ? 'text-cyan-400/70 hover:text-cyan-300'
                    : 'text-gray-600 hover:text-gray-800'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      {groups ? (
        // Grouped layout
        <div className='space-y-4'>
          {groups.map(group => (
            <div key={group.id}>
              {group.label && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'flex items-center justify-between w-full mb-2 text-sm font-medium',
                    variant === 'cyber' ? 'text-cyan-300' : 'text-gray-700'
                  )}
                >
                  <span>{group.label}</span>
                  {group.collapsible && (
                    <span
                      className={cn(
                        'transition-transform',
                        collapsedGroups.has(group.id) ? 'rotate-0' : 'rotate-90'
                      )}
                    >
                      ▶
                    </span>
                  )}
                </button>
              )}

              {(!group.collapsible || !collapsedGroups.has(group.id)) && (
                <div className={layoutClasses[layout]}>
                  {group.controls.map(control => (
                    <SmartControlComponent
                      key={control.id}
                      control={control}
                      variant={variant}
                      compactMode={compactMode}
                      showShortcuts={showShortcuts}
                      onChange={handleControlChange}
                      onClick={handleControlClick}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Flat layout
        <div className={layoutClasses[layout]}>
          {filteredControls.map(control => (
            <SmartControlComponent
              key={control.id}
              control={control}
              variant={variant}
              compactMode={compactMode}
              showShortcuts={showShortcuts}
              onChange={handleControlChange}
              onClick={handleControlClick}
            />
          ))}
        </div>
      )}

      {/* AI Suggestions */}
      {smartMode && context.aiRecommendations.automationSuggestions.length > 0 && !compactMode && (
        <div
          className={cn(
            'mt-4 p-3 rounded border',
            variant === 'cyber'
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              : 'bg-purple-50 border-purple-200 text-purple-700'
          )}
        >
          <div className='flex items-center space-x-2 text-sm'>
            <span>🤖</span>
            <span className='font-medium'>AI Suggestion:</span>
            <span>{context.aiRecommendations.automationSuggestions[0]}</span>
          </div>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] pointer-events-none' />
        </>
      )}
    </div>
  );
};

// Individual smart control component
interface SmartControlComponentProps {
  control: SmartControl;
  variant: string;
  compactMode: boolean;
  showShortcuts: boolean;
  onChange: (control: SmartControl, value: any) => void;
  onClick: (control: SmartControl) => void;
}

const SmartControlComponent: React.FC<SmartControlComponentProps> = ({
  control,
  variant,
  compactMode,
  showShortcuts,
  onChange,
  onClick,
}) => {
  const [localValue, setLocalValue] = useState(control.value);

  const handleChange = (value: any) => {
    setLocalValue(value);
    onChange(control, value);
  };

  const baseClasses = cn(
    'relative inline-flex items-center space-x-2 transition-all duration-200',
    control.disabled && 'opacity-50 cursor-not-allowed',
    control.aiSuggested && variant === 'cyber' && 'animate-pulse',
    compactMode ? 'p-1 text-xs' : 'p-2 text-sm'
  );

  const buttonClasses = cn(
    baseClasses,
    'rounded border',
    getCategoryColor(control.category, variant),
    !control.disabled && 'hover:shadow-md cursor-pointer'
  );

  // Render different control types
  switch (control.type) {
    case 'button':
      return (
        <button
          onClick={() => onClick(control)}
          disabled={control.disabled}
          className={buttonClasses}
          title={control.tooltip}
        >
          {control.icon && <span>{control.icon}</span>}
          <span>{control.label}</span>
          {control.notification && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white',
                control.notification.pulse && 'animate-pulse'
              )}
            >
              {control.notification.count || '!'}
            </span>
          )}
          {showShortcuts && control.shortcut && (
            <span className='text-xs opacity-70'>{control.shortcut}</span>
          )}
          {control.loading && <span className='animate-spin'>⟳</span>}
        </button>
      );

    case 'toggle':
      return (
        <label className={cn(baseClasses, 'cursor-pointer')} title={control.tooltip}>
          <input
            type='checkbox'
            checked={localValue}
            onChange={e => handleChange(e.target.checked)}
            disabled={control.disabled}
            className='sr-only'
          />
          <div
            className={cn(
              'w-8 h-4 rounded-full transition-colors',
              localValue ? getCategoryColor(control.category, variant) : 'bg-gray-300'
            )}
          >
            <div
              className={cn(
                'w-3 h-3 rounded-full bg-white transition-transform transform',
                localValue ? 'translate-x-4' : 'translate-x-0.5',
                'mt-0.5'
              )}
            />
          </div>
          <span>{control.label}</span>
          {control.aiSuggested && <span>🤖</span>}
        </label>
      );

    case 'dropdown':
      return (
        <div className={baseClasses} title={control.tooltip}>
          {control.icon && <span>{control.icon}</span>}
          <select
            value={localValue}
            onChange={e => handleChange(e.target.value)}
            disabled={control.disabled}
            className={cn(
              'border rounded px-2 py-1',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300'
                : 'bg-white border-gray-300'
            )}
          >
            {control.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'slider':
      return (
        <div className={baseClasses} title={control.tooltip}>
          {control.icon && <span>{control.icon}</span>}
          <span className='whitespace-nowrap'>{control.label}:</span>
          <input
            type='range'
            min={control.options?.[0]?.value || 0}
            max={control.options?.[1]?.value || 100}
            value={localValue}
            onChange={e => handleChange(Number(e.target.value))}
            disabled={control.disabled}
            className='flex-1'
          />
          <span className='text-xs w-8 text-right'>{localValue}</span>
        </div>
      );

    case 'input':
      return (
        <div className={baseClasses} title={control.tooltip}>
          {control.icon && <span>{control.icon}</span>}
          <input
            type='text'
            value={localValue}
            onChange={e => handleChange(e.target.value)}
            placeholder={control.label}
            disabled={control.disabled}
            className={cn(
              'border rounded px-2 py-1',
              variant === 'cyber'
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-300 placeholder-cyan-400/50'
                : 'bg-white border-gray-300'
            )}
          />
        </div>
      );

    case 'badge':
      return (
        <div
          className={cn(
            baseClasses,
            'rounded-full px-3 py-1 text-xs',
            getCategoryColor(control.category, variant)
          )}
          title={control.tooltip}
        >
          {control.icon && <span>{control.icon}</span>}
          <span>{control.label}</span>
          {control.value && <span className='font-bold'>{control.value}</span>}
        </div>
      );

    default:
      return null;
  }
};
