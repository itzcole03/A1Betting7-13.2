#!/bin/bash

# A1Betting7-13.2 Development Environment Manager
# Modern development workflow with comprehensive tooling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_NAME="A1Betting7-13.2"
DOCKER_COMPOSE_DEV="docker-compose.dev.yml"
DOCKER_COMPOSE_PROD="docker-compose.optimized.yml"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================================================${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Some features may not work."
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 is not installed. Some features may not work."
    fi
    
    print_status "Prerequisites check completed"
}

# Function to show help
show_help() {
    echo -e "${PURPLE}$PROJECT_NAME Development Environment Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev             Start development environment"
    echo "  dev-admin       Start development with admin tools (pgAdmin, RedisInsight)"
    echo "  dev-proxy       Start development with Nginx proxy"
    echo "  dev-full        Start development with all optional services"
    echo "  prod            Start production environment"
    echo "  test            Run comprehensive test suite"
    echo "  build           Build all images"
    echo "  clean           Clean up containers and volumes"
    echo "  logs            Show logs for all services"
    echo "  logs [service]  Show logs for specific service"
    echo "  health          Check health of all services"
    echo "  shell [service] Open shell in running service"
    echo "  db              Connect to database"
    echo "  redis           Connect to Redis"
    echo "  backup          Backup database and Redis data"
    echo "  restore         Restore from backup"
    echo "  security-scan   Run security scans"
    echo "  performance     Run performance benchmarks"
    echo "  update          Update all dependencies"
    echo "  status          Show status of all services"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  COMPOSE_PROFILES=admin,proxy,watcher  Enable additional services"
    echo "  BUILD_DATE=\$(date -u +'%Y-%m-%dT%H:%M:%SZ')  Set build date"
    echo "  VCS_REF=\$(git rev-parse HEAD)  Set git commit hash"
}

# Function to start development environment
start_dev() {
    print_header "Starting Development Environment"
    
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    print_status "Build Date: $BUILD_DATE"
    print_status "VCS Ref: $VCS_REF"
    
    # Create network if it doesn't exist
    docker network create a1betting-dev 2>/dev/null || true
    
    # Start core development services
    docker-compose -f $DOCKER_COMPOSE_DEV up -d backend-dev frontend-dev postgres-dev redis-dev
    
    print_status "Development environment started"
    print_status "Frontend: http://localhost:8173"
    print_status "Backend: http://localhost:8000"
    print_status "Backend Health: http://localhost:8000/health"
    
    show_logs_tail
}

# Function to start development with admin tools
start_dev_admin() {
    print_header "Starting Development Environment with Admin Tools"
    
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    docker-compose -f $DOCKER_COMPOSE_DEV --profile admin up -d
    
    print_status "Development environment with admin tools started"
    print_status "Frontend: http://localhost:8173"
    print_status "Backend: http://localhost:8000"
    print_status "pgAdmin: http://localhost:5050 (admin@a1betting.local / admin)"
    print_status "Redis Insight: http://localhost:8001"
}

# Function to start development with proxy
start_dev_proxy() {
    print_header "Starting Development Environment with Proxy"
    
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    docker-compose -f $DOCKER_COMPOSE_DEV --profile proxy up -d
    
    print_status "Development environment with proxy started"
    print_status "Application: http://localhost (via Nginx proxy)"
    print_status "Direct Frontend: http://localhost:8173"
    print_status "Direct Backend: http://localhost:8000"
}

# Function to start full development environment
start_dev_full() {
    print_header "Starting Full Development Environment"
    
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    docker-compose -f $DOCKER_COMPOSE_DEV --profile admin --profile proxy --profile watcher up -d
    
    print_status "Full development environment started"
    print_status "Application: http://localhost (via Nginx proxy)"
    print_status "Frontend: http://localhost:8173"
    print_status "Backend: http://localhost:8000"
    print_status "pgAdmin: http://localhost:5050"
    print_status "Redis Insight: http://localhost:8001"
}

# Function to start production environment
start_prod() {
    print_header "Starting Production Environment"
    
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    docker-compose -f $DOCKER_COMPOSE_PROD up -d
    
    print_status "Production environment started"
    print_status "Application: http://localhost"
    print_status "Monitoring: http://localhost:3000 (Grafana)"
    print_status "Metrics: http://localhost:9090 (Prometheus)"
}

# Function to run tests
run_tests() {
    print_header "Running Comprehensive Test Suite"
    
    # Backend tests
    print_status "Running backend tests..."
    docker-compose -f $DOCKER_COMPOSE_DEV run --rm backend-dev python -m pytest tests/ -v --cov=backend --cov-report=term --cov-report=html
    
    # Frontend tests
    print_status "Running frontend tests..."
    docker-compose -f $DOCKER_COMPOSE_DEV run --rm frontend-dev npm run test:ci
    
    # E2E tests
    print_status "Running E2E tests..."
    docker-compose -f $DOCKER_COMPOSE_DEV run --rm -e CI=true frontend-dev npm run test:e2e
    
    print_status "All tests completed"
}

# Function to build all images
build_images() {
    print_header "Building All Images"
    
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    
    # Build development images
    docker-compose -f $DOCKER_COMPOSE_DEV build
    
    # Build production images
    docker-compose -f $DOCKER_COMPOSE_PROD build
    
    print_status "All images built successfully"
}

# Function to show logs
show_logs() {
    if [ -n "$1" ]; then
        docker-compose -f $DOCKER_COMPOSE_DEV logs -f "$1"
    else
        docker-compose -f $DOCKER_COMPOSE_DEV logs -f
    fi
}

# Function to show tailing logs
show_logs_tail() {
    print_status "Showing recent logs (Press Ctrl+C to stop)"
    docker-compose -f $DOCKER_COMPOSE_DEV logs --tail=50 -f
}

# Function to check health
check_health() {
    print_header "Checking Service Health"
    
    services=(
        "backend-dev:8000/health"
        "frontend-dev:5173/"
        "postgres-dev:5432"
        "redis-dev:6379"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name endpoint <<< "$service"
        print_status "Checking $name..."
        
        if [[ $name == "postgres-dev" ]]; then
            if docker-compose -f $DOCKER_COMPOSE_DEV exec postgres-dev pg_isready -U dev_user > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} $name is healthy"
            else
                echo -e "  ${RED}✗${NC} $name is unhealthy"
            fi
        elif [[ $name == "redis-dev" ]]; then
            if docker-compose -f $DOCKER_COMPOSE_DEV exec redis-dev redis-cli ping > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} $name is healthy"
            else
                echo -e "  ${RED}✗${NC} $name is unhealthy"
            fi
        else
            if curl -f "http://localhost:$endpoint" > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} $name is healthy"
            else
                echo -e "  ${RED}✗${NC} $name is unhealthy"
            fi
        fi
    done
}

# Function to open shell in service
open_shell() {
    if [ -z "$1" ]; then
        print_error "Please specify a service name"
        exit 1
    fi
    
    print_status "Opening shell in $1..."
    docker-compose -f $DOCKER_COMPOSE_DEV exec "$1" /bin/bash
}

# Function to connect to database
connect_db() {
    print_status "Connecting to PostgreSQL database..."
    docker-compose -f $DOCKER_COMPOSE_DEV exec postgres-dev psql -U dev_user -d a1betting_dev
}

# Function to connect to Redis
connect_redis() {
    print_status "Connecting to Redis..."
    docker-compose -f $DOCKER_COMPOSE_DEV exec redis-dev redis-cli
}

# Function to run security scans
run_security_scan() {
    print_header "Running Security Scans"
    
    # Backend security scan
    print_status "Scanning backend..."
    docker-compose -f $DOCKER_COMPOSE_DEV run --rm backend-dev sh -c "safety check && bandit -r backend/ && semgrep --config=auto backend/"
    
    # Frontend security scan
    print_status "Scanning frontend..."
    docker-compose -f $DOCKER_COMPOSE_DEV run --rm frontend-dev sh -c "npm audit --audit-level moderate && retire --path ."
    
    print_status "Security scans completed"
}

# Function to show status
show_status() {
    print_header "Service Status"
    docker-compose -f $DOCKER_COMPOSE_DEV ps
}

# Function to stop services
stop_services() {
    print_header "Stopping All Services"
    docker-compose -f $DOCKER_COMPOSE_DEV down
    docker-compose -f $DOCKER_COMPOSE_PROD down
    print_status "All services stopped"
}

# Function to restart services
restart_services() {
    print_header "Restarting All Services"
    docker-compose -f $DOCKER_COMPOSE_DEV restart
    print_status "All services restarted"
}

# Function to clean up
cleanup() {
    print_header "Cleaning Up"
    
    print_status "Stopping and removing containers..."
    docker-compose -f $DOCKER_COMPOSE_DEV down -v --remove-orphans
    docker-compose -f $DOCKER_COMPOSE_PROD down -v --remove-orphans
    
    print_status "Removing unused images..."
    docker image prune -f
    
    print_status "Removing unused volumes..."
    docker volume prune -f
    
    print_status "Cleanup completed"
}

# Main script logic
case "${1:-help}" in
    "dev")
        check_prerequisites
        start_dev
        ;;
    "dev-admin")
        check_prerequisites
        start_dev_admin
        ;;
    "dev-proxy")
        check_prerequisites
        start_dev_proxy
        ;;
    "dev-full")
        check_prerequisites
        start_dev_full
        ;;
    "prod")
        check_prerequisites
        start_prod
        ;;
    "test")
        check_prerequisites
        run_tests
        ;;
    "build")
        check_prerequisites
        build_images
        ;;
    "clean")
        cleanup
        ;;
    "logs")
        show_logs "$2"
        ;;
    "health")
        check_health
        ;;
    "shell")
        open_shell "$2"
        ;;
    "db")
        connect_db
        ;;
    "redis")
        connect_redis
        ;;
    "security-scan")
        check_prerequisites
        run_security_scan
        ;;
    "status")
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "help"|*)
        show_help
        ;;
esac
