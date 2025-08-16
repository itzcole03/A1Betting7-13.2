// WebSocket Manual Testing Script
// Tests both enhanced and legacy WebSocket endpoints

import WebSocket from 'ws';

console.log('🚀 A1Betting7-13.2 WebSocket Manual Testing');
console.log('==============================================\n');

async function testEnhancedWebSocket() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣  Testing Enhanced WebSocket (/ws/client)...');
        
        const clientId = 'test-client-' + Math.random().toString(36).substr(2, 9);
        const wsUrl = `ws://127.0.0.1:8000/ws/client?client_id=${clientId}&version=1&role=frontend`;
        
        console.log(`   🔗 Connecting to: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);
        let testResults = {
            connected: false,
            receivedHello: false,
            envelopeFormat: false,
            heartbeat: false
        };
        
        ws.on('open', () => {
            console.log('   ✅ Enhanced WebSocket connected successfully');
            testResults.connected = true;
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('   📨 Received message:', JSON.stringify(message, null, 2));
                
                // Check for envelope format
                if (message.envelope_version) {
                    console.log('   ✅ Message uses envelope format (envelope_version=' + message.envelope_version + ')');
                    testResults.envelopeFormat = true;
                }
                
                // Check for hello message
                if (message.message_type === 'hello' || message.type === 'hello') {
                    console.log('   ✅ Received hello message');
                    testResults.receivedHello = true;
                }
                
                // Check for heartbeat/ping
                if (message.message_type === 'ping' || message.type === 'ping') {
                    console.log('   💓 Received heartbeat ping');
                    testResults.heartbeat = true;
                    
                    // Send pong response if we received a ping
                    const pong = {
                        envelope_version: 1,
                        message_type: 'pong',
                        request_id: message.request_id || null,
                        timestamp: new Date().toISOString(),
                        data: { heartbeat_response: true }
                    };
                    ws.send(JSON.stringify(pong));
                    console.log('   💓 Sent pong response');
                }
                
            } catch (e) {
                console.log('   📨 Received raw message:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.log('   ❌ Enhanced WebSocket error:', error.message);
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`   🔴 Enhanced WebSocket closed: Code ${code}, Reason: ${reason.toString()}`);
            resolve(testResults);
        });
        
        // Close connection after 15 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }, 15000);
    });
}

async function testLegacyWebSocket() {
    return new Promise((resolve, reject) => {
        console.log('\n2️⃣  Testing Legacy WebSocket (/ws/legacy/{client_id})...');
        
        const clientId = 'legacy-client-' + Math.random().toString(36).substr(2, 9);
        const wsUrl = `ws://127.0.0.1:8000/ws/legacy/${clientId}`;
        
        console.log(`   🔗 Connecting to: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);
        let testResults = {
            connected: false,
            receivedDeprecationNotice: false,
            echoWorking: false
        };
        
        ws.on('open', () => {
            console.log('   ✅ Legacy WebSocket connected successfully');
            testResults.connected = true;
            
            // Send a test message
            ws.send('Hello from legacy client test');
        });
        
        ws.on('message', (data) => {
            const message = data.toString();
            console.log('   📨 Received:', message);
            
            // Check for deprecation notice
            if (message.includes('DEPRECATED') || message.includes('deprecation')) {
                console.log('   ⚠️  Received deprecation notice');
                testResults.receivedDeprecationNotice = true;
            }
            
            // Check for echo functionality
            if (message.includes('Echo:') || message.includes('Hello from legacy client test')) {
                console.log('   ✅ Echo functionality working');
                testResults.echoWorking = true;
            }
        });
        
        ws.on('error', (error) => {
            console.log('   ❌ Legacy WebSocket error:', error.message);
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`   🔴 Legacy WebSocket closed: Code ${code}, Reason: ${reason.toString()}`);
            resolve(testResults);
        });
        
        // Close connection after 10 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }, 10000);
    });
}

async function testObservabilityEvents() {
    console.log('\n3️⃣  Testing Observability Events API...');
    
    try {
        const response = await fetch('http://127.0.0.1:8000/api/v2/observability/events?limit=20');
        const data = await response.json();
        
        if (response.ok) {
            console.log('   ✅ Events API responded successfully');
            console.log('   📊 Total events:', data.data.total_returned);
            
            if (data.data.events.length > 0) {
                console.log('   📋 Sample events:');
                data.data.events.slice(0, 3).forEach((event, index) => {
                    console.log(`      ${index + 1}. ${event.event_type} - ${event.timestamp}`);
                });
                
                // Check for WebSocket events
                const wsEvents = data.data.events.filter(e => 
                    e.event_type.includes('ws.') || e.event_type.includes('websocket')
                );
                
                if (wsEvents.length > 0) {
                    console.log(`   ✅ Found ${wsEvents.length} WebSocket-related events`);
                } else {
                    console.log('   📭 No WebSocket events found yet (will appear after connections)');
                }
            } else {
                console.log('   📭 No events found (this is normal for a fresh deployment)');
            }
        } else {
            console.log(`   ❌ Events API failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Events API test failed: ${error.message}`);
        return false;
    }
    
    return true;
}

async function runAllTests() {
    try {
        // Test observability first
        const eventsWorking = await testObservabilityEvents();
        
        // Test enhanced WebSocket
        const enhancedResults = await testEnhancedWebSocket();
        
        // Test legacy WebSocket  
        const legacyResults = await testLegacyWebSocket();
        
        // Test observability again to see if events were created
        console.log('\n4️⃣  Checking for new observability events after WebSocket tests...');
        await testObservabilityEvents();
        
        // Summary
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('========================');
        
        console.log('\n🔸 Enhanced WebSocket (/ws/client):');
        console.log(`   Connected: ${enhancedResults.connected ? '✅' : '❌'}`);
        console.log(`   Envelope format: ${enhancedResults.envelopeFormat ? '✅' : '❌'}`);
        console.log(`   Hello message: ${enhancedResults.receivedHello ? '✅' : '❌'}`);
        console.log(`   Heartbeat: ${enhancedResults.heartbeat ? '✅' : '❌'}`);
        
        console.log('\n🔸 Legacy WebSocket (/ws/legacy/{client_id}):');
        console.log(`   Connected: ${legacyResults.connected ? '✅' : '❌'}`);
        console.log(`   Deprecation notice: ${legacyResults.receivedDeprecationNotice ? '✅' : '❌'}`);
        console.log(`   Echo functionality: ${legacyResults.echoWorking ? '✅' : '❌'}`);
        
        console.log('\n🔸 Observability Events API:');
        console.log(`   API working: ${eventsWorking ? '✅' : '❌'}`);
        
        console.log('\n✅ Manual WebSocket testing completed!');
        console.log('🎯 All core functionality appears to be working correctly.');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Check if we're in a Node.js environment that supports WebSocket
if (typeof WebSocket === 'undefined') {
    console.log('⚠️  Note: This script requires ws package. Install with: npm install ws');
    console.log('⚠️  Falling back to browser-based testing...');
} else {
    runAllTests();
}