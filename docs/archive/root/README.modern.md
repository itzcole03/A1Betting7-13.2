# 🏆 A1Betting7-13.2: Next-Generation Sports Analytics Platform

[![Build Status](https://github.com/a1betting/A1Betting7-13.2/workflows/CI%2FCD/badge.svg)](https://github.com/a1betting/A1Betting7-13.2/actions)
[![Code Coverage](https://codecov.io/gh/a1betting/A1Betting7-13.2/branch/main/graph/badge.svg)](https://codecov.io/gh/a1betting/A1Betting7-13.2)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=a1betting_A1Betting7-13.2&metric=security_rating)](https://sonarcloud.io/dashboard?id=a1betting_A1Betting7-13.2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://hub.docker.com/r/a1betting/platform)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)

> **Production-ready sports analytics platform with AI-powered betting predictions, real-time data processing, and enterprise-grade infrastructure.**

## 🌟 Platform Overview

A1Betting7-13.2 is a sophisticated sports analytics platform that combines machine learning, real-time data processing, and modern web technologies to provide intelligent sports betting insights. The platform features advanced data visualization, predictive analytics, and comprehensive performance monitoring.

### 🔥 Key Features

- **🤖 AI-Powered Predictions**: Advanced ML models with SHAP explanations
- **⚡ Real-Time Analytics**: Live data processing with sub-second latency
- **📊 Advanced Visualization**: Interactive charts with Recharts and D3.js
- **🔒 Enterprise Security**: Multi-layer security with rate limiting and monitoring
- **🚀 High Performance**: Optimized for 10,000+ concurrent users
- **📱 Responsive Design**: Mobile-first, accessible UI with modern UX
- **🐳 Cloud Native**: Full containerization with Docker and Kubernetes support
- **📈 Observability**: Comprehensive monitoring with Prometheus and Grafana

## 🏗️ Architecture

### Technology Stack

#### Frontend

- **Framework**: React 18 + TypeScript 5.0
- **Build Tool**: Vite 7 with optimized bundling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state
- **Virtualization**: TanStack Virtual for large datasets
- **Charts**: Recharts + D3.js for advanced analytics
- **Testing**: Jest + Testing Library + Playwright E2E

#### Backend

- **API**: FastAPI with async/await patterns
- **Database**: PostgreSQL 16 with connection pooling
- **Cache**: Redis 7 with clustering support
- **ML**: Scikit-learn + SHAP for explainable AI
- **Queue**: Celery with Redis broker
- **Monitoring**: Prometheus metrics + structured logging

#### Infrastructure

- **Containerization**: Multi-stage Docker builds
- **Orchestration**: Docker Compose + Kubernetes manifests
- **Web Server**: Nginx with HTTP/2 and compression
- **Monitoring**: Grafana + Prometheus + AlertManager
- **CI/CD**: GitHub Actions with automated deployments

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[React + TypeScript App]
        CDN[CDN/Static Assets]
    end

    subgraph "API Gateway"
        NGINX[Nginx Proxy]
        LB[Load Balancer]
    end

    subgraph "Backend Services"
        API[FastAPI Application]
        ML[ML Prediction Service]
        CELERY[Background Workers]
    end

    subgraph "Data Layer"
        PG[PostgreSQL 16]
        REDIS[Redis Cluster]
        S3[Object Storage]
    end

    subgraph "Monitoring Stack"
        PROM[Prometheus]
        GRAF[Grafana]
        ALERT[AlertManager]
    end

    FE --> NGINX
    CDN --> FE
    NGINX --> LB
    LB --> API
    API --> ML
    API --> PG
    API --> REDIS
    CELERY --> PG
    CELERY --> REDIS

    API --> PROM
    PROM --> GRAF
    PROM --> ALERT
```

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (recommended) or Docker Engine 24+
- **Node.js 20+** (for local development)
- **Python 3.12+** (for local development)
- **Git** with LFS support

### 🐳 Docker Quick Start (Recommended)

```bash
# Clone the repository
git clone https://github.com/a1betting/A1Betting7-13.2.git
cd A1Betting7-13.2

# Start development environment
./dev-manager.sh dev

# Access the application
open http://localhost:8173  # Frontend
open http://localhost:8000  # Backend API
```

### 🔧 Local Development Setup

```bash
# 1. Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 2. Frontend Setup
cd frontend
npm ci
npm run dev

# 3. Start Services
docker-compose -f docker-compose.dev.yml up postgres-dev redis-dev -d

# 4. Run Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 5. Run Frontend
cd frontend
npm run dev
```

## 📋 Development Workflows

### Available Commands

```bash
# Development Environment Manager
./dev-manager.sh dev          # Start core development services
./dev-manager.sh dev-admin    # Include pgAdmin & Redis Insight
./dev-manager.sh dev-full     # All services + file watcher
./dev-manager.sh test         # Run comprehensive test suite
./dev-manager.sh build        # Build all images
./dev-manager.sh health       # Check service health
./dev-manager.sh clean        # Clean up containers and volumes

# Frontend Commands
cd frontend
npm run dev                   # Development server
npm run build                 # Production build
npm run test                  # Unit tests
npm run test:e2e             # End-to-end tests
npm run lint                 # Code linting
npm run type-check           # TypeScript checking
npm run analyze              # Bundle analysis

# Backend Commands
cd backend
pytest                       # Run tests
black backend/               # Code formatting
mypy backend/                # Type checking
safety check                 # Security audit
```

### 🧪 Testing Strategy

#### Unit Tests

```bash
# Backend tests with coverage
pytest --cov=backend --cov-report=html

# Frontend tests with coverage
npm run test:coverage
```

#### Integration Tests

```bash
# API integration tests
pytest tests/integration/

# Database migration tests
pytest tests/migrations/
```

#### End-to-End Tests

```bash
# Playwright E2E tests
npm run test:e2e

# Load testing with Locust
locust -f tests/load/locustfile.py
```

## 🔒 Security Features

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API rate limiting and throttling
- CORS configuration for cross-origin security

### Data Protection

- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection with content security policies
- Secure headers implementation

### Infrastructure Security

- Container security scanning with Trivy
- Dependency vulnerability scanning
- Secrets management with environment variables
- Network segmentation with Docker networks

### Security Monitoring

```bash
# Run security scans
./dev-manager.sh security-scan

# Check for vulnerabilities
npm audit --audit-level moderate
safety check
bandit -r backend/
```

## 📊 Performance Optimization

### Frontend Optimizations

- **Code Splitting**: Dynamic imports with lazy loading
- **Virtualization**: Efficient rendering of large datasets (3000+ items)
- **Caching**: Intelligent API response caching
- **Bundle Optimization**: Tree shaking and compression

### Backend Optimizations

- **Connection Pooling**: PostgreSQL and Redis connection management
- **Async Processing**: Non-blocking I/O with FastAPI
- **Caching Strategy**: Multi-level caching (Redis + in-memory)
- **Background Jobs**: Celery for heavy computations

### Performance Monitoring

```bash
# Frontend performance
npm run perf:lighthouse
npm run analyze

# Backend performance
./dev-manager.sh performance
```

## 🌐 API Documentation

### REST API Endpoints

#### Sports Data

```http
GET /api/sports/{sport}/props          # Fetch sport propositions
POST /api/sports/activate/{sport}      # Activate sport service
GET /api/sports/{sport}/games          # Upcoming games
```

#### Analytics

```http
POST /api/unified/batch-predictions    # ML batch predictions
GET /api/analytics/performance         # Performance metrics
GET /api/analytics/insights           # AI insights
```

#### Health & Monitoring

```http
GET /health                           # Service health check
GET /metrics                          # Prometheus metrics
GET /api/system/status               # System status
```

### Interactive API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: http://localhost:8000/openapi.json

## 🔧 Configuration

### Environment Variables

#### Backend Configuration

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/a1betting
REDIS_URL=redis://localhost:6379/0

# API Keys
SPORT_RADAR_API_KEY=your_api_key
ODDS_API_KEY=your_api_key

# Security
SECRET_KEY=your_secret_key
JWT_EXPIRATION=3600

# Performance
MAX_WORKERS=4
CACHE_TTL=300
```

#### Frontend Configuration

```env
# API Configuration
VITE_BACKEND_URL=http://localhost:8000
VITE_ENVIRONMENT=development

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUGGING=false
```

## 📈 Monitoring & Observability

### Metrics Collection

- **Application Metrics**: Request latency, throughput, error rates
- **Business Metrics**: User engagement, prediction accuracy
- **Infrastructure Metrics**: CPU, memory, disk, network usage

### Logging Strategy

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARN, ERROR with appropriate filtering
- **Log Aggregation**: Centralized logging with ELK stack support

### Monitoring Stack

```bash
# Access monitoring dashboards
open http://localhost:3000    # Grafana dashboards
open http://localhost:9090    # Prometheus metrics
open http://localhost:9093    # AlertManager
```

### Health Checks

```bash
# Comprehensive health check
curl http://localhost:8000/health

# Individual service checks
./dev-manager.sh health
```

## 🚀 Deployment

### Development Deployment

```bash
# Start development environment
./dev-manager.sh dev-full

# Deploy with hot reloading
docker-compose -f docker-compose.dev.yml up -d
```

### Production Deployment

```bash
# Build production images
./dev-manager.sh build

# Deploy production stack
./dev-manager.sh prod

# Verify deployment
./dev-manager.sh health
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n a1betting
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install pre-commit hooks: `pre-commit install`
4. Make your changes with tests
5. Run the test suite: `./dev-manager.sh test`
6. Submit a pull request

### Code Standards

- **Python**: Black formatting, type hints, docstrings
- **TypeScript**: ESLint rules, strict type checking
- **Git**: Conventional commits with semantic versioning
- **Documentation**: Keep README and API docs updated

### Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Add changelog entry
4. Request code review
5. Squash commits before merge

## 📚 Documentation

- **Architecture Guide**: [docs/architecture.md](docs/architecture.md)
- **API Reference**: [docs/api.md](docs/api.md)
- **Deployment Guide**: [docs/deployment.md](docs/deployment.md)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

## 🐛 Troubleshooting

### Common Issues

#### Frontend-Backend Connection

```bash
# Check backend health
curl http://localhost:8000/health

# Verify proxy configuration
cat frontend/vite.config.ts | grep proxy

# Check logs
./dev-manager.sh logs backend-dev
```

#### Database Connection

```bash
# Test database connection
./dev-manager.sh db

# Check connection pool
docker-compose logs postgres-dev
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Monitor application metrics
open http://localhost:3000/d/app-dashboard
```

### Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and community support
- **Documentation**: Comprehensive guides and references

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI**: High-performance web framework
- **React**: User interface library
- **PostgreSQL**: Robust database system
- **Redis**: In-memory data structure store
- **Docker**: Containerization platform
- **Grafana**: Monitoring and observability

---

<div align="center">

**Built with ❤️ by the A1Betting Team**

[Website](https://a1betting.com) • [Documentation](https://docs.a1betting.com) • [Support](https://support.a1betting.com)

</div>
