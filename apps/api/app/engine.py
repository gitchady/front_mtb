from __future__ import annotations

from datetime import UTC, datetime, timedelta
from math import floor, sqrt

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.analytics import save_kpi_snapshot
from app.core.formulas import ENGINE_CONFIG
from app.models import (
    BoosterWindow,
    EventLog,
    InstallmentProfile,
    OrbitState,
    PlanetProgress,
    Referral,
    RewardLedger,
    RiskFlag,
)
from app.quests import update_quest_progress
from app.schemas import EducationCompletedPayload, EventPayload, InstallmentPaidPayload, ReferralActivatedPayload, TxnPostedPayload


PLANET_MAPPING = {
    "txn_posted": "ORBIT_COMMERCE",
    "installment_paid_on_time": "CREDIT_SHIELD",
    "referral_activated": "SOCIAL_RING",
}


def parse_event_payload(event: EventLog) -> EventPayload:
    payload = {"event_type": event.event_type, **event.payload}
    if event.event_type == "txn_posted":
        return TxnPostedPayload.model_validate(payload)
    if event.event_type == "installment_paid_on_time":
        return InstallmentPaidPayload.model_validate(payload)
    if event.event_type == "referral_activated":
        return ReferralActivatedPayload.model_validate(payload)
    return EducationCompletedPayload.model_validate(payload)


def level_from_xp(xp: int) -> int:
    if xp <= 0:
        return 1
    return max(1, floor(sqrt(xp / ENGINE_CONFIG.level_base_xp)) + 1)


def get_planet_progress(session: Session, user_id: str, planet_code: str) -> PlanetProgress:
    return session.scalar(
        select(PlanetProgress).where(PlanetProgress.user_id == user_id, PlanetProgress.planet_code == planet_code)
    )


def update_orbit_state(session: Session, user_id: str) -> OrbitState:
    orbit_state = session.get(OrbitState, user_id)
    progress_items = session.scalars(select(PlanetProgress).where(PlanetProgress.user_id == user_id)).all()
    weighted_level = sum(item.level * ENGINE_CONFIG.orbit_weights.get(item.planet_code, 1.0) for item in progress_items)
    orbit_state.total_xp = sum(item.xp for item in progress_items)
    orbit_state.orbit_level = max(1, floor(weighted_level))
    return orbit_state


def monthly_reward_total(session: Session, user_id: str) -> float:
    now = datetime.now(UTC)
    month_start = datetime(now.year, now.month, 1, tzinfo=UTC).replace(tzinfo=None)
    return session.scalar(
        select(func.coalesce(func.sum(RewardLedger.amount), 0.0)).where(
            RewardLedger.user_id == user_id,
            RewardLedger.status == "confirmed",
            RewardLedger.created_at >= month_start,
        )
    ) or 0.0


def total_revenue_so_far(session: Session) -> float:
    total = 0.0
    for event in session.scalars(select(EventLog).where(EventLog.status.in_(("processed", "flagged")))).all():
        payload = event.payload
        if event.event_type == "txn_posted":
            amount = float(payload["amount"])
            total += amount * ENGINE_CONFIG.interchange_rate
            if payload.get("is_partner"):
                total += amount * ENGINE_CONFIG.partner_revenue_rate
        elif event.event_type == "installment_paid_on_time":
            total += float(payload["installment_amount"]) * ENGINE_CONFIG.installment_revenue_rate
    return total


def evaluate_risk(session: Session, payload: TxnPostedPayload) -> tuple[int, list[RiskFlag]]:
    score = 0
    flags: list[RiskFlag] = []

    window_start = payload.timestamp - timedelta(minutes=ENGINE_CONFIG.risk_velocity_window_minutes)
    recent_count = session.scalar(
        select(func.count()).select_from(EventLog).where(
            EventLog.user_id == payload.user_id,
            EventLog.event_type == "txn_posted",
            EventLog.created_at >= window_start.replace(tzinfo=None),
        )
    ) or 0

    if recent_count >= ENGINE_CONFIG.risk_velocity_limit:
        score += 3
        flags.append(
            RiskFlag(
                user_id=payload.user_id,
                flag_type="velocity_excess",
                severity=2,
                detail=f"{recent_count} операций за короткое окно",
            )
        )
    if payload.device_mismatch:
        score += 2
        flags.append(RiskFlag(user_id=payload.user_id, flag_type="device_mismatch", severity=2, detail="Смена устройства"))
    if payload.multi_account_signal:
        score += 3
        flags.append(RiskFlag(user_id=payload.user_id, flag_type="multi_account", severity=3, detail="Похоже на ферму аккаунтов"))
    if payload.amount >= 500:
        score += 1
        flags.append(RiskFlag(user_id=payload.user_id, flag_type="large_amount", severity=1, detail="Крупная операция"))

    return score, flags


def apply_reward_cap(session: Session, user_id: str, orbit_level: int, amount: float) -> float:
    cap = min(
        ENGINE_CONFIG.reward_cap_base + orbit_level * ENGINE_CONFIG.reward_cap_level_step,
        ENGINE_CONFIG.reward_cap_global,
    )
    consumed = monthly_reward_total(session, user_id)
    remaining = max(0.0, cap - consumed)
    return round(min(amount, remaining), 2)


def current_partner_share(session: Session, user_id: str) -> float:
    user_events = session.scalars(select(EventLog).where(EventLog.user_id == user_id, EventLog.event_type == "txn_posted")).all()
    total = 0.0
    partner = 0.0
    for event in user_events:
        amount = float(event.payload["amount"])
        total += amount
        if event.payload.get("is_partner"):
            partner += amount
    return partner / total if total else 0.0


def maybe_open_booster(session: Session, user_id: str, category: str, orbit_level: int, partner_share: float) -> BoosterWindow:
    boost_rate = min(
        ENGINE_CONFIG.booster_base + orbit_level * ENGINE_CONFIG.booster_level_step + partner_share * ENGINE_CONFIG.booster_partner_share_step,
        ENGINE_CONFIG.booster_cap,
    )
    booster = BoosterWindow(
        user_id=user_id,
        category=category,
        boost_rate=round(boost_rate, 2),
        start_at=datetime.now(UTC).replace(tzinfo=None),
        end_at=(datetime.now(UTC) + timedelta(hours=24)).replace(tzinfo=None),
    )
    session.add(booster)
    return booster


def process_event_record(session: Session, event: EventLog) -> None:
    payload = parse_event_payload(event)
    orbit_state = session.get(OrbitState, event.user_id)
    installment_profile = session.get(InstallmentProfile, event.user_id)
    reward_status = "confirmed"

    if isinstance(payload, TxnPostedPayload):
        risk_score, flags = evaluate_risk(session, payload)
        for flag in flags:
            session.add(flag)
        event.risk_score = risk_score
        if risk_score >= ENGINE_CONFIG.risk_threshold:
            reward_status = "pending"

        energy_multiplier = ENGINE_CONFIG.energy_base
        if payload.is_partner:
            energy_multiplier += ENGINE_CONFIG.energy_partner_bonus
        if payload.is_target_category:
            energy_multiplier += ENGINE_CONFIG.energy_target_bonus

        day_start = payload.timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        txn_count_today = session.scalar(
            select(func.count()).select_from(EventLog).where(
                EventLog.user_id == payload.user_id,
                EventLog.event_type == "txn_posted",
                EventLog.created_at >= day_start.replace(tzinfo=None),
            )
        ) or 0
        energy = floor(payload.amount * energy_multiplier)
        xp_gain = energy + ENGINE_CONFIG.daily_freq_bonus * min(txn_count_today, ENGINE_CONFIG.daily_txn_cap)
        progress = get_planet_progress(session, payload.user_id, PLANET_MAPPING[payload.event_type])
        progress.xp += xp_gain
        progress.level = level_from_xp(progress.xp)
        orbit_state.total_energy += energy

        update_quest_progress(session, payload.user_id, "partner_txn_count", 1 if payload.is_partner else 0)
        update_quest_progress(session, payload.user_id, "partner_spend", payload.amount if payload.is_partner else 0)

        update_orbit_state(session, payload.user_id)
        partner_share = current_partner_share(session, payload.user_id)
        maybe_open_booster(session, payload.user_id, payload.category, orbit_state.orbit_level, partner_share)
        reward_amount = payload.amount * (min(ENGINE_CONFIG.booster_base + orbit_state.orbit_level * 0.1, ENGINE_CONFIG.booster_cap) / 100)
        reward_amount = apply_reward_cap(session, payload.user_id, orbit_state.orbit_level, reward_amount)

        if reward_amount > 0:
            session.add(
                RewardLedger(
                    user_id=payload.user_id,
                    source_event_id=payload.event_id,
                    reward_type="cashback_booster",
                    amount=reward_amount,
                    status=reward_status,
                    meta={"category": payload.category, "energy": energy, "xp": xp_gain},
                )
            )
        event.status = "flagged" if reward_status == "pending" else "processed"

    elif isinstance(payload, InstallmentPaidPayload):
        progress = get_planet_progress(session, payload.user_id, PLANET_MAPPING[payload.event_type])
        progress.xp += 26
        progress.level = level_from_xp(progress.xp)
        installment_profile.on_time_payments_3m += 1
        active_risk = session.scalar(
            select(func.count()).select_from(RiskFlag).where(RiskFlag.user_id == payload.user_id, RiskFlag.is_active.is_(True))
        ) or 0
        if active_risk == 0:
            next_limit = min(
                ENGINE_CONFIG.limit_max,
                installment_profile.current_limit + ENGINE_CONFIG.limit_base_step * installment_profile.on_time_payments_3m,
            )
            installment_profile.current_limit = round(next_limit, 2)
            installment_profile.available_limit = round(next_limit, 2)
        update_quest_progress(session, payload.user_id, "on_time_payments", 1)
        update_orbit_state(session, payload.user_id)
        session.add(
            RewardLedger(
                user_id=payload.user_id,
                source_event_id=payload.event_id,
                reward_type="credit_shield_xp",
                amount=0,
                status="confirmed",
                meta={"xp": 26, "limit": installment_profile.current_limit},
            )
        )
        event.status = "processed"

    elif isinstance(payload, ReferralActivatedPayload):
        progress = get_planet_progress(session, payload.user_id, PLANET_MAPPING[payload.event_type])
        progress.xp += 34
        progress.level = level_from_xp(progress.xp)
        referral = session.scalar(
            select(Referral).where(Referral.inviter_id == payload.user_id, Referral.invitee_id == payload.invitee_id)
        )
        if referral is None:
            referral = Referral(inviter_id=payload.user_id, invitee_id=payload.invitee_id, state="activated", activated_at=payload.timestamp)
            session.add(referral)
        else:
            referral.state = "activated"
            referral.activated_at = payload.timestamp
        update_quest_progress(session, payload.user_id, "referral_count", 1)
        update_orbit_state(session, payload.user_id)
        session.add(
            RewardLedger(
                user_id=payload.user_id,
                source_event_id=payload.event_id,
                reward_type="social_ring_reward",
                amount=4,
                status="confirmed",
                meta={"invitee_id": payload.invitee_id},
            )
        )
        event.status = "processed"

    else:
        installment_profile.available_limit = min(
            ENGINE_CONFIG.limit_max,
            installment_profile.available_limit + max(0, payload.score // 25) * 5,
        )
        session.add(
            RewardLedger(
                user_id=payload.user_id,
                source_event_id=payload.event_id,
                reward_type="education_hook",
                amount=0,
                status="confirmed",
                meta={"module_id": payload.module_id, "score": payload.score},
            )
        )
        event.status = "processed"

    update_orbit_state(session, event.user_id)
    total_revenue = total_revenue_so_far(session)
    confirmed_rewards = session.scalar(
        select(func.coalesce(func.sum(RewardLedger.amount), 0.0)).where(RewardLedger.status == "confirmed")
    ) or 0.0
    if total_revenue and confirmed_rewards > ENGINE_CONFIG.alpha_guardrail * total_revenue:
        overflow = confirmed_rewards - (ENGINE_CONFIG.alpha_guardrail * total_revenue)
        latest_reward = session.scalar(
            select(RewardLedger)
            .where(RewardLedger.source_event_id == event.event_id)
            .order_by(RewardLedger.created_at.desc())
        )
        if latest_reward and latest_reward.amount > 0:
            latest_reward.amount = max(0.0, round(latest_reward.amount - overflow, 2))

    save_kpi_snapshot(session)


def process_event_by_id(session: Session, event_id: str) -> EventLog:
    event = session.get(EventLog, event_id)
    if event is None:
        raise ValueError(f"Событие {event_id} не найдено")
    if event.status in {"processed", "flagged"}:
        return event

    process_event_record(session, event)
    session.commit()
    session.refresh(event)
    return event
