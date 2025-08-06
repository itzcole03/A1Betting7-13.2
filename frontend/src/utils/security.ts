/**
 * Security Utilities - OWASP Compliant
 * Implements modern security best practices for web applications
 */

// Security Headers following OWASP recommendations
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy - Prevent XSS attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Note: 'unsafe-inline' should be removed in production with proper nonce implementation
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:8000 ws://localhost:8000",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),

    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Enable XSS protection in browsers
    'X-XSS-Protection': '1; mode=block',

    // Force HTTPS (when in production)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'payment=()',
    ].join(', '),
  };
}

// Input validation utilities
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validate password strength
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Rate limiting helper (client-side tracking)
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// CSRF token utilities
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Secure storage wrapper
export class SecureStorage {
  private static readonly PREFIX = 'a1betting_';

  static setItem(key: string, value: string, encrypt: boolean = false): void {
    try {
      const finalKey = this.PREFIX + key;
      let finalValue = value;

      if (encrypt) {
        // Simple encoding - in production, use proper encryption
        finalValue = btoa(value);
      }

      localStorage.setItem(finalKey, finalValue);
    } catch (error) {
      console.error('Failed to store item securely:', error);
    }
  }

  static getItem(key: string, decrypt: boolean = false): string | null {
    try {
      const finalKey = this.PREFIX + key;
      const value = localStorage.getItem(finalKey);

      if (!value) return null;

      if (decrypt) {
        try {
          return atob(value);
        } catch {
          return value; // Return as-is if decoding fails
        }
      }

      return value;
    } catch (error) {
      console.error('Failed to retrieve item securely:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      const finalKey = this.PREFIX + key;
      localStorage.removeItem(finalKey);
    } catch (error) {
      console.error('Failed to remove item securely:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }
}

// Environment-specific security configuration
export function getSecurityConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    isDevelopment,
    allowUnsafeEval: isDevelopment,
    enforceHTTPS: !isDevelopment,
    logSecurityEvents: true,
    sessionTimeout: isDevelopment ? 60 * 60 * 1000 : 30 * 60 * 1000, // 1 hour dev, 30 min prod
  };
}

export default {
  getSecurityHeaders,
  sanitizeInput,
  isValidEmail,
  validatePassword,
  ClientRateLimiter,
  generateCSRFToken,
  SecureStorage,
  getSecurityConfig,
};
