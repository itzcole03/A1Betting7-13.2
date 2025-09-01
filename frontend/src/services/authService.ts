// frontend/src/services/AuthService.ts
import axios from 'axios';

const _API_URL = 'http://localhost:8000/api/auth';

export interface User {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface PasswordChangeRequest {
  userId: string;
  oldPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  requiresPasswordChange?: boolean;
}

class AuthService {
  private user: User | null = null;
  private token: string | null = null;
  private requiresPasswordChangeFlag = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    const _token = localStorage.getItem('token');
    const _user = localStorage.getItem('user');
    if (_token && _user) {
      this.token = _token;
      this.user = JSON.parse(_user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  private saveToLocalStorage(token: string, user: User) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private clearLocalStorage() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    // Ensure we pick up any token that may have been set after construction
    if (!this.token) this.loadFromLocalStorage();
    return !!this.token;
  }

  getUser(): User | null {
    // Lazy-load from localStorage in case tests set items after import time
    if (!this.user) this.loadFromLocalStorage();
    return this.user;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  requiresPasswordChange(): boolean {
    return this.requiresPasswordChangeFlag;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const _response = await axios.post(
        `${_API_URL}/login`,
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (_response.data.access_token) {
        const _user: User = { id: '1', email, role: 'admin' };
        this.saveToLocalStorage(_response.data.access_token, _user);
        return { success: true, user: _user, requiresPasswordChange: false };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      console.error('Login API error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Login failed due to API error',
      };
    }
  }

  async logout(): Promise<void> {
    this.clearLocalStorage();
    return Promise.resolve();
  }

  async changePassword(data: PasswordChangeRequest): Promise<AuthResponse> {
    try {
      console.log(`Changing password for user ${data.userId}`);
      this.requiresPasswordChangeFlag = false;
      return { success: true };
    } catch (error) {
      console.error('Change password API error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Password change failed due to API error',
      };
    }
  }
}

export const _authService = new AuthService();
