#!/bin/bash

# PropFinder.app Shell-Based Reconnaissance Script
# 
# This script captures basic network behavior and tech stack information
# from PropFinder.app using curl and grep-based analysis.
#
# Usage: ./recon.sh
# Outputs: analysis/ directory with various reconnaissance files

set -e

echo "🔍 Starting PropFinder.app shell-based reconnaissance..."

# Create analysis directory
mkdir -p analysis
cd analysis

echo "📡 Fetching PropFinder.app homepage..."

# 1) Fetch index.html and analyze
curl -sL "https://propfinder.app/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -o propfinder_index.html

if [ ! -f propfinder_index.html ]; then
  echo "❌ Failed to fetch PropFinder homepage"
  exit 1
fi

echo "📦 Analyzing bundle structure..."

# 2) Extract JavaScript bundle URLs
grep -oP 'src="[^"]*\.js[^"]*"' propfinder_index.html | \
  sed 's/src="//;s/"//' > propfinder_bundles.txt

echo "Found $(wc -l < propfinder_bundles.txt) JavaScript bundles"

# 3) Download main bundles (limit to reasonable size)
echo "⬇️ Downloading main bundles for analysis..."

head -5 propfinder_bundles.txt | while read bundle_url; do
  # Convert relative URLs to absolute
  if [[ $bundle_url == /* ]]; then
    full_url="https://propfinder.app${bundle_url}"
  elif [[ $bundle_url == http* ]]; then
    full_url="$bundle_url"
  else
    full_url="https://propfinder.app/${bundle_url}"
  fi
  
  bundle_name=$(basename "$bundle_url" | tr '/' '_')
  echo "Downloading: $full_url"
  
  curl -sL "$full_url" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    -o "bundle_${bundle_name}" \
    --max-time 30 \
    --max-filesize 10485760 || true  # 10MB limit
done

echo "🔍 Analyzing bundles for API endpoints..."

# 4) Extract API endpoints from bundles
find . -name "bundle_*" -type f -exec grep -oE '"/api/[a-zA-Z0-9/_-]+"|/api/[a-zA-Z0-9/_-]+' {} \; | \
  sed 's/"//g' | \
  sort -u > propfinder_endpoints.txt

echo "Found $(wc -l < propfinder_endpoints.txt) potential API endpoints"

# 5) Extract GraphQL endpoints
find . -name "bundle_*" -type f -exec grep -oE '"/graphql"|/graphql|graphql' {} \; | \
  sort -u > propfinder_graphql.txt

echo "🔧 Analyzing technology stack..."

# 6) Technology detection
cat > tech_analysis.txt << 'EOF'
# PropFinder.app Technology Stack Analysis

## Framework Detection
EOF

# Check for React
if find . -name "bundle_*" -exec grep -q "React" {} \;; then
  echo "- React: ✅ Detected" >> tech_analysis.txt
else
  echo "- React: ❌ Not detected" >> tech_analysis.txt
fi

# Check for Vue
if find . -name "bundle_*" -exec grep -q "Vue" {} \;; then
  echo "- Vue: ✅ Detected" >> tech_analysis.txt
else
  echo "- Vue: ❌ Not detected" >> tech_analysis.txt
fi

# Check for Angular
if find . -name "bundle_*" -exec grep -q "angular\|ng-" {} \;; then
  echo "- Angular: ✅ Detected" >> tech_analysis.txt
else
  echo "- Angular: ❌ Not detected" >> tech_analysis.txt
fi

# Check for build tools
echo "" >> tech_analysis.txt
echo "## Build Tools" >> tech_analysis.txt

if find . -name "bundle_*" -exec grep -q "webpack" {} \;; then
  echo "- Webpack: ✅ Detected" >> tech_analysis.txt
else
  echo "- Webpack: ❌ Not detected" >> tech_analysis.txt
fi

if find . -name "bundle_*" -exec grep -q "vite" {} \;; then
  echo "- Vite: ✅ Detected" >> tech_analysis.txt
else
  echo "- Vite: ❌ Not detected" >> tech_analysis.txt
fi

# Check for styling frameworks
echo "" >> tech_analysis.txt
echo "## Styling Frameworks" >> tech_analysis.txt

if find . -name "bundle_*" -exec grep -q "tailwind\|tw-" {} \;; then
  echo "- Tailwind CSS: ✅ Detected" >> tech_analysis.txt
else
  echo "- Tailwind CSS: ❌ Not detected" >> tech_analysis.txt
fi

if find . -name "bundle_*" -exec grep -q "bootstrap" {} \;; then
  echo "- Bootstrap: ✅ Detected" >> tech_analysis.txt
else
  echo "- Bootstrap: ❌ Not detected" >> tech_analysis.txt
fi

# Check for state management
echo "" >> tech_analysis.txt
echo "## State Management" >> tech_analysis.txt

if find . -name "bundle_*" -exec grep -q "redux\|Redux" {} \;; then
  echo "- Redux: ✅ Detected" >> tech_analysis.txt
else
  echo "- Redux: ❌ Not detected" >> tech_analysis.txt
fi

if find . -name "bundle_*" -exec grep -q "zustand" {} \;; then
  echo "- Zustand: ✅ Detected" >> tech_analysis.txt
else
  echo "- Zustand: ❌ Not detected" >> tech_analysis.txt
fi

echo "📊 Analyzing homepage structure..."

# 7) Extract meta information
echo "# PropFinder.app Meta Analysis" > meta_analysis.txt
echo "" >> meta_analysis.txt

echo "## Meta Tags" >> meta_analysis.txt
grep -oP '<meta[^>]*>' propfinder_index.html | head -20 >> meta_analysis.txt

echo "" >> meta_analysis.txt
echo "## External Scripts and Libraries" >> meta_analysis.txt
grep -oP 'src="[^"]*"' propfinder_index.html | \
  grep -E 'cdn|external|googleapis|cloudflare' >> meta_analysis.txt || true

echo "🌐 Testing basic connectivity..."

# 8) Test common API endpoints
echo "# API Connectivity Test" > api_test.txt
echo "Generated: $(date)" >> api_test.txt
echo "" >> api_test.txt

common_endpoints=(
  "/api/health"
  "/api/v1/health"
  "/api/opportunities"
  "/api/props"
  "/api/sports"
  "/api/markets"
  "/graphql"
)

for endpoint in "${common_endpoints[@]}"; do
  echo "Testing: https://propfinder.app$endpoint"
  status_code=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://propfinder.app$endpoint" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
    --max-time 10 || echo "000")
  
  echo "- $endpoint: HTTP $status_code" >> api_test.txt
done

echo "📋 Generating competitive analysis report..."

# 9) Generate comprehensive report
cat > competitive_analysis.md << EOF
# PropFinder.app Competitive Analysis Report

**Generated:** $(date)  
**Method:** Shell-based reconnaissance  
**Target:** https://propfinder.app

## Summary

This analysis was conducted using shell tools to examine PropFinder.app's 
technology stack, API structure, and feature set for competitive intelligence.

## Key Findings

### Technology Stack
$(cat tech_analysis.txt | grep -E "✅|❌")

### API Endpoints Discovered
$(if [ -s propfinder_endpoints.txt ]; then cat propfinder_endpoints.txt | head -20; else echo "No API endpoints detected in bundles"; fi)

### Bundle Analysis
- JavaScript bundles found: $(wc -l < propfinder_bundles.txt)
- Bundle analysis completed: $(find . -name "bundle_*" -type f | wc -l) files downloaded

### Meta Information
$(grep -oP '<title[^>]*>.*?</title>' propfinder_index.html || echo "No title detected")

## Implications for A1Betting Implementation

### 1. Technology Alignment
Our React/TypeScript/Vite stack should be competitive based on detected technologies.

### 2. API Architecture
- Detected endpoints: $(wc -l < propfinder_endpoints.txt)
- Our current PropFinder API implementation should expand to match this coverage

### 3. Feature Parity Roadmap
Based on bundle analysis, focus on:
1. Implementing discovered API endpoints
2. Matching technology choices where beneficial
3. Ensuring performance parity or superiority

## Files Generated
- \`propfinder_index.html\`: Homepage source
- \`propfinder_bundles.txt\`: JavaScript bundle URLs
- \`propfinder_endpoints.txt\`: Extracted API endpoints
- \`tech_analysis.txt\`: Technology stack detection
- \`meta_analysis.txt\`: Meta tag and external library analysis
- \`api_test.txt\`: Basic API endpoint connectivity tests
- \`bundle_*\`: Downloaded JavaScript bundles for analysis

## Recommendations

1. **Immediate Actions:**
   - Review extracted API endpoints and implement missing ones
   - Ensure our tech stack supports similar functionality
   - Match or exceed their endpoint coverage

2. **Feature Development:**
   - Implement any missing features suggested by bundle analysis
   - Focus on performance optimization to exceed PropFinder
   - Consider technology choices that provide competitive advantage

3. **Ongoing Monitoring:**
   - Regularly re-run this analysis to track PropFinder updates
   - Monitor for new API endpoints or technology changes
   - Benchmark performance against PropFinder metrics
EOF

echo "✅ Reconnaissance complete!"
echo ""
echo "📊 Results Summary:"
echo "- JavaScript bundles found: $(wc -l < propfinder_bundles.txt)"
echo "- API endpoints extracted: $(wc -l < propfinder_endpoints.txt)"
echo "- Analysis files generated: $(ls -1 | wc -l)"
echo ""
echo "📁 Check the analysis/ directory for detailed results:"
echo "  - competitive_analysis.md (main report)"
echo "  - propfinder_endpoints.txt (API endpoints)"
echo "  - tech_analysis.txt (technology detection)"
echo "  - api_test.txt (connectivity tests)"

cd ..
echo ""
echo "🎯 Next Steps:"
echo "1. Review competitive_analysis.md for strategic insights"
echo "2. Compare propfinder_endpoints.txt with our current API"
echo "3. Use findings to prioritize the roadmap tickets in issues.json"