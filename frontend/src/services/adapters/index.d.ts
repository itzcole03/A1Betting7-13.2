declare class AdapterManager {
  private static instance;
  private adapters;
  private constructor();
  static getInstance(): AdapterManager;
  private initializeAdapters;
  getAdapter<T>(name: string): T | undefined;
  registerAdapter(name: string, adapter: unknown): void;
  isAdapterEnabled(name: string): boolean;
}
export declare const _adapterManager: AdapterManager;
export default adapterManager;
