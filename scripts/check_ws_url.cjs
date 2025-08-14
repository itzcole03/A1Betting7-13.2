#!/usr/bin/env node

/**
 * WebSocket URL Validation Script
 * =================================
 * Checks if WS_URL is set in environment or can be derived from configuration.
 * This script validates WebSocket URL derivation as part of stabilization testing.
 * 
 * Exit Codes:
 * - 0: WebSocket URL validation successful
 * - 1: WebSocket URL validation failed
 */

const process = require('process');

/**
 * Check WebSocket URL availability and derivation
 * @returns {boolean} True if WebSocket URL is available or can be derived
 */
function checkWebSocketUrl() {
    console.log('🔍 Checking WebSocket URL configuration...');
    
    // Check environment variable first (highest precedence)
    const wsUrl = process.env.WS_URL;
    
    if (wsUrl) {
        console.log(`✅ WS_URL environment variable found: ${wsUrl}`);
        
        // Validate URL format
        try {
            const url = new URL(wsUrl);
            if (url.protocol === 'ws:' || url.protocol === 'wss:') {
                console.log(`✅ Valid WebSocket URL format`);
                return true;
            } else {
                console.error(`❌ Invalid WebSocket protocol: ${url.protocol} (expected ws: or wss:)`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Invalid WebSocket URL format: ${error.message}`);
            return false;
        }
    }
    
    // Try to derive from backend configuration
    const host = process.env.BACKEND_HOST || process.env.HOST || 'localhost';
    const port = process.env.BACKEND_PORT || process.env.PORT || '8000';
    const protocol = process.env.WS_PROTOCOL || 'ws';
    
    const derivedWsUrl = `${protocol}://${host}:${port}/ws`;
    
    console.log(`ℹ️  WS_URL not set in environment`);
    console.log(`ℹ️  Deriving from configuration:`);
    console.log(`   - Host: ${host}`);
    console.log(`   - Port: ${port}`);
    console.log(`   - Protocol: ${protocol}`);
    console.log(`   - Derived URL: ${derivedWsUrl}`);
    
    // Validate derived URL
    try {
        const url = new URL(derivedWsUrl);
        if (url.protocol === 'ws:' || url.protocol === 'wss:') {
            console.log(`✅ Successfully derived valid WebSocket URL`);
            return true;
        } else {
            console.error(`❌ Derived invalid WebSocket protocol: ${url.protocol}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Failed to derive valid WebSocket URL: ${error.message}`);
        return false;
    }
}

/**
 * Additional WebSocket configuration checks
 * @returns {boolean} True if additional checks pass
 */
function checkWebSocketConfiguration() {
    console.log('\n🔧 Checking WebSocket configuration...');
    
    // Check for common WebSocket environment variables
    const wsConfig = {
        'WS_URL': process.env.WS_URL,
        'WEBSOCKET_URL': process.env.WEBSOCKET_URL,
        'BACKEND_WS_URL': process.env.BACKEND_WS_URL,
        'VITE_WS_URL': process.env.VITE_WS_URL
    };
    
    const definedConfigs = Object.entries(wsConfig)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`);
    
    if (definedConfigs.length > 0) {
        console.log('📋 Found WebSocket environment variables:');
        definedConfigs.forEach(config => console.log(`   - ${config}`));
    } else {
        console.log('ℹ️  No WebSocket environment variables found (using derivation)');
    }
    
    // Check Node.js version compatibility
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 14) {
        console.log(`✅ Node.js version ${nodeVersion} is compatible with WebSocket features`);
    } else {
        console.log(`⚠️  Node.js version ${nodeVersion} may have limited WebSocket support`);
    }
    
    return true;
}

/**
 * Main execution function
 */
function main() {
    console.log('🚀 Starting WebSocket URL validation...\n');
    
    let success = true;
    
    // Primary WebSocket URL check
    if (!checkWebSocketUrl()) {
        success = false;
    }
    
    // Additional configuration checks
    if (!checkWebSocketConfiguration()) {
        success = false;
    }
    
    // Summary
    console.log('\n📊 WebSocket URL Validation Summary:');
    if (success) {
        console.log('✅ All WebSocket URL checks passed');
        console.log('🎯 WebSocket connectivity should work correctly');
        process.exit(0);
    } else {
        console.log('❌ WebSocket URL validation failed');
        console.log('🔧 Please check your WebSocket configuration');
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run main function
main();
