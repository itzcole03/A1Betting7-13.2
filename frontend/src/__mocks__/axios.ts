// Enhanced Axios Mock for Testing
const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK' })),
  post: jest.fn(() => Promise.resolve({ data: {}, status: 201, statusText: 'Created' })),
  put: jest.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK' })),
  patch: jest.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK' })),
  delete: jest.fn(() => Promise.resolve({ data: {}, status: 204, statusText: 'No Content' })),
  head: jest.fn(() => Promise.resolve({ status: 200, statusText: 'OK' })),
  options: jest.fn(() => Promise.resolve({ status: 200, statusText: 'OK' })),
  request: jest.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK' })),
  
  // Instance methods
  create: jest.fn(() => mockAxios),
  
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
    source: jest.fn(() => ({
      token: {},
      cancel: jest.fn(),
    })),
  },
  
  Cancel: jest.fn(),
  isCancel: jest.fn(() => false),
  
  // Error simulation helpers
  mockResolvedValue: (data: any) => {
    mockAxios.get.mockResolvedValue({ data, status: 200, statusText: 'OK' });
    mockAxios.post.mockResolvedValue({ data, status: 201, statusText: 'Created' });
    mockAxios.put.mockResolvedValue({ data, status: 200, statusText: 'OK' });
    mockAxios.patch.mockResolvedValue({ data, status: 200, statusText: 'OK' });
    mockAxios.delete.mockResolvedValue({ data, status: 204, statusText: 'No Content' });
  },
  
  mockRejectedValue: (error: any) => {
    mockAxios.get.mockRejectedValue(error);
    mockAxios.post.mockRejectedValue(error);
    mockAxios.put.mockRejectedValue(error);
    mockAxios.patch.mockRejectedValue(error);
    mockAxios.delete.mockRejectedValue(error);
  },
  
  mockReset: () => {
    Object.keys(mockAxios).forEach(key => {
      if (typeof mockAxios[key as keyof typeof mockAxios] === 'function') {
        (mockAxios[key as keyof typeof mockAxios] as jest.Mock).mockReset();
      }
    });
  },
  
  // Response simulation
  mockResponse: (data: any, status = 200, statusText = 'OK') => ({
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
    response: status ? {
      status,
      statusText: status >= 400 ? 'Error' : 'OK',
      data: { error: message },
    } : undefined,
    request: {},
    config: {},
    isAxiosError: true,
  }),
};

// Setup default mock behaviors
mockAxios.get.mockImplementation((url: string) => {
  // Simulate different responses based on URL patterns
  if (url.includes('/api/health')) {
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

mockAxios.post.mockImplementation((url: string, data: any) => {
  if (url.includes('/api/auth/login')) {
    return Promise.resolve(mockAxios.mockResponse({ 
      token: 'mock-jwt-token',
      user: { id: 1, username: 'testuser' }
    }));
  }
  if (url.includes('/api/predictions')) {
    return Promise.resolve(mockAxios.mockResponse({ 
      id: 1,
      ...data,
      created_at: new Date().toISOString()
    }, 201));
  }
  
  return Promise.resolve(mockAxios.mockResponse({ id: 1, ...data }, 201));
});

export default mockAxios;
export const axios = mockAxios;
