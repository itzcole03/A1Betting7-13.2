import { safeObserve, disconnectObserver } from "../safePerformanceObserver";

// Helper to set and restore global PerformanceObserver
const originalPO = (global as any).window?.PerformanceObserver;

class MockPerformanceObserver {
  public static supportedEntryTypes = [
    "longtask",
    "layout-shift",
    "first-input",
    "largest-contentful-paint",
    "paint",
    "navigation",
    "resource",
    "measure",
  ];

  public cb: PerformanceObserverCallback;
  public observedTypes: string[] | undefined;
  public disconnected = false;

  constructor(cb: PerformanceObserverCallback) {
    this.cb = cb;
    (MockPerformanceObserver as any).lastInstance = this;
  }

  observe(init: PerformanceObserverInit) {
    this.observedTypes = (init.entryTypes || []) as string[];
  }

  disconnect() {
    this.disconnected = true;
  }

  takeRecords(): PerformanceEntryList {
    return [] as unknown as PerformanceEntryList;
  }
}

describe("safePerformanceObserver", () => {
  afterEach(() => {
    // Restore default mock implementation after each test
    (global as any).window.PerformanceObserver = originalPO;
  });

  it("returns null when PerformanceObserver is missing", () => {
    (global as any).window.PerformanceObserver = undefined;
    const cb: PerformanceObserverCallback = () => {};
    const obs = safeObserve(["navigation" as any], cb);
    expect(obs).toBeNull();
  });

  it("filters unsupported entry types and observes supported ones", () => {
    (global as any).window.PerformanceObserver = MockPerformanceObserver as any;
    const cb: PerformanceObserverCallback = () => {};
    const obs = safeObserve(["foo" as any, "measure"], cb);
    expect(obs).not.toBeNull();
    const last: any = (MockPerformanceObserver as any).lastInstance;
    expect(last.observedTypes).toEqual(["measure"]);
  });

  it("returns null if all requested entry types are unsupported", () => {
    (global as any).window.PerformanceObserver = MockPerformanceObserver as any;
    const cb: PerformanceObserverCallback = () => {};
    const obs = safeObserve(["foo" as any, "bar" as any], cb);
    expect(obs).toBeNull();
  });

  it("returns null when PerformanceObserver.observe throws", () => {
    class ThrowingObserver extends MockPerformanceObserver {
      observe(): void {
        throw new Error("observe not supported");
      }
    }
    (global as any).window.PerformanceObserver = ThrowingObserver as any;
    const cb: PerformanceObserverCallback = () => {};
    const obs = safeObserve(["navigation" as any, "resource" as any], cb);
    expect(obs).toBeNull();
  });

  it("disconnectObserver safely no-ops on null/undefined and on throwing disconnect", () => {
    expect(() => disconnectObserver(null as any)).not.toThrow();
    expect(() => disconnectObserver(undefined as any)).not.toThrow();

    const throwing = { disconnect: () => { throw new Error("boom"); } } as any;
    expect(() => disconnectObserver(throwing)).not.toThrow();
  });
});
