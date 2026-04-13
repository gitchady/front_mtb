from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


def unique_user_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}"


def test_demo_login_simulate_and_profile_flow() -> None:
    user_id = unique_user_id("u_route")
    with TestClient(app) as client:
        login = client.post(
            "/auth/demo-login",
            json={"user_id": user_id, "display_name": "Route Pilot", "segment": "student"},
        )
        assert login.status_code == 200

        simulate = client.post(
            "/admin/simulate",
            json={
                "event_type": "txn_posted",
                "event_id": f"evt_{uuid4().hex[:8]}",
                "user_id": user_id,
                "amount": 140,
                "merchant_id": "merchant_partner_01",
                "category": "food",
                "is_partner": True,
                "is_target_category": True,
                "device_mismatch": False,
                "multi_account_signal": False,
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )
        assert simulate.status_code == 200

        profile = client.get("/galaxy/profile", params={"user_id": user_id})
        assert profile.status_code == 200
        payload = profile.json()
        assert payload["user_id"] == user_id
        assert payload["orbit_level"] >= 1
        assert len(payload["planets"]) == 3
        assert payload["active_boosters"]


def test_completed_quest_can_be_claimed() -> None:
    user_id = unique_user_id("u_claim")
    with TestClient(app) as client:
        client.post("/auth/demo-login", json={"user_id": user_id, "display_name": "Quest Pilot", "segment": "student"})
        for _ in range(3):
            client.post(
                "/admin/simulate",
                json={
                    "event_type": "txn_posted",
                    "event_id": f"evt_{uuid4().hex[:8]}",
                    "user_id": user_id,
                    "amount": 60,
                    "merchant_id": "merchant_partner_quest",
                    "category": "food",
                    "is_partner": True,
                    "is_target_category": False,
                    "device_mismatch": False,
                    "multi_account_signal": False,
                    "timestamp": datetime.now(UTC).isoformat(),
                },
            )

        quests = client.get("/quests", params={"user_id": user_id})
        quest = next(item for item in quests.json() if item["quest_id"] == "quest_orbit_001")
        assert quest["status"] == "completed"

        claim = client.post(f"/quests/{quest['quest_id']}/claim", params={"user_id": user_id})
        assert claim.status_code == 200
        assert claim.json()["status"] == "claimed"


def test_risky_event_surfaces_in_admin_risk() -> None:
    user_id = unique_user_id("u_risk")
    with TestClient(app) as client:
        client.post("/auth/demo-login", json={"user_id": user_id, "display_name": "Risk Pilot", "segment": "student"})
        client.post(
            "/admin/simulate",
            json={
                "event_type": "txn_posted",
                "event_id": f"evt_{uuid4().hex[:8]}",
                "user_id": user_id,
                "amount": 900,
                "merchant_id": "merchant_partner_risk",
                "category": "electronics",
                "is_partner": True,
                "is_target_category": True,
                "device_mismatch": True,
                "multi_account_signal": True,
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )

        admin_risk = client.get("/admin/risk")
        assert admin_risk.status_code == 200
        payload = admin_risk.json()
        assert any(flag["user_id"] == user_id for flag in payload["active_flags"])
        assert any(reward["status"] == "pending" for reward in payload["pending_rewards"])


def test_mini_game_run_is_persisted_and_summarized() -> None:
    user_id = unique_user_id("u_game")
    with TestClient(app) as client:
        run = client.post(
            "/games/runs",
            json={
                "user_id": user_id,
                "game_code": "halva_snake",
                "planet_code": "ORBIT_COMMERCE",
                "score": 12,
                "base_reward": 36,
                "total_reward": 48,
                "bonus_breakdown": {"streak_bonus": 4, "mastery_bonus": 3, "performance_bonus": 3, "focus_bonus": 2},
                "source_event_id": f"evt_{uuid4().hex[:8]}",
            },
        )
        assert run.status_code == 200
        assert run.json()["run_id"].startswith("run_")

        summary = client.get("/games/summary", params={"user_id": user_id})
        assert summary.status_code == 200
        payload = summary.json()
        assert payload["total_runs"] == 1
        assert payload["total_reward"] == 48
        assert payload["games"][0]["best_score"] == 12


def test_mini_game_run_rejects_wrong_planet() -> None:
    user_id = unique_user_id("u_game_bad")
    with TestClient(app) as client:
        run = client.post(
            "/games/runs",
            json={
                "user_id": user_id,
                "game_code": "social_ring_signal",
                "planet_code": "ORBIT_COMMERCE",
                "score": 8,
                "base_reward": 10,
                "total_reward": 14,
                "bonus_breakdown": {},
            },
        )
        assert run.status_code == 400
