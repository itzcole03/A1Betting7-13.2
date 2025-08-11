"""
Unified Integration Service

Consolidates all external API integrations and third-party service connections
into a comprehensive service that provides consistent interfaces for accessing
external data and services.
"""

import asyncio
import logging
import uuid
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import json
from collections import defaultdict, deque
from decimal import Decimal

import aiohttp
import numpy as np

from .models import (
    IntegrationRequest,
    IntegrationResponse,
    SportsbookOddsRequest,
    ExternalDataRequest,
    WebhookRequest,
    SportsbookOdds,
    ExternalDataResponse,
    AuthenticationResult,
    WebhookEvent,
    IntegrationStatus,
    ArbitrageOpportunity,
    HealthResponse,
    RateLimitInfo,
    Sport,
    Sportsbook,
    ExternalProvider,
    IntegrationType,
    MarketType,
    OddsFormat,
    ConnectionStatus,
)

# Import existing services for gradual migration
try:
    from backend.services.sportsbook_apis.betmgm_api_service import BetMGMAPIService
    from backend.services.sportsbook_apis.draftkings_api_service import DraftKingsAPIService
    from backend.services.sportradar_service import SportRadarService
    LEGACY_SERVICES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Legacy integration services not available: {e}")
    LEGACY_SERVICES_AVAILABLE = False

logger = logging.getLogger(__name__)


class UnifiedIntegrationService:
    """
    Unified service that consolidates all external integrations.
    
    This service handles sportsbook APIs, external data providers, authentication,
    and webhook integrations while providing consistent interfaces and error handling.
    """
    
    def __init__(self):
        self.cache_dir = Path("backend/cache/integrations")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Service state
        self.is_initialized = False
        self.integrations_online = 0
        self.service_start_time = datetime.now(timezone.utc)
        
        # Integration registry
        self.integrations = {}
        self.connection_status = {}
        self.rate_limits = {}
        
        # Authentication tokens
        self.auth_tokens = {}
        
        # Metrics and monitoring
        self.request_metrics = defaultdict(list)
        self.error_counts = defaultdict(int)
        
        # HTTP session
        self.http_session = None
        
        # Legacy service integration
        self.legacy_betmgm = None
        self.legacy_draftkings = None
        self.legacy_sportradar = None
        
        if LEGACY_SERVICES_AVAILABLE:
            self._initialize_legacy_services()
    
    def _initialize_legacy_services(self):
        """Initialize legacy services for gradual migration"""
        try:
            self.legacy_betmgm = BetMGMAPIService()
            self.legacy_draftkings = DraftKingsAPIService()
            self.legacy_sportradar = SportRadarService()
            logger.info("Legacy integration services initialized")
        except Exception as e:
            logger.error(f"Failed to initialize legacy integration services: {e}")
    
    async def initialize(self) -> bool:
        """Initialize the integration service"""
        try:
            logger.info("Initializing Unified Integration Service...")
            
            # Initialize HTTP session
            self.http_session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={"User-Agent": "A1Betting-Integration-Service/2.0"}
            )
            
            # Initialize integrations
            await self._initialize_integrations()
            
            # Start background monitoring
            asyncio.create_task(self._background_monitoring())
            
            self.is_initialized = True
            logger.info(f"Integration service initialized. Integrations online: {self.integrations_online}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize integration service: {e}")
            return False
    
    async def cleanup(self):
        """Cleanup service resources"""
        try:
            if self.http_session:
                await self.http_session.close()
            logger.info("Integration service cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
    
    async def _initialize_integrations(self):
        """Initialize all external integrations"""
        try:
            # Sportsbook integrations
            sportsbooks = [
                Sportsbook.BETMGM,
                Sportsbook.DRAFTKINGS,
                Sportsbook.CAESARS,
                Sportsbook.FANDUEL,
                Sportsbook.PRIZEPICKS,
            ]
            
            # External data providers
            providers = [
                ExternalProvider.SPORTRADAR,
                ExternalProvider.ESPN,
                ExternalProvider.BASEBALL_SAVANT,
            ]
            
            total_integrations = len(sportsbooks) + len(providers)
            
            # Initialize sportsbook connections
            for sportsbook in sportsbooks:
                try:
                    status = await self._test_sportsbook_connection(sportsbook)
                    self.connection_status[sportsbook] = status
                    if status.status == ConnectionStatus.CONNECTED:
                        self.integrations_online += 1
                except Exception as e:
                    logger.warning(f"Failed to initialize sportsbook {sportsbook}: {e}")
                    self.connection_status[sportsbook] = IntegrationStatus(
                        provider=sportsbook,
                        integration_type=IntegrationType.SPORTSBOOK,
                        status=ConnectionStatus.ERROR,
                        uptime_percentage=0.0,
                        avg_response_time_ms=0.0,
                        error_rate=1.0,
                        authenticated=False,
                        error_message=str(e)
                    )
            
            # Initialize data provider connections
            for provider in providers:
                try:
                    status = await self._test_provider_connection(provider)
                    self.connection_status[provider] = status
                    if status.status == ConnectionStatus.CONNECTED:
                        self.integrations_online += 1
                except Exception as e:
                    logger.warning(f"Failed to initialize provider {provider}: {e}")
                    self.connection_status[provider] = IntegrationStatus(
                        provider=provider,
                        integration_type=IntegrationType.DATA_PROVIDER,
                        status=ConnectionStatus.ERROR,
                        uptime_percentage=0.0,
                        avg_response_time_ms=0.0,
                        error_rate=1.0,
                        authenticated=False,
                        error_message=str(e)
                    )
                    
        except Exception as e:
            logger.error(f"Failed to initialize integrations: {e}")
    
    async def _test_sportsbook_connection(self, sportsbook: Sportsbook) -> IntegrationStatus:
        """Test sportsbook connection"""
        try:
            # Mock connection test - would make actual API calls in production
            response_time = np.random.uniform(100, 500)
            
            # Simulate authentication
            auth_success = np.random.random() > 0.1  # 90% success rate
            
            status = ConnectionStatus.CONNECTED if auth_success else ConnectionStatus.ERROR
            
            return IntegrationStatus(
                provider=sportsbook,
                integration_type=IntegrationType.SPORTSBOOK,
                status=status,
                uptime_percentage=np.random.uniform(95, 99.9),
                avg_response_time_ms=response_time,
                error_rate=np.random.uniform(0.01, 0.05),
                requests_per_minute=60,  # Mock rate limit
                requests_remaining=np.random.randint(30, 60),
                rate_limit_reset=datetime.now(timezone.utc) + timedelta(minutes=1),
                authenticated=auth_success,
                token_expires_at=datetime.now(timezone.utc) + timedelta(hours=1) if auth_success else None,
                last_success=datetime.now(timezone.utc) if auth_success else None,
                error_message=None if auth_success else "Authentication failed"
            )
            
        except Exception as e:
            logger.error(f"Sportsbook connection test failed for {sportsbook}: {e}")
            raise
    
    async def _test_provider_connection(self, provider: ExternalProvider) -> IntegrationStatus:
        """Test data provider connection"""
        try:
            # Mock connection test
            response_time = np.random.uniform(200, 800)
            connection_success = np.random.random() > 0.05  # 95% success rate
            
            status = ConnectionStatus.CONNECTED if connection_success else ConnectionStatus.ERROR
            
            return IntegrationStatus(
                provider=provider,
                integration_type=IntegrationType.DATA_PROVIDER,
                status=status,
                uptime_percentage=np.random.uniform(98, 99.9),
                avg_response_time_ms=response_time,
                error_rate=np.random.uniform(0.005, 0.02),
                requests_per_minute=120,  # Mock rate limit
                requests_remaining=np.random.randint(80, 120),
                authenticated=connection_success,
                last_success=datetime.now(timezone.utc) if connection_success else None,
                error_message=None if connection_success else "Connection timeout"
            )
            
        except Exception as e:
            logger.error(f"Provider connection test failed for {provider}: {e}")
            raise
    
    async def _background_monitoring(self):
        """Background monitoring and health checks"""
        while True:
            try:
                await self._health_check_integrations()
                await self._detect_arbitrage_opportunities()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Background monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _health_check_integrations(self):
        """Perform health checks on all integrations"""
        try:
            current_time = datetime.now(timezone.utc)
            
            for provider, status in self.connection_status.items():
                # Simulate health check
                if np.random.random() < 0.95:  # 95% uptime simulation
                    status.status = ConnectionStatus.CONNECTED
                    status.last_success = current_time
                else:
                    status.status = ConnectionStatus.ERROR
                    status.error_message = "Health check failed"
                    status.last_error = current_time
                    
        except Exception as e:
            logger.error(f"Health check failed: {e}")
    
    async def _detect_arbitrage_opportunities(self):
        """Detect arbitrage opportunities across sportsbooks"""
        try:
            # This would analyze odds from multiple sportsbooks to find arbitrage
            # For now, just mock the detection
            pass
        except Exception as e:
            logger.error(f"Arbitrage detection failed: {e}")
    
    async def get_sportsbook_odds(self, request: SportsbookOddsRequest) -> IntegrationResponse:
        """
        Get odds from a specific sportsbook
        """
        try:
            request_id = str(uuid.uuid4())
            start_time = time.time()
            
            # Check connection status
            status = self.connection_status.get(request.sportsbook)
            if not status or status.status != ConnectionStatus.CONNECTED:
                raise Exception(f"Sportsbook {request.sportsbook} not available")
            
            # Route to appropriate sportsbook API
            if request.sportsbook == Sportsbook.BETMGM and self.legacy_betmgm:
                odds_data = await self._get_betmgm_odds(request)
            elif request.sportsbook == Sportsbook.DRAFTKINGS and self.legacy_draftkings:
                odds_data = await self._get_draftkings_odds(request)
            else:
                odds_data = await self._get_mock_sportsbook_odds(request)
            
            response_time = (time.time() - start_time) * 1000
            
            return IntegrationResponse(
                request_id=request_id,
                integration_type=IntegrationType.SPORTSBOOK,
                provider=request.sportsbook,
                sportsbook_odds=odds_data,
                success=True,
                status_code=200,
                response_time_ms=response_time,
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Get sportsbook odds failed: {e}")
            raise
    
    async def _get_betmgm_odds(self, request: SportsbookOddsRequest) -> List[SportsbookOdds]:
        """Get odds from BetMGM"""
        # Would integrate with actual BetMGM API
        return await self._get_mock_sportsbook_odds(request)
    
    async def _get_draftkings_odds(self, request: SportsbookOddsRequest) -> List[SportsbookOdds]:
        """Get odds from DraftKings"""
        # Would integrate with actual DraftKings API
        return await self._get_mock_sportsbook_odds(request)
    
    async def _get_mock_sportsbook_odds(self, request: SportsbookOddsRequest) -> List[SportsbookOdds]:
        """Mock sportsbook odds for demonstration"""
        try:
            odds_list = []
            
            # Generate sample odds
            for i in range(np.random.randint(1, 5)):
                game_time = datetime.now(timezone.utc) + timedelta(hours=np.random.randint(1, 48))
                
                odds = SportsbookOdds(
                    sportsbook=request.sportsbook,
                    game_id=f"{request.sport}_game_{i+1}",
                    sport=request.sport,
                    home_team="Home Team",
                    away_team="Away Team", 
                    game_time=game_time,
                    market_type=MarketType.MONEYLINE,
                    home_odds=np.random.randint(-200, +200),
                    away_odds=np.random.randint(-200, +200),
                    min_bet=Decimal("10.00"),
                    max_bet=Decimal("5000.00"),
                    last_updated=datetime.now(timezone.utc)
                )
                
                odds_list.append(odds)
            
            return odds_list
            
        except Exception as e:
            logger.error(f"Mock sportsbook odds failed: {e}")
            return []
    
    async def get_external_data(self, request: ExternalDataRequest) -> IntegrationResponse:
        """
        Get data from external provider
        """
        try:
            request_id = str(uuid.uuid4())
            start_time = time.time()
            
            # Check connection status
            status = self.connection_status.get(request.provider)
            if not status or status.status != ConnectionStatus.CONNECTED:
                raise Exception(f"Provider {request.provider} not available")
            
            # Route to appropriate provider API
            if request.provider == ExternalProvider.SPORTRADAR and self.legacy_sportradar:
                data = await self._get_sportradar_data(request)
            else:
                data = await self._get_mock_external_data(request)
            
            response_time = (time.time() - start_time) * 1000
            
            return IntegrationResponse(
                request_id=request_id,
                integration_type=IntegrationType.DATA_PROVIDER,
                provider=request.provider,
                external_data=data,
                success=True,
                status_code=200,
                response_time_ms=response_time,
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Get external data failed: {e}")
            raise
    
    async def _get_sportradar_data(self, request: ExternalDataRequest) -> ExternalDataResponse:
        """Get data from Sportradar"""
        # Would integrate with actual Sportradar API
        return await self._get_mock_external_data(request)
    
    async def _get_mock_external_data(self, request: ExternalDataRequest) -> ExternalDataResponse:
        """Mock external data for demonstration"""
        try:
            # Generate mock data based on request
            mock_data = {
                "sport": request.sport,
                "data_type": request.data_type,
                "records": []
            }
            
            # Add sample records
            for i in range(np.random.randint(10, 50)):
                mock_data["records"].append({
                    "id": f"record_{i+1}",
                    "value": np.random.uniform(10, 100),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            return ExternalDataResponse(
                provider=request.provider,
                data_type=request.data_type,
                sport=request.sport,
                data=mock_data,
                records_count=len(mock_data["records"]),
                request_id=str(uuid.uuid4()),
                response_time_ms=np.random.uniform(100, 500),
                generated_at=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Mock external data failed: {e}")
            raise
    
    async def authenticate_provider(self, provider: str, credentials: Dict[str, str]) -> AuthenticationResult:
        """
        Authenticate with external provider
        """
        try:
            # Mock authentication - would use actual OAuth/API key flows
            success = np.random.random() > 0.1  # 90% success rate
            
            if success:
                token = f"token_{uuid.uuid4().hex[:16]}"
                expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
                
                # Store token
                self.auth_tokens[provider] = {
                    "token": token,
                    "expires_at": expires_at
                }
                
                return AuthenticationResult(
                    provider=provider,
                    authenticated=True,
                    token=token,
                    expires_at=expires_at,
                    scopes=["read", "write"]
                )
            else:
                return AuthenticationResult(
                    provider=provider,
                    authenticated=False,
                    error="Invalid credentials"
                )
                
        except Exception as e:
            logger.error(f"Authentication failed for {provider}: {e}")
            return AuthenticationResult(
                provider=provider,
                authenticated=False,
                error=str(e)
            )
    
    async def find_arbitrage_opportunities(self, sport: Sport, market_type: MarketType) -> List[ArbitrageOpportunity]:
        """
        Find arbitrage opportunities across sportsbooks
        """
        try:
            opportunities = []
            
            # Mock arbitrage detection
            for i in range(np.random.randint(0, 3)):
                game_time = datetime.now(timezone.utc) + timedelta(hours=np.random.randint(1, 24))
                
                # Generate arbitrage scenario
                odds_a = np.random.randint(-150, +150)
                odds_b = np.random.randint(-150, +150)
                
                # Calculate if this is actually arbitrage (simplified)
                implied_prob_a = self._odds_to_probability(odds_a)
                implied_prob_b = self._odds_to_probability(-odds_b)  # Opposite side
                
                total_implied = implied_prob_a + implied_prob_b
                
                if total_implied < 1.0:  # True arbitrage
                    arbitrage_pct = (1.0 - total_implied) * 100
                    
                    # Calculate stakes for $1000 total
                    total_stake = Decimal("1000.00")
                    stake_a = total_stake * Decimal(str(implied_prob_b))
                    stake_b = total_stake * Decimal(str(implied_prob_a))
                    
                    profit = total_stake * Decimal(str(arbitrage_pct / 100))
                    
                    opportunity = ArbitrageOpportunity(
                        opportunity_id=str(uuid.uuid4()),
                        sport=sport,
                        game_id=f"{sport}_game_{i+1}",
                        home_team="Team A",
                        away_team="Team B",
                        game_time=game_time,
                        market_type=market_type,
                        sportsbook_a=Sportsbook.BETMGM,
                        sportsbook_b=Sportsbook.DRAFTKINGS,
                        odds_a=odds_a,
                        odds_b=odds_b,
                        arbitrage_percentage=arbitrage_pct,
                        stake_a=stake_a,
                        stake_b=stake_b,
                        total_stake=total_stake,
                        guaranteed_profit=profit,
                        confidence_score=np.random.uniform(0.8, 0.95),
                        time_to_expire=np.random.randint(300, 3600),  # 5 minutes to 1 hour
                        detected_at=datetime.now(timezone.utc),
                        expires_at=datetime.now(timezone.utc) + timedelta(seconds=np.random.randint(300, 3600))
                    )
                    
                    opportunities.append(opportunity)
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Find arbitrage opportunities failed: {e}")
            return []
    
    def _odds_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)
    
    async def get_integration_status(self, provider: Optional[str] = None) -> List[IntegrationStatus]:
        """
        Get integration status for all or specific provider
        """
        try:
            if provider:
                status = self.connection_status.get(provider)
                return [status] if status else []
            else:
                return list(self.connection_status.values())
                
        except Exception as e:
            logger.error(f"Get integration status failed: {e}")
            return []
    
    async def health_check(self) -> HealthResponse:
        """
        Check integration service health
        """
        try:
            uptime = (datetime.now(timezone.utc) - self.service_start_time).total_seconds()
            
            # Calculate metrics
            total_integrations = len(self.connection_status)
            online_integrations = sum(
                1 for status in self.connection_status.values()
                if status.status == ConnectionStatus.CONNECTED
            )
            
            # Calculate average response time
            all_response_times = [
                status.avg_response_time_ms 
                for status in self.connection_status.values()
                if status.avg_response_time_ms > 0
            ]
            avg_response_time = np.mean(all_response_times) if all_response_times else 0.0
            
            # Calculate error rate
            error_rates = [
                status.error_rate 
                for status in self.connection_status.values()
            ]
            overall_error_rate = np.mean(error_rates) * 100 if error_rates else 0.0
            
            # Count rate limits
            rate_limits_active = sum(
                1 for status in self.connection_status.values()
                if status.status == ConnectionStatus.RATE_LIMITED
            )
            
            # Integration status summary
            integration_status = {
                provider: status.status.value
                for provider, status in self.connection_status.items()
            }
            
            return HealthResponse(
                status="healthy" if self.is_initialized else "initializing",
                integrations_online=online_integrations,
                integrations_total=total_integrations,
                avg_response_time_ms=avg_response_time,
                total_requests_last_hour=sum(len(metrics) for metrics in self.request_metrics.values()),
                error_rate_percentage=overall_error_rate,
                rate_limits_active=rate_limits_active,
                last_authentication=max(
                    (status.last_success for status in self.connection_status.values() 
                     if status.last_success), 
                    default=None
                ),
                uptime_seconds=uptime,
                integration_status=integration_status
            )
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return HealthResponse(
                status="unhealthy",
                integrations_online=0,
                integrations_total=0,
                avg_response_time_ms=0.0,
                total_requests_last_hour=0,
                error_rate_percentage=100.0,
                rate_limits_active=0,
                uptime_seconds=0.0
            )
    
    # Webhook handling methods
    async def register_webhook(self, request: WebhookRequest) -> bool:
        """Register webhook with provider"""
        try:
            # Mock webhook registration
            logger.info(f"Registering webhook for {request.provider}: {request.callback_url}")
            return True
        except Exception as e:
            logger.error(f"Webhook registration failed: {e}")
            return False
    
    async def process_webhook_event(self, provider: str, event_data: Dict[str, Any]) -> WebhookEvent:
        """Process incoming webhook event"""
        try:
            event = WebhookEvent(
                event_id=str(uuid.uuid4()),
                provider=provider,
                event_type=event_data.get("type", "unknown"),
                payload=event_data,
                occurred_at=datetime.fromisoformat(event_data.get("timestamp", datetime.now(timezone.utc).isoformat())),
                received_at=datetime.now(timezone.utc)
            )
            
            # Process event based on type
            await self._handle_webhook_event(event)
            
            return event
            
        except Exception as e:
            logger.error(f"Webhook event processing failed: {e}")
            raise
    
    async def _handle_webhook_event(self, event: WebhookEvent):
        """Handle processed webhook event"""
        try:
            # Route event to appropriate handler
            if event.event_type == "odds_update":
                await self._handle_odds_update(event)
            elif event.event_type == "game_status_change":
                await self._handle_game_status_change(event)
            # Add more event type handlers as needed
            
        except Exception as e:
            logger.error(f"Webhook event handling failed: {e}")
    
    async def _handle_odds_update(self, event: WebhookEvent):
        """Handle odds update webhook event"""
        try:
            # Update cached odds, trigger alerts, etc.
            logger.info(f"Processing odds update from {event.provider}")
        except Exception as e:
            logger.error(f"Odds update handling failed: {e}")
    
    async def _handle_game_status_change(self, event: WebhookEvent):
        """Handle game status change webhook event"""
        try:
            # Update game status, notify users, etc.
            logger.info(f"Processing game status change from {event.provider}")
        except Exception as e:
            logger.error(f"Game status change handling failed: {e}")
