"""
Unified Optimization Domain Models

Standardized data models for optimization and risk management operations.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union, Tuple
from decimal import Decimal
from pydantic import BaseModel, Field, validator


class Sport(str, Enum):
    """Supported sports"""
    MLB = "mlb"
    NBA = "nba"
    NFL = "nfl"
    NHL = "nhl"


class OptimizationType(str, Enum):
    """Types of optimization"""
    PORTFOLIO = "portfolio"
    KELLY = "kelly"
    ARBITRAGE = "arbitrage"
    RISK_MANAGEMENT = "risk_management"
    QUANTUM = "quantum"


class RiskLevel(str, Enum):
    """Risk levels"""
    CONSERVATIVE = "conservative"
    MODERATE = "moderate" 
    AGGRESSIVE = "aggressive"
    ULTRA_AGGRESSIVE = "ultra_aggressive"


class OptimizationObjective(str, Enum):
    """Optimization objectives"""
    MAXIMIZE_RETURN = "maximize_return"
    MINIMIZE_RISK = "minimize_risk"
    MAXIMIZE_SHARPE = "maximize_sharpe"
    MAXIMIZE_KELLY = "maximize_kelly"
    RISK_PARITY = "risk_parity"


class ConstraintType(str, Enum):
    """Portfolio constraint types"""
    MAX_ALLOCATION = "max_allocation"
    MIN_ALLOCATION = "min_allocation"
    MAX_POSITIONS = "max_positions"
    SECTOR_LIMIT = "sector_limit"
    CORRELATION_LIMIT = "correlation_limit"


# Request Models
class OptimizationRequest(BaseModel):
    """Base optimization request"""
    optimization_type: OptimizationType
    objective: OptimizationObjective = Field(OptimizationObjective.MAXIMIZE_SHARPE, description="Optimization objective")
    risk_level: RiskLevel = Field(RiskLevel.MODERATE, description="Risk tolerance level")
    time_horizon: int = Field(30, description="Investment time horizon in days")
    use_quantum: bool = Field(False, description="Use quantum optimization")


class PortfolioOptimizationRequest(BaseModel):
    """Portfolio optimization request"""
    optimization_type: OptimizationType = Field(OptimizationType.PORTFOLIO)
    predictions: List[Dict[str, Any]] = Field(..., description="List of predictions to optimize")
    
    # Portfolio constraints
    max_allocation_per_bet: float = Field(0.25, ge=0, le=1, description="Max allocation per single bet")
    min_allocation_per_bet: float = Field(0.01, ge=0, le=1, description="Min allocation per bet")
    max_positions: int = Field(10, ge=1, le=50, description="Maximum number of positions")
    total_bankroll: Decimal = Field(..., gt=0, description="Total bankroll amount")
    
    # Risk parameters
    risk_level: RiskLevel = Field(RiskLevel.MODERATE)
    max_drawdown: float = Field(0.15, ge=0, le=1, description="Maximum acceptable drawdown")
    target_return: Optional[float] = Field(None, description="Target return rate")
    
    # Optimization settings
    objective: OptimizationObjective = Field(OptimizationObjective.MAXIMIZE_SHARPE)
    use_quantum: bool = Field(True, description="Use quantum optimization")
    correlation_threshold: float = Field(0.7, ge=0, le=1, description="Max correlation between bets")
    
    @validator('max_allocation_per_bet')
    def validate_max_allocation(cls, v, values):
        if 'min_allocation_per_bet' in values and v <= values['min_allocation_per_bet']:
            raise ValueError('Max allocation must be greater than min allocation')
        return v


class KellyOptimizationRequest(BaseModel):
    """Kelly criterion optimization request"""
    optimization_type: OptimizationType = Field(OptimizationType.KELLY)
    predictions: List[Dict[str, Any]] = Field(..., description="Predictions with win probabilities and odds")
    
    # Kelly parameters
    fractional_kelly: float = Field(0.25, ge=0.1, le=1.0, description="Fractional Kelly multiplier")
    max_kelly_allocation: float = Field(0.20, ge=0, le=1, description="Maximum Kelly allocation")
    min_edge: float = Field(0.05, ge=0, le=1, description="Minimum edge required")
    
    # Risk controls
    bankroll: Decimal = Field(..., gt=0, description="Total bankroll")
    risk_level: RiskLevel = Field(RiskLevel.MODERATE)


class ArbitrageOptimizationRequest(BaseModel):
    """Arbitrage optimization request"""
    optimization_type: OptimizationType = Field(OptimizationType.ARBITRAGE)
    opportunities: List[Dict[str, Any]] = Field(..., description="Arbitrage opportunities")
    
    # Arbitrage parameters
    min_profit_margin: float = Field(0.02, ge=0, le=1, description="Minimum profit margin")
    max_stake_per_arb: Decimal = Field(..., gt=0, description="Maximum stake per arbitrage")
    total_capital: Decimal = Field(..., gt=0, description="Total available capital")
    
    # Execution constraints
    sportsbook_limits: Optional[Dict[str, Decimal]] = Field(None, description="Sportsbook betting limits")
    execution_time_limit: int = Field(300, description="Max execution time in seconds")


class RiskAssessmentRequest(BaseModel):
    """Risk assessment request"""
    optimization_type: OptimizationType = Field(OptimizationType.RISK_MANAGEMENT)
    current_positions: List[Dict[str, Any]] = Field(..., description="Current betting positions")
    
    # Risk parameters
    bankroll: Decimal = Field(..., gt=0, description="Current bankroll")
    risk_level: RiskLevel = Field(RiskLevel.MODERATE)
    time_horizon: int = Field(7, description="Risk assessment period in days")


# Response Models
class PortfolioOptimization(BaseModel):
    """Portfolio optimization result"""
    optimization_id: str
    objective: OptimizationObjective
    
    # Optimal allocation
    allocations: Dict[str, float] = Field(..., description="Bet ID to allocation mapping")
    total_allocation: float = Field(..., description="Total portfolio allocation")
    number_of_positions: int = Field(..., description="Number of positions")
    
    # Expected performance
    expected_return: float = Field(..., description="Expected portfolio return")
    expected_variance: float = Field(..., description="Expected portfolio variance")
    sharpe_ratio: float = Field(..., description="Expected Sharpe ratio")
    
    # Risk metrics
    value_at_risk_95: float = Field(..., description="95% Value at Risk")
    value_at_risk_99: float = Field(..., description="99% Value at Risk")
    max_drawdown_estimate: float = Field(..., description="Estimated max drawdown")
    
    # Quantum optimization results
    quantum_advantage: Optional[float] = Field(None, description="Quantum optimization advantage")
    entanglement_score: Optional[float] = Field(None, description="Quantum entanglement score")
    
    # Diversification metrics
    diversification_ratio: float = Field(..., description="Portfolio diversification ratio")
    concentration_index: float = Field(..., description="Portfolio concentration index")
    
    # Constraints status
    constraints_satisfied: bool = Field(..., description="All constraints satisfied")
    constraint_violations: List[str] = Field(default_factory=list)
    
    # Metadata
    optimization_time_ms: float = Field(..., description="Optimization time in milliseconds")
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class KellyRecommendation(BaseModel):
    """Kelly criterion recommendation"""
    recommendation_id: str
    
    # Kelly calculations
    kelly_recommendations: Dict[str, Dict[str, float]] = Field(..., description="Kelly recommendations per bet")
    fractional_kelly_used: float = Field(..., description="Fractional Kelly multiplier applied")
    
    # Aggregate metrics
    total_kelly_allocation: float = Field(..., description="Total Kelly allocation")
    expected_growth_rate: float = Field(..., description="Expected logarithmic growth rate")
    
    # Risk metrics
    probability_of_ruin: float = Field(..., description="Probability of ruin estimate")
    time_to_double: Optional[float] = Field(None, description="Expected time to double bankroll")
    
    # Recommendations by bet
    individual_recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Metadata
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ArbitrageAnalysis(BaseModel):
    """Arbitrage analysis result"""
    analysis_id: str
    
    # Arbitrage opportunities
    opportunities: List[Dict[str, Any]] = Field(..., description="Analyzed arbitrage opportunities")
    total_opportunities: int = Field(..., description="Total number of opportunities")
    
    # Optimal execution
    recommended_stakes: Dict[str, Dict[str, Decimal]] = Field(..., description="Recommended stakes per opportunity")
    total_stake_required: Decimal = Field(..., description="Total stake required")
    guaranteed_profit: Decimal = Field(..., description="Total guaranteed profit")
    profit_margin: float = Field(..., description="Overall profit margin")
    
    # Risk analysis
    execution_risk_score: float = Field(..., description="Risk score for execution")
    market_movement_risk: float = Field(..., description="Risk of market movement")
    
    # Timing analysis
    optimal_execution_order: List[str] = Field(..., description="Optimal execution order")
    estimated_execution_time: int = Field(..., description="Estimated execution time in seconds")
    
    # Sportsbook analysis
    sportsbook_exposure: Dict[str, Decimal] = Field(..., description="Exposure per sportsbook")
    
    # Metadata
    generated_at: datetime
    expires_at: datetime = Field(..., description="Analysis expiration time")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }


class RiskAssessment(BaseModel):
    """Risk assessment result"""
    assessment_id: str
    
    # Overall risk metrics
    overall_risk_score: float = Field(..., ge=0, le=1, description="Overall risk score (0-1)")
    risk_level: RiskLevel = Field(..., description="Assessed risk level")
    
    # Portfolio risk breakdown
    concentration_risk: float = Field(..., description="Concentration risk score")
    correlation_risk: float = Field(..., description="Correlation risk score")
    liquidity_risk: float = Field(..., description="Liquidity risk score")
    model_risk: float = Field(..., description="Model prediction risk")
    
    # Value at Risk calculations
    var_1_day_95: float = Field(..., description="1-day 95% VaR")
    var_1_day_99: float = Field(..., description="1-day 99% VaR")
    var_7_day_95: float = Field(..., description="7-day 95% VaR")
    
    # Stress testing
    stress_scenarios: List[Dict[str, Any]] = Field(default_factory=list)
    worst_case_loss: float = Field(..., description="Worst case loss estimate")
    
    # Risk recommendations
    risk_recommendations: List[str] = Field(default_factory=list)
    suggested_adjustments: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Position analysis
    risky_positions: List[Dict[str, Any]] = Field(default_factory=list)
    position_risk_scores: Dict[str, float] = Field(default_factory=dict)
    
    # Metadata
    generated_at: datetime
    valid_until: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class OptimizationResponse(BaseModel):
    """Unified optimization response"""
    request_id: str
    optimization_type: OptimizationType
    
    # Response data
    portfolio_optimization: Optional[PortfolioOptimization] = None
    kelly_recommendation: Optional[KellyRecommendation] = None
    arbitrage_analysis: Optional[ArbitrageAnalysis] = None
    risk_assessment: Optional[RiskAssessment] = None
    
    # Execution metadata
    success: bool
    optimization_time_ms: float
    
    # Error handling
    error: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    
    # Metadata
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class BacktestResult(BaseModel):
    """Optimization strategy backtest result"""
    backtest_id: str
    strategy_name: str
    
    # Performance metrics
    total_return: float = Field(..., description="Total return percentage")
    annualized_return: float = Field(..., description="Annualized return percentage")
    volatility: float = Field(..., description="Return volatility")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    max_drawdown: float = Field(..., description="Maximum drawdown")
    
    # Risk metrics
    value_at_risk: float = Field(..., description="Value at Risk")
    conditional_var: float = Field(..., description="Conditional Value at Risk")
    
    # Trade statistics
    total_trades: int = Field(..., description="Total number of trades")
    win_rate: float = Field(..., description="Win rate percentage")
    avg_win: float = Field(..., description="Average winning trade")
    avg_loss: float = Field(..., description="Average losing trade")
    profit_factor: float = Field(..., description="Profit factor")
    
    # Time series data
    equity_curve: List[Tuple[datetime, float]] = Field(default_factory=list)
    drawdown_curve: List[Tuple[datetime, float]] = Field(default_factory=list)
    
    # Period breakdown
    monthly_returns: Dict[str, float] = Field(default_factory=dict)
    yearly_returns: Dict[str, float] = Field(default_factory=dict)
    
    # Metadata
    start_date: datetime
    end_date: datetime
    generated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthResponse(BaseModel):
    """Optimization service health response"""
    status: str
    optimization_engines_online: int
    total_optimization_engines: int
    avg_optimization_time_ms: float
    optimizations_completed_last_hour: int
    quantum_optimizer_available: bool
    cache_hit_rate: float
    uptime_seconds: float
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Error Models  
class OptimizationError(BaseModel):
    """Optimization error response"""
    error_code: str
    message: str
    optimization_type: Optional[OptimizationType] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Configuration Models
class OptimizationConfig(BaseModel):
    """Optimization configuration"""
    quantum_enabled: bool = Field(True, description="Quantum optimization enabled")
    max_optimization_time_ms: int = Field(5000, description="Maximum optimization time")
    default_risk_level: RiskLevel = Field(RiskLevel.MODERATE)
    
    # Kelly settings
    default_fractional_kelly: float = Field(0.25, description="Default fractional Kelly")
    max_kelly_allocation: float = Field(0.20, description="Maximum Kelly allocation")
    
    # Portfolio settings
    default_max_positions: int = Field(10, description="Default max positions")
    default_max_allocation: float = Field(0.25, description="Default max allocation per bet")
    
    # Risk settings
    default_var_confidence: float = Field(0.95, description="Default VaR confidence level")
    stress_test_scenarios: int = Field(1000, description="Number of stress test scenarios")
