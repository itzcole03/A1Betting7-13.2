# Enhanced API Provider Setup Guide

This guide explains how to configure the production-ready API integrations with real providers for DailyFantasy and TheOdds services.

## Overview

The enhanced services integrate with multiple real providers:

### DailyFantasy Providers

- **DraftKings** (Unofficial API) - Free, rate-limited
- **SportsDataIO** - Paid service, comprehensive fantasy data
- **FairPlay Technologies** - Lineup optimization API

### Odds Providers

- **The-Odds-API** - Freemium, 500 free credits/month
- **OddsJam** - Paid service, 100+ sportsbooks
- **SportsDataIO** - Comprehensive odds and betting data

### Sportsbook Data

- **DraftKings, FanDuel, BetMGM, Caesars** - Real-time aggregation
- **Line movements and arbitrage detection**
- **WebSocket support for live updates**

## Environment Variables

Add these to your `.env` file or environment configuration:

```env
# The-Odds-API (Required for odds data)
VITE_THEODDS_API_KEY=your_the_odds_api_key_here

# SportsDataIO (Recommended for comprehensive data)
VITE_SPORTSDATA_API_KEY=your_sportsdata_io_key_here

# OddsJam (Optional, for premium odds aggregation)
VITE_ODDSJAM_API_KEY=your_oddsjam_api_key_here

# FairPlay Technologies (Optional, for lineup optimization)
VITE_FAIRPLAY_API_KEY=your_fairplay_api_key_here

# Backend URL (for proxy/aggregation)
VITE_BACKEND_URL=http://localhost:8000
```

## API Key Setup Instructions

### 1. The-Odds-API (Primary Odds Provider)

- Visit: https://the-odds-api.com/
- Create free account for 500 credits/month
- Paid plans start at $30/month for 20K credits
- Supports 40+ bookmakers, 70+ sports
- Add key to `VITE_THEODDS_API_KEY`

### 2. SportsDataIO (Comprehensive Sports Data)

- Visit: https://sportsdata.io/
- Offers Fantasy Sports API and Live Odds API
- Free trial available, paid plans from $20/month
- High-quality data with real-time updates
- Add key to `VITE_SPORTSDATA_API_KEY`

### 3. OddsJam (Premium Odds Aggregation)

- Visit: https://oddsjam.com/odds-api
- Real-time odds from 100+ sportsbooks
- Professional-grade data for arbitrage detection
- Contact for API pricing
- Add key to `VITE_ODDSJAM_API_KEY`

### 4. FairPlay Technologies (DFS Optimization)

- Visit: https://developer.fairplaytechnologies.com/
- DFS lineup optimizer with advanced algorithms
- Supports DraftKings and FanDuel formats
- Free tier available, premium features require subscription
- Add key to `VITE_FAIRPLAY_API_KEY`

## Service Configuration

### Rate Limiting

Each service implements intelligent rate limiting:

- The-Odds-API: 1 request per second
- SportsDataIO: Respects API tier limits
- OddsJam: Sub-second delivery capability
- Automatic backoff on rate limit errors

### Caching Strategy

- **Odds data**: 15-30 second cache for live odds
- **DFS data**: 5 minute cache for player/contest data
- **Static data**: 5+ minute cache for sports lists, etc.
- Intelligent cache invalidation based on data freshness

### Fallback Mechanisms

1. **Primary Provider Failure**: Automatically switches to secondary providers
2. **All Providers Down**: Uses cached data with staleness indicators
3. **Backend Unavailable**: Client-side fallback with realistic mock data
4. **Partial Failures**: Merges data from available sources

## Testing the Integration

### Using the Test Dashboard

1. Navigate to the Enhanced API Test Dashboard component
2. Click "Run API Tests" to test all provider connections
3. Check health status for real-time provider monitoring
4. View detailed response data and error messages

### Manual Testing Commands

```bash
# Test The-Odds-API connection
curl "https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_KEY"

# Test SportsDataIO connection
curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
"https://api.sportsdata.io/v3/nba/projections/json/DfsSlatesByDate/2024-01-15"

# Test backend proxy
curl "http://localhost:5173/api/theodds/sports"
```

## Production Deployment

### Environment-Specific Configuration

```javascript
// Development
const API_CONFIG = {
  theodds: {
    baseUrl: 'https://api.the-odds-api.com/v4',
    rateLimit: 1000, // 1 req/sec for free tier
  },
};

// Production
const API_CONFIG = {
  theodds: {
    baseUrl: 'https://api.the-odds-api.com/v4',
    rateLimit: 200, // 5 req/sec for paid tier
  },
};
```

### Monitoring and Alerts

- Health check endpoints for all providers
- Response time monitoring
- Error rate tracking
- Automatic failover notifications
- Cache hit rate optimization

## Cost Optimization

### Free Tier Usage

- The-Odds-API: 500 credits/month free
- SportsDataIO: Free trial available
- Intelligent request batching to minimize API calls
- Aggressive caching for static data

### Paid Tier Recommendations

- Start with The-Odds-API $30/month plan (20K credits)
- Add SportsDataIO for comprehensive fantasy data
- OddsJam for professional arbitrage detection
- Scale based on usage metrics

## Troubleshooting

### Common Issues

1. **"API key not configured"**: Check environment variable names
2. **Rate limiting errors**: Verify rate limits and implement exponential backoff
3. **CORS errors**: Ensure backend proxy is properly configured
4. **Stale data**: Check cache TTL settings and provider update frequency

### Debug Mode

Enable debug logging by setting:

```env
VITE_DEBUG_APIS=true
```

This will log all API requests, responses, and cache hits/misses to the console.

## Support and Documentation

### Provider Documentation

- [The-Odds-API Docs](https://the-odds-api.com/docs)
- [SportsDataIO API Docs](https://sportsdata.io/developers)
- [OddsJam API Docs](https://oddsjam.com/api-documentation)
- [FairPlay Developer Portal](https://developer.fairplaytechnologies.com/)

### Integration Support

- All services include comprehensive error handling
- Health monitoring with automatic recovery
- Detailed logging for troubleshooting
- Graceful degradation for production stability

## Performance Metrics

Expected performance with proper configuration:

- **Response Time**: < 500ms for cached data, < 2s for API calls
- **Uptime**: > 99% with fallback mechanisms
- **Data Freshness**: Live odds within 30 seconds
- **Cache Hit Rate**: > 70% for optimal performance

## Security Considerations

- API keys stored in environment variables only
- No API keys in client-side code or logs
- Request headers sanitized for security
- Rate limiting prevents API key abuse
- HTTPS enforcement for all external API calls
