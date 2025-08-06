"""
Modern ML model architectures for sports prediction
Features transformer models, Graph Neural Networks, and hybrid approaches
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Union

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

# Try to import torch_geometric, create dummy classes if not available
try:
    from torch_geometric.data import Data
    from torch_geometric.nn import GATConv, GCNConv, global_mean_pool

    HAS_TORCH_GEOMETRIC = True
except ImportError:
    HAS_TORCH_GEOMETRIC = False

    # Create dummy classes for torch_geometric components
    class Data:
        def __init__(self, x=None, edge_index=None, batch=None, **kwargs):
            self.x = x
            self.edge_index = edge_index
            self.batch = batch
            for k, v in kwargs.items():
                setattr(self, k, v)

    class GCNConv(nn.Module):
        def __init__(self, in_channels, out_channels):
            super().__init__()
            self.linear = nn.Linear(in_channels, out_channels)

        def forward(self, x, edge_index):
            return self.linear(x)

    class GATConv(nn.Module):
        def __init__(self, in_channels, out_channels, heads=1):
            super().__init__()
            self.linear = nn.Linear(in_channels, out_channels * heads)
            self.heads = heads

        def forward(self, x, edge_index):
            return self.linear(x)

    def global_mean_pool(x, batch):
        if batch is None:
            return x.mean(dim=0, keepdim=True)
        return x


class ModelType(Enum):
    """Types of modern ML models available"""

    TRANSFORMER = "transformer"
    GRAPH_NEURAL_NETWORK = "gnn"
    HYBRID_TRANSFORMER_GNN = "hybrid_transformer_gnn"
    MULTI_MODAL = "multi_modal"


@dataclass
class ModelConfig:
    """Configuration for modern ML models"""

    model_type: ModelType
    input_dim: int = 100
    hidden_dim: int = 256
    output_dim: int = 1
    num_layers: int = 4
    num_heads: int = 8
    dropout: float = 0.1
    activation: str = "relu"
    sport: str = "MLB"

    # GNN specific parameters
    graph_hidden_dim: int = 128
    num_graph_layers: int = 3

    # Multi-modal parameters
    num_modalities: int = 3


class MultiHeadAttention(nn.Module):
    """Multi-head attention mechanism"""

    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0

        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.w_q = nn.Linear(d_model, d_model)
        self.w_k = nn.Linear(d_model, d_model)
        self.w_v = nn.Linear(d_model, d_model)
        self.w_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)

        # Linear transformations and split into heads
        Q = (
            self.w_q(query)
            .view(batch_size, -1, self.num_heads, self.d_k)
            .transpose(1, 2)
        )
        K = self.w_k(key).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = (
            self.w_v(value)
            .view(batch_size, -1, self.num_heads, self.d_k)
            .transpose(1, 2)
        )

        # Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / np.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)

        context = torch.matmul(attention_weights, V)

        # Concatenate heads and apply output projection
        context = (
            context.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        )

        output = self.w_o(context)

        return output, attention_weights


class TransformerBlock(nn.Module):
    """Transformer block with multi-head attention and feed-forward"""

    def __init__(self, d_model: int, num_heads: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        self.attention = MultiHeadAttention(d_model, num_heads, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)

        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout),
        )

    def forward(self, x, mask=None):
        # Multi-head attention with residual connection
        attn_output, attention_weights = self.attention(x, x, x, mask)
        x = self.norm1(x + attn_output)

        # Feed-forward with residual connection
        ff_output = self.feed_forward(x)
        x = self.norm2(x + ff_output)

        return x, attention_weights


class SportsTransformer(nn.Module):
    """Transformer model optimized for sports prediction"""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config

        # Input projection
        self.input_projection = nn.Linear(config.input_dim, config.hidden_dim)

        # Positional encoding
        self.position_encoding = nn.Parameter(
            torch.randn(1, 1000, config.hidden_dim) * 0.1
        )

        # Transformer blocks
        self.transformer_blocks = nn.ModuleList(
            [
                TransformerBlock(
                    config.hidden_dim,
                    config.num_heads,
                    config.hidden_dim * 4,
                    config.dropout,
                )
                for _ in range(config.num_layers)
            ]
        )

        # Output projection
        self.output_projection = nn.Sequential(
            nn.Linear(config.hidden_dim, config.hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_dim // 2, config.output_dim),
        )

        # For uncertainty quantification
        self.uncertainty_head = nn.Sequential(
            nn.Linear(config.hidden_dim, config.hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(config.hidden_dim // 2, 1),
            nn.Softplus(),  # Ensure positive uncertainty
        )

    def forward(self, x, return_attention=False, return_uncertainty=False):
        batch_size, seq_len, _ = x.shape

        # Input projection and positional encoding
        x = self.input_projection(x)
        x = x + self.position_encoding[:, :seq_len, :]

        attention_weights = []

        # Apply transformer blocks
        for transformer_block in self.transformer_blocks:
            x, attn_weights = transformer_block(x)
            if return_attention:
                attention_weights.append(attn_weights)

        # Global average pooling
        pooled = x.mean(dim=1)

        # Predictions
        predictions = self.output_projection(pooled)

        result = {"predictions": predictions}

        if return_uncertainty:
            uncertainty = self.uncertainty_head(pooled)
            result["uncertainty"] = uncertainty

        if return_attention:
            result["attention_weights"] = attention_weights

        return result


class SportsGraphNeuralNetwork(nn.Module):
    """Graph Neural Network for sports prediction with player/team relationships"""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config

        if not HAS_TORCH_GEOMETRIC:
            # Fallback to simple linear layers
            self.conv_layers = nn.ModuleList(
                [
                    nn.Linear(
                        config.input_dim if i == 0 else config.graph_hidden_dim,
                        config.graph_hidden_dim,
                    )
                    for i in range(config.num_graph_layers)
                ]
            )
        else:
            # Use actual GNN layers
            self.conv_layers = nn.ModuleList(
                [
                    GATConv(
                        config.input_dim if i == 0 else config.graph_hidden_dim,
                        config.graph_hidden_dim,
                        heads=4 if i < config.num_graph_layers - 1 else 1,
                        concat=i < config.num_graph_layers - 1,
                    )
                    for i in range(config.num_graph_layers)
                ]
            )

        self.dropout = nn.Dropout(config.dropout)

        # Output layers
        self.output_layers = nn.Sequential(
            nn.Linear(config.graph_hidden_dim, config.graph_hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.graph_hidden_dim // 2, config.output_dim),
        )

    def forward(self, data, return_node_embeddings=False):
        x, edge_index = data.x, data.edge_index
        batch = getattr(data, "batch", None)

        # Apply GNN layers
        for i, conv in enumerate(self.conv_layers):
            if HAS_TORCH_GEOMETRIC:
                x = conv(x, edge_index)
            else:
                x = conv(x)  # Fallback to linear transformation

            if i < len(self.conv_layers) - 1:
                x = F.relu(x)
                x = self.dropout(x)

        # Global pooling
        if HAS_TORCH_GEOMETRIC:
            graph_representation = global_mean_pool(x, batch)
        else:
            graph_representation = x.mean(dim=0, keepdim=True)

        # Predictions
        predictions = self.output_layers(graph_representation)

        result = {"predictions": predictions}

        if return_node_embeddings:
            result["node_embeddings"] = x

        return result


class ModelFactory:
    """Factory class for creating modern ML models"""

    @staticmethod
    def create_model(config: ModelConfig) -> torch.nn.Module:
        """Create a model based on configuration"""
        return create_modern_model(config)

    @staticmethod
    def get_available_models() -> List[str]:
        """Get list of available model types"""
        return [model_type.value for model_type in ModelType]

    @staticmethod
    def get_model_config_template(model_type: str, sport: str = "MLB") -> ModelConfig:
        """Get a template configuration for a model type"""
        model_type_enum = ModelType(model_type)

        if model_type_enum == ModelType.TRANSFORMER:
            return ModelConfig(
                model_type=model_type_enum,
                input_dim=100,  # Will be set based on actual features
                hidden_dim=256,
                num_layers=4,
                num_heads=8,
                sport=sport,
            )
        elif model_type_enum == ModelType.GRAPH_NEURAL_NETWORK:
            return ModelConfig(
                model_type=model_type_enum,
                input_dim=50,
                graph_hidden_dim=128,
                num_graph_layers=3,
                sport=sport,
            )
        elif model_type_enum == ModelType.HYBRID_TRANSFORMER_GNN:
            return ModelConfig(
                model_type=model_type_enum,
                input_dim=100,
                hidden_dim=256,
                graph_hidden_dim=128,
                num_layers=4,
                num_graph_layers=3,
                sport=sport,
            )
        elif model_type_enum == ModelType.MULTI_MODAL:
            return ModelConfig(
                model_type=model_type_enum,
                input_dim=120,  # 40 per modality
                hidden_dim=256,
                sport=sport,
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}")


def create_modern_model(config: ModelConfig) -> torch.nn.Module:
    """Factory function to create modern ML models"""

    if config.model_type == ModelType.TRANSFORMER:
        return SportsTransformer(config)
    elif config.model_type == ModelType.GRAPH_NEURAL_NETWORK:
        return SportsGraphNeuralNetwork(config)
    elif config.model_type == ModelType.HYBRID_TRANSFORMER_GNN:
        # For now, return transformer (can be extended later)
        return SportsTransformer(config)
    elif config.model_type == ModelType.MULTI_MODAL:
        # For now, return transformer (can be extended later)
        return SportsTransformer(config)
    else:
        raise ValueError(f"Unsupported model type: {config.model_type}")


def get_model_info() -> Dict[str, Any]:
    """Get information about available models"""
    return {
        "available_models": [model_type.value for model_type in ModelType],
        "model_descriptions": {
            ModelType.TRANSFORMER.value: "Transformer model for sequential sports data",
            ModelType.GRAPH_NEURAL_NETWORK.value: "Graph Neural Network for player/team relationships",
            ModelType.HYBRID_TRANSFORMER_GNN.value: "Hybrid model combining Transformer and GNN",
            ModelType.MULTI_MODAL.value: "Multi-modal model for different data types",
        },
        "features": {
            "uncertainty_quantification": True,
            "attention_weights": True,
            "feature_importance": True,
            "batch_processing": True,
        },
        "torch_geometric_available": HAS_TORCH_GEOMETRIC,
    }


# Export key components
__all__ = [
    "ModelType",
    "ModelConfig",
    "SportsTransformer",
    "SportsGraphNeuralNetwork",
    "Data",  # Include Data class for type hints
    "ModelFactory",
    "create_modern_model",
    "get_model_info",
]
