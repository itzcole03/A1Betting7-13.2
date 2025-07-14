export declare function generateCSRFToken(): string;
export declare function validateCSRFToken(token: string | null): boolean;
export declare function getCSRFToken(): string | null;
export declare function sanitizeInput(input: string): string;
export declare function sanitizeObject<
  T extends Record<string, string | number | boolean | object>,
>(obj: T): T;
export declare function getSecurityHeaders(): Record<string, string>;
export declare function validateEmail(email: string): boolean;
export declare function validatePassword(password: string): boolean;
export declare function validateUsername(username: string): boolean;
export declare function getRateLimitHeaders(
  remaining: number,
  reset: number
): Record<string, string>;
