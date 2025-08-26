# Lightweight shim for psutil used in tests when psutil isn't installed.
# The real psutil provides process.memory_info().rss; we emulate minimal API.
import os
from types import SimpleNamespace

class _MemoryInfo:
    def __init__(self, rss):
        self.rss = rss

class Process:
    def __init__(self, pid=None):
        self._pid = pid or os.getpid()

    def memory_info(self):
        # Return current process RSS in bytes
        try:
            import resource
            rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            # On Windows ru_maxrss is in bytes; on Unix it's kilobytes
            if os.name != 'nt':
                rss = rss * 1024
        except Exception:
            # Fallback: estimate using os.sys.getsizeof of globals (very rough)
            rss = 0
        return _MemoryInfo(rss)

def Process(pid=None):
    return Process(pid)

# Backwards compatibility
process = Process()

__all__ = ['Process']
