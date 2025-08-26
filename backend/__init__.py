"""Backend package initializer for test environment."""

__all__ = ["services", "routes"]

"""Backend package initializer for test shim compatibility.

Expose common submodules as package attributes to support unittest.mock.patch
targets that reference `backend.<module>` during tests (e.g.,
`backend.system_monitor.SystemMonitor`). This keeps imports flexible for
test-time patching without changing runtime import semantics.
"""

# Export `system_monitor` if present so tests can patch `backend.system_monitor`
try:
	import importlib

	system_monitor = importlib.import_module("backend.system_monitor")
	globals()["system_monitor"] = system_monitor
	__all__.append("system_monitor")
except Exception:
	# If the shim is not available or import fails, silently continue; tests
	# that require it will fail and the shim can be added as needed.
	pass
