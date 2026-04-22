from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(40), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(100))
    segment: Mapped[str] = mapped_column(String(40), default="student")
    status: Mapped[str] = mapped_column(String(20), default="active")
    orbit_level: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    cards: Mapped[list["Card"]] = relationship(back_populates="user")


class Card(Base):
    __tablename__ = "cards"

    card_id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    product_type: Mapped[str] = mapped_column(String(40), default="halva_youth")
    activation_state: Mapped[str] = mapped_column(String(20), default="activated")

    user: Mapped["User"] = relationship(back_populates="cards")


class EventLog(Base):
    __tablename__ = "event_log"

    event_id: Mapped[str] = mapped_column(String(40), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    event_type: Mapped[str] = mapped_column(String(60), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="received")
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class PlanetProgress(Base):
    __tablename__ = "planet_progress"
    __table_args__ = (UniqueConstraint("user_id", "planet_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    planet_code: Mapped[str] = mapped_column(String(40))
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class OrbitState(Base):
    __tablename__ = "orbit_state"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), primary_key=True)
    total_energy: Mapped[int] = mapped_column(Integer, default=0)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    orbit_level: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Quest(Base):
    __tablename__ = "quests"

    quest_id: Mapped[str] = mapped_column(String(40), primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    planet_code: Mapped[str] = mapped_column(String(40))
    condition_type: Mapped[str] = mapped_column(String(40))
    threshold: Mapped[float] = mapped_column(Float)
    reward_kind: Mapped[str] = mapped_column(String(40))
    reward_value: Mapped[float] = mapped_column(Float)
    season: Mapped[str] = mapped_column(String(20), default="launch")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class QuestProgress(Base):
    __tablename__ = "quest_progress"
    __table_args__ = (UniqueConstraint("user_id", "quest_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    quest_id: Mapped[str] = mapped_column(ForeignKey("quests.quest_id"), index=True)
    current_value: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(20), default="active")
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class RewardLedger(Base):
    __tablename__ = "reward_ledger"

    ledger_id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("ldg"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    source_event_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    reward_type: Mapped[str] = mapped_column(String(40))
    amount: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class GameRun(Base):
    __tablename__ = "game_runs"

    run_id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("run"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    game_code: Mapped[str] = mapped_column(String(40), index=True)
    planet_code: Mapped[str] = mapped_column(String(40), index=True)
    score: Mapped[int] = mapped_column(Integer, default=0)
    base_reward: Mapped[int] = mapped_column(Integer, default=0)
    total_reward: Mapped[int] = mapped_column(Integer, default=0)
    bonus_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    source_event_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class BoosterWindow(Base):
    __tablename__ = "booster_windows"

    booster_id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("bst"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    category: Mapped[str] = mapped_column(String(40))
    boost_rate: Mapped[float] = mapped_column(Float, default=0)
    start_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    end_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default="active")


class Referral(Base):
    __tablename__ = "referrals"

    referral_id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("ref"))
    inviter_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    invitee_id: Mapped[str] = mapped_column(String(40))
    state: Mapped[str] = mapped_column(String(20), default="invited")
    activated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Friendship(Base):
    __tablename__ = "friendships"

    friendship_id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("frd"))
    requester_user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    target_user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    source: Mapped[str] = mapped_column(String(20), default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class InstallmentProfile(Base):
    __tablename__ = "installment_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), primary_key=True)
    current_limit: Mapped[float] = mapped_column(Float, default=150.0)
    available_limit: Mapped[float] = mapped_column(Float, default=150.0)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    on_time_payments_3m: Mapped[int] = mapped_column(Integer, default=0)
    late_flags: Mapped[int] = mapped_column(Integer, default=0)


class RiskFlag(Base):
    __tablename__ = "risk_flags"

    risk_flag_id: Mapped[str] = mapped_column(String(40), primary_key=True, default=lambda: generate_id("risk"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), index=True)
    flag_type: Mapped[str] = mapped_column(String(40))
    severity: Mapped[int] = mapped_column(Integer, default=1)
    detail: Mapped[str] = mapped_column(String(255), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class KpiSnapshot(Base):
    __tablename__ = "kpi_snapshots"

    snapshot_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    active_users: Mapped[int] = mapped_column(Integer, default=0)
    activation_rate: Mapped[float] = mapped_column(Float, default=0)
    partner_share: Mapped[float] = mapped_column(Float, default=0)
    average_tx_frequency: Mapped[float] = mapped_column(Float, default=0)
    on_time_payment_rate: Mapped[float] = mapped_column(Float, default=0)
    referral_activation_rate: Mapped[float] = mapped_column(Float, default=0)
    reward_to_revenue_ratio: Mapped[float] = mapped_column(Float, default=0)
    k_factor: Mapped[float] = mapped_column(Float, default=0)
    total_rewards: Mapped[float] = mapped_column(Float, default=0)
    total_revenue: Mapped[float] = mapped_column(Float, default=0)
    guardrail_headroom: Mapped[float] = mapped_column(Float, default=0)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
