from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


PlanetCode = Literal["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"]
EventType = Literal["txn_posted", "installment_paid_on_time", "referral_activated", "education_module_completed"]
GameCode = Literal["halva_snake", "credit_shield_reactor", "social_ring_signal"]


class DemoLoginRequest(BaseModel):
    user_id: str = "u_demo"
    display_name: str = "Moby Explorer"
    segment: str = "student"


class DemoSessionResponse(BaseModel):
    user_id: str
    token: str


class TxnPostedPayload(BaseModel):
    event_type: Literal["txn_posted"] = "txn_posted"
    event_id: str
    user_id: str
    amount: float = Field(gt=0)
    merchant_id: str
    category: str
    is_partner: bool = False
    is_target_category: bool = False
    device_mismatch: bool = False
    multi_account_signal: bool = False
    timestamp: datetime


class InstallmentPaidPayload(BaseModel):
    event_type: Literal["installment_paid_on_time"] = "installment_paid_on_time"
    event_id: str
    user_id: str
    installment_amount: float = Field(gt=0)
    timestamp: datetime


class ReferralActivatedPayload(BaseModel):
    event_type: Literal["referral_activated"] = "referral_activated"
    event_id: str
    user_id: str
    invitee_id: str
    timestamp: datetime


class EducationCompletedPayload(BaseModel):
    event_type: Literal["education_module_completed"] = "education_module_completed"
    event_id: str
    user_id: str
    module_id: str
    score: int = Field(ge=0, le=100)
    timestamp: datetime


EventPayload = TxnPostedPayload | InstallmentPaidPayload | ReferralActivatedPayload | EducationCompletedPayload


class IngestResponse(BaseModel):
    event_id: str
    status: str


class PlanetProgressOut(BaseModel):
    planet_code: PlanetCode
    xp: int
    level: int


class BoosterWindowOut(BaseModel):
    booster_id: str
    category: str
    boost_rate: float
    start_at: datetime
    end_at: datetime
    status: str


class QuestOut(BaseModel):
    quest_id: str
    title: str
    description: str
    planet_code: str
    condition_type: str
    threshold: float
    reward_kind: str
    reward_value: float
    status: str
    current_value: float


class RewardLedgerOut(BaseModel):
    ledger_id: str
    reward_type: str
    amount: float
    status: str
    created_at: datetime
    meta: dict


class GameRunCreate(BaseModel):
    user_id: str = "u_demo"
    game_code: GameCode
    planet_code: PlanetCode
    score: int = Field(ge=0)
    base_reward: int = Field(ge=0)
    total_reward: int = Field(ge=0)
    bonus_breakdown: dict = Field(default_factory=dict)
    source_event_id: str | None = None


class GameRunOut(BaseModel):
    run_id: str
    user_id: str
    game_code: GameCode
    planet_code: PlanetCode
    score: int
    base_reward: int
    total_reward: int
    bonus_breakdown: dict
    source_event_id: str | None
    created_at: datetime


class GameSummaryItem(BaseModel):
    game_code: GameCode
    planet_code: PlanetCode
    runs: int
    best_score: int
    total_reward: int


class GameSummaryResponse(BaseModel):
    user_id: str
    total_runs: int
    total_reward: int
    games: list[GameSummaryItem]


class InstallmentProfileOut(BaseModel):
    current_limit: float
    available_limit: float
    risk_score: int
    on_time_payments_3m: int
    late_flags: int


class GalaxyProfileResponse(BaseModel):
    user_id: str
    display_name: str
    orbit_level: int
    total_energy: int
    total_xp: int
    partner_share: float
    planets: list[PlanetProgressOut]
    active_boosters: list[BoosterWindowOut]
    quests: list[QuestOut]
    installment_profile: InstallmentProfileOut


class QuestClaimResponse(BaseModel):
    quest_id: str
    status: str
    ledger_id: str


class ReferralInviteRequest(BaseModel):
    invitee_id: str


class ReferralOut(BaseModel):
    referral_id: str
    inviter_id: str
    invitee_id: str
    state: str
    activated_at: datetime | None


class LeaderboardEntry(BaseModel):
    user_id: str
    display_name: str
    orbit_level: int
    total_xp: int


class AdminKpiResponse(BaseModel):
    active_users: int
    activation_rate: float
    partner_share: float
    average_tx_frequency: float
    on_time_payment_rate: float
    referral_activation_rate: float
    reward_to_revenue_ratio: float
    k_factor: float
    total_rewards: float
    total_revenue: float
    guardrail_headroom: float


class AdminRiskEntry(BaseModel):
    risk_flag_id: str
    user_id: str
    flag_type: str
    severity: int
    detail: str
    is_active: bool
    created_at: datetime


class AdminRiskResponse(BaseModel):
    active_flags: list[AdminRiskEntry]
    pending_rewards: list[RewardLedgerOut]
