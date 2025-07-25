import {
  safeNumber,
  safePercentage,
  safeCurrency,
  safeCompactNumber,
  safeDivision,
  safePercentageChange,
  SafeNumberInput,
} from '../safeNumber';

describe('safeNumber utils', () => {
  // Test safeNumber
  it('safeNumber should format a number correctly', () => {
    expect(safeNumber(123.456, 2)).toBe('123.46');
    expect(safeNumber(123, 0)).toBe('123');
    expect(safeNumber(0.123, 3)).toBe('0.123');
    expect(safeNumber(100.00, 2)).toBe('100.00');
  });

  it('safeNumber should handle string input', () => {
    expect(safeNumber('123.456', 2)).toBe('123.46');
    expect(safeNumber('100', 0)).toBe('100');
  });

  it('safeNumber should handle invalid input with fallback', () => {
    expect(safeNumber(null)).toBe('0.00');
    expect(safeNumber(undefined)).toBe('0.00');
    expect(safeNumber('')).toBe('0.00');
    expect(safeNumber('abc')).toBe('0.00');
    expect(safeNumber(NaN)).toBe('0.00');
    expect(safeNumber(Infinity)).toBe('0.00');
    expect(safeNumber(-Infinity)).toBe('0.00');
    expect(safeNumber(null, 2, 'N/A')).toBe('N/A');
  });

  // Test safePercentage
  it('safePercentage should format a percentage correctly', () => {
    expect(safePercentage(0.85, 1)).toBe('85.0%');
    expect(safePercentage(0.1234, 2)).toBe('12.34%');
    expect(safePercentage(1, 0)).toBe('100%');
    expect(safePercentage(0, 0)).toBe('0%');
  });

  it('safePercentage should handle invalid input with default fallback', () => {
    expect(safePercentage(null)).toBe('0.0%');
    expect(safePercentage(undefined)).toBe('0.0%');
    expect(safePercentage('')).toBe('0.0%');
    expect(safePercentage('abc')).toBe('0.0%');
    expect(safePercentage(NaN)).toBe('0.0%');
  });

  // Test safeCurrency
  it('safeCurrency should format currency correctly', () => {
    expect(safeCurrency(123.456)).toBe('$123.46');
    expect(safeCurrency(100, 0, '€')).toBe('€100');
    expect(safeCurrency(99.999, 2, '£')).toBe('£100.00');
  });

  it('safeCurrency should handle invalid input with default fallback', () => {
    expect(safeCurrency(null)).toBe('$0.00');
    expect(safeCurrency('abc')).toBe('$0.00');
  });

  // Test safeCompactNumber
  it('safeCompactNumber should format large numbers with suffixes', () => {
    expect(safeCompactNumber(1234, 1)).toBe('1.2K');
    expect(safeCompactNumber(1234567, 1)).toBe('1.2M');
    expect(safeCompactNumber(1234567890, 1)).toBe('1.2B');
    expect(safeCompactNumber(999, 0)).toBe('999');
    expect(safeCompactNumber(-1234, 1)).toBe('-1.2K');
  });

  it('safeCompactNumber should handle invalid input with default fallback', () => {
    expect(safeCompactNumber(null)).toBe('0');
    expect(safeCompactNumber('abc')).toBe('0');
  });

  // Test safeDivision
  it('safeDivision should perform division correctly', () => {
    expect(safeDivision(10, 2)).toBe(5);
    expect(safeDivision(10, 3, 0)).toBeCloseTo(3.333);
    expect(safeDivision(10, 0)).toBe(0); // Default fallback
    expect(safeDivision(10, 0, -1)).toBe(-1); // Custom fallback
    expect(safeDivision('10', '2')).toBe(5);
  });

  it('safeDivision should handle invalid input with fallback', () => {
    expect(safeDivision(null, 2)).toBe(0);
    expect(safeDivision(10, null)).toBe(0);
    expect(safeDivision('abc', 2)).toBe(0);
    expect(safeDivision(10, 'xyz')).toBe(0);
  });

  // Test safePercentageChange
  it('safePercentageChange should calculate percentage change correctly', () => {
    expect(safePercentageChange(100, 120, 1)).toBe('+20.0%');
    expect(safePercentageChange(100, 80, 1)).toBe('-20.0%');
    expect(safePercentageChange(10, 10, 1)).toBe('+0.0%');
    expect(safePercentageChange(0, 10, 1)).toBe('0.0%'); // Division by zero fallback
  });

  it('safePercentageChange should handle invalid input with default fallback', () => {
    expect(safePercentageChange(null, 10)).toBe('0.0%');
    expect(safePercentageChange(10, undefined)).toBe('0.0%');
    expect(safePercentageChange('abc', 10)).toBe('0.0%');
    expect(safePercentageChange(10, 'xyz')).toBe('0.0%');
  });
}); 