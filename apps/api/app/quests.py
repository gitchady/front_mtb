from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Quest, QuestProgress


def update_quest_progress(session: Session, user_id: str, condition_type: str, increment: float) -> None:
    quests = session.scalars(
        select(Quest).where(Quest.condition_type == condition_type, Quest.active.is_(True))
    ).all()
    if not quests:
        return

    for quest in quests:
        progress = session.scalar(
            select(QuestProgress).where(QuestProgress.user_id == user_id, QuestProgress.quest_id == quest.quest_id)
        )
        if progress is None:
            progress = QuestProgress(user_id=user_id, quest_id=quest.quest_id)
            session.add(progress)
            session.flush()

        if progress.status == "claimed":
            continue

        progress.current_value += increment
        progress.status = "completed" if progress.current_value >= quest.threshold else "active"
