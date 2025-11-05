# A1Betting Ollama Integration Guide

## 🚀 AI-Powered Sports Analytics with Local LLM

This guide covers the integration of Ollama LLM for explainable sports analytics, providing competitive advantages over PropFinder and PropGPT through local AI processing and comprehensive research tools.

## 🎯 Competitive Advantages

### vs PropFinder
- **Deep AI Explanations**: Local LLM provides detailed, explainable insights for every analysis
- **Real-time Odds Aggregation**: Multi-sportsbook comparison with arbitrage detection
- **Offline/Demo Mode**: Fully functional without internet connectivity
- **Faster Research Workflows**: Integrated AI insights within player dashboards

### vs PropGPT
- **Local Processing**: No data sent to external AI services, ensuring privacy
- **Comprehensive Research**: Beyond AI predictions - includes data validation, trends, matchups
- **Professional Interface**: Desktop-class research tools with advanced filtering
- **Open Source Flexibility**: Customizable AI models and prompts for specific sports

## 🏗️ Architecture Overview

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Frontend React    │    │   FastAPI Backend    │    │   Local Ollama      │
│                     │    │                      │    │                     │
│ • AI Chat Interface │◄──►│ • Ollama Service     │◄──►│ • llama3.1 Model    │
│ • Streaming UI      │    │ • Streaming Routes   │    │ • Sports Expert     │
│ • Player Dashboard  │    │ • Error Handling     │    │ • Responsible AI    │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## 🔧 Setup Instructions

### 1. Install Ollama

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from https://ollama.com/download

### 2. Download Sports Analytics Model

```bash
# Download recommended model for sports analysis
ollama pull llama3.1

# Alternative models for different performance needs
ollama pull mistral        # Faster, good for quick insights
ollama pull codellama      # Better for technical analysis
```

### 3. Start Ollama Service

```bash
ollama serve
```

**Verify installation:**
```bash
curl http://localhost:11434/api/tags
```

### 4. Configure Environment

Add to `backend/.env`:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.1
```

### 5. Test Integration

```bash
cd backend
python test_ollama_integration.py
```

## 🎮 Feature Overview

### 1. AI-Powered Player Analysis

**Location:** Player Dashboard → AI Insights Tab

**Features:**
- **Streaming Explanations**: Real-time AI analysis as it generates
- **Context-Aware**: Uses player stats, recent performance, injury status
- **Research-Focused**: Tailored for prop betting research, not predictions
- **Responsible AI**: Includes disclaimers and risk warnings

**Example Prompt:**
```
Player: Aaron Judge (OF, New York Yankees)
Season Stats: {"hits": 148, "home_runs": 37, "batting_average": 0.267}
Recent Form: 3 hits in last 5 games

Question: Analyze this player's prop opportunities for hits and home runs.
What trends and matchup factors should researchers consider?
```

### 2. Multi-Sportsbook Odds Comparison

**Location:** `/v1/odds/compare` API endpoint

**Features:**
- **Best Line Identification**: Finds best odds across all sportsbooks
- **No-Vig Fair Pricing**: Calculate true market probabilities
- **Arbitrage Detection**: Identify guaranteed profit opportunities
- **Real-time Updates**: 30-second refresh intervals

**API Examples:**
```bash
# Compare odds across sportsbooks
curl "http://localhost:8000/v1/odds/compare?sport=baseball_mlb&limit=20"

# Find arbitrage opportunities
curl "http://localhost:8000/v1/odds/arbitrage?sport=baseball_mlb&min_profit=1.0"

# Get specific player odds
curl "http://localhost:8000/v1/odds/player/aaron-judge"
```

### 3. Explainable Prop Analysis

**Location:** AI Explanation Panel Component

**Features:**
- **Contextual Analysis**: Considers recent performance, matchup data
- **Risk Assessment**: Highlights uncertainty and variance factors
- **Educational Focus**: Explains statistical concepts and trends
- **Save & History**: Keeps last 5 analyses for reference

## 🎯 Key Components

### Backend Services

#### OllamaService (`backend/services/ollama_service.py`)
```python
from backend.services.ollama_service import get_ollama_service

# Health check
service = get_ollama_service()
is_available = await service.check_availability()

# Streaming explanation
async for chunk in service.explain_player_analysis(request):
    print(chunk)  # Process streaming response
```

#### AI Routes (`backend/routes/ai_routes.py`)
- `POST /v1/ai/explain` - Stream player analysis explanations
- `POST /v1/ai/analyze-prop` - Stream prop betting analysis  
- `POST /v1/ai/player-summary` - Stream comprehensive player summary
- `GET /v1/ai/health` - Check AI service status

#### Odds Aggregation (`backend/services/odds_aggregation_service.py`)
```python
from backend.services.odds_aggregation_service import get_odds_service

service = get_odds_service()
best_lines = await service.find_best_lines("baseball_mlb")
arbitrage_opps = await service.find_arbitrage_opportunities("baseball_mlb", 1.0)
```

### Frontend Components

#### AIExplanationPanel (`frontend/src/components/ai/AIExplanationPanel.tsx`)
```tsx
import AIExplanationPanel from '@/components/ai/AIExplanationPanel';

<AIExplanationPanel
  context="Player stats and context"
  question="Analysis question"
  playerIds={["player-id"]}
  sport="MLB"
  className="min-h-[500px]"
/>
```

#### OddsComparisonPanel (`frontend/src/components/odds/OddsComparisonPanel.tsx`)
```tsx
import OddsComparisonPanel from '@/components/odds/OddsComparisonPanel';

<OddsComparisonPanel 
  sport="baseball_mlb"
  className="w-full"
/>
```

## 🔒 Responsible AI Implementation

### System Prompt Template
```
You are A1Betting Sports Expert, a professional sports analytics AI assistant.

CORE RESPONSIBILITIES:
- Provide concise, factual, and compliant betting research insights
- Analyze player performance data, trends, and matchup contexts
- Explain model outputs and statistical relationships in plain language
- Generate actionable prop insights with clear reasoning

GUIDELINES:
- Never give financial guarantees or "guaranteed wins"
- Always include disclaimers about risk and uncertainty
- Prefer numbers, context, and references to underlying stats
- Follow Responsible Gambling guidelines (18+/21+ notices)
- Focus on data-driven analysis over speculation
- Clearly label assumptions and confidence levels
```

### Compliance Features
- **18+/21+ Notices**: Automatically included in all AI responses
- **Risk Disclaimers**: Emphasize research purposes, not financial advice
- **Uncertainty Quantification**: AI acknowledges limitations and assumptions
- **Source Citations**: Reference specific data points used in analysis
- **Responsible Gambling Resources**: Links and reminders included

## 📊 Performance Considerations

### Ollama Model Recommendations

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| `llama3.1` | 4.7GB | Medium | High | Recommended default |
| `mistral` | 4.1GB | Fast | Good | Quick insights |
| `llama3.1:70b` | 40GB | Slow | Excellent | Production/server |

### Optimization Tips

1. **Hardware Requirements**
   - Minimum: 8GB RAM for 7B models
   - Recommended: 16GB RAM + GPU for faster processing
   - Production: 32GB+ RAM for 70B models

2. **Performance Tuning**
   ```bash
   # Set number of GPU layers (if available)
   ollama run llama3.1 --gpu-layers 32
   
   # Adjust context window for longer conversations
   ollama run llama3.1 --ctx-size 8192
   ```

3. **Caching Strategy**
   - AI explanations cached locally (5 most recent)
   - Odds data cached for 30 seconds
   - Player data cached for 5 minutes

## 🧪 Testing & Validation

### Integration Tests
```bash
# Run comprehensive Ollama integration test
cd backend
python test_ollama_integration.py

# Expected output:
# ✅ Ollama availability: Available
# ✅ Explanation complete! Total chunks: 15
# ✅ Prop analysis complete!
# ✅ Player summary complete!
# 🎉 All tests passed!
```

### API Testing
```bash
# Test AI explanation endpoint
curl -X POST "http://localhost:8000/v1/ai/explain" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Player: Aaron Judge, Stats: {...}",
    "question": "Analyze hitting props"
  }'

# Test odds comparison
curl "http://localhost:8000/v1/odds/compare?sport=baseball_mlb"

# Test health endpoints
curl "http://localhost:8000/v1/ai/health"
curl "http://localhost:8000/v1/odds/health"
```

## 🚀 Deployment Considerations

### Production Setup

1. **Ollama Server Configuration**
   ```bash
   # Create systemd service for Ollama
   sudo systemctl enable ollama
   sudo systemctl start ollama
   
   # Configure firewall (if needed)
   sudo ufw allow 11434
   ```

2. **Environment Configuration**
   ```env
   # Production settings
   OLLAMA_BASE_URL=http://ollama-server:11434
   OLLAMA_DEFAULT_MODEL=llama3.1
   ODDS_API_KEY=your_production_key
   ```

3. **Monitoring & Alerting**
   - Monitor Ollama service uptime
   - Track AI response times and quality
   - Alert on API quota limits
   - Monitor odds data freshness

### Scaling Considerations

- **Horizontal Scaling**: Multiple Ollama instances behind load balancer
- **Model Optimization**: Quantized models for faster inference
- **Caching Strategy**: Redis for shared cache across instances
- **Rate Limiting**: Prevent AI service overload

## 🎯 Next Steps & Roadmap

### Phase 4: Advanced Features (Planned)
- **Multi-Model Support**: Compare responses from different AI models
- **Custom Training**: Fine-tune models on sports-specific data
- **Advanced Arbitrage**: Cross-sport arbitrage detection
- **Real-time Alerts**: Push notifications for arbitrage opportunities

### Integration Opportunities
- **Kelly Criterion Calculator**: AI-powered optimal bet sizing
- **Bankroll Management**: Personalized risk assessment
- **Trend Detection**: AI-powered pattern recognition
- **Market Analysis**: Sentiment analysis of betting markets

## 🆘 Troubleshooting

### Common Issues

**Ollama Not Available**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
pkill ollama && ollama serve

# Check logs
tail -f ~/.ollama/logs/server.log
```

**Slow AI Responses**
- Upgrade to larger model (llama3.1:70b)
- Add GPU acceleration
- Increase system RAM
- Use SSD storage for model files

**Odds API Issues**
- Verify ODDS_API_KEY environment variable
- Check API quota and rate limits
- Review API documentation for changes
- Enable mock data mode for development

### Support Resources
- **Ollama Documentation**: https://ollama.com/docs
- **API Reference**: http://localhost:8000/docs
- **GitHub Issues**: Create issues for bugs or feature requests
- **Community Discord**: Join for real-time support

---

**Built for sports analytics professionals who demand the best research tools.**

*Last Updated: January 2025*
