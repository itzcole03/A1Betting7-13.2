#!/bin/bash

# A1Betting Production Deployment Script
# This script sets up and deploys the A1Betting backend in production

set -e  # Exit on any error

echo "🚀 Starting A1Betting Production Deployment"
echo "============================================"

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
LOG_FILE="$BACKEND_DIR/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is required but not installed"
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        error "pip3 is required but not installed"
    fi
    
    # Check Node.js (for frontend)
    if ! command -v node &> /dev/null; then
        warning "Node.js not found - frontend deployment will be skipped"
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        log "Docker found - containerized deployment available"
    else
        log "Docker not found - using direct deployment"
    fi
    
    success "Prerequisites check completed"
}

# Setup Python environment
setup_python_env() {
    log "Setting up Python environment..."
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        log "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    if [ -f "requirements.txt" ]; then
        log "Installing Python dependencies..."
        pip install -r requirements.txt
    else
        error "requirements.txt not found"
    fi
    
    success "Python environment setup completed"
}

# Validate environment configuration
validate_config() {
    log "Validating configuration..."
    
    # Check for .env file
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/.env.production" ]; then
            log "Copying .env.production to .env..."
            cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env"
        else
            error "No .env file found. Please create one based on .env.production"
        fi
    fi
    
    # Validate required environment variables
    source "$BACKEND_DIR/.env" 2>/dev/null || true
    
    required_vars=("ENVIRONMENT")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
    fi
    
    # Set production environment
    export ENVIRONMENT=production
    
    success "Configuration validation completed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Check if database migration scripts exist
    if [ -d "migrations" ] || [ -f "alembic.ini" ]; then
        log "Running Alembic migrations..."
        python -m alembic upgrade head
    else
        warning "No migration scripts found - skipping database migrations"
    fi
    
    success "Database migrations completed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    if [ -f "pytest.ini" ] || [ -d "tests" ]; then
        log "Running pytest..."
        python -m pytest tests/ -v --tb=short
        
        # Check test coverage if configured
        if command -v coverage &> /dev/null; then
            log "Generating test coverage report..."
            coverage run -m pytest
            coverage report
        fi
    else
        warning "No tests found - skipping test execution"
    fi
    
    success "Tests completed"
}

# Build frontend (if exists)
build_frontend() {
    log "Building frontend..."
    
    FRONTEND_DIR="$PROJECT_ROOT/frontend"
    
    if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
        cd "$FRONTEND_DIR"
        
        if command -v npm &> /dev/null; then
            log "Installing frontend dependencies..."
            npm install
            
            log "Building frontend for production..."
            npm run build
            
            success "Frontend build completed"
        else
            warning "npm not found - skipping frontend build"
        fi
    else
        log "No frontend directory found - skipping frontend build"
    fi
}

# Start production server
start_server() {
    log "Starting production server..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Kill any existing server processes
    pkill -f "uvicorn.*main_enhanced_prod" || true
    sleep 2
    
    # Start server with production settings
    log "Starting uvicorn server..."
    
    # Use configuration from environment
    HOST=${HOST:-"0.0.0.0"}
    PORT=${PORT:-8000}
    WORKERS=${WORKERS:-4}
    
    nohup uvicorn main_enhanced_prod:app \
        --host "$HOST" \
        --port "$PORT" \
        --workers "$WORKERS" \
        --log-level info \
        --access-log \
        --no-reload \
        > "$BACKEND_DIR/server.log" 2>&1 &
    
    SERVER_PID=$!
    echo $SERVER_PID > "$BACKEND_DIR/server.pid"
    
    # Wait a moment and check if server started successfully
    sleep 5
    if kill -0 $SERVER_PID 2>/dev/null; then
        success "Server started successfully (PID: $SERVER_PID)"
        log "Server logs: tail -f $BACKEND_DIR/server.log"
        log "Server URL: http://$HOST:$PORT"
        log "API Documentation: http://$HOST:$PORT/docs"
    else
        error "Failed to start server"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    HOST=${HOST:-"localhost"}
    PORT=${PORT:-8000}
    
    # Wait for server to be ready
    for i in {1..30}; do
        if curl -f "http://$HOST:$PORT/health" >/dev/null 2>&1; then
            success "Health check passed"
            return 0
        fi
        sleep 2
    done
    
    error "Health check failed - server not responding"
}

# Docker deployment (alternative)
deploy_docker() {
    log "Deploying with Docker..."
    
    cd "$PROJECT_ROOT"
    
    if [ -f "docker-compose.prod.yml" ]; then
        log "Using Docker Compose for production deployment..."
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml build
        docker-compose -f docker-compose.prod.yml up -d
        
        success "Docker deployment completed"
    elif [ -f "Dockerfile" ]; then
        log "Building Docker image..."
        docker build -t a1betting-backend .
        
        log "Starting Docker container..."
        docker stop a1betting-backend 2>/dev/null || true
        docker rm a1betting-backend 2>/dev/null || true
        
        docker run -d \
            --name a1betting-backend \
            --env-file "$BACKEND_DIR/.env" \
            -p 8000:8000 \
            a1betting-backend
        
        success "Docker container started"
    else
        error "No Docker configuration found"
    fi
}

# Cleanup function
cleanup() {
    log "Performing cleanup..."
    
    # Remove temporary files
    rm -f "$BACKEND_DIR"/*.pyc
    find "$BACKEND_DIR" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    success "Cleanup completed"
}

# Setup monitoring (optional)
setup_monitoring() {
    log "Setting up monitoring..."
    
    if [ -n "${SENTRY_DSN}" ]; then
        log "Sentry monitoring configured"
    fi
    
    # Create log rotation configuration
    cat > "$BACKEND_DIR/logrotate.conf" << EOF
$BACKEND_DIR/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
    
    success "Monitoring setup completed"
}

# Main deployment function
main() {
    log "Starting A1Betting production deployment"
    
    # Parse command line arguments
    SKIP_TESTS=false
    USE_DOCKER=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --docker)
                USE_DOCKER=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-tests    Skip running tests"
                echo "  --docker        Use Docker deployment"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Run deployment steps
    check_prerequisites
    
    if [ "$USE_DOCKER" = true ]; then
        validate_config
        deploy_docker
    else
        setup_python_env
        validate_config
        
        if [ "$SKIP_TESTS" = false ]; then
            run_tests
        fi
        
        run_migrations
        build_frontend
        start_server
        health_check
    fi
    
    setup_monitoring
    cleanup
    
    success "🎉 A1Betting production deployment completed successfully!"
    
    # Show final information
    echo ""
    echo "=== Deployment Summary ==="
    echo "Environment: $ENVIRONMENT"
    echo "Backend URL: http://${HOST:-localhost}:${PORT:-8000}"
    echo "API Docs: http://${HOST:-localhost}:${PORT:-8000}/docs"
    echo "Log file: $LOG_FILE"
    
    if [ "$USE_DOCKER" = false ]; then
        echo "Server PID: $(cat $BACKEND_DIR/server.pid 2>/dev/null || echo 'Not available')"
        echo "Server logs: tail -f $BACKEND_DIR/server.log"
    fi
    
    echo ""
    echo "To stop the server:"
    if [ "$USE_DOCKER" = true ]; then
        echo "  docker-compose -f docker-compose.prod.yml down"
    else
        echo "  kill \$(cat $BACKEND_DIR/server.pid)"
    fi
}

# Run main function
main "$@"
