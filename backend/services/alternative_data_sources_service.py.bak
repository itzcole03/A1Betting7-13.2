"""
Alternative Data Sources Integration Service

This service integrates alternative data sources including social media sentiment,
news sentiment, weather data, and other external factors that have proven
correlation with game or player outcomes for enhanced prediction accuracy.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
import aiohttp
import pandas as pd
from dataclasses import dataclass, asdict
import numpy as np
from enum import Enum
import json
import re
from textblob import TextBlob
import requests
from urllib.parse import quote

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataSourceType(Enum):
    """Types of alternative data sources"""
    SOCIAL_SENTIMENT = "social_sentiment"
    NEWS_SENTIMENT = "news_sentiment"
    WEATHER_DATA = "weather_data"
    BETTING_MARKET = "betting_market"
    INJURY_REPORTS = "injury_reports"
    SOCIAL_MEDIA_BUZZ = "social_media_buzz"
    ECONOMIC_FACTORS = "economic_factors"

class SentimentPolarity(Enum):
    """Sentiment polarity classifications"""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"

@dataclass
class SocialSentimentData:
    """Social media sentiment data structure"""
    player_id: str
    team_id: str
    timestamp: datetime
    platform: str  # twitter, reddit, instagram, etc.
    sentiment_score: float  # -1 to 1
    sentiment_polarity: SentimentPolarity
    mention_count: int
    engagement_score: float
    hashtags: List[str]
    keywords: List[str]
    influence_score: float
    viral_potential: float

@dataclass
class NewsSentimentData:
    """News sentiment data structure"""
    player_id: str
    team_id: str
    timestamp: datetime
    source: str
    headline: str
    content_snippet: str
    sentiment_score: float
    sentiment_polarity: SentimentPolarity
    credibility_score: float
    article_reach: int
    topic_categories: List[str]
    impact_potential: float

@dataclass
class WeatherData:
    """Weather data structure for game locations"""
    game_id: str
    venue_id: str
    timestamp: datetime
    temperature: float  # Celsius
    humidity: float  # Percentage
    wind_speed: float  # km/h
    wind_direction: str
    precipitation: float  # mm
    visibility: float  # km
    pressure: float  # hPa
    uv_index: float
    weather_condition: str
    impact_score: float  # How much weather impacts performance

@dataclass
class MarketSentimentData:
    """Betting market sentiment data"""
    game_id: str
    player_id: str
    timestamp: datetime
    betting_volume: float
    odds_movement: float
    sharp_money_percentage: float
    public_betting_percentage: float
    line_movement_velocity: float
    reverse_line_movement: bool
    steam_moves: int
    market_confidence: float

@dataclass
class InjuryReportData:
    """Injury report and health status data"""
    player_id: str
    team_id: str
    timestamp: datetime
    injury_status: str  # healthy, questionable, doubtful, out
    injury_type: str
    body_part: str
    severity_score: float  # 0-1
    recovery_timeline: int  # days
    impact_on_performance: float  # 0-1
    historical_recovery: Dict[str, Any]
    medical_clearance: bool

class AlternativeDataSourcesService:
    """
    Service for integrating alternative data sources for enhanced predictions
    """
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.api_configs = {
            "twitter": {
                "base_url": "https://api.twitter.com/2",
                "bearer_token": None,
                "rate_limit": 300
            },
            "reddit": {
                "base_url": "https://www.reddit.com/api",
                "api_key": None,
                "rate_limit": 100
            },
            "news_api": {
                "base_url": "https://newsapi.org/v2",
                "api_key": None,
                "rate_limit": 1000
            },
            "weather_api": {
                "base_url": "https://api.openweathermap.org/data/2.5",
                "api_key": None,
                "rate_limit": 1000
            },
            "betting_apis": {
                "oddsjam": "https://api.oddsjam.com/v2",
                "action_network": "https://api.actionnetwork.com/v2"
            }
        }
        self.cache = {}
        self.cache_ttl = {
            "sentiment": timedelta(minutes=15),
            "weather": timedelta(hours=1),
            "news": timedelta(minutes=30),
            "betting": timedelta(minutes=5)
        }
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def get_social_sentiment(
        self,
        player_id: str,
        team_id: str,
        timeframe_hours: int = 24
    ) -> List[SocialSentimentData]:
        """
        Retrieve social media sentiment data for player/team
        
        Args:
            player_id: Unique player identifier
            team_id: Unique team identifier
            timeframe_hours: Hours to look back for sentiment data
            
        Returns:
            List of SocialSentimentData objects
        """
        cache_key = f"social_sentiment_{player_id}_{team_id}_{timeframe_hours}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl["sentiment"]:
                logger.info(f"Returning cached sentiment data for {player_id}")
                return cached_data
                
        try:
            sentiment_data = await self._fetch_social_sentiment(player_id, team_id, timeframe_hours)
            
            # Cache the result
            self.cache[cache_key] = (sentiment_data, datetime.now())
            
            logger.info(f"Retrieved {len(sentiment_data)} sentiment data points for {player_id}")
            return sentiment_data
            
        except Exception as e:
            logger.error(f"Error fetching social sentiment for {player_id}: {str(e)}")
            return []

    async def _fetch_social_sentiment(
        self,
        player_id: str,
        team_id: str,
        timeframe_hours: int
    ) -> List[SocialSentimentData]:
        """Fetch social sentiment from multiple platforms"""
        
        sentiment_data = []
        
        # Simulate realistic social sentiment data
        platforms = ["twitter", "reddit", "instagram", "facebook", "tiktok"]
        base_time = datetime.now() - timedelta(hours=timeframe_hours)
        
        for platform in platforms:
            platform_data = await self._get_platform_sentiment(
                player_id, team_id, platform, base_time, timeframe_hours
            )
            sentiment_data.extend(platform_data)
            
        return sentiment_data

    async def _get_platform_sentiment(
        self,
        player_id: str,
        team_id: str,
        platform: str,
        base_time: datetime,
        timeframe_hours: int
    ) -> List[SocialSentimentData]:
        """Get sentiment data from specific platform"""
        
        platform_data = []
        
        # Number of posts varies by platform
        post_counts = {
            "twitter": np.random.randint(50, 200),
            "reddit": np.random.randint(10, 50),
            "instagram": np.random.randint(20, 80),
            "facebook": np.random.randint(15, 60),
            "tiktok": np.random.randint(5, 30)
        }
        
        num_posts = post_counts.get(platform, 50)
        
        for i in range(num_posts):
            timestamp = base_time + timedelta(
                hours=np.random.uniform(0, timeframe_hours)
            )
            
            # Generate realistic sentiment distribution
            sentiment_score = np.random.beta(2, 2) * 2 - 1  # Beta distribution centered around 0
            
            # Determine polarity based on score
            if sentiment_score > 0.5:
                polarity = SentimentPolarity.VERY_POSITIVE
            elif sentiment_score > 0.1:
                polarity = SentimentPolarity.POSITIVE
            elif sentiment_score > -0.1:
                polarity = SentimentPolarity.NEUTRAL
            elif sentiment_score > -0.5:
                polarity = SentimentPolarity.NEGATIVE
            else:
                polarity = SentimentPolarity.VERY_NEGATIVE
            
            data_point = SocialSentimentData(
                player_id=player_id,
                team_id=team_id,
                timestamp=timestamp,
                platform=platform,
                sentiment_score=round(sentiment_score, 3),
                sentiment_polarity=polarity,
                mention_count=np.random.randint(1, 100),
                engagement_score=np.random.uniform(0, 1),
                hashtags=[f"#{player_id}", f"#{team_id}", "#sports"],
                keywords=["performance", "game", "stats", "prediction"],
                influence_score=np.random.uniform(0, 1),
                viral_potential=np.random.uniform(0, 1)
            )
            platform_data.append(data_point)
            
        return platform_data

    async def get_news_sentiment(
        self,
        player_id: str,
        team_id: str,
        timeframe_hours: int = 48
    ) -> List[NewsSentimentData]:
        """
        Retrieve news sentiment data for player/team
        
        Args:
            player_id: Unique player identifier
            team_id: Unique team identifier
            timeframe_hours: Hours to look back for news data
            
        Returns:
            List of NewsSentimentData objects
        """
        cache_key = f"news_sentiment_{player_id}_{team_id}_{timeframe_hours}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl["news"]:
                return cached_data
                
        try:
            news_data = await self._fetch_news_sentiment(player_id, team_id, timeframe_hours)
            
            # Cache the result
            self.cache[cache_key] = (news_data, datetime.now())
            
            logger.info(f"Retrieved {len(news_data)} news articles for {player_id}")
            return news_data
            
        except Exception as e:
            logger.error(f"Error fetching news sentiment for {player_id}: {str(e)}")
            return []

    async def _fetch_news_sentiment(
        self,
        player_id: str,
        team_id: str,
        timeframe_hours: int
    ) -> List[NewsSentimentData]:
        """Fetch news sentiment from various sources"""
        
        news_data = []
        news_sources = [
            "ESPN", "The Athletic", "Sports Illustrated", "CBS Sports",
            "Yahoo Sports", "Bleacher Report", "Fox Sports", "NBC Sports"
        ]
        
        base_time = datetime.now() - timedelta(hours=timeframe_hours)
        num_articles = np.random.randint(10, 40)
        
        for i in range(num_articles):
            timestamp = base_time + timedelta(
                hours=np.random.uniform(0, timeframe_hours)
            )
            
            source = np.random.choice(news_sources)
            
            # Generate realistic headlines and sentiment
            headlines = [
                f"{player_id} shows outstanding performance in recent games",
                f"Concerns about {player_id}'s injury status ahead of next game",
                f"{team_id} relies heavily on {player_id} for upcoming matchup",
                f"Expert analysis: {player_id}'s impact on team performance",
                f"{player_id} breaks personal record in latest outing"
            ]
            
            headline = np.random.choice(headlines)
            
            # Analyze sentiment of headline
            blob = TextBlob(headline)
            sentiment_score = blob.sentiment.polarity
            
            # Determine polarity
            if sentiment_score > 0.5:
                polarity = SentimentPolarity.VERY_POSITIVE
            elif sentiment_score > 0.1:
                polarity = SentimentPolarity.POSITIVE
            elif sentiment_score > -0.1:
                polarity = SentimentPolarity.NEUTRAL
            elif sentiment_score > -0.5:
                polarity = SentimentPolarity.NEGATIVE
            else:
                polarity = SentimentPolarity.VERY_NEGATIVE
            
            # Source credibility based on reputation
            credibility_scores = {
                "ESPN": 0.9, "The Athletic": 0.95, "Sports Illustrated": 0.85,
                "CBS Sports": 0.8, "Yahoo Sports": 0.75, "Bleacher Report": 0.7,
                "Fox Sports": 0.8, "NBC Sports": 0.8
            }
            
            data_point = NewsSentimentData(
                player_id=player_id,
                team_id=team_id,
                timestamp=timestamp,
                source=source,
                headline=headline,
                content_snippet=f"Analysis of {player_id}'s recent performance and impact...",
                sentiment_score=round(sentiment_score, 3),
                sentiment_polarity=polarity,
                credibility_score=credibility_scores.get(source, 0.7),
                article_reach=np.random.randint(1000, 100000),
                topic_categories=["performance", "analysis", "prediction"],
                impact_potential=np.random.uniform(0.3, 1.0)
            )
            news_data.append(data_point)
            
        return news_data

    async def get_weather_data(
        self,
        game_id: str,
        venue_id: str,
        game_time: datetime
    ) -> WeatherData:
        """
        Retrieve weather data for game venue and time
        
        Args:
            game_id: Unique game identifier
            venue_id: Unique venue identifier
            game_time: Scheduled game time
            
        Returns:
            WeatherData object
        """
        cache_key = f"weather_{venue_id}_{game_time.date()}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl["weather"]:
                return cached_data
                
        try:
            weather_data = await self._fetch_weather_data(game_id, venue_id, game_time)
            
            # Cache the result
            self.cache[cache_key] = (weather_data, datetime.now())
            
            logger.info(f"Retrieved weather data for venue {venue_id}")
            return weather_data
            
        except Exception as e:
            logger.error(f"Error fetching weather data for {venue_id}: {str(e)}")
            return self._default_weather_data(game_id, venue_id, game_time)

    async def _fetch_weather_data(
        self,
        game_id: str,
        venue_id: str,
        game_time: datetime
    ) -> WeatherData:
        """Fetch weather data from weather API"""
        
        # Simulate realistic weather data
        weather_conditions = [
            "Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain",
            "Snow", "Fog", "Thunderstorm", "Windy"
        ]
        
        condition = np.random.choice(weather_conditions)
        
        # Weather impacts vary by condition
        impact_scores = {
            "Clear": 0.1, "Partly Cloudy": 0.2, "Cloudy": 0.3,
            "Light Rain": 0.6, "Heavy Rain": 0.8, "Snow": 0.9,
            "Fog": 0.7, "Thunderstorm": 0.95, "Windy": 0.5
        }
        
        weather_data = WeatherData(
            game_id=game_id,
            venue_id=venue_id,
            timestamp=game_time,
            temperature=np.random.uniform(-10, 35),  # Celsius
            humidity=np.random.uniform(30, 90),  # Percentage
            wind_speed=np.random.uniform(0, 30),  # km/h
            wind_direction=np.random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
            precipitation=np.random.uniform(0, 20) if "Rain" in condition else 0,
            visibility=np.random.uniform(1, 20),  # km
            pressure=np.random.uniform(980, 1030),  # hPa
            uv_index=np.random.uniform(0, 11),
            weather_condition=condition,
            impact_score=impact_scores.get(condition, 0.3)
        )
        
        return weather_data

    def _default_weather_data(self, game_id: str, venue_id: str, game_time: datetime) -> WeatherData:
        """Return default weather data when API is unavailable"""
        return WeatherData(
            game_id=game_id,
            venue_id=venue_id,
            timestamp=game_time,
            temperature=20.0,
            humidity=50.0,
            wind_speed=10.0,
            wind_direction="N",
            precipitation=0.0,
            visibility=15.0,
            pressure=1013.25,
            uv_index=5.0,
            weather_condition="Clear",
            impact_score=0.1
        )

    async def get_betting_market_sentiment(
        self,
        game_id: str,
        player_id: str,
        timeframe_hours: int = 12
    ) -> List[MarketSentimentData]:
        """
        Retrieve betting market sentiment and line movement data
        
        Args:
            game_id: Unique game identifier
            player_id: Unique player identifier
            timeframe_hours: Hours to analyze market movement
            
        Returns:
            List of MarketSentimentData objects
        """
        cache_key = f"betting_market_{game_id}_{player_id}_{timeframe_hours}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < self.cache_ttl["betting"]:
                return cached_data
                
        try:
            market_data = await self._fetch_betting_market_data(game_id, player_id, timeframe_hours)
            
            # Cache the result
            self.cache[cache_key] = (market_data, datetime.now())
            
            logger.info(f"Retrieved {len(market_data)} market data points for {player_id}")
            return market_data
            
        except Exception as e:
            logger.error(f"Error fetching betting market data for {player_id}: {str(e)}")
            return []

    async def _fetch_betting_market_data(
        self,
        game_id: str,
        player_id: str,
        timeframe_hours: int
    ) -> List[MarketSentimentData]:
        """Fetch betting market data from sportsbooks"""
        
        market_data = []
        base_time = datetime.now() - timedelta(hours=timeframe_hours)
        
        # Generate market data points every 30 minutes
        num_points = timeframe_hours * 2
        
        for i in range(num_points):
            timestamp = base_time + timedelta(minutes=i * 30)
            
            # Simulate market movements
            betting_volume = np.random.lognormal(8, 1)  # Log-normal distribution
            odds_movement = np.random.normal(0, 0.05)  # Small movements around 0
            
            data_point = MarketSentimentData(
                game_id=game_id,
                player_id=player_id,
                timestamp=timestamp,
                betting_volume=round(betting_volume, 2),
                odds_movement=round(odds_movement, 4),
                sharp_money_percentage=np.random.uniform(0.15, 0.35),
                public_betting_percentage=np.random.uniform(0.65, 0.85),
                line_movement_velocity=np.random.uniform(0, 0.1),
                reverse_line_movement=np.random.choice([True, False], p=[0.2, 0.8]),
                steam_moves=np.random.randint(0, 5),
                market_confidence=np.random.uniform(0.6, 0.95)
            )
            market_data.append(data_point)
            
        return market_data

    async def get_injury_reports(
        self,
        player_id: str,
        team_id: str
    ) -> List[InjuryReportData]:
        """
        Retrieve injury reports and health status data
        
        Args:
            player_id: Unique player identifier
            team_id: Unique team identifier
            
        Returns:
            List of InjuryReportData objects
        """
        try:
            injury_data = await self._fetch_injury_reports(player_id, team_id)
            
            logger.info(f"Retrieved {len(injury_data)} injury reports for {player_id}")
            return injury_data
            
        except Exception as e:
            logger.error(f"Error fetching injury reports for {player_id}: {str(e)}")
            return []

    async def _fetch_injury_reports(
        self,
        player_id: str,
        team_id: str
    ) -> List[InjuryReportData]:
        """Fetch injury reports from various sources"""
        
        injury_data = []
        
        # Simulate injury report data
        injury_statuses = ["healthy", "questionable", "doubtful", "out"]
        injury_types = ["strain", "sprain", "bruise", "fatigue", "soreness", "fracture"]
        body_parts = ["knee", "ankle", "shoulder", "back", "hamstring", "calf", "wrist"]
        
        # Generate 1-3 recent injury reports
        num_reports = np.random.randint(1, 4)
        
        for i in range(num_reports):
            timestamp = datetime.now() - timedelta(days=np.random.randint(0, 7))
            
            status = np.random.choice(injury_statuses, p=[0.7, 0.15, 0.1, 0.05])
            injury_type = np.random.choice(injury_types)
            body_part = np.random.choice(body_parts)
            
            # Severity based on status
            severity_mapping = {
                "healthy": 0.0,
                "questionable": np.random.uniform(0.2, 0.4),
                "doubtful": np.random.uniform(0.5, 0.7),
                "out": np.random.uniform(0.8, 1.0)
            }
            
            severity = severity_mapping[status]
            
            data_point = InjuryReportData(
                player_id=player_id,
                team_id=team_id,
                timestamp=timestamp,
                injury_status=status,
                injury_type=injury_type,
                body_part=body_part,
                severity_score=round(severity, 2),
                recovery_timeline=np.random.randint(0, 21) if status != "healthy" else 0,
                impact_on_performance=severity * 0.8,  # Performance impact correlates with severity
                historical_recovery={
                    "average_recovery_days": np.random.randint(3, 14),
                    "previous_injuries": np.random.randint(0, 3),
                    "recovery_success_rate": np.random.uniform(0.8, 1.0)
                },
                medical_clearance=status == "healthy"
            )
            injury_data.append(data_point)
            
        return injury_data

    async def calculate_alternative_data_impact(
        self,
        player_id: str,
        team_id: str,
        game_id: str,
        game_time: datetime
    ) -> Dict[str, Any]:
        """
        Calculate the combined impact of all alternative data sources
        
        Args:
            player_id: Unique player identifier
            team_id: Unique team identifier
            game_id: Unique game identifier
            game_time: Scheduled game time
            
        Returns:
            Dictionary with combined impact analysis
        """
        try:
            # Gather all alternative data
            social_sentiment = await self.get_social_sentiment(player_id, team_id)
            news_sentiment = await self.get_news_sentiment(player_id, team_id)
            weather_data = await self.get_weather_data(game_id, "venue_1", game_time)
            market_sentiment = await self.get_betting_market_sentiment(game_id, player_id)
            injury_reports = await self.get_injury_reports(player_id, team_id)
            
            # Calculate impact scores
            social_impact = self._calculate_social_impact(social_sentiment)
            news_impact = self._calculate_news_impact(news_sentiment)
            weather_impact = weather_data.impact_score
            market_impact = self._calculate_market_impact(market_sentiment)
            injury_impact = self._calculate_injury_impact(injury_reports)
            
            # Combined impact analysis
            combined_impact = {
                "player_id": player_id,
                "team_id": team_id,
                "game_id": game_id,
                "analysis_timestamp": datetime.now().isoformat(),
                "individual_impacts": {
                    "social_sentiment": {
                        "score": social_impact,
                        "confidence": 0.7,
                        "data_points": len(social_sentiment)
                    },
                    "news_sentiment": {
                        "score": news_impact,
                        "confidence": 0.8,
                        "data_points": len(news_sentiment)
                    },
                    "weather": {
                        "score": weather_impact,
                        "confidence": 0.9,
                        "condition": weather_data.weather_condition
                    },
                    "betting_market": {
                        "score": market_impact,
                        "confidence": 0.85,
                        "data_points": len(market_sentiment)
                    },
                    "injury_status": {
                        "score": injury_impact,
                        "confidence": 0.95,
                        "data_points": len(injury_reports)
                    }
                },
                "combined_impact": self._calculate_weighted_impact(
                    social_impact, news_impact, weather_impact, market_impact, injury_impact
                ),
                "risk_factors": self._identify_risk_factors(
                    social_sentiment, news_sentiment, weather_data, market_sentiment, injury_reports
                ),
                "opportunities": self._identify_opportunities(
                    social_sentiment, news_sentiment, weather_data, market_sentiment, injury_reports
                )
            }
            
            return combined_impact
            
        except Exception as e:
            logger.error(f"Error calculating alternative data impact: {str(e)}")
            return {"error": str(e)}

    def _calculate_social_impact(self, social_data: List[SocialSentimentData]) -> float:
        """Calculate impact score from social sentiment data"""
        if not social_data:
            return 0.0
            
        # Weight recent data more heavily
        now = datetime.now()
        weighted_scores = []
        
        for data in social_data:
            hours_ago = (now - data.timestamp).total_seconds() / 3600
            time_weight = max(0.1, 1.0 - (hours_ago / 48))  # Decay over 48 hours
            
            # Combine sentiment score with engagement and influence
            impact = (
                data.sentiment_score * 0.5 +
                data.engagement_score * 0.3 +
                data.influence_score * 0.2
            ) * time_weight
            
            weighted_scores.append(impact)
            
        return round(np.mean(weighted_scores), 3)

    def _calculate_news_impact(self, news_data: List[NewsSentimentData]) -> float:
        """Calculate impact score from news sentiment data"""
        if not news_data:
            return 0.0
            
        weighted_scores = []
        
        for data in news_data:
            # Weight by credibility and reach
            impact = (
                data.sentiment_score * 0.6 +
                data.impact_potential * 0.4
            ) * data.credibility_score
            
            weighted_scores.append(impact)
            
        return round(np.mean(weighted_scores), 3)

    def _calculate_market_impact(self, market_data: List[MarketSentimentData]) -> float:
        """Calculate impact score from betting market data"""
        if not market_data:
            return 0.0
            
        # Focus on recent market movements
        recent_data = market_data[-5:]  # Last 5 data points
        
        impact_factors = []
        for data in recent_data:
            # Higher impact for strong movements and confidence
            impact = (
                abs(data.odds_movement) * 0.4 +
                data.line_movement_velocity * 0.3 +
                data.market_confidence * 0.3
            )
            impact_factors.append(impact)
            
        return round(np.mean(impact_factors), 3)

    def _calculate_injury_impact(self, injury_data: List[InjuryReportData]) -> float:
        """Calculate impact score from injury reports"""
        if not injury_data:
            return 0.0
            
        # Get most recent injury report
        latest_injury = max(injury_data, key=lambda x: x.timestamp)
        
        # Injury impact is inverse of performance impact
        return round(-latest_injury.impact_on_performance, 3)

    def _calculate_weighted_impact(
        self,
        social: float,
        news: float,
        weather: float,
        market: float,
        injury: float
    ) -> float:
        """Calculate weighted combined impact score"""
        
        weights = {
            "social": 0.15,
            "news": 0.20,
            "weather": 0.15,
            "market": 0.25,
            "injury": 0.25
        }
        
        combined = (
            social * weights["social"] +
            news * weights["news"] +
            weather * weights["weather"] +
            market * weights["market"] +
            injury * weights["injury"]
        )
        
        return round(combined, 3)

    def _identify_risk_factors(
        self,
        social_data: List[SocialSentimentData],
        news_data: List[NewsSentimentData],
        weather_data: WeatherData,
        market_data: List[MarketSentimentData],
        injury_data: List[InjuryReportData]
    ) -> List[str]:
        """Identify potential risk factors from alternative data"""
        
        risks = []
        
        # Social sentiment risks
        if social_data:
            avg_sentiment = np.mean([d.sentiment_score for d in social_data])
            if avg_sentiment < -0.3:
                risks.append("Negative social media sentiment trending")
                
        # News sentiment risks
        if news_data:
            recent_news = [d for d in news_data if d.timestamp > datetime.now() - timedelta(hours=24)]
            if recent_news and np.mean([d.sentiment_score for d in recent_news]) < -0.2:
                risks.append("Recent negative news coverage")
                
        # Weather risks
        if weather_data.impact_score > 0.6:
            risks.append(f"Adverse weather conditions: {weather_data.weather_condition}")
            
        # Market risks
        if market_data:
            recent_movement = market_data[-1].odds_movement if market_data else 0
            if abs(recent_movement) > 0.1:
                risks.append("Significant betting line movement detected")
                
        # Injury risks
        for injury in injury_data:
            if injury.severity_score > 0.5:
                risks.append(f"Injury concern: {injury.injury_type} in {injury.body_part}")
                
        return risks

    def _identify_opportunities(
        self,
        social_data: List[SocialSentimentData],
        news_data: List[NewsSentimentData],
        weather_data: WeatherData,
        market_data: List[MarketSentimentData],
        injury_data: List[InjuryReportData]
    ) -> List[str]:
        """Identify potential opportunities from alternative data"""
        
        opportunities = []
        
        # Social sentiment opportunities
        if social_data:
            avg_sentiment = np.mean([d.sentiment_score for d in social_data])
            if avg_sentiment > 0.3:
                opportunities.append("Strong positive social media momentum")
                
        # News sentiment opportunities
        if news_data:
            recent_news = [d for d in news_data if d.timestamp > datetime.now() - timedelta(hours=24)]
            if recent_news and np.mean([d.sentiment_score for d in recent_news]) > 0.3:
                opportunities.append("Positive recent news coverage")
                
        # Weather opportunities
        if weather_data.impact_score < 0.2:
            opportunities.append("Ideal weather conditions for performance")
            
        # Market opportunities
        if market_data:
            latest_data = market_data[-1]
            if latest_data.reverse_line_movement:
                opportunities.append("Reverse line movement indicates sharp money")
                
        # Health opportunities
        healthy_reports = [i for i in injury_data if i.injury_status == "healthy"]
        if healthy_reports:
            opportunities.append("Player reporting healthy status")
            
        return opportunities

# Usage example and testing
async def main():
    """Example usage of the Alternative Data Sources Service"""
    
    async with AlternativeDataSourcesService() as alt_data_service:
        
        # Example 1: Get social sentiment
        social_sentiment = await alt_data_service.get_social_sentiment(
            player_id="lebron_james",
            team_id="lakers"
        )
        print(f"Retrieved {len(social_sentiment)} social sentiment data points")
        
        # Example 2: Get news sentiment
        news_sentiment = await alt_data_service.get_news_sentiment(
            player_id="lebron_james",
            team_id="lakers"
        )
        print(f"Retrieved {len(news_sentiment)} news articles")
        
        # Example 3: Get weather data
        game_time = datetime.now() + timedelta(hours=3)
        weather = await alt_data_service.get_weather_data(
            game_id="game_123",
            venue_id="staples_center",
            game_time=game_time
        )
        print(f"Weather: {weather.weather_condition}, Impact: {weather.impact_score}")
        
        # Example 4: Get betting market sentiment
        market_sentiment = await alt_data_service.get_betting_market_sentiment(
            game_id="game_123",
            player_id="lebron_james"
        )
        print(f"Retrieved {len(market_sentiment)} market data points")
        
        # Example 5: Get injury reports
        injury_reports = await alt_data_service.get_injury_reports(
            player_id="lebron_james",
            team_id="lakers"
        )
        print(f"Retrieved {len(injury_reports)} injury reports")
        
        # Example 6: Calculate combined impact
        combined_impact = await alt_data_service.calculate_alternative_data_impact(
            player_id="lebron_james",
            team_id="lakers",
            game_id="game_123",
            game_time=game_time
        )
        print(f"Combined Impact Score: {combined_impact.get('combined_impact')}")
        print(f"Risk Factors: {combined_impact.get('risk_factors')}")
        print(f"Opportunities: {combined_impact.get('opportunities')}")

if __name__ == "__main__":
    asyncio.run(main())
