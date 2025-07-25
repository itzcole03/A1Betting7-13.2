export declare function generateCSRFToken(): string;
export declare function validateCSRFToken(_token: string | null): boolean;
export declare function getCSRFToken(): string | null;
export declare function sanitizeInput(_input: string): string;
export declare function sanitizeObject<
  T extends Record<string, string | number | boolean | object>,
>(obj: T): T;
export declare function getSecurityHeaders(): Record<string, string>;
export declare function validateEmail(_email: string): boolean;
export declare function validatePassword(_password: string): boolean;
export declare function validateUsername(_username: string): boolean;
export declare function getRateLimitHeaders(_remaining: number, _reset: number): Record<string, string>;
