"""
Metrics Exposition Snippet for Phase 1 Error & Security Hardening

This demonstrates how to access and interpret metrics data from the
implemented error taxonomy and rate limiting systems.

Usage:
    python validation_artifacts/metrics_exposition.py
"""

import requests
import json
import time
from typing import Dict, Any


def fetch_prometheus_metrics(base_url: str = "http://localhost:8000") -> str:
    """
    Fetch Prometheus metrics from the /api/metrics endpoint
    
    Returns:
        Raw Prometheus metrics text format
    """
    try:
        response = requests.get(f"{base_url}/api/metrics", timeout=10)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        return f"Error fetching metrics: {e}"


def parse_error_metrics(metrics_text: str) -> Dict[str, Dict[str, float]]:
    """
    Parse error-related metrics from Prometheus format
    
    Args:
        metrics_text: Raw Prometheus metrics
        
    Returns:
        Dictionary with error metrics organized by category
    """
    error_metrics = {
        "error_responses": {},
        "rate_limiting": {},
        "validation": {}
    }
    
    lines = metrics_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
            
        # Parse error response counters
        if 'error_responses_total' in line:
            parts = line.split()
            if len(parts) >= 2:
                metric_name = parts[0]
                value = float(parts[1])
                
                # Extract error code from metric labels
                if '{' in metric_name and '}' in metric_name:
                    labels = metric_name.split('{')[1].split('}')[0]
                    if 'code=' in labels:
                        code = labels.split('code="')[1].split('"')[0]
                        error_metrics["error_responses"][code] = value
        
        # Parse rate limiting metrics
        elif 'rate_limit' in line.lower():
            parts = line.split()
            if len(parts) >= 2:
                metric_name = parts[0]
                value = float(parts[1])
                error_metrics["rate_limiting"][metric_name] = value
                
        # Parse validation metrics
        elif 'validation' in line.lower():
            parts = line.split()
            if len(parts) >= 2:
                metric_name = parts[0]
                value = float(parts[1])
                error_metrics["validation"][metric_name] = value
    
    return error_metrics


def demonstrate_error_taxonomy_metrics(base_url: str = "http://localhost:8000"):
    """
    Demonstrate error taxonomy metrics by triggering various error types
    """
    print("=== Error Taxonomy Metrics Demonstration ===")
    print()
    
    # Fetch baseline metrics
    baseline_metrics = fetch_prometheus_metrics(base_url)
    baseline_parsed = parse_error_metrics(baseline_metrics)
    
    print("1. Baseline Error Metrics:")
    for category, metrics in baseline_parsed.items():
        if metrics:
            print(f"   {category}: {json.dumps(metrics, indent=4)}")
    print()
    
    # Trigger validation error (invalid payload)
    print("2. Triggering E1000_VALIDATION error...")
    try:
        response = requests.post(
            f"{base_url}/api/sports/activate/INVALID_SPORT",
            json={"invalid": "payload"},
            timeout=5
        )
        print(f"   Response: {response.status_code} - {response.json()['error']['code']}")
    except Exception as e:
        print(f"   Error triggering validation: {e}")
    
    # Trigger 404 error
    print("3. Triggering E4040_NOT_FOUND error...")
    try:
        response = requests.get(f"{base_url}/api/nonexistent/endpoint", timeout=5)
        print(f"   Response: {response.status_code} - {response.json()['error']['code']}")
    except Exception as e:
        print(f"   Error triggering 404: {e}")
    
    # Small delay for metrics to update
    time.sleep(0.5)
    
    # Fetch updated metrics
    updated_metrics = fetch_prometheus_metrics(base_url)
    updated_parsed = parse_error_metrics(updated_metrics)
    
    print()
    print("4. Updated Error Metrics:")
    for category, metrics in updated_parsed.items():
        if metrics:
            print(f"   {category}: {json.dumps(metrics, indent=4)}")
    print()


def demonstrate_rate_limiting_metrics(base_url: str = "http://localhost:8000"):
    """
    Demonstrate rate limiting metrics by making multiple requests
    """
    print("=== Rate Limiting Metrics Demonstration ===")
    print()
    
    # Make rapid requests to observe rate limiting
    print("1. Making 10 rapid requests to /api/health...")
    
    rate_limit_headers = []
    status_codes = []
    
    for i in range(10):
        try:
            response = requests.get(f"{base_url}/api/health", timeout=5)
            status_codes.append(response.status_code)
            
            # Capture rate limit headers
            headers = {
                'limit': response.headers.get('x-ratelimit-limit', 'N/A'),
                'remaining': response.headers.get('x-ratelimit-remaining', 'N/A'),
                'reset': response.headers.get('x-ratelimit-reset', 'N/A')
            }
            rate_limit_headers.append(headers)
            
            if i % 3 == 0:  # Log every 3rd request
                print(f"   Request {i+1}: Status={response.status_code}, "
                      f"Remaining={headers['remaining']}")
            
        except Exception as e:
            print(f"   Request {i+1} failed: {e}")
        
        time.sleep(0.1)  # Small delay between requests
    
    print()
    print("2. Rate Limit Header Analysis:")
    if rate_limit_headers:
        first = rate_limit_headers[0]
        last = rate_limit_headers[-1]
        
        print(f"   First request - Limit: {first['limit']}, Remaining: {first['remaining']}")
        print(f"   Last request - Limit: {last['limit']}, Remaining: {last['remaining']}")
        
        # Check if any requests were rate limited
        rate_limited_count = sum(1 for code in status_codes if code == 429)
        print(f"   Rate limited requests: {rate_limited_count}/10")
    
    print()
    
    # Fetch rate limiting metrics
    metrics_text = fetch_prometheus_metrics(base_url)
    rate_metrics = parse_error_metrics(metrics_text)
    
    print("3. Rate Limiting Metrics from Prometheus:")
    if rate_metrics["rate_limiting"]:
        for metric, value in rate_metrics["rate_limiting"].items():
            print(f"   {metric}: {value}")
    else:
        print("   No rate limiting metrics found (may need custom metric names)")
    
    print()


def health_check_with_metrics(base_url: str = "http://localhost:8000"):
    """
    Perform health check and show structured response format
    """
    print("=== Health Check with Structured Response ===")
    print()
    
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print()
        
        print("Response Headers (Rate Limiting):")
        rate_headers = {
            'X-RateLimit-Limit': response.headers.get('x-ratelimit-limit', 'Not Set'),
            'X-RateLimit-Remaining': response.headers.get('x-ratelimit-remaining', 'Not Set'),
            'X-RateLimit-Reset': response.headers.get('x-ratelimit-reset', 'Not Set'),
        }
        
        for header, value in rate_headers.items():
            print(f"  {header}: {value}")
        print()
        
        print("Response Body:")
        response_data = response.json()
        print(json.dumps(response_data, indent=2))
        print()
        
        # Validate response structure
        print("Response Structure Validation:")
        required_fields = ['success', 'data', 'meta']
        
        for field in required_fields:
            present = field in response_data
            print(f"  {field}: {'✓ Present' if present else '✗ Missing'}")
        
        if 'meta' in response_data:
            meta = response_data['meta']
            print(f"  Request ID: {meta.get('request_id', 'Not Set')}")
            print(f"  Timestamp: {meta.get('timestamp', 'Not Set')}")
        
        print()
        
    except Exception as e:
        print(f"Health check failed: {e}")
        print()


def main():
    """
    Run complete metrics exposition demonstration
    """
    base_url = "http://localhost:8000"
    
    print("Phase 1 Error & Security Hardening - Metrics Exposition")
    print("=" * 60)
    print()
    
    # Check if server is running
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        print(f"✓ Backend server is running at {base_url}")
        print()
    except Exception as e:
        print(f"✗ Backend server is not accessible at {base_url}")
        print(f"  Error: {e}")
        print()
        print("Please ensure the backend server is running:")
        print("  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload")
        return
    
    # Run demonstrations
    health_check_with_metrics(base_url)
    demonstrate_error_taxonomy_metrics(base_url)
    demonstrate_rate_limiting_metrics(base_url)
    
    print("Metrics Exposition Complete!")
    print()
    print("To monitor metrics in real-time:")
    print(f"  curl {base_url}/api/metrics")
    print()
    print("To view health endpoint with rate limiting headers:")
    print(f"  curl -v {base_url}/api/health")


if __name__ == "__main__":
    main()
