"""
Automated tests for Match model query helpers and serialization.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.models.base import Base
from backend.models.match import Match


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_match_title():
    m = Match(
        home_team="A", away_team="B", sport="Soccer", league="MLS", start_time=None
    )
    assert m.match_title == "A vs B"


def test_total_score():
    m = Match(
        home_team="A",
        away_team="B",
        sport="Soccer",
        league="MLS",
        home_score=2,
        away_score=3,
        start_time=None,
    )
    assert m.total_score == 5


def test_get_featured(db_session):
    import datetime

    now = datetime.datetime.now()
    m1 = Match(
        home_team="A",
        away_team="B",
        sport="Soccer",
        league="MLS",
        is_featured=True,
        start_time=now,
    )
    m2 = Match(
        home_team="C",
        away_team="D",
        sport="Soccer",
        league="MLS",
        is_featured=False,
        start_time=now,
    )
    db_session.add(m1)
    db_session.add(m2)
    db_session.commit()
    featured = Match.get_featured(db_session)
    assert len(featured) == 1
    assert featured[0].home_team == "A"


def test_get_by_league(db_session):
    import datetime

    now = datetime.datetime.now()
    m1 = Match(
        home_team="A", away_team="B", sport="Soccer", league="MLS", start_time=now
    )
    m2 = Match(
        home_team="C", away_team="D", sport="Soccer", league="EPL", start_time=now
    )
    db_session.add(m1)
    db_session.add(m2)
    db_session.commit()
    mls_matches = Match.get_by_league(db_session, "MLS")
    assert len(mls_matches) == 1
    assert mls_matches[0].league == "MLS"


def test_get_live(db_session):
    import datetime

    now = datetime.datetime.now()
    m1 = Match(
        home_team="A",
        away_team="B",
        sport="Soccer",
        league="MLS",
        status="live",
        start_time=now,
    )
    m2 = Match(
        home_team="C",
        away_team="D",
        sport="Soccer",
        league="MLS",
        status="scheduled",
        start_time=now,
    )
    db_session.add(m1)
    db_session.add(m2)
    db_session.commit()
    live_matches = Match.get_live(db_session)
    assert len(live_matches) == 1
    assert live_matches[0].status == "live"


def test_to_dict():
    import datetime

    now = datetime.datetime.now()
    m = Match(
        home_team="A", away_team="B", sport="Soccer", league="MLS", start_time=now
    )
    d = m.to_dict()
    assert d["home_team"] == "A"
    assert d["away_team"] == "B"
    assert d["match_title"] == "A vs B"
