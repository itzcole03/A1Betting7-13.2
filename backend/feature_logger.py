# Copied and adapted from Newfolder (example structure)
import logging
from typing import Any


class FeatureLogger:
    def __init__(self, name: str = "FeatureLogger"):
        self.logger = logging.getLogger(name)
        if not self.logger.hasHandlers():
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log(self, message: str, level: str = "info", **kwargs: Any):
        if level == "info":
            self.logger.info(message, extra=kwargs)
        elif level == "warning":
            self.logger.warning(message, extra=kwargs)
        elif level == "error":
            self.logger.error(message, extra=kwargs)
        elif level == "debug":
            self.logger.debug(message, extra=kwargs)
        else:
            self.logger.info(message, extra=kwargs)
