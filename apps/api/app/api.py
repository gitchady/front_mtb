from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.analytics import calculate_admin_kpis
from app.bootstrap import ensure_user
from app.core.config import get_settings
from app.db import get_session
from app.models import EventLog, GameRun, Quest, QuestProgress, Referral, RewardLedger, RiskFlag, User
from app.queue import enqueue_event
from app.schemas import (
    AdminKpiResponse,
    AdminRiskEntry,
    AdminRiskResponse,
    DemoLoginRequest,
    DemoSessionResponse,
    EventPayload,
    GalaxyProfileResponse,
    GameRunCreate,
    GameRunOut,
    GameSummaryItem,
    GameSummaryResponse,
    IngestResponse,
    LeaderboardEntry,
    QuestClaimResponse,
    QuestOut,
    ReferralInviteRequest,
    ReferralOut,
    RewardLedgerOut,
)

router = APIRouter()

GAME_PLANETS = {
    "halva_snake": "ORBIT_COMMERCE",
    "credit_shield_reactor": "CREDIT_SHIELD",
    "social_ring_signal": "SOCIAL_RING",
}


def build_profile(session: Session, user_id: str) -> GalaxyProfileResponse:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    from app.models import BoosterWindow, InstallmentProfile, OrbitState, PlanetProgress

    orbit_state = session.get(OrbitState, user_id)
    installment = session.get(InstallmentProfile, user_id)
    progress_items = session.scalars(select(PlanetProgress).where(PlanetProgress.user_id == user_id)).all()
    boosters = session.scalars(
        select(BoosterWindow)
        .where(BoosterWindow.user_id == user_id, BoosterWindow.status == "active")
        .order_by(desc(BoosterWindow.end_at))
    ).all()
    quest_rows = session.execute(
        select(Quest, QuestProgress)
        .join(QuestProgress, Quest.quest_id == QuestProgress.quest_id)
        .where(QuestProgress.user_id == user_id, Quest.active.is_(True))
    ).all()

    partner_spend = 0.0
    total_spend = 0.0
    for event in session.scalars(select(EventLog).where(EventLog.user_id == user_id, EventLog.event_type == "txn_posted")).all():
        amount = float(event.payload["amount"])
        total_spend += amount
        if event.payload.get("is_partner"):
            partner_spend += amount

    return GalaxyProfileResponse(
        user_id=user.user_id,
        display_name=user.display_name,
        orbit_level=orbit_state.orbit_level,
        total_energy=orbit_state.total_energy,
        total_xp=orbit_state.total_xp,
        partner_share=round(partner_spend / total_spend, 4) if total_spend else 0.0,
        planets=[
            {"planet_code": item.planet_code, "xp": item.xp, "level": item.level}
            for item in sorted(progress_items, key=lambda value: value.planet_code)
        ],
        active_boosters=[
            {
                "booster_id": item.booster_id,
                "category": item.category,
                "boost_rate": item.boost_rate,
                "start_at": item.start_at,
                "end_at": item.end_at,
                "status": item.status,
            }
            for item in boosters
        ],
        quests=[
            QuestOut(
                quest_id=quest.quest_id,
                title=quest.title,
                description=quest.description,
                planet_code=quest.planet_code,
                condition_type=quest.condition_type,
                threshold=quest.threshold,
                reward_kind=quest.reward_kind,
                reward_value=quest.reward_value,
                status=progress.status,
                current_value=progress.current_value,
            )
            for quest, progress in quest_rows
        ],
        installment_profile={
            "current_limit": installment.current_limit,
            "available_limit": installment.available_limit,
            "risk_score": installment.risk_score,
            "on_time_payments_3m": installment.on_time_payments_3m,
            "late_flags": installment.late_flags,
        },
    )


@router.post("/auth/demo-login", response_model=DemoSessionResponse)
def demo_login(payload: DemoLoginRequest, session: Session = Depends(get_session)) -> DemoSessionResponse:
    ensure_user(session, payload.user_id, payload.display_name, payload.segment)
    return DemoSessionResponse(user_id=payload.user_id, token=f"demo-{payload.user_id}")


@router.get("/galaxy/profile", response_model=GalaxyProfileResponse)
def galaxy_profile(user_id: str, session: Session = Depends(get_session)) -> GalaxyProfileResponse:
    return build_profile(session, user_id)


@router.post("/events/ingest", response_model=IngestResponse)
def ingest_event(payload: EventPayload, session: Session = Depends(get_session)) -> IngestResponse:
    ensure_user(session, payload.user_id)
    event = EventLog(
        event_id=payload.event_id,
        user_id=payload.user_id,
        event_type=payload.event_type,
        payload=payload.model_dump(mode="json", exclude={"event_type"}),
    )
    session.add(event)
    session.commit()
    status = enqueue_event(session, payload.event_id)
    return IngestResponse(event_id=payload.event_id, status=status)


@router.get("/quests", response_model=list[QuestOut])
def get_quests(user_id: str, session: Session = Depends(get_session)) -> list[QuestOut]:
    return build_profile(session, user_id).quests


@router.post("/quests/{quest_id}/claim", response_model=QuestClaimResponse)
def claim_quest(quest_id: str, user_id: str, session: Session = Depends(get_session)) -> QuestClaimResponse:
    progress = session.scalar(
        select(QuestProgress).where(QuestProgress.user_id == user_id, QuestProgress.quest_id == quest_id)
    )
    quest = session.get(Quest, quest_id)
    if progress is None or quest is None:
        raise HTTPException(status_code=404, detail="Квест не найден")
    if progress.status != "completed":
        raise HTTPException(status_code=400, detail="Квест еще не готов к получению награды")

    progress.status = "claimed"
    progress.claimed_at = datetime.now(UTC).replace(tzinfo=None)
    ledger = RewardLedger(
        user_id=user_id,
        source_event_id=None,
        reward_type=f"quest_{quest.reward_kind}",
        amount=quest.reward_value,
        status="confirmed",
        meta={"quest_id": quest_id},
    )
    session.add(ledger)
    session.commit()
    session.refresh(ledger)
    return QuestClaimResponse(quest_id=quest_id, status="claimed", ledger_id=ledger.ledger_id)


@router.get("/rewards/ledger", response_model=list[RewardLedgerOut])
def reward_ledger(user_id: str, session: Session = Depends(get_session)) -> list[RewardLedgerOut]:
    rows = session.scalars(
        select(RewardLedger).where(RewardLedger.user_id == user_id).order_by(desc(RewardLedger.created_at))
    ).all()
    return [RewardLedgerOut.model_validate(row, from_attributes=True) for row in rows]


@router.post("/games/runs", response_model=GameRunOut)
def create_game_run(payload: GameRunCreate, session: Session = Depends(get_session)) -> GameRunOut:
    ensure_user(session, payload.user_id)
    expected_planet = GAME_PLANETS[payload.game_code]
    if payload.planet_code != expected_planet:
        raise HTTPException(status_code=400, detail=f"Игра {payload.game_code} должна быть привязана к планете {expected_planet}")

    run = GameRun(
        user_id=payload.user_id,
        game_code=payload.game_code,
        planet_code=payload.planet_code,
        score=payload.score,
        base_reward=payload.base_reward,
        total_reward=payload.total_reward,
        bonus_breakdown=payload.bonus_breakdown,
        source_event_id=payload.source_event_id,
    )
    session.add(run)
    session.add(
        RewardLedger(
            user_id=payload.user_id,
            source_event_id=payload.source_event_id,
            reward_type="mini_game_stardust",
            amount=0,
            status="confirmed",
            meta={
                "game_code": payload.game_code,
                "planet_code": payload.planet_code,
                "score": payload.score,
                "base_reward": payload.base_reward,
                "stardust_awarded": payload.total_reward,
                "bonus_breakdown": payload.bonus_breakdown,
            },
        )
    )
    session.commit()
    session.refresh(run)
    return GameRunOut.model_validate(run, from_attributes=True)


@router.get("/games/summary", response_model=GameSummaryResponse)
def game_summary(user_id: str, session: Session = Depends(get_session)) -> GameSummaryResponse:
    ensure_user(session, user_id)
    rows = session.execute(
        select(
            GameRun.game_code,
            GameRun.planet_code,
            func.count(GameRun.run_id),
            func.max(GameRun.score),
            func.coalesce(func.sum(GameRun.total_reward), 0),
        )
        .where(GameRun.user_id == user_id)
        .group_by(GameRun.game_code, GameRun.planet_code)
    ).all()
    games = [
        GameSummaryItem(
            game_code=game_code,
            planet_code=planet_code,
            runs=int(runs),
            best_score=int(best_score or 0),
            total_reward=int(total_reward or 0),
        )
        for game_code, planet_code, runs, best_score, total_reward in rows
    ]
    return GameSummaryResponse(
        user_id=user_id,
        total_runs=sum(item.runs for item in games),
        total_reward=sum(item.total_reward for item in games),
        games=games,
    )


@router.post("/referrals/invite", response_model=ReferralOut)
def create_referral(payload: ReferralInviteRequest, user_id: str, session: Session = Depends(get_session)) -> ReferralOut:
    ensure_user(session, user_id)
    referral = Referral(inviter_id=user_id, invitee_id=payload.invitee_id)
    session.add(referral)
    session.commit()
    session.refresh(referral)
    return ReferralOut.model_validate(referral, from_attributes=True)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(session: Session = Depends(get_session)) -> list[LeaderboardEntry]:
    from app.models import OrbitState

    rows = session.execute(
        select(User, OrbitState)
        .join(OrbitState, User.user_id == OrbitState.user_id)
        .order_by(desc(OrbitState.total_xp))
        .limit(10)
    ).all()
    return [
        LeaderboardEntry(
            user_id=user.user_id,
            display_name=user.display_name,
            orbit_level=orbit.orbit_level,
            total_xp=orbit.total_xp,
        )
        for user, orbit in rows
    ]


@router.get("/admin/kpi", response_model=AdminKpiResponse)
def admin_kpi(session: Session = Depends(get_session)) -> AdminKpiResponse:
    return AdminKpiResponse(**calculate_admin_kpis(session))


@router.post("/admin/simulate", response_model=IngestResponse)
def admin_simulate(payload: EventPayload, session: Session = Depends(get_session)) -> IngestResponse:
    return ingest_event(payload, session)


@router.get("/admin/risk", response_model=AdminRiskResponse)
def admin_risk(session: Session = Depends(get_session)) -> AdminRiskResponse:
    flags = session.scalars(select(RiskFlag).where(RiskFlag.is_active.is_(True)).order_by(desc(RiskFlag.created_at))).all()
    pending = session.scalars(
        select(RewardLedger).where(RewardLedger.status == "pending").order_by(desc(RewardLedger.created_at))
    ).all()
    return AdminRiskResponse(
        active_flags=[AdminRiskEntry.model_validate(flag, from_attributes=True) for flag in flags],
        pending_rewards=[RewardLedgerOut.model_validate(entry, from_attributes=True) for entry in pending],
    )


@router.get("/admin/stream")
async def admin_stream() -> StreamingResponse:
    settings = get_settings()

    async def event_generator():
        while True:
            from app.db import SessionLocal

            with SessionLocal() as session:
                payload = calculate_admin_kpis(session)
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(settings.sse_interval_seconds)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
