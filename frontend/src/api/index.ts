import axios from 'axios';
// @ts-expect-error TS(2305): Module '"../config/api"' has no exported member 'A... Remove this comment to see the full error message
import { API_CONFIG } from '../config/api';

// Use unified API configuration
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: API_CONFIG.headers,
  timeout: API_CONFIG.timeout,
});

// Request interceptor for auth tokens
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    if (!config.headers) {
      // @ts-expect-error TS(2322): Type 'Record<string, any>' is not assignable to ty... Remove this comment to see the full error message
      config.headers = {} as Record<string, any>;
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
