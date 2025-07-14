import axios from 'axios';
import { backendDiscovery } from '../services/backendDiscovery';

// Create initial axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update base URL dynamically using backend discovery
const updateBaseURL = async () => {
  try {
    const backendUrl = await backendDiscovery.getBackendUrl();
    api.defaults.baseURL = backendUrl;
  } catch (error) {
    console.warn('Failed to discover backend, using default baseURL:', error);
  }
};

// Update base URL on startup
updateBaseURL();

// Periodically update base URL (every 30 seconds)
setInterval(updateBaseURL, 30000);

// Add request interceptor for authentication
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
