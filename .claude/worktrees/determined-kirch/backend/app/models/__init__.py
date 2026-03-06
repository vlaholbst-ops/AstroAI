"""
Регистрация всех SQLAlchemy моделей.
Импортировать этот пакет перед Base.metadata.create_all() или Alembic.
"""

from app.models.user import User
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.natal_chart import NatalChart
from app.models.ai_interpretation import AIInterpretation

__all__ = [
    "User",
    "Subscription",
    "SubscriptionPlan",
    "SubscriptionStatus",
    "NatalChart",
    "AIInterpretation",
]
