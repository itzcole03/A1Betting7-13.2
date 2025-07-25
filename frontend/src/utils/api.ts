import axios, { AxiosResponse } from 'axios';
import { discoverBackend } from '../services/backendDiscovery';

// Change default port to 8000 for all API requests
import { VITE_API_URL } from '../constants';
const _BASE_URL = VITE_API_URL || 'http://localhost:8000';

// Create initial axios instance
export const _api = axios.create({
  baseURL: _BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update base URL dynamically using backend discovery
const _updateBaseURL = async () => {
  try {
    const _backendUrl = await discoverBackend();
    _api.defaults.baseURL = _backendUrl || _BASE_URL;
  } catch (error) {
    console.warn('Failed to discover backend, using default baseURL:', error);
  }
};

// Update base URL on startup
_updateBaseURL();

// Periodically update base URL (every 30 seconds)
setInterval(_updateBaseURL, 30000);

// Add request interceptor for authentication
_api.interceptors.request.use(
  (config: any) => {
    const _token = localStorage.getItem('token');
    if (_token && config.headers) {
      config.headers.Authorization = `Bearer ${_token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
_api.interceptors.response.use(
  (response: AxiosResponse<any, any>) => response,
  (error: unknown) => {
    if ((error as any).response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
