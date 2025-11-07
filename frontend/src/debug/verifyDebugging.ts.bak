// Quick verification that our debugging infrastructure is working
console.log('=== Runtime Debug Infrastructure Verification ===');

// Check if runtimeDebug is loaded
if (typeof window !== 'undefined') {
  console.log('✅ Window object available');
  
  if (window.__runtimeErrorTester) {
    console.log('✅ Runtime error tester available');
  } else {
    console.log('❌ Runtime error tester not available');
  }
  
  if (window.onerror) {
    console.log('✅ Global error handler installed');
  } else {
    console.log('❌ Global error handler missing');
  }
  
  if (window.addEventListener) {
    console.log('✅ Event listeners supported');
  }
}

// Test safe object operations
try {
  const { safeObjectKeys } = await import('../utils/objectGuards');
  const testResult = safeObjectKeys(null);
  console.log('✅ Safe object guards working:', testResult);
} catch (error) {
  console.log('❌ Safe object guards failed:', error);
}

// Test safe environment
try {
  const { SafeEnvironment } = await import('../utils/safeEnvironment');
  const env = new SafeEnvironment();
  const testEnv = env.resolveEnvVar('VITE_APP_TITLE', 'DEFAULT');
  console.log('✅ Safe environment working:', testEnv);
} catch (error) {
  console.log('❌ Safe environment failed:', error);
}

console.log('=== Verification Complete ===');

export {};