#!/bin/bash

# A1Betting Frontend Production Integration Test
# 
# This script tests the production frontend integration with the backend

echo "🚀 Starting A1Betting Frontend Production Integration Test..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Check for required environment variables
echo "📋 Checking environment configuration..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: No .env file found. Creating .env.production template..."
    cat > .env.production << 'EOF'
# A1Betting Frontend Production Environment Configuration

# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_WEBSOCKET_URL=wss://your-backend-domain.com

# For local testing with production backend
# VITE_API_BASE_URL=http://localhost:8000
# VITE_BACKEND_URL=http://localhost:8000
# VITE_WEBSOCKET_URL=ws://localhost:8000

# Application Configuration
VITE_APP_NAME=A1Betting
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REAL_MONEY=false
VITE_ENABLE_DEBUG=false

# API Keys (Set these in your deployment environment)
# VITE_SPORTSPRICE_API_KEY=your_sportsprice_key
# VITE_PRIZEPICKS_API_KEY=your_prizepicks_key
# VITE_ESPN_API_KEY=your_espn_key
EOF
    echo "✅ Created .env.production template"
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Check TypeScript compilation
echo "🔍 Running TypeScript checks..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed. Please fix the errors above."
    exit 1
fi

# Run linting
echo "🧹 Running ESLint..."
npx eslint src --ext .ts,.tsx --max-warnings 0
if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found. Consider fixing them for production."
fi

# Check for hardcoded URLs and mock data
echo "🔍 Scanning for hardcoded URLs and mock data..."
hardcoded_issues=0

# Check for localhost URLs
localhost_count=$(grep -r "localhost" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v ".env" | wc -l)
if [ $localhost_count -gt 0 ]; then
    echo "⚠️  Found $localhost_count references to localhost:"
    grep -r "localhost" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | head -5
    hardcoded_issues=$((hardcoded_issues + localhost_count))
fi

# Check for mock data
mock_count=$(grep -r "mock\|Mock\|MOCK" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v ".d.ts" | wc -l)
if [ $mock_count -gt 0 ]; then
    echo "⚠️  Found $mock_count references to mock data:"
    grep -r "mock\|Mock\|MOCK" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v ".d.ts" | head -5
fi

# Check for direct fetch calls
fetch_count=$(grep -r "fetch(" src/ --include="*.ts" --include="*.tsx" | grep -v "productionApiService" | grep -v "frontendProductionBridge" | wc -l)
if [ $fetch_count -gt 0 ]; then
    echo "⚠️  Found $fetch_count direct fetch calls (should use production API service):"
    grep -r "fetch(" src/ --include="*.ts" --include="*.tsx" | grep -v "productionApiService" | grep -v "frontendProductionBridge" | head -5
    hardcoded_issues=$((hardcoded_issues + fetch_count))
fi

# Build the application
echo "🏗️  Building production application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Production build failed. Please fix the errors above."
    exit 1
fi

# Run tests if available
if [ -f "src/setupTests.ts" ] || [ -f "src/setupTests.js" ]; then
    echo "🧪 Running tests..."
    npm test -- --watchAll=false --coverage=false
    if [ $? -ne 0 ]; then
        echo "⚠️  Some tests failed. Consider fixing them for production."
    fi
fi

# Check bundle size
echo "📊 Analyzing bundle size..."
if [ -d "dist" ]; then
    bundle_size=$(du -sh dist/ | cut -f1)
    echo "📦 Bundle size: $bundle_size"
    
    # Check for large files
    large_files=$(find dist/ -type f -size +1M)
    if [ -n "$large_files" ]; then
        echo "⚠️  Large files found (>1MB):"
        echo "$large_files"
    fi
fi

# Security scan for secrets
echo "🔒 Scanning for potential secrets..."
secret_patterns=(
    "password"
    "secret"
    "key.*=.*['\"][^'\"]{8,}"
    "token.*=.*['\"][^'\"]{8,}"
    "api.*key.*=.*['\"][^'\"]{8,}"
)

for pattern in "${secret_patterns[@]}"; do
    matches=$(grep -ri "$pattern" src/ --include="*.ts" --include="*.tsx" | grep -v "test" | wc -l)
    if [ $matches -gt 0 ]; then
        echo "⚠️  Potential secrets found matching '$pattern': $matches"
    fi
done

# Summary
echo ""
echo "📋 Production Integration Test Summary:"
echo "========================================"

if [ $hardcoded_issues -gt 0 ]; then
    echo "⚠️  Issues found: $hardcoded_issues hardcoded references"
    echo "   These should be replaced with environment variables or production API calls"
else
    echo "✅ No hardcoded URLs or mock data found"
fi

if [ -d "dist" ]; then
    echo "✅ Production build successful"
    echo "✅ Bundle created in dist/ directory"
else
    echo "❌ Production build failed"
fi

echo ""
echo "🔧 Next Steps for Production Deployment:"
echo "1. Set proper environment variables in your deployment platform"
echo "2. Configure your backend URL in VITE_API_BASE_URL"
echo "3. Test with real backend API endpoints"
echo "4. Set up CI/CD pipeline for automated deployments"
echo "5. Configure domain and SSL certificates"
echo ""

if [ $hardcoded_issues -eq 0 ] && [ -d "dist" ]; then
    echo "🎉 Frontend is ready for production deployment!"
    exit 0
else
    echo "🚧 Frontend needs additional work before production deployment"
    exit 1
fi
