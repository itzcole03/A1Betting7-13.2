// Loosen the unified registry type so lightweight runtime adapters are assignable
declare module '../services/unified/UnifiedServiceRegistry' {
  interface UnifiedServiceRegistry {
    // allow additional public members for adapter compatibility
    [key: string]: any;
  }
  export { UnifiedServiceRegistry };
}
