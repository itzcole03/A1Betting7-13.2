"""
Force-create all tables for the backend database, including projection_history.
Run this script to ensure all tables exist in backend/a1betting.db.
"""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.database import engine
from backend.models import *  # Import all models to register them with Base
from backend.models.base import Base

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("All tables created in backend/a1betting.db.")
