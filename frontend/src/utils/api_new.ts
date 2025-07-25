import axios from 'axios';
import { discoverBackend } from '../services/backendDiscovery';

import { VITE_API_URL } from '../constants';
const _BASE_URL = VITE_API_URL || 'http://localhost:8000';

export const _api = axios.create({
  baseURL: _BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const _updateBaseURL = async () => {
  try {
    const _backendUrl = await discoverBackend();
    _api.defaults.baseURL = _backendUrl || _BASE_URL;
  } catch (error) {
    console.warn('Failed to discover backend, using default baseURL:', error);
  }
};

_updateBaseURL();

setInterval(_updateBaseURL, 30000);

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

_api.interceptors.response.use(
  (response: any) => response,
  (error: unknown) => {
    if ((error as any).response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
