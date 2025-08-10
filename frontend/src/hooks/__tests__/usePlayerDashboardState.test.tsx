// Mock MasterServiceRegistry to prevent real initialization
jest.mock('../../services/MasterServiceRegistry', () => ({
  __esModule: true,
  default: {
    getService: jest.fn(() => ({
      healthCheck: jest.fn(),
      ping: jest.fn(),
      getPlayer: jest.fn(() => Promise.resolve({})),
    })),
    initialize: jest.fn(),
    initializeUnifiedServices: jest.fn(),
    initializeFeatureServices: jest.fn(),
    initializePrototypeServices: jest.fn(),
    setupHealthMonitoring: jest.fn(),
    setupMetricsCollection: jest.fn(),
  },
}));
// (removed unnecessary jsxImportSource comment)
import { act, render } from '@testing-library/react';
import React from 'react';
import UnifiedErrorService from '../../services/unified/UnifiedErrorService';
import { usePlayerDashboardState } from '../usePlayerDashboardState';

// Mock UnifiedErrorService for errorId logging
jest.mock('../../services/unified/UnifiedErrorService', () => ({
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

function TestHookComponent({
  playerId,
  sport,
  onTest,
}: {
  playerId: string;
  sport: string;
  onTest: (state: any) => void;
}) {
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

  it('should generate and log errorId when error occurs', async () => {
    let hookState: any;
    // Mock getPlayer to throw
    const mockGetPlayer = jest.fn(() => {
      throw new Error('Test error');
    });
    (
      require('../../services/MasterServiceRegistry').default.getService as jest.Mock
    ).mockReturnValue({
      getPlayer: mockGetPlayer,
    });

    render(
      <TestHookComponent
        playerId='aaron-judge'
        sport='MLB'
        onTest={state => {
          hookState = state;
        }}
      />
    );

    await act(async () => {
      await hookState.reload();
    });

    expect(hookState.error).toBe('Test error');
    expect(hookState.errorId).toMatch(/player_error_/);
  });

  it('should not set errorId if no error occurs', async () => {
    let hookState: any;
    // Mock getPlayer to succeed
    const mockGetPlayer = jest.fn(() => ({ name: 'Aaron Judge' }));
    (
      require('../../services/MasterServiceRegistry').default.getService as jest.Mock
    ).mockReturnValue({
      getPlayer: mockGetPlayer,
    });

    render(
      <TestHookComponent
        playerId='aaron-judge'
        sport='MLB'
        onTest={state => {
          hookState = state;
        }}
      />
    );

    await act(async () => {
      await hookState.reload();
    });

    expect(hookState.errorId).toBeNull();
    expect(hookState.error).toBeNull();
  });

  it('should classify error severity using UnifiedErrorService', async () => {
    let hookState: any;
    // Mock getPlayer to throw
    const mockGetPlayer = jest.fn(() => {
      throw new Error('Critical error');
    });
    (
      require('../../services/MasterServiceRegistry').default.getService as jest.Mock
    ).mockReturnValue({
      getPlayer: mockGetPlayer,
    });

    render(
      <TestHookComponent
        playerId='aaron-judge'
        sport='MLB'
        onTest={state => {
          hookState = state;
        }}
      />
    );

    await act(async () => {
      await hookState.reload();
    });

    expect((UnifiedErrorService as any).reportError).toHaveBeenCalledWith(
      'Critical error',
      expect.objectContaining({ context: 'usePlayerDashboardState' })
    );
  });
});
