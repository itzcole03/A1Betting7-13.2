import hashlib
import os
import time
import unicodedata
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Sequence, cast

import httpx

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency already bundled
    load_dotenv = None

if load_dotenv:
    try:
        load_dotenv()
    except Exception:  # pragma: no cover - best effort only
        pass

from backend.services.unified_logging import get_logger, LogComponent, LogContext
from backend.betting.odds_normalizer import to_implied_prob
from .odds_models import OddsSnapshot
from .odds_snapshot_store import odds_snapshot_store

logger = get_logger("odds_ingestion")


REFRESH_CONTEXT = LogContext(component=LogComponent.BUSINESS_LOGIC, operation="refresh_market")
FETCH_EVENTS_CONTEXT = LogContext(component=LogComponent.BUSINESS_LOGIC, operation="fetch_events")
FETCH_EVENT_ODDS_CONTEXT = LogContext(component=LogComponent.BUSINESS_LOGIC, operation="fetch_event_odds")


BOOKS = ["FanDuel", "DraftKings", "Caesars", "BetMGM"]
WINDOW_MIN = 2

SELECTIONS = [
    {"selection_key": "player:MLB:AaronJudge:HR", "player": "Aaron Judge", "market": "player_props", "line": 0.5},
    {"selection_key": "player:MLB:ShoheiOhtani:SO", "player": "Shohei Ohtani", "market": "player_props", "line": 6.5},
]


@dataclass(frozen=True)
class MarketSpec:
    api_key: str
    stat_suffix: str
    alias_market: str = "player_props"


MARKET_CATALOG: Dict[str, MarketSpec] = {
    "batter_hits": MarketSpec("batter_hits", "HITS"),
    "batter_total_bases": MarketSpec("batter_total_bases", "TB"),
    "pitcher_strikeouts": MarketSpec("pitcher_strikeouts", "K"),
}

MARKET_ALIAS_MAP: Dict[str, Sequence[MarketSpec]] = {
    "player_props": (
        MARKET_CATALOG["batter_hits"],
        MARKET_CATALOG["batter_total_bases"],
        MARKET_CATALOG["pitcher_strikeouts"],
    ),
    "batter_hits": (MARKET_CATALOG["batter_hits"],),
    "batter_total_bases": (MARKET_CATALOG["batter_total_bases"],),
    "pitcher_strikeouts": (MARKET_CATALOG["pitcher_strikeouts"],),
}


BASE_URL = "https://api.the-odds-api.com/v4"
DEFAULT_REGION = os.getenv("THEODDS_REGION", "us")
DEFAULT_ODDS_FORMAT = "american"
MAX_EVENTS = int(os.getenv("THEODDS_MAX_EVENTS", "6"))
REQUEST_TIMEOUT = float(os.getenv("THEODDS_TIMEOUT", "10"))


def _resolve_api_key() -> str | None:
    """Resolve TheOdds API key from environment or config manager."""
    for name in ("THE_ODDS_API_KEY", "THEODDS_API_KEY", "ODDS_API_KEY"):
        value = os.getenv(name)
        if value:
            return value
    try:  # pragma: no cover - defensive fallback
        from backend.config_manager import get_config

        cfg = get_config()
        if cfg and getattr(cfg.api_keys, "theodds_api_key", None):
            return cfg.api_keys.theodds_api_key
    except Exception:
        return None
    return None


API_KEY = _resolve_api_key()


def _window_bucket() -> int:
    return int(time.time() // (WINDOW_MIN * 60))


def _gen_odds(base: int, salt: str) -> int:
    h = hashlib.sha256(f"{salt}:{_window_bucket()}".encode()).hexdigest()
    span = int(h[:4], 16) / 65535.0
    drift = int((span * 40) - 20)  # -20..+20
    o = base + drift
    if o == 0:
        o += 1
    if o > 400:
        o = 400
    if o < -400:
        o = -400
    return o


SIDE_VIG = 0.012  # small vig differential for derived under


def _derive_under_odds(over_american: int, salt: str) -> int:
    """Deterministically derive an under price from an over American line."""
    if over_american > 0:
        p_over = 100 / (over_american + 100)
    else:
        p_over = (-over_american) / ((-over_american) + 100)
    h = hashlib.sha256(f"UNDER:{salt}:{_window_bucket()}".encode()).hexdigest()
    adj = (int(h[:2], 16) / 255) * 0.01  # 0..0.01
    p_under = min(max(1 - p_over + SIDE_VIG + adj, 0.01), 0.99)
    if p_under >= 0.5:
        am = int(round(-100 * p_under / (1 - p_under)))
    else:
        am = int(round(100 * (1 - p_under) / p_under))
    if am == 0:
        am = -101
    if am > 400:
        am = 400
    if am < -400:
        am = -400
    return am


def _storage_sport_label(sport: str | None) -> str:
    if not sport:
        return "MLB"
    low = sport.lower()
    if low in {"mlb", "baseball_mlb"}:
        return "MLB"
    return sport.upper()


def _api_sport_key(sport: str | None) -> str:
    if not sport:
        return "baseball_mlb"
    low = sport.lower()
    if low == "mlb":
        return "baseball_mlb"
    return low


def _resolve_market_specs(requested_market: str | None) -> Sequence[MarketSpec]:
    key = (requested_market or "player_props").lower()
    if key in MARKET_ALIAS_MAP:
        return MARKET_ALIAS_MAP[key]
    if key in MARKET_CATALOG:
        return (MARKET_CATALOG[key],)
    return ()


def _normalize_player_name(name: str | None) -> str:
    if not name:
        return "Unknown Player"
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_name or name


def _player_slug(name: str) -> str:
    ascii_name = _normalize_player_name(name)
    slug = "".join(ch for ch in ascii_name if ch.isalnum())
    return slug or "PLAYER"


def _build_selection_key(sport_label: str, spec: MarketSpec, player_name: str) -> str:
    return f"player:{sport_label}:{_player_slug(player_name)}:{spec.stat_suffix}"


def _format_event_label(event: Dict[str, str]) -> str:
    home = event.get("home_team")
    away = event.get("away_team")
    if home and away:
        return f"{away} @ {home}"
    return event.get("sport_title") or event.get("id") or "MLB"


async def _fetch_events(client: httpx.AsyncClient, sport_key: str) -> List[Dict[str, str]]:
    try:
        resp = await client.get(f"{BASE_URL}/sports/{sport_key}/events", params={"apiKey": API_KEY})
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list):
            return data[:MAX_EVENTS]
    except Exception as exc:  # pragma: no cover - network path
        # Pass exc_info=True (boolean) so the logging system records the exception
        # trace once; avoid passing the exception object which can conflict with
        # structured logging middleware that manipulates record.exc_info.
        logger.warning(f"Failed to fetch TheOdds events: {exc}", context=FETCH_EVENTS_CONTEXT, exc_info=True)
    return []


async def _fetch_event_odds(
    client: httpx.AsyncClient,
    sport_key: str,
    event_id: str,
    specs: Sequence[MarketSpec],
    sport_label: str,
    market_label: str,
    event_label: str,
) -> List[OddsSnapshot]:
    if not specs:
        return []
    markets_param = ",".join(sorted({spec.api_key for spec in specs}))
    try:
        resp = await client.get(
            f"{BASE_URL}/sports/{sport_key}/events/{event_id}/odds",
            params={
                "apiKey": API_KEY,
                "regions": DEFAULT_REGION,
                "markets": markets_param,
                "oddsFormat": DEFAULT_ODDS_FORMAT,
            },
        )
        resp.raise_for_status()
    except Exception as exc:  # pragma: no cover - network path
        logger.debug(f"TheOdds event odds request failed: {exc}", context=FETCH_EVENT_ODDS_CONTEXT, exc_info=True)
        return []

    event_data = resp.json()
    spec_by_key = {spec.api_key: spec for spec in specs}
    captured_at = datetime.now(timezone.utc)
    snapshots: List[OddsSnapshot] = []

    for bookmaker in event_data.get("bookmakers", []):
        book_name = bookmaker.get("title") or bookmaker.get("key")
        if not book_name:
            continue
        for market in bookmaker.get("markets", []):
            spec = spec_by_key.get(market.get("key"))
            if spec is None:
                continue
            players: Dict[str, Dict[str, Any]] = {}
            for outcome in market.get("outcomes", []):
                player_name = _normalize_player_name(outcome.get("description"))
                if not player_name:
                    continue
                side = (outcome.get("name") or "").lower()
                if side not in {"over", "under"}:
                    continue
                price = outcome.get("price")
                if price is None:
                    continue
                try:
                    price_int = int(round(price))
                except (TypeError, ValueError):
                    continue
                line_value = outcome.get("point")
                entry = players.setdefault(player_name, {"line": None, "prices": {}})
                if isinstance(line_value, (int, float)):
                    entry["line"] = float(line_value)
                prices = cast(Dict[str, int], entry.setdefault("prices", {}))
                prices[side] = price_int
            for player_name, payload in players.items():
                line_value = payload.get("line")
                prices = payload.get("prices", {})
                if not isinstance(prices, dict):
                    continue
                for side_name, price_int in cast(Dict[str, int], prices).items():
                    implied = to_implied_prob(price_int)
                    snapshots.append(
                        OddsSnapshot(
                            id=str(uuid.uuid4()),
                            book=book_name,
                            sport=sport_label,
                            market=market_label,
                            selection_key=_build_selection_key(sport_label, spec, player_name),
                            player=player_name,
                            team=event_label,
                            line=float(line_value) if isinstance(line_value, (int, float)) else None,
                            side="over" if side_name == "over" else "under",
                            american_odds=price_int,
                            implied_prob=implied,
                            captured_at=captured_at,
                        )
                    )
    return snapshots


def _generate_mock_snapshots(sport_label: str, market_label: str) -> List[OddsSnapshot]:
    snaps: List[OddsSnapshot] = []
    now = datetime.now(timezone.utc)
    for sel in SELECTIONS:
        base_line = sel["line"]
        player = _normalize_player_name(sel["player"])
        stat_suffix = sel["selection_key"].split(":")[-1]
        selection_key = f"player:{sport_label}:{_player_slug(player)}:{stat_suffix}"
        for book in BOOKS:
            base_odds = -110 if book in ("FanDuel", "DraftKings") else -108
            over_american = _gen_odds(base_odds, f"{book}:{selection_key}:OVER")
            snaps.append(
                OddsSnapshot(
                    id=str(uuid.uuid4()),
                    book=book,
                    sport=sport_label,
                    market=market_label,
                    selection_key=selection_key,
                    player=player,
                    team="Deterministic Mock",
                    line=base_line,
                    side="over",
                    american_odds=over_american,
                    implied_prob=to_implied_prob(over_american),
                    captured_at=now,
                )
            )
            under_american = _derive_under_odds(over_american, f"{book}:{selection_key}")
            snaps.append(
                OddsSnapshot(
                    id=str(uuid.uuid4()),
                    book=book,
                    sport=sport_label,
                    market=market_label,
                    selection_key=selection_key,
                    player=player,
                    team="Deterministic Mock",
                    line=base_line,
                    side="under",
                    american_odds=under_american,
                    implied_prob=to_implied_prob(under_american),
                    captured_at=now,
                )
            )
    return snaps


async def refresh_market(sport: str, market: str) -> List[OddsSnapshot]:
    requested_market = market or "player_props"
    sport_label = _storage_sport_label(sport)
    api_sport = _api_sport_key(sport)
    specs = _resolve_market_specs(requested_market)

    snapshots: List[OddsSnapshot] = []
    if API_KEY and specs:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            events = await _fetch_events(client, api_sport)
            for event in events:
                event_id = event.get("id")
                if not event_id:
                    continue
                event_label = _format_event_label(event)
                event_snaps = await _fetch_event_odds(
                    client,
                    api_sport,
                    event_id,
                    specs,
                    sport_label,
                    requested_market,
                    event_label,
                )
                snapshots.extend(event_snaps)

    if not snapshots:
        if not API_KEY:
            logger.warning(
                "TheOdds API key missing, falling back to deterministic odds generator",
                context=REFRESH_CONTEXT,
            )
        elif not specs:
            logger.warning(
                f"No market spec found for {requested_market}, falling back to deterministic generator",
                context=REFRESH_CONTEXT,
            )
        else:
            logger.warning(
                f"TheOdds API returned no data for {requested_market}, falling back to deterministic generator",
                context=REFRESH_CONTEXT,
            )
        snapshots = _generate_mock_snapshots(sport_label, requested_market)

    await odds_snapshot_store.add_snapshots(snapshots)
    logger.info(
        "odds_ingestion:refresh",
    context=REFRESH_CONTEXT,
        count=len(snapshots),
        sport=sport_label,
        market=requested_market,
        source="theodds" if API_KEY else "deterministic",
    )
    return snapshots
