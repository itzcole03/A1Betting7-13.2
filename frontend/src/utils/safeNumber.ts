/**
 * Safe number formatting utility to prevent runtime errors
 * Replaces unsafe .toFixed() calls throughout the codebase
 */

export type SafeNumberInput = number | string | null | undefined;

/**
 * Safely formats a number to a fixed number of decimal places
 * @param value - The value to format (can be number, string, null, or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - Fallback value if input is invalid (default: "0.00")
 * @returns Formatted string
 */
export function safeNumber(
  value: SafeNumberInput,
  decimals: number = 2,
  fallback: string = '0.00'
): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof numValue !== 'number' || isNaN(numValue) || !isFinite(numValue)) {
    return fallback;
  }
  try {
    return numValue.toFixed(Math.max(0, Math.floor(decimals)));
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely formats a percentage value
 * @param value - The value to format as percentage (0.85 becomes "85.0%")
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function safePercentage(value: SafeNumberInput, decimals: number = 1): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof numValue !== 'number' || isNaN(numValue) || !isFinite(numValue)) {
    return '0.0%';
  }
  try {
    return `${(numValue * 100).toFixed(Math.max(0, Math.floor(decimals)))}%`;
  } catch (error) {
    return '0.0%';
  }
}

/**
 * Safely formats currency values
 * @param value - The value to format as currency
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - Currency symbol (default: "$")
 * @returns Formatted currency string
 */
export function safeCurrency(
  value: SafeNumberInput,
  decimals: number = 2,
  currency: string = '$'
): string {
  const formatted = safeNumber(value, decimals, '0.00');
  return `${currency}${formatted}`;
}

/**
 * Safely formats large numbers with K/M/B suffixes
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with suffix
 */
export function safeCompactNumber(value: SafeNumberInput, decimals: number = 1): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof numValue !== 'number' || isNaN(numValue) || !isFinite(numValue)) {
    return '0';
  }
  const abs = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '';
  if (abs >= 1e9) {
    return `${sign}${safeNumber(abs / 1e9, decimals)}B`;
  } else if (abs >= 1e6) {
    return `${sign}${safeNumber(abs / 1e6, decimals)}M`;
  } else if (abs >= 1e3) {
    return `${sign}${safeNumber(abs / 1e3, decimals)}K`;
  } else {
    return `${sign}${safeNumber(abs, 0)}`;
  }
}

/**
 * Safely performs division with fallback for division by zero
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param fallback - Fallback value for division by zero (default: 0)
 * @returns Result of division or fallback
 */
export function safeDivision(
  numerator: SafeNumberInput,
  denominator: SafeNumberInput,
  fallback: number = 0
): number {
  const num = typeof numerator === 'string' ? parseFloat(numerator) : numerator;
  const den = typeof denominator === 'string' ? parseFloat(denominator) : denominator;
  if (
    typeof num !== 'number' ||
    isNaN(num) ||
    !isFinite(num) ||
    typeof den !== 'number' ||
    isNaN(den) ||
    !isFinite(den) ||
    den === 0
  ) {
    return fallback;
  }
  const result = num / den;
  return typeof result !== 'number' || isNaN(result) || !isFinite(result) ? fallback : result;
}

/**
 * Safely calculates percentage change between two values
 * @param oldValue - The original value
 * @param newValue - The new value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage change string
 */
export function safePercentageChange(
  oldValue: SafeNumberInput,
  newValue: SafeNumberInput,
  decimals: number = 1
): string {
  const oldNum = typeof oldValue === 'string' ? parseFloat(oldValue) : oldValue;
  const newNum = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
  if (
    typeof oldNum !== 'number' ||
    isNaN(oldNum) ||
    !isFinite(oldNum) ||
    oldNum === 0 ||
    typeof newNum !== 'number' ||
    isNaN(newNum) ||
    !isFinite(newNum)
  ) {
    return '0.0%';
  }
  const change = ((newNum - oldNum) / oldNum) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${safeNumber(change, decimals)}%`;
}

/**
 * Export all utilities as default for convenience
 */
export default {
  safeNumber,
  safePercentage,
  safeCurrency,
  safeCompactNumber,
  safeDivision,
  safePercentageChange,
};
