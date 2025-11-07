"""Enhanced Mathematical Risk Management
Advanced stochastic processes, extreme value theory, and financial mathematics
for sophisticated risk assessment and portfolio optimization
"""

import logging
import time
import warnings
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

import numpy as np
from scipy import optimize, stats

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)


class RiskMeasure(Enum):
    """Risk measure types"""

    VALUE_AT_RISK = "var"
    CONDITIONAL_VALUE_AT_RISK = "cvar"
    EXPECTED_SHORTFALL = "expected_shortfall"
    MAXIMUM_DRAWDOWN = "max_drawdown"
    TAIL_VALUE_AT_RISK = "tvar"
    COHERENT_RISK_MEASURE = "coherent"
    SPECTRAL_RISK_MEASURE = "spectral"


@dataclass
class RiskAssessmentResult:
    """Comprehensive risk assessment result"""

    value_at_risk: Dict[str, float]  # VaR at different confidence levels
    conditional_var: Dict[str, float]  # CVaR (Expected Shortfall)
    tail_statistics: Dict[str, Any]
    extreme_value_parameters: Dict[str, float]
    correlation_structure: np.ndarray
    copula_parameters: Dict[str, Any]
    portfolio_metrics: Dict[str, float]
    stress_test_results: Dict[str, float]
    monte_carlo_simulation: Dict[str, np.ndarray]
    regime_switching_parameters: Dict[str, Any]
    jump_diffusion_parameters: Dict[str, float]
    volatility_forecasts: Dict[str, np.ndarray]
    risk_decomposition: Dict[str, float]
    capital_allocation: Dict[str, float]


class ExtremeValueTheory:
    """Extreme Value Theory for tail risk analysis"""

    def __init__(self):
        self.gev_parameters = {}
        self.gpd_parameters = {}
        self.threshold_selection = {}

    def generalized_extreme_value(
        self, data: np.ndarray, block_size: int = 252
    ) -> Dict[str, float]:
        """Fit Generalized Extreme Value distribution to block maxima"""
        # Create block maxima
        n_blocks = len(data) // block_size
        block_maxima = []

        for i in range(n_blocks):
            block = data[i * block_size : (i + 1) * block_size]
            if len(block) > 0:
                block_maxima.append(np.max(block))

        block_maxima = np.array(block_maxima)

        # Fit GEV distribution
        # GEV CDF: exp(-[1 + ξ(x-μ)/σ]^(-1/ξ)) for ξ ≠ 0

        def gev_likelihood(params):
            """Negative log-likelihood for GEV distribution"""
            xi, mu, sigma = params

            if sigma <= 0:
                return np.inf

            z = (block_maxima - mu) / sigma

            if xi == 0:
                # Gumbel case
                log_likelihood = -np.sum(np.log(sigma)) - np.sum(z) - np.sum(np.exp(-z))
            else:
                # General case
                y = 1 + xi * z
                if np.any(y <= 0):
                    return np.inf

                log_likelihood = (
                    -np.sum(np.log(sigma))
                    - (1 + 1 / xi) * np.sum(np.log(y))
                    - np.sum(y ** (-1 / xi))
                )

            return -log_likelihood

        # Initial parameter estimates
        sample_mean = np.mean(block_maxima)
        sample_std = np.std(block_maxima)

        initial_params = [0.1, sample_mean, sample_std]

        # Optimize
        try:
            result = optimize.minimize(
                gev_likelihood,
                initial_params,
                method="L-BFGS-B",
                bounds=[(-0.5, 0.5), (None, None), (0.01, None)],
            )

            if result.success:
                xi_hat, mu_hat, sigma_hat = result.x
            else:
                # Fallback to method of moments
                xi_hat = 0.0
                mu_hat = sample_mean
                sigma_hat = sample_std

        except:
            xi_hat = 0.0
            mu_hat = sample_mean
            sigma_hat = sample_std

        # Compute return levels
        return_periods = [10, 50, 100, 500, 1000]
        return_levels = {}

        for T in return_periods:
            p = 1 - 1 / T

            if abs(xi_hat) < 1e-6:  # Gumbel case
                return_level = mu_hat - sigma_hat * np.log(-np.log(p))
            else:
                return_level = mu_hat + (sigma_hat / xi_hat) * (
                    (-np.log(p)) ** (-xi_hat) - 1
                )

            return_levels[f"{T}_year"] = return_level

        return {
            "shape_parameter": xi_hat,
            "location_parameter": mu_hat,
            "scale_parameter": sigma_hat,
            "return_levels": return_levels,
            "aic": 2 * 3 + 2 * gev_likelihood([xi_hat, mu_hat, sigma_hat]),
            "bic": 3 * np.log(len(block_maxima))
            + 2 * gev_likelihood([xi_hat, mu_hat, sigma_hat]),
        }

    def generalized_pareto_distribution(
        self, data: np.ndarray, threshold: Optional[float] = None
    ) -> Dict[str, float]:
        """Fit Generalized Pareto Distribution to exceedances over threshold"""
        if threshold is None:
            # Automatic threshold selection using sample quantile
            threshold = np.percentile(data, 90)

        # Extract exceedances
        exceedances = data[data > threshold] - threshold

        if len(exceedances) < 10:
            return {"error": "Insufficient exceedances"}

        # Fit GPD: F(x) = 1 - (1 + ξx/σ)^(-1/ξ)
        def gpd_likelihood(params):
            """Negative log-likelihood for GPD"""
            xi, sigma = params

            if sigma <= 0:
                return np.inf

            if xi == 0:
                # Exponential case
                log_likelihood = (
                    -len(exceedances) * np.log(sigma) - np.sum(exceedances) / sigma
                )
            else:
                y = 1 + xi * exceedances / sigma
                if np.any(y <= 0):
                    return np.inf

                log_likelihood = -len(exceedances) * np.log(sigma) - (
                    1 + 1 / xi
                ) * np.sum(np.log(y))

            return -log_likelihood

        # Initial estimates
        sample_mean = np.mean(exceedances)
        sample_var = np.var(exceedances)

        # Method of moments initial estimates
        if sample_var > 0:
            xi_init = 0.5 * (sample_mean**2 / sample_var - 1)
            sigma_init = sample_mean * (1 + xi_init)
        else:
            xi_init = 0.1
            sigma_init = sample_mean

        try:
            result = optimize.minimize(
                gpd_likelihood,
                [xi_init, sigma_init],
                method="L-BFGS-B",
                bounds=[(-0.5, 0.5), (0.01, None)],
            )

            if result.success:
                xi_hat, sigma_hat = result.x
            else:
                xi_hat, sigma_hat = xi_init, sigma_init

        except:
            xi_hat, sigma_hat = xi_init, sigma_init

        # Estimate high quantiles
        n = len(data)
        n_exceedances = len(exceedances)

        # Tail probability estimate
        tail_prob = n_exceedances / n

        # High quantile estimates
        quantile_levels = [0.99, 0.995, 0.999, 0.9995, 0.9999]
        quantile_estimates = {}

        for q in quantile_levels:
            if q > 1 - tail_prob:
                # Use GPD extrapolation
                p_cond = (q - (1 - tail_prob)) / tail_prob

                if abs(xi_hat) < 1e-6:  # Exponential case
                    exceedance_quantile = -sigma_hat * np.log(1 - p_cond)
                else:
                    exceedance_quantile = (sigma_hat / xi_hat) * (
                        (1 - p_cond) ** (-xi_hat) - 1
                    )

                quantile_estimates[f"q_{q}"] = threshold + exceedance_quantile
            else:
                # Use empirical quantile
                quantile_estimates[f"q_{q}"] = np.percentile(data, q * 100)

        return {
            "shape_parameter": xi_hat,
            "scale_parameter": sigma_hat,
            "threshold": threshold,
            "n_exceedances": n_exceedances,
            "exceedance_rate": tail_prob,
            "quantile_estimates": quantile_estimates,
            "mean_excess": np.mean(exceedances),
            "aic": 2 * 2 + 2 * gpd_likelihood([xi_hat, sigma_hat]),
        }

    def hill_estimator(
        self, data: np.ndarray, k: Optional[int] = None
    ) -> Dict[str, float]:
        """Hill estimator for tail index"""
        # Sort data in descending order
        sorted_data = np.sort(data)[::-1]

        if k is None:
            # Choose k as square root of sample size (rule of thumb)
            k = int(np.sqrt(len(data)))

        k = min(k, len(sorted_data) - 1)

        # Hill estimator: γ = (1/k) * Σ log(X_{i}/X_{k+1})
        if k > 0 and sorted_data[k] > 0:
            log_ratios = np.log(sorted_data[:k] / sorted_data[k])
            hill_estimate = np.mean(log_ratios)
        else:
            hill_estimate = 0.0

        # Asymptotic variance
        asymptotic_variance = hill_estimate**2 / k if k > 0 else np.inf

        # Confidence interval
        std_error = np.sqrt(asymptotic_variance)
        ci_95 = (hill_estimate - 1.96 * std_error, hill_estimate + 1.96 * std_error)

        return {
            "hill_estimate": hill_estimate,
            "k_threshold": k,
            "asymptotic_variance": asymptotic_variance,
            "confidence_interval_95": ci_95,
            "tail_index": 1.0 / hill_estimate if hill_estimate > 0 else np.inf,
        }


class CopulaModeling:
    """Copula modeling for dependency structure"""

    def __init__(self):
        self.copula_types = ["gaussian", "student_t", "clayton", "gumbel", "frank"]
        self.fitted_copulas = {}

    def gaussian_copula(self, U: np.ndarray) -> Dict[str, Any]:
        """Fit Gaussian copula"""
        # Transform to normal scores
        Z = stats.norm.ppf(np.clip(U, 1e-6, 1 - 1e-6))

        # Estimate correlation matrix
        correlation_matrix = np.corrcoef(Z.T)

        # Log-likelihood
        log_likelihood = 0.0
        for i in range(len(U)):
            try:
                # Multivariate normal density
                mvn_logpdf = stats.multivariate_normal.logpdf(
                    Z[i], cov=correlation_matrix
                )

                # Marginal normal densities
                marginal_logpdf = np.sum(stats.norm.logpdf(Z[i]))

                log_likelihood += mvn_logpdf - marginal_logpdf
            except:
                continue

        # AIC/BIC
        n_params = (
            U.shape[1] * (U.shape[1] - 1) // 2
        )  # Number of correlation parameters
        aic = -2 * log_likelihood + 2 * n_params
        bic = -2 * log_likelihood + n_params * np.log(len(U))

        return {
            "correlation_matrix": correlation_matrix,
            "log_likelihood": log_likelihood,
            "aic": aic,
            "bic": bic,
            "parameters": {"correlation": correlation_matrix},
        }

    def student_t_copula(self, U: np.ndarray) -> Dict[str, Any]:
        """Fit Student-t copula"""

        # Transform to t-scores (initial guess for degrees of freedom)
        def fit_t_copula(df):
            t_scores = stats.t.ppf(np.clip(U, 1e-6, 1 - 1e-6), df)

            # Estimate correlation matrix
            correlation_matrix = np.corrcoef(t_scores.T)

            # Log-likelihood
            log_likelihood = 0.0
            for i in range(len(U)):
                try:
                    # Multivariate t density (approximate)
                    quad_form = np.dot(
                        t_scores[i], np.linalg.solve(correlation_matrix, t_scores[i])
                    )
                    mvt_logpdf = (
                        -0.5 * (df + U.shape[1]) * np.log(1 + quad_form / df)
                        + 0.5 * np.log(np.linalg.det(correlation_matrix))
                        + 0.5 * U.shape[1] * np.log(df)
                    )

                    # Marginal t densities
                    marginal_logpdf = np.sum(stats.t.logpdf(t_scores[i], df))

                    log_likelihood += mvt_logpdf - marginal_logpdf
                except:
                    continue

            return -log_likelihood, correlation_matrix

        # Optimize over degrees of freedom
        df_candidates = [3, 5, 7, 10, 15, 20, 30]
        best_nll = np.inf
        best_df = 10
        best_corr = np.eye(U.shape[1])

        for df in df_candidates:
            try:
                nll, corr = fit_t_copula(df)
                if nll < best_nll:
                    best_nll = nll
                    best_df = df
                    best_corr = corr
            except:
                continue

        log_likelihood = -best_nll
        n_params = U.shape[1] * (U.shape[1] - 1) // 2 + 1  # Correlation + df
        aic = -2 * log_likelihood + 2 * n_params
        bic = -2 * log_likelihood + n_params * np.log(len(U))

        return {
            "correlation_matrix": best_corr,
            "degrees_of_freedom": best_df,
            "log_likelihood": log_likelihood,
            "aic": aic,
            "bic": bic,
            "parameters": {"correlation": best_corr, "df": best_df},
        }

    def archimedean_copula(
        self, U: np.ndarray, copula_type: str = "clayton"
    ) -> Dict[str, Any]:
        """Fit Archimedean copulas (Clayton, Gumbel, Frank)"""
        if U.shape[1] != 2:
            return {"error": "Archimedean copulas implemented for bivariate case only"}

        u1, u2 = U[:, 0], U[:, 1]

        def clayton_loglik(theta):
            if theta <= 0:
                return np.inf

            # Clayton copula density
            term1 = (1 + theta) * (u1 * u2) ** (-(1 + theta))
            term2 = (u1 ** (-theta) + u2 ** (-theta) - 1) ** (-(1 / theta + 2))

            # Avoid numerical issues
            term1 = np.clip(term1, 1e-10, 1e10)
            term2 = np.clip(term2, 1e-10, 1e10)

            log_density = np.log(term1) + np.log(term2)

            # Remove invalid values
            valid = np.isfinite(log_density)
            if np.sum(valid) == 0:
                return np.inf

            return -np.sum(log_density[valid])

        def gumbel_loglik(theta):
            if theta < 1:
                return np.inf

            # Gumbel copula density (simplified)
            log_u1 = np.log(-np.log(u1))
            log_u2 = np.log(-np.log(u2))

            A = (-log_u1) ** theta + (-log_u2) ** theta

            # Avoid numerical issues
            valid = (
                (u1 > 1e-6) & (u1 < 1 - 1e-6) & (u2 > 1e-6) & (u2 < 1 - 1e-6) & (A > 0)
            )

            if np.sum(valid) == 0:
                return np.inf

            log_density = (
                np.log(u1[valid])
                + np.log(u2[valid])
                + (theta - 1) * (log_u1[valid] + log_u2[valid])
                + np.log(A[valid] ** (1 / theta - 2))
                + np.log(theta - 1 + A[valid] ** (1 / theta))
            )

            return -np.sum(log_density)

        # Fit the specified copula
        if copula_type == "clayton":
            # Clayton parameter estimation
            tau_kendall = stats.kendalltau(u1, u2)[0]
            theta_init = 2 * tau_kendall / (1 - tau_kendall) if tau_kendall > 0 else 0.5

            try:
                result = optimize.minimize_scalar(
                    clayton_loglik, bounds=(0.1, 10), method="bounded"
                )
                theta_hat = result.x if result.success else theta_init
                log_likelihood = -clayton_loglik(theta_hat)
            except:
                theta_hat = theta_init
                log_likelihood = -clayton_loglik(theta_hat)

        elif copula_type == "gumbel":
            # Gumbel parameter estimation
            tau_kendall = stats.kendalltau(u1, u2)[0]
            theta_init = 1 / (1 - tau_kendall) if tau_kendall > 0 else 1.5

            try:
                result = optimize.minimize_scalar(
                    gumbel_loglik, bounds=(1.01, 10), method="bounded"
                )
                theta_hat = result.x if result.success else theta_init
                log_likelihood = -gumbel_loglik(theta_hat)
            except:
                theta_hat = theta_init
                log_likelihood = -gumbel_loglik(theta_hat)

        else:  # Frank copula (simplified)
            tau_kendall = stats.kendalltau(u1, u2)[0]
            theta_hat = 5.0 * tau_kendall  # Rough approximation
            log_likelihood = 0.0  # Placeholder

        aic = -2 * log_likelihood + 2 * 1  # 1 parameter
        bic = -2 * log_likelihood + 1 * np.log(len(U))

        return {
            "copula_type": copula_type,
            "theta": theta_hat,
            "log_likelihood": log_likelihood,
            "aic": aic,
            "bic": bic,
            "kendall_tau": stats.kendalltau(u1, u2)[0],
            "parameters": {"theta": theta_hat},
        }

    def select_best_copula(self, U: np.ndarray) -> Dict[str, Any]:
        """Select best copula using information criteria"""
        results = {}

        # Fit different copulas
        copula_results = {
            "gaussian": self.gaussian_copula(U),
            "student_t": self.student_t_copula(U),
        }

        # Add Archimedean copulas for bivariate case
        if U.shape[1] == 2:
            copula_results["clayton"] = self.archimedean_copula(U, "clayton")
            copula_results["gumbel"] = self.archimedean_copula(U, "gumbel")

        # Select best based on AIC
        best_aic = np.inf
        best_copula = "gaussian"

        for copula_name, result in copula_results.items():
            if "aic" in result and result["aic"] < best_aic:
                best_aic = result["aic"]
                best_copula = copula_name

        results["copula_comparison"] = copula_results
        results["best_copula"] = best_copula
        results["best_result"] = copula_results[best_copula]

        return results


class StochasticProcessModeling:
    """Stochastic process modeling for risk dynamics"""

    def __init__(self):
        self.fitted_processes = {}

    def ornstein_uhlenbeck_process(
        self, data: np.ndarray, dt: float = 1.0
    ) -> Dict[str, float]:
        """Fit Ornstein-Uhlenbeck process: dX_t = θ(μ - X_t)dt + σdW_t"""
        # Discrete version: X_{t+1} = X_t + θ(μ - X_t)Δt + σ√Δt ε_t
        # Rearrange: X_{t+1} - X_t = θμΔt - θX_t Δt + σ√Δt ε_t

        X = data[:-1]
        dX = np.diff(data)

        # Linear regression: dX = a + b*X + error
        # where a = θμΔt and b = -θΔt

        from sklearn.linear_model import LinearRegression

        reg = LinearRegression()
        reg.fit(X.reshape(-1, 1), dX)

        a = reg.intercept_
        b = reg.coef_[0]

        # Extract parameters
        theta = -b / dt
        mu = -a / b if b != 0 else np.mean(data)

        # Estimate sigma from residuals
        predictions = reg.predict(X.reshape(-1, 1))
        residuals = dX - predictions
        sigma = np.std(residuals) / np.sqrt(dt)

        # Mean reversion half-life
        half_life = np.log(2) / theta if theta > 0 else np.inf

        # Long-term variance
        long_term_variance = sigma**2 / (2 * theta) if theta > 0 else np.inf

        return {
            "theta": theta,
            "mu": mu,
            "sigma": sigma,
            "half_life": half_life,
            "long_term_variance": long_term_variance,
            "r_squared": reg.score(X.reshape(-1, 1), dX),
            "residual_std": np.std(residuals),
        }

    def jump_diffusion_process(
        self, data: np.ndarray, dt: float = 1.0
    ) -> Dict[str, Any]:
        """Fit jump-diffusion process (Merton model)"""
        returns = np.diff(np.log(data))

        # Detect jumps using threshold method
        return_std = np.std(returns)
        jump_threshold = 3 * return_std  # 3-sigma threshold

        # Identify potential jumps
        jump_mask = np.abs(returns) > jump_threshold
        normal_returns = returns[~jump_mask]
        jump_returns = returns[jump_mask]

        # Estimate diffusion parameters from normal returns
        if len(normal_returns) > 1:
            mu_diffusion = np.mean(normal_returns) / dt
            sigma_diffusion = np.std(normal_returns) / np.sqrt(dt)
        else:
            mu_diffusion = np.mean(returns) / dt
            sigma_diffusion = np.std(returns) / np.sqrt(dt)

        # Estimate jump parameters
        if len(jump_returns) > 0:
            lambda_jump = len(jump_returns) / len(returns) / dt  # Jump intensity
            mu_jump = np.mean(jump_returns - mu_diffusion * dt)  # Jump size mean
            sigma_jump = np.std(jump_returns) if len(jump_returns) > 1 else return_std
        else:
            lambda_jump = 0.0
            mu_jump = 0.0
            sigma_jump = 0.0

        # Model diagnostics
        total_variance = np.var(returns)
        diffusion_variance = sigma_diffusion**2 * dt
        jump_variance = lambda_jump * dt * (sigma_jump**2 + mu_jump**2)

        return {
            "mu_diffusion": mu_diffusion,
            "sigma_diffusion": sigma_diffusion,
            "lambda_jump": lambda_jump,
            "mu_jump": mu_jump,
            "sigma_jump": sigma_jump,
            "n_jumps": len(jump_returns),
            "jump_frequency": len(jump_returns) / len(returns),
            "variance_decomposition": {
                "total": total_variance,
                "diffusion": diffusion_variance,
                "jump": jump_variance,
                "jump_fraction": (
                    jump_variance / total_variance if total_variance > 0 else 0
                ),
            },
        }

    def regime_switching_model(
        self, data: np.ndarray, n_regimes: int = 2
    ) -> Dict[str, Any]:
        """Fit Markov regime-switching model"""
        from sklearn.mixture import GaussianMixture

        returns = np.diff(np.log(data))

        # Fit Gaussian mixture model
        gmm = GaussianMixture(n_components=n_regimes, random_state=42)
        gmm.fit(returns.reshape(-1, 1))

        # Extract regime parameters
        regime_means = gmm.means_.flatten()
        regime_stds = np.sqrt(gmm.covariances_.flatten())
        regime_weights = gmm.weights_

        # Predict regime probabilities
        regime_probs = gmm.predict_proba(returns.reshape(-1, 1))
        regime_assignments = gmm.predict(returns.reshape(-1, 1))

        # Estimate transition matrix (simplified)
        transition_matrix = np.zeros((n_regimes, n_regimes))

        for i in range(len(regime_assignments) - 1):
            current_regime = regime_assignments[i]
            next_regime = regime_assignments[i + 1]
            transition_matrix[current_regime, next_regime] += 1

        # Normalize rows
        for i in range(n_regimes):
            row_sum = np.sum(transition_matrix[i])
            if row_sum > 0:
                transition_matrix[i] /= row_sum

        # Expected duration in each regime
        expected_durations = []
        for i in range(n_regimes):
            if transition_matrix[i, i] < 1:
                duration = 1 / (1 - transition_matrix[i, i])
            else:
                duration = np.inf
            expected_durations.append(duration)

        return {
            "n_regimes": n_regimes,
            "regime_means": regime_means,
            "regime_stds": regime_stds,
            "regime_weights": regime_weights,
            "transition_matrix": transition_matrix,
            "expected_durations": expected_durations,
            "regime_probabilities": regime_probs,
            "regime_assignments": regime_assignments,
            "aic": gmm.aic(returns.reshape(-1, 1)),
            "bic": gmm.bic(returns.reshape(-1, 1)),
            "log_likelihood": gmm.score(returns.reshape(-1, 1)) * len(returns),
        }


class EnhancedRiskManagement:
    """Main enhanced risk management system"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}

        # Initialize components
        self.extreme_value = ExtremeValueTheory()
        self.copula_modeling = CopulaModeling()
        self.stochastic_processes = StochasticProcessModeling()

        # Risk assessment history
        self.risk_history = []

    def comprehensive_risk_assessment(
        self,
        portfolio_returns: np.ndarray,
        individual_returns: Optional[np.ndarray] = None,
        confidence_levels: List[float] = None,
    ) -> RiskAssessmentResult:
        """Comprehensive risk assessment using advanced mathematical methods"""
        if confidence_levels is None:
            confidence_levels = [0.90, 0.95, 0.99, 0.995, 0.999]

        start_time = time.time()

        # 1. Value at Risk (VaR) estimation
        var_estimates = {}
        for alpha in confidence_levels:
            # Historical VaR
            historical_var = np.percentile(portfolio_returns, (1 - alpha) * 100)
            var_estimates[f"historical_{alpha}"] = historical_var

            # Parametric VaR (assuming normal)
            mean_return = np.mean(portfolio_returns)
            std_return = np.std(portfolio_returns)
            parametric_var = mean_return + std_return * stats.norm.ppf(1 - alpha)
            var_estimates[f"parametric_{alpha}"] = parametric_var

        # 2. Conditional Value at Risk (Expected Shortfall)
        cvar_estimates = {}
        for alpha in confidence_levels:
            threshold = var_estimates[f"historical_{alpha}"]
            tail_losses = portfolio_returns[portfolio_returns <= threshold]

            if len(tail_losses) > 0:
                cvar = np.mean(tail_losses)
            else:
                cvar = threshold

            cvar_estimates[f"cvar_{alpha}"] = cvar

        # 3. Extreme Value Theory analysis
        evt_results = {}

        # GEV for block maxima
        gev_result = self.extreme_value.generalized_extreme_value(
            -portfolio_returns
        )  # Use negative for losses
        evt_results["gev"] = gev_result

        # GPD for tail analysis
        gpd_result = self.extreme_value.generalized_pareto_distribution(
            -portfolio_returns
        )
        evt_results["gpd"] = gpd_result

        # Hill estimator
        hill_result = self.extreme_value.hill_estimator(-portfolio_returns)
        evt_results["hill"] = hill_result

        # 4. Copula analysis (if individual asset returns provided)
        copula_results = {}
        correlation_structure = np.eye(1)

        if individual_returns is not None and individual_returns.shape[1] > 1:
            # Convert to uniform margins
            from scipy.stats import rankdata

            U = np.zeros_like(individual_returns)

            for i in range(individual_returns.shape[1]):
                ranks = rankdata(individual_returns[:, i])
                U[:, i] = ranks / (len(ranks) + 1)

            # Fit copula models
            copula_results = self.copula_modeling.select_best_copula(U)

            # Correlation structure
            correlation_structure = np.corrcoef(individual_returns.T)

        # 5. Stochastic process modeling
        process_results = {}

        # Ornstein-Uhlenbeck
        ou_result = self.stochastic_processes.ornstein_uhlenbeck_process(
            portfolio_returns
        )
        process_results["ornstein_uhlenbeck"] = ou_result

        # Jump-diffusion
        if len(portfolio_returns) > 10:
            # Create price series (cumulative returns)
            price_series = np.cumsum(portfolio_returns)
            price_series = np.exp(
                price_series - price_series[0]
            )  # Normalize to start at 1

            jd_result = self.stochastic_processes.jump_diffusion_process(price_series)
            process_results["jump_diffusion"] = jd_result

        # Regime switching
        if len(portfolio_returns) > 50:
            rs_result = self.stochastic_processes.regime_switching_model(
                np.cumsum(portfolio_returns)
            )
            process_results["regime_switching"] = rs_result

        # 6. Monte Carlo simulation for portfolio risk
        mc_results = self._monte_carlo_risk_simulation(
            portfolio_returns, n_simulations=10000
        )

        # 7. Stress testing
        stress_results = self._stress_testing(portfolio_returns)

        # 8. Risk decomposition and attribution
        risk_decomp = self._risk_decomposition(portfolio_returns, individual_returns)

        # 9. Portfolio optimization metrics
        portfolio_metrics = self._portfolio_risk_metrics(portfolio_returns)

        # 10. Volatility forecasting
        volatility_forecasts = self._volatility_forecasting(portfolio_returns)

        # 11. Capital allocation
        capital_allocation = self._risk_based_capital_allocation(
            portfolio_returns, individual_returns
        )

        # Create comprehensive result
        result = RiskAssessmentResult(
            value_at_risk=var_estimates,
            conditional_var=cvar_estimates,
            tail_statistics=evt_results,
            extreme_value_parameters=evt_results,
            correlation_structure=correlation_structure,
            copula_parameters=copula_results,
            portfolio_metrics=portfolio_metrics,
            stress_test_results=stress_results,
            monte_carlo_simulation=mc_results,
            regime_switching_parameters=process_results.get("regime_switching", {}),
            jump_diffusion_parameters=process_results.get("jump_diffusion", {}),
            volatility_forecasts=volatility_forecasts,
            risk_decomposition=risk_decomp,
            capital_allocation=capital_allocation,
        )

        # Store in history
        self.risk_history.append(
            {
                "timestamp": time.time(),
                "processing_time": time.time() - start_time,
                "result": result,
            }
        )

        logger.info(
            f"Comprehensive risk assessment completed in {time.time() - start_time:.3f}s"
        )

        return result

    def _monte_carlo_risk_simulation(
        self, returns: np.ndarray, n_simulations: int = 10000
    ) -> Dict[str, np.ndarray]:
        """Monte Carlo simulation for risk assessment"""
        # Fit return distribution
        mean_return = np.mean(returns)
        std_return = np.std(returns)

        # Generate scenarios
        scenarios = np.random.normal(
            mean_return, std_return, (n_simulations, len(returns))
        )

        # Portfolio value paths
        portfolio_paths = np.cumprod(1 + scenarios, axis=1)

        # Risk metrics from simulation
        final_values = portfolio_paths[:, -1]
        min_values = np.min(portfolio_paths, axis=1)
        max_drawdowns = (
            1 - min_values / np.maximum.accumulate(portfolio_paths, axis=1)[:, -1]
        )

        return {
            "portfolio_paths": portfolio_paths[:100],  # Store subset for memory
            "final_values": final_values,
            "max_drawdowns": max_drawdowns,
            "percentiles": {
                "p5": np.percentile(final_values, 5),
                "p10": np.percentile(final_values, 10),
                "p25": np.percentile(final_values, 25),
                "p50": np.percentile(final_values, 50),
                "p75": np.percentile(final_values, 75),
                "p90": np.percentile(final_values, 90),
                "p95": np.percentile(final_values, 95),
            },
        }

    def _stress_testing(self, returns: np.ndarray) -> Dict[str, float]:
        """Stress testing scenarios"""
        mean_return = np.mean(returns)
        std_return = np.std(returns)

        # Define stress scenarios
        stress_scenarios = {
            "market_crash_1987": -0.20,  # -20% single day
            "market_crash_2008": -0.10,  # -10% scenario
            "vol_spike_2x": mean_return - 2 * std_return,
            "vol_spike_3x": mean_return - 3 * std_return,
            "interest_rate_shock": mean_return - 1.5 * std_return,
            "liquidity_crisis": mean_return - 2.5 * std_return,
        }

        # Simulate portfolio impact
        stress_results = {}

        for scenario_name, shock in stress_scenarios.items():
            # Simple linear impact (in practice, would be more sophisticated)
            portfolio_impact = shock

            # Recovery simulation (mean reversion)
            recovery_periods = [1, 5, 10, 20]
            recovery_probs = {}

            for period in recovery_periods:
                # Probability of recovery within period (simplified)
                recovery_rate = mean_return * period
                recovery_prob = (
                    1 - np.exp(-recovery_rate / abs(shock)) if shock < 0 else 1.0
                )
                recovery_probs[f"{period}_periods"] = min(1.0, max(0.0, recovery_prob))

            stress_results[scenario_name] = {
                "immediate_impact": portfolio_impact,
                "recovery_probabilities": recovery_probs,
            }

        return stress_results

    def _risk_decomposition(
        self,
        portfolio_returns: np.ndarray,
        individual_returns: Optional[np.ndarray] = None,
    ) -> Dict[str, float]:
        """Risk decomposition and attribution"""
        decomposition = {}

        # Portfolio variance decomposition
        portfolio_var = np.var(portfolio_returns)
        decomposition["total_variance"] = portfolio_var
        decomposition["volatility"] = np.sqrt(portfolio_var)

        if individual_returns is not None:
            # Component contributions (simplified equal weighting assumption)
            n_assets = individual_returns.shape[1]
            weights = np.ones(n_assets) / n_assets

            # Marginal risk contributions
            marginal_contributions = {}
            component_vars = np.var(individual_returns, axis=0)

            for i in range(n_assets):
                marginal_var = component_vars[i]
                contribution = (
                    weights[i] * marginal_var / portfolio_var
                    if portfolio_var > 0
                    else 0
                )
                marginal_contributions[f"asset_{i}"] = contribution

            decomposition["marginal_contributions"] = marginal_contributions

            # Diversification ratio
            weighted_vol = np.sum(weights * np.sqrt(component_vars))
            diversification_ratio = (
                weighted_vol / np.sqrt(portfolio_var) if portfolio_var > 0 else 1.0
            )
            decomposition["diversification_ratio"] = diversification_ratio

        return decomposition

    def _portfolio_risk_metrics(self, returns: np.ndarray) -> Dict[str, float]:
        """Standard portfolio risk metrics"""
        metrics = {}

        # Basic statistics
        metrics["mean_return"] = np.mean(returns)
        metrics["volatility"] = np.std(returns)
        metrics["skewness"] = stats.skew(returns)
        metrics["kurtosis"] = stats.kurtosis(returns)

        # Risk-adjusted returns
        risk_free_rate = 0.02 / 252  # Assume 2% annual risk-free rate, daily

        if metrics["volatility"] > 0:
            metrics["sharpe_ratio"] = (
                metrics["mean_return"] - risk_free_rate
            ) / metrics["volatility"]
        else:
            metrics["sharpe_ratio"] = 0.0

        # Sortino ratio (downside deviation)
        downside_returns = returns[returns < risk_free_rate]
        if len(downside_returns) > 0:
            downside_deviation = np.sqrt(
                np.mean((downside_returns - risk_free_rate) ** 2)
            )
            if downside_deviation > 0:
                metrics["sortino_ratio"] = (
                    metrics["mean_return"] - risk_free_rate
                ) / downside_deviation
            else:
                metrics["sortino_ratio"] = 0.0
        else:
            metrics["sortino_ratio"] = np.inf

        # Maximum drawdown
        cumulative_returns = np.cumprod(1 + returns)
        peak = np.maximum.accumulate(cumulative_returns)
        drawdown = (cumulative_returns - peak) / peak
        metrics["max_drawdown"] = np.min(drawdown)

        # Calmar ratio
        if abs(metrics["max_drawdown"]) > 1e-8:
            metrics["calmar_ratio"] = (
                metrics["mean_return"] * 252 / abs(metrics["max_drawdown"])
            )
        else:
            metrics["calmar_ratio"] = np.inf

        return metrics

    def _volatility_forecasting(
        self, returns: np.ndarray, horizon: int = 22
    ) -> Dict[str, np.ndarray]:
        """Volatility forecasting using multiple models"""
        forecasts = {}

        # 1. EWMA (Exponentially Weighted Moving Average)
        lambda_ewma = 0.94  # RiskMetrics parameter

        ewma_var = np.zeros(len(returns))
        ewma_var[0] = np.var(returns[: min(50, len(returns))])  # Initial variance

        for t in range(1, len(returns)):
            ewma_var[t] = (
                lambda_ewma * ewma_var[t - 1] + (1 - lambda_ewma) * returns[t - 1] ** 2
            )

        # Forecast next period
        next_var = lambda_ewma * ewma_var[-1] + (1 - lambda_ewma) * returns[-1] ** 2
        ewma_forecast = [np.sqrt(next_var)] * horizon

        forecasts["ewma"] = np.array(ewma_forecast)

        # 2. GARCH(1,1) simplified estimation
        def garch_likelihood(params):
            omega, alpha, beta = params

            if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
                return np.inf

            variance = np.zeros(len(returns))
            variance[0] = np.var(returns)

            log_likelihood = 0
            for t in range(1, len(returns)):
                variance[t] = (
                    omega + alpha * returns[t - 1] ** 2 + beta * variance[t - 1]
                )
                if variance[t] <= 0:
                    return np.inf
                log_likelihood += -0.5 * (
                    np.log(variance[t]) + returns[t] ** 2 / variance[t]
                )

            return -log_likelihood

        # Simple parameter estimation
        try:
            initial_params = [0.1 * np.var(returns), 0.1, 0.8]
            result = optimize.minimize(
                garch_likelihood,
                initial_params,
                bounds=[(1e-6, None), (0, 0.3), (0, 0.95)],
                method="L-BFGS-B",
            )

            if result.success:
                omega, alpha, beta = result.x

                # Generate forecast
                last_variance = (
                    omega + alpha * returns[-1] ** 2 + beta * np.var(returns[-10:])
                )

                garch_forecast = []
                for h in range(horizon):
                    # Multi-step ahead variance forecast
                    if h == 0:
                        var_h = omega + alpha * returns[-1] ** 2 + beta * last_variance
                    else:
                        # Long-run variance
                        long_run_var = omega / (1 - alpha - beta)
                        var_h = long_run_var + (alpha + beta) ** h * (
                            last_variance - long_run_var
                        )

                    garch_forecast.append(np.sqrt(var_h))

                forecasts["garch"] = np.array(garch_forecast)
            else:
                forecasts["garch"] = forecasts["ewma"]  # Fallback

        except:
            forecasts["garch"] = forecasts["ewma"]  # Fallback

        # 3. Historical volatility (rolling window)
        window = min(30, len(returns) // 2)
        hist_vol = np.std(returns[-window:])
        forecasts["historical"] = np.full(horizon, hist_vol)

        return forecasts

    def _risk_based_capital_allocation(
        self,
        portfolio_returns: np.ndarray,
        individual_returns: Optional[np.ndarray] = None,
    ) -> Dict[str, float]:
        """Risk-based capital allocation"""
        allocation = {}

        if individual_returns is not None:
            # Component VaRs
            component_vars = []
            for i in range(individual_returns.shape[1]):
                component_var = np.percentile(individual_returns[:, i], 5)  # 95% VaR
                component_vars.append(abs(component_var))

            # Allocate capital proportional to risk
            total_var = sum(component_vars)

            for i, var in enumerate(component_vars):
                allocation[f"asset_{i}"] = (
                    var / total_var if total_var > 0 else 1.0 / len(component_vars)
                )

        # Portfolio-level capital requirement
        portfolio_var = abs(np.percentile(portfolio_returns, 5))
        allocation["total_capital_requirement"] = portfolio_var

        # Economic capital (stressed VaR)
        stressed_var = abs(np.percentile(portfolio_returns, 1))  # 99% VaR
        allocation["economic_capital"] = stressed_var

        return allocation


# Global enhanced risk management instance
enhanced_risk_management = EnhancedRiskManagement()
