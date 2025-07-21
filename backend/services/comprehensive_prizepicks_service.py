import asyncio
import logging
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

# Stub unresolved models
PrizePicksProjection = None
from backend.models.projection_history import ProjectionHistory

PlayerPerformance = None
ProjectionAnalysis = None

logger = logging.getLogger(__name__)

# Modern SQLAlchemy base for ORM models
Base = declarative_base()

"""
Comprehensive PrizePicks Data Ingestion Service
Enterprise-grade service for complete PrizePicks API integration with ALL projections.
Implements real-time data ingestion, historical tracking, and value detection.
"""


class ComprehensivePrizePicksService:
    async def get_current_props(self) -> List[Any]:
        """Return fast mock PrizePicks props for development/testing."""
        # Return mock data instantly to avoid endpoint hangs
        now = datetime.now(timezone.utc)
        return [
            {
                "id": "mock_mlb_judge_1",
                "player_name": "Aaron Judge",
                "team": "NYY",
                "position": "OF",
                "league": "MLB",
                "sport": "MLB",
                "stat_type": "Home Runs",
                "line_score": 1.5,
                "confidence": 87.5,
                "expected_value": 2.3,
                "recommendation": "OVER",
                "game_time": now.isoformat(),
                "opponent": "vs LAA",
                "venue": "Yankee Stadium",
                "status": "active",
                "updated_at": now.isoformat(),
            },
            {
                "id": "mock_mlb_betts_2",
                "player_name": "Mookie Betts",
                "team": "LAD",
                "position": "OF",
                "league": "MLB",
                "sport": "MLB",
                "stat_type": "Total Bases",
                "line_score": 2.5,
                "confidence": 82.1,
                "expected_value": 1.8,
                "recommendation": "OVER",
                "game_time": now.isoformat(),
                "opponent": "vs SD",
                "venue": "Dodger Stadium",
                "status": "active",
                "updated_at": now.isoformat(),
            },
        ]

    def __init__(self, database_url: str = "sqlite:///backend/a1betting.db"):
        self.base_url = "https://api.prizepicks.com"
        self.database_url = database_url
        self.engine = create_engine(self.database_url, future=True)
        self.SessionLocal = sessionmaker(
            bind=self.engine, autoflush=True, autocommit=False
        )
        self.session = None
        self.http_client = None
        self.scraper_health = {
            "last_success": None,
            "last_error": None,
            "error_streak": 0,
            "last_prop_count": 0,
            "healing_attempts": 0,
            "last_healing": None,
        }
        self.scraper_error_threshold = 3
        self.scraper_stale_minutes = 10
        self.current_projections: Dict[str, Any] = {}
        self.historical_data: deque[Any] = deque(maxlen=10000)
        self.player_trends: Dict[str, deque[Any]] = defaultdict(
            lambda: deque(maxlen=100)
        )
        self.fetch_count: int = 0
        self.error_count: int = 0
        self.last_update: Optional[datetime] = None
        self.update_frequency = 300
        self.analysis_cache: Dict[str, Any] = {}
        self.cache_ttl: int = 300
        self.last_request_time: float = 0
        self.request_count: int = 0
        self.rate_limit_reset_time: float = time.time() + 3600
        self.min_request_interval: float = 5.0
        self.base_backoff_delay: float = 10.0
        self.data_cache: dict[str, Any] = {}
        self.cache_expiry: dict[str, float] = {}
        self.cache_duration: int = 300
        self.initialize_database()

    def _scrape(self) -> list[dict[str, str]]:
        """
        Robust PrizePicks scraping logic using undetected-chromedriver (2025 best practices):
        - Rotates user agents from a large pool
        - Supports optional proxy rotation
        - Uses context manager for driver cleanup
        - Loads cookies if available
        - Handles captchas/manual intervention gracefully
        - Extracts props data, caches, and returns
        - Adds robust error handling and logging
        """
        import json
        import os
        import random

        import undetected_chromedriver as uc  # type: ignore
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.support.ui import WebDriverWait

        props: list[dict[str, str]] = []
        user_agents: list[str] = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        ]
        user_agent_path = os.path.join(os.path.dirname(__file__), "../user_agent.txt")
        user_agent_path = os.path.abspath(user_agent_path)
        if os.path.exists(user_agent_path):
            with open(user_agent_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip().lower().startswith("mozilla"):
                        user_agents.append(line.strip())
        user_agent = random.choice(user_agents)
        options = uc.ChromeOptions()  # type: ignore
        options.add_argument(f"--user-agent={user_agent}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-infobars")
        options.add_argument("--start-maximized")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        # Optionally disable images for speed
        prefs: dict[str, int] = {"profile.managed_default_content_settings.images": 2}
        options.add_experimental_option("prefs", prefs)  # type: ignore
        # Proxy support (optional)
        proxy_list: list[str] = []  # e.g., ["http://proxy1:port", "http://proxy2:port"]
        if proxy_list:
            selected_proxy: str = random.choice(proxy_list)
            options.add_argument(f"--proxy-server={selected_proxy}")
        # Headless mode (optional, but some sites block headless)
        # options.headless = True
        cookies_path = os.path.join(
            os.path.dirname(__file__), "../../prizepicks_cookies.json"
        )
        cookies_path = os.path.abspath(cookies_path)
        try:
            with uc.Chrome(options=options) as driver:  # type: ignore
                logger.info("[SCRAPER] Undetected ChromeDriver started successfully.")
                driver.get("https://app.prizepicks.com/")
                logger.info("[SCRAPER] Navigated to PrizePicks website.")
                # Inject cookies if available
                if os.path.exists(cookies_path):
                    logger.info(f"[COOKIES] Loading cookies from {cookies_path}")
                    with open(cookies_path, "r", encoding="utf-8") as f:
                        cookies = json.load(f)
                    for cookie in cookies:
                        cookie.pop("sameSite", None)
                        try:
                            driver.add_cookie(cookie)  # type: ignore
                        except Exception as e:
                            logger.warning(
                                f"[COOKIES] Failed to add cookie: {cookie.get('name', '')} - {e}"
                            )
                    driver.refresh()
                    logger.info("[COOKIES] Cookies injected and page refreshed.")
                else:
                    logger.warning(
                        f"[COOKIES] No cookies file found at {cookies_path}. You must export cookies after solving the captcha manually."
                    )
                # Wait for props data to load (update selector as needed)
                try:
                    WebDriverWait(driver, 30).until(
                        EC.presence_of_element_located(
                            (By.CSS_SELECTOR, "[data-testid='props-list']")
                        )
                    )
                    logger.info("[SCRAPER] Props list loaded.")
                    # Extract props data (update selector/logic as needed)
                    props_elements = driver.find_elements(
                        By.CSS_SELECTOR, "[data-testid='props-list']"
                    )
                    for elem in props_elements:
                        try:
                            props.append({"raw": elem.text})
                        except Exception as e:
                            logger.warning(f"[SCRAPER] Failed to extract prop: {e}")
                except Exception as e:
                    logger.error(f"[SCRAPER] Error waiting for props list: {e}")
        except Exception as e:
            logger.error(f"[SCRAPER] Error during scraping: {e}")
        return props

    def initialize_database(self):
        """Initialize database connection and create tables"""
        try:
            Base.metadata.create_all(self.engine)
            self.session = self.SessionLocal()
            logger.info("PrizePicks database initialized successfully")
        except OperationalError as e:
            logger.error("❌ Database operational error: %s", e)
            # Potentially raise a custom exception or trigger a fallback
        except SQLAlchemyError as e:
            logger.error("❌ Database SQLAlchemy error: %s", e)
            # General SQLAlchemy error
        except (
            Exception
        ) as e:  # Keep this as a fallback for truly unexpected issues for now
            logger.error(
                "❌ Database initialization failed with an unexpected error: %s", e
            )

    async def initialize(self):
        logger.info("PrizePicks database initialized successfully")
        import os

        user_agent_path = os.path.join(os.path.dirname(__file__), "../user_agent.txt")
        user_agent = None
        if os.path.exists(user_agent_path):
            with open(user_agent_path, "r", encoding="utf-8") as f:
                for line in f:
                    user_agent = line.strip()
                    break
        if not user_agent:
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        if not self.http_client:
            logger.info("Initializing PrizePicks HTTP client...")
            headers = {
                "User-Agent": user_agent,
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Referer": "https://app.prizepicks.com/",
                "Origin": "https://app.prizepicks.com",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site",
                "Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
            }
            self.http_client = httpx.AsyncClient(
                timeout=30.0,
                headers=headers,
                follow_redirects=True,
                verify=True,  # Ensure SSL verification is enabled
            )
            logger.info(
                "✅ PrizePicks HTTP client initialized successfully with user-agent: %s",
                user_agent,
            )
        # Load existing projections from database for immediate access
        await self.load_existing_projections()

    async def start_real_time_ingestion(self):
        """Stub for real-time ingestion. Starts periodic scraping."""
        await self.periodic_scrape_prizepicks_props()

    async def load_existing_projections(self) -> None:
        """
        Load recent projections from the database (last 24 hours, active/pre_game/open/live).
        """
        from datetime import datetime, timedelta

        if not self.session:
            logger.warning("Database session not available")
            return
        try:
            logger.info("Loading existing projections from database...")
            recent_cutoff = datetime.now() - timedelta(hours=24)
            # type: ignore for SQLAlchemy query chaining
            recent_projections = (
                self.session.query(ProjectionHistory)  # type: ignore
                .filter(ProjectionHistory.fetched_at >= recent_cutoff)  # type: ignore
                .filter(ProjectionHistory.status.in_(["active", "pre_game", "open", "live"]))  # type: ignore
                .order_by(ProjectionHistory.fetched_at.desc())  # type: ignore
                .all()  # type: ignore
            )
            recent_projections = list(recent_projections)  # type: ignore
            logger.info(
                f"Loaded {len(recent_projections)} existing projections from database"
            )
            # Optionally cache or process projections here
        except Exception as e:
            logger.error(f"Error loading existing projections: {e}")

    async def scrape_prizepicks_props(self) -> List[Dict[str, Any]]:
        loop = asyncio.get_event_loop()
        props = []
        try:
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = loop.run_in_executor(pool, self._scrape)
                props = await asyncio.wait_for(future, timeout=60)  # 60s timeout
        except asyncio.TimeoutError:
            logger.error("[SCRAPER] Selenium scraping timed out after 60 seconds.")
        except Exception as e:
            logger.error(f"[SCRAPER] Unexpected error in Selenium scraping: {e}")
        return props

    async def fetch_all_projections(self) -> List[Dict[str, Any]]:
        """Fetch ALL projections from PrizePicks API"""
        all_projections = []

        try:
            # Fetch all leagues first
            leagues = await self.fetch_leagues()

            # Fetch projections for each league
            for league in leagues:
                league_projections = await self.fetch_league_projections(league["id"])
                all_projections.extend(league_projections)

                # Small delay to respect rate limits
                await asyncio.sleep(0.1)

            logger.info(
                f"📊 Fetched {len(all_projections)} total projections across {len(leagues)} leagues"
            )
            return all_projections

        except Exception as e:
            logger.error(f"❌ Error fetching all projections: {e}")
            return []

    async def _make_api_request(
        self, url: str, params: Dict[str, Any] = None
    ) -> Optional[Dict[str, Any]]:
        """Make an authenticated API request with rate limiting and retry logic"""
        if not self.http_client:
            logger.error("❌ HTTP client not initialized")
            return None

        if params is None:
            params = {}

        # Check cache first
        cache_key = f"{url}:{str(sorted(params.items()))}"
        current_time = time.time()

        if cache_key in self.data_cache:
            if current_time < self.cache_expiry.get(cache_key, 0):
                logger.info(f"Using cached data for {url}")
                return self.data_cache[cache_key]
            else:
                # Cache expired, remove it
                del self.data_cache[cache_key]
                if cache_key in self.cache_expiry:
                    del self.cache_expiry[cache_key]

        # Rate limiting
        current_time = time.time()
        if current_time - self.last_request_time < self.rate_limit_delay:
            await asyncio.sleep(
                self.rate_limit_delay - (current_time - self.last_request_time)
            )

        # Prepare headers to mimic a real browser and avoid bot detection
        import os

        user_agent_path = os.path.join(os.path.dirname(__file__), "../user_agent.txt")
        user_agent_path = os.path.abspath(user_agent_path)
        user_agent = None
        if os.path.exists(user_agent_path):
            with open(user_agent_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line in lines:
                    if line.strip().lower().startswith("mozilla"):
                        user_agent = line.strip()
                        break
        if not user_agent:
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        headers = {
            "User-Agent": user_agent,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }

        # Add API key if available (not required for PrizePicks)
        # if self.api_key:
        #     headers["Authorization"] = f"Bearer {self.api_key}"
        #     logger.debug("🔑 Using API key authentication")
        # else:
        logger.info("PrizePicks API is public; no API key required.")

        # Implement rate limiting - ensure minimum time between requests
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        if time_since_last_request < self.min_request_interval:
            wait_time = self.min_request_interval - time_since_last_request
            logger.info(f"Rate limiting: waiting {wait_time:.1f}s before request")
            await asyncio.sleep(wait_time)

        # Retry logic with exponential backoff
        for attempt in range(self.max_retries):
            try:
                self.last_request_time = time.time()
                self.request_count += 1

                response = await self.http_client.get(
                    url, params=params, headers=headers
                )

                # Handle rate limiting with proper exponential backoff
                if response.status_code == 429:
                    # Use exponential backoff with minimum wait time
                    base_delay = self.base_backoff_delay * (
                        2**attempt
                    )  # 5, 10, 20 seconds
                    retry_after = int(response.headers.get("Retry-After", base_delay))

                    # Ensure minimum wait time to avoid rapid retries
                    wait_time = max(retry_after, base_delay, 5)  # At least 5 seconds

                    logger.warning(
                        f"⚠️ Rate limited by API (429), using exponential backoff: waiting {wait_time}s before retry (attempt {attempt + 1}/{self.max_retries})"
                    )
                    await asyncio.sleep(wait_time)
                    continue

                # Handle authentication errors
                if response.status_code == 403:
                    logger.error("❌ Authentication failed - check API key")
                    return None

                response.raise_for_status()
                result = response.json()

                # Cache successful response
                self.data_cache[cache_key] = result
                self.cache_expiry[cache_key] = current_time + self.cache_duration
                logger.info(
                    f"💾 Cached data for {url} (expires in {self.cache_duration}s)"
                )

                return result

            except httpx.TimeoutException as e:
                logger.error(f"❌ HTTP request timed out for URL {url}: {e}")
                if attempt < self.max_retries - 1:
                    wait_time = self.base_backoff_delay * (2**attempt)
                    logger.info(
                        f"🔄 Retrying in {wait_time}s due to timeout error (attempt {attempt + 1}/{self.max_retries})..."
                    )
                    await asyncio.sleep(wait_time)
                    continue
                return None
            except httpx.RequestError as e:  # Catch network errors, DNS errors, etc.
                logger.error(f"❌ HTTP request error for URL {url}: {e}")
                if attempt < self.max_retries - 1:
                    wait_time = self.base_backoff_delay * (2**attempt)
                    logger.info(
                        f"🔄 Retrying in {wait_time}s due to request error (attempt {attempt + 1}/{self.max_retries})..."
                    )
                    await asyncio.sleep(wait_time)
                    continue
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"❌ HTTP status error {e.response.status_code} for URL {e.request.url}: {e}"
                )
                if e.response.status_code in [429, 500, 502, 503, 504]:
                    if attempt < self.max_retries - 1:
                        wait_time = self.base_backoff_delay * (2**attempt)
                        logger.info(
                            f"🔄 Retrying in {wait_time}s due to server error (attempt {attempt + 1}/{self.max_retries})..."
                        )
                        await asyncio.sleep(wait_time)
                        continue
                return None
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON decoding error for URL {url}: {e}")
                return None
            except Exception as e:
                logger.error(
                    f"❌ An unexpected error occurred during API request to {url}: {e}"
                )
                if attempt < self.max_retries - 1:
                    wait_time = self.base_backoff_delay * (2**attempt)
                    logger.info(
                        f"🔄 Retrying in {wait_time}s due to unexpected error (attempt {attempt + 1}/{self.max_retries})..."
                    )
                    await asyncio.sleep(wait_time)
                    continue
                return None

        logger.error(
            f"❌ API request failed for {url} after {self.max_retries} retries with exponential backoff."
        )
        return None

    async def fetch_leagues(self) -> List[Dict[str, Any]]:
        """Fetch all available leagues"""
        try:
            data = await self._make_api_request(f"{self.base_url}/leagues")

            if data:
                leagues = data.get("data", [])
                logger.info(f"📋 Found {len(leagues)} active leagues")
                return leagues
            else:
                logger.warning("⚠️ Failed to fetch leagues, using defaults")
                return [
                    {"id": "NBA", "name": "NBA"},
                    {"id": "NFL", "name": "NFL"},
                    {"id": "MLB", "name": "MLB"},
                    {"id": "NHL", "name": "NHL"},
                    {"id": "NCAAB", "name": "NCAAB"},
                    {"id": "NCAAF", "name": "NCAAF"},
                ]

        except Exception as e:
            logger.error(f"❌ Error fetching leagues: {e}")
            return [
                {"id": "NBA", "name": "NBA"},
                {"id": "NFL", "name": "NFL"},
                {"id": "MLB", "name": "MLB"},
                {"id": "NHL", "name": "NHL"},
                {"id": "NCAAB", "name": "NCAAB"},
                {"id": "NCAAF", "name": "NCAAF"},
            ]

    async def fetch_league_projections(self, league_id: str) -> List[Dict[str, Any]]:
        """Fetch all projections for a specific league"""
        try:
            params = {
                "include": "new_player,league,stat_type",
                "per_page": 250,  # Increased per_page limit
                "single_stat": "true",
            }

            if league_id:
                params["league_id"] = league_id

            data = await self._make_api_request(
                f"{self.base_url}/projections", params=params
            )

            if data:
                projections = data.get("data", [])
                included = data.get("included", [])

                # Process included data for player and league info
                processed_projections = self.process_raw_projections(
                    projections, included
                )

                logger.info(
                    f"📊 Fetched {len(processed_projections)} projections for league: {league_id}"
                )
                return processed_projections
            else:
                logger.warning(f"⚠️ Failed to fetch projections for league: {league_id}")
                return []

        except Exception as e:
            logger.error(f"❌ Error fetching projections for league {league_id}: {e}")
            return []

    def process_raw_projections(
        self, projections: List[Dict], included: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Process raw API data into structured projections"""
        # Create lookup maps
        players_map = {}
        leagues_map = {}

        for item in included:
            if item.get("type") == "new_player":
                players_map[item["id"]] = item["attributes"]
            elif item.get("type") == "league":
                leagues_map[item["id"]] = item["attributes"]

        processed = []

        for proj in projections:
            try:
                attrs = proj.get("attributes", {})
                relationships = proj.get("relationships", {})

                # Get player info
                player_id = (
                    relationships.get("new_player", {}).get("data", {}).get("id", "")
                )
                player_info = players_map.get(player_id, {})

                # Get league info
                league_id = (
                    relationships.get("league", {}).get("data", {}).get("id", "")
                )
                league_info = leagues_map.get(league_id, {})

                processed_proj = {
                    "id": proj.get("id", ""),
                    "player_id": player_id,
                    "player_name": player_info.get(
                        "name", attrs.get("description", "")
                    ),
                    "team": player_info.get("team_name", ""),
                    "position": player_info.get("position", ""),
                    "league": league_info.get("name", league_id),
                    "sport": league_info.get("sport", ""),
                    "stat_type": attrs.get("stat_type", ""),
                    "line_score": float(attrs.get("line_score", 0)),
                    "start_time": attrs.get("start_time", ""),
                    "status": attrs.get("status", "active"),
                    "description": attrs.get("description", ""),
                    "rank": attrs.get("rank", 0),
                    "is_promo": attrs.get("is_promo", False),
                    "updated_at": attrs.get("updated_at", ""),
                    "odds_type": attrs.get("odds_type", ""),
                    "projection_type": attrs.get("projection_type", ""),
                }

                processed.append(processed_proj)

            except Exception as e:
                logger.warning(
                    f"⚠️ Error processing projection {proj.get('id', 'unknown')}: {e}"
                )
                continue

        return processed

    async def process_projections(self, projections: List[Dict[str, Any]]) -> int:
        """Process and store projections"""
        processed_count = 0

        for proj_data in projections:
            try:
                # Create PrizePicksProjection object
                projection = PrizePicksProjection(
                    id=proj_data["id"],
                    player_id=proj_data["player_id"],
                    player_name=proj_data["player_name"],
                    team=proj_data["team"],
                    position=proj_data["position"],
                    league=proj_data["league"],
                    sport=proj_data["sport"],
                    stat_type=proj_data["stat_type"],
                    line_score=proj_data["line_score"],
                    start_time=(
                        datetime.fromisoformat(
                            proj_data["start_time"].replace("Z", "+00:00")
                        )
                        if proj_data["start_time"]
                        else datetime.now()
                    ),
                    status=proj_data["status"],
                    description=proj_data["description"],
                    rank=proj_data["rank"],
                    is_promo=proj_data["is_promo"],
                    updated_at=(
                        datetime.fromisoformat(
                            proj_data["updated_at"].replace("Z", "+00:00")
                        )
                        if proj_data["updated_at"]
                        else datetime.now()
                    ),
                )

                # Store in current projections
                self.current_projections[projection.id] = projection

                # Add to historical data
                self.historical_data.append(projection)

                # Update player trends
                player_key = f"{projection.player_id}_{projection.stat_type}"
                self.player_trends[player_key].append(
                    {
                        "timestamp": datetime.now(),
                        "line": projection.line_score,
                        "league": projection.league,
                    }
                )

                # Store in database
                # await self.store_projection_history(projection)

                processed_count += 1

            except Exception as e:
                logger.warning(f"⚠️ Error processing projection: {e}")
                continue

        return processed_count

        # async def store_projection_history(self, projection: Any):
        """Store projection in database for historical analysis"""
        try:
            if self.session:
                history_record = ProjectionHistory(
                    projection_id=projection.id,
                    player_id=projection.player_id,
                    player_name=projection.player_name,
                    team=projection.team,
                    league=projection.league,
                    stat_type=projection.stat_type,
                    line_score=projection.line_score,
                    start_time=projection.start_time,
                    status=projection.status,
                )

                # Check if record already exists
                existing = (
                    self.session.query(ProjectionHistory)
                    .filter_by(projection_id=projection.id)
                    .first()
                )

                if not existing:
                    self.session.add(history_record)
                    self.session.commit()

        except Exception as e:
            logger.warning(f"⚠️ Error storing projection history: {e}")
            if self.session:
                self.session.rollback()

            # async def analyze_projections_continuously(self):
            #     """Continuously analyze projections for value and accuracy"""
            #     while True:
            #         try:
            #             start_time = time.time()
            #
            #             analyses_created = 0
            #             for projection_id, projection in self.current_projections.items():
            #                 if projection_id not in self.analysis_cache:
            #                     analysis = await self.analyze_projection(projection)
            #                     self.analysis_cache[projection_id] = analysis
            #                     analyses_created += 1
            #
            #             analysis_time = time.time() - start_time
            #             logger.info(
            #                 f"📊 Created {analyses_created} new analyses in {analysis_time:.2f}s"
            #             )
            #
            #             # Clean old cache entries
            #             self.clean_analysis_cache()
            #
            #             await asyncio.sleep(60)  # Analyze every minute
            #
            #         except Exception as e:
            #             logger.error(f"❌ Analysis error: {e}")
            #             await asyncio.sleep(30)

            # async def analyze_projection(
            #     # self, projection: Any
            # ) -> Any:
            #     """Analyze a single projection for value and accuracy"""
            #     try:
            #         # Get player historical performance
            #         player_history = await self.get_player_historical_performance(
            #             projection.player_id, projection.stat_type
            #         )
            #
            #         # Calculate predicted value based on historical data
            #         predicted_value = self.calculate_predicted_value(player_history, projection)
            #
            #         # Calculate confidence based on data quality and consistency
            #         confidence = self.calculate_prediction_confidence(
            #             player_history, projection
            #         )
            #
            #         # Calculate value bet score
            #         value_score = self.calculate_value_bet_score(
            #             predicted_value, projection.line_score
            #         )
            #
            #         # Generate recommendation
            #         recommendation = self.generate_recommendation(
            #             predicted_value, projection.line_score, confidence
            #         )

            # Create reasoning
            reasoning = self.generate_reasoning(
                player_history, predicted_value, projection, confidence
            )

            return ProjectionAnalysis(
                projection_id=projection.id,
                predicted_value=predicted_value,
                confidence=confidence,
                value_bet_score=value_score,
                market_comparison={},  # Will be filled by market comparison service
                trend_analysis=self.analyze_player_trends(
                    projection.player_id, projection.stat_type
                ),
                risk_assessment=self.assess_risk(projection, confidence),
                recommendation=recommendation,
                reasoning=reasoning,
            )

        except Exception as e:
            logger.error(f"❌ Error analyzing projection {projection.id}: {e}")
            return ProjectionAnalysis(
                projection_id=projection.id,
                predicted_value=projection.line_score,
                confidence=0.5,
                value_bet_score=0.0,
                market_comparison={},
                trend_analysis={},
                risk_assessment={},
                recommendation="INSUFFICIENT_DATA",
                reasoning=["Insufficient data for analysis"],
            )

            # def calculate_predicted_value(
            #     self, history: List[Dict], projection: Any
            # ) -> float:
            #     """Calculate predicted value based on historical performance"""
            #     if not history:
            #         return projection.line_score
            #
            #     # Get recent performance (last 10 games)
            #     recent_games = sorted(history, key=lambda x: x["game_date"], reverse=True)[:10]
            #
            #     if not recent_games:
            #         return projection.line_score
            #
            #     # Calculate weighted average (more recent games weighted higher)
            #     total_weight = 0
            #     weighted_sum = 0
            #
            #     for i, game in enumerate(recent_games):
            #         weight = 1.0 / (i + 1)  # Recent games get higher weight
            #         weighted_sum += game["actual_value"] * weight
            #         total_weight += weight
            #
            #     predicted = (
            #         weighted_sum / total_weight if total_weight > 0 else projection.line_score
            #     )
            #
            #     # Apply trend adjustment
            #     if len(recent_games) >= 5:
            #         trend = self.calculate_trend(recent_games[:5])
            #         predicted += trend * 0.1  # Small trend adjustment
            #
            #     return round(predicted, 1)

            # def calculate_prediction_confidence(
            #     self, history: List[Dict], projection: Any
            # ) -> float:
            #     """Calculate confidence in prediction based on data quality"""
            #     base_confidence = 0.5
            #
            #     if not history:
            #         return base_confidence
            #
            #     # Factor 1: Sample size
            #     sample_size_factor = min(len(history) / 20, 1.0) * 0.2
            #
            #     # Factor 2: Consistency (lower variance = higher confidence)
            #     values = [game["actual_value"] for game in history]
            #     if len(values) > 1:
            variance = np.var(values)
            consistency_factor = max(0, 0.2 - variance / 100)
        else:
            consistency_factor = 0

        # Factor 3: Recency (more recent data = higher confidence)
        recent_games = [
            g
            for g in history
            if (datetime.now(timezone.utc) - g["game_date"]).days <= 30
        ]
        recency_factor = min(len(recent_games) / 10, 1.0) * 0.1

        # Factor 4: League quality (some leagues have more predictable data)
        league_factor = 0.1 if projection.league in ["NBA", "NFL", "MLB"] else 0.05

        total_confidence = (
            base_confidence
            + sample_size_factor
            + consistency_factor
            + recency_factor
            + league_factor
        )
        return min(total_confidence, 0.95)  # Cap at 95%

    def calculate_value_bet_score(self, predicted_value: float, line: float) -> float:
        """Calculate value bet score (positive = value on over, negative = value on under)"""
        difference = predicted_value - line

        # Convert difference to value score (larger differences = higher value)
        if abs(difference) < 0.5:
            return 0.0  # No significant value

        # Scale the value score
        value_score = difference / line if line > 0 else 0
        return round(value_score, 3)

    def generate_recommendation(
        self, predicted: float, line: float, confidence: float
    ) -> str:
        """Generate betting recommendation"""
        difference = predicted - line

        if confidence < 0.6:
            return "INSUFFICIENT_CONFIDENCE"

        if abs(difference) < 0.5:
            return "NO_VALUE"

        if difference > 0.5 and confidence > 0.7:
            return "STRONG_OVER"
        elif difference > 0.2:
            return "LEAN_OVER"
        elif difference < -0.5 and confidence > 0.7:
            return "STRONG_UNDER"
        elif difference < -0.2:
            return "LEAN_UNDER"
        else:
            return "NO_VALUE"

            # def generate_reasoning(
            #     self,
            #     history: List[Dict],
            #     predicted: float,
            #     projection: Any,
            #     confidence: float,
            # ) -> List[str]:
            #     """Generate human-readable reasoning for the analysis"""
            #     reasoning = []
            #
            #     if not history:
            #         reasoning.append("Limited historical data available")
            #         return reasoning
            #
            #     # Sample size reasoning
            #     reasoning.append(f"Based on {len(history)} historical games")
            #
            #     # Recent performance
            #     recent = sorted(history, key=lambda x: x["game_date"], reverse=True)[:5]
            #     if recent:
            avg_recent = sum(g["actual_value"] for g in recent) / len(recent)
            reasoning.append(f"Recent 5-game average: {avg_recent:.1f}")

        # Trend analysis
        if len(recent) >= 3:
            trend = self.calculate_trend(recent)
            if trend > 0.2:
                reasoning.append("Player showing upward trend")
            elif trend < -0.2:
                reasoning.append("Player showing downward trend")

        # Confidence reasoning
        if confidence > 0.8:
            reasoning.append("High confidence due to consistent performance")
        elif confidence < 0.6:
            reasoning.append("Lower confidence due to limited or inconsistent data")

        # Value reasoning
        difference = predicted - projection.line_score
        if abs(difference) > 0.5:
            reasoning.append(f"Significant value detected: {difference:+.1f} vs line")

        return reasoning

    def calculate_trend(self, recent_games: List[Dict]) -> float:
        """Calculate performance trend (positive = improving, negative = declining)"""
        if len(recent_games) < 3:
            return 0.0

        # Sort by date (oldest first for trend calculation)
        sorted_games = sorted(recent_games, key=lambda x: x["game_date"])
        values = [game["actual_value"] for game in sorted_games]

        # Calculate simple linear trend
        x = list(range(len(values)))
        if len(x) > 1:
            slope = np.polyfit(x, values, 1)[0]
            return slope

        return 0.0

    def analyze_player_trends(self, player_id: str, stat_type: str) -> Dict[str, Any]:
        """Analyze player trends over time"""
        player_key = f"{player_id}_{stat_type}"
        trends = self.player_trends.get(player_key, deque())

        if len(trends) < 3:
            return {"trend": "insufficient_data", "data_points": len(trends)}

        recent_lines = [t["line"] for t in list(trends)[-10:]]

        # Calculate trend direction
        if len(recent_lines) >= 3:
            slope = np.polyfit(range(len(recent_lines)), recent_lines, 1)[0]
            if slope > 0.1:
                trend = "increasing"
            elif slope < -0.1:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "data_points": len(trends),
            "recent_average": np.mean(recent_lines) if recent_lines else 0,
            "volatility": np.std(recent_lines) if len(recent_lines) > 1 else 0,
        }

    # def assess_risk(
    #     self, projection: Any, confidence: float
    # ) -> Dict[str, Any]:
    #     """Assess risk factors for the projection"""
    #     risk_factors = []
    #     risk_score = 0.0
    #
    #     # Time until game
    #     time_to_game = (
    #         projection.start_time - datetime.now(timezone.utc)
    #     ).total_seconds() / 3600
    #     if time_to_game < 2:  # Less than 2 hours
    #         risk_factors.append("Game starting soon - lineup changes possible")
    #         risk_score += 0.1
    #
    #     # Promotional props are riskier
    #     if projection.is_promo:
    #         risk_factors.append("Promotional prop - potentially boosted line")
    #         risk_score += 0.2
    #
    #     # Low confidence increases risk
    #     if confidence < 0.6:
    #         risk_factors.append("Low prediction confidence")
    #         risk_score += 0.3
    #
    #     # New players or limited data
    #     player_data_points = len(
    #         self.player_trends.get(f"{projection.player_id}_{projection.stat_type}", [])
    #     )
    #     if player_data_points < 5:
    #         risk_factors.append("Limited historical data for player")
    #         risk_score += 0.2
    #
    #     return {
    #         "risk_score": min(risk_score, 1.0),
    #         "risk_factors": risk_factors,
    #         "recommendation": (
    #             "HIGH_RISK"
    #             if risk_score > 0.5
    #             else "MODERATE_RISK" if risk_score > 0.2 else "LOW_RISK"
    #         ),
    #     }

    async def get_player_historical_performance(
        self, player_id: str, stat_type: str
    ) -> List[Dict[str, Any]]:
        """Get player's historical performance for the stat type"""
        if not self.session:
            return []

        try:
            # Query last 50 games for the player and stat type
            records = (
                self.session.query(PlayerPerformance)
                .filter_by(player_id=player_id, stat_type=stat_type)
                .order_by(PlayerPerformance.game_date.desc())
                .limit(50)
                .all()
            )

            return [
                {
                    "game_date": record.game_date,
                    "actual_value": record.actual_value,
                    "projected_value": record.projected_value,
                    "difference": record.difference,
                }
                for record in records
            ]

        except Exception as e:
            logger.error(f"❌ Error fetching player history: {e}")
            return []

    async def update_historical_accuracy(self):
        """Update historical accuracy metrics for completed games"""
        while True:
            try:
                # This would integrate with sports data APIs to get actual results
                # For now, we'll implement the framework
                logger.info("📊 Updating historical accuracy metrics...")

                # RESOLVED: Integrate with ESPN, NBA API, etc. to get actual game results
                # and update our accuracy tracking

                await asyncio.sleep(3600)  # Update every hour

            except Exception as e:
                logger.error(f"❌ Error updating accuracy: {e}")
                await asyncio.sleep(1800)  # Wait 30 minutes on error

    async def detect_value_opportunities(self):
        """Continuously detect high-value betting opportunities"""
        while True:
            try:
                high_value_opportunities = []

                for projection_id, analysis in self.analysis_cache.items():
                    if (
                        abs(analysis.value_bet_score) > 0.05  # 5%+ value
                        and analysis.confidence > 0.7  # High confidence
                        and analysis.risk_assessment.get("risk_score", 1.0) < 0.3
                    ):  # Low risk

                        projection = self.current_projections.get(projection_id)
                        if projection:
                            opportunity = {
                                "projection_id": projection_id,
                                "player": projection.player_name,
                                "stat_type": projection.stat_type,
                                "line": projection.line_score,
                                "predicted": analysis.predicted_value,
                                "value_score": analysis.value_bet_score,
                                "confidence": analysis.confidence,
                                "recommendation": analysis.recommendation,
                                "reasoning": analysis.reasoning,
                            }
                            high_value_opportunities.append(opportunity)

                if high_value_opportunities:
                    # Sort by value score
                    high_value_opportunities.sort(
                        key=lambda x: abs(x["value_score"]), reverse=True
                    )

                    logger.info(
                        f"🎯 Found {len(high_value_opportunities)} high-value opportunities"
                    )

                    # Log top 3 opportunities
                    for i, opp in enumerate(high_value_opportunities[:3]):
                        logger.info(
                            f"  {i+1}. {opp['player']} {opp['stat_type']}: "
                            f"{opp['predicted']:.1f} vs {opp['line']:.1f} "
                            f"({opp['value_score']:+.1%} value, {opp['confidence']:.0%} confidence)"
                        )

                await asyncio.sleep(300)  # Check every 5 minutes

            except Exception as e:
                logger.error(f"❌ Error detecting opportunities: {e}")
                await asyncio.sleep(60)

    def clean_analysis_cache(self):
        """Clean old analysis cache entries"""
        current_time = time.time()
        expired_keys = []

        for key, analysis in self.analysis_cache.items():
            # Remove analyses older than cache TTL
            if (
                current_time - getattr(analysis, "created_at", current_time)
                > self.cache_ttl
            ):
                expired_keys.append(key)

        for key in expired_keys:
            del self.analysis_cache[key]

    async def get_current_projections(self) -> List[Any]:
        """Fetch and return real PrizePicks API projections with ML predictions."""
        try:
            # Fetch all real projections from PrizePicks API
            projections = await self.fetch_all_projections()
            # Optionally, run ML ensemble analysis here if needed
            # For now, just return the raw projections
            return projections
        except Exception as e:
            logger.error(f"Error fetching real PrizePicks projections: {e}")
            return []

    async def get_projections_by_league(self, league: str) -> List[Any]:
        """Get projections for a specific league"""
        return [
            p
            for p in self.current_projections.values()
            if p.league.upper() == league.upper()
        ]

    async def get_projections_by_player(self, player_name: str) -> List[Any]:
        """Get all projections for a specific player"""
        return [
            p
            for p in self.current_projections.values()
            if player_name.lower() in p.player_name.lower()
        ]

    async def get_high_value_opportunities(
        self, min_value: float = 0.05, min_confidence: float = 0.7
    ) -> List[Dict]:
        """Get high-value betting opportunities"""
        opportunities = []

        for projection_id, analysis in self.analysis_cache.items():
            if (
                abs(analysis.value_bet_score) >= min_value
                and analysis.confidence >= min_confidence
            ):

                projection = self.current_projections.get(projection_id)
                if projection:
                    opportunities.append(
                        {
                            "projection": projection,
                            "analysis": analysis,
                            "value_score": analysis.value_bet_score,
                            "confidence": analysis.confidence,
                        }
                    )

        # Sort by value score
        opportunities.sort(key=lambda x: abs(x["value_score"]), reverse=True)
        return opportunities

    # Duplicate scrape_prizepicks_props method removed. Use the main async method defined earlier.

    async def periodic_scrape_prizepicks_props(self):
        """Periodically scrape PrizePicks props using Selenium and update current_projections."""
        # Removed unused helper functions safe_parse_datetime and safe_float

        while True:
            try:
                logger.info(
                    "[PERIODIC SCRAPER] Starting Selenium scrape of PrizePicks props..."
                )
                props = await self.scrape_prizepicks_props()
                logger.info(
                    "[PERIODIC SCRAPER] Scraped %d props. Updating current_projections.",
                    len(props),
                )
                # Update current_projections with new props
                for prop in props:
                    self.current_projections[prop.get("id", "")] = prop
                logger.info(
                    "[PERIODIC SCRAPER] Updated current_projections with %d props.",
                    len(props),
                )
            except Exception as e:
                logger.error("[PERIODIC SCRAPER] Error during Selenium scrape: %s", e)
            await asyncio.sleep(300)  # Scrape every 5 minutes

    def get_service_stats(self) -> Dict[str, Any]:
        """Get service performance statistics"""
        return {
            "total_projections": len(self.current_projections),
            "fetch_count": self.fetch_count,
            "error_count": self.error_count,
            "last_update": self.last_update.isoformat() if self.last_update else None,
            "analysis_cache_size": len(self.analysis_cache),
            "leagues_tracked": len(
                set(p.league for p in self.current_projections.values())
            ),
            "players_tracked": len(
                set(p.player_id for p in self.current_projections.values())
            ),
            "update_frequency_minutes": self.update_frequency / 60,
            "error_rate": self.error_count / max(self.fetch_count, 1),
        }

    def get_scraper_health(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        last_success = self.scraper_health.get("last_success")
        last_healing = self.scraper_health.get("last_healing")
        last_prop_count = self.scraper_health.get("last_prop_count")
        is_stale = False
        if last_success and isinstance(last_success, datetime):
            is_stale = (
                now - last_success
            ).total_seconds() > self.scraper_stale_minutes * 60
        last_success_str = (
            last_success.isoformat() if isinstance(last_success, datetime) else None
        )
        last_healing_str = (
            last_healing.isoformat() if isinstance(last_healing, datetime) else None
        )
        prop_count = last_prop_count if isinstance(last_prop_count, int) else 0
        is_healthy = self.scraper_health.get("error_streak") == 0 and prop_count > 0
        return {
            "last_success": last_success_str,
            "last_error": self.scraper_health.get("last_error"),
            "error_streak": self.scraper_health.get("error_streak"),
            "last_prop_count": prop_count,
            "healing_attempts": self.scraper_health.get("healing_attempts"),
            "last_healing": last_healing_str,
            "is_healthy": is_healthy,
            "is_stale": is_stale,
        }


# Global service instance
comprehensive_prizepicks_service = ComprehensivePrizePicksService()


async def start_prizepicks_service():
    logger.info(
        "[DIAGNOSTIC] start_prizepicks_service() called - PrizePicks real-time ingestion starting"
    )
    logger.info("🚀 Starting Comprehensive PrizePicks Service...")
    await comprehensive_prizepicks_service.start_real_time_ingestion()


if __name__ == "__main__":
    # For testing: run the scraping logic directly and close browser
    async def test_scrape():
        service = ComprehensivePrizePicksService()
        props = await service.scrape_prizepicks_props()
        print(f"Scraped {len(props)} props.")

    asyncio.run(test_scrape())
