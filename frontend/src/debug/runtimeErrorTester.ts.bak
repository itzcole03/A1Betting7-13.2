/**
 * Runtime Error Testing and Debugging Utilities
 * 
 * This file provides utilities to help diagnose and reproduce the 
 * "Cannot convert undefined or null to object" runtime error.
 */

import runtimeDebug from '../runtimeDebug';

/**
 * Test utilities to trigger common null object errors
 */
export class RuntimeErrorTester {
  
  /**
   * Test Object.keys() with null/undefined
   */
  static testObjectKeys(): void {
    console.group('[RuntimeErrorTest] Testing Object.keys() scenarios');
    
    try {
      console.log('Testing Object.keys(null)...');
      Object.keys(null as any);
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
    try {
      console.log('Testing Object.keys(undefined)...');
      Object.keys(undefined as any);
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
    console.groupEnd();
  }

  /**
   * Test spread operations with null/undefined
   */
  static testSpreadOperations(): void {
    console.group('[RuntimeErrorTest] Testing spread operation scenarios');
    
    try {
      console.log('Testing {...null}...');
      const result = {...(null as any)};
      console.log('Unexpected success:', result);
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
    try {
      console.log('Testing {...undefined}...');
      const result = {...(undefined as any)};
      console.log('Unexpected success:', result);
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
    console.groupEnd();
  }

  /**
   * Test destructuring with null/undefined
   */
  static testDestructuring(): void {
    console.group('[RuntimeErrorTest] Testing destructuring scenarios');
    
    try {
      console.log('Testing const { x } = null...');
      const { x } = null as any;
      console.log('Unexpected success:', x);
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
    try {
      console.log('Testing const { x } = undefined...');
      const { x } = undefined as any;
      console.log('Unexpected success:', x);
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
    console.groupEnd();
  }

  /**
   * Test scenarios that might occur during bootstrap
   */
  static testBootstrapScenarios(): void {
    console.group('[RuntimeErrorTest] Testing bootstrap-like scenarios');
    
    // Simulate undefined options object
    try {
      console.log('Testing options processing...');
      const options = undefined;
      const keys = Object.keys(options as any);
      console.log('Unexpected success:', keys);
    } catch (error) {
      console.log('✅ Caught bootstrap-like error:', error.message);
    }

    // Simulate undefined config
    try {
      console.log('Testing config spread...');
      const config = undefined;
      const merged = { ...config, enabled: true };
      console.log('Unexpected success:', merged);
    } catch (error) {
      console.log('✅ Caught config-like error:', error.message);
    }

    // Simulate undefined environment variables
    try {
      console.log('Testing env var processing...');
      const env = undefined;
      const envKeys = Object.keys(env as any);
      console.log('Unexpected success:', envKeys);
    } catch (error) {
      console.log('✅ Caught env-like error:', error.message);
    }
    
    console.groupEnd();
  }

  /**
   * Run all tests
   */
  static runAllTests(): void {
    console.log('🧪 Starting runtime error reproduction tests...');
    
    this.testObjectKeys();
    this.testSpreadOperations();
    this.testDestructuring();
    this.testBootstrapScenarios();
    
    console.log('🧪 Runtime error tests completed');
  }

  /**
   * Trigger the manual test error from runtimeDebug
   */
  static triggerManualTestError(): void {
    try {
      runtimeDebug.triggerTestError();
    } catch (error) {
      console.log('Manual test error triggered successfully');
    }
  }

  /**
   * Start monitoring for bootstrap errors
   */
  static startBootstrapMonitoring(): void {
    runtimeDebug.captureBootstrapError();
  }
}

/**
 * Bootstrap error checker - looks for common patterns that might cause issues
 */
export class BootstrapErrorChecker {
  
  /**
   * Check for potential null object issues in the current environment
   */
  static checkEnvironment(): void {
    console.group('[BootstrapCheck] Environment Analysis');
    
    // Check import.meta
    try {
      console.log('import.meta availability:', {
        exists: typeof import.meta !== 'undefined',
        hasEnv: typeof import.meta !== 'undefined' && !!import.meta.env,
        env: typeof import.meta !== 'undefined' ? import.meta.env : 'N/A'
      });
    } catch (error) {
      console.log('import.meta check error:', error.message);
    }

    // Check process.env
    try {
      console.log('process.env availability:', {
        exists: typeof process !== 'undefined',
        hasEnv: typeof process !== 'undefined' && !!process.env,
        nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'N/A'
      });
    } catch (error) {
      console.log('process.env check error:', error.message);
    }

    // Check localStorage
    try {
      console.log('localStorage availability:', {
        exists: typeof localStorage !== 'undefined',
        canAccess: (() => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })()
      });
    } catch (error) {
      console.log('localStorage check error:', error.message);
    }

    console.groupEnd();
  }

  /**
   * Monitor for Object operations on potentially null values
   */
  static monitorObjectOperations(): void {
    if (typeof window !== 'undefined') {
      const originalObjectKeys = Object.keys;
      const originalObjectEntries = Object.entries;
      const originalObjectValues = Object.values;
      
      Object.keys = function(obj: any) {
        if (obj === null || obj === undefined) {
          console.warn('[BootstrapCheck] Object.keys called with null/undefined:', {
            value: obj,
            stack: new Error().stack
          });
        }
        return originalObjectKeys.call(this, obj);
      };

      Object.entries = function(obj: any) {
        if (obj === null || obj === undefined) {
          console.warn('[BootstrapCheck] Object.entries called with null/undefined:', {
            value: obj,
            stack: new Error().stack
          });
        }
        return originalObjectEntries.call(this, obj);
      };

      Object.values = function(obj: any) {
        if (obj === null || obj === undefined) {
          console.warn('[BootstrapCheck] Object.values called with null/undefined:', {
            value: obj,
            stack: new Error().stack
          });
        }
        return originalObjectValues.call(this, obj);
      };
      
      console.log('[BootstrapCheck] Object operation monitoring enabled');
    }
  }

  /**
   * Restore original Object methods
   */
  static restoreObjectMethods(): void {
    // Note: This is a simplified restore - in practice, you'd want to store the originals
    console.log('[BootstrapCheck] Note: Object method restore not implemented in this example');
  }
}

// Export for global access during debugging
if (typeof window !== 'undefined') {
  (window as any).__runtimeErrorTester = RuntimeErrorTester;
  (window as any).__bootstrapErrorChecker = BootstrapErrorChecker;
}

export default {
  RuntimeErrorTester,
  BootstrapErrorChecker,
};