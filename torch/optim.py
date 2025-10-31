"""Minimal shim for torch.optim used only to satisfy import-time references."""


class Optimizer:
    def __init__(self, params, lr=0.001):
        self.params = params
        self.lr = lr

    def step(self):
        pass

    def zero_grad(self):
        pass


class Adam(Optimizer):
    def __init__(self, params, lr=0.001):
        super().__init__(params, lr=lr)


__all__ = ["Optimizer", "Adam"]
