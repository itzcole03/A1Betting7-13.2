# Copied and adapted from Newfolder (example structure)
import logging
from typing import Any, Optional


class FeatureLogger:
    def __init__(
        self,
        name: str = "FeatureLogger",
        json_format: bool = False,
        log_file: Optional[str] = None,
        sentry_dsn: Optional[str] = None,
    ):
        self.logger = logging.getLogger(name)
        if not self.logger.hasHandlers():
            handler = logging.StreamHandler()
            if json_format:
                formatter = logging.Formatter(
                    '{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
                )
            else:
                formatter = logging.Formatter(
                    "[%(asctime)s] %(levelname)s %(name)s: %(message)s"
                )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            if log_file:
                file_handler = logging.FileHandler(log_file, encoding="utf-8")
                file_handler.setFormatter(formatter)
                self.logger.addHandler(file_handler)
        self.logger.setLevel(logging.INFO)
        self.sentry_dsn = sentry_dsn
        if sentry_dsn:
            try:
                import sentry_sdk

                sentry_sdk.init(sentry_dsn)
                self.sentry = sentry_sdk
            except ImportError:
                self.sentry = None
        else:
            self.sentry = None

    def log(self, message: str, level: str = "info", **kwargs: Any):
        if level == "info":
            self.logger.info(message, extra=kwargs)
        elif level == "warning":
            self.logger.warning(message, extra=kwargs)
        elif level == "error":
            self.logger.error(message, extra=kwargs)
            if self.sentry:
                self.sentry.capture_message(message, level="error")
            self._alert("error", message)
        elif level == "debug":
            self.logger.debug(message, extra=kwargs)
        else:
            self.logger.info(message, extra=kwargs)

    def _alert(self, severity: str, message: str):
        # Example: send alert to Slack/email if configured
        import os

        slack_webhook = os.getenv("A1BETTING_ALERT_SLACK_WEBHOOK")
        alert_email = os.getenv("A1BETTING_ALERT_EMAIL")
        if severity == "error" and slack_webhook:
            try:
                try:
                    import requests
                except ImportError:
                    requests = None
                if requests:
                    try:
                        requests.post(
                            slack_webhook,
                            json={"text": f"CRITICAL ERROR: {message}"},
                            timeout=5,
                        )
                    except requests.RequestException:
                        pass
            except Exception:
                pass
        if severity == "error" and alert_email:
            # Placeholder: integrate with email service
            pass
