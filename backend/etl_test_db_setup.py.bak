# Test SQLAlchemy setup for ETL integration

from sqlalchemy import Column, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()


class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, unique=True, nullable=False)
    team = Column(String, nullable=False)
    odds = Column(Float, nullable=False)


# Setup test SQLite DB
engine = create_engine("sqlite:///./etl_test.db", echo=True)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

# Usage example
if __name__ == "__main__":
    session = SessionLocal()
    # Example insert
    match = Match(match_id=123, team="A", odds=2.5)
    session.add(match)
    session.commit()
    session.close()
