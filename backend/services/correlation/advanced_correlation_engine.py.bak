"""
Advanced Correlation Engine - Multi-method correlation modeling for portfolio optimization.

Implements:
- Pairwise correlation matrices with shrinkage
- Factor model decomposition (PCA-based)
- Gaussian copula parameter estimation
- Positive semidefinite enforcement
- Correlation matrix validation and diagnostics
"""

import hashlib
import json
import logging
import math
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    # Fallback implementations will be provided

from sqlalchemy.orm import Session

from backend.models.portfolio_optimization import (
    CorrelationFactorModel,
    CorrelationCacheEntry,
    CorrelationMethod,
    CacheEntryType,
)
from backend.models.correlation_ticketing import (
    HistoricalPropOutcome,
    PropCorrelationStat,
)
from backend.services.unified_logging import get_logger

logger = get_logger("advanced_correlation")


@dataclass
class CorrelationDiagnostics:
    """Correlation matrix diagnostic results"""
    is_symmetric: bool
    is_positive_semidefinite: bool
    condition_number: float
    min_eigenvalue: float
    max_off_diagonal: float
    mean_correlation: float
    rank_deficiency: int


@dataclass
class FactorModelResult:
    """Factor model decomposition result"""
    loadings: List[List[float]]  # Factor loadings matrix
    eigenvalues: List[float]
    explained_variance_ratio: float
    factors_used: int
    prop_ids: List[int]


@dataclass
class CopulaParams:
    """Gaussian copula parameters"""
    correlation_matrix: List[List[float]]
    marginal_params: Dict[int, Dict[str, float]]  # prop_id -> {mean, std}
    is_psd: bool


class AdvancedCorrelationEngine:
    """
    Advanced correlation modeling engine supporting multiple correlation methods
    and robust statistical techniques for portfolio optimization.
    """

    def __init__(self, db_session: Session):
        self.db = db_session
        self.logger = logger

        # Cache recent computations
        self._matrix_cache: Dict[str, Tuple[datetime, List[List[float]]]] = {}
        self._factor_cache: Dict[str, Tuple[datetime, FactorModelResult]] = {}

    def compute_pairwise_matrix(
        self,
        prop_ids: List[int],
        method: str = "pearson",
        shrinkage: bool = True,
        shrinkage_alpha: float = 0.1,
        min_samples: int = 8
    ) -> Tuple[List[List[float]], CorrelationDiagnostics]:
        """
        Compute pairwise correlation matrix with optional shrinkage regularization.
        
        Args:
            prop_ids: List of proposition IDs
            method: Correlation method ('pearson', 'spearman')
            shrinkage: Apply shrinkage toward identity matrix
            shrinkage_alpha: Shrinkage parameter (0=no shrinkage, 1=full shrinkage)
            min_samples: Minimum samples required per pair
            
        Returns:
            Tuple of (correlation_matrix, diagnostics)
        """
        self.logger.info(
            f"Computing pairwise correlation matrix for {len(prop_ids)} props - "
            f"method: {method}, shrinkage: {shrinkage}, alpha: {shrinkage_alpha}"
        )

        # Check cache first
        cache_key = self._get_matrix_cache_key(prop_ids, method, shrinkage, shrinkage_alpha)
        if cache_key in self._matrix_cache:
            cached_time, cached_matrix = self._matrix_cache[cache_key]
            if datetime.now(timezone.utc) - cached_time < timedelta(hours=1):
                self.logger.info("Using cached correlation matrix")
                diagnostics = self._validate_correlation_matrix(cached_matrix)
                return cached_matrix, diagnostics

        try:
            # Get historical outcomes for all props
            prop_data = self._fetch_historical_data(prop_ids, min_samples)
            
            if len(prop_data) < 2:
                # Return identity matrix for insufficient data
                n = len(prop_ids)
                identity_matrix = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
                diagnostics = self._validate_correlation_matrix(identity_matrix)
                return identity_matrix, diagnostics

            # Compute raw correlation matrix
            if NUMPY_AVAILABLE:
                raw_matrix = self._compute_correlation_numpy(prop_data, method)
            else:
                raw_matrix = self._compute_correlation_fallback(prop_data, method)

            # Apply shrinkage if requested
            if shrinkage:
                raw_matrix = self._apply_ledoit_wolf_shrinkage(raw_matrix, shrinkage_alpha)

            # Ensure positive semidefinite
            psd_matrix = self._ensure_positive_semidefinite(raw_matrix)

            # Validate final matrix
            diagnostics = self._validate_correlation_matrix(psd_matrix)

            # Cache result
            self._matrix_cache[cache_key] = (datetime.now(timezone.utc), psd_matrix)

            self.logger.info(
                f"Correlation matrix computed successfully - "
                f"size: {len(psd_matrix)}x{len(psd_matrix[0])}, "
                f"is_psd: {diagnostics.is_positive_semidefinite}, "
                f"condition_number: {diagnostics.condition_number:.2f}, "
                f"mean_correlation: {diagnostics.mean_correlation:.3f}"
            )

            return psd_matrix, diagnostics

        except Exception as e:
            self.logger.error(f"Failed to compute correlation matrix: {e}")
            # Return identity matrix as fallback
            n = len(prop_ids)
            identity_matrix = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
            diagnostics = self._validate_correlation_matrix(identity_matrix)
            return identity_matrix, diagnostics

    def fit_factor_model(
        self,
        correlation_matrix: List[List[float]],
        prop_ids: List[int],
        max_factors: int = 3,
        min_explained: float = 0.6,
        sport: str = "MLB"
    ) -> Optional[FactorModelResult]:
        """
        Fit factor model using PCA decomposition of correlation matrix.
        
        Args:
            correlation_matrix: Input correlation matrix
            prop_ids: Corresponding proposition IDs
            max_factors: Maximum number of factors to extract
            min_explained: Minimum explained variance ratio required
            sport: Sport context for caching
            
        Returns:
            FactorModelResult or None if fitting fails
        """
        try:
            self.logger.info(
                f"Fitting factor model - size: {len(correlation_matrix)}, "
                f"max_factors: {max_factors}, min_explained: {min_explained}"
            )

            # Use numpy if available, otherwise fallback
            if NUMPY_AVAILABLE:
                result = self._fit_factor_model_numpy(
                    correlation_matrix, prop_ids, max_factors, min_explained
                )
            else:
                result = self._fit_factor_model_fallback(
                    correlation_matrix, prop_ids, max_factors, min_explained
                )

            if result is not None:
                # Persist to database
                self._persist_factor_model(result, sport)
                
                self.logger.info(
                    f"Factor model fitted successfully - "
                    f"factors_used: {result.factors_used}, "
                    f"explained_variance: {result.explained_variance_ratio:.3f}"
                )

            return result

        except Exception as e:
            self.logger.error(f"Failed to fit factor model: {e}")
            return None

    def build_gaussian_copula_params(
        self,
        correlation_matrix: List[List[float]],
        prop_ids: List[int],
        historical_data: Optional[Dict[int, List[float]]] = None
    ) -> CopulaParams:
        """
        Build Gaussian copula parameters from correlation matrix and marginal data.
        
        Args:
            correlation_matrix: Base correlation matrix
            prop_ids: Corresponding proposition IDs
            historical_data: Optional historical data for marginal estimation
            
        Returns:
            CopulaParams with correlation matrix and marginal parameters
        """
        try:
            self.logger.info(
                f"Building Gaussian copula parameters - "
                f"matrix_size: {len(correlation_matrix)}, prop_count: {len(prop_ids)}"
            )

            # Ensure correlation matrix is positive semidefinite
            psd_matrix = self._ensure_positive_semidefinite(correlation_matrix)
            diagnostics = self._validate_correlation_matrix(psd_matrix)

            # Estimate marginal parameters if historical data provided
            marginal_params = {}
            if historical_data:
                for prop_id in prop_ids:
                    if prop_id in historical_data and len(historical_data[prop_id]) > 0:
                        values = historical_data[prop_id]
                        mean_val = sum(values) / len(values)
                        variance = sum((x - mean_val) ** 2 for x in values) / len(values)
                        std_val = math.sqrt(variance) if variance > 0 else 1.0
                        
                        marginal_params[prop_id] = {
                            "mean": mean_val,
                            "std": std_val,
                            "samples": len(values)
                        }

            copula_params = CopulaParams(
                correlation_matrix=psd_matrix,
                marginal_params=marginal_params,
                is_psd=diagnostics.is_positive_semidefinite
            )

            self.logger.info(
                f"Copula parameters built successfully - "
                f"is_psd: {copula_params.is_psd}, marginals_count: {len(marginal_params)}"
            )

            return copula_params

        except Exception as e:
            self.logger.error(f"Failed to build copula parameters: {e}")
            # Return identity matrix fallback
            n = len(prop_ids)
            identity_matrix = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
            return CopulaParams(
                correlation_matrix=identity_matrix,
                marginal_params={},
                is_psd=True
            )

    def validate_correlation_matrix(self, correlation_matrix: List[List[float]]) -> CorrelationDiagnostics:
        """
        Validate correlation matrix and return comprehensive diagnostics.
        
        Args:
            correlation_matrix: Matrix to validate
            
        Returns:
            CorrelationDiagnostics with validation results
        """
        return self._validate_correlation_matrix(correlation_matrix)

    # Private methods for implementation details

    def _fetch_historical_data(self, prop_ids: List[int], min_samples: int) -> Dict[int, List[float]]:
        """Fetch historical outcome data for correlation computation"""
        try:
            # Query historical prop outcomes
            outcomes = (
                self.db.query(HistoricalPropOutcome)
                .filter(HistoricalPropOutcome.prop_id.in_(prop_ids))
                .order_by(HistoricalPropOutcome.event_date.desc())
                .limit(1000)  # Reasonable limit
                .all()
            )

            # Group by prop_id
            prop_data = {}
            for outcome in outcomes:
                if outcome.prop_id not in prop_data:
                    prop_data[outcome.prop_id] = []
                prop_data[outcome.prop_id].append(outcome.actual_value)

            # Filter props with insufficient data
            filtered_data = {
                prop_id: values for prop_id, values in prop_data.items()
                if len(values) >= min_samples
            }

            self.logger.info(
                f"Fetched historical data - total_outcomes: {len(outcomes)}, "
                f"props_with_data: {len(prop_data)}, "
                f"props_sufficient_data: {len(filtered_data)}"
            )

            return filtered_data

        except Exception as e:
            self.logger.error(f"Failed to fetch historical data: {e}")
            return {}

    def _compute_correlation_numpy(self, prop_data: Dict[int, List[float]], method: str) -> List[List[float]]:
        """Compute correlation matrix using numpy (when available)"""
        prop_ids = list(prop_data.keys())
        n = len(prop_ids)
        
        # Convert to numpy arrays and compute correlation
        data_matrix = []
        for prop_id in prop_ids:
            data_matrix.append(prop_data[prop_id])
        
        data_array = np.array(data_matrix)
        
        if method.lower() == 'pearson':
            corr_matrix = np.corrcoef(data_array)
        else:
            # Fallback to pearson for unsupported methods
            corr_matrix = np.corrcoef(data_array)
        
        # Handle NaN values
        corr_matrix = np.nan_to_num(corr_matrix, nan=0.0, posinf=1.0, neginf=-1.0)
        
        # Convert back to list format
        return corr_matrix.tolist()

    def _compute_correlation_fallback(self, prop_data: Dict[int, List[float]], method: str) -> List[List[float]]:
        """Fallback correlation computation without numpy"""
        prop_ids = list(prop_data.keys())
        n = len(prop_ids)
        
        # Initialize correlation matrix
        corr_matrix = [[0.0 for _ in range(n)] for _ in range(n)]
        
        # Compute pairwise correlations
        for i in range(n):
            for j in range(n):
                if i == j:
                    corr_matrix[i][j] = 1.0
                else:
                    prop_a, prop_b = prop_ids[i], prop_ids[j]
                    if prop_a in prop_data and prop_b in prop_data:
                        corr = self._compute_pearson_correlation(prop_data[prop_a], prop_data[prop_b])
                        corr_matrix[i][j] = corr
                        corr_matrix[j][i] = corr  # Symmetric
        
        return corr_matrix

    def _compute_pearson_correlation(self, x_values: List[float], y_values: List[float]) -> float:
        """Compute Pearson correlation coefficient between two series"""
        try:
            n = min(len(x_values), len(y_values))
            if n < 2:
                return 0.0
            
            # Take first n values from each series
            x = x_values[:n]
            y = y_values[:n]
            
            # Compute means
            mean_x = sum(x) / n
            mean_y = sum(y) / n
            
            # Compute covariance and variances
            cov_xy = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
            var_x = sum((x[i] - mean_x) ** 2 for i in range(n))
            var_y = sum((y[i] - mean_y) ** 2 for i in range(n))
            
            # Compute correlation
            if var_x > 0 and var_y > 0:
                correlation = cov_xy / math.sqrt(var_x * var_y)
                # Clamp to [-1, 1]
                correlation = max(-1.0, min(1.0, correlation))
                return correlation
            else:
                return 0.0
                
        except Exception:
            return 0.0

    def _apply_ledoit_wolf_shrinkage(self, matrix: List[List[float]], alpha: float) -> List[List[float]]:
        """Apply Ledoit-Wolf style shrinkage toward identity matrix"""
        n = len(matrix)
        shrunk_matrix = []
        
        for i in range(n):
            row = []
            for j in range(n):
                if i == j:
                    # Diagonal elements shrink toward 1.0
                    shrunk_value = (1 - alpha) * matrix[i][j] + alpha * 1.0
                else:
                    # Off-diagonal elements shrink toward 0.0
                    shrunk_value = (1 - alpha) * matrix[i][j] + alpha * 0.0
                row.append(shrunk_value)
            shrunk_matrix.append(row)
        
        return shrunk_matrix

    def _ensure_positive_semidefinite(self, matrix: List[List[float]]) -> List[List[float]]:
        """Ensure matrix is positive semidefinite by eigenvalue clipping"""
        try:
            if NUMPY_AVAILABLE:
                return self._ensure_psd_numpy(matrix)
            else:
                return self._ensure_psd_fallback(matrix)
        except Exception as e:
            self.logger.warning(f"PSD enforcement failed: {e}, returning original matrix")
            return matrix

    def _ensure_psd_numpy(self, matrix: List[List[float]]) -> List[List[float]]:
        """Ensure PSD using numpy eigendecomposition"""
        A = np.array(matrix)
        eigenvals, eigenvecs = np.linalg.eigh(A)
        
        # Clip negative eigenvalues to small positive value
        eigenvals = np.maximum(eigenvals, 1e-8)
        
        # Reconstruct matrix
        A_psd = eigenvecs @ np.diag(eigenvals) @ eigenvecs.T
        
        # Ensure diagonal is 1.0 (correlation matrix)
        np.fill_diagonal(A_psd, 1.0)
        
        return A_psd.tolist()

    def _ensure_psd_fallback(self, matrix: List[List[float]]) -> List[List[float]]:
        """Simple PSD fallback - clamp off-diagonal elements"""
        n = len(matrix)
        result = []
        
        for i in range(n):
            row = []
            for j in range(n):
                if i == j:
                    row.append(1.0)  # Correlation matrix diagonal
                else:
                    # Clamp correlations to reasonable range
                    value = max(-0.95, min(0.95, matrix[i][j]))
                    row.append(value)
            result.append(row)
        
        return result

    def _fit_factor_model_numpy(
        self,
        correlation_matrix: List[List[float]],
        prop_ids: List[int],
        max_factors: int,
        min_explained: float
    ) -> Optional[FactorModelResult]:
        """Fit factor model using numpy PCA"""
        try:
            A = np.array(correlation_matrix)
            
            # Eigendecomposition
            eigenvals, eigenvecs = np.linalg.eigh(A)
            
            # Sort by eigenvalues (descending)
            idx = np.argsort(eigenvals)[::-1]
            eigenvals = eigenvals[idx]
            eigenvecs = eigenvecs[:, idx]
            
            # Determine number of factors
            total_variance = np.sum(eigenvals)
            cumulative_explained = np.cumsum(eigenvals) / total_variance
            
            factors_used = max_factors
            for i in range(1, min(len(eigenvals), max_factors) + 1):
                if cumulative_explained[i-1] >= min_explained:
                    factors_used = i
                    break
            
            if factors_used == 0 or cumulative_explained[factors_used-1] < min_explained:
                return None
            
            # Extract loadings (first factors_used eigenvectors)
            loadings = eigenvecs[:, :factors_used].tolist()
            explained_variance = float(cumulative_explained[factors_used-1])
            
            return FactorModelResult(
                loadings=loadings,
                eigenvalues=eigenvals[:factors_used].tolist(),
                explained_variance_ratio=explained_variance,
                factors_used=factors_used,
                prop_ids=prop_ids.copy()
            )
            
        except Exception as e:
            self.logger.error(f"Numpy factor model fitting failed: {e}")
            return None

    def _fit_factor_model_fallback(
        self,
        correlation_matrix: List[List[float]],
        prop_ids: List[int],
        max_factors: int,
        min_explained: float
    ) -> Optional[FactorModelResult]:
        """Simplified factor model without full eigendecomposition"""
        try:
            n = len(correlation_matrix)
            if n < 3:
                return None
            
            # Simple approximation: use first principal component
            # Compute row sums as proxy for first eigenvector
            row_sums = [sum(correlation_matrix[i]) for i in range(n)]
            total_sum = sum(row_sums)
            
            if total_sum <= 0:
                return None
            
            # Normalize to get loading approximation
            loadings = [[row_sums[i] / math.sqrt(total_sum)] for i in range(n)]
            
            # Estimate explained variance (rough approximation)
            explained_variance = min(0.8, max(0.3, total_sum / (n * n)))
            
            if explained_variance < min_explained:
                return None
            
            return FactorModelResult(
                loadings=loadings,
                eigenvalues=[total_sum / n],
                explained_variance_ratio=explained_variance,
                factors_used=1,
                prop_ids=prop_ids.copy()
            )
            
        except Exception as e:
            self.logger.error(f"Fallback factor model fitting failed: {e}")
            return None

    def _validate_correlation_matrix(self, matrix: List[List[float]]) -> CorrelationDiagnostics:
        """Comprehensive correlation matrix validation"""
        try:
            n = len(matrix)
            if n == 0:
                return CorrelationDiagnostics(
                    is_symmetric=False,
                    is_positive_semidefinite=False,
                    condition_number=float('inf'),
                    min_eigenvalue=-1.0,
                    max_off_diagonal=0.0,
                    mean_correlation=0.0,
                    rank_deficiency=0
                )
            
            # Check symmetry
            is_symmetric = True
            for i in range(n):
                for j in range(n):
                    if abs(matrix[i][j] - matrix[j][i]) > 1e-6:
                        is_symmetric = False
                        break
                if not is_symmetric:
                    break
            
            # Compute off-diagonal statistics
            off_diagonal_values = []
            for i in range(n):
                for j in range(n):
                    if i != j:
                        off_diagonal_values.append(matrix[i][j])
            
            max_off_diagonal = max(abs(v) for v in off_diagonal_values) if off_diagonal_values else 0.0
            mean_correlation = sum(off_diagonal_values) / len(off_diagonal_values) if off_diagonal_values else 0.0
            
            # Eigenvalue-based diagnostics (if numpy available)
            min_eigenvalue = -1.0
            condition_number = float('inf')
            rank_deficiency = 0
            is_positive_semidefinite = True
            
            if NUMPY_AVAILABLE:
                try:
                    A = np.array(matrix)
                    eigenvals = np.linalg.eigvals(A)
                    eigenvals = np.real(eigenvals)  # Take real part
                    
                    min_eigenvalue = float(np.min(eigenvals))
                    max_eigenvalue = float(np.max(eigenvals))
                    
                    is_positive_semidefinite = min_eigenvalue >= -1e-8
                    
                    if max_eigenvalue > 1e-10:
                        condition_number = max_eigenvalue / max(min_eigenvalue, 1e-10)
                    
                    rank_deficiency = np.sum(eigenvals < 1e-10)
                    
                except Exception:
                    pass
            else:
                # Simple approximation: check diagonal dominance
                is_positive_semidefinite = all(
                    matrix[i][i] >= sum(abs(matrix[i][j]) for j in range(n) if i != j)
                    for i in range(n)
                )
            
            return CorrelationDiagnostics(
                is_symmetric=is_symmetric,
                is_positive_semidefinite=is_positive_semidefinite,
                condition_number=condition_number,
                min_eigenvalue=min_eigenvalue,
                max_off_diagonal=max_off_diagonal,
                mean_correlation=mean_correlation,
                rank_deficiency=rank_deficiency
            )
            
        except Exception as e:
            self.logger.error(f"Matrix validation failed: {e}")
            return CorrelationDiagnostics(
                is_symmetric=False,
                is_positive_semidefinite=False,
                condition_number=float('inf'),
                min_eigenvalue=-1.0,
                max_off_diagonal=0.0,
                mean_correlation=0.0,
                rank_deficiency=0
            )

    def _persist_factor_model(self, result: FactorModelResult, sport: str):
        """Persist factor model to database"""
        try:
            # Create context hash from prop IDs
            context_hash = hashlib.sha256(
                json.dumps(sorted(result.prop_ids)).encode()
            ).hexdigest()[:16]
            
            # Check if model already exists
            existing = (
                self.db.query(CorrelationFactorModel)
                .filter_by(
                    sport=sport,
                    context_hash=context_hash,
                    method=CorrelationMethod.PCA,
                    version_tag="v1"
                )
                .first()
            )
            
            if existing:
                # Update existing model
                existing.factors_json = result.loadings
                existing.eigenvalues_json = result.eigenvalues
                existing.explained_variance_ratio = result.explained_variance_ratio
                existing.sample_size = len(result.prop_ids)
                existing.computed_at = datetime.now(timezone.utc)
            else:
                # Create new model
                factor_model = CorrelationFactorModel(
                    sport=sport,
                    context_hash=context_hash,
                    method=CorrelationMethod.PCA,
                    factors_json=result.loadings,
                    eigenvalues_json=result.eigenvalues,
                    explained_variance_ratio=result.explained_variance_ratio,
                    sample_size=len(result.prop_ids),
                    version_tag="v1"
                )
                self.db.add(factor_model)
            
            self.db.commit()
            self.logger.info("Factor model persisted successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to persist factor model: {e}")
            self.db.rollback()

    def _get_matrix_cache_key(self, prop_ids: List[int], method: str, shrinkage: bool, alpha: float) -> str:
        """Generate cache key for correlation matrix"""
        key_data = {
            "prop_ids": sorted(prop_ids),
            "method": method,
            "shrinkage": shrinkage,
            "alpha": alpha
        }
        return hashlib.sha256(json.dumps(key_data, sort_keys=True).encode()).hexdigest()[:16]