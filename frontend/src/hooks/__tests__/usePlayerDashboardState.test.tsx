import React from 'react';
import { render, act } from '@testing-library/react';
import { usePlayerDashboardState } from '../usePlayerDashboardState';
import UnifiedErrorService from '@/services/unified/UnifiedErrorService';

// Mock UnifiedErrorService for errorId logging
jest.mock('@/services/unified/UnifiedErrorService', () => ({
  __esModule: true,
  default: {
    logError: jest.fn(),
    classifyError: jest.fn(() => ({
      severity: 'LOW',
      message: 'Mock error',
      resolution: 'Ignore',
    })),
    reportError: jest.fn(() => 'player_error_12345'),
  },
}));

function TestHookComponent({ playerId, sport, onTest }) {
  const state = usePlayerDashboardState({ playerId, sport });
  React.useEffect(() => {
    if (onTest) onTest(state);
  }, [state, onTest]);
  return null;
}

describe('usePlayerDashboardState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    let hookState;
    render(
      <TestHookComponent
        playerId='aaron-judge'
        sport='MLB'
        onTest={state => {
          hookState = state;
        }}
      />
    );

    expect(hookState.player).toBeNull();
    expect(hookState.loading).toBe(false);
    expect(hookState.error).toBeNull();
    expect(hookState.errorId).toBeNull();
    expect(typeof hookState.reload).toBe('function');
  });

  it('should have reload function', () => {
    let hookState;
    render(
      <TestHookComponent
        playerId='aaron-judge'
        sport='MLB'
        onTest={state => {
          hookState = state;
        }}
      />
    );

    expect(typeof hookState.reload).toBe('function');
  });

  it('should accept playerId and sport parameters', () => {
    let hookState;
    render(
      <TestHookComponent
        playerId='test-player'
        sport='NBA'
        onTest={state => {
          hookState = state;
        }}
      />
    );

    // Hook should initialize successfully with different parameters
    expect(hookState).toBeDefined();
    expect(hookState.player).toBeNull();
  });
});
