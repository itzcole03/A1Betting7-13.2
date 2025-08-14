// Test script to verify API configuration unification
// This tests that our apiConfig.ts properly exports the unified URLs

console.log('🧪 Testing API Configuration Unification...');

// Test environment variables
console.log('\n📋 Environment Variables:');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'undefined (using default)');
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL || 'undefined (using default)');
console.log('VITE_DEV_LEAN_MODE:', import.meta.env.VITE_DEV_LEAN_MODE || 'undefined (using default)');

// Test unified configuration
import { API_BASE_URL, WS_URL, DEV_CONFIG } from './src/config/apiConfig.js';

console.log('\n⚙️ Unified Configuration:');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('WS_URL:', WS_URL);
console.log('DEV_CONFIG.leanMode:', DEV_CONFIG.leanMode);

// Test lean mode utility
import { isLeanMode, getLeanModeStatus } from './src/utils/leanMode.js';

console.log('\n🔧 Lean Mode Status:');
console.log('isLeanMode():', isLeanMode());
console.log('getLeanModeStatus():', JSON.stringify(getLeanModeStatus(), null, 2));

// Test API connectivity
console.log('\n🔗 Testing API Connectivity...');
try {
  const response = await fetch(`${API_BASE_URL}/health`);
  const healthData = await response.json();
  console.log('✅ Backend Health Check:', healthData);
} catch (error) {
  console.log('❌ Backend Health Check Failed:', error.message);
}

console.log('\n✅ API Configuration Test Complete!');
