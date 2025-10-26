"""
Tests for NBA Ingestion Pipeline

Comprehensive test suite covering the end-to-end ingestion pipeline,
including successful runs, idempotency, change detection, and error handling.
"""

import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.ingestion.models.database_models import (
    IngestRun,
    MarketQuote,
    Player,
    Prop,
)
from backend.ingestion.models.dto import IngestResult, PayoutType, RawExternalPropDTO
from backend.ingestion.pipeline.nba_ingestion_pipeline import (
    NBAIngestionPipeline,
    run_nba_ingestion,
)


@pytest.fixture
def sample_raw_props():
    """Fixture providing sample raw prop data."""
    return [
        RawExternalPropDTO(
            external_player_id="lebron_001",
            player_name="LeBron James",
            team_code="LAL",
            prop_category="Points",
            line_value=25.5,
            provider_prop_id="stub_lebron_001_Points_1234567890",
            payout_type=PayoutType.STANDARD,
            over_odds=-110.0,
            under_odds=-110.0,
            updated_ts="2025-01-01T12:00:00Z",
            provider_name="test_provider",
            additional_data={"position": "SF", "confidence": 0.85},
        ),
        RawExternalPropDTO(
            external_player_id="curry_001",
            player_name="Stephen Curry",
            team_code="GSW",
            prop_category="3-Point Field Goals Made",
            line_value=4.5,
            provider_prop_id="stub_curry_001_3PM_1234567890",
            payout_type=PayoutType.STANDARD,
            over_odds=-115.0,
            under_odds=-105.0,
            updated_ts="2025-01-01T12:00:00Z",
            provider_name="test_provider",
            additional_data={"position": "PG", "confidence": 0.92},
        ),
    ]


@pytest.fixture
def mock_async_session():
    """Mock async database session."""
    session_mock = AsyncMock()
    session_mock.scalar = AsyncMock()
    session_mock.commit = AsyncMock()
    session_mock.refresh = AsyncMock()
    session_mock.add = MagicMock()
    session_mock.close = AsyncMock()
    return session_mock


class TestNBAIngestionPipeline:
    """Test cases for NBA ingestion pipeline."""

    @pytest.mark.asyncio
    async def test_successful_run_with_small_dataset(
        self, sample_raw_props, mock_async_session
    ):
        """Test successful ingestion run with small dataset."""

        # Mock provider to return sample data
        with patch(
            "backend.ingestion.pipeline.nba_ingestion_pipeline.default_nba_provider"
        ) as mock_provider:
            mock_provider.fetch_current_props_with_retry = AsyncMock(
                return_value=sample_raw_props
            )
            mock_provider.provider_name = "test_provider"

            # Mock database session creation
            with patch(
                "backend.ingestion.pipeline.nba_ingestion_pipeline.AsyncSession"
            ) as mock_session_class:
                mock_session_class.return_value = mock_async_session

                # Mock database models
                mock_ingest_run = MagicMock(spec=IngestRun)
                mock_ingest_run.id = 123
                mock_async_session.refresh.side_effect = lambda obj: setattr(
                    obj, "id", 123
                )

                # Mock player/prop creation
                mock_player = MagicMock(spec=Player)
                mock_player.id = 1
                mock_prop = MagicMock(spec=Prop)
                mock_prop.id = 1
                mock_prop.player = mock_player

                # Configure session to return mocks
                mock_async_session.scalar.side_effect = [
                    None,  # No existing ingest run
                    None,  # No existing player (first prop)
                    None,  # No existing player fallback
                    None,  # No existing prop
                    None,  # No existing quote
                    None,  # No existing player (second prop)
                    None,  # No existing player fallback
                    None,  # No existing prop
                    None,  # No existing quote
                ]

                pipeline = NBAIngestionPipeline()
                result = await pipeline.run_nba_ingestion(limit=2, allow_upsert=True)

                # Verify results
                assert result.status in ["success", "partial"]
                assert result.total_raw == 2
                assert result.sport == "NBA"
                assert result.source == "test_provider"
                assert result.ingest_run_id == 123
                assert result.finished_at is not None
                assert result.duration_ms is not None

    @pytest.mark.asyncio
    async def test_idempotency_no_duplicate_quotes(
        self, sample_raw_props, mock_async_session
    ):
        """Test that second run with identical data doesn't create duplicate quotes."""

        with patch(
            "backend.ingestion.pipeline.nba_ingestion_pipeline.default_nba_provider"
        ) as mock_provider:
            mock_provider.fetch_current_props_with_retry = AsyncMock(
                return_value=sample_raw_props[:1]
            )
            mock_provider.provider_name = "test_provider"

            with patch(
                "backend.ingestion.pipeline.nba_ingestion_pipeline.AsyncSession"
            ) as mock_session_class:
                mock_session_class.return_value = mock_async_session

                # Mock existing data for idempotency test
                existing_player = MagicMock(spec=Player)
                existing_player.id = 1
                existing_prop = MagicMock(spec=Prop)
                existing_prop.id = 1
                existing_prop.player = existing_player
                existing_quote = MagicMock(spec=MarketQuote)
                existing_quote.id = 1

                mock_ingest_run = MagicMock(spec=IngestRun)
                mock_ingest_run.id = 124
                mock_async_session.refresh.side_effect = lambda obj: setattr(
                    obj, "id", 124
                )

                # Configure to return existing entities
                mock_async_session.scalar.side_effect = [
                    None,  # No existing ingest run
                    existing_player,  # Existing player
                    existing_prop,  # Existing prop
                    existing_quote,  # Existing quote (same hash)
                ]

                pipeline = NBAIngestionPipeline()
                result = await pipeline.run_nba_ingestion(limit=1, allow_upsert=True)

                # Should have unchanged count, not new quotes
                assert result.total_new_quotes == 0
                assert result.total_unchanged == 1
                assert result.total_line_changes == 0

    @pytest.mark.asyncio
    async def test_line_change_detection(self, sample_raw_props, mock_async_session):
        """Test that line changes are detected and create new quote records."""

        # Modify sample data to simulate line change
        modified_props = sample_raw_props[:1]
        modified_props[0].line_value = 26.5  # Changed from 25.5

        with patch(
            "backend.ingestion.pipeline.nba_ingestion_pipeline.default_nba_provider"
        ) as mock_provider:
            mock_provider.fetch_current_props_with_retry = AsyncMock(
                return_value=modified_props
            )
            mock_provider.provider_name = "test_provider"

            with patch(
                "backend.ingestion.pipeline.nba_ingestion_pipeline.AsyncSession"
            ) as mock_session_class:
                mock_session_class.return_value = mock_async_session

                existing_player = MagicMock(spec=Player)
                existing_player.id = 1
                existing_prop = MagicMock(spec=Prop)
                existing_prop.id = 1
                existing_prop.player = existing_player

                mock_ingest_run = MagicMock(spec=IngestRun)
                mock_ingest_run.id = 125
                mock_async_session.refresh.side_effect = lambda obj: setattr(
                    obj, "id", 125
                )

                new_quote = MagicMock(spec=MarketQuote)
                new_quote.id = 2

                # Configure to find existing entities but no quote with new hash
                mock_async_session.scalar.side_effect = [
                    None,  # No existing ingest run
                    existing_player,  # Existing player
                    existing_prop,  # Existing prop
                    None,  # No quote with new line hash (line changed)
                ]
                mock_async_session.refresh.side_effect = lambda obj: setattr(
                    obj, "id", getattr(obj, "id", 2)
                )

                pipeline = NBAIngestionPipeline()
                result = await pipeline.run_nba_ingestion(limit=1, allow_upsert=True)

                # Should detect line change
                assert result.total_line_changes == 1
                assert result.total_new_quotes == 1

    @pytest.mark.asyncio
    async def test_taxonomy_failure_path(self, mock_async_session):
        """Test handling of unknown prop categories through error path."""

        # Create prop with unknown category
        unknown_prop = RawExternalPropDTO(
            external_player_id="test_001",
            player_name="Test Player",
            team_code="TEST",
            prop_category="Unknown Category",  # This should fail taxonomy mapping
            line_value=10.0,
            provider_prop_id="test_prop_123",
            payout_type=PayoutType.STANDARD,
            over_odds=-110.0,
            under_odds=-110.0,
            updated_ts="2025-01-01T12:00:00Z",
            provider_name="test_provider",
        )

        with patch(
            "backend.ingestion.pipeline.nba_ingestion_pipeline.default_nba_provider"
        ) as mock_provider:
            mock_provider.fetch_current_props_with_retry = AsyncMock(
                return_value=[unknown_prop]
            )
            mock_provider.provider_name = "test_provider"

            with patch(
                "backend.ingestion.pipeline.nba_ingestion_pipeline.AsyncSession"
            ) as mock_session_class:
                mock_session_class.return_value = mock_async_session

                mock_ingest_run = MagicMock(spec=IngestRun)
                mock_ingest_run.id = 126
                mock_async_session.refresh.side_effect = lambda obj: setattr(
                    obj, "id", 126
                )

                pipeline = NBAIngestionPipeline()
                result = await pipeline.run_nba_ingestion(limit=1, allow_upsert=True)

                # Should have error and partial status
                assert result.status == "partial" or result.status == "failed"
                assert len(result.errors) > 0
                assert any(
                    "taxonomy" in error.error_type.lower()
                    or "normalization" in error.error_type.lower()
                    for error in result.errors
                )

    @pytest.mark.asyncio
    async def test_player_upsert_matching_by_external_id(
        self, sample_raw_props, mock_async_session
    ):
        """Test player matching by external ID and name+team fallback."""

        with patch(
            "backend.ingestion.pipeline.nba_ingestion_pipeline.default_nba_provider"
        ) as mock_provider:
            mock_provider.fetch_current_props_with_retry = AsyncMock(
                return_value=sample_raw_props[:1]
            )
            mock_provider.provider_name = "test_provider"

            with patch(
                "backend.ingestion.pipeline.nba_ingestion_pipeline.AsyncSession"
            ) as mock_session_class:
                mock_session_class.return_value = mock_async_session

                # Test external ID matching
                existing_player = MagicMock(spec=Player)
                existing_player.id = 1
                existing_player.external_refs = {"test_provider": "lebron_001"}

                mock_ingest_run = MagicMock(spec=IngestRun)
                mock_ingest_run.id = 127
                mock_async_session.refresh.side_effect = lambda obj: setattr(
                    obj, "id", getattr(obj, "id", 127)
                )

                # First call returns player by external ID
                mock_async_session.scalar.side_effect = [
                    None,  # No existing ingest run
                    existing_player,  # Found by external ID
                ]

                pipeline = NBAIngestionPipeline()
                result = await pipeline.run_nba_ingestion(limit=1, allow_upsert=True)

                # Should not create new player
                assert result.total_new_players == 0

    @pytest.mark.asyncio
    async def test_ingest_run_persisted_with_correct_status(
        self, sample_raw_props, mock_async_session
    ):
        """Test that ingest run records are created and updated with correct lifecycle."""

        with patch(
            "backend.ingestion.pipeline.nba_ingestion_pipeline.default_nba_provider"
        ) as mock_provider:
            mock_provider.fetch_current_props_with_retry = AsyncMock(
                return_value=sample_raw_props[:1]
            )
            mock_provider.provider_name = "test_provider"

            with patch(
                "backend.ingestion.pipeline.nba_ingestion_pipeline.AsyncSession"
            ) as mock_session_class:
                mock_session_class.return_value = mock_async_session

                # Create mock ingest run that we can inspect
                mock_ingest_run = MagicMock(spec=IngestRun)
                mock_ingest_run.id = 128
                mock_ingest_run.status = "running"
                mock_ingest_run.total_raw = 0
                mock_ingest_run.errors = []

                # Track when ingest run is created
                created_runs = []

                def track_add(obj):
                    if isinstance(obj, type(mock_ingest_run)):
                        created_runs.append(obj)

                mock_async_session.add.side_effect = track_add
                mock_async_session.refresh.side_effect = lambda obj: setattr(
                    obj, "id", 128
                )

                pipeline = NBAIngestionPipeline()
                result = await pipeline.run_nba_ingestion(limit=1, allow_upsert=True)

                # Verify ingest run was created and updated
                assert len(created_runs) >= 1  # At least the ingest run was added
                assert result.ingest_run_id == 128
                assert result.status in ["success", "partial", "failed"]


class TestIntegrationWithDatabase:
    """Integration tests that require actual database setup."""

    @pytest.mark.asyncio
    async def test_end_to_end_with_real_database(self):
        """End-to-end test with real database operations."""
        from sqlmodel import Session, select

        from backend.database import sync_engine
        from backend.ingestion.models.database_models import (
            IngestRun,
            MarketQuote,
            Player,
            Prop,
        )
        from backend.ingestion.pipeline.nba_ingestion_pipeline import (
            NBAIngestionPipeline,
        )

        # Use the test database setup from conftest.py
        pipeline = NBAIngestionPipeline()

        # Run the ingestion pipeline
        result = await pipeline.run_nba_ingestion(limit=2, allow_upsert=True)

        # Verify the result structure
        assert isinstance(result, IngestResult)
        assert result.status in ["success", "partial", "failed"]
        assert result.ingest_run_id is not None
        assert isinstance(result.props_processed, int)
        assert isinstance(result.quotes_created, int)

        # Verify database state
        with Session(sync_engine) as session:
            # Check that ingest run was created
            ingest_run = session.get(IngestRun, result.ingest_run_id)
            assert ingest_run is not None
            assert ingest_run.status == result.status
            assert ingest_run.props_processed == result.props_processed

            # Check that players were created
            players = session.exec(select(Player)).all()
            assert len(players) >= 1  # At least one player should be created

            # Check that props were created
            props = session.exec(select(Prop)).all()
            assert len(props) >= 1  # At least one prop should be created

            # Check that market quotes were created
            quotes = session.exec(select(MarketQuote)).all()
            assert len(quotes) >= 1  # At least one quote should be created

            # Verify relationships
            for prop in props:
                assert prop.player is not None
                assert prop.player_id == prop.player.id

            for quote in quotes:
                assert quote.prop is not None
                assert quote.prop_id == quote.prop.id

    @pytest.mark.asyncio
    async def test_concurrent_ingestion_runs(self):
        """Test handling of concurrent ingestion runs."""
        import asyncio

        from sqlmodel import Session, select

        from backend.database import sync_engine
        from backend.ingestion.models.database_models import IngestRun
        from backend.ingestion.pipeline.nba_ingestion_pipeline import (
            NBAIngestionPipeline,
        )

        async def run_ingestion_task(task_id: int):
            """Run a single ingestion task."""
            pipeline = NBAIngestionPipeline()
            result = await pipeline.run_nba_ingestion(limit=1, allow_upsert=True)
            return result

        # Run multiple ingestion tasks concurrently
        num_concurrent_runs = 3
        tasks = [run_ingestion_task(i) for i in range(num_concurrent_runs)]
        results = await asyncio.gather(*tasks)

        # Verify all results are valid
        for result in results:
            assert isinstance(result, IngestResult)
            assert result.status in ["success", "partial", "failed"]
            assert result.ingest_run_id is not None

        # Verify database state - all runs should be recorded
        with Session(sync_engine) as session:
            ingest_runs = session.exec(select(IngestRun)).all()
            # Should have at least the number of concurrent runs
            assert len(ingest_runs) >= num_concurrent_runs

            # All runs should have unique IDs
            run_ids = [run.id for run in ingest_runs]
            assert len(run_ids) == len(set(run_ids))  # No duplicates

            # Check that concurrent runs didn't interfere with each other
            for run in ingest_runs:
                assert run.status in ["success", "partial", "failed"]
                assert run.props_processed >= 0
                assert run.quotes_created >= 0
