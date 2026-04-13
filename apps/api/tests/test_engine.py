from datetime import UTC, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.bootstrap import ensure_user, seed_defaults
from app.db import Base
from app.engine import process_event_record
from app.models import EventLog, InstallmentProfile, OrbitState, PlanetProgress, RewardLedger


def build_session() -> Session:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, future=True)()
    seed_defaults(session, "u_test")
    ensure_user(session, "u_test", "Test User", "student")
    return session


def test_partner_txn_grants_more_xp_than_non_partner() -> None:
    session = build_session()
    partner_event = EventLog(
        event_id="evt_partner",
        user_id="u_test",
        event_type="txn_posted",
        payload={
            "event_id": "evt_partner",
            "user_id": "u_test",
            "amount": 100,
            "merchant_id": "m1",
            "category": "food",
            "is_partner": True,
            "is_target_category": False,
            "device_mismatch": False,
            "multi_account_signal": False,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )
    non_partner_event = EventLog(
        event_id="evt_non_partner",
        user_id="u_test",
        event_type="txn_posted",
        payload={
            "event_id": "evt_non_partner",
            "user_id": "u_test",
            "amount": 100,
            "merchant_id": "m2",
            "category": "food",
            "is_partner": False,
            "is_target_category": False,
            "device_mismatch": False,
            "multi_account_signal": False,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )
    session.add_all([partner_event, non_partner_event])
    session.flush()

    process_event_record(session, partner_event)
    partner_xp = session.query(PlanetProgress).filter_by(user_id="u_test", planet_code="ORBIT_COMMERCE").one().xp
    process_event_record(session, non_partner_event)
    total_xp = session.query(PlanetProgress).filter_by(user_id="u_test", planet_code="ORBIT_COMMERCE").one().xp

    assert partner_xp > 0
    assert total_xp > partner_xp
    rewards = session.query(RewardLedger).filter_by(source_event_id="evt_partner").one()
    assert rewards.amount > 0


def test_installment_payment_does_not_raise_limit_when_risk_exists() -> None:
    session = build_session()
    from app.models import RiskFlag

    session.add(RiskFlag(user_id="u_test", flag_type="multi_account", severity=3, detail="test"))
    event = EventLog(
        event_id="evt_credit",
        user_id="u_test",
        event_type="installment_paid_on_time",
        payload={
            "event_id": "evt_credit",
            "user_id": "u_test",
            "installment_amount": 50,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )
    session.add(event)
    session.flush()
    profile_before = session.get(InstallmentProfile, "u_test").current_limit

    process_event_record(session, event)

    profile_after = session.get(InstallmentProfile, "u_test").current_limit
    assert profile_before == profile_after


def test_referral_event_updates_social_ring_and_orbit() -> None:
    session = build_session()
    event = EventLog(
        event_id="evt_ref",
        user_id="u_test",
        event_type="referral_activated",
        payload={
            "event_id": "evt_ref",
            "user_id": "u_test",
            "invitee_id": "u_friend",
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )
    session.add(event)
    session.flush()

    process_event_record(session, event)

    social = session.query(PlanetProgress).filter_by(user_id="u_test", planet_code="SOCIAL_RING").one()
    orbit = session.get(OrbitState, "u_test")
    assert social.xp > 0
    assert orbit.orbit_level >= 1


def test_suspicious_txn_moves_reward_to_pending() -> None:
    session = build_session()
    event = EventLog(
        event_id="evt_risky",
        user_id="u_test",
        event_type="txn_posted",
        payload={
            "event_id": "evt_risky",
            "user_id": "u_test",
            "amount": 800,
            "merchant_id": "m3",
            "category": "electronics",
            "is_partner": True,
            "is_target_category": True,
            "device_mismatch": True,
            "multi_account_signal": True,
            "timestamp": datetime.now(UTC).isoformat(),
        },
    )
    session.add(event)
    session.flush()

    process_event_record(session, event)
    reward = session.query(RewardLedger).filter_by(source_event_id="evt_risky").one()

    assert reward.status == "pending"
