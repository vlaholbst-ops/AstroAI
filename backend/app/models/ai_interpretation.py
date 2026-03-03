"""
SQLAlchemy модель: ai_interpretations
"""

import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class AIInterpretation(Base):
    __tablename__ = "ai_interpretations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    natal_chart_id = Column(
        UUID(as_uuid=True),
        ForeignKey("natal_charts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # MD5 хеш входных данных (birth_date + lat + lon) — дублирует Redis-ключ для SQL-поиска
    prompt_hash = Column(String(32), nullable=False, index=True)
    interpretation_text = Column(Text, nullable=False)
    model_version = Column(String(50), nullable=True)
    token_count = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationship
    natal_chart = relationship("NatalChart", back_populates="interpretations")

    def __repr__(self) -> str:
        return f"<AIInterpretation(id={self.id}, natal_chart_id={self.natal_chart_id})>"
