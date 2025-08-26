"""Top-level pytest conftest to ensure the repository root is on sys.path.

Placing this at repository root ensures it's loaded early during pytest
collection so imports like `backend.*` resolve to the local package.
"""

import os
import sys

ROOT = os.path.dirname(__file__)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
