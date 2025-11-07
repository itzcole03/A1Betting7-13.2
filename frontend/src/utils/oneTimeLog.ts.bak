/**
 * One-time logging utility to prevent console noise from repeated warnings
 * Uses signature hashing to track which warnings have been logged
 */

const loggedSignatures = new Set<string>();

/**
 * Generates a simple hash for a log signature to track uniqueness
 */
function generateSignature(key: string, message?: string): string {
  return `${key}:${message || 'generic'}`;
}

/**
 * Logs a message only once per session for a given signature
 * @param key - Unique identifier for the log type
 * @param logFn - Function to execute for logging
 * @param message - Optional message to include in signature
 */
export function oneTimeLog(key: string, logFn: () => void, message?: string): void {
  const signature = generateSignature(key, message);
  
  if (!loggedSignatures.has(signature)) {
    loggedSignatures.add(signature);
    logFn();
  }
}

/**
 * Clears all logged signatures (useful for testing)
 */
export function clearLoggedSignatures(): void {
  loggedSignatures.clear();
}

/**
 * Gets the count of unique signatures logged
 */
export function getLoggedCount(): number {
  return loggedSignatures.size;
}