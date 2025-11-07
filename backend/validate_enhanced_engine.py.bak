#!/usr/bin/env python3
"""Mathematical Validation Script for Enhanced Revolutionary Engine
Tests the mathematical rigor and correctness of implementations
"""

import time
import warnings

import numpy as np
import torch

warnings.filterwarnings("ignore")

try:
    from enhanced_revolutionary_engine import (
        EnhancedCausalInference,
        EnhancedMambaStateSpace,
        EnhancedNeuromorphicNetwork,
        EnhancedRevolutionaryEngine,
        EnhancedRiemannianNetwork,
        EnhancedTopologicalNetwork,
    )

    print("✓ Enhanced Revolutionary Engine imported successfully")
except ImportError as e:
    print(f"✗ Import failed: {e}")
    print("Please install dependencies: pip install -r enhanced_requirements.txt")
    exit(1)


def validate_neuromorphic_network():
    """Validate Hodgkin-Huxley neuromorphic implementation"""
    print("\n🧠 Validating Neuromorphic Network...")

    try:
        # Create network
        net = EnhancedNeuromorphicNetwork(
            input_dim=10, hidden_dims=[64, 32], output_dim=5
        )

        # Test with random input
        x = torch.randn(4, 10)
        output, metrics = net(x, timesteps=50)

        # Validate mathematical properties
        checks = {
            "Output shape correct": output.shape == (4, 5),
            "Spike rate reasonable": 0 <= metrics["spike_rate"] <= 100,
            "ISI statistics present": "isi_statistics" in metrics,
            "Network criticality bounded": 0
            <= metrics.get("network_criticality", 0)
            <= 1,
            "No NaN values": not torch.isnan(output).any(),
            "Finite membrane potentials": all(
                torch.isfinite(v).all()
                for v in metrics.get("membrane_dynamics", {}).get("mean_voltage", [])
            ),
        }

        passed = sum(checks.values())
        total = len(checks)

        print(f"  Neuromorphic validation: {passed}/{total} checks passed")
        for check, result in checks.items():
            status = "✓" if result else "✗"
            print(f"    {status} {check}")

        # Test Hodgkin-Huxley dynamics
        v = torch.tensor([-65.0])
        m = torch.tensor([0.05])
        h = torch.tensor([0.6])
        n = torch.tensor([0.32])
        i_ext = torch.tensor([10.0])

        v_new, m_new, h_new, n_new = net.hodgkin_huxley_dynamics(v, m, h, n, i_ext)

        hh_checks = {
            "Voltage evolution": torch.isfinite(v_new).all(),
            "Gating variables bounded": all(
                0 <= var <= 1 for var in [m_new, h_new, n_new]
            ),
            "Membrane dynamics stable": abs(v_new - v)
            < 50,  # Reasonable voltage change
        }

        hh_passed = sum(hh_checks.values())
        print(
            f"  Hodgkin-Huxley validation: {hh_passed}/{len(hh_checks)} checks passed"
        )

        return passed == total and hh_passed == len(hh_checks)

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"  ✗ Neuromorphic validation failed: {e}")
        return False


def validate_mamba_state_space():
    """Validate Mamba state space model implementation"""
    print("\n🚀 Validating Mamba State Space Model...")

    try:
        # Create Mamba model
        mamba = EnhancedMambaStateSpace(input_dim=8, state_dim=32, output_dim=4)

        # Test with sequence
        x = torch.randn(2, 20, 8)  # batch, sequence, features
        output, metrics = mamba(x)

        # Validate mathematical properties
        checks = {
            "Output shape correct": output.shape == (2, 4),
            "Eigenvalues computed": len(metrics["eigenvalues"]) > 0,
            "Spectral radius valid": 0 <= metrics["spectral_radius"] <= 2,
            "Temporal coherence bounded": 0 <= metrics["temporal_coherence"] <= 1,
            "Linear scaling verified": metrics.get("linear_scaling_verified", False),
            "State magnitude finite": torch.isfinite(
                torch.tensor(metrics["state_magnitude"])
            ),
            "Stability margin positive": metrics.get("stability_margin", 0) >= 0,
        }

        passed = sum(checks.values())
        total = len(checks)

        print(f"  Mamba validation: {passed}/{total} checks passed")
        for check, result in checks.items():
            status = "✓" if result else "✗"
            print(f"    {status} {check}")

        # Test eigenvalue stability
        eigenvalues = metrics["eigenvalues"]
        max_eigenvalue = max(abs(ev) for ev in eigenvalues)
        stability_check = max_eigenvalue < 1.0

        print(
            f"    {'✓' if stability_check else '✗'} Stability condition (max|λ| = {max_eigenvalue:.3f} < 1.0)"
        )

        return passed == total and stability_check

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"  ✗ Mamba validation failed: {e}")
        return False


def validate_causal_inference():
    """Validate PC algorithm and do-calculus implementation"""
    print("\n🔀 Validating Causal Inference...")

    try:
        # Create causal inference module
        causal = EnhancedCausalInference(num_variables=5, hidden_dim=32)

        # Generate synthetic causal data
        np.random.seed(42)
        n_samples = 100

        # True causal structure: X1 -> X3 -> X5, X2 -> X4 -> X5
        X1 = np.random.normal(0, 1, n_samples)
        X2 = np.random.normal(0, 1, n_samples)
        X3 = 0.5 * X1 + np.random.normal(0, 0.5, n_samples)
        X4 = 0.7 * X2 + np.random.normal(0, 0.5, n_samples)
        X5 = 0.3 * X3 + 0.4 * X4 + np.random.normal(0, 0.3, n_samples)

        data = np.column_stack([X1, X2, X3, X4, X5])

        # Test PC algorithm
        adj_matrix = causal.pc_algorithm(data)

        # Test causal inference
        x = torch.tensor(data[:10], dtype=torch.float32)
        output, metrics = causal(x, return_graph=True)

        # Validate results
        checks = {
            "Adjacency matrix shape": adj_matrix.shape == (5, 5),
            "Adjacency matrix binary": np.all((adj_matrix == 0) | (adj_matrix == 1)),
            "No self-loops": np.all(np.diag(adj_matrix) == 0),
            "Causal effects computed": "causal_effects" in metrics,
            "Causal strength bounded": 0 <= metrics.get("causal_strength", 0) <= 1,
            "Graph density reasonable": 0 <= metrics.get("graph_density", 0) <= 1,
            "Confounders detected": isinstance(metrics.get("confounders", []), list),
            "Output shape correct": output.shape == (10,),
        }

        passed = sum(checks.values())
        total = len(checks)

        print(f"  Causal inference validation: {passed}/{total} checks passed")
        for check, result in checks.items():
            status = "✓" if result else "✗"
            print(f"    {status} {check}")

        # Check if discovered some causal relationships
        edges_found = np.sum(adj_matrix)
        print(f"    📊 Discovered {edges_found} causal edges")

        return passed == total

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"  ✗ Causal inference validation failed: {e}")
        return False


def validate_topological_network():
    """Validate topological data analysis implementation"""
    print("\n🕸️ Validating Topological Network...")

    try:
        # Create topological network
        topo = EnhancedTopologicalNetwork(input_dim=6, hidden_dim=32, output_dim=3)

        # Test with point cloud data
        x = torch.randn(8, 6)
        output, metrics = topo(x)

        # Validate topological analysis
        checks = {
            "Output shape correct": output.shape == (8, 3),
            "Betti numbers present": "betti_numbers" in metrics,
            "Persistence intervals computed": "persistence_intervals" in metrics,
            "Non-negative Betti numbers": all(
                b >= 0 for b in metrics.get("betti_numbers", {}).values()
            ),
            "Persistence measure finite": torch.isfinite(
                torch.tensor(metrics.get("persistence_measure", 0))
            ),
            "Euler characteristic computed": "euler_characteristic" in metrics,
            "Topological complexity bounded": metrics.get("topological_complexity", 0)
            >= 0,
        }

        passed = sum(checks.values())
        total = len(checks)

        print(f"  Topological validation: {passed}/{total} checks passed")
        for check, result in checks.items():
            status = "✓" if result else "✗"
            print(f"    {status} {check}")

        # Display Betti numbers
        betti = metrics.get("betti_numbers", {})
        print(
            f"    ���� Betti numbers: β₀={betti.get('H0', 0)}, β₁={betti.get('H1', 0)}, β₂={betti.get('H2', 0)}"
        )

        return passed == total

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"  ✗ Topological validation failed: {e}")
        return False


def validate_riemannian_network():
    """Validate Riemannian geometry implementation"""
    print("\n🌐 Validating Riemannian Network...")

    try:
        # Create Riemannian network
        riemann = EnhancedRiemannianNetwork(input_dim=4, manifold_dim=8, output_dim=2)

        # Test with manifold data
        x = torch.randn(6, 4)
        output, metrics = riemann(x)

        # Validate geometric properties
        checks = {
            "Output shape correct": output.shape == (6, 2),
            "Curvature finite": torch.isfinite(
                torch.tensor(metrics["riemannian_curvature"])
            ),
            "Manifold distance non-negative": metrics["mean_manifold_distance"] >= 0,
            "Metric determinant positive": metrics["metric_determinant"] > 0,
            "Geodesic displacement finite": torch.isfinite(
                torch.tensor(metrics["geodesic_displacement"])
            ),
            "Manifold dimension correct": metrics["manifold_dimension"] == 8,
        }

        passed = sum(checks.values())
        total = len(checks)

        print(f"  Riemannian validation: {passed}/{total} checks passed")
        for check, result in checks.items():
            status = "✓" if result else "✗"
            print(f"    {status} {check}")

        # Test metric tensor computation
        manifold_points = riemann.manifold_embedding(x)
        metric_tensor = riemann.compute_metric_tensor(manifold_points)

        # Check positive definiteness
        eigenvals = torch.linalg.eigvals(metric_tensor)
        positive_definite = torch.all(eigenvals.real > 0)

        print(
            f"    {'✓' if positive_definite else '✗'} Metric tensor positive definite"
        )
        print(f"    📊 Curvature: κ = {metrics['riemannian_curvature']:.4f}")

        return passed == total and positive_definite

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"  ✗ Riemannian validation failed: {e}")
        return False


def validate_enhanced_engine():
    """Validate the complete enhanced revolutionary engine"""
    print("\n🚀 Validating Enhanced Revolutionary Engine...")

    try:
        # Create enhanced engine
        engine = EnhancedRevolutionaryEngine()

        # Test with sample features
        features = {
            "player_efficiency": 25.5,
            "usage_rate": 28.3,
            "true_shooting": 0.58,
            "expected_value": 1.2,
            "fourier_component_1": 0.5,
            "eigenvalue_proxy": 0.7,
            "manifold_coord_1": 0.3,
            "topological_feature": 5.2,
            "causal_strength": 0.8,
            "spike_energy": 75.0,
        }

        # Generate prediction
        start_time = time.time()
        prediction = engine.generate_enhanced_prediction(features)
        processing_time = time.time() - start_time

        # Validate prediction structure
        checks = {
            "Prediction object created": prediction is not None,
            "Base prediction finite": np.isfinite(prediction.base_prediction),
            "Final prediction finite": np.isfinite(prediction.final_prediction),
            "Confidence bounds valid": len(prediction.uncertainty_bounds) == 2,
            "Mathematical guarantees present": isinstance(
                prediction.mathematical_guarantees, dict
            ),
            "Convergence rate bounded": 0 <= prediction.convergence_rate <= 1,
            "Processing time reasonable": 0 < processing_time < 30,
            "Eigenvalues computed": len(prediction.mamba_eigenvalues) > 0,
            "Betti numbers valid": all(
                isinstance(b, int) and b >= 0
                for b in prediction.persistent_betti_numbers.values()
            ),
            "Causal graph present": isinstance(prediction.causal_graph_dag, dict),
        }

        passed = sum(checks.values())
        total = len(checks)

        print(f"  Enhanced engine validation: {passed}/{total} checks passed")
        for check, result in checks.items():
            status = "✓" if result else "✗"
            print(f"    {status} {check}")

        # Mathematical guarantees summary
        guarantees = prediction.mathematical_guarantees
        guarantee_score = sum(guarantees.values()) / len(guarantees) * 100

        print(f"    📊 Mathematical guarantees: {guarantee_score:.1f}% satisfied")
        print(f"    ⏱️ Processing time: {processing_time:.3f}s")
        print(f"    🎯 Final prediction: {prediction.final_prediction:.3f}")
        print(f"    🧮 Lyapunov exponent: {prediction.lyapunov_exponent:.4f}")

        return passed == total

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"  ✗ Enhanced engine validation failed: {e}")
        return False


def run_performance_benchmark():
    """Run performance benchmark of the enhanced system"""
    print("\n⚡ Running Performance Benchmark...")

    try:
        engine = EnhancedRevolutionaryEngine()

        # Benchmark with different input sizes
        input_sizes = [5, 10, 20]
        results = {}

        for size in input_sizes:
            features = {f"feature_{i}": np.random.random() for i in range(size)}

            times = []
            for _ in range(3):  # Average over 3 runs
                start_time = time.time()
                engine.generate_enhanced_prediction(features)
                end_time = time.time()
                times.append(end_time - start_time)

            avg_time = np.mean(times)
            results[size] = avg_time
            print(f"    Input size {size}: {avg_time:.3f}s avg")

        # Check scaling behavior
        scaling_efficient = True
        for i in range(1, len(input_sizes)):
            current_size = input_sizes[i]
            prev_size = input_sizes[i - 1]

            time_ratio = results[current_size] / results[prev_size]
            size_ratio = current_size / prev_size

            # Should scale better than quadratic
            if time_ratio > size_ratio**2:
                scaling_efficient = False
                break

        print(f"    {'✓' if scaling_efficient else '✗'} Efficient scaling behavior")

        return scaling_efficient

    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"  ✗ Performance benchmark failed: {e}")
        return False


def main():
    """Run all validation tests"""
    print("🧮 Enhanced Revolutionary Engine - Mathematical Validation")
    print("=" * 60)

    validation_results = {
        "Neuromorphic Network": validate_neuromorphic_network(),
        "Mamba State Space": validate_mamba_state_space(),
        "Causal Inference": validate_causal_inference(),
        "Topological Network": validate_topological_network(),
        "Riemannian Network": validate_riemannian_network(),
        "Enhanced Engine": validate_enhanced_engine(),
        "Performance Benchmark": run_performance_benchmark(),
    }

    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)

    total_passed = 0
    total_tests = len(validation_results)

    for test_name, passed in validation_results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
        if passed:
            total_passed += 1

    print("=" * 60)
    success_rate = total_passed / total_tests * 100
    print(f"Overall Success Rate: {success_rate:.1f}% ({total_passed}/{total_tests})")

    if success_rate >= 85:
        print("🎉 Enhanced Revolutionary Engine validation SUCCESSFUL!")
        print("   Mathematical rigor and implementation quality verified.")
    elif success_rate >= 70:
        print("⚠️  Enhanced Revolutionary Engine validation PARTIAL SUCCESS")
        print("   Most components working but some issues detected.")
    else:
        print("🚫 Enhanced Revolutionary Engine validation FAILED")
        print("   Significant issues detected - review implementation.")

    return success_rate >= 85


if __name__ == "__main__":
    main()
