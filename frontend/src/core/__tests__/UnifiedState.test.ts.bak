import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  createTestStateHarness,
  createUnifiedState,
  resetAllState,
  teardownAllState,
} from '../UnifiedState';

type TestState = {
  count: number;
  name?: string;
};

const KEY_PREFIX = 'unified-state-test';
let keyCounter = 0;

function nextKey() {
  keyCounter += 1;
  return `${KEY_PREFIX}-${keyCounter}`;
}

afterEach(() => {
  teardownAllState();
});

describe('UnifiedStateManager', () => {
  it('merges partial updates and freezes resulting state object', () => {
    const key = nextKey();
    const store = createUnifiedState<TestState>(key, {
      initialState: { count: 1 },
    });

    const updated = store.setState({ name: 'alpha' });

    expect(updated.count).toBe(1);
    expect(updated.name).toBe('alpha');
    expect(Object.isFrozen(updated)).toBe(true);
  });

  it('resets state to defaults and invokes onReset hook', () => {
    const key = nextKey();
    const onReset = jest.fn();
    const store = createUnifiedState<TestState>(key, {
      initialState: { count: 5, name: 'baseline' },
      onReset,
    });

    store.setState({ count: 9 });
    const resetState = store.resetState();

    expect(resetState).toEqual({ count: 5, name: 'baseline' });
    expect(onReset).toHaveBeenCalledWith(expect.objectContaining({ count: 9 }));
  });

  it('supports subscriptions and notifies listeners on updates', () => {
    const key = nextKey();
    const store = createUnifiedState<TestState>(key, {
      initialState: { count: 0 },
    });

    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual({ count: 0 });

    store.setState({ count: 2 });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0]).toEqual({ count: 2 });

    unsubscribe();
    store.setState({ count: 3 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('rehydrates using async source and hook processing', async () => {
    const key = nextKey();
    const rehydrateHook: jest.MockedFunction<
      (state: Readonly<Partial<TestState>>) => Partial<TestState>
    > = jest.fn((state: Readonly<Partial<TestState>>) => ({
      ...state,
      name: `${state.name ?? 'unknown'}-processed`,
    }));

    const store = createUnifiedState<TestState>(key, {
      initialState: { count: 0, name: 'default' },
      rehydrate: rehydrateHook,
    });

    const nextState = await store.rehydrate(async () => ({
      count: 10,
      name: 'loaded',
    }));

    expect(nextState).toEqual({ count: 10, name: 'loaded-processed' });
    expect(rehydrateHook).toHaveBeenCalledWith({ count: 10, name: 'loaded' });
  });
});

describe('createTestStateHarness', () => {
  it('provides reset and rehydrate helpers for tests', async () => {
    const key = nextKey();
    const harness = createTestStateHarness<TestState>(key, {
      initialState: { count: 1 },
      autoReset: false,
      autoTeardown: false,
    });

    harness.setState({ count: 4 });
    expect(harness.getState().count).toBe(4);

    harness.reset();
    expect(harness.getState()).toEqual({ count: 1 });

    await harness.rehydrate({ count: 9, name: 'rehydrated' });
    expect(harness.getState()).toEqual({ count: 9, name: 'rehydrated' });
  });

  it('teardown removes store instance and prevents further usage', () => {
    const key = nextKey();
    const harness = createTestStateHarness<TestState>(key, {
      initialState: { count: 7 },
      autoReset: false,
      autoTeardown: false,
    });

    harness.teardown();

    const newStore = createUnifiedState<TestState>(key, {
      initialState: { count: 0 },
    });

    expect(newStore.getState()).toEqual({ count: 0 });
  });

  it('resetAllState restores defaults for all stores', () => {
    const firstKey = nextKey();
    const secondKey = nextKey();

    const firstStore = createUnifiedState<TestState>(firstKey, {
      initialState: { count: 2 },
    });
    const secondStore = createUnifiedState<TestState>(secondKey, {
      initialState: { count: 5 },
    });

    firstStore.setState({ count: 20 });
    secondStore.setState({ count: 50 });

    resetAllState();

    expect(firstStore.getState()).toEqual({ count: 2 });
    expect(secondStore.getState()).toEqual({ count: 5 });
  });
});
