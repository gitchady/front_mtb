from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.engine import process_event_by_id


def enqueue_event(session: Session, event_id: str) -> str:
    settings = get_settings()
    if settings.queue_mode == "sync":
        process_event_by_id(session, event_id)
        return "processed"

    # Production seam for Redis/ARQ workers.
    process_event_by_id(session, event_id)
    return "queued"

