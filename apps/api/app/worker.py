from app.core.config import get_settings
from app.db import SessionLocal
from app.engine import process_event_by_id


def process_event_job(ctx: dict, event_id: str) -> None:
    with SessionLocal() as session:
        process_event_by_id(session, event_id)


class WorkerSettings:
    functions = [process_event_job]
    redis_settings = get_settings().redis_url
