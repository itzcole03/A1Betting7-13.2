from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class FeatureFlagSetting(Base):
    __tablename__ = "feature_flags"

    name: Mapped[str] = mapped_column(String(100), primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_changed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    toggler: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
