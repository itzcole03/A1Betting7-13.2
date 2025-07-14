"""Enhanced Mathematical Prediction Engine
Applying advanced statistical mechanics, information theory, and Bayesian inference
to sports prediction with rigorous mathematical foundations
"""

import logging
import math
import time
import warnings
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch
from scipy import stats
from scipy.special import digamma, logsumexp
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel, Matern, WhiteKernel
from torch import nn

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)


@dataclass
class BayesianPredictionResult:
    """Bayesian prediction with full uncertainty quantification"""

    mean_prediction: float
    variance: float
    credible_intervals: Dict[str, Tuple[float, float]]
    posterior_samples: np.ndarray
    evidence: float  # Model evidence (marginal likelihood)
    information_criteria: Dict[str, float]
    predictive_distribution: Dict[str, Any]
    epistemic_uncertainty: float  # Model uncertainty
    aleatoric_uncertainty: float  # Data uncertainty
    mutual_information: float
    entropy: float


class BayesianNeuralNetwork(nn.Module):
    """Bayesian Neural Network with variational inference"""

    def __init__(self, input_dim: int, hidden_dims: List[int], output_dim: int):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dims = hidden_dims
        self.output_dim = output_dim

        # Variational parameters for weights (mean and log variance)
        self.weight_means = nn.ParameterList()
        self.weight_log_vars = nn.ParameterList()

        # Build network architecture
        dims = [input_dim] + hidden_dims + [output_dim]
        for i in range(len(dims) - 1):
            weight_mean = nn.Parameter(torch.randn(dims[i], dims[i + 1]) * 0.1)
            weight_log_var = nn.Parameter(torch.full((dims[i], dims[i + 1]), -3.0))
            self.weight_means.append(weight_mean)
            self.weight_log_vars.append(weight_log_var)

        # Prior parameters
        self.prior_mean = 0.0
        self.prior_var = 1.0

        # Noise precision (inverse variance)
        self.log_noise_precision = nn.Parameter(torch.tensor(0.0))

    def sample_weights(self, n_samples: int = 1) -> List[List[torch.Tensor]]:
        """Sample weights from variational posterior"""
        weight_samples = []

        for _ in range(n_samples):
            sample = []
            for mean, log_var in zip(self.weight_means, self.weight_log_vars):
                std = torch.exp(0.5 * log_var)
                eps = torch.randn_like(mean)
                weight = mean + std * eps
                sample.append(weight)
            weight_samples.append(sample)

        return weight_samples

    def kl_divergence(self) -> torch.Tensor:
        """KL divergence between posterior and prior"""
        kl = 0.0

        for mean, log_var in zip(self.weight_means, self.weight_log_vars):
            var = torch.exp(log_var)

            # KL(q(w)||p(w)) for Gaussian distributions
            kl += 0.5 * torch.sum(
                (var + mean**2) / self.prior_var
                - 1
                - log_var
                + math.log(self.prior_var)
            )

        return kl

    def forward(
        self, x: torch.Tensor, n_samples: int = 10
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """Forward pass with uncertainty quantification"""
        x.size(0)

        # Sample multiple weight configurations
        weight_samples = self.sample_weights(n_samples)
        predictions = []

        for weights in weight_samples:
            hidden = x
            for i, weight in enumerate(weights[:-1]):
                hidden = torch.relu(torch.mm(hidden, weight))

            # Output layer
            output = torch.mm(hidden, weights[-1])
            predictions.append(output)

        predictions = torch.stack(
            predictions, dim=0
        )  # [n_samples, batch_size, output_dim]

        # Compute statistics
        mean_pred = torch.mean(predictions, dim=0)
        var_pred = torch.var(predictions, dim=0)

        return mean_pred, var_pred

    def elbo_loss(
        self, x: torch.Tensor, y: torch.Tensor, n_samples: int = 10
    ) -> torch.Tensor:
        """Evidence Lower BOund (ELBO) loss"""
        mean_pred, var_pred = self(x, n_samples)

        # Likelihood term (negative log likelihood)
        noise_precision = torch.exp(self.log_noise_precision)
        likelihood = -0.5 * noise_precision * torch.sum((y - mean_pred) ** 2)
        likelihood += 0.5 * len(y) * self.log_noise_precision
        likelihood -= 0.5 * len(y) * math.log(2 * math.pi)

        # KL divergence term
        kl_div = self.kl_divergence()

        # ELBO = likelihood - KL divergence
        elbo = likelihood - kl_div

        return -elbo  # Return negative ELBO for minimization


class InformationTheoreticPredictor:
    """Predictor using information theory principles"""

    def __init__(self, alpha: float = 1.0, beta: float = 1.0):
        self.alpha = alpha  # Concentration parameter for Dirichlet prior
        self.beta = beta  # Rate parameter for Gamma prior
        self.feature_entropy = {}
        self.mutual_information_matrix = None
        self.feature_importance_entropy = {}

    def compute_differential_entropy(self, data: np.ndarray) -> float:
        """Compute differential entropy using kernel density estimation"""
        from scipy.stats import gaussian_kde

        if data.ndim == 1:
            data = data.reshape(-1, 1)

        # Use Gaussian KDE for density estimation
        kde = gaussian_kde(data.T)

        # Sample points for entropy estimation
        n_samples = 1000
        samples = kde.resample(n_samples).T
        log_density = kde.logpdf(samples.T)

        # Differential entropy: -∫ p(x) log p(x) dx ≈ -E[log p(x)]
        entropy = -np.mean(log_density)

        return float(entropy)

    def compute_mutual_information(
        self, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, float]:
        """Compute mutual information between features and target"""
        from sklearn.feature_selection import mutual_info_regression

        # Compute MI for each feature
        mi_scores = mutual_info_regression(X, y, random_state=42)

        feature_mi = {}
        for i, score in enumerate(mi_scores):
            feature_mi[f"feature_{i}"] = float(score)

        return feature_mi

    def information_gain_feature_selection(
        self, X: np.ndarray, y: np.ndarray, k: int = 10
    ) -> np.ndarray:
        """Select features based on information gain"""
        X.shape[1]

        # Compute mutual information for all features
        mi_scores = self.compute_mutual_information(X, y)

        # Sort by MI score and select top k
        sorted_features = sorted(mi_scores.items(), key=lambda x: x[1], reverse=True)
        selected_indices = [int(feat.split("_")[1]) for feat, _ in sorted_features[:k]]

        return np.array(selected_indices)

    def compute_predictive_information(
        self, predictions: np.ndarray, true_values: np.ndarray
    ) -> Dict[str, float]:
        """Compute predictive information metrics"""
        # Prediction entropy
        pred_entropy = self.compute_differential_entropy(predictions)

        # True value entropy
        true_entropy = self.compute_differential_entropy(true_values)

        # Joint entropy (approximate)
        joint_data = np.column_stack([predictions, true_values])
        joint_entropy = self.compute_differential_entropy(joint_data)

        # Mutual information: I(X;Y) = H(X) + H(Y) - H(X,Y)
        mutual_info = pred_entropy + true_entropy - joint_entropy

        # Normalized mutual information
        normalized_mi = (
            mutual_info / min(pred_entropy, true_entropy)
            if min(pred_entropy, true_entropy) > 0
            else 0
        )

        # Information gain ratio
        info_gain_ratio = mutual_info / true_entropy if true_entropy > 0 else 0

        return {
            "prediction_entropy": pred_entropy,
            "true_entropy": true_entropy,
            "joint_entropy": joint_entropy,
            "mutual_information": mutual_info,
            "normalized_mutual_information": normalized_mi,
            "information_gain_ratio": info_gain_ratio,
        }


class StatisticalMechanicsPredictor:
    """Predictor using statistical mechanics principles"""

    def __init__(self, temperature: float = 1.0, ensemble_size: int = 100):
        self.temperature = temperature
        self.ensemble_size = ensemble_size
        self.energy_function = None
        self.partition_function = None
        self.free_energy = None

    def energy_function_quadratic(
        self, predictions: np.ndarray, targets: np.ndarray, weights: np.ndarray
    ) -> float:
        """Quadratic energy function: E = ||y - f(x)||² + λ||w||²"""
        prediction_error = np.sum((targets - predictions) ** 2)
        weight_penalty = np.sum(weights**2)
        return prediction_error + 0.01 * weight_penalty

    def compute_partition_function(
        self, X: np.ndarray, y: np.ndarray, weight_samples: List[np.ndarray]
    ) -> float:
        """Compute partition function Z = ∑ exp(-βE)"""
        beta = 1.0 / self.temperature
        log_weights = []

        for weights in weight_samples:
            # Compute predictions with these weights
            predictions = self.predict_with_weights(X, weights)
            energy = self.energy_function_quadratic(predictions, y, weights)
            log_weights.append(-beta * energy)

        # Use logsumexp for numerical stability
        log_Z = logsumexp(log_weights)
        return np.exp(log_Z)

    def predict_with_weights(self, X: np.ndarray, weights: np.ndarray) -> np.ndarray:
        """Linear prediction with given weights"""
        return X @ weights

    def gibbs_sampling(
        self, X: np.ndarray, y: np.ndarray, n_samples: int = 1000
    ) -> np.ndarray:
        """Gibbs sampling for Bayesian inference"""
        n_features = X.shape[1]
        samples = np.zeros((n_samples, n_features))

        # Initialize weights randomly
        current_weights = np.random.normal(0, 0.1, n_features)

        beta = 1.0 / self.temperature

        for i in range(n_samples):
            for _ in range(n_features):
                # Sample weight j conditioned on all others
                other_weights = current_weights.copy()

                # Grid search for this weight (simplified)
                weight_candidates = np.linspace(-2, 2, 21)
                log_probs = []

                for w_candidate in weight_candidates:
                    other_weights[j] = w_candidate
                    predictions = self.predict_with_weights(X, other_weights)
                    energy = self.energy_function_quadratic(
                        predictions, y, other_weights
                    )
                    log_probs.append(-beta * energy)

                # Sample from conditional distribution
                probs = np.exp(log_probs - logsumexp(log_probs))
                chosen_idx = np.random.choice(len(weight_candidates), p=probs)
                current_weights[j] = weight_candidates[chosen_idx]

            samples[i] = current_weights.copy()

        return samples

    def thermodynamic_integration(
        self, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, float]:
        """Compute thermodynamic quantities"""
        # Sample weights using Gibbs sampling
        weight_samples = self.gibbs_sampling(X, y, self.ensemble_size)

        # Compute ensemble averages
        energies = []
        for weights in weight_samples:
            predictions = self.predict_with_weights(X, weights)
            energy = self.energy_function_quadratic(predictions, y, weights)
            energies.append(energy)

        energies = np.array(energies)

        # Thermodynamic quantities
        mean_energy = np.mean(energies)
        energy_variance = np.var(energies)

        # Heat capacity: C = β²⟨(E - ⟨E⟩)²⟩
        beta = 1.0 / self.temperature
        heat_capacity = (beta**2) * energy_variance

        # Free energy (approximate): F = ⟨E⟩ - TS where S ≈ log(Z)
        entropy_approx = np.log(len(weight_samples))  # Simplified
        free_energy = mean_energy - self.temperature * entropy_approx

        return {
            "mean_energy": mean_energy,
            "energy_variance": energy_variance,
            "heat_capacity": heat_capacity,
            "free_energy": free_energy,
            "temperature": self.temperature,
            "entropy_estimate": entropy_approx,
        }


class AdvancedGaussianProcess:
    """Advanced Gaussian Process with custom kernels and hyperparameter optimization"""

    def __init__(self):
        self.gp_models = {}
        self.kernel_library = {}
        self.hyperparameters = {}
        self._build_kernel_library()

    def _build_kernel_library(self):
        """Build library of advanced kernels"""

        # Spectral Mixture Kernel (approximate)
        def spectral_mixture_kernel(X1, X2, frequencies, weights, lengthscales):
            """Spectral mixture kernel for capturing periodicity"""
            K = np.zeros((len(X1), len(X2)))

            for i, (freq, weight, ls) in enumerate(
                zip(frequencies, weights, lengthscales)
            ):
                # Compute pairwise distances
                dists = np.linalg.norm(X1[:, None] - X2[None, :], axis=2)

                # Spectral component
                cos_component = np.cos(2 * np.pi * freq * dists)
                exp_component = np.exp(-2 * (np.pi * freq * ls) ** 2 * dists**2)

                K += weight * cos_component * exp_component

            return K

        # Neural Network Kernel
        def neural_network_kernel(X1, X2, weight_variance, bias_variance):
            """Neural network kernel"""

            def sigma(x):
                return np.arcsin(x / np.sqrt(1 + x))

            # Gram matrix computation
            X1_norm = X1 / np.linalg.norm(X1, axis=1, keepdims=True)
            X2_norm = X2 / np.linalg.norm(X2, axis=1, keepdims=True)

            gram = weight_variance * (X1_norm @ X2_norm.T) + bias_variance

            return sigma(gram)

        self.kernel_library = {
            "spectral_mixture": spectral_mixture_kernel,
            "neural_network": neural_network_kernel,
        }

    def automatic_relevance_determination(
        self, X: np.ndarray, y: np.ndarray
    ) -> Dict[str, float]:
        """Automatic Relevance Determination using GP"""
        # ARD RBF kernel with different lengthscales for each dimension
        kernel = ConstantKernel() * RBF(
            length_scale=[1.0] * X.shape[1], length_scale_bounds=(1e-5, 1e5)
        )

        gp = GaussianProcessRegressor(
            kernel=kernel, alpha=1e-6, normalize_y=True, n_restarts_optimizer=10
        )

        gp.fit(X, y)

        # Extract learned lengthscales
        lengthscales = gp.kernel_.k2.length_scale

        # Compute relevance weights (inverse of lengthscale)
        relevance_weights = 1.0 / lengthscales
        relevance_weights = relevance_weights / np.sum(relevance_weights)  # Normalize

        # Feature importance based on lengthscales
        feature_importance = {}
        for i, weight in enumerate(relevance_weights):
            feature_importance[f"feature_{i}"] = float(weight)

        return feature_importance

    def bayesian_optimization_acquisition(
        self, X_train: np.ndarray, y_train: np.ndarray, X_candidates: np.ndarray
    ) -> Dict[str, np.ndarray]:
        """Compute acquisition functions for Bayesian optimization"""
        # Fit GP
        kernel = ConstantKernel() * Matern(length_scale=1.0, nu=2.5) + WhiteKernel()
        gp = GaussianProcessRegressor(kernel=kernel, alpha=1e-6)
        gp.fit(X_train, y_train)

        # Predict on candidates
        mean_pred, std_pred = gp.predict(X_candidates, return_std=True)

        # Current best value
        f_best = np.max(y_train)

        # Expected Improvement
        z = (mean_pred - f_best) / (std_pred + 1e-9)
        ei = (mean_pred - f_best) * stats.norm.cdf(z) + std_pred * stats.norm.pdf(z)

        # Upper Confidence Bound
        kappa = 2.0  # Exploration parameter
        ucb = mean_pred + kappa * std_pred

        # Probability of Improvement
        pi = stats.norm.cdf(z)

        # Entropy Search (simplified)
        entropy_reduction = 0.5 * np.log(2 * np.pi * np.e * std_pred**2)

        return {
            "expected_improvement": ei,
            "upper_confidence_bound": ucb,
            "probability_of_improvement": pi,
            "entropy_reduction": entropy_reduction,
            "posterior_mean": mean_pred,
            "posterior_std": std_pred,
        }


class NonparametricBayesianRegressor:
    """Nonparametric Bayesian regression using Dirichlet Process mixtures"""

    def __init__(self, alpha: float = 1.0, max_components: int = 10):
        self.alpha = alpha  # DP concentration parameter
        self.max_components = max_components
        self.components = []
        self.weights = []
        self.posterior_samples = None

    def stick_breaking_weights(self, alpha: float, num_components: int) -> np.ndarray:
        """Generate weights using stick-breaking construction"""
        betas = np.random.beta(1, alpha, num_components)
        weights = np.zeros(num_components)

        remaining_weight = 1.0
        for i in range(num_components - 1):
            weights[i] = betas[i] * remaining_weight
            remaining_weight *= 1 - betas[i]
        weights[-1] = remaining_weight

        return weights

    def fit_variational_inference(
        self, X: np.ndarray, y: np.ndarray, max_iter: int = 100
    ) -> Dict[str, Any]:
        """Variational inference for DP mixture of linear regressors"""
        n_samples, n_features = X.shape
        K = self.max_components

        # Initialize variational parameters
        # For each component: mean and precision of weight posterior
        mean_weights = np.random.normal(0, 0.1, (K, n_features))
        precision_weights = np.ones((K, n_features))

        # Stick-breaking weights
        gamma_1 = np.ones(K)
        gamma_2 = np.full(K, self.alpha)

        # Responsibility parameters
        responsibilities = np.random.dirichlet(np.ones(K), n_samples)

        # ELBO tracking
        elbo_history = []

        for iteration in range(max_iter):
            # Update responsibilities (E-step)
            for i in range(n_samples):
                log_responsibilities = np.zeros(K)

                for k in range(K):
                    # Compute expected log likelihood under component k
                    pred_mean = X[i] @ mean_weights[k]
                    pred_var = np.sum(X[i] ** 2 / precision_weights[k])

                    log_lik = -0.5 * (y[i] - pred_mean) ** 2 / (1 + pred_var)
                    log_lik -= 0.5 * np.log(2 * np.pi * (1 + pred_var))

                    # Expected log weight
                    expected_log_weight = (
                        digamma(gamma_1[k])
                        - digamma(gamma_1[k] + gamma_2[k])
                        + np.sum(
                            [
                                digamma(gamma_2[j]) - digamma(gamma_1[j] + gamma_2[j])
                                for _ in range(k)
                            ]
                        )
                    )

                    log_responsibilities[k] = log_lik + expected_log_weight

                # Normalize responsibilities
                responsibilities[i] = np.exp(
                    log_responsibilities - logsumexp(log_responsibilities)
                )

            # Update component parameters (M-step)
            for k in range(K):
                Nk = np.sum(responsibilities[:, k])

                if Nk > 1e-8:  # Avoid division by zero
                    # Update weight posterior
                    weighted_X = X.T @ responsibilities[:, k, None]
                    weighted_y = responsibilities[:, k] @ y

                    # Precision update (simplified)
                    precision_weights[k] = 1.0 + Nk

                    # Mean update
                    mean_weights[k] = weighted_X.flatten() / (1.0 + Nk)

                # Update stick-breaking parameters
                gamma_1[k] = 1.0 + np.sum(responsibilities[:, k])
                gamma_2[k] = self.alpha + np.sum(responsibilities[:, k + 1 :])

            # Compute ELBO (simplified)
            elbo = self._compute_elbo(
                X,
                y,
                responsibilities,
                mean_weights,
                precision_weights,
                gamma_1,
                gamma_2,
            )
            elbo_history.append(elbo)

            # Check convergence
            if iteration > 10 and abs(elbo_history[-1] - elbo_history[-2]) < 1e-6:
                break

        # Store results
        self.components = mean_weights
        self.weights = self._expected_weights(gamma_1, gamma_2)

        return {
            "converged": iteration < max_iter - 1,
            "num_iterations": iteration + 1,
            "elbo_history": elbo_history,
            "final_elbo": elbo_history[-1],
            "effective_components": np.sum(self.weights > 0.01),
            "component_weights": self.weights,
        }

    def _compute_elbo(
        self,
        X: np.ndarray,
        y: np.ndarray,
        responsibilities: np.ndarray,
        mean_weights: np.ndarray,
        precision_weights: np.ndarray,
        gamma_1: np.ndarray,
        gamma_2: np.ndarray,
    ) -> float:
        """Compute Evidence Lower BOund"""
        # Simplified ELBO computation
        likelihood_term = 0.0
        for i in range(len(X)):
            for k in range(len(mean_weights)):
                pred = X[i] @ mean_weights[k]
                likelihood_term += responsibilities[i, k] * (-0.5 * (y[i] - pred) ** 2)

        return likelihood_term  # Simplified - missing KL terms

    def _expected_weights(self, gamma_1: np.ndarray, gamma_2: np.ndarray) -> np.ndarray:
        """Compute expected stick-breaking weights"""
        K = len(gamma_1)
        weights = np.zeros(K)

        expected_betas = gamma_1 / (gamma_1 + gamma_2)

        remaining = 1.0
        for k in range(K - 1):
            weights[k] = expected_betas[k] * remaining
            remaining *= 1 - expected_betas[k]
        weights[-1] = remaining

        return weights

    def predict_posterior(
        self, X_test: np.ndarray, n_samples: int = 100
    ) -> Dict[str, np.ndarray]:
        """Generate posterior predictive samples"""
        predictions = []

        for _ in range(n_samples):
            # Sample component assignment
            component_probs = self.weights / np.sum(self.weights)
            chosen_component = np.random.choice(len(self.components), p=component_probs)

            # Sample prediction from chosen component
            pred_mean = X_test @ self.components[chosen_component]
            pred_sample = np.random.normal(pred_mean, 0.1)  # Fixed noise for simplicity
            predictions.append(pred_sample)

        predictions = np.array(predictions)

        return {
            "posterior_samples": predictions,
            "posterior_mean": np.mean(predictions, axis=0),
            "posterior_std": np.std(predictions, axis=0),
            "credible_intervals": {
                "50%": np.percentile(predictions, [25, 75], axis=0),
                "90%": np.percentile(predictions, [5, 95], axis=0),
                "95%": np.percentile(predictions, [2.5, 97.5], axis=0),
            },
        }


class EnhancedMathematicalPredictionEngine:
    """Main prediction engine with advanced mathematical methods"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}

        # Initialize advanced components
        self.bayesian_nn = None
        self.info_theoretic = InformationTheoreticPredictor()
        self.stat_mechanics = StatisticalMechanicsPredictor()
        self.gaussian_process = AdvancedGaussianProcess()
        self.nonparametric_bayes = NonparametricBayesianRegressor()

        # Performance tracking
        self.prediction_history = []
        self.model_performance = {}

    def initialize_bayesian_network(
        self, input_dim: int, hidden_dims: List[int] = None
    ):
        """Initialize Bayesian neural network"""
        if hidden_dims is None:
            hidden_dims = [64, 32]

        self.bayesian_nn = BayesianNeuralNetwork(
            input_dim=input_dim, hidden_dims=hidden_dims, output_dim=1
        )

    def train_bayesian_network(
        self, X: np.ndarray, y: np.ndarray, epochs: int = 1000
    ) -> Dict[str, Any]:
        """Train Bayesian neural network with variational inference"""
        if self.bayesian_nn is None:
            self.initialize_bayesian_network(X.shape[1])

        # Convert to tensors
        X_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

        # Optimizer
        optimizer = torch.optim.Adam(self.bayesian_nn.parameters(), lr=0.001)

        losses = []

        for epoch in range(epochs):
            optimizer.zero_grad()

            # Compute ELBO loss
            loss = self.bayesian_nn.elbo_loss(X_tensor, y_tensor)
            loss.backward()
            optimizer.step()

            losses.append(loss.item())

            if epoch % 100 == 0:
                logger.info("Epoch {epoch}, ELBO Loss: {loss.item():.6f}")

        return {
            "training_losses": losses,
            "final_loss": losses[-1],
            "converged": len(losses) > 100 and abs(losses[-1] - losses[-10]) < 1e-6,
        }

    def generate_enhanced_prediction(
        self,
        features: Dict[str, float],
        training_data: Optional[Tuple[np.ndarray, np.ndarray]] = None,
    ) -> BayesianPredictionResult:
        """Generate enhanced prediction with full mathematical rigor"""
        # Convert features to array
        feature_array = np.array(list(features.values())).reshape(1, -1)

        # Initialize results
        predictions = {}
        uncertainties = {}
        information_metrics = {}

        # 1. Bayesian Neural Network Prediction
        if self.bayesian_nn is not None:
            X_tensor = torch.tensor(feature_array, dtype=torch.float32)
            mean_pred, var_pred = self.bayesian_nn(X_tensor, n_samples=50)

            predictions["bayesian_nn"] = mean_pred.item()
            uncertainties["bayesian_nn"] = var_pred.item()

            # Epistemic vs Aleatoric uncertainty decomposition
            noise_precision = torch.exp(self.bayesian_nn.log_noise_precision)
            aleatoric = 1.0 / noise_precision.item()
            epistemic = var_pred.item() - aleatoric

            uncertainties["epistemic"] = max(0, epistemic)
            uncertainties["aleatoric"] = aleatoric

        # 2. Gaussian Process Prediction
        if training_data is not None:
            X_train, y_train = training_data

            # ARD feature importance
            feature_relevance = self.gaussian_process.automatic_relevance_determination(
                X_train, y_train
            )

            # Bayesian optimization metrics
            acquisition_metrics = (
                self.gaussian_process.bayesian_optimization_acquisition(
                    X_train, y_train, feature_array
                )
            )

            predictions["gaussian_process"] = acquisition_metrics["posterior_mean"][0]
            uncertainties["gaussian_process"] = acquisition_metrics["posterior_std"][0]

            information_metrics["feature_relevance"] = feature_relevance
            information_metrics["acquisition_functions"] = {
                k: v[0] for k, v in acquisition_metrics.items()
            }

        # 3. Information Theoretic Analysis
        if training_data is not None:
            X_train, y_train = training_data

            # Mutual information analysis
            mi_scores = self.info_theoretic.compute_mutual_information(X_train, y_train)

            # Feature selection based on information gain
            selected_features = self.info_theoretic.information_gain_feature_selection(
                X_train, y_train
            )

            information_metrics["mutual_information"] = mi_scores
            information_metrics["selected_features"] = selected_features.tolist()

        # 4. Statistical Mechanics Analysis
        if training_data is not None:
            X_train, y_train = training_data

            # Thermodynamic integration
            thermo_metrics = self.stat_mechanics.thermodynamic_integration(
                X_train, y_train
            )

            information_metrics["thermodynamics"] = thermo_metrics

        # 5. Nonparametric Bayesian Prediction
        if training_data is not None:
            X_train, y_train = training_data

            # Fit DP mixture model
            dp_results = self.nonparametric_bayes.fit_variational_inference(
                X_train, y_train
            )

            # Posterior prediction
            posterior_pred = self.nonparametric_bayes.predict_posterior(feature_array)

            predictions["nonparametric_bayes"] = posterior_pred["posterior_mean"][0]
            uncertainties["nonparametric_bayes"] = posterior_pred["posterior_std"][0]

            information_metrics["dirichlet_process"] = {
                "effective_components": dp_results["effective_components"],
                "component_weights": dp_results["component_weights"].tolist(),
                "converged": dp_results["converged"],
            }

        # Ensemble prediction with uncertainty propagation
        if predictions:
            pred_values = np.array(list(predictions.values()))
            uncertainty_values = np.array(list(uncertainties.values()))

            # Weighted ensemble (inverse variance weighting)
            weights = 1.0 / (uncertainty_values + 1e-8)
            weights = weights / np.sum(weights)

            ensemble_mean = np.sum(weights * pred_values)

            # Ensemble variance (includes model uncertainty)
            ensemble_var = np.sum(weights**2 * uncertainty_values) + np.var(pred_values)

        else:
            # Fallback prediction
            ensemble_mean = np.mean(list(features.values()))
            ensemble_var = 1.0
            weights = np.array([1.0])

        # Compute information theoretic metrics for final prediction
        if len(predictions) > 1:
            pred_array = np.array(list(predictions.values()))
            final_entropy = self.info_theoretic.compute_differential_entropy(pred_array)
            final_mi = np.mean(
                [
                    self.info_theoretic.compute_differential_entropy(np.array([pred]))
                    for pred in predictions.values()
                ]
            )
        else:
            final_entropy = 0.0
            final_mi = 0.0

        # Generate posterior samples (approximate)
        n_samples = 1000
        posterior_samples = np.random.normal(
            ensemble_mean, np.sqrt(ensemble_var), n_samples
        )

        # Credible intervals
        credible_intervals = {
            "50%": tuple(np.percentile(posterior_samples, [25, 75])),
            "90%": tuple(np.percentile(posterior_samples, [5, 95])),
            "95%": tuple(np.percentile(posterior_samples, [2.5, 97.5])),
            "99%": tuple(np.percentile(posterior_samples, [0.5, 99.5])),
        }

        # Model evidence (approximate using BIC)
        if training_data is not None:
            n_samples_train = len(training_data[1])
            n_params = len(features) + 1  # Simple estimate
            mse = ensemble_var  # Approximate
            log_likelihood = (
                -0.5 * n_samples_train * np.log(2 * np.pi * mse) - 0.5 * n_samples_train
            )
            bic = -2 * log_likelihood + n_params * np.log(n_samples_train)
            aic = -2 * log_likelihood + 2 * n_params
            evidence = log_likelihood
        else:
            bic = aic = evidence = 0.0

        # Information criteria
        information_criteria = {
            "BIC": bic,
            "AIC": aic,
            "log_likelihood": log_likelihood if "log_likelihood" in locals() else 0.0,
        }

        # Create result
        result = BayesianPredictionResult(
            mean_prediction=float(ensemble_mean),
            variance=float(ensemble_var),
            credible_intervals=credible_intervals,
            posterior_samples=posterior_samples,
            evidence=float(evidence),
            information_criteria=information_criteria,
            predictive_distribution={
                "type": "gaussian",
                "parameters": {
                    "mean": float(ensemble_mean),
                    "variance": float(ensemble_var),
                },
            },
            epistemic_uncertainty=float(uncertainties.get("epistemic", 0.0)),
            aleatoric_uncertainty=float(uncertainties.get("aleatoric", 0.0)),
            mutual_information=float(final_mi),
            entropy=float(final_entropy),
        )

        # Store prediction history
        self.prediction_history.append(
            {
                "timestamp": time.time(),
                "features": features,
                "prediction": result,
                "individual_predictions": predictions,
                "information_metrics": information_metrics,
            }
        )

        return result

    def model_comparison(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Comprehensive model comparison using advanced metrics"""
        results = {}

        # Split data for validation
        n_train = int(0.8 * len(X))
        X_train, X_val = X[:n_train], X[n_train:]
        y_train, y_val = y[:n_train], y[n_train:]

        # Train and evaluate each model

        # 1. Bayesian NN
        if self.bayesian_nn is None:
            self.initialize_bayesian_network(X.shape[1])

        train_results = self.train_bayesian_network(X_train, y_train, epochs=500)

        # Evaluate on validation set
        X_val_tensor = torch.tensor(X_val, dtype=torch.float32)
        val_pred_mean, val_pred_var = self.bayesian_nn(X_val_tensor, n_samples=50)
        val_predictions = val_pred_mean.detach().numpy().flatten()

        # Compute metrics
        mse = np.mean((val_predictions - y_val) ** 2)
        mae = np.mean(np.abs(val_predictions - y_val))
        r2 = 1 - mse / np.var(y_val)

        # Predictive likelihood
        val_log_likelihood = np.sum(
            stats.norm.logpdf(
                y_val, val_predictions, np.sqrt(val_pred_var.detach().numpy().flatten())
            )
        )

        results["bayesian_neural_network"] = {
            "mse": float(mse),
            "mae": float(mae),
            "r2": float(r2),
            "log_likelihood": float(val_log_likelihood),
            "training_converged": train_results["converged"],
            "predictive_uncertainty": float(np.mean(val_pred_var.detach().numpy())),
        }

        # 2. Nonparametric Bayesian
        dp_results = self.nonparametric_bayes.fit_variational_inference(
            X_train, y_train
        )
        dp_pred = self.nonparametric_bayes.predict_posterior(X_val)

        dp_mse = np.mean((dp_pred["posterior_mean"] - y_val) ** 2)
        dp_mae = np.mean(np.abs(dp_pred["posterior_mean"] - y_val))
        dp_r2 = 1 - dp_mse / np.var(y_val)

        results["nonparametric_bayesian"] = {
            "mse": float(dp_mse),
            "mae": float(dp_mae),
            "r2": float(dp_r2),
            "effective_components": dp_results["effective_components"],
            "converged": dp_results["converged"],
            "posterior_uncertainty": float(np.mean(dp_pred["posterior_std"])),
        }

        # Model comparison metrics
        results["comparison"] = {
            "best_mse_model": min(results.keys(), key=lambda k: results[k]["mse"]),
            "best_r2_model": max(results.keys(), key=lambda k: results[k]["r2"]),
            "most_uncertain_model": max(
                results.keys(),
                key=lambda k: results[k].get(
                    "predictive_uncertainty", results[k].get("posterior_uncertainty", 0)
                ),
            ),
            "information_criteria_comparison": self._compare_information_criteria(
                results
            ),
        }

        return results

    def _compare_information_criteria(self, results: Dict[str, Any]) -> Dict[str, str]:
        """Compare models using information criteria"""
        # Simplified comparison based on available metrics
        comparison = {}

        # Find model with best (lowest) effective information criterion
        if all("mse" in results[model] for model in results if model != "comparison"):
            mse_ranking = sorted(
                results.keys(),
                key=lambda k: results[k]["mse"] if k != "comparison" else float("inf"),
            )
            comparison["mse_ranking"] = mse_ranking

        return comparison


# Global enhanced prediction engine instance
enhanced_prediction_engine = EnhancedMathematicalPredictionEngine()
