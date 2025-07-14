import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Types for smart sidebar functionality
interface SmartNavItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  category: 'betting' | 'analytics' | 'account' | 'tools' | 'ai' | 'system';
  priority: number; // 1-10, higher = more important
  usageCount: number;
  lastAccessed?: Date;
  aiRecommended?: boolean;
  contextualRelevance?: number; // 0-1 based on current context
  badges?: Array<{
    type: 'new' | 'hot' | 'updated' | 'ai' | 'premium';
    label?: string;
    count?: number;
  }>;
  subItems?: SmartNavItem[];
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface SmartContext {
  currentPage: string;
  userRole: 'basic' | 'premium' | 'pro' | 'admin';
  recentActivity: string[];
  preferences: {
    favoriteFeatures: string[];
    hiddenItems: string[];
    customOrder: string[];
  };
  aiInsights: {
    suggestedFeatures: string[];
    timeBasedRecommendations: string[];
    usagePatterns: Record<string, number>;
  };
}

interface SmartSidebarProps {
  items: SmartNavItem[];
  context: SmartContext;
  variant?: 'default' | 'cyber' | 'adaptive' | 'ai-enhanced';
  adaptiveMode?: boolean;
  showAiSuggestions?: boolean;
  showUsageStats?: boolean;
  showQuickActions?: boolean;
  collapsed?: boolean;
  className?: string;
  onItemClick?: (item: SmartNavItem) => void;
  onContextUpdate?: (context: Partial<SmartContext>) => void;
}

const getCategoryIcon = (category: string) => {
  const icons = {
    betting: '🎯',
    analytics: '📊',
    account: '👤',
    tools: '🛠️',
    ai: '🤖',
    system: '⚙️',
  };
  return icons[category as keyof typeof icons] || '📄';
};

const getBadgeColor = (type: string, variant: string = 'default') => {
  const colors = {
    default: {
      new: 'bg-green-100 text-green-700',
      hot: 'bg-red-100 text-red-700',
      updated: 'bg-blue-100 text-blue-700',
      ai: 'bg-purple-100 text-purple-700',
      premium: 'bg-yellow-100 text-yellow-700',
    },
    cyber: {
      new: 'bg-green-500/20 text-green-300 border border-green-500/30',
      hot: 'bg-red-500/20 text-red-300 border border-red-500/30',
      updated: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      ai: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      premium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    },
  };

  return variant === 'cyber'
    ? colors.cyber[type as keyof typeof colors.cyber] || colors.cyber.ai
    : colors.default[type as keyof typeof colors.default] || colors.default.ai;
};

const sortItemsBySmartness = (items: SmartNavItem[], context: SmartContext) => {
  return [...items].sort((a, b) => {
    // Calculate smart score for each item
    const getSmartScore = (item: SmartNavItem) => {
      let score = 0;

      // Base priority
      score += item.priority * 10;

      // Usage frequency (normalized)
      score += Math.min(item.usageCount / 10, 50);

      // Recent access bonus
      if (item.lastAccessed) {
        const daysSinceAccess = (Date.now() - item.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(20 - daysSinceAccess, 0);
      }

      // AI recommendation bonus
      if (item.aiRecommended) {
        score += 30;
      }

      // Contextual relevance
      if (item.contextualRelevance) {
        score += item.contextualRelevance * 40;
      }

      // User preferences
      if (context.preferences.favoriteFeatures.includes(item.id)) {
        score += 25;
      }

      if (context.preferences.hiddenItems.includes(item.id)) {
        score -= 100;
      }

      return score;
    };

    return getSmartScore(b) - getSmartScore(a);
  });
};

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅 Good morning';
  if (hour < 18) return '☀️ Good afternoon';
  return '🌙 Good evening';
};

export const SmartSidebar: React.FC<SmartSidebarProps> = ({
  items,
  context,
  variant = 'default',
  adaptiveMode = true,
  showAiSuggestions = true,
  showUsageStats = false,
  showQuickActions = true,
  collapsed = false,
  className,
  onItemClick,
  onContextUpdate,
}) => {
  const [smartItems, setSmartItems] = useState<SmartNavItem[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<SmartNavItem[]>([]);
  const [quickActions, setQuickActions] = useState<SmartNavItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Update smart items based on context
  useEffect(() => {
    if (adaptiveMode) {
      const sorted = sortItemsBySmartness(items, context);
      setSmartItems(sorted);

      // Generate AI suggestions
      const suggestions = sorted
        .filter(
          item => item.aiRecommended || (item.contextualRelevance && item.contextualRelevance > 0.7)
        )
        .slice(0, 3);
      setAiSuggestions(suggestions);

      // Generate quick actions based on recent activity
      const quick = sorted
        .filter(
          item =>
            context.recentActivity.includes(item.id) ||
            context.preferences.favoriteFeatures.includes(item.id)
        )
        .slice(0, 4);
      setQuickActions(quick);
    } else {
      setSmartItems(items);
    }
  }, [items, context, adaptiveMode]);

  const handleItemClick = (item: SmartNavItem) => {
    // Update usage stats
    const updatedItem = {
      ...item,
      usageCount: item.usageCount + 1,
      lastAccessed: new Date(),
    };

    // Update context
    onContextUpdate?.({
      recentActivity: [item.id, ...context.recentActivity.slice(0, 9)],
    });

    onItemClick?.(updatedItem);
    item.onClick?.();
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const variantClasses = {
    default: 'bg-white border-r border-gray-200 shadow-sm',
    cyber:
      'bg-slate-900/95 border-r border-cyan-500/30 shadow-2xl shadow-cyan-500/20 backdrop-blur-md',
    adaptive: 'bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg',
    'ai-enhanced': 'bg-gradient-to-b from-purple-50 to-white border-r border-purple-200 shadow-lg',
  };

  // Group items by category
  const categorizedItems = smartItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SmartNavItem[]>
  );

  return (
    <div
      className={cn(
        'relative h-full flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-80',
        variantClasses[variant],
        className
      )}
    >
      {/* Smart Header */}
      <div
        className={cn(
          'p-4 border-b',
          variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
        )}
      >
        {!collapsed && (
          <div className='space-y-2'>
            <div className={cn('text-sm', variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600')}>
              {getTimeBasedGreeting()}
            </div>
            <div
              className={cn(
                'font-semibold',
                variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900'
              )}
            >
              Smart Navigation
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {showQuickActions && quickActions.length > 0 && !collapsed && (
        <div className='p-4 border-b border-gray-200'>
          <h4
            className={cn(
              'text-xs font-medium uppercase tracking-wider mb-3',
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-500'
            )}
          >
            Quick Actions
          </h4>
          <div className='grid grid-cols-2 gap-2'>
            {quickActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleItemClick(action)}
                className={cn(
                  'p-2 rounded text-xs text-left transition-colors',
                  variant === 'cyber'
                    ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
              >
                <div className='flex items-center space-x-1'>
                  <span>{action.icon}</span>
                  <span className='truncate'>{action.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {showAiSuggestions && aiSuggestions.length > 0 && !collapsed && (
        <div className='p-4 border-b border-gray-200'>
          <h4
            className={cn(
              'text-xs font-medium uppercase tracking-wider mb-3 flex items-center space-x-1',
              variant === 'cyber' ? 'text-purple-400/70' : 'text-purple-600'
            )}
          >
            <span>🤖</span>
            <span>AI Suggestions</span>
          </h4>
          <div className='space-y-2'>
            {aiSuggestions.map(suggestion => (
              <button
                key={suggestion.id}
                onClick={() => handleItemClick(suggestion)}
                className={cn(
                  'w-full flex items-center space-x-2 p-2 rounded text-left transition-colors',
                  variant === 'cyber'
                    ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                )}
              >
                <span>{suggestion.icon}</span>
                <span className='text-sm truncate'>{suggestion.label}</span>
                {suggestion.contextualRelevance && (
                  <span className='text-xs opacity-70'>
                    {Math.round(suggestion.contextualRelevance * 100)}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className='flex-1 overflow-y-auto p-2'>
        {Object.entries(categorizedItems).map(([category, categoryItems]) => (
          <div key={category} className='mb-4'>
            {!collapsed && (
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded transition-colors',
                  variant === 'cyber'
                    ? 'hover:bg-cyan-500/10 text-cyan-300'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                <div className='flex items-center space-x-2'>
                  <span>{getCategoryIcon(category)}</span>
                  <span className='font-medium capitalize'>{category}</span>
                </div>
                <span
                  className={cn(
                    'text-xs transition-transform',
                    expandedCategories.has(category) ? 'rotate-90' : 'rotate-0'
                  )}
                >
                  ▶
                </span>
              </button>
            )}

            {(collapsed || expandedCategories.has(category)) && (
              <div className={cn('space-y-1', !collapsed && 'ml-4 mt-2')}>
                {categoryItems.map(item => (
                  <SmartNavItemComponent
                    key={item.id}
                    item={item}
                    variant={variant}
                    collapsed={collapsed}
                    showUsageStats={showUsageStats}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Smart Footer */}
      {!collapsed && (
        <div
          className={cn(
            'p-4 border-t',
            variant === 'cyber' ? 'border-cyan-500/30' : 'border-gray-200'
          )}
        >
          <div
            className={cn(
              'text-xs text-center',
              variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
            )}
          >
            {variant === 'ai-enhanced' && '🤖 AI-Enhanced Navigation'}
            {variant === 'cyber' && '⚡ Smart Betting Interface'}
            {variant === 'adaptive' && '🧠 Adaptive UI'}
            {variant === 'default' && '📊 Smart Analytics'}
          </div>
        </div>
      )}

      {/* Cyber Effects */}
      {variant === 'cyber' && (
        <>
          <div className='absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-purple-500/5 pointer-events-none' />
          <div className='absolute inset-0 bg-grid-white/[0.02] pointer-events-none' />
        </>
      )}
    </div>
  );
};

// Smart navigation item component
interface SmartNavItemComponentProps {
  item: SmartNavItem;
  variant: string;
  collapsed: boolean;
  showUsageStats: boolean;
  onClick: (item: SmartNavItem) => void;
}

const SmartNavItemComponent: React.FC<SmartNavItemComponentProps> = ({
  item,
  variant,
  collapsed,
  showUsageStats,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(item)}
      disabled={item.disabled}
      className={cn(
        'w-full flex items-center justify-between p-2 rounded transition-all duration-200',
        // Active state
        item.active &&
          (variant === 'cyber'
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            : 'bg-blue-50 text-blue-700'),
        // AI recommended glow
        item.aiRecommended &&
          variant === 'cyber' &&
          'shadow-purple-500/30 border border-purple-500/30',
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
        {item.icon && <span className='text-lg flex-shrink-0'>{item.icon}</span>}

        {/* Label and stats */}
        {!collapsed && (
          <div className='flex flex-col items-start flex-1'>
            <span className='font-medium truncate'>{item.label}</span>
            {showUsageStats && item.usageCount > 0 && (
              <span
                className={cn(
                  'text-xs opacity-70',
                  variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-500'
                )}
              >
                Used {item.usageCount} times
              </span>
            )}
          </div>
        )}
      </div>

      {!collapsed && (
        <div className='flex items-center space-x-1'>
          {/* Badges */}
          {item.badges?.map((badge, index) => (
            <span
              key={index}
              className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                getBadgeColor(badge.type, variant)
              )}
            >
              {badge.count ? badge.count : badge.label || badge.type}
            </span>
          ))}

          {/* AI recommendation indicator */}
          {item.aiRecommended && <span className='text-xs'>🤖</span>}
        </div>
      )}
    </button>
  );
};
