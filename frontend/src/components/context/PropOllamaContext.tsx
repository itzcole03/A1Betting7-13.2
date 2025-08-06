import React from 'react';
import type { PropOllamaActions, PropOllamaState } from '../shared/PropOllamaTypes';

/**
 * PropOllamaContext - Provides state and actions to child components
 */
export interface PropOllamaContextValue {
  state: PropOllamaState;
  actions: PropOllamaActions;
}

const PropOllamaContext = React.createContext<PropOllamaContextValue | null>(null);

export interface PropOllamaProviderProps {
  children: React.ReactNode;
  value: [PropOllamaState, PropOllamaActions];
}

export const PropOllamaProvider: React.FC<PropOllamaProviderProps> = ({ children, value }) => {
  const [state, actions] = value;

  const contextValue = React.useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions]
  );

  return <PropOllamaContext.Provider value={contextValue}>{children}</PropOllamaContext.Provider>;
};

export const usePropOllamaContext = () => {
  const context = React.useContext(PropOllamaContext);
  if (!context) {
    throw new Error('usePropOllamaContext must be used within PropOllamaProvider');
  }
  return context;
};
