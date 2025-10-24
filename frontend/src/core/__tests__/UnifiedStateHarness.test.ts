import {
  createTestStateHarness,
  createUnifiedState,
  resetAllState,
  teardownAllState,
  UnifiedStateInterface,
} from '../UnifiedState';

type CounterState = {
  count: number;
  flag: boolean;
};

describe('UnifiedState test harness', () => {
  const harness = createTestStateHarness<CounterState>('core/unified-state-test', {
    initialState: { count: 0, flag: false },
  });

  afterAll(() => {
    harness.teardown();
  });

  it('allows state mutation and subscription via store reference', () => {
    const updates: number[] = [];
    harness.store.subscribe(state => updates.push(state.count));

    harness.setState({ count: 3 });

    expect(harness.getState()).toEqual({ count: 3, flag: false });
    expect(updates[updates.length - 1]).toBe(3);
  });

  it('automatically resets before each test when using the harness', () => {
    expect(harness.getState()).toEqual({ count: 0, flag: false });
  });

  it('rehydrates from supplied partial state', async () => {
    await harness.rehydrate({ count: 7 });
    expect(harness.getState()).toEqual({ count: 7, flag: false });
  });
});

describe('UnifiedState global helpers', () => {
  let store: UnifiedStateInterface<CounterState>;

  beforeEach(() => {
    store = createUnifiedState<CounterState>('core/unified-state-global', {
      initialState: { count: 1, flag: false },
    });
  });

  afterEach(() => {
    teardownAllState();
  });

  it('resetAllState restores defaults for all instances', () => {
    store.setState({ count: 99, flag: true });
    resetAllState();
    expect(store.getState()).toEqual({ count: 1, flag: false });
  });

  it('teardownAllState clears instances', () => {
    teardownAllState();
    const next = createUnifiedState<CounterState>('core/unified-state-global', {
      initialState: { count: 5, flag: true },
    });
    expect(next.getState()).toEqual({ count: 5, flag: true });
  });
});
