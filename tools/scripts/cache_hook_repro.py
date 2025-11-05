from backend.services.metrics.cache_metrics_hook import get_cache_hook
from backend.services.metrics.unified_metrics_collector import get_metrics_collector

class TestCacheService:
    def __init__(self):
        self.data = {}
    def get(self, key, default=None):
        return self.data.get(key, default)
    def set(self, key, value):
        self.data[key] = value
    def delete(self, key):
        if key in self.data:
            del self.data[key]
            return True
        return False

if __name__ == '__main__':
    cache_service = TestCacheService()
    cache_hook = get_cache_hook()
    cache_hook.unhook_all()
    print('Hooking:', cache_hook.hook_cache_service(cache_service))
    mc = get_metrics_collector()
    mc.reset_metrics()

    cache_service.set('key1','value1')
    cache_service.set('key2','value2')
    cache_service.get('key1')
    cache_service.get('key2')
    cache_service.get('key3','default')
    cache_service.get('key4','default')
    cache_service.delete('key1')
    cache_service.delete('key5')

    print('Snapshot:', mc.snapshot())
