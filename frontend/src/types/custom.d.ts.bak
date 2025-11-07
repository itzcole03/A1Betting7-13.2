interface Performance {
  memory?: {
    totalJSHeapSize: number;
    usedJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface Navigator {
  connection?: NetworkInformation;
}

interface NetworkInformation extends EventTarget {
  readonly rtt?: number;
  readonly downlink?: number;
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly saveData?: boolean;
  onchange?: EventListener;
} 