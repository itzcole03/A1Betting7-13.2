# A1Betting7-13.2 - PropFinder Competitor Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/python-3.8%2B-blue) ![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue) ![Build](https://img.shields.io/badge/build-stable-green) ![Status](https://img.shields.io/badge/status-active-brightgreen) ![Demo Mode](https://img.shields.io/badge/demo--mode-active-orange)

**A best-in-class sports prop research and analytics platform designed to compete directly with PropFinder and PropGPT, featuring AI-powered analysis, odds aggregation, arbitrage detection, and comprehensive risk management tools.**

---

## 🚀 Current Status (January 2025)

### ✅ **Fully Operational PropFinder Competitor**
- **Complete Feature Parity**: Matches and exceeds PropFinder capabilities
- **AI-Powered Analytics**: Local Ollama LLM integration for explainable insights
- **Demo Mode Active**: Full functionality with comprehensive mock data
- **Real-time Performance**: Optimized for speed and reliability
- **Production Ready**: Enterprise-grade architecture with graceful degradation

### 🎯 **Competitive Advantages Over PropFinder**
- **🤖 Local AI Integration**: Ollama LLM for deep prop analysis and explanations
- **⚡ Faster Workflows**: Streamlined research and analysis interface
- **📊 Advanced Analytics**: Comprehensive edge calculations and confidence scoring
- **🔍 Real-time Odds**: Multi-sportsbook comparison and arbitrage detection
- **🛡️ Risk Management**: Kelly Criterion calculations and bankroll optimization
- **🔄 Offline Capability**: Robust demo mode when backend unavailable

---

## 📑 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.8+**
- **Git**
- **Ollama** (optional, for AI features)

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/itzcole03/A1Betting7-13.2.git
cd A1Betting7-13.2

# Backend Setup
cd backend
pip install -r requirements.txt

# Frontend Setup  
cd ../frontend
npm install
```

### Environment Configuration

Create `.env` file in the `backend/` directory:
```env
# Optional - App works in demo mode without these
SPORTRADAR_API_KEY=your_sportradar_key_here
ODDS_API_KEY=your_odds_api_key_here
OLLAMA_API_URL=http://localhost:11434
VITE_API_BASE_URL=http://localhost:8000
```

### Running the Application

**Option 1: Full Stack (with backend)**
```bash
# Terminal 1 - Backend (from project root)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend (from frontend directory)
cd frontend
npm run dev
```

**Option 2: Demo Mode Only (frontend only)**
```bash
# Frontend only - runs in full demo mode
cd frontend
npm run dev
```

### Access Points
- **Application**: http://localhost:5173 (PropFinder competitor interface)
- **Backend API**: http://localhost:8000 (optional)
- **API Documentation**: http://localhost:8000/docs (when backend running)
- **Health Check**: http://localhost:8000/health (when backend running)

---

## 🏆 Core Features (PropFinder Competitor)

### 🎯 **PropFinder Feature Comparison**

| Feature | PropFinder | A1Betting Platform | Advantage |
|---------|------------|-------------------|-----------|
| Prop Research | ✅ | ✅ **Enhanced** | AI explanations, better UX |
| Odds Comparison | ✅ | ✅ **Multi-source** | More sportsbooks, arbitrage |
| Player Analytics | ✅ | ✅ **Advanced** | Deeper metrics, ML insights |
| Filtering | ✅ | ✅ **Smart** | AI-powered recommendations |
| Mobile Support | ✅ | ✅ **Optimized** | Responsive design |
| **AI Analysis** | ❌ | ✅ **Exclusive** | Local LLM integration |
| **Risk Management** | ❌ | ✅ **Exclusive** | Kelly Criterion tools |
| **Arbitrage Detection** | ❌ | ✅ **Exclusive** | Real-time opportunities |
| **Offline Mode** | ❌ | ✅ **Exclusive** | Demo mode capability |

### 🔍 **1. Prop Research & Cheatsheets**
- **Smart Filtering**: Advanced filters by sport, position, prop type, and confidence
- **Edge Calculation**: Automated edge detection with confidence scoring
- **AI Insights**: Ollama LLM explanations for prop opportunities
- **Export Tools**: CSV export for further analysis
- **Real-time Updates**: Live prop data with refresh capabilities

### 💰 **2. Odds Comparison & Arbitrage**
- **Multi-Sportsbook**: DraftKings, FanDuel, BetMGM, Caesars, and more
- **Arbitrage Hunter**: Real-time arbitrage opportunity detection
- **Best Line Finding**: Automatic identification of optimal odds
- **Profit Calculators**: Built-in arbitrage profit calculations
- **Alert System**: Notifications for high-value opportunities

### 🧮 **3. Risk Management Tools**
- **Kelly Criterion Calculator**: Optimal bet sizing based on edge
- **Bankroll Management**: Track and optimize betting bankroll
- **Risk Assessment**: Portfolio risk analysis and recommendations
- **Session Tracking**: Monitor betting performance over time
- **Drawdown Protection**: Risk mitigation strategies

### 🤖 **4. AI/ML Model Center**
- **Ollama Integration**: Local LLM for prop analysis and explanations
- **Model Management**: ML model lifecycle and deployment
- **Prediction Engine**: AI-powered prop predictions
- **Performance Tracking**: Model accuracy and performance metrics
- **Ensemble Methods**: Multiple model consensus predictions

### 📊 **5. Player Research Dashboard**
- **Comprehensive Stats**: Advanced player analytics and trends
- **Matchup Analysis**: Head-to-head and opponent analysis
- **Injury Tracking**: Real-time injury reports and impact analysis
- **Historical Performance**: Season and career performance trends
- **Prop History**: Player-specific prop betting history

### ⚡ **6. Real-time Data & Performance**
- **Live Updates**: Real-time prop and odds updates
- **Fast Fallback**: 1-2 second timeouts with immediate demo mode
- **Virtualized Rendering**: Handle 1000+ props without performance loss
- **Offline Capability**: Full functionality in demo mode
- **Error Recovery**: Graceful degradation with comprehensive mock data

---

## 🛠️ Technology Stack

### Frontend (React SPA)
- **React 19** with TypeScript and strict type checking
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **Framer Motion** for smooth animations and transitions
- **Zustand** for predictable state management
- **TanStack Virtual** for high-performance list virtualization
- **React Router** for client-side routing
- **Lucide React** for consistent iconography

### Backend (FastAPI API)
- **FastAPI** with async/await architecture
- **Pydantic** for data validation and serialization
- **SQLAlchemy** ORM with Alembic migrations
- **Ollama Integration** for local LLM processing
- **Multi-Sportsbook APIs** for odds aggregation
- **Unified Services Architecture** for consistent patterns
- **Comprehensive Error Handling** with graceful degradation

### AI/ML Stack
- **Ollama** for local LLM processing (GPT-4 class models)
- **Server-Sent Events** for streaming AI responses
- **scikit-learn** for traditional ML models
- **pandas** for data analysis and processing
- **Kelly Criterion** implementations for risk management
- **Monte Carlo** simulations for advanced analytics

### Development & DevOps
- **TypeScript** for compile-time type safety
- **ESLint + Prettier** for consistent code quality
- **Jest + Playwright** for comprehensive testing
- **Unified Logging** with structured JSON output
- **Service Registry Pattern** for dependency management
- **Demo Mode** for offline development and testing

---

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   React Frontend    │    │   FastAPI Backend    │    │   External APIs     │
│                     │    │                      │    │                     │
│ • PropFinder UI     │◄──►│ • Odds Aggregation   │◄──►│ • DraftKings API    │
│ • AI Chat Interface │    │ • Ollama LLM         │    │ • FanDuel API       │
│ • Risk Tools        │    │ • Arbitrage Engine   │    │ • BetMGM API        │
│ • Player Research   │    │ • Kelly Calculator   │    │ • MLB Stats API     │
│ • Demo Mode         │    │ • Mock Data Service  │    │ • Baseball Savant   │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### Key Architectural Features

#### **PropFinder Competitor Design**
- **User-Friendly Interface**: Clean, intuitive design matching modern sports betting apps
- **Fast Performance**: Optimized for speed with 1-2 second fallback to demo mode
- **Mobile-First**: Responsive design that works on all devices
- **Progressive Enhancement**: Core functionality works offline

#### **AI-Powered Analysis**
- **Local LLM Processing**: Ollama integration for privacy and speed
- **Streaming Responses**: Real-time AI analysis with Server-Sent Events
- **Explainable AI**: Clear explanations for prop recommendations
- **Context-Aware**: AI understands sports context and betting terminology

#### **Enterprise Service Architecture**
- **Unified APIs**: Consistent patterns across all backend services
- **Graceful Degradation**: Automatic fallback to demo mode
- **Health Monitoring**: Real-time service health and performance tracking
- **Error Recovery**: Comprehensive error handling with user-friendly messages

---

## 📁 Project Structure

```
A1Betting7-13.2/
├── 📁 frontend/                          # React PropFinder competitor
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 welcome/               # PropFinder competitor dashboard
│   │   │   ├── 📁 features/              # Core PropFinder features
│   │   │   │   ├── 📁 cheatsheets/       # Prop research & filtering
│   │   │   │   ├── 📁 odds/              # Odds comparison
│   │   │   │   ├── 📁 betting/           # Arbitrage detection
│   │   │   │   ├── 📁 risk/              # Kelly calculator & risk tools
│   │   │   │   └── 📁 analytics/         # Advanced analytics
│   │   │   ├── 📁 ai/                    # AI chat interface
│   │   │   ├── 📁 player/                # Player research
│   │   │   ├── 📁 ml/                    # ML model center
│   │   │   └── 📁 user-friendly/         # Main app shell
│   │   ├── 📁 services/                  # Frontend services
│   │   │   ├── 📁 unified/               # Unified API services
│   │   │   └── 📁 features/              # Feature-specific services
│   │   └── 📁 types/                     # TypeScript definitions
├── 📁 backend/                           # FastAPI backend
│   ├── 📁 routes/                        # API endpoints
│   │   ├── ai_routes.py                  # AI/Ollama integration
│   │   ├── odds_routes.py                # Odds aggregation
│   │   ├── cheatsheets_routes.py         # Prop research
│   │   └── risk_routes.py                # Risk management
│   ├── 📁 services/                      # Business logic
│   │   ├── ollama_service.py             # LLM integration
│   │   ├── odds_aggregation_service.py   # Multi-sportsbook odds
│   │   ├── cheatsheets_service.py        # Prop analysis
│   │   └── risk_tools_service.py         # Kelly & risk calculations
│   └── 📄 main.py                        # FastAPI application
└── 📄 README.md                          # This documentation
```

---

## 🎮 Demo Mode Features

The platform includes a comprehensive demo mode that provides full functionality without requiring backend services:

### 📊 **Mock Data Coverage**
- **500+ Prop Opportunities**: Realistic prop betting scenarios
- **Multiple Sports**: MLB, NBA, NFL, NHL coverage
- **Live Odds**: Simulated real-time odds from major sportsbooks
- **Player Data**: Comprehensive player statistics and analytics
- **AI Responses**: Pre-generated AI analysis and explanations

### 🔧 **Demo Mode Capabilities**
- **Full Feature Access**: All features work in demo mode
- **Realistic Performance**: Simulated API delays and responses
- **Error Scenarios**: Test error handling and recovery
- **Offline Development**: Work without internet connectivity
- **Training Environment**: Perfect for demonstrations and training

---

## 🚀 Getting Started (PropFinder Alternative)

### For PropFinder Users
If you're coming from PropFinder, here's what makes our platform better:

1. **🤖 AI-Powered Analysis**: Get detailed explanations for every prop
2. **💰 Risk Management**: Built-in Kelly Criterion and bankroll tools
3. **🔍 Arbitrage Detection**: Find profitable arbitrage opportunities
4. **⚡ Faster Performance**: Optimized for speed and reliability
5. **📱 Better Mobile**: Responsive design that works everywhere
6. **🆓 Free Alternative**: No subscription fees or hidden costs

### Quick Demo
```bash
# Get started in 30 seconds
git clone https://github.com/itzcole03/A1Betting7-13.2.git
cd A1Betting7-13.2/frontend
npm install && npm run dev
# Open http://localhost:5173 - Full PropFinder competitor ready!
```

---

## 🎯 Feature Roadmap

### ✅ **Phase 1: PropFinder Parity (Complete)**
- ✅ Prop research and filtering
- ✅ Player analytics and search
- ✅ Odds comparison interface
- ✅ Mobile-responsive design
- ✅ Demo mode with mock data

### ✅ **Phase 2: AI Enhancement (Complete)**
- ✅ Ollama LLM integration
- ✅ AI-powered prop analysis
- ✅ Streaming chat interface
- ✅ Explainable AI insights
- ✅ Context-aware recommendations

### ✅ **Phase 3: Advanced Tools (Complete)**
- ✅ Arbitrage detection engine
- ✅ Kelly Criterion calculator
- ✅ Risk management tools
- ✅ Multi-sportsbook integration
- ✅ Performance optimization

### 🚧 **Phase 4: Enterprise Features (In Progress)**
- 🔄 Real-time data streaming
- 🔄 Advanced portfolio analytics
- 🔄 Custom model training
- 🔄 API integrations
- 🔄 White-label deployment

### 🔮 **Phase 5: Next-Gen Features (Planned)**
- 📋 Social betting features
- 📋 Advanced ML models
- 📋 Cryptocurrency integration
- 📋 Global sportsbook support
- 📋 Mobile app development

---

## 🔧 Development Commands

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production  
npm run test         # Run Jest tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Backend Development
```bash
# Always run from project root
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
pytest                              # Run tests
python -m pytest --cov=backend      # Run tests with coverage
```

### Demo Mode Testing
```bash
# Test demo mode specifically
cd frontend
npm run dev
# Navigate to http://localhost:5173
# All features should work with mock data
```

---

## 🛠️ Troubleshooting

### Common Issues

**App Shows "Cannot connect to backend"**
```bash
# This is normal - app should automatically switch to demo mode
# If stuck, refresh the page or check console for errors
```

**PropFinder Comparison**
```bash
# Our platform advantages:
# ✅ Free and open source
# ✅ AI-powered analysis
# ✅ Better risk management
# ✅ Arbitrage detection
# ✅ Offline capability
```

**Performance Issues**
```bash
# For large datasets (1000+ props):
# ✅ Virtualization automatically enabled
# ✅ Performance optimized for speed
# ✅ Check browser dev tools for memory usage
```

**AI Features Not Working**
```bash
# Ollama setup (optional):
# 1. Install Ollama from https://ollama.ai
# 2. Run: ollama pull llama2
# 3. Start: ollama serve
# 4. AI features will activate automatically
```

---

## 🤝 Contributing

We welcome contributions to make this the best PropFinder alternative!

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** our coding standards (TypeScript, ESLint, tests)
4. **Test** in both demo mode and with backend
5. **Submit** pull request with detailed description

### Priority Areas
- 🎯 **More Sportsbooks**: Add additional odds sources
- 🤖 **AI Improvements**: Enhance LLM analysis capabilities  
- ���� **Analytics**: Advanced betting analytics and insights
- 📱 **Mobile**: Enhanced mobile experience
- 🔧 **Performance**: Speed and optimization improvements

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

This project is free and open source, making it a true alternative to paid platforms like PropFinder.

---

## 🙏 Acknowledgments

- **PropFinder**: Inspiration for building a better alternative
- **React Team**: Powerful frontend framework
- **FastAPI Team**: High-performance backend framework
- **Ollama Team**: Local LLM integration capabilities
- **Open Source Community**: Invaluable tools and libraries

---

## 🏆 Why Choose A1Betting Over PropFinder?

### 💰 **Cost Advantage**
- **Free Forever**: No subscription fees
- **Open Source**: Modify and customize as needed
- **Self-Hosted**: Complete control over your data

### 🤖 **AI Advantage**
- **Local LLM**: Privacy-focused AI analysis
- **Explainable AI**: Understand why props are recommended
- **Context-Aware**: AI trained on sports betting terminology

### ⚡ **Performance Advantage**
- **Faster Loading**: Optimized for speed
- **Offline Mode**: Works without internet
- **Better UX**: Modern, intuitive interface

### 🔧 **Feature Advantage**
- **Risk Management**: Kelly Criterion and bankroll tools
- **Arbitrage Detection**: Find profitable opportunities
- **More Analytics**: Deeper insights and analysis
- **Customizable**: Open source means unlimited customization

---

**🎯 Ready to replace PropFinder? Get started in 30 seconds!**

```bash
git clone https://github.com/itzcole03/A1Betting7-13.2.git
cd A1Betting7-13.2/frontend && npm install && npm run dev
```

*Last Updated: January 2025*

---

## 📋 Quick Reference Card

### Essential URLs
- **App**: http://localhost:5173
- **API**: http://localhost:8000 (optional)
- **Docs**: http://localhost:8000/docs (when backend running)

### Key Features Access
- **Prop Research**: Main dashboard → "Prop Cheatsheets"
- **Player Analytics**: Navigation → "Player Research"  
- **Odds Comparison**: Navigation → "Odds Comparison"
- **Arbitrage**: Navigation → "Arbitrage Hunter"
- **Risk Tools**: Navigation → "Kelly Calculator"
- **AI Analysis**: Any prop → "AI Analysis" button

### Demo Mode Verification
✅ All features accessible without backend  
✅ Realistic mock data for testing  
✅ Full PropFinder-comparable experience  
✅ Perfect for development and demos
