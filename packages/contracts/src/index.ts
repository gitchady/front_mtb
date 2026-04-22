export * from "./generated/api";

export type PlanetCode = "ORBIT_COMMERCE" | "CREDIT_SHIELD" | "SOCIAL_RING";
export type GameCode =
  | "halva_snake"
  | "credit_shield_reactor"
  | "social_ring_signal"
  | "moby_bird"
  | "cashback_tetris"
  | "moby_jump"
  | "fintech_match3"
  | "super_moby_bros";

export interface PlanetProgress {
  planet_code: PlanetCode;
  xp: number;
  level: number;
}

export interface BoosterWindow {
  booster_id: string;
  category: string;
  boost_rate: number;
  start_at: string;
  end_at: string;
  status: string;
}

export interface QuestItem {
  quest_id: string;
  title: string;
  description: string;
  planet_code: string;
  condition_type: string;
  threshold: number;
  reward_kind: string;
  reward_value: number;
  status: string;
  current_value: number;
}

export interface RewardEntry {
  ledger_id: string;
  reward_type: string;
  amount: number;
  status: string;
  created_at: string;
  meta: Record<string, unknown>;
}

export interface GameRunEntry {
  run_id: string;
  user_id: string;
  game_code: GameCode;
  planet_code: PlanetCode;
  score: number;
  base_reward: number;
  total_reward: number;
  bonus_breakdown: Record<string, unknown>;
  source_event_id: string | null;
  created_at: string;
}

export interface GameSummaryItem {
  game_code: GameCode;
  planet_code: PlanetCode;
  runs: number;
  best_score: number;
  total_reward: number;
}

export interface GameSummary {
  user_id: string;
  total_runs: number;
  total_reward: number;
  games: GameSummaryItem[];
}

export interface InstallmentProfile {
  current_limit: number;
  available_limit: number;
  risk_score: number;
  on_time_payments_3m: number;
  late_flags: number;
}

export interface GalaxyProfile {
  user_id: string;
  display_name: string;
  orbit_level: number;
  total_energy: number;
  total_xp: number;
  partner_share: number;
  planets: PlanetProgress[];
  active_boosters: BoosterWindow[];
  quests: QuestItem[];
  installment_profile: InstallmentProfile;
}

export interface ReferralEntry {
  referral_id: string;
  inviter_id: string;
  invitee_id: string;
  state: string;
  activated_at: string | null;
}

export interface FriendEntry {
  friendship_id: string;
  user_id: string;
  display_name: string;
  status: string;
  source: string;
  created_at: string;
  accepted_at: string | null;
}

export interface FriendsResponse {
  accepted: FriendEntry[];
  pending_incoming: FriendEntry[];
  pending_outgoing: FriendEntry[];
}

export interface FriendActivityEntry {
  activity_id: string;
  actor_user_id: string;
  actor_display_name: string;
  kind: string;
  title: string;
  detail: string;
  created_at: string;
}

export interface QrResolvedPayload {
  valid: boolean;
  resolved_type: string;
  title: string;
  description: string;
  cta_kind: string;
  cta_target: string | null;
  raw_payload: string;
}

export interface AssistantContext {
  user_id: string;
  recommended_focus: string;
  quick_prompts: string[];
  summary_chips: string[];
  friend_count: number;
  pending_invites_count: number;
}

export interface AssistantChatResponse {
  message: string;
  suggested_actions: string[];
  related_modules: string[];
  context_chips: string[];
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  orbit_level: number;
  total_xp: number;
}

export interface AdminKpi {
  active_users: number;
  activation_rate: number;
  partner_share: number;
  average_tx_frequency: number;
  on_time_payment_rate: number;
  referral_activation_rate: number;
  reward_to_revenue_ratio: number;
  k_factor: number;
  total_rewards: number;
  total_revenue: number;
  guardrail_headroom: number;
}

export interface AdminRiskEntry {
  risk_flag_id: string;
  user_id: string;
  flag_type: string;
  severity: number;
  detail: string;
  is_active: boolean;
  created_at: string;
}

export const PLANET_META = {
  ORBIT_COMMERCE: {
    title: "Орбита покупок",
    accent: "var(--planet-orbit)",
    summary: "Партнерские покупки, бустеры категорий и кэшбэк-гравитация",
  },
  CREDIT_SHIELD: {
    title: "Кредитный щит",
    accent: "var(--planet-shield)",
    summary: "Платежи в срок, безопасный рост лимита и доверие",
  },
  SOCIAL_RING: {
    title: "Социальное кольцо",
    accent: "var(--planet-social)",
    summary: "Рефералы, команды и общие игровые циклы",
  },
} as const;
