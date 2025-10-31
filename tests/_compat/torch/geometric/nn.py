"""Minimal shim for torch.geometric.nn used by some archived modules.

Kept under tests/_compat to centralize test-only placeholders.
"""


class MessagePassing:
    def __init__(self, *args, **kwargs):
        pass


class GCNConv(MessagePassing):
    def __init__(self, in_channels, out_channels):
        super().__init__()


class GATConv(MessagePassing):
    def __init__(self, in_channels, out_channels, heads=1, **kwargs):
        # Minimal placeholder; archived code only needs the symbol to import.
        super().__init__()


__all__ = ["MessagePassing", "GCNConv", "GATConv"]
