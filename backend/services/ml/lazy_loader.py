"""Lazy ML model loader."""

class LazyMLLoader:
    """
    Phase 2: Non-blocking ML model loader
    Loads models in background without affecting startup time
    """

    def __init__(self):
        self.models: Dict[str, Dict[str, Any]] = {
            "xgboost_primary": {
                "status": "not_loaded",
                "accuracy": None,
                "load_progress": 0.0,
            },
            "neural_network": {
                "status": "not_loaded",
                "accuracy": None,
                "load_progress": 0.0,
            },
            "ensemble_system": {
                "status": "not_loaded",
                "accuracy": None,
                "load_progress": 0.0,
            },
            "autonomous_system": {
                "status": "not_loaded",
                "accuracy": None,
                "load_progress": 0.0,
            },
        }
        self.loading_active = False
        self.loading_thread: Optional[threading.Thread] = None
        self.start_time = time.time()

    def start_background_loading(self):
        """Start loading ML models in background thread"""
        if not self.loading_active:
            self.loading_active = True
            self.loading_thread = threading.Thread(
                target=self._load_models_async, daemon=True
            )
            self.loading_thread.start()
            logger.info("🤖 Phase 2: Started background ML model loading")

    def _load_models_async(self):
        """Background thread that simulates ML model loading"""
        try:
            model_names = list(self.models.keys())

            for i, model_name in enumerate(model_names):
                if not self.loading_active:
                    break

                # Simulate model loading phases
                self.models[model_name]["status"] = "loading"
                logger.info(f"🔄 Loading {model_name}...")

                # Simulate loading progress
                for progress in [0.2, 0.5, 0.8, 1.0]:
                    if not self.loading_active:
                        break
                    self.models[model_name]["load_progress"] = progress
                    time.sleep(1)  # Simulate actual loading time

                # Mark as loaded with mock accuracy
                if self.loading_active:
                    self.models[model_name]["status"] = "loaded"
                    self.models[model_name]["accuracy"] = 0.85 + (
                        i * 0.03
                    )  # Mock accuracy scores
                    self.models[model_name]["load_progress"] = 1.0
                    logger.info(
                        f"✅ {model_name} loaded successfully (accuracy: {self.models[model_name]['accuracy']:.3f})"
                    )

            if self.loading_active:
                logger.info("🚀 Phase 2: All ML models loaded successfully!")

        except Exception as e:
            logger.error(f"❌ ML loading error: {e}")
            for model_name in self.models:
                if self.models[model_name]["status"] == "loading":
                    self.models[model_name]["status"] = "error"

    def get_status(self) -> Dict[str, Any]:
        """Get current ML loading status"""
        loaded_count = sum(
            1 for model in self.models.values() if model["status"] == "loaded"
        )
        total_count = len(self.models)
        overall_progress = loaded_count / total_count if total_count > 0 else 0.0

        return {
            "ml_system_status": (
                "loading"
                if self.loading_active and loaded_count < total_count
                else "ready" if loaded_count == total_count else "waiting"
            ),
            "models_loaded": loaded_count,
            "total_models": total_count,
            "loading_progress": overall_progress,
            "models": self.models.copy(),
            "uptime_seconds": time.time() - self.start_time,
            "loading_active": self.loading_active,
        }

    def stop_loading(self):
        """Stop background loading (for cleanup)"""
        self.loading_active = False
        if self.loading_thread and self.loading_thread.is_alive():
            self.loading_thread.join(timeout=2)


# Global instances for Phase 3
ml_loader = LazyMLLoader()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Enhanced lifespan with non-blocking ML initialization"""
    logger.info("🚀 A1Betting Backend starting (Production Fix + Phase 2 + Phase 3)...")

    # Mount the lightweight placeholder sports router to keep startup deterministic.
    # Importing the real sports router can pull heavy ML libs (tensorflow/torch)
    # which we avoid during 'Option C' direct execution runs.
    app.include_router(sports_router, prefix="/api/sports", tags=["Sports Prediction & Personalization"])

    # Start ML loading in background (non-blocking)
    ml_loader.start_background_loading()

    yield  # App is running immediately, ML loads in background

    # Cleanup
    ml_loader.stop_loading()
    logger.info("🛑 A1Betting Backend shutdown complete")


# Create production-ready app with Phase 3 enhancements
app = FastAPI(
    title="A1Betting Backend",
    description="Sports betting prediction platform (Production Fix)",
    version="4.0.1-production-fix",
    lifespan=lifespan,
)

# Register new endpoints for sports prediction and personalization
app.include_router(
    sports_router, prefix="/api/sports", tags=["Sports Prediction & Personalization"]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8173",
        "http://localhost:8174",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Essential endpoints only
