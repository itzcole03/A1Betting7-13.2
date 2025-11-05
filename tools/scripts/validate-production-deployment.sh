#!/bin/bash

# Production Deployment Validation Script for A1Betting7-13.2
# Comprehensive testing and verification of all infrastructure components

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE_PROD="a1betting-prod"
NAMESPACE_MONITORING="monitoring"
NAMESPACE_INGRESS="ingress-nginx"
TIMEOUT=300

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if namespace exists
check_namespace() {
    local namespace=$1
    if kubectl get namespace "$namespace" &>/dev/null; then
        success "Namespace '$namespace' exists"
        return 0
    else
        error "Namespace '$namespace' does not exist"
        return 1
    fi
}

# Function to check deployment status
check_deployment() {
    local namespace=$1
    local deployment=$2
    
    log "Checking deployment: $deployment in namespace: $namespace"
    
    if kubectl get deployment "$deployment" -n "$namespace" &>/dev/null; then
        local ready=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
        local desired=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}')
        
        if [ "$ready" = "$desired" ] && [ "$ready" != "0" ]; then
            success "Deployment '$deployment' is ready ($ready/$desired replicas)"
            return 0
        else
            error "Deployment '$deployment' is not ready ($ready/$desired replicas)"
            kubectl describe deployment "$deployment" -n "$namespace" | tail -10
            return 1
        fi
    else
        error "Deployment '$deployment' does not exist in namespace '$namespace'"
        return 1
    fi
}

# Function to check service status
check_service() {
    local namespace=$1
    local service=$2
    
    if kubectl get service "$service" -n "$namespace" &>/dev/null; then
        local endpoints=$(kubectl get endpoints "$service" -n "$namespace" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
        
        if [ "$endpoints" -gt 0 ]; then
            success "Service '$service' has $endpoints endpoint(s)"
            return 0
        else
            error "Service '$service' has no endpoints"
            return 1
        fi
    else
        error "Service '$service' does not exist in namespace '$namespace'"
        return 1
    fi
}

# Function to check secret exists
check_secret() {
    local namespace=$1
    local secret=$2
    
    if kubectl get secret "$secret" -n "$namespace" &>/dev/null; then
        success "Secret '$secret' exists"
        return 0
    else
        error "Secret '$secret' does not exist in namespace '$namespace'"
        return 1
    fi
}

# Function to check persistent volume claim
check_pvc() {
    local namespace=$1
    local pvc=$2
    
    if kubectl get pvc "$pvc" -n "$namespace" &>/dev/null; then
        local status=$(kubectl get pvc "$pvc" -n "$namespace" -o jsonpath='{.status.phase}')
        
        if [ "$status" = "Bound" ]; then
            success "PVC '$pvc' is bound"
            return 0
        else
            error "PVC '$pvc' status: $status"
            return 1
        fi
    else
        error "PVC '$pvc' does not exist in namespace '$namespace'"
        return 1
    fi
}

# Function to test HTTP endpoint
test_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-10}
    
    log "Testing HTTP endpoint: $url"
    
    if command -v curl &>/dev/null; then
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" || echo "000")
        
        if [ "$status_code" = "$expected_status" ]; then
            success "HTTP endpoint '$url' returned status $status_code"
            return 0
        else
            error "HTTP endpoint '$url' returned status $status_code (expected $expected_status)"
            return 1
        fi
    else
        warning "curl not available, skipping HTTP endpoint test"
        return 0
    fi
}

# Function to test database connectivity
test_database_connection() {
    local namespace=$1
    
    log "Testing database connectivity"
    
    # Test via backend pod
    local backend_pod=$(kubectl get pods -n "$namespace" -l app=a1betting-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$backend_pod" ]; then
        if kubectl exec -n "$namespace" "$backend_pod" -- pg_isready -h postgresql-service -p 5432 &>/dev/null; then
            success "Database connectivity test passed"
            return 0
        else
            error "Database connectivity test failed"
            return 1
        fi
    else
        warning "No backend pod found, skipping database connectivity test"
        return 0
    fi
}

# Function to test Redis connectivity
test_redis_connection() {
    local namespace=$1
    
    log "Testing Redis connectivity"
    
    # Test via backend pod
    local backend_pod=$(kubectl get pods -n "$namespace" -l app=a1betting-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$backend_pod" ]; then
        if kubectl exec -n "$namespace" "$backend_pod" -- redis-cli -h redis-service -p 6379 ping &>/dev/null; then
            success "Redis connectivity test passed"
            return 0
        else
            error "Redis connectivity test failed"
            return 1
        fi
    else
        warning "No backend pod found, skipping Redis connectivity test"
        return 0
    fi
}

# Function to check resource usage
check_resource_usage() {
    local namespace=$1
    
    log "Checking resource usage in namespace: $namespace"
    
    # Check if metrics server is available
    if ! kubectl top nodes &>/dev/null; then
        warning "Metrics server not available, skipping resource usage check"
        return 0
    fi
    
    local high_cpu_pods=$(kubectl top pods -n "$namespace" --no-headers 2>/dev/null | awk '$2 ~ /[0-9]+m/ && $2+0 > 500 {print $1}')
    local high_memory_pods=$(kubectl top pods -n "$namespace" --no-headers 2>/dev/null | awk '$3 ~ /[0-9]+Mi/ && $3+0 > 1000 {print $1}')
    
    if [ -n "$high_cpu_pods" ]; then
        warning "High CPU usage detected in pods: $high_cpu_pods"
    fi
    
    if [ -n "$high_memory_pods" ]; then
        warning "High memory usage detected in pods: $high_memory_pods"
    fi
    
    success "Resource usage check completed"
}

# Function to check network policies
check_network_policies() {
    local namespace=$1
    
    log "Checking network policies in namespace: $namespace"
    
    local policies=$(kubectl get networkpolicies -n "$namespace" --no-headers 2>/dev/null | wc -l)
    
    if [ "$policies" -gt 0 ]; then
        success "Found $policies network policy/policies"
        return 0
    else
        warning "No network policies found"
        return 1
    fi
}

# Function to check SSL certificates
check_ssl_certificates() {
    log "Checking SSL certificates"
    
    # Check cert-manager certificates
    if kubectl get certificates -A &>/dev/null; then
        local ready_certs=$(kubectl get certificates -A --no-headers 2>/dev/null | awk '$4=="True" {count++} END {print count+0}')
        local total_certs=$(kubectl get certificates -A --no-headers 2>/dev/null | wc -l)
        
        if [ "$ready_certs" -eq "$total_certs" ] && [ "$total_certs" -gt 0 ]; then
            success "All SSL certificates are ready ($ready_certs/$total_certs)"
            return 0
        else
            error "Some SSL certificates are not ready ($ready_certs/$total_certs)"
            return 1
        fi
    else
        warning "No SSL certificates found or cert-manager not installed"
        return 0
    fi
}

# Function to run security checks
run_security_checks() {
    log "Running security checks"
    
    local issues=0
    
    # Check for privileged containers
    local privileged_pods=$(kubectl get pods -A -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.securityContext.privileged}{"\n"}{end}{end}' 2>/dev/null | grep -c "true" || echo "0")
    
    if [ "$privileged_pods" -gt 0 ]; then
        error "Found $privileged_pods privileged container(s)"
        ((issues++))
    else
        success "No privileged containers found"
    fi
    
    # Check for containers running as root
    local root_containers=$(kubectl get pods -n "$NAMESPACE_PROD" -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.securityContext.runAsUser}{"\n"}{end}{end}' 2>/dev/null | grep -c "^0$\|^$" || echo "0")
    
    if [ "$root_containers" -gt 0 ]; then
        warning "Found $root_containers container(s) potentially running as root"
        ((issues++))
    else
        success "No containers running as root"
    fi
    
    if [ "$issues" -eq 0 ]; then
        success "Security checks passed"
        return 0
    else
        error "Security checks found $issues issue(s)"
        return 1
    fi
}

# Main validation function
main() {
    log "Starting A1Betting7-13.2 Production Deployment Validation"
    echo "=================================================================="
    
    local exit_code=0
    
    # Check prerequisites
    if ! command -v kubectl &>/dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Test cluster connectivity
    if ! kubectl cluster-info &>/dev/null; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    success "Connected to Kubernetes cluster"
    
    # Check namespaces
    echo -e "\n${BLUE}=== Namespace Validation ===${NC}"
    check_namespace "$NAMESPACE_PROD" || ((exit_code++))
    check_namespace "$NAMESPACE_MONITORING" || ((exit_code++))
    check_namespace "$NAMESPACE_INGRESS" || ((exit_code++))
    
    # Check secrets
    echo -e "\n${BLUE}=== Secrets Validation ===${NC}"
    check_secret "$NAMESPACE_PROD" "postgres-credentials" || ((exit_code++))
    check_secret "$NAMESPACE_PROD" "redis-credentials" || ((exit_code++))
    check_secret "$NAMESPACE_PROD" "api-keys" || ((exit_code++))
    check_secret "$NAMESPACE_PROD" "jwt-secrets" || ((exit_code++))
    
    # Check persistent volume claims
    echo -e "\n${BLUE}=== Storage Validation ===${NC}"
    check_pvc "$NAMESPACE_PROD" "postgres-pvc" || ((exit_code++))
    check_pvc "$NAMESPACE_PROD" "redis-pvc" || ((exit_code++))
    check_pvc "$NAMESPACE_PROD" "backup-pvc" || ((exit_code++))
    
    # Check database deployments
    echo -e "\n${BLUE}=== Database Validation ===${NC}"
    check_deployment "$NAMESPACE_PROD" "postgresql" || ((exit_code++))
    check_deployment "$NAMESPACE_PROD" "pgbouncer" || ((exit_code++))
    check_deployment "$NAMESPACE_PROD" "redis" || ((exit_code++))
    
    # Check application deployments
    echo -e "\n${BLUE}=== Application Validation ===${NC}"
    check_deployment "$NAMESPACE_PROD" "a1betting-backend" || ((exit_code++))
    check_deployment "$NAMESPACE_PROD" "a1betting-frontend" || ((exit_code++))
    
    # Check monitoring deployments
    echo -e "\n${BLUE}=== Monitoring Validation ===${NC}"
    check_deployment "$NAMESPACE_MONITORING" "prometheus" || ((exit_code++))
    check_deployment "$NAMESPACE_MONITORING" "grafana" || ((exit_code++))
    
    # Check ingress controller
    echo -e "\n${BLUE}=== Ingress Validation ===${NC}"
    check_deployment "$NAMESPACE_INGRESS" "nginx-ingress-controller" || ((exit_code++))
    
    # Check services
    echo -e "\n${BLUE}=== Service Validation ===${NC}"
    check_service "$NAMESPACE_PROD" "postgresql-service" || ((exit_code++))
    check_service "$NAMESPACE_PROD" "pgbouncer-service" || ((exit_code++))
    check_service "$NAMESPACE_PROD" "redis-service" || ((exit_code++))
    check_service "$NAMESPACE_PROD" "a1betting-backend" || ((exit_code++))
    check_service "$NAMESPACE_PROD" "a1betting-frontend" || ((exit_code++))
    
    # Test connectivity
    echo -e "\n${BLUE}=== Connectivity Tests ===${NC}"
    test_database_connection "$NAMESPACE_PROD" || ((exit_code++))
    test_redis_connection "$NAMESPACE_PROD" || ((exit_code++))
    
    # Check network policies
    echo -e "\n${BLUE}=== Network Security Validation ===${NC}"
    check_network_policies "$NAMESPACE_PROD" || ((exit_code++))
    
    # Check SSL certificates
    echo -e "\n${BLUE}=== SSL Certificate Validation ===${NC}"
    check_ssl_certificates || ((exit_code++))
    
    # Resource usage checks
    echo -e "\n${BLUE}=== Resource Usage Validation ===${NC}"
    check_resource_usage "$NAMESPACE_PROD"
    check_resource_usage "$NAMESPACE_MONITORING"
    
    # Security checks
    echo -e "\n${BLUE}=== Security Validation ===${NC}"
    run_security_checks || ((exit_code++))
    
    # HTTP endpoint tests (if ingress is configured)
    echo -e "\n${BLUE}=== HTTP Endpoint Tests ===${NC}"
    local ingress_ip=$(kubectl get service nginx-ingress-service -n "$NAMESPACE_INGRESS" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    
    if [ -n "$ingress_ip" ]; then
        test_http_endpoint "http://$ingress_ip/api/health" 200 || warning "Health endpoint test failed"
    else
        warning "Ingress IP not available, skipping HTTP endpoint tests"
    fi
    
    # Summary
    echo -e "\n${BLUE}=== Validation Summary ===${NC}"
    if [ "$exit_code" -eq 0 ]; then
        success "All validation checks passed! Production deployment is ready."
    else
        error "Validation failed with $exit_code issue(s). Please review and fix before proceeding."
    fi
    
    # Additional recommendations
    echo -e "\n${BLUE}=== Recommendations ===${NC}"
    echo "1. Run load testing to verify performance under expected traffic"
    echo "2. Test backup and recovery procedures"
    echo "3. Verify monitoring alerts are working correctly"
    echo "4. Conduct security penetration testing"
    echo "5. Document runbook procedures for operations team"
    echo "6. Test disaster recovery scenarios"
    
    exit $exit_code
}

# Run the validation
main "$@"
