# Production Deployment Implementation Guide

## Overview

This guide provides step-by-step instructions for deploying A1Betting7-13.2 to production using modern best practices and the infrastructure created in the previous planning phase.

## Prerequisites Checklist

### Infrastructure Requirements

- [ ] Kubernetes cluster (v1.25+) with RBAC enabled
- [ ] kubectl configured with cluster admin access
- [ ] Helm v3.8+ installed
- [ ] Docker registry access (DockerHub, AWS ECR, or GCR)
- [ ] DNS management for custom domains
- [ ] SSL/TLS certificates (Let's Encrypt or commercial)

### External Services Setup

- [ ] PostgreSQL 15+ production instance or RDS
- [ ] Redis 7+ production instance or ElastiCache
- [ ] Container registry account
- [ ] Domain name and DNS provider
- [ ] Monitoring and alerting services

### API Keys and Secrets

- [ ] SportRadar API key
- [ ] The Odds API key
- [ ] Weather API key
- [ ] News API key
- [ ] SMTP credentials for notifications
- [ ] S3 backup credentials (optional)

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Create Kubernetes Namespaces

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: a1betting-prod
  labels:
    name: a1betting-prod
    environment: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    name: monitoring
    environment: production
EOF
```

### 1.2 Deploy PostgreSQL Database

```bash
# Create database secrets
kubectl create secret generic postgres-credentials \
  --from-literal=postgres-password=YOUR_STRONG_PASSWORD \
  --from-literal=postgres-user=a1betting \
  --namespace=a1betting-prod

# Deploy PostgreSQL
kubectl apply -f infrastructure/database/postgres-deployment.yaml
```

### 1.3 Deploy Redis Cache

```bash
# Create Redis secrets
kubectl create secret generic redis-credentials \
  --from-literal=redis-password=YOUR_REDIS_PASSWORD \
  --namespace=a1betting-prod

# Deploy Redis
kubectl apply -f infrastructure/database/redis-deployment.yaml
```

### 1.4 Setup Monitoring Stack

```bash
# Create monitoring namespace and deploy stack
kubectl apply -f infrastructure/monitoring/observability-stack.yaml

# Wait for monitoring stack to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=prometheus --timeout=300s -n monitoring
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana --timeout=300s -n monitoring
```

## Phase 2: Application Deployment (Week 2)

### 2.1 Build and Push Container Images

```bash
# Build backend image
docker build -f Dockerfile.backend.prod -t your-registry/a1betting-backend:v1.0.0 .
docker push your-registry/a1betting-backend:v1.0.0

# Build frontend image
cd frontend
docker build -f Dockerfile.prod -t your-registry/a1betting-frontend:v1.0.0 .
docker push your-registry/a1betting-frontend:v1.0.0
cd ..
```

### 2.2 Create Application Secrets

```bash
# Create application secrets from environment template
kubectl create secret generic app-secrets \
  --from-env-file=config/production.env.example \
  --namespace=a1betting-prod

# Create JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=jwt-secret-key=$(openssl rand -base64 32) \
  --namespace=a1betting-prod

# Create API keys secret
kubectl create secret generic api-keys \
  --from-literal=sportradar-api-key=YOUR_SPORTRADAR_KEY \
  --from-literal=the-odds-api-key=YOUR_ODDS_KEY \
  --from-literal=weather-api-key=YOUR_WEATHER_KEY \
  --from-literal=news-api-key=YOUR_NEWS_KEY \
  --namespace=a1betting-prod
```

### 2.3 Deploy Application using Helm

```bash
# Add Bitnami repository for dependencies
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy application
helm install a1betting ./helm/a1betting \
  --namespace=a1betting-prod \
  --values=./helm/a1betting/values-production.yaml \
  --set image.backend.repository=your-registry/a1betting-backend \
  --set image.frontend.repository=your-registry/a1betting-frontend \
  --set image.backend.tag=v1.0.0 \
  --set image.frontend.tag=v1.0.0
```

### 2.4 Verify Deployment

```bash
# Check pod status
kubectl get pods -n a1betting-prod

# Check services
kubectl get services -n a1betting-prod

# Check ingress
kubectl get ingress -n a1betting-prod

# View logs
kubectl logs -f deployment/a1betting-backend -n a1betting-prod
kubectl logs -f deployment/a1betting-frontend -n a1betting-prod
```

## Phase 3: Production Configuration (Week 3)

### 3.1 Configure Load Balancer and SSL

```bash
# Install cert-manager for SSL certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 3.2 Configure DNS and Ingress

```bash
# Update your DNS provider to point your domain to the load balancer IP
# Get the external IP
kubectl get service nginx-ingress-controller --output jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Update ingress with your domain
kubectl patch ingress a1betting-ingress -n a1betting-prod --type merge --patch '
{
  "spec": {
    "tls": [
      {
        "hosts": ["yourdomain.com", "www.yourdomain.com"],
        "secretName": "a1betting-tls"
      }
    ],
    "rules": [
      {
        "host": "yourdomain.com",
        "http": {
          "paths": [
            {
              "path": "/",
              "pathType": "Prefix",
              "backend": {
                "service": {
                  "name": "a1betting-frontend",
                  "port": {"number": 80}
                }
              }
            },
            {
              "path": "/api",
              "pathType": "Prefix",
              "backend": {
                "service": {
                  "name": "a1betting-backend",
                  "port": {"number": 8000}
                }
              }
            }
          ]
        }
      }
    ]
  }
}'
```

### 3.3 Database Migration and Initial Data

```bash
# Run database migrations
kubectl exec -it deployment/a1betting-backend -n a1betting-prod -- \
  python -m alembic upgrade head

# Load initial data (if needed)
kubectl exec -it deployment/a1betting-backend -n a1betting-prod -- \
  python scripts/load_initial_data.py
```

## Phase 4: Monitoring and Alerting (Week 4)

### 4.1 Configure Grafana Dashboards

```bash
# Get Grafana admin password
kubectl get secret grafana-admin-credentials -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode

# Access Grafana UI
kubectl port-forward service/grafana 3000:80 -n monitoring

# Import pre-built dashboards:
# - Application Performance Monitoring
# - Infrastructure Monitoring
# - Business Metrics
# - Error Tracking
```

### 4.2 Setup Alerting Rules

```bash
# Configure alert rules in Prometheus
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alert-rules
  namespace: monitoring
data:
  alert.rules: |
    groups:
    - name: a1betting.rules
      rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High error rate detected
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: High response time detected
      - alert: DatabaseConnectionFailure
        expr: up{job="postgresql"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Database connection failed
EOF
```

### 4.3 Configure Notification Channels

```bash
# Setup Slack/Discord webhooks in Grafana or Alertmanager
# Configure email notifications
# Setup PagerDuty integration for critical alerts
```

## Phase 5: Security Hardening

### 5.1 Network Policies

```bash
# Apply network policies for isolation
kubectl apply -f infrastructure/security/network-policies.yaml
```

### 5.2 RBAC Configuration

```bash
# Create service accounts with minimal permissions
kubectl apply -f infrastructure/security/rbac.yaml
```

### 5.3 Security Scanning

```bash
# Run security scans on container images
trivy image your-registry/a1betting-backend:v1.0.0
trivy image your-registry/a1betting-frontend:v1.0.0

# Scan Kubernetes manifests
kube-score score infrastructure/production/app-deployment.yaml
```

## Phase 6: Backup and Disaster Recovery

### 6.1 Database Backup

```bash
# Create backup CronJob
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: a1betting-prod
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - pg_dump \$DATABASE_URL | gzip > /backup/backup-\$(date +%Y%m%d-%H%M%S).sql.gz
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

### 6.2 Application State Backup

```bash
# Backup application secrets and configurations
kubectl get secrets -n a1betting-prod -o yaml > backup/secrets-backup.yaml
kubectl get configmaps -n a1betting-prod -o yaml > backup/configmaps-backup.yaml
```

## Phase 7: Performance Optimization

### 7.1 Resource Optimization

```bash
# Monitor resource usage
kubectl top nodes
kubectl top pods -n a1betting-prod

# Adjust resource requests and limits based on actual usage
helm upgrade a1betting ./helm/a1betting \
  --namespace=a1betting-prod \
  --reuse-values \
  --set resources.backend.requests.memory=512Mi \
  --set resources.backend.limits.memory=1Gi
```

### 7.2 Horizontal Pod Autoscaler

```bash
# HPA is already configured in the deployment
# Monitor scaling behavior
kubectl get hpa -n a1betting-prod
kubectl describe hpa a1betting-backend-hpa -n a1betting-prod
```

## Phase 8: CI/CD Pipeline Setup

### 8.1 GitHub Actions Configuration

The CI/CD pipeline is already defined in `.github/workflows/production-ci-cd.yml`. Configure the following secrets in your GitHub repository:

```bash
# Required GitHub Secrets:
DOCKER_USERNAME
DOCKER_PASSWORD
KUBE_CONFIG_DATA  # Base64 encoded kubeconfig
SPORTRADAR_API_KEY
THE_ODDS_API_KEY
WEATHER_API_KEY
NEWS_API_KEY
POSTGRES_PASSWORD
REDIS_PASSWORD
JWT_SECRET_KEY
```

### 8.2 GitOps with ArgoCD (Optional)

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create application
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: a1betting-prod
  namespace: argocd
spec:
  destination:
    namespace: a1betting-prod
    server: https://kubernetes.default.svc
  project: default
  source:
    path: helm/a1betting
    repoURL: https://github.com/yourusername/A1Betting7-13.2
    targetRevision: main
    helm:
      valueFiles:
      - values-production.yaml
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF
```

## Post-Deployment Verification

### Final Checklist

- [ ] Application accessible via HTTPS
- [ ] All health checks passing
- [ ] Database connections working
- [ ] Cache working properly
- [ ] Monitoring dashboards showing data
- [ ] Alerts configured and tested
- [ ] Backup procedures tested
- [ ] Performance meets requirements
- [ ] Security scans passed
- [ ] Documentation updated

### Load Testing

```bash
# Use k6 or similar tool for load testing
k6 run --vus 50 --duration 5m load-test.js
```

### Smoke Tests

```bash
# Run automated smoke tests
kubectl exec -it deployment/a1betting-backend -n a1betting-prod -- \
  python -m pytest tests/smoke/ -v
```

## Maintenance and Operations

### Daily Operations

- Monitor application logs and metrics
- Check resource usage and scaling
- Review security alerts
- Verify backup completion

### Weekly Operations

- Review performance metrics
- Update dependencies (security patches)
- Capacity planning review
- Disaster recovery testing

### Monthly Operations

- Security vulnerability assessment
- Performance optimization review
- Cost optimization analysis
- Backup restore testing

## Troubleshooting Guide

### Common Issues

1. **Pod CrashLoopBackOff**

   ```bash
   kubectl logs pod-name -n a1betting-prod --previous
   kubectl describe pod pod-name -n a1betting-prod
   ```

2. **Database Connection Issues**

   ```bash
   kubectl exec -it deployment/a1betting-backend -n a1betting-prod -- \
     python -c "import psycopg2; print('DB connection test')"
   ```

3. **High Memory Usage**

   ```bash
   kubectl top pods -n a1betting-prod --sort-by=memory
   ```

4. **SSL Certificate Issues**
   ```bash
   kubectl describe certificate a1betting-tls -n a1betting-prod
   kubectl describe certificaterequest -n a1betting-prod
   ```

## Contact and Support

- Infrastructure Team: infra@yourdomain.com
- DevOps Team: devops@yourdomain.com
- On-call: +1-xxx-xxx-xxxx

---

**Important Notes:**

- Always test changes in staging environment first
- Maintain detailed runbooks for all procedures
- Regular security audits and penetration testing
- Keep documentation updated with any changes
- Follow change management procedures for production updates
