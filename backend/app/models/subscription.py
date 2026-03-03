"""
SQLAlchemy модель: subscriptions
"""

import enum
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum as SQLEnum

from app.db.session import Base


class SubscriptionPlan(str, enum.Enum):
    free = "free"
    basic = "basic"
    premium = "premium"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    expired = "expired"


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("user_id", name="uq_subscriptions_user_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan = Column(
        SQLEnum(SubscriptionPlan, name="subscriptionplan"),
        nullable=False,
        default=SubscriptionPlan.free,
        server_default="free",
    )
    status = Column(
        SQLEnum(SubscriptionStatus, name="subscriptionstatus"),
        nullable=False,
        default=SubscriptionStatus.active,
        server_default="active",
    )
    started_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationship
    user = relationship("User", back_populates="subscription")

    def __repr__(self) -> str:
        return f"<Subscription(user_id={self.user_id}, plan={self.plan}, status={self.status})>"
