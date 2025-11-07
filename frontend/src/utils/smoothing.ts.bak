import { PerformancePoint } from '../components/charts/PlayerPerformanceChart';

// Simple moving average (SMA) - returns a new array
export function movingAverage(pts: PerformancePoint[], window = 3): PerformancePoint[] {
  if (!window || window <= 1) return pts.slice();
  const res: PerformancePoint[] = [];
  for (let i = 0; i < pts.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = pts.slice(start, i + 1);
    const avgActual = Math.round(slice.reduce((s, p) => s + p.actual, 0) / slice.length);
    const avgLine = Math.round(slice.reduce((s, p) => s + p.line, 0) / slice.length);
    res.push({ ...pts[i], actual: avgActual, line: avgLine });
  }
  return res;
}

// Exponential moving average (EMA)
// alpha = 2 / (window + 1)
export function exponentialMovingAverage(pts: PerformancePoint[], window = 3): PerformancePoint[] {
  if (!window || window <= 1) return pts.slice();
  const alpha = 2 / (window + 1);
  const res: PerformancePoint[] = [];
  let prevActual: number | null = null;
  let prevLine: number | null = null;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    // ensure both prevActual and prevLine are initialized together
    if (prevActual === null || prevLine === null) {
      prevActual = p.actual;
      prevLine = p.line;
    } else {
      prevActual = Math.round(alpha * p.actual + (1 - alpha) * prevActual);
      prevLine = Math.round(alpha * p.line + (1 - alpha) * prevLine);
    }
    res.push({ ...p, actual: prevActual as number, line: prevLine as number });
  }

  return res;
}

export type SmoothingMethod = 'sma' | 'ema' | 'none';

export function applySmoothing(pts: PerformancePoint[], method: SmoothingMethod, window = 3) {
  if (method === 'sma') return movingAverage(pts, window);
  if (method === 'ema') return exponentialMovingAverage(pts, window);
  return pts.slice();
}
