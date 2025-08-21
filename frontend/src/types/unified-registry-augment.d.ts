// Ambient declaration to expose the public shape of UnifiedServiceRegistry for casting
import { UnifiedServiceRegistry } from '../services/unified/UnifiedServiceRegistry';

declare module '../services/unified/UnifiedServiceRegistry' {
  // Ensure the exported class type includes `services` and `getAllServices` as public members
  interface UnifiedServiceRegistry {
    services?: Map<string, any>;
    getAllServices?: () => Map<string, any>;
  }
  export { UnifiedServiceRegistry };
}
