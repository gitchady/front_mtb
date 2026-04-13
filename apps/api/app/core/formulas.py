from dataclasses import dataclass, field


@dataclass(slots=True)
class EngineConfig:
    energy_base: float = 0.45
    energy_partner_bonus: float = 0.35
    energy_target_bonus: float = 0.15
    daily_txn_cap: int = 5
    daily_freq_bonus: int = 2
    level_base_xp: int = 18
    orbit_weights: dict[str, float] = field(
        default_factory=lambda: {
            "ORBIT_COMMERCE": 1.0,
            "CREDIT_SHIELD": 1.2,
            "SOCIAL_RING": 0.8,
        }
    )
    booster_base: float = 1.2
    booster_level_step: float = 0.15
    booster_partner_share_step: float = 0.5
    booster_cap: float = 5.0
    reward_cap_base: float = 8.0
    reward_cap_level_step: float = 2.0
    reward_cap_global: float = 60.0
    limit_base_step: float = 25.0
    limit_max: float = 600.0
    alpha_guardrail: float = 0.30
    partner_revenue_rate: float = 0.04
    interchange_rate: float = 0.015
    installment_revenue_rate: float = 0.08
    risk_threshold: int = 5
    risk_velocity_window_minutes: int = 15
    risk_velocity_limit: int = 4


ENGINE_CONFIG = EngineConfig()

