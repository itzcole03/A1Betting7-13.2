#!/usr/bin/env python3
"""
Real-Time Performance Metrics System

Provides comprehensive performance tracking, optimization suggestions,
and real-time monitoring capabilities for the A1Betting platform.
"""

import time
import psutil
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import deque
import json
import threading
from pathlib import Path

@dataclass
class PerformanceMetric:
    timestamp: float
    metric_name: str
    value: float
    unit: str
    category: str

@dataclass
class SystemSnapshot:
    timestamp: float
    cpu_percent: float
    memory_percent: float
    disk_usage: float
    network_io: Dict[str, int]
    active_connections: int
    response_time_avg: float
    error_rate: float
    throughput: float

class RealTimePerformanceMetrics:
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self.metrics_history: deque = deque(maxlen=max_history)
        self.system_snapshots: deque = deque(maxlen=max_history)
        self.performance_alerts: List[Dict] = []
        
        # Performance thresholds
        self.thresholds = {
            'cpu_critical': 90.0,
            'cpu_warning': 70.0,
            'memory_critical': 90.0,
            'memory_warning': 80.0,
            'response_time_critical': 5000.0,  # 5 seconds
            'response_time_warning': 2000.0,   # 2 seconds
            'error_rate_critical': 5.0,        # 5%
            'error_rate_warning': 2.0          # 2%
        }
        
        # Monitoring state
        self.is_monitoring = False
        self.monitor_thread = None
        self.last_network_io = None
        
        # Performance optimization suggestions
        self.optimization_suggestions = []
        
        # Setup logging
        self.logger = self.setup_logging()
        
    def setup_logging(self) -> logging.Logger:
        """Setup performance metrics logging"""
        logger = logging.getLogger('performance_metrics')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.FileHandler('performance_metrics.log')
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def record_metric(self, name: str, value: float, unit: str = "", category: str = "general"):
        """Record a performance metric"""
        metric = PerformanceMetric(
            timestamp=time.time(),
            metric_name=name,
            value=value,
            unit=unit,
            category=category
        )
        
        self.metrics_history.append(metric)
        self.logger.debug(f"Recorded metric: {name} = {value} {unit}")
    
    def get_system_metrics(self) -> SystemSnapshot:
        """Capture current system performance metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Network I/O
            network_io = psutil.net_io_counters()._asdict()
            
            # Calculate network throughput if we have previous data
            if self.last_network_io:
                bytes_sent_diff = network_io['bytes_sent'] - self.last_network_io['bytes_sent']
                bytes_recv_diff = network_io['bytes_recv'] - self.last_network_io['bytes_recv']
                throughput = (bytes_sent_diff + bytes_recv_diff) / 1024 / 1024  # MB/s
            else:
                throughput = 0.0
            
            self.last_network_io = network_io
            
            # Active connections (simplified)
            try:
                active_connections = len(psutil.net_connections())
            except:
                active_connections = 0
            
            snapshot = SystemSnapshot(
                timestamp=time.time(),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                disk_usage=disk.percent,
                network_io=network_io,
                active_connections=active_connections,
                response_time_avg=self.calculate_avg_response_time(),
                error_rate=self.calculate_error_rate(),
                throughput=throughput
            )
            
            self.system_snapshots.append(snapshot)
            return snapshot
            
        except Exception as e:
            self.logger.error(f"Error capturing system metrics: {e}")
            return None
    
    def calculate_avg_response_time(self) -> float:
        """Calculate average response time from recent metrics"""
        response_time_metrics = [
            m for m in list(self.metrics_history)[-100:] 
            if m.metric_name == 'response_time'
        ]
        
        if not response_time_metrics:
            return 0.0
        
        return sum(m.value for m in response_time_metrics) / len(response_time_metrics)
    
    def calculate_error_rate(self) -> float:
        """Calculate error rate from recent metrics"""
        recent_time = time.time() - 300  # Last 5 minutes
        
        error_metrics = [
            m for m in list(self.metrics_history) 
            if m.timestamp > recent_time and m.metric_name in ['error', 'exception']
        ]
        
        success_metrics = [
            m for m in list(self.metrics_history)
            if m.timestamp > recent_time and m.metric_name == 'request_success'
        ]
        
        total_requests = len(error_metrics) + len(success_metrics)
        if total_requests == 0:
            return 0.0
        
        return (len(error_metrics) / total_requests) * 100
    
    def check_performance_alerts(self, snapshot: SystemSnapshot):
        """Check for performance issues and generate alerts"""
        alerts = []
        
        # CPU alerts
        if snapshot.cpu_percent >= self.thresholds['cpu_critical']:
            alerts.append({
                'level': 'critical',
                'metric': 'cpu_usage',
                'value': snapshot.cpu_percent,
                'threshold': self.thresholds['cpu_critical'],
                'message': f'Critical CPU usage: {snapshot.cpu_percent:.1f}%'
            })
        elif snapshot.cpu_percent >= self.thresholds['cpu_warning']:
            alerts.append({
                'level': 'warning',
                'metric': 'cpu_usage',
                'value': snapshot.cpu_percent,
                'threshold': self.thresholds['cpu_warning'],
                'message': f'High CPU usage: {snapshot.cpu_percent:.1f}%'
            })
        
        # Memory alerts
        if snapshot.memory_percent >= self.thresholds['memory_critical']:
            alerts.append({
                'level': 'critical',
                'metric': 'memory_usage',
                'value': snapshot.memory_percent,
                'threshold': self.thresholds['memory_critical'],
                'message': f'Critical memory usage: {snapshot.memory_percent:.1f}%'
            })
        elif snapshot.memory_percent >= self.thresholds['memory_warning']:
            alerts.append({
                'level': 'warning',
                'metric': 'memory_usage',
                'value': snapshot.memory_percent,
                'threshold': self.thresholds['memory_warning'],
                'message': f'High memory usage: {snapshot.memory_percent:.1f}%'
            })
        
        # Response time alerts
        if snapshot.response_time_avg >= self.thresholds['response_time_critical']:
            alerts.append({
                'level': 'critical',
                'metric': 'response_time',
                'value': snapshot.response_time_avg,
                'threshold': self.thresholds['response_time_critical'],
                'message': f'Critical response time: {snapshot.response_time_avg:.0f}ms'
            })
        elif snapshot.response_time_avg >= self.thresholds['response_time_warning']:
            alerts.append({
                'level': 'warning',
                'metric': 'response_time',
                'value': snapshot.response_time_avg,
                'threshold': self.thresholds['response_time_warning'],
                'message': f'High response time: {snapshot.response_time_avg:.0f}ms'
            })
        
        # Error rate alerts
        if snapshot.error_rate >= self.thresholds['error_rate_critical']:
            alerts.append({
                'level': 'critical',
                'metric': 'error_rate',
                'value': snapshot.error_rate,
                'threshold': self.thresholds['error_rate_critical'],
                'message': f'Critical error rate: {snapshot.error_rate:.1f}%'
            })
        elif snapshot.error_rate >= self.thresholds['error_rate_warning']:
            alerts.append({
                'level': 'warning',
                'metric': 'error_rate',
                'value': snapshot.error_rate,
                'threshold': self.thresholds['error_rate_warning'],
                'message': f'High error rate: {snapshot.error_rate:.1f}%'
            })
        
        # Add alerts with timestamps
        for alert in alerts:
            alert['timestamp'] = time.time()
            self.performance_alerts.append(alert)
            self.logger.warning(f"Performance alert: {alert['message']}")
        
        # Keep only recent alerts (last hour)
        cutoff_time = time.time() - 3600
        self.performance_alerts = [
            alert for alert in self.performance_alerts 
            if alert['timestamp'] > cutoff_time
        ]
    
    def generate_optimization_suggestions(self) -> List[Dict]:
        """Generate performance optimization suggestions"""
        suggestions = []
        
        if not self.system_snapshots:
            return suggestions
        
        recent_snapshots = list(self.system_snapshots)[-10:]  # Last 10 snapshots
        
        # Analyze CPU usage patterns
        avg_cpu = sum(s.cpu_percent for s in recent_snapshots) / len(recent_snapshots)
        if avg_cpu > 70:
            suggestions.append({
                'category': 'cpu_optimization',
                'priority': 'high',
                'suggestion': 'Consider implementing CPU-intensive task queuing or horizontal scaling',
                'current_value': f'{avg_cpu:.1f}%',
                'target_value': '< 70%'
            })
        
        # Analyze memory usage patterns
        avg_memory = sum(s.memory_percent for s in recent_snapshots) / len(recent_snapshots)
        if avg_memory > 80:
            suggestions.append({
                'category': 'memory_optimization',
                'priority': 'high',
                'suggestion': 'Implement memory caching strategies and optimize data structures',
                'current_value': f'{avg_memory:.1f}%',
                'target_value': '< 80%'
            })
        
        # Analyze response time patterns
        avg_response_time = sum(s.response_time_avg for s in recent_snapshots) / len(recent_snapshots)
        if avg_response_time > 1000:  # 1 second
            suggestions.append({
                'category': 'response_time_optimization',
                'priority': 'medium',
                'suggestion': 'Optimize database queries and implement response caching',
                'current_value': f'{avg_response_time:.0f}ms',
                'target_value': '< 1000ms'
            })
        
        # Analyze error rate patterns
        avg_error_rate = sum(s.error_rate for s in recent_snapshots) / len(recent_snapshots)
        if avg_error_rate > 1.0:
            suggestions.append({
                'category': 'error_reduction',
                'priority': 'high',
                'suggestion': 'Implement better error handling and input validation',
                'current_value': f'{avg_error_rate:.1f}%',
                'target_value': '< 1%'
            })
        
        return suggestions
    
    def start_monitoring(self, interval: float = 10.0):
        """Start real-time performance monitoring"""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, args=(interval,))
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        
        self.logger.info(f"Started performance monitoring with {interval}s interval")
    
    def stop_monitoring(self):
        """Stop real-time performance monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5.0)
        
        self.logger.info("Stopped performance monitoring")
    
    def _monitor_loop(self, interval: float):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                snapshot = self.get_system_metrics()
                if snapshot:
                    self.check_performance_alerts(snapshot)
                
                time.sleep(interval)
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(interval)
    
    def get_performance_summary(self) -> Dict:
        """Get comprehensive performance summary"""
        if not self.system_snapshots:
            return {}
        
        recent_snapshots = list(self.system_snapshots)[-60:]  # Last 60 snapshots
        
        summary = {
            'timestamp': time.time(),
            'monitoring_duration': len(self.system_snapshots) * 10,  # Assuming 10s intervals
            'current_metrics': asdict(self.system_snapshots[-1]) if self.system_snapshots else {},
            'averages': {
                'cpu_percent': sum(s.cpu_percent for s in recent_snapshots) / len(recent_snapshots),
                'memory_percent': sum(s.memory_percent for s in recent_snapshots) / len(recent_snapshots),
                'response_time': sum(s.response_time_avg for s in recent_snapshots) / len(recent_snapshots),
                'error_rate': sum(s.error_rate for s in recent_snapshots) / len(recent_snapshots)
            },
            'peak_values': {
                'cpu_percent': max(s.cpu_percent for s in recent_snapshots),
                'memory_percent': max(s.memory_percent for s in recent_snapshots),
                'response_time': max(s.response_time_avg for s in recent_snapshots),
                'error_rate': max(s.error_rate for s in recent_snapshots)
            },
            'active_alerts': len([a for a in self.performance_alerts if a['timestamp'] > time.time() - 300]),
            'optimization_suggestions': self.generate_optimization_suggestions(),
            'health_score': self.calculate_health_score()
        }
        
        return summary
    
    def calculate_health_score(self) -> float:
        """Calculate overall system health score (0-100)"""
        if not self.system_snapshots:
            return 100.0
        
        latest = self.system_snapshots[-1]
        score = 100.0
        
        # CPU penalty
        if latest.cpu_percent > 90:
            score -= 30
        elif latest.cpu_percent > 70:
            score -= 15
        elif latest.cpu_percent > 50:
            score -= 5
        
        # Memory penalty
        if latest.memory_percent > 90:
            score -= 25
        elif latest.memory_percent > 80:
            score -= 10
        elif latest.memory_percent > 60:
            score -= 3
        
        # Response time penalty
        if latest.response_time_avg > 5000:
            score -= 20
        elif latest.response_time_avg > 2000:
            score -= 10
        elif latest.response_time_avg > 1000:
            score -= 5
        
        # Error rate penalty
        if latest.error_rate > 5:
            score -= 15
        elif latest.error_rate > 2:
            score -= 8
        elif latest.error_rate > 1:
            score -= 3
        
        return max(0.0, score)
    
    def save_metrics_report(self, filename: str = None):
        """Save performance metrics to file"""
        if not filename:
            filename = f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': self.get_performance_summary(),
            'recent_snapshots': [asdict(s) for s in list(self.system_snapshots)[-100:]],
            'recent_alerts': self.performance_alerts[-50:],
            'optimization_suggestions': self.generate_optimization_suggestions()
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.logger.info(f"Performance report saved to {filename}")

# Global instance for easy access
performance_metrics = RealTimePerformanceMetrics()

def main():
    """Demo the performance metrics system"""
    print("🚀 Real-Time Performance Metrics System")
    print("=" * 50)
    
    # Start monitoring
    performance_metrics.start_monitoring(interval=5.0)
    
    try:
        # Simulate some metrics
        for i in range(10):
            performance_metrics.record_metric("response_time", 100 + i * 10, "ms", "api")
            performance_metrics.record_metric("request_success", 1, "count", "api")
            time.sleep(1)
        
        # Get summary
        summary = performance_metrics.get_performance_summary()
        print(f"📊 Performance Summary:")
        print(f"  • Health Score: {summary.get('health_score', 0):.1f}/100")
        print(f"  • Active Alerts: {summary.get('active_alerts', 0)}")
        print(f"  • Optimization Suggestions: {len(summary.get('optimization_suggestions', []))}")
        
        # Save report
        performance_metrics.save_metrics_report()
        print("✅ Performance report saved")
        
    finally:
        performance_metrics.stop_monitoring()

if __name__ == "__main__":
    main() 