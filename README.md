# A1Betting7-13.2 - AI-Powered Sports Analytics Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/python-3.8%2B-blue) ![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue) ![Build](https://img.shields.io/badge/build-stable-green) ![Status](https://img.shields.io/badge/status-active-brightgreen)

**A comprehensive AI-powered platform for sports prop research and analytics with modern enterprise-grade features.**

---

## 🚀 Current Status (January 2025)

### ✅ **Fully Operational Platform**
- **Backend**: Robust FastAPI backend serving on port 8000 with comprehensive player data, prop generation, and analytics
- **Frontend**: Modern React 18 application with TypeScript, running on optimized Vite dev server
- **Player Research**: Complete player dashboard with search functionality and mock data fallback
- **Error Handling**: Unified error handling with graceful degradation and fallback behavior
- **Performance**: Optimized timeout configurations and virtualized rendering for large datasets

### 🎯 **Key Features Working**
- **Sports Analytics Dashboard** - Main analytics interface with prop data visualization
- **Player Research Tool** - Comprehensive player search and analytics dashboard
- **AI/ML Model Center** - Enterprise machine learning model management
- **Betting Interface** - Professional trading interface with opportunity filtering
- **Arbitrage Detection** - Real-time arbitrage opportunity identification
- **Mock Data Fallback** - Graceful offline mode when backend services are unavailable

---

## 📑 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.8+**
- **Git**

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
SPORTRADAR_API_KEY=your_sportradar_key_here
ODDS_API_KEY=your_odds_api_key_here
VITE_API_BASE_URL=http://localhost:8000
```

### Running the Application

**Backend (from project root):**
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (from frontend directory):**
```bash
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173 (or next available port)
- **Backend**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

---

## 🎯 Feature Overview

### 🔍 **Player Research & Analytics**
- **Player Dashboard**: Comprehensive player performance analysis with advanced statistics
- **Search Interface**: Intelligent player search with real-time suggestions
- **Performance Trends**: Visual representation of player performance over time
- **Matchup Analysis**: Head-to-head player comparisons and opponent analysis
- **Mock Data Fallback**: Sample data when live data is unavailable

### 🤖 **AI/ML Capabilities**
- **ML Model Center**: Enterprise machine learning model lifecycle management
- **Predictive Analytics**: AI-powered prop predictions with confidence scoring
- **Performance Optimization**: Intelligent model deployment and monitoring
- **Ensemble Methods**: Advanced Bayesian ensemble predictions

### 💰 **Betting & Trading Tools**
- **Unified Betting Interface**: Professional-grade trading interface
- **Arbitrage Detection**: Real-time arbitrage opportunity identification
- **Risk Management**: Kelly Criterion calculations and bankroll management
- **Opportunity Filtering**: Advanced filtering for betting opportunities

### 📊 **Data & Analytics**
- **Sports Analytics**: Comprehensive sports data visualization
- **Real-time Updates**: Live data streaming and updates
- **Performance Monitoring**: System health and performance metrics
- **Unified Data Pipeline**: Enterprise-grade data processing and caching

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript and strict type checking
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** for modern, responsive styling
- **Framer Motion** for smooth animations and transitions
- **Zustand** for predictable state management
- **TanStack Virtual** for high-performance list virtualization
- **Lucide React** for consistent iconography

### Backend
- **FastAPI** with async/await architecture
- **Pydantic** for data validation and serialization
- **SQLAlchemy** ORM with Alembic migrations
- **Unified Services Architecture** for consistent API patterns
- **Comprehensive Error Handling** with graceful degradation
- **Performance Optimization** with intelligent caching

### Development & DevOps
- **TypeScript** for compile-time type safety
- **ESLint + Prettier** for consistent code quality
- **Jest + Playwright** for comprehensive testing
- **Unified Logging** with structured JSON output
- **Service Registry Pattern** for dependency management

---

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   FastAPI API    │    │   Data Sources  │
│                 │    │                  │    │                 │
│ • User Interface│◄──►│ • Unified APIs   │◄──►│ • MLB Stats API │
│ • State Mgmt    │    │ • Data Pipeline  │    │ • Baseball Savant│
│ • Routing       │    │ • ML/AI Engine   │    │ • External APIs │
│ • Error Handling│    │ • Caching Layer  │    │ • Mock Data     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Architectural Patterns

#### **Unified Services Architecture (Backend)**
- **Unified Data Fetcher**: Consolidated data sourcing across all providers
- **Unified Cache Service**: Multi-tier caching with TTL and performance optimization
- **Unified Error Handler**: Comprehensive error classification and user-friendly messaging
- **Unified Logging**: Structured JSON logging with performance tracking

#### **Service Registry Pattern (Frontend)**
- **MasterServiceRegistry**: Centralized service lifecycle and health monitoring
- **Singleton Services**: Consistent service instantiation and dependency management
- **Health Monitoring**: Automatic service health checks and reporting

#### **Modular Component Architecture**
- **Container/Component Pattern**: Separation of data logic and presentation
- **Hook-based State Management**: Extracted state logic in dedicated hooks
- **Performance Optimization**: React.memo, useCallback, and useMemo throughout
- **Virtualization**: Automatic virtualization for datasets >100 items

---

## 📁 Project Structure

```
A1Betting7-13.2/
├── 📁 frontend/                    # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/          # Modular React components
│   │   │   ├── 📁 containers/      # Data container components
│   │   │   ├── 📁 player/          # Player research components
│   │   │   ├── 📁 betting/         # Betting interface components
│   │   │   ├── 📁 ml/             # ML/AI components
│   │   │   └── 📁 user-friendly/   # Main application shell
│   │   ├── 📁 services/           # Frontend service layer
│   │   │   ├── 📁 unified/        # Unified service implementations
│   │   │   └── 📁 data/           # Data service implementations
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 store/              # Zustand state stores
│   │   └── 📁 types/              # TypeScript type definitions
│   └── 📄 vite.config.ts          # Vite configuration
├── 📁 backend/                     # Python FastAPI backend
│   ├── 📁 routes/                 # API route handlers
│   ├── 📁 services/               # Business logic services
│   │   ├── 📁 unified_*/          # Unified service implementations
│   │   └── 📁 modern_ml*/         # Modern ML services
│   ├── 📁 models/                 # Database and API models
│   └── 📄 main.py                 # Application entry point
└── 📄 README.md                   # This file
```

---

## 🔧 Development

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
python phase2_verification.py       # Verify Phase 2 features
python phase3_verification.py       # Verify Phase 3 MLOps features
```

### Code Quality Standards
- **Strict TypeScript**: All code must pass type checking
- **ESLint Compliance**: Consistent code style enforcement
- **Test Coverage**: Comprehensive unit and integration tests
- **Performance Monitoring**: Built-in performance tracking
- **Error Handling**: Unified error handling patterns

---

## 🚦 Key Development Guidelines

> **⚠️ Critical Directory Discipline**
> - **Backend commands**: Always run from project root (`A1Betting7-13.2/`)
> - **Frontend commands**: Always run from `frontend/` subdirectory
> - **Never** run commands from nested directories

### Service Integration Patterns
```typescript
// ✅ Correct - Use MasterServiceRegistry
const registry = MasterServiceRegistry.getInstance();
const dataService = registry.getService('data');

// ✅ Correct - Use unified backend services  
from backend.services.unified_data_fetcher import unified_data_fetcher
data = await unified_data_fetcher.fetch_mlb_games(sport="MLB")
```

### Error Handling Standards
```typescript
// ✅ Frontend - Graceful degradation with mock data
try {
  const playerData = await playerService.getPlayer(playerId);
  return playerData;
} catch (error) {
  if (isConnectivityError(error)) {
    console.log('Using offline mode with mock data');
    return generateMockPlayerData(playerId);
  }
  throw error;
}
```

---

## 📊 Performance & Monitoring

### Performance Optimizations
- **Frontend**: Virtualized rendering for large datasets (>100 items)
- **Backend**: Intelligent caching with TTL and performance-based timeouts
- **Network**: Optimized timeout configurations (3-8 seconds) for fast fallback
- **Error Recovery**: Comprehensive fallback mechanisms with mock data

### Health Monitoring
- **Service Health Checks**: Automatic health monitoring for all services
- **Performance Metrics**: Built-in performance tracking and reporting
- **Error Tracking**: Unified error reporting with correlation IDs
- **Graceful Degradation**: Automatic fallback to offline mode when needed

---

## 🔮 Current Capabilities & Future Roadmap

### ✅ **Phase 1: Stability & Core Features (Complete)**
- Application stabilization and error handling
- Unified service architecture implementation
- Performance optimization and virtualization
- Mock data fallback systems

### ✅ **Phase 2: Enhanced Analytics (Complete)**
- Player research and dashboard functionality
- Advanced search and filtering capabilities
- Performance monitoring and optimization
- Real-time data integration

### 🚧 **Phase 3: Enterprise AI/ML (In Progress)**
- MLOps pipeline management and deployment
- Advanced machine learning model lifecycle
- Production deployment automation
- Autonomous monitoring and alerting

### 🔮 **Phase 4: Advanced Features (Planned)**
- Real-time arbitrage detection optimization
- Advanced predictive analytics
- Enhanced user personalization
- Scalability and performance improvements

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

**Frontend Won't Start**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Backend Connection Issues**
```bash
# Check if backend is running
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}
```

**Port Conflicts**
- Frontend auto-selects available ports (check console output)
- Backend defaults to port 8000 (configurable via environment)

**Build Errors**
```bash
# Frontend type checking
cd frontend && npm run type-check

# Backend dependency check
pip install -r backend/requirements.txt
```

---

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository and create a feature branch
2. **Follow** the directory discipline guidelines strictly
3. **Use** unified service patterns for all new features
4. **Write** comprehensive tests for new functionality
5. **Ensure** all type checks and lints pass
6. **Submit** pull request with detailed description

### Code Standards
- **TypeScript**: Strict type checking required
- **Testing**: Jest for unit tests, Playwright for E2E
- **Documentation**: Update README and inline docs
- **Performance**: Use virtualization for large datasets
- **Error Handling**: Implement graceful degradation patterns

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Team** for the powerful frontend framework
- **FastAPI Team** for the high-performance backend framework  
- **Vite Team** for lightning-fast development experience
- **Tailwind CSS** for utility-first styling approach
- **Open Source Community** for invaluable tools and libraries

---

**Built with ❤️ for sports analytics enthusiasts**

*Last Updated: January 2025*

---

## 📋 Quick Reference

### Essential Commands
```bash
# Start backend (from project root)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend (from frontend directory)  
cd frontend && npm run dev

# Health check
curl http://localhost:8000/health

# Type check
cd frontend && npm run type-check

# Run tests
pytest                    # Backend tests
cd frontend && npm test   # Frontend tests
```

### Key URLs
- **Application**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health
- **Player Search**: http://localhost:5173/player
- **ML Models**: http://localhost:5173/ml-models
