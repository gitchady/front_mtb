from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Card, InstallmentProfile, OrbitState, PlanetProgress, Quest, QuestProgress, User

PLANETS = ("ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING")

DEFAULT_QUESTS = (
    {
        "quest_id": "quest_orbit_001",
        "title": "Спринт Орбиты покупок",
        "description": "Совершите 3 партнерские операции, чтобы открыть окно кэшбэк-бустера.",
        "planet_code": "ORBIT_COMMERCE",
        "condition_type": "partner_txn_count",
        "threshold": 3,
        "reward_kind": "booster",
        "reward_value": 2,
    },
    {
        "quest_id": "quest_credit_001",
        "title": "Дисциплина щита",
        "description": "Оплатите одну рассрочку вовремя, чтобы усилить Кредитный щит.",
        "planet_code": "CREDIT_SHIELD",
        "condition_type": "on_time_payments",
        "threshold": 1,
        "reward_kind": "limit_boost",
        "reward_value": 20,
    },
    {
        "quest_id": "quest_social_001",
        "title": "Активация Социального кольца",
        "description": "Пригласите одного друга, который активирует опыт.",
        "planet_code": "SOCIAL_RING",
        "condition_type": "referral_count",
        "threshold": 1,
        "reward_kind": "tournament_pass",
        "reward_value": 1,
    },
    {
        "quest_id": "quest_orbit_002",
        "title": "Партнерская гравитация",
        "description": "Наберите 120 BYN партнерских покупок, чтобы стабилизировать орбиту.",
        "planet_code": "ORBIT_COMMERCE",
        "condition_type": "partner_spend",
        "threshold": 120,
        "reward_kind": "cashback",
        "reward_value": 5,
    },
)


def seed_defaults(session: Session, demo_user_id: str) -> None:
    user = session.get(User, demo_user_id)
    if user is None:
        user = User(user_id=demo_user_id, display_name="Пилот Моби", segment="student")
        session.add(user)
        session.add(Card(card_id="card_demo_halva", user_id=demo_user_id))
        session.add(OrbitState(user_id=demo_user_id, orbit_level=1, total_energy=0, total_xp=0))
        session.add(InstallmentProfile(user_id=demo_user_id))
        for planet in PLANETS:
            session.add(PlanetProgress(user_id=demo_user_id, planet_code=planet, xp=0, level=1))

    existing_quests = {quest.quest_id: quest for quest in session.scalars(select(Quest)).all()}
    for quest_payload in DEFAULT_QUESTS:
        existing_quest = existing_quests.get(quest_payload["quest_id"])
        if existing_quest is None:
            session.add(Quest(**quest_payload))
        else:
            for key, value in quest_payload.items():
                setattr(existing_quest, key, value)

    session.flush()
    quest_ids = {quest.quest_id for quest in session.scalars(select(Quest)).all()}
    existing_progress = {
        (qp.user_id, qp.quest_id)
        for qp in session.scalars(select(QuestProgress).where(QuestProgress.user_id == demo_user_id)).all()
    }
    for quest_id in quest_ids:
        if (demo_user_id, quest_id) not in existing_progress:
            session.add(QuestProgress(user_id=demo_user_id, quest_id=quest_id))

    session.commit()


def ensure_user(session: Session, user_id: str, display_name: str = "Пилот Моби", segment: str = "student") -> User:
    user = session.get(User, user_id)
    if user:
        if user.display_name != display_name or user.segment != segment:
            user.display_name = display_name
            user.segment = segment
            session.commit()
        return user

    user = User(user_id=user_id, display_name=display_name, segment=segment)
    session.add(user)
    session.add(Card(card_id=f"card_{user_id}", user_id=user_id))
    session.add(OrbitState(user_id=user_id, orbit_level=1, total_energy=0, total_xp=0))
    session.add(InstallmentProfile(user_id=user_id))
    for planet in PLANETS:
        session.add(PlanetProgress(user_id=user_id, planet_code=planet, xp=0, level=1))
    session.flush()

    for quest in session.scalars(select(Quest)).all():
        session.add(QuestProgress(user_id=user_id, quest_id=quest.quest_id))
    session.commit()
    return user
