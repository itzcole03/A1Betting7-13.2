const mockReportError = jest.fn();

jest.mock('../../services/unified/UnifiedErrorService', () => ({
  ErrorCategory: {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    PERMISSION: 'permission',
    BUSINESS_LOGIC: 'business_logic',
    SYSTEM: 'system',
    UNKNOWN: 'unknown',
  },
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
  UnifiedErrorService: class {
    public static getInstance() {
      return {
        reportError: mockReportError,
      };
    }
  },
}));

jest.mock('../UnifiedLogger', () => {
  const info = jest.fn();
  const warn = jest.fn();
  const error = jest.fn();
  const debug = jest.fn();
  const mockLogger: any = {
    info,
    warn,
    error,
    debug,
    child: jest.fn(() => mockLogger),
  };

  return {
    getLogger: () => mockLogger,
  };
});

let UnifiedErrorHandler: typeof import('../UnifiedErrorHandler').UnifiedErrorHandler;
let unifiedErrorHandler: import('../UnifiedErrorHandler').UnifiedErrorHandler;

beforeAll(async () => {
  const module = await import('../UnifiedErrorHandler');
  UnifiedErrorHandler = module.UnifiedErrorHandler;
  unifiedErrorHandler = module.default;
});

describe('UnifiedErrorHandler', () => {
  let handler: ReturnType<typeof UnifiedErrorHandler.getInstance>;

  beforeAll(() => {
    handler = UnifiedErrorHandler.getInstance();
  });

  beforeEach(() => {
    mockReportError.mockReset();
    mockReportError.mockReturnValue('error-id-123');
    handler.clearListeners();
  });

  it('classifies network errors and produces default messaging', () => {
    const error = new Error('Network request failed: timeout');

    const handled = handler.handle(error, {
      source: 'api.sports.fetch',
      component: 'DataLoader',
    });

    expect(handled.context.category).toBe('NETWORK');
    expect(handled.context.severity).toBe('MEDIUM');
    expect(handled.userMessage.toLowerCase()).toContain('connecting');
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        source: 'api.sports.fetch',
        component: 'DataLoader',
      }),
      'network',
      'medium'
    );
  });

  it('respects explicit overrides for category, severity, and user messaging', () => {
    const error = new Error('Input invalid');

    const handled = unifiedErrorHandler.handle(error, {
      category: 'VALIDATION',
      severity: 'LOW',
      userMessage: 'Please provide valid information.',
      code: 'CUSTOM_CODE',
      component: 'FormHandler',
    });

    expect(handled.context.category).toBe('VALIDATION');
    expect(handled.context.severity).toBe('LOW');
    expect(handled.context.code).toBe('CUSTOM_CODE');
    expect(handled.userMessage).toBe('Please provide valid information.');
  });

  it('builds telemetry event with retry metrics and propagates retryable flag', () => {
    mockReportError.mockReturnValue('telemetry-test-id');

    const handled = handler.handle(
      {
        message: 'Database unavailable',
        status: 503,
      },
      {
        component: 'DatabaseClient',
        retryCount: 2,
      }
    );

    expect(handled.context.category).toBe('SYSTEM');
    expect(handled.context.retryable).toBe(true);
    expect(handled.telemetryEvent.name).toBe('core.error');
    expect(handled.telemetryEvent.properties).toMatchObject({
      component: 'DatabaseClient',
      errorId: 'telemetry-test-id',
      retryable: true,
    });
    expect(handled.telemetryEvent.metrics).toMatchObject({ retryCount: 2 });
  });

  it('notifies listeners and allows unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = handler.onHandled(listener);

    handler.handle(new Error('Listener test'));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    handler.handle(new Error('Listener should not be called again'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
