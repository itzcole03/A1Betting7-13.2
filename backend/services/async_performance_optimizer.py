#!/usr/bin/env python3
"""
Async Performance Optimizer

Converts synchronous endpoints to async for better performance and scalability.
Provides async utilities and performance monitoring for async operations.
"""

import asyncio
import aiohttp
import time
import logging
from typing import Dict, List, Optional, Any, Callable, TypeVar, Union
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import functools
from datetime import datetime

try:
    import asyncpg
    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False
    asyncpg = None

T = TypeVar('T')
R = TypeVar('R')

@dataclass
class AsyncPerformanceMetrics:
    """Complete metrics for async performance tracking"""
    endpoint: str
    sync_time: float
    async_time: float
    improvement_percent: float
    concurrent_requests: int

class AsyncPerformanceOptimizer:
    def __init__(self):
        self.logger = self.setup_logging()
        self.metrics: List[AsyncPerformanceMetrics] = []
        self.thread_pool = ThreadPoolExecutor(max_workers=10)
        self.session: Optional[aiohttp.ClientSession] = None
        self.db_pool: Optional['asyncpg.Pool'] = None if not HAS_ASYNCPG else None
        
    def setup_logging(self) -> logging.Logger:
        """Setup async performance logging"""
        logger = logging.getLogger('async_optimizer')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.FileHandler('async_performance.log')
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def initialize_async_resources(self):
        """Initialize async resources like HTTP session and DB pool"""
        try:
            # Initialize HTTP session
            connector = aiohttp.TCPConnector(
                limit=100,
                limit_per_host=30,
                ttl_dns_cache=300,
                use_dns_cache=True,
            )
            timeout = aiohttp.ClientTimeout(total=30, connect=5)
            self.session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout
            )
            
            # Initialize database pool (example for PostgreSQL)
            if HAS_ASYNCPG:
                try:
                    self.db_pool = await asyncpg.create_pool(
                        "postgresql://user:password@localhost/db",
                        min_size=5,
                        max_size=20,
                        command_timeout=60
                    )
                    self.logger.info("Database pool initialized")
                except Exception as e:
                    self.logger.warning(f"Database pool initialization failed: {e}")
            else:
                self.logger.warning("asyncpg not installed - database features disabled")
            
            self.logger.info("Async resources initialized")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize async resources: {e}")
    
    async def cleanup_async_resources(self):
        """Cleanup async resources"""
        if self.session:
            await self.session.close()
        
        if self.db_pool:
            await self.db_pool.close()
        
        self.logger.info("Async resources cleaned up")
    
    def sync_to_async(self, sync_func: Callable[..., T]) -> Callable[..., 'asyncio.Future[T]']:
        """Convert synchronous function to async using thread pool"""
        @functools.wraps(sync_func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                self.thread_pool, 
                functools.partial(sync_func, *args, **kwargs)
            )
        return async_wrapper
    
    async def async_http_request(
        self, 
        method: str, 
        url: str, 
        **kwargs: Any
    ) -> Dict[str, Any]:
        """Make async HTTP request with performance optimization"""
        if not self.session:
            await self.initialize_async_resources()
        
        start_time = time.time()
        
        try:
            async with self.session.request(method, url, **kwargs) as response:
                data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                end_time = time.time()
                response_time = end_time - start_time
                
                self.logger.debug(f"Async HTTP {method} {url}: {response_time:.3f}s")
                
                return {
                    'status': response.status,
                    'data': data,
                    'response_time': response_time,
                    'headers': dict(response.headers)
                }
                
        except Exception as e:
            self.logger.error(f"Async HTTP request failed: {e}")
            raise
    
    async def async_database_query(
        self, 
        query: str, 
        params: Optional[tuple] = None
    ) -> List[Dict]:
        """Execute async database query"""
        if not self.db_pool:
            self.logger.warning("Database pool not available")
            return []
        
        start_time = time.time()
        
        try:
            async with self.db_pool.acquire() as connection:
                try:
                    if params:
                        rows = await connection.fetch(query, *params)
                    else:
                        rows = await connection.fetch(query)
                    
                    end_time = time.time()
                    query_time = end_time - start_time
                    
                    self.logger.debug(f"Async DB query: {query_time:.3f}s")
                    
                    return [dict(row) for row in rows]
                except Exception as error:
                    self.logger.error(f"API Error: {error}")
                    return []
                
        except Exception as e:
            self.logger.error(f"Async database query failed: {e}")
            return []
    
    async def parallel_requests(
        self, 
        requests: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Execute multiple HTTP requests in parallel"""
        tasks = []
        
        for request in requests:
            method = request.get('method', 'GET')
            url = request['url']
            kwargs = {k: v for k, v in request.items() if k not in ['method', 'url']}
            
            task = self.async_http_request(method, url, **kwargs)
            tasks.append(task)
        
        start_time = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        total_time = end_time - start_time
        self.logger.info(f"Parallel requests completed: {len(requests)} requests in {total_time:.3f}s")
        
        return results
    
    async def async_data_processing(
        self, 
        data: List[Any], 
        process_func: Callable,
        batch_size: int = 100
    ) -> List[Any]:
        """Process data asynchronously in batches"""
        async_process_func = self.sync_to_async(process_func)
        
        results = []
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            
            tasks = [async_process_func(item) for item in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            results.extend(batch_results)
        
        return results
    
    async def benchmark_sync_vs_async(
        self, 
        sync_func: Callable, 
        async_func: Callable,
        test_data: List[Any],
        endpoint_name: str = "unknown"
    ) -> AsyncPerformanceMetrics:
        """Benchmark synchronous vs asynchronous performance"""
        
        # Test synchronous version
        sync_start = time.time()
        sync_results = []
        for data in test_data:
            try:
                result = sync_func(data)
                sync_results.append(result)
            except Exception as e:
                sync_results.append(f"Error: {e}")
        sync_end = time.time()
        sync_time = sync_end - sync_start
        
        # Test asynchronous version
        async_start = time.time()
        tasks = [async_func(data) for data in test_data]
        async_results = await asyncio.gather(*tasks, return_exceptions=True)
        async_end = time.time()
        async_time = async_end - async_start
        
        # Calculate improvement
        improvement_percent = ((sync_time - async_time) / sync_time) * 100 if sync_time > 0 else 0
        
        metrics = AsyncPerformanceMetrics(
            endpoint=endpoint_name,
            sync_time=sync_time,
            async_time=async_time,
            improvement_percent=improvement_percent,
            concurrent_requests=len(test_data)
        )
        
        self.metrics.append(metrics)
        
        self.logger.info(
            f"Benchmark {endpoint_name}: "
            f"Sync={sync_time:.3f}s, Async={async_time:.3f}s, "
            f"Improvement={improvement_percent:.1f}%"
        )
        
        return metrics
    
    async def async_prediction_endpoint(self, prediction_data: Dict) -> Dict:
        """Example async prediction endpoint"""
        start_time = time.time()
        
        try:
            # Simulate async operations
            tasks = [
                self.async_data_validation(prediction_data),
                self.async_feature_extraction(prediction_data),
                self.async_model_loading()
            ]
            
            validation_result, features, model = await asyncio.gather(*tasks)
            
            if not validation_result['valid']:
                return {
                    'success': False,
                    'error': validation_result['error'],
                    'processing_time': time.time() - start_time
                }
            
            # Run prediction
            prediction = await self.async_run_prediction(model, features)
            
            # Store result asynchronously
            asyncio.create_task(self.async_store_prediction(prediction_data, prediction))
            
            end_time = time.time()
            
            return {
                'success': True,
                'prediction': prediction,
                'confidence': prediction.get('confidence', 0.0),
                'processing_time': end_time - start_time
            }
            
        except Exception as e:
            self.logger.error(f"Async prediction failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'processing_time': time.time() - start_time
            }
    
    async def async_data_validation(self, data: Dict) -> Dict:
        """Async data validation"""
        await asyncio.sleep(0.1)  # Simulate validation time
        
        required_fields = ['sport', 'teams', 'market']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return {
                'valid': False,
                'error': f"Missing required fields: {missing_fields}"
            }
        
        return {'valid': True}
    
    async def async_feature_extraction(self, data: Dict) -> Dict:
        """Async feature extraction"""
        await asyncio.sleep(0.2)  # Simulate feature extraction time
        
        features = {
            'team_strength': 0.75,
            'recent_form': 0.82,
            'head_to_head': 0.68,
            'market_sentiment': 0.71
        }
        
        return features
    
    async def async_model_loading(self) -> Dict:
        """Async model loading"""
        await asyncio.sleep(0.1)  # Simulate model loading time
        
        return {
            'model_id': 'ensemble_v2.1',
            'accuracy': 0.873,
            'last_updated': datetime.now().isoformat()
        }
    
    async def async_run_prediction(self, model: Dict, features: Dict) -> Dict:
        """Async prediction execution"""
        await asyncio.sleep(0.3)  # Simulate prediction time
        
        # Simulate prediction logic
        prediction_value = sum(features.values()) / len(features)
        confidence = min(0.95, prediction_value + 0.1)
        
        return {
            'outcome': 'over' if prediction_value > 0.7 else 'under',
            'probability': prediction_value,
            'confidence': confidence,
            'model_used': model['model_id']
        }
    
    async def async_store_prediction(self, input_data: Dict, prediction: Dict):
        """Async prediction storage"""
        try:
            # Simulate storing to database
            await asyncio.sleep(0.05)
            
            storage_data = {
                'timestamp': datetime.now().isoformat(),
                'input': input_data,
                'prediction': prediction
            }
            
            self.logger.debug(f"Stored prediction: {prediction['outcome']}")
            
        except Exception as e:
            self.logger.error(f"Failed to store prediction: {e}")
    
    async def async_batch_predictions(self, batch_data: List[Dict]) -> List[Dict]:
        """Process multiple predictions asynchronously"""
        start_time = time.time()
        
        tasks = [self.async_prediction_endpoint(data) for data in batch_data]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        self.logger.info(
            f"Batch predictions completed: {len(batch_data)} predictions in {processing_time:.3f}s"
        )
        
        return results
    
    def get_performance_summary(self) -> Dict:
        """Get async performance summary"""
        if not self.metrics:
            return {'message': 'No performance metrics available'}
        
        total_improvement = sum(m.improvement_percent for m in self.metrics)
        avg_improvement = total_improvement / len(self.metrics)
        
        best_improvement = max(self.metrics, key=lambda m: m.improvement_percent)
        worst_improvement = min(self.metrics, key=lambda m: m.improvement_percent)
        
        return {
            'total_benchmarks': len(self.metrics),
            'average_improvement_percent': avg_improvement,
            'best_improvement': {
                'endpoint': best_improvement.endpoint,
                'improvement_percent': best_improvement.improvement_percent,
                'sync_time': best_improvement.sync_time,
                'async_time': best_improvement.async_time
            },
            'worst_improvement': {
                'endpoint': worst_improvement.endpoint,
                'improvement_percent': worst_improvement.improvement_percent,
                'sync_time': worst_improvement.sync_time,
                'async_time': worst_improvement.async_time
            },
            'recommendations': self.generate_async_recommendations()
        }
    
    def generate_async_recommendations(self) -> List[str]:
        """Generate async optimization recommendations"""
        recommendations = []
        
        if not self.metrics:
            return ["Run benchmarks to get optimization recommendations"]
        
        avg_improvement = sum(m.improvement_percent for m in self.metrics) / len(self.metrics)
        
        if avg_improvement > 50:
            recommendations.append("Excellent async performance! Consider applying to more endpoints")
        elif avg_improvement > 20:
            recommendations.append("Good async improvements. Focus on I/O-heavy operations")
        else:
            recommendations.append("Limited async benefits. Review implementation for optimization opportunities")
        
        # Check for specific patterns
        io_heavy_endpoints = [m for m in self.metrics if 'prediction' in m.endpoint.lower()]
        if io_heavy_endpoints:
            avg_io_improvement = sum(m.improvement_percent for m in io_heavy_endpoints) / len(io_heavy_endpoints)
            if avg_io_improvement > 30:
                recommendations.append("I/O-heavy endpoints show good async benefits - prioritize these")
        
        recommendations.extend([
            "Use connection pooling for database operations",
            "Implement request batching for external API calls",
            "Consider async caching for frequently accessed data",
            "Monitor memory usage with increased concurrency"
        ])
        
        return recommendations

# Global instance
async_optimizer = AsyncPerformanceOptimizer()

async def main():
    """Demo the async performance optimizer"""
    print("🚀 Async Performance Optimizer")
    print("=" * 40)
    
    await async_optimizer.initialize_async_resources()
    
    try:
        # Demo prediction endpoint
        test_prediction_data = {
            'sport': 'basketball',
            'teams': ['Lakers', 'Warriors'],
            'market': 'total_points'
        }
        
        print("Testing async prediction endpoint...")
        result = await async_optimizer.async_prediction_endpoint(test_prediction_data)
        print(f"Prediction result: {result['prediction']['outcome']} "
              f"(confidence: {result['prediction']['confidence']:.2f})")
        print(f"Processing time: {result['processing_time']:.3f}s")
        
        # Demo batch predictions
        print("\nTesting batch predictions...")
        batch_data = [test_prediction_data.copy() for _ in range(5)]
        batch_results = await async_optimizer.async_batch_predictions(batch_data)
        print(f"Batch completed: {len(batch_results)} predictions")
        
        # Show performance summary
        summary = async_optimizer.get_performance_summary()
        print(f"\n📊 Performance Summary:")
        print(f"  • Recommendations: {len(summary.get('recommendations', []))}")
        
    finally:
        await async_optimizer.cleanup_async_resources()

if __name__ == "__main__":
    asyncio.run(main()) 