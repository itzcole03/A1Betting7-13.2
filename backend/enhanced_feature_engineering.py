"""Enhanced Mathematical Feature Engineering
Advanced statistical signal processing, manifold learning, and information theory
for sophisticated feature extraction and transformation
"""

import logging
import time
import warnings
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import networkx as nx
import numpy as np
from scipy import stats
from scipy.sparse.linalg import eigsh
from sklearn.decomposition import PCA
from sklearn.feature_selection import mutual_info_regression
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)


@dataclass
class FeatureEngineeringResult:
    """Result of advanced feature engineering"""

    transformed_features: np.ndarray
    feature_names: List[str]
    feature_importance: Dict[str, float]
    manifold_embedding: Optional[np.ndarray]
    spectral_features: Dict[str, np.ndarray]
    information_theoretic_metrics: Dict[str, float]
    statistical_properties: Dict[str, Any]
    graph_features: Dict[str, Any]
    nonlinear_transformations: Dict[str, np.ndarray]
    feature_interactions: Dict[str, np.ndarray]
    uncertainty_estimates: Dict[str, float]


class WaveletTransformFeatures:
    """Advanced wavelet-based feature extraction"""

    def __init__(self, wavelet_family: str = "db8", max_level: int = 6):
        self.wavelet_family = wavelet_family
        self.max_level = max_level
        self.wavelet_coefficients = {}

    def continuous_wavelet_transform(
        self, signal_data: np.ndarray, scales: Optional[np.ndarray] = None
    ) -> Dict[str, np.ndarray]:
        """Continuous Wavelet Transform for time-frequency analysis"""
        if scales is None:
            scales = np.arange(1, 32)

        # Morlet wavelet (complex)
        def morlet_wavelet(t, scale=1.0, omega0=6.0):
            """Morlet wavelet"""
            return (
                (1.0 / np.sqrt(scale))
                * np.exp(1j * omega0 * t / scale)
                * np.exp(-0.5 * (t / scale) ** 2)
            )

        cwt_matrix = np.zeros((len(scales), len(signal_data)), dtype=complex)

        for i, scale in enumerate(scales):
            # Generate wavelet at this scale
            t_wavelet = np.arange(-3 * scale, 3 * scale + 1)
            wavelet = morlet_wavelet(t_wavelet, scale)

            # Convolve with signal (correlation)
            cwt_matrix[i] = np.convolve(
                signal_data, np.conj(wavelet[::-1]), mode="same"
            )

        # Extract features from CWT
        features = {
            "cwt_magnitude": np.abs(cwt_matrix),
            "cwt_phase": np.angle(cwt_matrix),
            "cwt_power": np.abs(cwt_matrix) ** 2,
            "ridges": self._extract_ridges(np.abs(cwt_matrix)),
            "instantaneous_frequency": self._instantaneous_frequency(cwt_matrix),
            "scale_averaged_power": np.mean(np.abs(cwt_matrix) ** 2, axis=0),
            "frequency_marginal": np.mean(np.abs(cwt_matrix) ** 2, axis=1),
        }

        return features

    def _extract_ridges(self, cwt_magnitude: np.ndarray) -> np.ndarray:
        """Extract ridges (local maxima) from CWT magnitude"""
        ridges = []

        for t in range(cwt_magnitude.shape[1]):
            # Find local maxima in scale direction
            column = cwt_magnitude[:, t]
            peaks = []

            for i in range(1, len(column) - 1):
                if column[i] > column[i - 1] and column[i] > column[i + 1]:
                    peaks.append(i)

            ridges.append(peaks)

        # Convert to feature vector (simplified)
        ridge_features = np.zeros(cwt_magnitude.shape[1])
        for t, peaks in enumerate(ridges):
            if peaks:
                ridge_features[t] = len(peaks)  # Number of ridges at time t

        return ridge_features

    def _instantaneous_frequency(self, cwt_matrix: np.ndarray) -> np.ndarray:
        """Compute instantaneous frequency from CWT"""
        # Simplified instantaneous frequency estimation
        phase = np.angle(cwt_matrix)
        inst_freq = np.diff(phase, axis=1) / (2 * np.pi)

        # Pad to maintain shape
        inst_freq = np.pad(inst_freq, ((0, 0), (0, 1)), mode="edge")

        return np.mean(inst_freq, axis=0)  # Average across scales

    def multiscale_entropy(
        self, signal_data: np.ndarray, max_scale: int = 20
    ) -> np.ndarray:
        """Multiscale sample entropy"""

        def sample_entropy(data, m=2, r=0.2):
            """Sample entropy calculation"""
            N = len(data)
            patterns = np.array([data[i : i + m] for i in range(N - m + 1)])

            # Count matches
            matches_m = 0
            matches_m1 = 0

            for i in range(len(patterns)):
                template = patterns[i]
                distances = np.max(np.abs(patterns - template), axis=1)

                matches_m += (
                    np.sum(distances <= r * np.std(data)) - 1
                )  # Exclude self-match

                if i < len(patterns) - 1:
                    template_m1 = data[i : i + m + 1]
                    patterns_m1 = np.array(
                        [data[j : j + m + 1] for _ in range(N - m) if j != i]
                    )
                    if len(patterns_m1) > 0:
                        distances_m1 = np.max(np.abs(patterns_m1 - template_m1), axis=1)
                        matches_m1 += np.sum(distances_m1 <= r * np.std(data))

            if matches_m == 0 or matches_m1 == 0:
                return 0.0

            return -np.log(matches_m1 / matches_m)

        entropies = []

        for scale in range(1, max_scale + 1):
            # Coarse-grain the signal
            if scale == 1:
                coarse_grained = signal_data
            else:
                n_points = len(signal_data) // scale
                coarse_grained = np.array(
                    [
                        np.mean(signal_data[i * scale : (i + 1) * scale])
                        for i in range(n_points)
                    ]
                )

            # Calculate sample entropy
            if len(coarse_grained) > 10:  # Need sufficient data points
                entropy = sample_entropy(coarse_grained)
                entropies.append(entropy)
            else:
                entropies.append(0.0)

        return np.array(entropies)


class ManifoldLearningFeatures:
    """Advanced manifold learning and dimensionality reduction"""

    def __init__(self):
        self.manifold_methods = {}
        self.embeddings = {}
        self.geodesic_distances = {}

    def diffusion_maps(
        self, X: np.ndarray, n_components: int = 10, epsilon: float = 1.0
    ) -> Dict[str, np.ndarray]:
        """Diffusion maps for nonlinear dimensionality reduction"""
        # Compute pairwise distances
        distances = np.linalg.norm(X[:, None] - X[None, :], axis=2)

        # Gaussian kernel
        K = np.exp(-(distances**2) / epsilon)

        # Normalize to get transition matrix
        row_sums = np.sum(K, axis=1)
        P = K / row_sums[:, None]

        # Symmetric normalization
        D_sqrt_inv = np.diag(1.0 / np.sqrt(row_sums))
        A = D_sqrt_inv @ K @ D_sqrt_inv

        # Eigendecomposition
        eigenvalues, eigenvectors = np.linalg.eigh(A)

        # Sort by eigenvalue magnitude (descending)
        idx = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]

        # Diffusion coordinates
        embedding = eigenvectors[:, :n_components] * np.sqrt(eigenvalues[:n_components])

        # Diffusion distance matrix
        diffusion_distance = np.zeros((len(X), len(X)))
        for i in range(len(X)):
            for _ in range(len(X)):
                diff = embedding[i] - embedding[j]
                diffusion_distance[i, j] = np.sqrt(np.sum(diff**2))

        return {
            "embedding": embedding,
            "eigenvalues": eigenvalues,
            "eigenvectors": eigenvectors,
            "diffusion_distance": diffusion_distance,
            "transition_matrix": P,
        }

    def laplacian_eigenmaps(
        self, X: np.ndarray, n_components: int = 10, gamma: float = 1.0
    ) -> Dict[str, np.ndarray]:
        """Laplacian eigenmaps for spectral embedding"""
        # Construct similarity graph
        distances = np.linalg.norm(X[:, None] - X[None, :], axis=2)
        W = np.exp(-gamma * distances**2)

        # Degree matrix
        D = np.diag(np.sum(W, axis=1))

        # Graph Laplacian
        L = D - W

        # Normalized Laplacian
        D_sqrt_inv = np.diag(1.0 / np.sqrt(np.sum(W, axis=1)))
        L_norm = D_sqrt_inv @ L @ D_sqrt_inv

        # Eigendecomposition (smallest eigenvalues)
        eigenvalues, eigenvectors = eigsh(L_norm, k=n_components + 1, which="SM")

        # Remove first eigenvector (constant vector)
        embedding = eigenvectors[:, 1:]
        eigenvalues = eigenvalues[1:]

        return {
            "embedding": embedding,
            "eigenvalues": eigenvalues,
            "eigenvectors": eigenvectors,
            "laplacian": L_norm,
            "similarity_matrix": W,
        }

    def hessian_lle(
        self, X: np.ndarray, n_components: int = 10, n_neighbors: int = 12
    ) -> Dict[str, np.ndarray]:
        """Hessian Locally Linear Embedding"""
        from sklearn.neighbors import NearestNeighbors

        # Find nearest neighbors
        nbrs = NearestNeighbors(n_neighbors=n_neighbors).fit(X)
        distances, indices = nbrs.kneighbors(X)

        n_samples, n_features = X.shape

        # Build Hessian matrix
        H = np.zeros((n_samples, n_samples))

        for i in range(n_samples):
            # Get neighbors
            neighbor_indices = indices[i]
            neighbors = X[neighbor_indices]

            # Center the neighbors
            centered_neighbors = neighbors - np.mean(neighbors, axis=0)

            # Compute local Hessian approximation
            if centered_neighbors.shape[0] > 1:
                # SVD of centered neighbors
                U, s, Vt = np.linalg.svd(centered_neighbors, full_matrices=False)

                # Hessian weights (simplified)
                if len(s) > 0:
                    weights = 1.0 / (s + 1e-8)
                    weights = weights / np.sum(weights)

                    # Update Hessian matrix
                    for j, idx in enumerate(neighbor_indices):
                        H[i, idx] = weights[min(j, len(weights) - 1)]

        # Eigendecomposition of Hessian
        eigenvalues, eigenvectors = eigsh(H, k=n_components, which="SM")

        embedding = eigenvectors

        return {
            "embedding": embedding,
            "eigenvalues": eigenvalues,
            "hessian_matrix": H,
            "neighbor_indices": indices,
        }

    def estimate_intrinsic_dimensionality(self, X: np.ndarray) -> Dict[str, float]:
        """Estimate intrinsic dimensionality using multiple methods"""
        methods = {}

        # 1. PCA-based estimation
        pca = PCA()
        pca.fit(X)
        explained_variance_ratio = pca.explained_variance_ratio_

        # 90% variance threshold
        cumsum_var = np.cumsum(explained_variance_ratio)
        dim_90 = np.argmax(cumsum_var >= 0.9) + 1

        # 95% variance threshold
        dim_95 = np.argmax(cumsum_var >= 0.95) + 1

        methods["pca_90"] = float(dim_90)
        methods["pca_95"] = float(dim_95)

        # 2. Maximum Likelihood Estimation (Levina & Bickel)
        from sklearn.neighbors import NearestNeighbors

        k = min(20, len(X) - 1)
        nbrs = NearestNeighbors(n_neighbors=k + 1).fit(X)
        distances, _ = nbrs.kneighbors(X)

        # Remove self-distance
        distances = distances[:, 1:]

        # MLE estimate
        log_ratios = []
        for i in range(len(X)):
            dists = distances[i]
            if dists[-1] > 0:
                log_ratio = np.log(dists[-1] / dists[:-1])
                log_ratios.extend(log_ratio)

        if log_ratios:
            mle_dim = (k - 1) / np.mean(log_ratios)
            methods["mle"] = float(max(1, mle_dim))
        else:
            methods["mle"] = float(X.shape[1])

        # 3. Correlation dimension
        methods["correlation_dimension"] = self._correlation_dimension(X)

        return methods

    def _correlation_dimension(self, X: np.ndarray, n_scales: int = 10) -> float:
        """Estimate correlation dimension using box-counting"""
        # Normalize data
        X_norm = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0) + 1e-8)

        scales = np.logspace(-2, 0, n_scales)
        counts = []

        for scale in scales:
            # Count points within scale distance
            distances = np.linalg.norm(X_norm[:, None] - X_norm[None, :], axis=2)
            count = np.sum(distances < scale) - len(X)  # Remove diagonal
            counts.append(count / (len(X) * (len(X) - 1)))

        # Fit line in log-log space
        log_scales = np.log(scales)
        log_counts = np.log(np.array(counts) + 1e-8)

        # Linear regression
        valid_indices = np.isfinite(log_counts)
        if np.sum(valid_indices) > 1:
            slope, _ = np.polyfit(
                log_scales[valid_indices], log_counts[valid_indices], 1
            )
            return float(max(0, slope))
        else:
            return float(X.shape[1])


class InformationTheoreticFeatures:
    """Information theory-based feature extraction and selection"""

    def __init__(self):
        self.entropy_estimators = {}
        self.mutual_information_cache = {}

    def transfer_entropy(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray = None, lag: int = 1
    ) -> Dict[str, float]:
        """Transfer entropy between time series"""

        def _embed_timeseries(ts, embedding_dim=3, delay=1):
            """Time delay embedding"""
            n = len(ts) - (embedding_dim - 1) * delay
            embedded = np.zeros((n, embedding_dim))
            for i in range(embedding_dim):
                embedded[:, i] = ts[i * delay : i * delay + n]
            return embedded

        # Embed time series
        X_embedded = _embed_timeseries(X)
        Y_embedded = _embed_timeseries(Y)

        # Shift for lagged transfer entropy
        if lag > 0:
            X_past = X_embedded[:-lag]
            X_future = X_embedded[lag:]
            Y_past = Y_embedded[:-lag]
            Y_future = Y_embedded[lag:]
        else:
            X_past = X_embedded
            X_future = X_embedded
            Y_past = Y_embedded
            Y_future = Y_embedded

        # Estimate mutual information using k-NN
        from sklearn.feature_selection import mutual_info_regression

        # TE(X→Y) = I(Y_future; X_past | Y_past)
        # = I(Y_future; X_past, Y_past) - I(Y_future; Y_past)
        # Joint MI: I(Y_future; X_past, Y_past)
        joint_features = np.hstack([X_past, Y_past])
        joint_mi = mutual_info_regression(
            joint_features.reshape(-1, joint_features.shape[-1]),
            Y_future.mean(axis=1),
            discrete_features=False,
        )[0]

        # Conditional MI: I(Y_future; Y_past)
        cond_mi = mutual_info_regression(
            Y_past.reshape(-1, Y_past.shape[-1]),
            Y_future.mean(axis=1),
            discrete_features=False,
        )[0]

        te_x_to_y = joint_mi - cond_mi

        # TE(Y→X)
        joint_features_yx = np.hstack([Y_past, X_past])
        joint_mi_yx = mutual_info_regression(
            joint_features_yx.reshape(-1, joint_features_yx.shape[-1]),
            X_future.mean(axis=1),
            discrete_features=False,
        )[0]

        cond_mi_yx = mutual_info_regression(
            X_past.reshape(-1, X_past.shape[-1]),
            X_future.mean(axis=1),
            discrete_features=False,
        )[0]

        te_y_to_x = joint_mi_yx - cond_mi_yx

        return {
            "te_x_to_y": float(max(0, te_x_to_y)),
            "te_y_to_x": float(max(0, te_y_to_x)),
            "net_transfer": float(te_x_to_y - te_y_to_x),
            "total_transfer": float(te_x_to_y + te_y_to_x),
        }

    def partial_information_decomposition(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray
    ) -> Dict[str, float]:
        """Partial Information Decomposition (Williams & Beer)"""
        from sklearn.feature_selection import mutual_info_regression

        # Mutual informations
        I_XZ = mutual_info_regression(X.reshape(-1, 1), Z, discrete_features=False)[0]
        I_YZ = mutual_info_regression(Y.reshape(-1, 1), Z, discrete_features=False)[0]
        I_XYZ = mutual_info_regression(
            np.column_stack([X, Y]), Z, discrete_features=False
        )[0]
        I_XY = mutual_info_regression(X.reshape(-1, 1), Y, discrete_features=False)[0]

        # PID components (simplified)
        redundancy = min(I_XZ, I_YZ)
        unique_X = max(0, I_XZ - redundancy)
        unique_Y = max(0, I_YZ - redundancy)
        synergy = max(0, I_XYZ - I_XZ - I_YZ + redundancy)

        return {
            "redundancy": float(redundancy),
            "unique_x": float(unique_X),
            "unique_y": float(unique_Y),
            "synergy": float(synergy),
            "total_information": float(I_XYZ),
        }

    def feature_relevance_ranking(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """Comprehensive feature relevance ranking using multiple criteria"""
        n_features = X.shape[1]
        rankings = {}

        # 1. Mutual Information
        mi_scores = mutual_info_regression(X, y, discrete_features=False)
        rankings["mutual_information"] = {
            f"feature_{i}": float(score) for i, score in enumerate(mi_scores)
        }

        # 2. F-statistic
        f_scores, p_values = stats.f_regression(X, y)
        rankings["f_statistic"] = {
            f"feature_{i}": float(score) for i, score in enumerate(f_scores)
        }
        rankings["f_p_values"] = {
            f"feature_{i}": float(p_val) for i, p_val in enumerate(p_values)
        }

        # 3. Partial correlation
        partial_corrs = []
        for i in range(n_features):
            # Remove influence of other features
            other_features = np.delete(X, i, axis=1)

            # Residual after regressing target on other features
            if other_features.shape[1] > 0:
                from sklearn.linear_model import LinearRegression

                lr = LinearRegression()
                lr.fit(other_features, y)
                y_residual = y - lr.predict(other_features)

                # Residual after regressing current feature on other features
                lr.fit(other_features, X[:, i])
                x_residual = X[:, i] - lr.predict(other_features)

                # Correlation of residuals
                partial_corr = np.corrcoef(x_residual, y_residual)[0, 1]
                partial_corrs.append(partial_corr if np.isfinite(partial_corr) else 0.0)
            else:
                partial_corrs.append(np.corrcoef(X[:, i], y)[0, 1])

        rankings["partial_correlation"] = {
            f"feature_{i}": float(corr) for i, corr in enumerate(partial_corrs)
        }

        # 4. Ensemble ranking (combine multiple criteria)
        ensemble_scores = []
        for i in range(n_features):
            mi_rank = len(mi_scores) - stats.rankdata(mi_scores)[i] + 1
            f_rank = len(f_scores) - stats.rankdata(f_scores)[i] + 1
            pc_rank = len(partial_corrs) - stats.rankdata(np.abs(partial_corrs))[i] + 1

            # Weighted average rank
            ensemble_score = (mi_rank + f_rank + pc_rank) / 3
            ensemble_scores.append(ensemble_score)

        rankings["ensemble_ranking"] = {
            f"feature_{i}": float(score) for i, score in enumerate(ensemble_scores)
        }

        # Top features for each criterion
        top_features = {}
        for criterion in ["mutual_information", "f_statistic", "partial_correlation"]:
            scores = list(rankings[criterion].values())
            if criterion == "partial_correlation":
                scores = [abs(s) for s in scores]

            top_indices = np.argsort(scores)[::-1][:5]
            top_features[criterion] = [f"feature_{i}" for i in top_indices]

        rankings["top_features"] = top_features

        return rankings


class GraphBasedFeatures:
    """Graph-based feature extraction and network analysis"""

    def __init__(self):
        self.graphs = {}
        self.centrality_measures = {}

    def construct_correlation_network(
        self, X: np.ndarray, threshold: float = 0.3
    ) -> nx.Graph:
        """Construct correlation network from features"""
        # Compute correlation matrix
        corr_matrix = np.corrcoef(X.T)

        # Create graph
        G = nx.Graph()

        n_features = X.shape[1]
        for i in range(n_features):
            G.add_node(i, feature_id=f"feature_{i}")

        # Add edges based on correlation threshold
        for i in range(n_features):
            for _ in range(i + 1, n_features):
                if abs(corr_matrix[i, j]) > threshold:
                    G.add_edge(i, j, weight=abs(corr_matrix[i, j]))

        return G

    def graph_centrality_features(self, G: nx.Graph) -> Dict[str, Dict[str, float]]:
        """Compute various centrality measures"""
        centralities = {}

        # Degree centrality
        centralities["degree"] = nx.degree_centrality(G)

        # Betweenness centrality
        centralities["betweenness"] = nx.betweenness_centrality(G)

        # Closeness centrality
        if nx.is_connected(G):
            centralities["closeness"] = nx.closeness_centrality(G)
        else:
            # Handle disconnected graph
            centralities["closeness"] = {}
            for component in nx.connected_components(G):
                subgraph = G.subgraph(component)
                subgraph_closeness = nx.closeness_centrality(subgraph)
                centralities["closeness"].update(subgraph_closeness)

        # Eigenvector centrality
        try:
            centralities["eigenvector"] = nx.eigenvector_centrality(G, max_iter=1000)
        except:
            centralities["eigenvector"] = {node: 0.0 for node in G.nodes()}

        # PageRank
        centralities["pagerank"] = nx.pagerank(G)

        # Clustering coefficient
        centralities["clustering"] = nx.clustering(G)

        return centralities

    def community_detection(self, G: nx.Graph) -> Dict[str, Any]:
        """Community detection using multiple algorithms"""
        communities = {}

        # 1. Modularity-based (Louvain-like)
        try:
            import networkx.algorithms.community as nx_comm

            # Greedy modularity maximization
            greedy_communities = list(nx_comm.greedy_modularity_communities(G))
            communities["greedy_modularity"] = {
                "communities": greedy_communities,
                "modularity": nx_comm.modularity(G, greedy_communities),
            }

        except ImportError:
            # Fallback: simple connected components
            components = list(nx.connected_components(G))
            communities["connected_components"] = {
                "communities": components,
                "num_components": len(components),
            }

        # 2. Spectral clustering on graph
        if len(G.nodes()) > 1:
            # Graph Laplacian
            L = nx.laplacian_matrix(G).astype(float)

            # Eigendecomposition
            try:
                eigenvals, eigenvecs = eigsh(
                    L, k=min(10, len(G.nodes()) - 1), which="SM"
                )

                # Use second smallest eigenvector for bisection
                if len(eigenvals) > 1:
                    fiedler_vector = eigenvecs[:, 1]
                    spectral_partition = [
                        [i for i, val in enumerate(fiedler_vector) if val >= 0],
                        [i for i, val in enumerate(fiedler_vector) if val < 0],
                    ]

                    communities["spectral_bisection"] = {
                        "communities": spectral_partition,
                        "fiedler_vector": fiedler_vector,
                    }
            except:
                pass

        return communities

    def network_motifs(self, G: nx.Graph, motif_size: int = 3) -> Dict[str, int]:
        """Count network motifs (subgraph patterns)"""
        motif_counts = {}

        if motif_size == 3:
            # Triangle motifs
            triangles = list(nx.enumerate_all_cliques(G))
            triangle_count = len([clique for clique in triangles if len(clique) == 3])
            motif_counts["triangles"] = triangle_count

            # Path motifs (3-node paths)
            path_count = 0
            for node in G.nodes():
                neighbors = list(G.neighbors(node))
                for i in range(len(neighbors)):
                    for _ in range(i + 1, len(neighbors)):
                        if not G.has_edge(neighbors[i], neighbors[j]):
                            path_count += 1
            motif_counts["3_paths"] = path_count

        return motif_counts


class EnhancedMathematicalFeatureEngineering:
    """Main enhanced feature engineering class"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}

        # Initialize components
        self.wavelet_features = WaveletTransformFeatures()
        self.manifold_features = ManifoldLearningFeatures()
        self.information_features = InformationTheoreticFeatures()
        self.graph_features = GraphBasedFeatures()

        # Caching
        self.feature_cache = {}
        self.transformation_history = []

    def engineer_features(
        self,
        X: np.ndarray,
        y: Optional[np.ndarray] = None,
        feature_names: Optional[List[str]] = None,
    ) -> FeatureEngineeringResult:
        """Comprehensive feature engineering with advanced mathematical methods"""
        start_time = time.time()

        if feature_names is None:
            feature_names = [f"feature_{i}" for i in range(X.shape[1])]

        # 1. Basic statistical transformations
        X_scaled = StandardScaler().fit_transform(X)

        # 2. Manifold learning
        manifold_results = {}

        # Diffusion maps
        diffusion_result = self.manifold_features.diffusion_maps(
            X_scaled, n_components=min(10, X.shape[1])
        )
        manifold_results["diffusion_maps"] = diffusion_result

        # Laplacian eigenmaps
        laplacian_result = self.manifold_features.laplacian_eigenmaps(
            X_scaled, n_components=min(10, X.shape[1])
        )
        manifold_results["laplacian_eigenmaps"] = laplacian_result

        # Intrinsic dimensionality
        intrinsic_dim = self.manifold_features.estimate_intrinsic_dimensionality(
            X_scaled
        )
        manifold_results["intrinsic_dimensionality"] = intrinsic_dim

        # 3. Spectral features
        spectral_results = {}

        for i in range(min(5, X.shape[1])):  # Apply to first few features
            signal_data = X[:, i]

            # Wavelet features
            cwt_features = self.wavelet_features.continuous_wavelet_transform(
                signal_data
            )
            spectral_results[f"feature_{i}_wavelet"] = cwt_features

            # Multiscale entropy
            mse = self.wavelet_features.multiscale_entropy(signal_data)
            spectral_results[f"feature_{i}_mse"] = mse

        # 4. Information theoretic features
        info_results = {}

        if y is not None:
            # Feature relevance ranking
            relevance_ranking = self.information_features.feature_relevance_ranking(
                X, y
            )
            info_results["feature_relevance"] = relevance_ranking

            # Transfer entropy between features
            if X.shape[1] >= 2:
                te_results = self.information_features.transfer_entropy(
                    X[:, 0], X[:, 1]
                )
                info_results["transfer_entropy"] = te_results

        # 5. Graph-based features
        graph_results = {}

        # Construct correlation network
        corr_graph = self.graph_features.construct_correlation_network(X_scaled)
        graph_results["correlation_graph"] = corr_graph

        # Centrality measures
        centralities = self.graph_features.graph_centrality_features(corr_graph)
        graph_results["centralities"] = centralities

        # Community detection
        communities = self.graph_features.community_detection(corr_graph)
        graph_results["communities"] = communities

        # Network motifs
        motifs = self.graph_features.network_motifs(corr_graph)
        graph_results["motifs"] = motifs

        # 6. Nonlinear transformations
        nonlinear_transforms = {}

        # Polynomial features (selected)
        from sklearn.preprocessing import PolynomialFeatures

        poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
        if X.shape[1] <= 10:  # Only for reasonable number of features
            X_poly = poly.fit_transform(X_scaled)
            nonlinear_transforms["polynomial"] = X_poly

        # Log and square root transforms
        X_positive = X - X.min(axis=0) + 1e-8  # Ensure positive
        nonlinear_transforms["log"] = np.log(X_positive)
        nonlinear_transforms["sqrt"] = np.sqrt(X_positive)
        nonlinear_transforms["reciprocal"] = 1.0 / (X_positive + 1e-8)

        # 7. Feature interactions
        interactions = {}

        # Pairwise products
        if X.shape[1] <= 20:  # Limit combinatorial explosion
            pairwise_products = []
            for i in range(X.shape[1]):
                for _ in range(i + 1, X.shape[1]):
                    product = X[:, i] * X[:, j]
                    pairwise_products.append(product)

            if pairwise_products:
                interactions["pairwise_products"] = np.column_stack(pairwise_products)

        # Ratio features
        ratio_features = []
        for i in range(min(5, X.shape[1])):
            for _ in range(i + 1, min(5, X.shape[1])):
                ratio = X[:, i] / (X[:, j] + 1e-8)
                ratio_features.append(ratio)

        if ratio_features:
            interactions["ratios"] = np.column_stack(ratio_features)

        # 8. Uncertainty estimates
        uncertainties = {}

        # Bootstrap variance for each feature
        n_bootstrap = 100
        bootstrap_vars = []

        for i in range(X.shape[1]):
            bootstrap_means = []
            for _ in range(n_bootstrap):
                sample_indices = np.random.choice(len(X), len(X), replace=True)
                bootstrap_mean = np.mean(X[sample_indices, i])
                bootstrap_means.append(bootstrap_mean)

            bootstrap_var = np.var(bootstrap_means)
            bootstrap_vars.append(bootstrap_var)

        uncertainties["bootstrap_variance"] = {
            f"feature_{i}": float(var) for i, var in enumerate(bootstrap_vars)
        }

        # 9. Construct final feature matrix
        feature_components = [X_scaled]
        new_feature_names = feature_names.copy()

        # Add manifold embeddings
        if "diffusion_maps" in manifold_results:
            embedding = manifold_results["diffusion_maps"]["embedding"]
            feature_components.append(embedding)
            new_feature_names.extend(
                [f"diffusion_{i}" for i in range(embedding.shape[1])]
            )

        # Add selected spectral features
        for feature_name, wavelet_data in list(spectral_results.items())[
            :3
        ]:  # Limit to avoid explosion
            if "scale_averaged_power" in wavelet_data:
                power_features = wavelet_data["scale_averaged_power"].reshape(-1, 1)
                feature_components.append(power_features)
                new_feature_names.append(f"{feature_name}_power")

        # Add centrality features
        if "degree" in centralities:
            degree_values = np.array(
                [centralities["degree"].get(i, 0.0) for i in range(X.shape[1])]
            )
            degree_features = np.tile(degree_values, (X.shape[0], 1))
            feature_components.append(degree_features)
            new_feature_names.extend(
                [f"degree_centrality_{i}" for i in range(X.shape[1])]
            )

        # Combine all features
        final_features = np.hstack(feature_components)

        # 10. Statistical properties
        statistical_props = {
            "n_original_features": X.shape[1],
            "n_engineered_features": final_features.shape[1],
            "feature_expansion_ratio": final_features.shape[1] / X.shape[1],
            "processing_time": time.time() - start_time,
            "intrinsic_dimensionality": intrinsic_dim,
            "correlation_graph_density": nx.density(corr_graph),
            "correlation_graph_nodes": corr_graph.number_of_nodes(),
            "correlation_graph_edges": corr_graph.number_of_edges(),
        }

        # Create result
        result = FeatureEngineeringResult(
            transformed_features=final_features,
            feature_names=new_feature_names,
            feature_importance=info_results.get("feature_relevance", {}).get(
                "ensemble_ranking", {}
            ),
            manifold_embedding=manifold_results.get("diffusion_maps", {}).get(
                "embedding"
            ),
            spectral_features=spectral_results,
            information_theoretic_metrics=info_results,
            statistical_properties=statistical_props,
            graph_features=graph_results,
            nonlinear_transformations=nonlinear_transforms,
            feature_interactions=interactions,
            uncertainty_estimates=uncertainties,
        )

        # Cache results
        self.feature_cache[time.time()] = result
        self.transformation_history.append(
            {
                "timestamp": time.time(),
                "input_shape": X.shape,
                "output_shape": final_features.shape,
                "methods_applied": [
                    "manifold_learning",
                    "spectral_analysis",
                    "information_theory",
                    "graph_analysis",
                ],
            }
        )

        logger.info(
            f"Feature engineering completed: {X.shape[1]} → {final_features.shape[1]} features in {statistical_props['processing_time']:.3f}s"
        )

        return result


# Global enhanced feature engineering instance
enhanced_feature_engineering = EnhancedMathematicalFeatureEngineering()
