from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.analytics import build_admin_risk_response, calculate_admin_kpis
from app.db import Base


def create_empty_session() -> Session:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    return Session(engine)


def test_calculate_admin_kpis_returns_demo_payload_for_empty_session() -> None:
    with create_empty_session() as session:
        payload = calculate_admin_kpis(session)

    assert payload == {
        "active_users": 12480,
        "activation_rate": 0.9134,
        "partner_share": 0.5821,
        "average_tx_frequency": 18.7,
        "on_time_payment_rate": 0.9642,
        "referral_activation_rate": 0.2384,
        "reward_to_revenue_ratio": 0.3126,
        "k_factor": 0.2384,
        "total_rewards": 184320.0,
        "total_revenue": 589760.0,
        "guardrail_headroom": 140544.0,
    }


def test_build_admin_risk_response_returns_demo_payload_for_empty_session() -> None:
    with create_empty_session() as session:
        payload = build_admin_risk_response(session)

    assert len(payload.active_flags) == 3
    assert [flag.flag_type for flag in payload.active_flags] == [
        "device_mismatch",
        "multi_account_signal",
        "limit_pressure",
    ]
    assert len(payload.pending_rewards) == 2
    assert all(reward.status == "pending" for reward in payload.pending_rewards)
