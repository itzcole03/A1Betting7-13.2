# Verify new tables in a1betting.db using SQLAlchemy

from sqlalchemy import create_engine, inspect

engine = create_engine("sqlite:///./a1betting.db")
inspector = inspect(engine)
tables = inspector.get_table_names()
print("Tables in a1betting.db:", tables)
