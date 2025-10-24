export type StateObject = Record<string, unknown>;

type StateListener<TState extends StateObject> = (state: Readonly<TState>) => void;

type ResetHook<TState extends StateObject> = (previousState: Readonly<TState>) => void;

type RehydrateHook<TState extends StateObject> = (
  storedState: Readonly<Partial<TState>>
) => Partial<TState> | void;

type RehydrateSource<TState extends StateObject> = () =>
  | Promise<Partial<TState> | undefined>
  | Partial<TState>
  | undefined;

export interface UnifiedStateOptions<TState extends StateObject> {
  initialState?: Partial<TState>;
  rehydrate?: RehydrateHook<TState> | RehydrateSource<TState>;
  onReset?: ResetHook<TState>;
}

export interface UnifiedStateInterface<TState extends StateObject> {
  getState(): Readonly<TState>;
  setState(updater: Partial<TState> | ((draft: TState) => void)): Readonly<TState>;
  resetState(next?: Partial<TState>): Readonly<TState>;
  rehydrate(source?: RehydrateSource<TState>): Promise<Readonly<TState>>;
  subscribe(listener: StateListener<TState>): () => void;
  teardown?(): void;
}

const INTERNAL_RESET_EVENT = Symbol('UnifiedState.reset');
const INTERNAL_REHYDRATE_EVENT = Symbol('UnifiedState.rehydrate');
const INTERNAL_UPDATE_EVENT = Symbol('UnifiedState.update');

interface BroadcastEvent<TState extends StateObject> {
  type:
    | typeof INTERNAL_RESET_EVENT
    | typeof INTERNAL_REHYDRATE_EVENT
    | typeof INTERNAL_UPDATE_EVENT;
  payload: Readonly<TState>;
}

type BroadcastChannelLike<TState extends StateObject> = {
  postMessage: (event: BroadcastEvent<TState>) => void;
  close: () => void;
  addEventListener: (
    type: 'message',
    handler: (event: { data: BroadcastEvent<TState> }) => void
  ) => void;
  removeEventListener: (
    type: 'message',
    handler: (event: { data: BroadcastEvent<TState> }) => void
  ) => void;
};

function createBroadcastChannel<TState extends StateObject>(
  key: string
): BroadcastChannelLike<TState> | null {
  const BroadcastChannelCtor =
    typeof (globalThis as any).BroadcastChannel === 'function'
      ? ((globalThis as any).BroadcastChannel as typeof globalThis.BroadcastChannel)
      : undefined;

  if (!BroadcastChannelCtor) {
    return null;
  }

  try {
    return new BroadcastChannelCtor(key) as BroadcastChannelLike<TState>;
  } catch {
    return null;
  }
}

export class UnifiedStateManager<TState extends StateObject>
  implements UnifiedStateInterface<TState>
{
  private readonly listeners: Set<StateListener<TState>> = new Set();
  private readonly key: string;
  private readonly onReset?: ResetHook<TState>;
  private readonly defaultState: TState;
  private currentState: TState;
  private channel: BroadcastChannelLike<TState> | null;
  private readonly rehydrateHook?: RehydrateHook<TState>;
  private readonly rehydrateSource?: RehydrateSource<TState>;

  constructor(key: string, options?: UnifiedStateOptions<TState>) {
    this.key = key;
    this.defaultState = Object.freeze({ ...(options?.initialState ?? {}) }) as TState;
    this.currentState = { ...this.defaultState } as TState;
    this.onReset = options?.onReset;
    this.channel = createBroadcastChannel<TState>(key);

    if (typeof options?.rehydrate === 'function') {
      this.rehydrateHook = options.rehydrate as RehydrateHook<TState>;
    } else if (options?.rehydrate) {
      this.rehydrateSource = options.rehydrate as RehydrateSource<TState>;
    }

    this.channel?.addEventListener('message', this.handleBroadcast);
  }

  private handleBroadcast = (event: { data: BroadcastEvent<TState> }) => {
    const message = event.data;
    if (!message || !message.payload) return;

    this.currentState = { ...message.payload } as TState;
    this.notify();
  };

  public getState(): Readonly<TState> {
    return this.currentState;
  }

  public setState(updater: Partial<TState> | ((draft: TState) => void)): Readonly<TState> {
    const draft = { ...this.currentState } as TState;

    if (typeof updater === 'function') {
      (updater as (draft: TState) => void)(draft);
    } else {
      Object.assign(draft, updater);
    }

    this.currentState = Object.freeze(draft) as TState;
    this.notify({ type: INTERNAL_UPDATE_EVENT, payload: this.currentState });
    return this.currentState;
  }

  public resetState(next?: Partial<TState>): Readonly<TState> {
    const previousState = this.currentState;
    const baseState = { ...this.defaultState } as TState;

    if (next) {
      Object.assign(baseState, next);
    }

    this.currentState = Object.freeze(baseState) as TState;
    if (this.onReset) {
      this.onReset(previousState);
    }

    this.notify({ type: INTERNAL_RESET_EVENT, payload: this.currentState });
    return this.currentState;
  }

  public async rehydrate(source?: RehydrateSource<TState>): Promise<Readonly<TState>> {
    const rehydrateSource = source ?? this.rehydrateSource;
    let storedState: Partial<TState> | undefined;

    if (rehydrateSource) {
      storedState = await Promise.resolve(rehydrateSource());
    }

    if (this.rehydrateHook) {
      const processed = this.rehydrateHook((storedState ?? {}) as Partial<TState>);
      if (processed) {
        storedState = processed as Partial<TState>;
      }
    }

    if (!storedState) {
      return this.currentState;
    }

    const nextState = { ...this.defaultState, ...storedState } as TState;
    this.currentState = Object.freeze(nextState) as TState;
    this.notify({ type: INTERNAL_REHYDRATE_EVENT, payload: this.currentState });
    return this.currentState;
  }

  public subscribe(listener: StateListener<TState>): () => void {
    this.listeners.add(listener);
    listener(this.currentState);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event?: BroadcastEvent<TState>): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch {
        // Listener errors should not break state updates.
      }
    });

    if (event && this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {
        // Ignore broadcast failures.
      }
    }
  }

  public teardown(): void {
    this.listeners.clear();
    this.channel?.removeEventListener('message', this.handleBroadcast);
    this.channel?.close();
    this.channel = null;
  }
}

const instances = new Map<string, UnifiedStateInterface<StateObject>>();

const lifecycleResets = new Map<string, () => void>();
const lifecycleTeardowns = new Map<string, () => void>();
let beforeEachRegistered = false;
let afterEachRegistered = false;

function getTestLifecycleFns() {
  const globalWithHooks = globalThis as unknown as {
    beforeEach?: (handler: () => void) => void;
    afterEach?: (handler: () => void) => void;
  };
  return {
    beforeEach:
      typeof globalWithHooks.beforeEach === 'function' ? globalWithHooks.beforeEach : undefined,
    afterEach:
      typeof globalWithHooks.afterEach === 'function' ? globalWithHooks.afterEach : undefined,
  };
}

function ensureBeforeEachLifecycleHook(): void {
  if (beforeEachRegistered) return;
  const { beforeEach } = getTestLifecycleFns();
  if (!beforeEach) return;
  beforeEach(() => {
    lifecycleResets.forEach(reset => {
      try {
        reset();
      } catch {
        // Ignore test reset failures to avoid masking assertions.
      }
    });
  });
  beforeEachRegistered = true;
}

function ensureAfterEachLifecycleHook(): void {
  if (afterEachRegistered) return;
  const { afterEach } = getTestLifecycleFns();
  if (!afterEach) return;
  afterEach(() => {
    lifecycleTeardowns.forEach(teardown => {
      try {
        teardown();
      } catch {
        // Ignore teardown failures in test environments.
      }
    });
  });
  afterEachRegistered = true;
}

export function createUnifiedState<TState extends StateObject>(
  key: string,
  options?: UnifiedStateOptions<TState>
): UnifiedStateInterface<TState> {
  if (!instances.has(key)) {
    const manager = new UnifiedStateManager<TState>(key, options);
    instances.set(key, manager as unknown as UnifiedStateInterface<StateObject>);
  }

  return instances.get(key)! as UnifiedStateInterface<TState>;
}

export interface TestStateHarnessOptions<TState extends StateObject>
  extends UnifiedStateOptions<TState> {
  autoReset?: boolean;
  autoTeardown?: boolean;
}

export interface TestStateHarness<TState extends StateObject> {
  store: UnifiedStateInterface<TState>;
  reset(next?: Partial<TState>): Readonly<TState>;
  rehydrate(next?: Partial<TState> | RehydrateSource<TState>): Promise<Readonly<TState>>;
  getState(): Readonly<TState>;
  setState(updater: Partial<TState> | ((draft: TState) => void)): Readonly<TState>;
  teardown(): void;
}

export function createTestStateHarness<TState extends StateObject>(
  key: string,
  options?: TestStateHarnessOptions<TState>
): TestStateHarness<TState> {
  const { autoReset = true, autoTeardown = false, ...stateOptions } = options ?? {};
  const store = createUnifiedState<TState>(key, stateOptions);
  const manager = store as UnifiedStateManager<TState>;

  const reset = (next?: Partial<TState>) => manager.resetState(next);
  const rehydrate = async (next?: Partial<TState> | RehydrateSource<TState>) => {
    if (!next) {
      return manager.rehydrate();
    }
    if (typeof next === 'function') {
      return manager.rehydrate(next);
    }
    return manager.rehydrate(() => next);
  };

  const teardown = () => {
    manager.teardown();
    lifecycleResets.delete(key);
    lifecycleTeardowns.delete(key);
    instances.delete(key);
  };

  if (autoReset) {
    lifecycleResets.set(key, () => {
      reset();
    });
    ensureBeforeEachLifecycleHook();
  }

  if (autoTeardown) {
    lifecycleTeardowns.set(key, () => {
      teardown();
    });
    ensureAfterEachLifecycleHook();
  }

  return {
    store,
    reset,
    rehydrate,
    getState: () => store.getState(),
    setState: updater => store.setState(updater),
    teardown,
  };
}

export function resetAllState(): void {
  instances.forEach(manager => {
    if (typeof (manager as UnifiedStateManager<StateObject>).resetState === 'function') {
      (manager as UnifiedStateManager<StateObject>).resetState();
    }
  });
}

export function teardownAllState(): void {
  instances.forEach(manager => {
    if (typeof (manager as UnifiedStateManager<StateObject>).teardown === 'function') {
      (manager as UnifiedStateManager<StateObject>).teardown();
    }
  });
  instances.clear();
  lifecycleResets.clear();
  lifecycleTeardowns.clear();
}
