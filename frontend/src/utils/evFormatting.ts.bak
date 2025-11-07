/**
 * EV (Expected Value) formatting utilities for PropFinder
 * Provides consistent formatting, color coding, and display logic for EV data
 */

export interface EVDisplayConfig {
  showPositiveSign: boolean;
  showPercentSymbol: boolean;
  decimalPlaces: number;
  colorScale: {
    excellent: number;   // >= 8%
    good: number;        // >= 4%
    neutral: number;     // >= 0%
  };
}

const DEFAULT_CONFIG: EVDisplayConfig = {
  showPositiveSign: true,
  showPercentSymbol: true,
  decimalPlaces: 1,
  colorScale: {
    excellent: 8.0,
    good: 4.0,
    neutral: 0.0,
  },
};

/**
 * Formats EV percentage for display
 * @param evPercent - EV percentage value (-100 to 100+)
 * @param config - Optional formatting configuration
 * @returns Formatted EV string (e.g., "+12.3%" or "-4.5%")
 */
export function formatEvPercent(evPercent?: number | null, config: Partial<EVDisplayConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (evPercent === null || evPercent === undefined || !Number.isFinite(evPercent)) {
    return '--';
  }

  const formatted = evPercent.toFixed(cfg.decimalPlaces);
  const sign = evPercent > 0 && cfg.showPositiveSign ? '+' : '';
  const percent = cfg.showPercentSymbol ? '%' : '';
  
  return `${sign}${formatted}${percent}`;
}

/**
 * Gets the appropriate color class for EV percentage
 * @param evPercent - EV percentage value
 * @param config - Optional color scale configuration
 * @returns Tailwind CSS color class
 */
export function getEvColorClass(evPercent?: number | null, config: Partial<EVDisplayConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (evPercent === null || evPercent === undefined || !Number.isFinite(evPercent)) {
    return 'text-gray-400';
  }

  if (evPercent >= cfg.colorScale.excellent) {
    return 'text-green-400'; // Excellent EV (8%+)
  } else if (evPercent >= cfg.colorScale.good) {
    return 'text-amber-400'; // Good EV (4-7.99%)
  } else if (evPercent >= cfg.colorScale.neutral) {
    return 'text-yellow-400'; // Break-even/small positive
  } else {
    return 'text-gray-500'; // Negative EV - muted display
  }
}

/**
 * Gets the background color class for EV badges
 * @param evPercent - EV percentage value
 * @param config - Optional color scale configuration
 * @returns Tailwind CSS background color class
 */
export function getEvBadgeColorClass(evPercent?: number | null, config: Partial<EVDisplayConfig> = {}): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  if (evPercent === null || evPercent === undefined || !Number.isFinite(evPercent)) {
    return 'bg-gray-600';
  }

  if (evPercent >= cfg.colorScale.excellent) {
    return 'bg-green-600'; // Excellent EV badge
  } else if (evPercent >= cfg.colorScale.good) {
    return 'bg-amber-600'; // Good EV badge
  } else {
    return 'bg-gray-600'; // Default/neutral badge
  }
}

/**
 * Determines if EV percentage should show a badge/highlight
 * @param evPercent - EV percentage value
 * @param minThreshold - Minimum threshold for showing badge (default 4%)
 * @returns True if should show badge
 */
export function shouldShowEvBadge(evPercent?: number | null, minThreshold: number = 4.0): boolean {
  if (evPercent === null || evPercent === undefined || !Number.isFinite(evPercent)) {
    return false;
  }
  
  return evPercent >= minThreshold;
}

/**
 * Formats EV value (dollar amount) for display
 * @param evValue - EV value in dollars
 * @param decimalPlaces - Number of decimal places (default 2)
 * @returns Formatted EV value string (e.g., "$+2.45" or "-$1.20")
 */
export function formatEvValue(evValue?: number | null, decimalPlaces: number = 2): string {
  if (evValue === null || evValue === undefined || !Number.isFinite(evValue)) {
    return '--';
  }

  const abs = Math.abs(evValue);
  const sign = evValue > 0 ? '+' : evValue < 0 ? '-' : '';
  
  return `${sign}$${abs.toFixed(decimalPlaces)}`;
}

/**
 * Creates a tooltip text for EV explanation
 * @param evPercent - EV percentage value
 * @param evValue - EV value in dollars (optional)
 * @returns Tooltip text explaining the EV
 */
export function createEvTooltip(evPercent?: number | null, evValue?: number | null): string {
  if (evPercent === null || evPercent === undefined || !Number.isFinite(evPercent)) {
    return 'Expected Value not calculated';
  }

  const formattedPercent = formatEvPercent(evPercent);
  let tooltip = `Expected Value: ${formattedPercent}`;
  
  if (evValue !== null && evValue !== undefined && Number.isFinite(evValue)) {
    const formattedValue = formatEvValue(evValue);
    tooltip += ` (${formattedValue} per bet)`;
  }

  if (evPercent > 0) {
    tooltip += '\nPositive EV indicates expected profit';
  } else if (evPercent < 0) {
    tooltip += '\nNegative EV indicates expected loss';
  } else {
    tooltip += '\nBreakeven expected value';
  }

  return tooltip;
}

/**
 * Gets display priority for sorting opportunities by EV
 * Higher numbers = higher priority for display
 * @param evPercent - EV percentage value
 * @param isOutlier - Whether the opportunity is flagged as an outlier
 * @returns Priority score for sorting
 */
export function getEvDisplayPriority(evPercent?: number | null, isOutlier?: boolean): number {
  let priority = 0;

  if (evPercent !== null && evPercent !== undefined && Number.isFinite(evPercent)) {
    priority += Math.max(0, evPercent); // Add EV percentage directly
  }

  if (isOutlier) {
    priority += 10; // Bonus points for outlier status
  }

  return priority;
}

/**
 * Checks if an opportunity qualifies as a "value" play based on custom threshold
 * @param evPercent - EV percentage value
 * @param isOutlier - Whether flagged as outlier by backend
 * @param customThreshold - User's custom EV threshold (default 5%)
 * @returns True if qualifies as a value play
 */
export function isValuePlay(evPercent?: number | null, isOutlier?: boolean, customThreshold: number = 5.0): boolean {
  // Backend outlier flag takes precedence
  if (isOutlier) {
    return true;
  }

  // Otherwise check against custom threshold
  if (evPercent !== null && evPercent !== undefined && Number.isFinite(evPercent)) {
    return evPercent >= customThreshold;
  }

  return false;
}

/**
 * Classifies EV into UI pill tiers and returns label/color classes.
 * Pill thresholds (requested):
 * - Green:  >= 7%
 * - Orange: >= 4%
 * - Yellow: >= 2%
 * - Gray:   < 2%
 */
export type EVPillTier = 'green' | 'orange' | 'yellow' | 'gray';

export function classifyEvPillTier(evPercent?: number | null): EVPillTier {
  if (evPercent === null || evPercent === undefined || !Number.isFinite(evPercent)) {
    return 'gray';
  }
  if (evPercent >= 7) return 'green';
  if (evPercent >= 4) return 'orange';
  if (evPercent >= 2) return 'yellow';
  return 'gray';
}

export function getEvPillClasses(evPercent?: number | null): { bg: string; text: string; label: string } {
  const tier = classifyEvPillTier(evPercent);
  switch (tier) {
    case 'green':
      return { bg: 'bg-green-600', text: 'text-white', label: 'EV +' };
    case 'orange':
      return { bg: 'bg-orange-500', text: 'text-white', label: 'EV' };
    case 'yellow':
      return { bg: 'bg-yellow-500', text: 'text-black', label: 'EV' };
    case 'gray':
    default:
      return { bg: 'bg-gray-600', text: 'text-white', label: 'EV' };
  }
}