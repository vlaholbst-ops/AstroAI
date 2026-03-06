"""
SQLAlchemy модель: natal_charts
"""

import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class NatalChart(Base):
    __tablename__ = "natal_charts"
    __table_args__ = (
        Index("ix_natal_charts_user_id_birth_date", "user_id", "birth_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    birth_date = Column(DateTime(timezone=True), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    planets_data = Column(JSONB, nullable=False)
    houses_data = Column(JSONB, nullable=False)
    aspects_data = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="natal_charts")
    interpretations = relationship(
        "AIInterpretation",
        back_populates="natal_chart",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<NatalChart(id={self.id}, birth_date={self.birth_date})>"
