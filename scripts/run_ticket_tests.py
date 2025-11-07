import sys

sys.path.insert(0, r"c:\Users\bcmad\Downloads\A1Betting7-13.2")
import pytest

if __name__ == "__main__":
    # Run the ticketing unit tests
    # Ensure we run from the repo root so pytest can locate tests by relative path
    import os

    os.chdir(r"c:\Users\bcmad\Downloads\A1Betting7-13.2")
    # Run the test directory to avoid any argument splitting issues
    sys.exit(pytest.main(["-q", "backend/tests/services/ticketing"]))
