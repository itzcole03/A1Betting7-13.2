# Sample ETL Module: ProviderX


import logging

try:
    from prometheus_client import Counter, Gauge, Histogram, start_http_server
except ImportError:
    Counter = Histogram = Gauge = start_http_server = None
from typing import Any, Dict

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.models.base import Base
from backend.models.expanded_models import Event, Odds, Team

if Counter:
    ETL_SUCCESS = Counter("etl_success_total", "Total successful ETL jobs")
    ETL_FAILURE = Counter("etl_failure_total", "Total failed ETL jobs")
    ETL_RECORDS = Gauge(
        "etl_records_processed", "Number of records processed per ETL job"
    )
    ETL_DURATION = Histogram("etl_job_duration_seconds", "ETL job duration in seconds")


def etl_health_check() -> bool:
    # Simple health check for ETL readiness
    try:
        # Add more checks as needed
        return True
    except Exception:
        return False


class ProviderXClient:
    def get_data(self) -> dict[str, list[dict[str, Any]]]:
        # Simulate fetching raw data for all entities
        return {
            "teams": [
                {"name": "A", "provider_id": "provA"},
                {"name": "B", "provider_id": "provB"},
            ],
            "events": [
                {
                    "event_id": 1001,
                    "name": "Match A vs B",
                    "start_time": "2025-07-16T18:00:00",
                    "provider_id": "eventProv1",
                }
            ],
            "odds": [
                {
                    "event_id": 1001,
                    "team_name": "A",
                    "odds_type": "win",
                    "value": 2.5,
                    "provider_id": "provA",
                },
                {
                    "event_id": 1001,
                    "team_name": "B",
                    "odds_type": "win",
                    "value": 1.8,
                    "provider_id": "provB",
                },
            ],
        }


def transform_record(record: Dict[str, Any]) -> Dict[str, Any]:
    # Deprecated: now handled per entity
    return record


def upsert_team(session: Session, team: Dict[str, Any]) -> int:
    if not team.get("name"):
        raise ValueError("Team name required")
    existing = session.query(Team).filter_by(name=team["name"]).first()
    if existing:
        if team.get("provider_id") is not None:
            existing.provider_id = team["provider_id"]
        session.commit()
        logging.info("Updated team: %s", team)
        logging.debug("existing.id type: %s, value: %s", type(existing.id), existing.id)
        return int(existing.__dict__.get("id", 0))
    else:
        new_team = Team(name=team["name"], provider_id=team.get("provider_id"))
        session.add(new_team)
        session.commit()
        logging.info("Inserted team: %s", team)
        logging.debug("new_team.id type: %s, value: %s", type(new_team.id), new_team.id)
        return int(new_team.__dict__.get("id", 0))


def upsert_event(session: Session, event: Dict[str, Any]) -> int:
    if (
        not event.get("event_id")
        or not event.get("name")
        or not event.get("start_time")
    ):
        raise ValueError("Event fields required")
    from datetime import datetime

    start_time = datetime.fromisoformat(event["start_time"])
    existing = session.query(Event).filter_by(event_id=event["event_id"]).first()
    if existing:
        existing.name = event["name"]
        setattr(existing, "start_time", start_time)
        if event.get("provider_id") is not None:
            existing.provider_id = event["provider_id"]
        session.commit()
        logging.info("Updated event: %s", event)
        logging.debug("existing.id type: %s, value: %s", type(existing.id), existing.id)
        return int(existing.__dict__.get("id", 0))
    else:
        new_event = Event(
            event_id=event["event_id"],
            name=event["name"],
            start_time=start_time,
            provider_id=event.get("provider_id"),
        )
        session.add(new_event)
        session.commit()
        logging.info("Inserted event: %s", event)
        logging.debug(
            "new_event.id type: %s, value: %s", type(new_event.id), new_event.id
        )
        return int(new_event.__dict__.get("id", 0))


def upsert_odds(
    session: Session,
    odds: Dict[str, Any],
    team_id_map: Dict[str, int],
    event_id_map: Dict[int, int],
) -> None:
    if (
        not odds.get("event_id")
        or not odds.get("team_name")
        or not odds.get("odds_type")
    ):
        raise ValueError("Odds fields required")
    team_id = team_id_map.get(odds["team_name"])
    event_id = event_id_map.get(odds["event_id"])
    if not team_id or not event_id:
        raise ValueError("Team or Event not found for odds")
    existing = (
        session.query(Odds)
        .filter_by(
            event_id=event_id,
            team_id=team_id,
            odds_type=odds["odds_type"],
            provider_id=odds.get("provider_id"),
        )
        .first()
    )
    if existing:
        existing.value = odds["value"]
        session.commit()
        logging.info("Updated odds: %s", odds)
    else:
        new_odds = Odds(
            event_id=event_id,
            team_id=team_id,
            odds_type=odds["odds_type"],
            value=odds["value"],
            provider_id=odds.get("provider_id"),
        )
        session.add(new_odds)
        session.commit()
        logging.info("Inserted odds: %s", odds)


def extract_data(api_client: ProviderXClient) -> dict[str, list[dict[str, Any]]]:
    return api_client.get_data()


def transform_data(raw_data: list[Dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    teams: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    odds: list[dict[str, Any]] = []
    for record in raw_data:
        # Team
        team_dict = {
            "name": record.get("team_name"),
            "location": record.get("team_location"),
            "sport": record.get("sport"),
        }
        teams.append(team_dict)
        # Event
        event_dict = {
            "event_id": record.get("event_id"),
            "name": record.get("event_name"),
            "date": record.get("event_date"),
            "location": record.get("event_location"),
        }
        events.append(event_dict)
        # Odds
        odds_dict = {
            "event_id": record.get("event_id"),
            "team_id": record.get("team_id"),
            "odds": record.get("odds"),
            "source": record.get("source"),
        }
        odds.append(odds_dict)
    return {"teams": teams, "events": events, "odds": odds}


def load_data(session: Session, records: dict[str, list[dict[str, Any]]]) -> None:
    team_id_map: dict[str, int] = {}
    event_id_map: dict[int, int] = {}
    # Upsert teams
    for team in records.get("teams", []):
        try:
            team_id = upsert_team(session, team)
            team_id_map[team["name"]] = team_id
        except ValueError as e:
            logging.error("Team upsert failed: %s", e)
    # Upsert events
    for event in records.get("events", []):
        try:
            event_id = upsert_event(session, event)
            event_id_map[event["event_id"]] = event_id
        except ValueError as e:
            logging.error("Event upsert failed: %s", e)
    # Upsert odds
    for odds in records.get("odds", []):
        try:
            upsert_odds(session, odds, team_id_map, event_id_map)
        except ValueError as e:
            logging.error("Odds upsert failed: %s", e)


def etl_job(api_client: ProviderXClient, session: Session | None) -> None:
    if ETL_DURATION:
        with ETL_DURATION.time():
            _run_etl_job(api_client, session)
    else:
        _run_etl_job(api_client, session)


def _run_etl_job(api_client: ProviderXClient, session: Session | None) -> None:
    try:
        raw_data = extract_data(api_client)
        records = raw_data
        total_records = sum(
            len(records.get(k, [])) for k in ["teams", "events", "odds"]
        )
        if session is not None:
            load_data(session, records)
            logging.info(
                "ETL job completed: %d teams, %d events, %d odds processed.",
                len(records.get("teams", [])),
                len(records.get("events", [])),
                len(records.get("odds", [])),
            )
            if ETL_SUCCESS:
                ETL_SUCCESS.inc()
            if ETL_RECORDS:
                ETL_RECORDS.set(total_records)
        else:
            logging.warning("No database session provided. Skipping load stage.")
    except ValueError as err:
        logging.error("ETL job failed: %s", err, exc_info=True)
        if ETL_FAILURE:
            ETL_FAILURE.inc()


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if start_http_server:
        start_http_server(8001)  # Prometheus metrics endpoint
        logging.info("Prometheus metrics server started on port 8001.")
    providerx_client = ProviderXClient()
    # Setup test DB session
    engine = create_engine("sqlite:///./etl_test.db", echo=False)
    SessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)
    db_session = SessionLocal()
    etl_job(providerx_client, db_session)
    db_session.close()
    # Health check example
    logging.info("ETL health check: %s", etl_health_check())
