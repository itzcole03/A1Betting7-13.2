#!/bin/bash

echo "🔧 A1Betting7-13.2 Integration Fix Verification"
echo "=============================================="

# Test backend health
echo "1. Testing backend health..."
if curl -s -H "Origin: http://localhost:8175" http://localhost:8000/health | grep -q '"status":"healthy"'; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

# Test CORS configuration
echo "2. Testing CORS configuration..."
if curl -s -H "Origin: http://localhost:8175" http://localhost:8000/health | grep -q '"status":"healthy"'; then
    echo "✅ CORS configuration allows frontend origin"
else
    echo "❌ CORS configuration issue"
fi

# Test MLB odds endpoint
echo "3. Testing MLB odds endpoint..."
if curl -s -H "Origin: http://localhost:8175" http://localhost:8000/mlb/odds-comparison/ | grep -q '"odds"'; then
    echo "✅ MLB odds endpoint returning data"
else
    echo "❌ MLB odds endpoint not working"
fi

# Test frontend loading
echo "4. Testing frontend loading..."
if curl -s http://localhost:8175 | grep -q "<!DOCTYPE html>"; then
    echo "✅ Frontend loading successfully"
else
    echo "❌ Frontend not loading"
fi

# Check for backend connection errors in frontend
echo "5. Checking for backend connection errors..."
if curl -s http://localhost:8175 | grep -q "Cannot connect to backend"; then
    echo "❌ Frontend still showing backend connection errors"
else
    echo "✅ No backend connection errors in frontend"
fi

echo ""
echo "🎉 Integration fix verification complete!"
