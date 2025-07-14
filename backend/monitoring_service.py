# Copied and adapted from Newfolder backend/services/monitoring_service.py
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

# Adjust import paths as needed for Alpha1
# from ..core.config.config import get_settings
# from ..database import get_database


class AsyncDatabaseInterface:
    """Abstract async database interface for dependency injection.
    Replace with actual implementation (e.g., SQLAlchemy, MongoDB).
    """

    async def insert_performance(self, data: PerformanceData) -> None:
        pass

    async def aggregate_performance(
        self,
        start_time: Optional[datetime],
        end_time: Optional[datetime],
        metric_name: Optional[str],
    ) -> Dict[str, Any]:
        return {}

    async def query_alerts(self) -> List[PerformanceAlert]:
        return []

    async def aggregate_trends(
        self, metric_name: str, interval: str, limit: int
    ) -> List[Dict[str, Any]]:
        return []

    async def insert_alerts(self, alerts: List[PerformanceAlert]) -> None:
        pass

    async def update_aggregates(self, data: PerformanceData) -> None:
        pass


class PerformanceData(BaseModel):
    timestamp: datetime
    metrics: Dict[str, Dict[str, float]]
    model_config = {"protected_namespaces": ()}


class PerformanceAlert(BaseModel):
    metric_name: str
    threshold: float
    current_value: float
    timestamp: datetime
    severity: str
    model_config = {"protected_namespaces": ()}


class MonitoringService:
    """Service for monitoring and aggregating model/system performance metrics.
    Integrates with an async database via dependency injection.
    """

    def __init__(self, db: Optional[AsyncDatabaseInterface] = None):
        """Args:
        ----
            db: Async database interface (inject actual implementation in production).

        """
        self.db = db or AsyncDatabaseInterface()
        self.alert_thresholds = {
            "response_time": 1000,  # ms
            "error_rate": 0.01,  # 1%
            "cpu_usage": 80,  # percentage
            "memory_usage": 80,  # percentage
        }
        self.alert_severities = {
            "response_time": {
                "warning": 500,  # ms
                "critical": 1000,  # ms
            },
            "error_rate": {
                "warning": 0.005,  # 0.5%
                "critical": 0.01,  # 1%
            },
        }

    async def record_performance(self, data: PerformanceData) -> None:
        """Store raw performance data in the database.

        Args:
        ----
            data: PerformanceData object to store.

        """
        try:
            await self.db.insert_performance(data)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error("Error recording performance data: {e!s}")
            raise

    async def get_performance_summary(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        metric_name: Optional[str] = None,
    ) -> Dict:
        """Aggregate and return performance summary from the database.

        Args:
        ----
            start_time: Start of aggregation window.
            end_time: End of aggregation window.
            metric_name: Optional metric to filter.

        Returns:
        -------
            Aggregated performance summary as a dict.

        """
        try:
            return await self.db.aggregate_performance(
                start_time, end_time, metric_name
            )
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error("Error getting performance summary: {e!s}")
            raise

    async def get_performance_alerts(self) -> List[PerformanceAlert]:
        """Query and return all performance alerts from the database.

        Returns
        -------
            List of PerformanceAlert objects.

        """
        try:
            return await self.db.query_alerts()
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error("Error getting performance alerts: {e!s}")
            raise

    async def get_performance_trends(
        self, metric_name: str, interval: str = "1h", limit: int = 24
    ) -> List[Dict]:
        """Aggregate and return performance trends for a metric.

        Args:
        ----
            metric_name: Name of the metric.
            interval: Aggregation interval (e.g., '1h').
            limit: Number of intervals to return.

        Returns:
        -------
            List of trend data dicts.

        """
        try:
            return await self.db.aggregate_trends(metric_name, interval, limit)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error("Error getting performance trends: {e!s}")
            raise

    async def _check_alerts(self, data: PerformanceData) -> List[PerformanceAlert]:
        alerts = []
        for metric_name, values in data.metrics.items():
            if metric_name in self.alert_severities:
                current_value = values.get("value", 0)
                thresholds = self.alert_severities[metric_name]
                if current_value >= thresholds["critical"]:
                    alerts.append(
                        PerformanceAlert(
                            metric_name=metric_name,
                            threshold=thresholds["critical"],
                            current_value=current_value,
                            timestamp=data.timestamp,
                            severity="critical",
                        )
                    )
                elif current_value >= thresholds["warning"]:
                    alerts.append(
                        PerformanceAlert(
                            metric_name=metric_name,
                            threshold=thresholds["warning"],
                            current_value=current_value,
                            timestamp=data.timestamp,
                            severity="warning",
                        )
                    )
        return alerts

    async def _store_alerts(self, alerts: List[PerformanceAlert]) -> None:
        """Store generated alerts in the database.

        Args:
        ----
            alerts: List of PerformanceAlert objects.

        """
        try:
            await self.db.insert_alerts(alerts)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error("Error storing alerts: {e!s}")
            raise

    async def _update_aggregated_metrics(self, data: PerformanceData) -> None:
        """Update aggregated metrics in the database.

        Args:
        ----
            data: PerformanceData object.

        """
        try:
            await self.db.update_aggregates(data)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logging.error("Error updating aggregated metrics: {e!s}")
            raise

    def _parse_interval(self, interval: str) -> int:
        unit = interval[-1]
        value = int(interval[:-1])
        if unit == "s":
            return value
        elif unit == "m":
            return value * 60
        elif unit == "h":
            return value * 3600
        elif unit == "d":
            return value * 86400
        else:
            raise ValueError(f"Invalid interval unit: {unit}")


# Singleton instance
monitoring_service = MonitoringService()
