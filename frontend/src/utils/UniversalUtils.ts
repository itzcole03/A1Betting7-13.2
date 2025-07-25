// ============================================================================
// UNIVERSAL UTILITIES - Consolidated helper functions;
// ============================================================================

// Format utilities;
export const _formatters = {
  currency: (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  percentage: (value: number, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  number: (value: number, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  date: (date: Date | string, format = 'short') => {
    const _d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: format as 'short' | 'medium' | 'long' | 'full',
      timeStyle: format === 'full' ? 'short' : undefined,
    }).format(_d);
  },

  time: (date: Date | string) => {
    const _d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
    }).format(_d);
  },

  compact: (value: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  },
};

// Analytics utilities;
export const _analytics = {
  calculateWinRate: (wins: number, total: number) => {
    return total > 0 ? wins / total : 0;
  },

  calculateProfit: (bets: Array<{ amount: number; outcome: string }>) => {
    return bets.reduce((total, bet) => {
      return total + (bet.outcome === 'won' ? bet.amount : -bet.amount);
    }, 0);
  },

  calculateROI: (profit: number, investment: number) => {
    return investment > 0 ? profit / investment : 0;
  },

  calculateConfidenceInterval: (value: number, confidence = 0.95, sampleSize = 100) => {
    // Z-score for 95% confidence is ~1.96
    const z = confidence === 0.95 ? 1.96 : 1.64;
    const margin = z * Math.sqrt((value * (1 - value)) / sampleSize);
    return {
      lower: Math.max(0, value - margin),
      upper: Math.min(1, value + margin),
    };
  },

  calculateSharpeRatio: (returns: number[], riskFreeRate = 0.02): number => {
    if (returns.length === 0) return 0;
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev === 0 ? 0 : (meanReturn - riskFreeRate) / stdDev;
  },

  calculateKellyCriterion: (winRate: number, avgWin: number, avgLoss: number) => {
    if (avgLoss === 0) return 0;
    const b = avgWin / Math.abs(avgLoss);
    return (winRate * (b + 1) - 1) / b;
  },
};

// Validation utilities;
export const _validators = {
  email: (email: string) => {
    const regex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email);
  },

  phone: (phone: string) => {
    const regex = /^\+?\d{10,15}$/;
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  password: (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":Record<string, any>|<>]/.test(password),
    };
  },

  betAmount: (amount: number, balance: number, maxBet = 1000) => {
    return {
      isPositive: amount > 0,
      hasBalance: amount <= balance,
      withinLimit: amount <= maxBet,
      isValid: amount > 0 && amount <= balance && amount <= maxBet,
    };
  },
};

// Color utilities;
export const _colors = {
  getConfidenceColor: (confidence: number) => {
    if (confidence >= 80) return '#06ffa5';
    if (confidence >= 60) return '#fbbf24';
    return '#ff4757';
  },

  getProfitColor: (value: number) => {
    if (value > 0) return '#06ffa5';
    if (value < 0) return '#ff4757';
    return '#94a3b8';
  },

  getStatusColor: (status: string) => {
    switch (status.toLowerCase()) {
      case 'won':
      case 'success':
      case 'active':
        return '#06ffa5';
      case 'lost':
      case 'error':
      case 'failed':
        return '#ff4757';
      case 'pending':
      case 'waiting':
        return '#fbbf24';
      default:
        return '#94a3b8';
    }
  },
};

// Storage utilities;
export const _storage = {
  set: (key: string, value: unknown) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },

  get: (key: string, defaultValue: unknown = null) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },

  remove: (key: string) => {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },

  clear: () => {
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  },
};

// Debounce utility;
export const _debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    if (immediate && !timeout) {
      func(...args);
    }
    timeout = setTimeout(() => {
      if (!immediate) func(...args);
      timeout = null;
    }, wait);
  };
};

// Throttle utility;
export const _throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      func(...args);
      lastCall = now;
    }
  };
};

// Array utilities;
export const _arrayUtils = {
  chunk: <T>(array: T[], size: number): T[][] => {
    const _chunks: T[][] = [];
    for (let _i = 0; _i < array.length; _i += size) {
      _chunks.push(array.slice(_i, _i + size));
    }
    return _chunks;
  },

  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const _group = String(item[key]);
      return {
        ...groups,
        [_group]: [...(groups[_group] || []), item],
      };
    }, {} as Record<string, T[]>);
  },

  sortBy: <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const _aVal = a[key];
      const _bVal = b[key];
      if (_aVal < _bVal) return direction === 'asc' ? -1 : 1;
      if (_aVal > _bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },
};

// URL utilities;
export const _url = {
  getParams: (): Record<string, string> => {
    const _result: Record<string, string> = {};
    const _params = new URLSearchParams(window.location.search);
    _params.forEach((value, key) => {
      _result[key] = value;
    });
    return _result;
  },

  setParam: (key: string, value: string) => {
    const _url = new URL(window.location.href);
    _url.searchParams.set(key, value);
    window.history.replaceState({}, '', _url.toString());
  },

  removeParam: (key: string) => {
    const _url = new URL(window.location.href);
    _url.searchParams.delete(key);
    window.history.replaceState({}, '', _url.toString());
  },
};

// Device utilities;
export const _device = {
  isMobile: () => window.innerWidth <= 768,
  isTablet: () => window.innerWidth > 768 && window.innerWidth <= 1024,
  isDesktop: () => window.innerWidth > 1024,

  getBreakpoint: () => {
    const _width = window.innerWidth;
    if (_width <= 640) return 'sm';
    if (_width <= 768) return 'md';
    if (_width <= 1024) return 'lg';
    if (_width <= 1280) return 'xl';
    return '2xl';
  },
};

// Safe number utility
export function safeNumber(_val: unknown, _fallback: number = 0): number {
  if (typeof _val === 'number' && !isNaN(_val) && isFinite(_val)) return _val;
  if (typeof _val === 'string') {
    const _n = Number(_val);
    if (!isNaN(_n) && isFinite(_n)) return _n;
  }
  return _fallback;
}

// Export everything as default object for convenience;
export default {
  _formatters,
  _analytics,
  _validators,
  _colors,
  _storage,
  _debounce,
  _throttle,
  _arrayUtils,
  _url,
  _device,
};
