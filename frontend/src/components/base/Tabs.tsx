import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  defaultTabId?: string;
  currentTabId?: string;
  onTabChange?: (tabId: string) => void;
  unmountOnExit?: boolean;
  orientation?: TabsOrientation;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
}

const focusNext = (elements: HTMLButtonElement[], startIndex: number, direction: 1 | -1) => {
  const total = elements.length;
  let index = startIndex;

  for (let i = 0; i < total; i += 1) {
    index = (index + direction + total) % total;
    const element = elements[index];

    if (!element?.disabled) {
      element.focus();
      break;
    }
  }
};

/**
 * Simple tabs primitive supporting keyboard navigation and controlled usage.
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  currentTabId,
  onTabChange,
  unmountOnExit = true,
  orientation = 'horizontal',
  tabClassName = '',
  activeTabClassName = '',
  contentClassName = '',
  className = '',
  ...props
}) => {
  const tabIds = useMemo(() => tabs.map(tab => tab.id), [tabs]);
  const fallbackTab = tabIds[0];
  const [internalTab, setInternalTab] = useState<string>(
    currentTabId ?? defaultTabId ?? fallbackTab ?? ''
  );
  const isControlled = currentTabId !== undefined;
  const activeTabId = isControlled ? currentTabId ?? fallbackTab ?? '' : internalTab;
  const baseId = useId();
  const triggerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isControlled) {
      return;
    }
    if (!tabIds.includes(internalTab) && fallbackTab) {
      setInternalTab(fallbackTab);
    }
  }, [internalTab, isControlled, tabIds, fallbackTab]);

  useEffect(() => {
    if (isControlled && currentTabId && tabIds.includes(currentTabId)) {
      setInternalTab(currentTabId);
    }
  }, [isControlled, currentTabId, tabIds]);

  const handleSelect = (tabId: string) => {
    if (!tabIds.includes(tabId)) {
      return;
    }

    if (!isControlled) {
      setInternalTab(tabId);
    }

    onTabChange?.(tabId);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!triggerContainerRef.current) {
      return;
    }

    const buttons = Array.from(
      triggerContainerRef.current.querySelectorAll<HTMLButtonElement>('button[role="tab"]')
    );

    switch (event.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault();
          focusNext(buttons, index, 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault();
          focusNext(buttons, index, -1);
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault();
          focusNext(buttons, index, 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault();
          focusNext(buttons, index, -1);
        }
        break;
      case 'Home':
        event.preventDefault();
        buttons[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`flex flex-col ${className}`.trim()} {...props}>
      <div
        ref={triggerContainerRef}
        role='tablist'
        aria-orientation={orientation}
        className={`flex ${
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        } gap-1 rounded-lg border border-slate-800/60 bg-slate-900/60 p-1`}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              type='button'
              role='tab'
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              disabled={tab.disabled}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70'
              } ${tabClassName} ${isActive ? activeTabClassName : ''}`.trim()}
              onClick={() => handleSelect(tab.id)}
              onKeyDown={event => handleKeyDown(event, index)}
            >
              <span>{tab.label}</span>
              {tab.badge ? <span className='text-xs text-slate-400'>{tab.badge}</span> : null}
            </button>
          );
        })}
      </div>

      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;

        if (unmountOnExit && !isActive) {
          return null;
        }

        return (
          <div
            key={tab.id}
            id={`${baseId}-panel-${tab.id}`}
            role='tabpanel'
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            hidden={!isActive}
            className={`mt-3 rounded-lg border border-slate-800/60 bg-slate-900/70 p-4 text-sm text-slate-200 ${contentClassName}`.trim()}
          >
            {tab.content}
          </div>
        );
      })}
    </div>
  );
};

export default Tabs;
