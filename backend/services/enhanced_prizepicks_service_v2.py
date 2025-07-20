import logging
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class EnhancedPrizePicksServiceV2:
    def __init__(self):
        self.base_url = "https://api.prizepicks.com"
        self.client: Optional[httpx.AsyncClient] = None

    async def initialize(self):
        if self.client is None:
            self.client = httpx.AsyncClient(
                base_url=self.base_url, timeout=10.0, follow_redirects=True
            )
        logger.info("[INIT] EnhancedPrizePicksServiceV2 client initialized.")

    async def fetch_projections_api(
        self, sport: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        url = "https://api.prizepicks.com/projections"
        params: Dict[str, str] = {}
        if sport:
            params["sport"] = sport
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; PrizePicksBot/1.0; +https://yourdomain.com)",
            "Accept": "application/json",
        }
        try:
            logger.info(
                "[FETCH] Fetching projections from %s with params: %s",
                url,
                params,
            )
            # Always ensure client is initialized before use
            if not self.client:
                await self.initialize()
            if not self.client:
                logger.error("[ERROR] AsyncClient is still None after initialization!")
                raise RuntimeError("AsyncClient not initialized")
            response = await self.client.get(url, params=params, headers=headers)
            logger.info("[FETCH] HTTP status: %s", response.status_code)
            logger.info("[FETCH] Response headers: %s", response.headers)
            logger.info(
                "[FETCH] Response text (first 500 chars): %s", response.text[:500]
            )
            response.raise_for_status()
            data = response.json()
            props = data.get("data", [])
            logger.info("[FETCH DONE] Got %d props.", len(props))
            return props
        except httpx.TimeoutException as e:
            logger.error("[ERROR] Timeout while fetching projections: %s", e)
            return []
        except httpx.HTTPStatusError as e:
            logger.error("[ERROR] HTTP error while fetching projections: %s", e)
            return []
        except httpx.RequestError as e:
            logger.error("[ERROR] Request error while fetching projections: %s", e)
            return []
        except Exception as e:
            logger.error("[ERROR] Unexpected error while fetching projections: %s", e)
            return []

    def get_scraper_health(self) -> Dict[str, Any]:
        return {"status": "ok", "service": "EnhancedPrizePicksServiceV2"}

    async def close(self):
        if self.client:
            await self.client.aclose()
            logger.info("Enhanced PrizePicks service v2 closed")


# Global service instance
enhanced_prizepicks_service_v2 = EnhancedPrizePicksServiceV2()


async def start_enhanced_prizepicks_service_v2():
    """Start the enhanced PrizePicks service v2"""
    try:
        await enhanced_prizepicks_service_v2.initialize()
        logger.info("Enhanced PrizePicks service v2 started successfully")
        return True
    except Exception as e:
        logger.error("Exception starting enhanced PrizePicks service v2: %s", e)
        return False
