// CLV Formatting Utilities for PropFinder Frontend Integration

/**
 * Format CLV percentage for display with appropriate precision
 * @param value - CLV percentage value (e.g., 5.25 for 5.25%)
 * @returns Formatted string (e.g., "5.25%" or "--" for null/undefined)
 */
export function formatClvPercent(value?: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  
  // Use 0 decimal places for values >= 10% or <= -10%
  // Use 2 decimal places for smaller values for better precision
  const decimals = Math.abs(value) >= 10 ? 0 : 2;
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get color for CLV value based on performance bands
 * @param value - CLV percentage value
 * @returns Hex color string
 */
export function clvColor(value?: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '#6b7280'; // gray-500 - neutral/no data
  }
  
  if (value >= 5) {
    return '#10b981'; // green-500 - excellent CLV (5%+)
  }
  
  if (value >= 1) {
    return '#f59e0b'; // amber-500 - good CLV (1-4.99%)
  }
  
  if (value > -1) {
    return '#9ca3af'; // gray-400 - fair/neutral CLV (-1 to 0.99%)
  }
  
  return '#ef4444'; // red-500 - poor CLV (-1% or worse)
}

/**
 * Get CSS classes for CLV badge styling
 * @param value - CLV percentage value
 * @returns Object with color and background color classes
 */
export function clvBadgeClasses(value?: number | null): {
  backgroundColor: string;
  color: string;
  borderColor?: string;
} {
  const bgColor = clvColor(value);
  
  return {
    backgroundColor: bgColor,
    color: '#ffffff', // Always white text for better contrast
    borderColor: bgColor
  };
}

/**
 * Get descriptive text for CLV value
 * @param value - CLV percentage value
 * @returns Descriptive text (e.g., "Excellent", "Good", "Poor", etc.)
 */
export function clvDescription(value?: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'No Data';
  }
  
  if (value >= 5) return 'Excellent';
  if (value >= 1) return 'Good';
  if (value >= -1) return 'Fair';
  return 'Poor';
}

/**
 * Get CLV tooltip text with explanation
 * @param value - CLV percentage value
 * @returns Tooltip text explaining CLV and its value
 */
export function clvTooltip(value?: number | null): string {
  const baseExplanation = 'CLV = (Closing Line - Opening Line) / Opening Line × 100';
  
  if (value === null || value === undefined || isNaN(value)) {
    return `${baseExplanation}. No closing line data available.`;
  }
  
  const formattedValue = formatClvPercent(value);
  const description = clvDescription(value);
  
  return `${baseExplanation}. Current CLV: ${formattedValue} (${description})`;
}

/**
 * Sort function for CLV values (handles null/undefined values)
 * @param a - First CLV value
 * @param b - Second CLV value
 * @param descending - Sort order (default: true for descending)
 * @returns Sort comparison result
 */
export function sortByClv(
  a?: number | null, 
  b?: number | null, 
  descending: boolean = true
): number {
  // Handle null/undefined values (put them at the end)
  if ((a === null || a === undefined) && (b === null || b === undefined)) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  
  const diff = a - b;
  return descending ? -diff : diff;
}

/**
 * Filter function to check if opportunity has CLV data
 * @param opportunity - Opportunity object with potential CLV data
 * @returns True if opportunity has valid CLV data
 */
export function hasClvData(opportunity: { clvPercent?: number | null }): boolean {
  return opportunity.clvPercent !== null && 
         opportunity.clvPercent !== undefined && 
         !isNaN(opportunity.clvPercent);
}

/**
 * CLV performance bands for filtering/grouping
 */
export const CLV_BANDS = {
  EXCELLENT: { min: 5, label: 'Excellent (5%+)', color: '#10b981' },
  GOOD: { min: 1, max: 4.99, label: 'Good (1-5%)', color: '#f59e0b' },
  FAIR: { min: -1, max: 0.99, label: 'Fair (-1% to 1%)', color: '#9ca3af' },
  POOR: { max: -1.01, label: 'Poor (< -1%)', color: '#ef4444' }
} as const;

/**
 * Get CLV performance band for a given value
 * @param value - CLV percentage value
 * @returns Band information or null for invalid values
 */
export function getClvBand(value?: number | null): typeof CLV_BANDS[keyof typeof CLV_BANDS] | null {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }
  
  if (value >= CLV_BANDS.EXCELLENT.min) return CLV_BANDS.EXCELLENT;
  if (value >= CLV_BANDS.GOOD.min && value <= CLV_BANDS.GOOD.max) return CLV_BANDS.GOOD;
  if (value >= CLV_BANDS.FAIR.min && value <= CLV_BANDS.FAIR.max) return CLV_BANDS.FAIR;
  return CLV_BANDS.POOR;
}