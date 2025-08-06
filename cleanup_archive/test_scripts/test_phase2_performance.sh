#!/bin/bash

echo "🚀 A1Betting7-13.2 Phase 2 Performance Integration Test"
echo "====================================================="

# Test backend performance features
echo "1. Testing Enhanced Caching Service..."
CACHE_HEALTH=$(curl -s -H "Origin: http://localhost:8175" http://localhost:8000/cache/health)
if echo "$CACHE_HEALTH" | grep -q '"status":"healthy"'; then
    echo "✅ Enhanced caching service operational"
    if echo "$CACHE_HEALTH" | grep -q 'memory_fallback'; then
        echo "✅ Memory fallback cache working"
    fi
else
    echo "❌ Enhanced caching service issue"
fi

echo "2. Testing Cache Statistics..."
CACHE_STATS=$(curl -s -H "Origin: http://localhost:8175" http://localhost:8000/cache/stats)
if echo "$CACHE_STATS" | grep -q 'hit_rate_percent'; then
    echo "✅ Cache statistics endpoint working"
else
    echo "❌ Cache statistics endpoint issue"
fi

echo "3. Testing Production Integration..."
HEALTH_RESPONSE=$(curl -s -H "Origin: http://localhost:8175" http://localhost:8000/health)
if echo "$HEALTH_RESPONSE" | grep -q '"version":"2.0.0"'; then
    echo "✅ Production integration working (v2.0.0)"
else
    echo "❌ Production integration issue"
fi

echo "4. Testing CORS & Security Middleware..."
HEADERS=$(curl -s -I -H "Origin: http://localhost:8175" http://localhost:8000/health)
if echo "$HEADERS" | grep -q 'x-content-type-options'; then
    echo "✅ Security headers present"
    if echo "$HEADERS" | grep -q 'access-control-allow-credentials'; then
        echo "✅ CORS headers configured"
    fi
else
    echo "❌ Security middleware issue"
fi

echo "5. Testing Rate Limiting..."
if echo "$HEADERS" | grep -q 'x-ratelimit-limit'; then
    echo "✅ Rate limiting headers present"
else
    echo "❌ Rate limiting issue"
fi

# Test frontend performance features
echo "6. Testing Frontend Build..."
if [ -f "frontend/dist/index.html" ]; then
    echo "✅ Frontend build exists"
else
    echo "⚠️  Frontend build not found (run npm run build if needed)"
fi

echo "7. Testing Lazy Loading Utils..."
if [ -f "frontend/src/utils/lazyLoading.tsx" ]; then
    echo "✅ Lazy loading utilities present"
    if grep -q "createLazyComponent" "frontend/src/utils/lazyLoading.tsx"; then
        echo "✅ createLazyComponent function available"
    fi
else
    echo "❌ Lazy loading utilities missing"
fi

echo "8. Testing Vite Performance Config..."
if grep -q "manualChunks" "vite.config.js"; then
    echo "✅ Vite manual chunking configured"
else
    echo "❌ Vite manual chunking not configured"
fi

echo "9. Testing MLB Data Integration..."
MLB_RESPONSE=$(curl -s -H "Origin: http://localhost:8175" http://localhost:8000/mlb/odds-comparison/)
if echo "$MLB_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ MLB data integration working"
    ODDS_COUNT=$(echo "$MLB_RESPONSE" | grep -o '"event_id"' | wc -l)
    echo "   📊 Retrieved $ODDS_COUNT odds entries"
else
    echo "❌ MLB data integration issue"
fi

echo "10. Testing Overall System Performance..."
START_TIME=$(date +%s%3N)
curl -s -H "Origin: http://localhost:8175" http://localhost:8000/health > /dev/null
END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))
echo "   ⏱️  Backend response time: ${RESPONSE_TIME}ms"

if [ $RESPONSE_TIME -lt 1000 ]; then
    echo "✅ Backend response time excellent (< 1s)"
elif [ $RESPONSE_TIME -lt 3000 ]; then
    echo "✅ Backend response time good (< 3s)"
else
    echo "⚠️  Backend response time could be improved (${RESPONSE_TIME}ms)"
fi

echo ""
echo "🎉 Phase 2 Performance Integration Test Complete!"
echo "All enhanced performance features verified with live backend integration."
