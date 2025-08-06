/**
 * SecurityService - Unified Security Management
 * Implements OWASP-compliant security practices
 */

import {
  ClientRateLimiter,
  SecureStorage,
  generateCSRFToken,
  getSecurityConfig,
  isValidEmail,
  sanitizeInput,
  validatePassword,
} from '../../utils/security';

interface AuthCredentials {
  username: string;
  password: string;
  csrfToken?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: string;
  };
  error?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private rateLimiter = new ClientRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
  private csrfToken: string | null = null;

  private constructor() {
    this.initializeCSRF();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private initializeCSRF(): void {
    this.csrfToken = generateCSRFToken();
    // Store in secure storage for API requests
    SecureStorage.setItem('csrf_token', this.csrfToken, true);
  }

  public getCSRFToken(): string | null {
    return this.csrfToken;
  }

  public async authenticate(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      // Rate limiting check
      const clientId = credentials.username || 'anonymous';
      if (!this.rateLimiter.isAllowed(clientId)) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        };
      }

      // Input validation
      const username = sanitizeInput(credentials.username);
      const password = credentials.password;

      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password are required',
        };
      }

      // Email validation if username is email format
      if (username.includes('@') && !isValidEmail(username)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // Password strength validation (for registration/password change)
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid && credentials.username.includes('register')) {
        return {
          success: false,
          error: `Password requirements not met: ${passwordValidation.errors.join(', ')}`,
        };
      }

      // Mock authentication response - replace with actual API call
      const mockResponse: AuthResponse = {
        success: true,
        token: this.generateMockJWT(username),
        user: {
          id: '1',
          username: username,
          role: 'user',
        },
      };

      // Store token securely
      if (mockResponse.token) {
        SecureStorage.setItem('auth_token', mockResponse.token, true);
        SecureStorage.setItem('user_info', JSON.stringify(mockResponse.user), true);
      }

      // Reset rate limiter on successful auth
      this.rateLimiter.reset(clientId);

      return mockResponse;
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed due to server error',
      };
    }
  }

  public async logout(): Promise<{ success: boolean }> {
    try {
      // Clear secure storage
      SecureStorage.removeItem('auth_token');
      SecureStorage.removeItem('user_info');
      SecureStorage.removeItem('csrf_token');

      // Regenerate CSRF token
      this.initializeCSRF();

      // In a real app, make API call to invalidate server-side session
      // await apiClient.post('/auth/logout');

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  }

  public isAuthenticated(): boolean {
    const token = SecureStorage.getItem('auth_token', true);
    return !!token && this.isTokenValid(token);
  }

  public getCurrentUser(): any {
    try {
      const userInfo = SecureStorage.getItem('user_info', true);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch {
      return null;
    }
  }

  public getAuthHeaders(): Record<string, string> {
    const token = SecureStorage.getItem('auth_token', true);
    const csrf = this.csrfToken;

    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }

    return headers;
  }

  private generateMockJWT(username: string): string {
    // This is a mock implementation - use proper JWT in production
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      })
    );
    const signature = btoa('mock-signature'); // Use proper signing in production

    return `${header}.${payload}.${signature}`;
  }

  private isTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      return payload.exp > now;
    } catch {
      return false;
    }
  }

  public checkSession(): void {
    const config = getSecurityConfig();

    if (!this.isAuthenticated()) {
      this.logout();
      // Redirect to login if needed
      return;
    }

    // Set up session timeout
    setTimeout(() => {
      if (this.isAuthenticated()) {
        this.logout();
        console.log('Session expired for security');
      }
    }, config.sessionTimeout);
  }
}

export default SecurityService;
