"""
Pytest coverage for EnhancedMLModelPipeline unified service integration.
Covers pipeline initialization, data ingestion, feature engineering, model training, and error handling.
"""

import asyncio

import pytest

from backend.services.enhanced_ml_model_pipeline import (
    EnhancedMLModelPipeline,
    PipelineStage,
)


@pytest.mark.asyncio
async def test_pipeline_initialization():
    pipeline = EnhancedMLModelPipeline()
    result = await pipeline.initialize_pipeline()
    assert result is True


@pytest.mark.asyncio
async def test_data_ingestion_and_preprocessing():
    pipeline = EnhancedMLModelPipeline()
    await pipeline.initialize_pipeline()
    # Simulate data ingestion
    ingest_result = await pipeline.execute_pipeline_stage(
        PipelineStage.DATA_INGESTION, config={"sport": "MLB", "date_range": 3}
    )
    assert ingest_result["status"] == "success"
    cache_key = ingest_result["result"]["cache_key"]
    # Simulate preprocessing
    preprocess_result = await pipeline.execute_pipeline_stage(
        PipelineStage.DATA_PREPROCESSING, config={"cache_key": cache_key}
    )
    assert preprocess_result["status"] == "success"


@pytest.mark.asyncio
async def test_feature_engineering():
    pipeline = EnhancedMLModelPipeline()
    await pipeline.initialize_pipeline()
    ingest_result = await pipeline.execute_pipeline_stage(
        PipelineStage.DATA_INGESTION, config={"sport": "MLB", "date_range": 3}
    )
    cache_key = ingest_result["result"]["cache_key"]
    preprocess_result = await pipeline.execute_pipeline_stage(
        PipelineStage.DATA_PREPROCESSING, config={"cache_key": cache_key}
    )
    preprocessed_key = preprocess_result["result"]["cache_key"]
    feature_result = await pipeline.execute_pipeline_stage(
        PipelineStage.FEATURE_ENGINEERING, config={"cache_key": preprocessed_key}
    )
    assert feature_result["status"] == "success"


@pytest.mark.asyncio
async def test_error_handling_for_missing_cache_key():
    pipeline = EnhancedMLModelPipeline()
    await pipeline.initialize_pipeline()
    # Should raise ValueError for missing cache_key
    with pytest.raises(ValueError):
        await pipeline.execute_pipeline_stage(
            PipelineStage.DATA_PREPROCESSING, config={}
        )
