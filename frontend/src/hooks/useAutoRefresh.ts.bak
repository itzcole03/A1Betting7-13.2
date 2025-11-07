import { useEffect, useRef } from 'react';
import { autoRefreshService } from '../services/AutoRefreshService';

type UseAutoRefreshOptions = {
  intervalMs?: number;
  enabled?: boolean;
  invokeImmediately?: boolean;
};

/**
 * Hook to subscribe to the centralized AutoRefreshService.
 * - callback: function to run on each effective tick for this subscriber
 * - options.intervalMs: desired interval for this subscriber in ms
 * - options.enabled: whether subscription is active
 * - options.invokeImmediately: call callback once on subscribe
 */
export default function useAutoRefresh(
  callback: () => void | Promise<void>,
  { intervalMs = 30000, enabled = true, invokeImmediately = false }: UseAutoRefreshOptions = {}
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = autoRefreshService.subscribe(
      () => cbRef.current(),
      intervalMs,
      invokeImmediately
    );

    return () => {
      unsubscribe();
    };
    // intentionally not including callback in deps — cbRef handles changes
  }, [intervalMs, enabled, invokeImmediately]);
}
