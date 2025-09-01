import importlib, inspect, sys

sys.path.insert(0, '.')

pkg = importlib.import_module('backend.ingestion')
print('pkg file:', getattr(pkg, '__file__', None))
print('pkg attrs sample:', [a for a in dir(pkg) if not a.startswith('__')][:40])
print('pkg.scheduler attr type:', type(getattr(pkg, 'scheduler', None)))

# Import the runner (non-conflicting) module
sched = importlib.import_module('backend.ingestion.scheduler_runner')
print('sched module file:', getattr(sched, '__file__', None))
print('run_once present in sched?', 'run_once' in dir(sched))
try:
    src = inspect.getsource(sched)
    print('sched source size:', len(src))
except Exception as e:
    print('could not get source:', e)

print('modules sample:', [k for k in sys.modules.keys() if k.startswith('backend')][:40])
