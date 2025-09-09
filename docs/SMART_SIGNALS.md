# Smart Signals Documentation

## Overview

Smart Signals is a composite scoring system that evaluates betting opportunities based on multiple quantitative factors. It provides a single score (0-100) that represents the overall attractiveness of a betting opportunity, along with detailed breakdowns of contributing factors.

## Methodology

### Composite Scoring Algorithm

Smart Signals uses a weighted combination of five key factors:

1. **Expected Value (30% weight)**: Primary indicator of profitability
2. **Arbitrage Potential (25% weight)**: Opportunity for risk-free profit
3. **Line Movement (20% weight)**: Market sentiment and sharp money indicators
4. **Vig Analysis (15% weight)**: Bookmaker margin efficiency
5. **Book Diversity (10% weight)**: Market liquidity and reliability

### Scoring Formula

```text
Smart Score = Σ(Factor Value × Factor Weight) / Total Weight
```

Where each factor is normalized to a 0-100 scale.

## Factor Breakdown

### 1. Expected Value Factor (30% weight)

Measures the theoretical profitability of a bet based on AI probability vs implied probability.

**Scoring Scale:**

- 0% EV → 0 points
- 5% EV → 33 points  
- 10% EV → 67 points
- 15%+ EV → 100 points

**Data Sources:**

- `ev_percent` field (primary)
- Calculated from `odds`, `implied_probability`, `true_probability`

### 2. Line Movement Factor (20% weight)

Analyzes line movement direction and magnitude to identify sharp money action.

**Scoring Scale:**
- **Favorable Movement:**
  - 1.0+ point movement → 100 points
  - 0.5-1.0 point movement → 75 points
  - 0.25-0.5 point movement → 50 points
  - <0.25 point movement → 25 points
- **Unfavorable Movement:** Inverse scoring
- **Neutral Movement:** 40 points

**Data Sources:**
- `line_movement`, `movement_direction`
- `opening_line` vs `current_line` comparison

### 3. Arbitrage Factor (25% weight)

Identifies risk-free profit opportunities across multiple bookmakers.

**Scoring Scale:**
- **Direct Arbitrage:**
  - 5%+ profit → 100 points
  - 3-5% profit → 85 points
  - 1-3% profit → 70 points
  - <1% profit → 50 points
- **Arbitrage Indicators:**
  - Large odds spread (>50) → 60 points
  - Moderate odds spread (30-50) → 40 points
  - Significant line differences → 30 points

**Data Sources:**
- `hasArbitrage`, `arbitrageProfitPct`
- `oddsSpread`, `lineSpread`

### 4. Vig Factor (15% weight)

Evaluates bookmaker margin to identify efficient markets.

**Scoring Scale:**
- ≤2% vig → 100 points (Excellent)
- 2-4% vig → 80 points (Good)
- 4-6% vig → 60 points (Average)
- 6-8% vig → 40 points (Poor)
- >8% vig → 20 points (Very Poor)

**Data Sources:**
- `vig` field (primary)
- Calculated from `overOdds`, `underOdds`

### 5. Book Diversity Factor (10% weight)

Measures market validation through availability across multiple sportsbooks.

**Scoring Scale:**
- 8+ bookmakers → 100 points
- 6-7 bookmakers → 85 points
- 4-5 bookmakers → 70 points
- 2-3 bookmakers → 55 points
- 1 bookmaker → 30 points

**Data Sources:**
- `numBookmakers`
- `bookmakers` array length

## API Usage

### Enable Smart Signals

Set the feature flag in your environment:

```bash
export ENABLE_SMART_SIGNALS=true
```

### Get Smart Signals

```http
GET /api/signals/smart?sport=MLB&min_score=70&limit=50
```

**Parameters:**
- `sport` (string): Sport to analyze (default: "MLB")
- `min_score` (float): Minimum signal score threshold (0-100, default: 70)
- `limit` (int): Maximum results to return (1-200, default: 50)

**Response:**

```json
{
  "opportunities": [
    {
      "id": "game1-judge-runs",
      "player": "Aaron Judge",
      "team": "NYY",
      "opponent": "BOS", 
      "sport": "MLB",
      "market": "Total Runs",
      "line": 8.5,
      "odds": -105,
      "confidence": 78.5,
      "edge": 8.2,
      "bestBookmaker": "FanDuel",
      "lineSpread": 0.5,
      "oddsSpread": 15,
      "numBookmakers": 6,
      "hasArbitrage": false,
      "arbitrageProfitPct": 0.0,
      "smartScore": 82.5,
      "signalFactors": [
        {
          "name": "ev_percent",
          "value": 85.0,
          "weight": 0.30,
          "description": "Expected value: 8.20%"
        },
        {
          "name": "vig",
          "value": 90.0,
          "weight": 0.15,
          "description": "Vig: 2.50%"
        }
      ]
    }
  ],
  "total_count": 39,
  "filtered_count": 12,
  "min_score_applied": 70.0,
  "average_score": 76.8
}
```

### Health Check

```http
GET /api/signals/health
```

Returns service status, feature flag state, and scoring weights.

## PropFinder Integration

Smart Signals automatically enhance PropFinder opportunities when:

1. Smart Signals feature is enabled (`ENABLE_SMART_SIGNALS=true`)
2. Computed signal score ≥ 70
3. Sufficient data is available for scoring

Enhanced opportunities include:
- `smartScore`: Composite score (0-100)
- `signalFactors`: Array of contributing factors with values and descriptions

## Performance Considerations

### Caching Strategy

Smart signals are computed on-demand and not cached by default. For high-volume applications, consider:

1. **API-level caching**: Cache responses for 1-5 minutes
2. **Factor caching**: Cache individual factor calculations
3. **Batch processing**: Process multiple opportunities in parallel

### Monitoring

Monitor smart signals performance using Prometheus metrics:

```
smart_signals_generated_total{sport="MLB",outcome="success"} 150
smart_signals_generated_total{sport="MLB",outcome="error"} 2
smart_signals_generated_total{sport="MLB",outcome="disabled"} 0
```

**Outcomes:**
- `success`: Signal successfully computed
- `error`: Error during computation
- `disabled`: Feature disabled
- `no_data`: No opportunities available

### Performance Benchmarks

Expected performance for typical workloads:

- **Single opportunity**: <10ms computation time
- **50 opportunities**: <200ms computation time
- **Memory usage**: ~1KB per opportunity
- **CPU impact**: Minimal (simple arithmetic operations)

## Configuration

### Environment Variables

```bash
# Feature flag (required)
ENABLE_SMART_SIGNALS=true

# Optional: Custom weights (JSON format)
SMART_SIGNALS_WEIGHTS='{"ev_percent":0.35,"arbitrage":0.25,"line_movement":0.20,"vig":0.15,"book_diversity":0.05}'

# Optional: Minimum confidence threshold
SMART_SIGNALS_MIN_CONFIDENCE=0.6
```

### Factor Weights

Default weights optimize for profitability and risk management:

```python
weights = {
    "ev_percent": 0.30,      # Expected value is crucial
    "line_movement": 0.20,   # Line movement indicates sharp action  
    "arbitrage": 0.25,       # Arbitrage opportunities are valuable
    "vig": 0.15,            # Low vig = better value
    "book_diversity": 0.10   # More books = more reliable
}
```

Weights can be adjusted based on betting strategy:

- **Conservative Strategy**: Increase vig and book_diversity weights
- **Aggressive Strategy**: Increase ev_percent and arbitrage weights
- **Sharp Money Following**: Increase line_movement weight

## Troubleshooting

### Common Issues

#### 1. Smart Signals Disabled

```json
{
  "status_code": 503,
  "detail": "Smart signals feature is disabled. Enable with ENABLE_SMART_SIGNALS=true"
}
```

**Solution**: Set `ENABLE_SMART_SIGNALS=true` in environment variables.

#### 2. No Signals Generated

```json
{
  "opportunities": [],
  "total_count": 39,
  "filtered_count": 0
}
```

**Causes:**

- All opportunities score below `min_score` threshold
- Insufficient data for signal computation
- PropFinder service returning empty data

#### 3. Low Signal Scores

**Causes:**

- Poor expected value (negative or low EV)
- High vig markets
- Unfavorable line movement
- Limited bookmaker availability

### Debugging

Enable debug logging to troubleshoot signal computation:

```python
import logging
logging.getLogger("propollama.smart_signals").setLevel(logging.DEBUG)
```

Debug logs show:

- Individual factor calculations
- Missing data handling
- Signal computation details
- Performance metrics

### Validation

Test signal computation with known scenarios:

```python
# High-value opportunity
opportunity = {
    "ev_percent": 12.0,     # High EV
    "vig": 2.5,            # Low vig
    "line_movement": 0.8,   # Favorable movement
    "movement_direction": "favorable",
    "hasArbitrage": False,
    "numBookmakers": 6
}

signal = smart_signals_service.compute_signal(opportunity)
assert signal.score >= 75  # Should be high-scoring
```

## Best Practices

### Integration Guidelines

1. **Filter by score**: Use `min_score=70` to focus on high-quality opportunities
2. **Sort by score**: Present highest-scoring opportunities first
3. **Display factors**: Show factor breakdown for transparency
4. **Monitor performance**: Track signal generation metrics
5. **Handle errors gracefully**: Degrade to original opportunities on errors

### Interpretation Guidelines

**Score Ranges:**

- **90-100**: Exceptional opportunities (rare)
- **80-89**: Strong opportunities
- **70-79**: Good opportunities (typical threshold)
- **60-69**: Moderate opportunities
- **Below 60**: Poor opportunities (usually filtered out)

**Factor Analysis:**

- High EV + High Score = Strong fundamental value
- High Arbitrage + High Score = Risk-free opportunity
- High Line Movement + High Score = Sharp money confirmation
- Multiple high factors = Higher confidence

### Risk Management

Smart Signals indicate opportunity quality but don't guarantee outcomes:

1. **Diversification**: Don't rely solely on highest-scoring opportunities
2. **Bankroll management**: Use appropriate position sizing
3. **Market conditions**: Consider external factors (injuries, weather, etc.)
4. **Odds changes**: Verify odds haven't moved significantly since computation
5. **Book availability**: Confirm opportunity is still available at listed books

## Technical Implementation

### Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PropFinder    │───▶│  Smart Signals  │───▶│   Enhanced      │
│   Service       │    │   Service       │    │ Opportunities   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Opportunity     │    │ Factor          │    │ API Response    │
│ Data            │    │ Computation     │    │ with Signals    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Input**: PropFinder opportunities with raw betting data
2. **Processing**: Smart Signals service computes factors and composite score
3. **Filtering**: Opportunities with score ≥ threshold are enhanced
4. **Output**: Enhanced opportunities with smart signals data

### Error Handling

The service implements comprehensive error handling:

- **Missing data**: Graceful degradation with available factors
- **Invalid data**: Type validation and sanitization
- **Service errors**: Fallback to original opportunities
- **Feature disabled**: Clear error messages and status codes

## Examples

### High EV + Low Vig Scenario

```json
{
  "opportunity": {
    "player": "Vladimir Guerrero Jr.",
    "sport": "MLB",
    "market": "Total Bases",
    "line": 1.5,
    "odds": -105,
    "ev_percent": 15.2,
    "vig": 2.1,
    "numBookmakers": 8
  },
  "smart_signal": {
    "score": 94.5,
    "factors": [
      {
        "name": "ev_percent",
        "value": 100.0,
        "weight": 0.30,
        "description": "Expected value: 15.20%"
      },
      {
        "name": "vig", 
        "value": 100.0,
        "weight": 0.15,
        "description": "Vig: 2.10%"
      },
      {
        "name": "book_diversity",
        "value": 100.0,
        "weight": 0.10,
        "description": "Available at 8 bookmakers"
      }
    ],
    "confidence": 0.6
  }
}
```

### Arbitrage Opportunity

```json
{
  "opportunity": {
    "player": "Ronald Acuña Jr.",
    "sport": "MLB", 
    "market": "Stolen Bases",
    "line": 0.5,
    "hasArbitrage": true,
    "arbitrageProfitPct": 4.2,
    "oddsSpread": 45,
    "numBookmakers": 7
  },
  "smart_signal": {
    "score": 88.7,
    "factors": [
      {
        "name": "arbitrage",
        "value": 90.0,
        "weight": 0.25,
        "description": "Arbitrage potential: 4.20% profit"
      },
      {
        "name": "book_diversity",
        "value": 85.0,
        "weight": 0.10,
        "description": "Available at 7 bookmakers"
      }
    ],
    "confidence": 0.4
  }
}
```

## Future Enhancements

Planned improvements to Smart Signals:

1. **Machine Learning Integration**: Dynamic weight optimization based on historical performance
2. **Real-time Updates**: Live signal updates as market conditions change
3. **Sport-specific Factors**: Customized factors for different sports
4. **User Personalization**: Personalized weights based on user preferences and history
5. **Advanced Analytics**: Correlation analysis between signals and actual outcomes

## Support

For technical support or feature requests:

- **GitHub Issues**: [Repository Issues](https://github.com/owner/repo/issues)
- **Documentation**: [API Documentation](./API_DOCUMENTATION.md)
- **Monitoring**: Check `/api/signals/health` endpoint for service status