import logging

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
print("Starting backend.main:app...")
from backend.test_app import app

print("backend.main:app import complete.")
