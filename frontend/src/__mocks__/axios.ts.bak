// Enhanced Axios Mock for Testing
type MockAxiosResponse<T = unknown> = {
  data: T;
  status: number;
  statusText: string;
  headers?: Record<string, unknown>;
  config?: Record<string, unknown>;
};

type MockAxiosError = {
  message: string;
  code?: string;
  response?: {
    status: number;
    statusText: string;
    data: Record<string, unknown>;
  };
  request: Record<string, unknown>;
  config: Record<string, unknown>;
  isAxiosError: true;
};

type MethodArgs = [string, unknown?, unknown?];
type MethodMock = jest.Mock<Promise<MockAxiosResponse>, MethodArgs>;

const toRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
};

const isJestMock = (value: unknown): value is jest.Mock =>
  typeof value === 'function' && value !== null && 'mockReset' in (value as jest.Mock);

interface AxiosMock {
  get: MethodMock;
  post: MethodMock;
  put: MethodMock;
  patch: MethodMock;
  delete: MethodMock;
  head: MethodMock;
  options: MethodMock;
  request: MethodMock;
  create: jest.Mock<AxiosMock>;
  interceptors: {
    request: { use: jest.Mock; eject: jest.Mock };
    response: { use: jest.Mock; eject: jest.Mock };
  };
  defaults: {
    headers: Record<string, Record<string, unknown>>;
    timeout: number;
    baseURL: string;
    transformRequest: unknown[];
    transformResponse: unknown[];
    paramsSerializer: ((params: Record<string, unknown>) => string) | null;
    withCredentials: boolean;
  };
  CancelToken: {
    source: jest.Mock<{
      token: Record<string, unknown>;
      cancel: jest.Mock<void, []>;
    }>;
  };
  Cancel: jest.Mock<void, []>;
  isCancel: jest.Mock<boolean, [unknown?]>;
  mockResolvedValue: (data: unknown) => void;
  mockRejectedValue: (error: unknown) => void;
  mockReset: () => void;
  mockResponse: <T = unknown>(
    data: T,
    status?: number,
    statusText?: string
  ) => MockAxiosResponse<T>;
  mockError: (message: string, code?: string, status?: number) => MockAxiosError;
}

const mockAxios: AxiosMock = {
  get: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} })
  ),
  post: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 201, statusText: 'Created', headers: {}, config: {} })
  ),
  put: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} })
  ),
  patch: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} })
  ),
  delete: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 204, statusText: 'No Content', headers: {}, config: {} })
  ),
  head: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} })
  ),
  options: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} })
  ),
  request: jest.fn<Promise<MockAxiosResponse>, MethodArgs>(() =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} })
  ),

  // Instance methods
  create: jest.fn<AxiosMock, []>(() => mockAxios),

  // Interceptors
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },

  // Default config
  defaults: {
    headers: {
      common: {},
      delete: {},
      get: {},
      head: {},
      post: {},
      put: {},
      patch: {},
    },
    timeout: 0,
    baseURL: '',
    transformRequest: [],
    transformResponse: [],
    paramsSerializer: null,
    withCredentials: false,
  },

  // Cancel token
  CancelToken: {
    source: jest.fn<
      {
        token: Record<string, unknown>;
        cancel: jest.Mock<void, []>;
      },
      []
    >(() => ({
      token: {},
      cancel: jest.fn<void, []>(() => undefined),
    })),
  },

  Cancel: jest.fn<void, []>(() => undefined),
  isCancel: jest.fn<boolean, [unknown?]>(() => false),

  // Error simulation helpers
  mockResolvedValue: (data: unknown) => {
    mockAxios.get.mockResolvedValue(mockAxios.mockResponse(data));
    mockAxios.post.mockResolvedValue(mockAxios.mockResponse(data, 201, 'Created'));
    mockAxios.put.mockResolvedValue(mockAxios.mockResponse(data));
    mockAxios.patch.mockResolvedValue(mockAxios.mockResponse(data));
    mockAxios.delete.mockResolvedValue(mockAxios.mockResponse(data, 204, 'No Content'));
  },

  mockRejectedValue: (error: unknown) => {
    mockAxios.get.mockRejectedValue(error);
    mockAxios.post.mockRejectedValue(error);
    mockAxios.put.mockRejectedValue(error);
    mockAxios.patch.mockRejectedValue(error);
    mockAxios.delete.mockRejectedValue(error);
  },

  mockReset: () => {
    Object.values(mockAxios).forEach(value => {
      if (isJestMock(value)) {
        value.mockReset();
      }
    });
  },

  // Response simulation
  mockResponse: <T>(data: T, status = 200, statusText = 'OK'): MockAxiosResponse<T> => ({
    data,
    status,
    statusText,
    headers: {},
    config: {},
  }),

  // Error simulation
  mockError: (message: string, code?: string, status?: number) => ({
    message,
    code,
    response: status
      ? {
          status,
          statusText: status >= 400 ? 'Error' : 'OK',
          data: { error: message },
        }
      : undefined,
    request: {},
    config: {},
    isAxiosError: true,
  }),
};

// Setup default mock behaviors
mockAxios.get.mockImplementation((url: string) => {
  // Simulate different responses based on URL patterns
  if (url.includes('/api/health') || url.includes('/api/v2/health')) {
    return Promise.resolve(mockAxios.mockResponse({ status: 'healthy' }));
  }
  if (url.includes('/api/predictions')) {
    return Promise.resolve(mockAxios.mockResponse({ predictions: [] }));
  }
  if (url.includes('/api/players')) {
    return Promise.resolve(mockAxios.mockResponse({ players: [] }));
  }
  if (url.includes('/api/odds')) {
    return Promise.resolve(mockAxios.mockResponse({ odds: [] }));
  }

  return Promise.resolve(mockAxios.mockResponse({}));
});

mockAxios.post.mockImplementation((url: string, data: unknown) => {
  if (url.includes('/api/auth/login')) {
    return Promise.resolve(
      mockAxios.mockResponse({
        token: 'mock-jwt-token',
        user: { id: 1, username: 'testuser' },
      })
    );
  }
  if (url.includes('/api/predictions')) {
    return Promise.resolve(
      mockAxios.mockResponse(
        {
          id: 1,
          ...toRecord(data),
          created_at: new Date().toISOString(),
        },
        201
      )
    );
  }

  return Promise.resolve(mockAxios.mockResponse({ id: 1, ...toRecord(data) }, 201));
});

export default mockAxios;
export const axios = mockAxios;
