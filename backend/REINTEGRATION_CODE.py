
# ============================================================================
# REINTEGRATED SERVICES - Auto-generated
# ============================================================================
# The following routers were auto-generated for previously abandoned services.
# Review and customize each router as needed.


# Enhanced Ml Model Pipeline
try:
    from backend.routes.enhanced_ml_model_pipeline_router import router as enhanced_ml_model_pipeline_router
    app.include_router(enhanced_ml_model_pipeline_router)
    logger.info("✓ Registered enhanced_ml_model_pipeline router")
except Exception as e:
    logger.warning(f"Could not register enhanced_ml_model_pipeline router: {e}")

# Enhanced Provider Statistics
try:
    from backend.routes.enhanced_provider_statistics_router import router as enhanced_provider_statistics_router
    app.include_router(enhanced_provider_statistics_router)
    logger.info("✓ Registered enhanced_provider_statistics router")
except Exception as e:
    logger.warning(f"Could not register enhanced_provider_statistics router: {e}")

# Ev Service
try:
    from backend.routes.ev_service_router import router as ev_service_router
    app.include_router(ev_service_router)
    logger.info("✓ Registered ev_service router")
except Exception as e:
    logger.warning(f"Could not register ev_service router: {e}")

# Intelligent Cache Service
try:
    from backend.routes.intelligent_cache_service_router import router as intelligent_cache_service_router
    app.include_router(intelligent_cache_service_router)
    logger.info("✓ Registered intelligent_cache_service router")
except Exception as e:
    logger.warning(f"Could not register intelligent_cache_service router: {e}")

# Modern Async Architecture
try:
    from backend.routes.modern_async_architecture_router import router as modern_async_architecture_router
    app.include_router(modern_async_architecture_router)
    logger.info("✓ Registered modern_async_architecture router")
except Exception as e:
    logger.warning(f"Could not register modern_async_architecture router: {e}")
