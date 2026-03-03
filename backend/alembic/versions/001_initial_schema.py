"""initial schema: users, subscriptions, natal_charts, ai_interpretations

Revision ID: 001
Revises:
Create Date: 2026-03-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enums ──────────────────────────────────────────────────────────────
    subscription_plan = postgresql.ENUM(
        "free", "basic", "premium", name="subscriptionplan"
    )
    subscription_status = postgresql.ENUM(
        "active", "cancelled", "expired", name="subscriptionstatus"
    )
    subscription_plan.create(op.get_bind())
    subscription_status.create(op.get_bind())

    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(100), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("username", name="uq_users_username"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=False)

    # ── subscriptions ──────────────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "plan",
            sa.Enum("free", "basic", "premium", name="subscriptionplan"),
            nullable=False,
            server_default="free",
        ),
        sa.Column(
            "status",
            sa.Enum("active", "cancelled", "expired", name="subscriptionstatus"),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_subscriptions_user_id", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_subscriptions_user_id"),
    )
    op.create_index(
        "ix_subscriptions_user_id", "subscriptions", ["user_id"], unique=True
    )

    # ── natal_charts ───────────────────────────────────────────────────────
    op.create_table(
        "natal_charts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("birth_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("location_name", sa.String(255), nullable=True),
        sa.Column("planets_data", postgresql.JSONB(), nullable=False),
        sa.Column("houses_data", postgresql.JSONB(), nullable=False),
        sa.Column("aspects_data", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_natal_charts_user_id", ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_natal_charts_user_id", "natal_charts", ["user_id"])
    op.create_index("ix_natal_charts_birth_date", "natal_charts", ["birth_date"])
    op.create_index(
        "ix_natal_charts_user_id_birth_date",
        "natal_charts",
        ["user_id", "birth_date"],
    )

    # ── ai_interpretations ─────────────────────────────────────────────────
    op.create_table(
        "ai_interpretations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("natal_chart_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("prompt_hash", sa.String(32), nullable=False),
        sa.Column("interpretation_text", sa.Text(), nullable=False),
        sa.Column("model_version", sa.String(50), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["natal_chart_id"],
            ["natal_charts.id"],
            name="fk_ai_interpretations_natal_chart_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_interpretations_natal_chart_id",
        "ai_interpretations",
        ["natal_chart_id"],
    )
    op.create_index(
        "ix_ai_interpretations_prompt_hash", "ai_interpretations", ["prompt_hash"]
    )


def downgrade() -> None:
    op.drop_table("ai_interpretations")
    op.drop_table("natal_charts")
    op.drop_table("subscriptions")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS subscriptionplan")
    op.execute("DROP TYPE IF EXISTS subscriptionstatus")
