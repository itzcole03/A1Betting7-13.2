// Security utilities for A1Betting frontend
export enum SecurityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

interface SecurityConfig {
  cspEnabled: boolean;
  xssProtection: boolean;
  contentSniffingPrevention: boolean;
  clickjackingProtection: boolean;
  httpsEnforcement: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  tokenExpiration: number; // minutes
}

interface SecurityViolation {
  id: string;
  type: 'XSS' | 'CSRF' | 'INJECTION' | 'UNAUTHORIZED' | 'SUSPICIOUS';
  severity: SecurityLevel;
  message: string;
  source: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  context?: Record<string, any>;
}

interface APISecurityHeaders {
  'Content-Type': string;
  'X-Requested-With': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

// Main Security Manager Class
export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private violations: SecurityViolation[] = [];
  private cspNonce: string | null = null;
  private sessionStartTime: number;
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  constructor() {
    this.config = this.getDefaultConfig();
    this.sessionStartTime = Date.now();
    this.initializeSecurity();
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      cspEnabled: true,
      xssProtection: true,
      contentSniffingPrevention: true,
      clickjackingProtection: true,
      httpsEnforcement: process.env.NODE_ENV === 'production',
      sessionTimeout: 30, // 30 minutes
      maxLoginAttempts: 5,
      tokenExpiration: 60 // 60 minutes
    };
  }

  private initializeSecurity(): void {
    this.setupCSP();
    this.setupXSSProtection();
    this.setupSessionMonitoring();
    this.validateSecureContext();
  }

  // Content Security Policy Setup
  private setupCSP(): void {
    if (!this.config.cspEnabled) return;

    // Generate CSP nonce for inline scripts/styles
    this.cspNonce = this.generateNonce();

    // Apply CSP headers if not already set by server
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${this.cspNonce}' 'unsafe-eval'`, // unsafe-eval needed for dev
      `style-src 'self' 'nonce-${this.cspNonce}' 'unsafe-inline'`, // unsafe-inline for CSS-in-JS
      "img-src 'self' data: blob: https:",
      "font-src 'self' https:",
      "connect-src 'self' wss: ws: https:",
      "media-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');

    // Check if CSP is already set
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingCSP) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = cspDirectives;
      document.head.appendChild(meta);
    }
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // XSS Protection
  private setupXSSProtection(): void {
    if (!this.config.xssProtection) return;

    // Set up mutation observer to detect suspicious DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanForXSS(node as Element);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private scanForXSS(element: Element): void {
    // Check for suspicious attributes
    const suspiciousAttributes = ['onload', 'onerror', 'onclick', 'onmouseover'];
    
    suspiciousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        this.reportSecurityViolation({
          type: 'XSS',
          severity: SecurityLevel.HIGH,
          message: `Suspicious ${attr} attribute detected`,
          source: 'DOM_MUTATION',
          context: {
            tagName: element.tagName,
            attribute: attr,
            value: element.getAttribute(attr)
          }
        });
      }
    });

    // Check for script tags
    if (element.tagName === 'SCRIPT') {
      this.reportSecurityViolation({
        type: 'XSS',
        severity: SecurityLevel.CRITICAL,
        message: 'Unauthorized script element detected',
        source: 'DOM_MUTATION',
        context: {
          src: element.getAttribute('src'),
          innerHTML: element.innerHTML
        }
      });
    }
  }

  // Session Management
  private setupSessionMonitoring(): void {
    // Check session timeout
    setInterval(() => {
      const now = Date.now();
      const sessionDuration = now - this.sessionStartTime;
      const timeoutMs = this.config.sessionTimeout * 60 * 1000;

      if (sessionDuration > timeoutMs) {
        this.handleSessionTimeout();
      }
    }, 60000); // Check every minute

    // Monitor for suspicious activity
    this.monitorUserActivity();
  }

  private handleSessionTimeout(): void {
    this.reportSecurityViolation({
      type: 'UNAUTHORIZED',
      severity: SecurityLevel.MEDIUM,
      message: 'Session timeout detected',
      source: 'SESSION_MANAGEMENT'
    });

    // Clear sensitive data
    this.clearSensitiveData();
    
    // Redirect to login (in a real app)
    console.warn('Session timeout - user should be redirected to login');
  }

  private monitorUserActivity(): void {
    let lastActivity = Date.now();
    let suspiciousActivityCount = 0;

    // Track user interactions
    ['click', 'keypress', 'mousemove', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;
        
        // Detect potential bot activity (too fast interactions)
        if (timeSinceLastActivity < 50 && eventType === 'click') {
          suspiciousActivityCount++;
          
          if (suspiciousActivityCount > 10) {
            this.reportSecurityViolation({
              type: 'SUSPICIOUS',
              severity: SecurityLevel.MEDIUM,
              message: 'Potential bot activity detected',
              source: 'USER_MONITORING',
              context: {
                eventType,
                rapidClicks: suspiciousActivityCount
              }
            });
          }
        } else {
          suspiciousActivityCount = 0;
        }
        
        lastActivity = now;
      });
    });
  }

  // Input Validation and Sanitization
  public sanitizeInput(input: string, type: 'text' | 'html' | 'url' | 'email' = 'text'): string {
    if (!input || typeof input !== 'string') return '';

    switch (type) {
      case 'html':
        return this.sanitizeHTML(input);
      case 'url':
        return this.sanitizeURL(input);
      case 'email':
        return this.sanitizeEmail(input);
      default:
        return this.sanitizeText(input);
    }
  }

  private sanitizeText(input: string): string {
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim()
      .slice(0, 1000); // Limit length
  }

  private sanitizeHTML(input: string): string {
    // Basic HTML sanitization - in production use a library like DOMPurify
    const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'];
    const cleanInput = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous attributes
    return cleanInput.replace(/\son\w+\s*=/gi, '');
  }

  private sanitizeURL(input: string): string {
    try {
      const url = new URL(input);
      
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return url.toString();
    } catch {
      return '';
    }
  }

  private sanitizeEmail(input: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input) ? input.toLowerCase().trim() : '';
  }

  // API Security
  public getSecureHeaders(): APISecurityHeaders {
    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  public validateToken(token: string): boolean {
    if (!token) return false;

    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // Login Security
  public checkLoginAttempts(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts) return true;
    
    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    // Reset attempts after 15 minutes
    if (timeSinceLastAttempt > 15 * 60 * 1000) {
      this.loginAttempts.delete(identifier);
      return true;
    }
    
    return attempts.count < this.config.maxLoginAttempts;
  }

  public recordLoginAttempt(identifier: string, success: boolean): void {
    if (success) {
      this.loginAttempts.delete(identifier);
      return;
    }

    const existing = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    existing.count++;
    existing.lastAttempt = Date.now();
    
    this.loginAttempts.set(identifier, existing);

    if (existing.count >= this.config.maxLoginAttempts) {
      this.reportSecurityViolation({
        type: 'UNAUTHORIZED',
        severity: SecurityLevel.HIGH,
        message: 'Multiple failed login attempts detected',
        source: 'LOGIN_MONITORING',
        context: { identifier, attempts: existing.count }
      });
    }
  }

  // Security Context Validation
  private validateSecureContext(): void {
    // Check if running in secure context (HTTPS in production)
    if (this.config.httpsEnforcement && !window.isSecureContext) {
      this.reportSecurityViolation({
        type: 'UNAUTHORIZED',
        severity: SecurityLevel.HIGH,
        message: 'Application not running in secure context',
        source: 'CONTEXT_VALIDATION'
      });
    }

    // Check for development tools (basic detection)
    if (typeof window !== 'undefined') {
      const devtools = {
        open: false,
        orientation: null
      };

      setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
          if (!devtools.open) {
            devtools.open = true;
            this.reportSecurityViolation({
              type: 'SUSPICIOUS',
              severity: SecurityLevel.LOW,
              message: 'Developer tools potentially opened',
              source: 'DEVTOOLS_DETECTION'
            });
          }
        } else {
          devtools.open = false;
        }
      }, 500);
    }
  }

  // Violation Reporting
  private reportSecurityViolation(violationInput: Omit<SecurityViolation, 'id' | 'timestamp'>): void {
    const violation: SecurityViolation = {
      id: this.generateViolationId(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ...violationInput
    };

    this.violations.push(violation);

    // Keep only last 100 violations
    if (this.violations.length > 100) {
      this.violations.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🔒 Security Violation [${violation.severity}]:`, violation);
    }

    // Report to security monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendSecurityAlert(violation);
    }
  }

  private generateViolationId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendSecurityAlert(violation: SecurityViolation): void {
    // In production, send to security monitoring service
    fetch('/api/security/violations', {
      method: 'POST',
      headers: this.getSecureHeaders(),
      body: JSON.stringify(violation)
    }).catch(() => {
      // Silently fail if security reporting fails
    });
  }

  // Utility Methods
  public clearSensitiveData(): void {
    // Clear localStorage items containing sensitive data
    const sensitiveKeys = ['token', 'auth', 'session', 'user', 'password'];
    
    Object.keys(localStorage).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    sessionStorage.clear();
  }

  public getViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  public getSecurityReport(): {
    violations: SecurityViolation[];
    stats: Record<string, number>;
    config: SecurityConfig;
  } {
    const stats: Record<string, number> = {};
    
    this.violations.forEach(violation => {
      stats[violation.type] = (stats[violation.type] || 0) + 1;
    });

    return {
      violations: this.violations,
      stats,
      config: this.config
    };
  }

  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Hook for using security manager
export const useSecurity = () => {
  const securityManager = SecurityManager.getInstance();

  return {
    sanitizeInput: (input: string, type?: 'text' | 'html' | 'url' | 'email') => 
      securityManager.sanitizeInput(input, type),
    validateToken: (token: string) => securityManager.validateToken(token),
    getSecureHeaders: () => securityManager.getSecureHeaders(),
    checkLoginAttempts: (identifier: string) => securityManager.checkLoginAttempts(identifier),
    recordLoginAttempt: (identifier: string, success: boolean) => 
      securityManager.recordLoginAttempt(identifier, success),
    clearSensitiveData: () => securityManager.clearSensitiveData(),
    getSecurityReport: () => securityManager.getSecurityReport()
  };
};

export default SecurityManager;
