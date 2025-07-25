import axios from 'axios';
// @ts-expect-error TS(2305): Module '"../config/api"' has no exported member 'A... Remove this comment to see the full error message
import { API_CONFIG } from '../config/api';
import { getLocation } from '../utils/location';

// Use unified API configuration
const _api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: API_CONFIG.headers,
  timeout: API_CONFIG.timeout,
});

// Request interceptor for auth tokens
_api.interceptors.request.use((config: any) => {
  const _token = localStorage.getItem('auth_token');
  if (_token) {
    if (!config.headers) {
      config.headers = {} as Record<string, unknown>;
    }
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

// Response interceptor for error handling
_api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      getLocation().assign('/login');
    }
    return Promise.reject(error);
  }
);

export default _api;
