from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.formulas import ENGINE_CONFIG
from app.models import Card, EventLog, KpiSnapshot, Referral, RewardLedger


def calculate_admin_kpis(session: Session) -> dict:
    card_count = session.scalar(select(func.count()).select_from(Card)) or 0
    activated_cards = session.scalar(
        select(func.count()).select_from(Card).where(Card.activation_state == "activated")
    ) or 0

    total_spend = 0.0
    partner_spend = 0.0
    total_revenue = 0.0
    total_transactions = 0
    on_time_payments = 0
    total_due = 0

    for event in session.scalars(select(EventLog)).all():
        payload = event.payload
        if event.event_type == "txn_posted":
            amount = float(payload["amount"])
            total_spend += amount
            total_transactions += 1
            total_revenue += amount * ENGINE_CONFIG.interchange_rate
            if payload.get("is_partner"):
                partner_spend += amount
                total_revenue += amount * ENGINE_CONFIG.partner_revenue_rate
        elif event.event_type == "installment_paid_on_time":
            total_due += 1
            on_time_payments += 1
            total_revenue += float(payload["installment_amount"]) * ENGINE_CONFIG.installment_revenue_rate

    referral_invites = session.scalar(select(func.count()).select_from(Referral)) or 0
    referral_activations = session.scalar(
        select(func.count()).select_from(Referral).where(Referral.state == "activated")
    ) or 0
    confirmed_rewards = session.scalar(
        select(func.coalesce(func.sum(RewardLedger.amount), 0.0)).where(RewardLedger.status == "confirmed")
    ) or 0.0
    active_users = session.scalar(select(func.count(func.distinct(EventLog.user_id))).select_from(EventLog)) or 0

    activation_rate = activated_cards / card_count if card_count else 0.0
    partner_share = partner_spend / total_spend if total_spend else 0.0
    average_tx_frequency = total_transactions / active_users if active_users else 0.0
    on_time_payment_rate = on_time_payments / total_due if total_due else 1.0
    referral_activation_rate = referral_activations / referral_invites if referral_invites else 0.0
    reward_to_revenue_ratio = confirmed_rewards / total_revenue if total_revenue else 0.0
    guardrail_headroom = max(0.0, ENGINE_CONFIG.alpha_guardrail * total_revenue - confirmed_rewards)

    return {
        "active_users": active_users,
        "activation_rate": round(activation_rate, 4),
        "partner_share": round(partner_share, 4),
        "average_tx_frequency": round(average_tx_frequency, 2),
        "on_time_payment_rate": round(on_time_payment_rate, 4),
        "referral_activation_rate": round(referral_activation_rate, 4),
        "reward_to_revenue_ratio": round(reward_to_revenue_ratio, 4),
        "k_factor": round(referral_activation_rate, 4),
        "total_rewards": round(float(confirmed_rewards), 2),
        "total_revenue": round(float(total_revenue), 2),
        "guardrail_headroom": round(float(guardrail_headroom), 2),
    }


def save_kpi_snapshot(session: Session) -> KpiSnapshot:
    payload = calculate_admin_kpis(session)
    snapshot = KpiSnapshot(payload=payload, **payload)
    session.add(snapshot)
    session.flush()
    return snapshot
