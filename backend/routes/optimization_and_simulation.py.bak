"""
Optimization and Simulation API Routes

FastAPI endpoints for triggering and inspecting portfolio optimization,
Monte Carlo simulation, and correlation analysis.

Endpoints:
- POST /optimization/portfolio - Run portfolio optimization
- GET /optimization/portfolio/{run_id} - Get optimization results
- POST /simulation/monte-carlo - Run Monte Carlo simulation
- GET /simulation/monte-carlo/{run_id} - Get simulation results
- POST /correlation/compute - Compute correlation matrix
- GET /correlation/factor-model/{model_id} - Get factor model
- GET /optimization/tasks/{task_id} - Get task status
- DELETE /cache/invalidate - Invalidate cache entries
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.services.correlation.advanced_correlation_engine import AdvancedCorrelationEngine
from backend.services.ticketing.monte_carlo_parlay import MonteCarloParlay
from backend.services.optimization.portfolio_optimizer import PortfolioOptimizer, OptimizationObjective
from backend.services.tasks.task_scheduler import TaskScheduler, TaskPriority
from backend.services.cache.portfolio_cache import (
    portfolio_cache, get_cache_health,
    CacheNamespace, invalidate_correlation_cache
)
from backend.models.portfolio_optimization import (
    OptimizationRun, MonteCarloRun, CorrelationCacheEntry,
    OptimizationStatus, SimulationStatus
)
from backend.services.unified_logging import get_logger

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio Optimization"])
logger = get_logger("optimization_api")


# Request Models

class PropEdge(BaseModel):
    """Prop betting edge information"""
    prop_id: int
    edge_percentage: float
    implied_probability: float
    true_probability: float
    variance: Optional[float] = None
    kelly_fraction: Optional[float] = None


class PortfolioOptimizationRequest(BaseModel):
    """Request for portfolio optimization"""
    props: List[PropEdge] = Field(..., min_items=2, max_items=50)
    objective: OptimizationObjective = OptimizationObjective.MAX_EV
    max_total_stake: float = Field(..., gt=0, le=10000)
    min_edge_threshold: float = Field(0.02, ge=0, le=1)
    max_correlation_threshold: float = Field(0.7, ge=0, le=1)
    beam_width: int = Field(100, ge=10, le=1000)
    max_iterations: int = Field(1000, ge=100, le=10000)
    enable_factor_model: bool = True
    correlation_method: Literal["pairwise", "factor", "copula"] = "factor"


class MonteCarloRequest(BaseModel):
    """Request for Monte Carlo simulation"""
    props: List[PropEdge] = Field(..., min_items=2, max_items=20)
    stakes: List[float] = Field(..., min_items=2, max_items=20)
    min_simulations: int = Field(10000, ge=1000, le=1000000)
    max_simulations: int = Field(100000, ge=10000, le=1000000)
    confidence_level: float = Field(0.95, ge=0.9, le=0.99)
    correlation_method: Literal["pairwise", "factor", "copula"] = "factor"
    enable_factor_acceleration: bool = True


class CorrelationRequest(BaseModel):
    """Request for correlation computation"""
    prop_ids: List[int] = Field(..., min_items=2, max_items=100)
    method: Literal["pairwise", "factor", "copula"] = "pairwise"
    lookback_days: int = Field(30, ge=7, le=365)
    min_observations: int = Field(20, ge=10, le=1000)
    enable_psd_enforcement: bool = True


class CacheInvalidationRequest(BaseModel):
    """Request for cache invalidation"""
    pattern: str = "*"
    namespaces: Optional[List[str]] = None


# Response Models

class TaskResponse(BaseModel):
    """Task creation response"""
    task_id: str
    status: str
    created_at: datetime


class OptimizationResponse(BaseModel):
    """Optimization result response"""
    run_id: int
    status: OptimizationStatus
    objective: OptimizationObjective
    best_portfolio: Optional[Dict[str, Any]] = None
    expected_value: Optional[float] = None
    expected_variance: Optional[float] = None
    total_stake: Optional[float] = None
    num_iterations: Optional[int] = None
    computation_time_sec: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class MonteCarloResponse(BaseModel):
    """Monte Carlo simulation response"""
    run_id: int
    status: SimulationStatus
    num_simulations: Optional[int] = None
    expected_payout: Optional[float] = None
    payout_variance: Optional[float] = None
    win_probability: Optional[float] = None
    confidence_intervals: Optional[Dict[str, Any]] = None
    computation_time_sec: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class CorrelationResponse(BaseModel):
    """Correlation analysis response"""
    cache_id: int
    prop_ids: List[int]
    method: str
    correlation_matrix: List[List[float]]
    factor_loadings: Optional[List[List[float]]] = None
    copula_parameters: Optional[Dict[str, Any]] = None
    num_observations: int
    computation_time_sec: float
    created_at: datetime


# Optimization Endpoints

@router.post("/optimization/portfolio", response_model=TaskResponse)
async def optimize_portfolio(
    request: PortfolioOptimizationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start portfolio optimization process.
    Returns task ID for monitoring progress.
    """
    try:
        # Validate request
        if len(request.props) != len(set(p.prop_id for p in request.props)):
            raise HTTPException(status_code=400, detail="Duplicate prop IDs not allowed")
        
        if len(request.stakes) and len(request.stakes) != len(request.props):
            raise HTTPException(status_code=400, detail="Stakes length must match props length")
        
        # Create optimization run record
        opt_run = OptimizationRun(
            objective=request.objective,
            max_total_stake=request.max_total_stake,
            min_edge_threshold=request.min_edge_threshold,
            max_correlation_threshold=request.max_correlation_threshold,
            beam_width=request.beam_width,
            max_iterations=request.max_iterations,
            status=OptimizationStatus.RUNNING
        )
        db.add(opt_run)
        db.commit()
        db.refresh(opt_run)
        
        # Schedule optimization task
        scheduler = TaskScheduler.get_instance()
        task_id = await scheduler.register_task(
            name=f"portfolio_optimization_{opt_run.id}",
            func=_run_portfolio_optimization,
            args=(opt_run.id, request.dict()),
            priority=TaskPriority.HIGH,
            max_retries=2
        )
        
        logger.info(f"Started portfolio optimization task {task_id} for run {opt_run.id}")
        
        return TaskResponse(
            task_id=task_id,
            status="running",
            created_at=opt_run.created_at
        )
        
    except Exception as e:
        logger.error(f"Failed to start portfolio optimization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.get("/optimization/portfolio/{run_id}", response_model=OptimizationResponse)
async def get_optimization_result(
    run_id: int,
    db: Session = Depends(get_db)
):
    """Get portfolio optimization results"""
    opt_run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
    if not opt_run:
        raise HTTPException(status_code=404, detail="Optimization run not found")
    
    return OptimizationResponse(
        run_id=opt_run.id,
        status=opt_run.status,
        objective=opt_run.objective,
        best_portfolio=opt_run.best_portfolio,
        expected_value=opt_run.expected_value,
        expected_variance=opt_run.expected_variance,
        total_stake=opt_run.total_stake,
        num_iterations=opt_run.num_iterations,
        computation_time_sec=opt_run.computation_time_sec,
        created_at=opt_run.created_at,
        completed_at=opt_run.completed_at
    )


# Monte Carlo Simulation Endpoints

@router.post("/simulation/monte-carlo", response_model=TaskResponse)
async def run_monte_carlo_simulation(
    request: MonteCarloRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start Monte Carlo simulation process.
    Returns task ID for monitoring progress.
    """
    try:
        # Validate request
        if len(request.props) != len(request.stakes):
            raise HTTPException(status_code=400, detail="Props and stakes length must match")
        
        if any(stake <= 0 for stake in request.stakes):
            raise HTTPException(status_code=400, detail="All stakes must be positive")
        
        # Create simulation run record
        mc_run = MonteCarloRun(
            min_simulations=request.min_simulations,
            max_simulations=request.max_simulations,
            confidence_level=request.confidence_level,
            correlation_method=request.correlation_method,
            status=SimulationStatus.RUNNING
        )
        db.add(mc_run)
        db.commit()
        db.refresh(mc_run)
        
        # Schedule simulation task
        scheduler = TaskScheduler.get_instance()
        task_id = await scheduler.register_task(
            name=f"monte_carlo_simulation_{mc_run.id}",
            func=_run_monte_carlo_simulation,
            args=(mc_run.id, request.dict()),
            priority=TaskPriority.MEDIUM,
            max_retries=2
        )
        
        logger.info(f"Started Monte Carlo simulation task {task_id} for run {mc_run.id}")
        
        return TaskResponse(
            task_id=task_id,
            status="running",
            created_at=mc_run.created_at
        )
        
    except Exception as e:
        logger.error(f"Failed to start Monte Carlo simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/simulation/monte-carlo/{run_id}", response_model=MonteCarloResponse)
async def get_monte_carlo_result(
    run_id: int,
    db: Session = Depends(get_db)
):
    """Get Monte Carlo simulation results"""
    mc_run = db.query(MonteCarloRun).filter(MonteCarloRun.id == run_id).first()
    if not mc_run:
        raise HTTPException(status_code=404, detail="Monte Carlo run not found")
    
    return MonteCarloResponse(
        run_id=mc_run.id,
        status=mc_run.status,
        num_simulations=mc_run.num_simulations,
        expected_payout=mc_run.expected_payout,
        payout_variance=mc_run.payout_variance,
        win_probability=mc_run.win_probability,
        confidence_intervals=mc_run.confidence_intervals,
        computation_time_sec=mc_run.computation_time_sec,
        created_at=mc_run.created_at,
        completed_at=mc_run.completed_at
    )


# Correlation Analysis Endpoints

@router.post("/correlation/compute", response_model=CorrelationResponse)
async def compute_correlation(
    request: CorrelationRequest,
    db: Session = Depends(get_db)
):
    """Compute correlation matrix for given props"""
    try:
        # Check cache first
        cache_key = f"correlation_{hash(tuple(sorted(request.prop_ids)))}_{request.method}"
        cached_result = portfolio_cache.get(cache_key, namespace=CacheNamespace.CORRELATION)
        
        if cached_result:
            logger.info(f"Returning cached correlation result for {len(request.prop_ids)} props")
            return CorrelationResponse(**cached_result)
        
        # Create correlation engine
        engine = AdvancedCorrelationEngine(db)
        
        start_time = datetime.now()
        
        # Compute correlation based on method
        if request.method == "pairwise":
            result = await engine.compute_pairwise_matrix(
                prop_ids=request.prop_ids,
                lookback_days=request.lookback_days,
                min_observations=request.min_observations
            )
            correlation_matrix = result["correlation_matrix"]
            factor_loadings = None
            copula_parameters = None
            
        elif request.method == "factor":
            result = await engine.fit_factor_model(
                prop_ids=request.prop_ids,
                lookback_days=request.lookback_days,
                num_factors=min(5, len(request.prop_ids) // 2)
            )
            correlation_matrix = result["correlation_matrix"]
            factor_loadings = result["factor_loadings"]
            copula_parameters = None
            
        elif request.method == "copula":
            result = await engine.build_gaussian_copula_params(
                prop_ids=request.prop_ids,
                lookback_days=request.lookback_days
            )
            correlation_matrix = result["correlation_matrix"]
            factor_loadings = None
            copula_parameters = result["copula_parameters"]
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported method: {request.method}")
        
        computation_time = (datetime.now() - start_time).total_seconds()
        
        # Store in database cache
        cache_entry = CorrelationCacheEntry(
            prop_ids=request.prop_ids,
            method=request.method,
            lookback_days=request.lookback_days,
            correlation_matrix=correlation_matrix,
            factor_loadings=factor_loadings,
            copula_parameters=copula_parameters,
            num_observations=result.get("num_observations", 0),
            computation_time_sec=computation_time
        )
        db.add(cache_entry)
        db.commit()
        db.refresh(cache_entry)
        
        # Cache the response
        response_data = {
            "cache_id": cache_entry.id,
            "prop_ids": request.prop_ids,
            "method": request.method,
            "correlation_matrix": correlation_matrix,
            "factor_loadings": factor_loadings,
            "copula_parameters": copula_parameters,
            "num_observations": result.get("num_observations", 0),
            "computation_time_sec": computation_time,
            "created_at": cache_entry.created_at
        }
        
        portfolio_cache.set(
            cache_key, 
            response_data, 
            ttl_sec=3600,  # 1 hour TTL
            namespace=CacheNamespace.CORRELATION
        )
        
        logger.info(f"Computed {request.method} correlation for {len(request.prop_ids)} props in {computation_time:.2f}s")
        
        return CorrelationResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Failed to compute correlation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Correlation computation failed: {str(e)}")


@router.get("/correlation/factor-model/{model_id}")
async def get_factor_model(
    model_id: int,
    db: Session = Depends(get_db)
):
    """Get factor model details"""
    cache_entry = db.query(CorrelationCacheEntry).filter(
        CorrelationCacheEntry.id == model_id,
        CorrelationCacheEntry.method == "factor"
    ).first()
    
    if not cache_entry:
        raise HTTPException(status_code=404, detail="Factor model not found")
    
    return {
        "model_id": cache_entry.id,
        "prop_ids": cache_entry.prop_ids,
        "factor_loadings": cache_entry.factor_loadings,
        "correlation_matrix": cache_entry.correlation_matrix,
        "num_observations": cache_entry.num_observations,
        "created_at": cache_entry.created_at
    }


# Task Management Endpoints

@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get task execution status"""
    scheduler = TaskScheduler.get_instance()
    status = await scheduler.get_task_status(task_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return status


@router.get("/tasks")
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by task status"),
    limit: int = Query(50, le=200, description="Maximum number of tasks to return")
):
    """List recent tasks"""
    scheduler = TaskScheduler.get_instance()
    tasks = await scheduler.list_tasks(status_filter=status, limit=limit)
    return {"tasks": tasks}


# Cache Management Endpoints

@router.delete("/cache/invalidate")
async def invalidate_cache(request: CacheInvalidationRequest):
    """Invalidate cache entries matching pattern"""
    try:
        total_invalidated = 0
        
        if request.namespaces:
            # Invalidate specific namespaces
            for namespace in request.namespaces:
                portfolio_cache.invalidate(request.pattern, namespace)
                total_invalidated += 1
        else:
            # Invalidate all namespaces
            portfolio_cache.invalidate(request.pattern)
            total_invalidated += 1
        
        logger.info(f"Cache invalidation completed: pattern='{request.pattern}', namespaces={request.namespaces}")
        
        return {
            "message": "Cache invalidation completed",
            "pattern": request.pattern,
            "namespaces": request.namespaces,
            "invalidated_count": total_invalidated
        }
        
    except Exception as e:
        logger.error(f"Cache invalidation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cache invalidation failed: {str(e)}")


@router.get("/cache/stats")
async def get_cache_stats():
    """Get cache performance statistics"""
    try:
        health = get_cache_health()
        return health
    except Exception as e:
        logger.error(f"Failed to get cache stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")


# Background Task Functions

async def _run_portfolio_optimization(run_id: int, request_data: Dict[str, Any]):
    """Background task for portfolio optimization"""
    db = next(get_db())
    
    try:
        # Get the optimization run
        opt_run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
        if not opt_run:
            logger.error(f"Optimization run {run_id} not found")
            return
        
        # Create optimizer
        optimizer = PortfolioOptimizer(db)
        
        # Convert request data to proper format
        props = [PropEdge(**prop) for prop in request_data["props"]]
        
        # Run optimization
        result = await optimizer.optimize_portfolio(
            props=props,
            objective=OptimizationObjective(request_data["objective"]),
            max_total_stake=request_data["max_total_stake"],
            constraints={
                "min_edge_threshold": request_data["min_edge_threshold"],
                "max_correlation_threshold": request_data["max_correlation_threshold"]
            },
            beam_width=request_data["beam_width"],
            max_iterations=request_data["max_iterations"]
        )
        
        # Update database record
        opt_run.status = OptimizationStatus.COMPLETED
        opt_run.best_portfolio = result["best_portfolio"]
        opt_run.expected_value = result["expected_value"]
        opt_run.expected_variance = result["expected_variance"]
        opt_run.total_stake = result["total_stake"]
        opt_run.num_iterations = result["num_iterations"]
        opt_run.computation_time_sec = result["computation_time_sec"]
        opt_run.completed_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Portfolio optimization {run_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Portfolio optimization {run_id} failed: {str(e)}")
        
        # Update status to failed
        opt_run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
        if opt_run:
            opt_run.status = OptimizationStatus.FAILED
            opt_run.completed_at = datetime.utcnow()
            db.commit()
    
    finally:
        db.close()


async def _run_monte_carlo_simulation(run_id: int, request_data: Dict[str, Any]):
    """Background task for Monte Carlo simulation"""
    db = next(get_db())
    
    try:
        # Get the simulation run
        mc_run = db.query(MonteCarloRun).filter(MonteCarloRun.id == run_id).first()
        if not mc_run:
            logger.error(f"Monte Carlo run {run_id} not found")
            return
        
        # Create simulator
        simulator = MonteCarloParlay(db)
        
        # Convert request data to proper format
        props = [PropEdge(**prop) for prop in request_data["props"]]
        stakes = request_data["stakes"]
        
        # Run simulation
        result = await simulator.simulate_parlay(
            props=[(p.prop_id, p.true_probability) for p in props],
            stakes=stakes,
            min_simulations=request_data["min_simulations"],
            max_simulations=request_data["max_simulations"],
            confidence_level=request_data["confidence_level"],
            correlation_method=request_data["correlation_method"]
        )
        
        # Update database record
        mc_run.status = SimulationStatus.COMPLETED
        mc_run.num_simulations = result["num_simulations"]
        mc_run.expected_payout = result["expected_payout"]
        mc_run.payout_variance = result["payout_variance"]
        mc_run.win_probability = result["win_probability"]
        mc_run.confidence_intervals = result["confidence_intervals"]
        mc_run.computation_time_sec = result["computation_time_sec"]
        mc_run.completed_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Monte Carlo simulation {run_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Monte Carlo simulation {run_id} failed: {str(e)}")
        
        # Update status to failed
        mc_run = db.query(MonteCarloRun).filter(MonteCarloRun.id == run_id).first()
        if mc_run:
            mc_run.status = SimulationStatus.FAILED
            mc_run.completed_at = datetime.utcnow()
            db.commit()
    
    finally:
        db.close()