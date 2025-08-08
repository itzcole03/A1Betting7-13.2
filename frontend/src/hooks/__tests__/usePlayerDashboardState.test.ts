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

  it('should generate and log errorId when error occurs', () => {
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

    act(() => {
      hookState.setError('Test error', 'player_error_12345');
    });

    expect(hookState.errorId).toBe('player_error_12345');
    expect(UnifiedErrorService.logError).toHaveBeenCalledWith(
      expect.objectContaining({ errorId: 'player_error_12345' })
    );
  });

  it('should not log errorId if undefined', () => {
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

    act(() => {
      hookState.setError('Test error', undefined);
    });

    expect(hookState.errorId).toBeUndefined();
    expect(UnifiedErrorService.logError).not.toHaveBeenCalledWith(
      expect.objectContaining({ errorId: undefined })
    );
  });

  it('should classify error severity using UnifiedErrorService', () => {
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

    act(() => {
      hookState.setError('Critical error', 'player_error_critical');
    });

    expect(UnifiedErrorService.classifyError).toHaveBeenCalledWith('Critical error');
  });
});
