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
        # Simulate fetching raw data for all entities (fixed syntax)
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


# --- MLB Team Alias Table Integration ---
import csv
import os


def load_team_alias_table(csv_path: str) -> dict:
    alias_map = {}
    if not os.path.exists(csv_path):
        logging.warning(f"MLB team alias table not found: {csv_path}")
        return alias_map
    with open(csv_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(filter(lambda row: row[0] != "#", csvfile))
        for row in reader:
            canonical = row["canonical_name"].strip()
            abbr = row["abbreviation"].strip()
            alt_abbr = row["alt_abbreviation"].strip()
            city = row["city"].strip()
            # Map all known names/abbreviations to canonical
            for key in [
                canonical,
                abbr,
                alt_abbr,
                city,
                f"{city} {canonical}",
                f"{city} {abbr}",
            ]:
                if key and key != "":
                    alias_map[key.lower()] = canonical
    return alias_map


def robust_team_lookup(name: str, alias_map: dict) -> str:
    if not name:
        return ""
    key = name.lower().strip()
    if key in alias_map:
        return alias_map[key]
    # Try removing city, punctuation, etc.
    import re

    key2 = re.sub(r"[^a-z0-9 ]", "", key)
    if key2 in alias_map:
        return alias_map[key2]
    tokens = key2.split()
    if len(tokens) > 1 and tokens[-1] in alias_map:
        return alias_map[tokens[-1]]
    # Try matching by abbreviation or partials
    for alias, canonical in alias_map.items():
        if key in alias or alias in key:
            return canonical
    # Try fuzzy match (very basic)
    for alias, canonical in alias_map.items():
        if alias.replace(" ", "") == key2.replace(" ", ""):
            return canonical
    return key  # fallback to original


def load_data(session: Session, records: dict[str, list[dict[str, Any]]]) -> None:

    # Load alias table once
    alias_csv = os.path.join(os.path.dirname(__file__), "mlb_team_alias_table.csv")
    alias_map = load_team_alias_table(alias_csv)
    team_id_map: dict[str, int] = {}
    canonical_team_id_map: dict[str, int] = {}
    event_id_map: dict[Any, int] = {}  # Accept both int and str keys
    # For robust event matching: (normalized_name, start_time as datetime) -> event_id
    from datetime import datetime, timedelta

    event_name_time_map: dict[tuple[str, datetime], int] = {}

    # Load event_mappings if available (from mlb_odds_raw_dump.json or a cache file)
    event_mappings = {}
    mapping_path = os.path.join(os.path.dirname(__file__), "event_mappings.json")
    if os.path.exists(mapping_path):
        import json

        with open(mapping_path, "r", encoding="utf-8") as f:
            event_mappings = json.load(f)

    def normalize_event_name(name: str) -> str:
        import re

        if not name:
            return ""
        name = name.lower()
        # Remove all non-alphanumeric except spaces
        name = re.sub(r"[^a-z0-9 ]", "", name)
        # Remove city names (robust, with optional spaces)
        mlb_cities = [
            "oakland",
            "seattle",
            "baltimore",
            "toronto",
            "detroit",
            "arizona",
            "san francisco",
            "pittsburgh",
            "chicago",
            "texas",
            "houston",
            "new york",
            "boston",
            "cleveland",
            "kansas city",
            "los angeles",
            "miami",
            "milwaukee",
            "minnesota",
            "philadelphia",
            "san diego",
            "st louis",
            "tampa bay",
            "washington",
            "atlanta",
            "cincinnati",
            "colorado",
        ]
        for city in mlb_cities:
            # Remove city at start, middle, or end, with optional spaces
            name = re.sub(rf"(^| )({city})( |$)", " ", name)
        # Collapse multiple spaces
        name = re.sub(r"\s+", " ", name).strip()
        # Split on 'vs', 'at', or multiple spaces
        tokens = re.split(r"\bvs\b|\bat\b|\s{2,}", name)
        # If still not split, try single space (for e.g. 'orioles blue jays')
        if len(tokens) == 1 and " " in name:
            tokens = name.split(" ")
        # Remove empty and extra spaces, sort for order-insensitive match
        teams = [t.strip() for t in tokens if t.strip()]
        teams.sort()
        return "_".join(teams)

    # Upsert teams
    for team in records.get("teams", []):
        try:
            canonical_name = robust_team_lookup(team["name"], alias_map)
            team["name"] = canonical_name
            team_id = upsert_team(session, team)
            team_id_map[team["name"]] = team_id
            canonical_team_id_map[canonical_name] = team_id
        except ValueError as e:
            logging.error("Team upsert failed: %s", e)

    # Upsert events
    for event in records.get("events", []):
        try:
            event_id = upsert_event(session, event)
            event_id_map[event["event_id"]] = event_id
            # Build normalized event name + start_time map for cross-provider matching
            norm_name = normalize_event_name(event.get("name", ""))
            start_time_str = event.get("start_time", "")
            try:
                start_time_dt = datetime.fromisoformat(start_time_str)
            except Exception:
                start_time_dt = None
            if norm_name and start_time_dt:
                # Store both integer PK and UUID string
                event_name_time_map[(norm_name, start_time_dt)] = (
                    event_id,
                    event["event_id"],
                )
        except ValueError as e:
            logging.error("Event upsert failed: %s", e)

    # Upsert odds
    for odds in records.get("odds", []):
        try:
            team_name = odds.get("team_name")
            canonical_name = robust_team_lookup(team_name, alias_map)
            odds["team_name"] = (
                canonical_name  # Ensure odds uses canonical name for lookup
            )
            # Defensive patch: ensure odds_type is present
            if "odds_type" not in odds or not odds["odds_type"]:
                logging.error(
                    "[DEFENSIVE PATCH] odds_type missing in odds dict, injecting fallback. Odds: %s",
                    odds,
                )
                odds["odds_type"] = (
                    odds.get("stat_type") or odds.get("market") or "unknown"
                )

            # Enhanced event mapping: remap TheOdds event_id to local DB event_id using event_mappings if available
            orig_event_id = odds.get("event_id")
            event_id = event_id_map.get(orig_event_id)
            # If event_id is a hex string and event_mappings is available, try to remap
            if (
                not event_id
                and event_mappings
                and isinstance(orig_event_id, str)
                and len(orig_event_id) >= 16
            ):
                # Try to find the mapped local event_id
                for srid, mapping in event_mappings.items():
                    if "mappings" in mapping:
                        for m in mapping["mappings"]:
                            if (
                                m.get("provider", "").lower() == "theoddsapi"
                                and m.get("id") == orig_event_id
                            ):
                                # srid is the SportRadar event_id, which should be in event_id_map
                                mapped_event_id = event_id_map.get(srid)
                                if mapped_event_id:
                                    event_id = mapped_event_id
                                    odds["event_id"] = (
                                        srid  # update odds dict to use mapped event_id
                                    )
                                    break
                        if event_id:
                            break

            # Fallback: try event name and start time matching
            if not event_id:
                odds_event_name = normalize_event_name(odds.get("event_name", ""))
                odds_start_time_str = odds.get("start_time", "")
                # Handle ISO format with 'Z' (Zulu/UTC)
                try:
                    if odds_start_time_str.endswith("Z"):
                        odds_start_time_dt = datetime.fromisoformat(
                            odds_start_time_str.replace("Z", "+00:00")
                        )
                    else:
                        odds_start_time_dt = datetime.fromisoformat(odds_start_time_str)
                except Exception:
                    odds_start_time_dt = None
                # Try exact match first
                match = None
                if odds_event_name and odds_start_time_dt:
                    match = event_name_time_map.get(
                        (odds_event_name, odds_start_time_dt)
                    )
                    # If not found, try within ±10 minutes (wider window)
                    if not match:
                        for (ename, etime), val in event_name_time_map.items():
                            if (
                                ename == odds_event_name
                                and abs((etime - odds_start_time_dt).total_seconds())
                                <= 600
                            ):
                                match = val
                                break
                    # Fuzzy event name match (ignore order, partials)
                    if not match:
                        for (ename, etime), val in event_name_time_map.items():
                            if (
                                set(ename.split("_")) == set(odds_event_name.split("_"))
                                and abs((etime - odds_start_time_dt).total_seconds())
                                <= 600
                            ):
                                match = val
                                break
                if match:
                    event_id, event_uuid = match
                    odds["event_id"] = event_uuid
                    event_id = event_id
            # Log if still unmatched
            if not event_id:
                logging.warning("[MAPPING] Could not match event for odds: %s", odds)
            upsert_odds(session, odds, canonical_team_id_map, event_id_map)
        except ValueError as e:
            logging.error("Odds upsert failed: %s | odds dict: %s", e, odds)


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
