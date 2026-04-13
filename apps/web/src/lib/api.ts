import type {
  AdminKpi,
  AdminRiskEntry,
  GalaxyProfile,
  GameCode,
  GameRunEntry,
  GameSummary,
  LeaderboardEntry,
  PlanetCode,
  QuestItem,
  ReferralEntry,
  RewardEntry,
} from "@mtb/contracts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type DemoLoginPayload = {
  user_id: string;
  display_name: string;
  segment: string;
};

export type EventPayload =
  | {
      event_type: "txn_posted";
      event_id: string;
      user_id: string;
      amount: number;
      merchant_id: string;
      category: string;
      is_partner: boolean;
      is_target_category: boolean;
      device_mismatch: boolean;
      multi_account_signal: boolean;
      timestamp: string;
    }
  | {
      event_type: "installment_paid_on_time";
      event_id: string;
      user_id: string;
      installment_amount: number;
      timestamp: string;
    }
  | {
      event_type: "referral_activated";
      event_id: string;
      user_id: string;
      invitee_id: string;
      timestamp: string;
    }
  | {
      event_type: "education_module_completed";
      event_id: string;
      user_id: string;
      module_id: string;
      score: number;
      timestamp: string;
    };

type AdminRiskResponse = {
  active_flags: AdminRiskEntry[];
  pending_rewards: RewardEntry[];
};

type GameRunPayload = {
  user_id: string;
  game_code: GameCode;
  planet_code: PlanetCode;
  score: number;
  base_reward: number;
  total_reward: number;
  bonus_breakdown: Record<string, unknown>;
  source_event_id?: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Ошибка API ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  demoLogin: (payload: DemoLoginPayload) =>
    request<{ user_id: string; token: string }>("/auth/demo-login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getProfile: (userId: string) => request<GalaxyProfile>(`/galaxy/profile?user_id=${userId}`),
  getQuests: (userId: string) => request<QuestItem[]>(`/quests?user_id=${userId}`),
  claimQuest: (questId: string, userId: string) =>
    request(`/quests/${questId}/claim?user_id=${userId}`, { method: "POST" }),
  getRewardLedger: (userId: string) => request<RewardEntry[]>(`/rewards/ledger?user_id=${userId}`),
  inviteFriend: (userId: string, inviteeId: string) =>
    request<ReferralEntry>(`/referrals/invite?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify({ invitee_id: inviteeId }),
    }),
  getLeaderboard: () => request<LeaderboardEntry[]>("/leaderboard"),
  submitGameRun: (payload: GameRunPayload) =>
    request<GameRunEntry>("/games/runs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getGameSummary: (userId: string) => request<GameSummary>(`/games/summary?user_id=${userId}`),
  getAdminKpi: () => request<AdminKpi>("/admin/kpi"),
  getAdminRisk: () => request<AdminRiskResponse>("/admin/risk"),
  ingest: (payload: EventPayload) =>
    request<{ event_id: string; status: string }>("/events/ingest", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  simulate: (payload: EventPayload) =>
    request<{ event_id: string; status: string }>("/admin/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  buildEvent(userId: string, kind: "partner" | "nonPartner" | "credit" | "referral" | "education" | "risky"): EventPayload {
    const eventId = `evt_${kind}_${Date.now()}`;
    const timestamp = new Date().toISOString();
    if (kind === "credit") {
      return {
        event_type: "installment_paid_on_time",
        event_id: eventId,
        user_id: userId,
        installment_amount: 70,
        timestamp,
      };
    }
    if (kind === "referral") {
      return {
        event_type: "referral_activated",
        event_id: eventId,
        user_id: userId,
        invitee_id: `friend_${Math.floor(Math.random() * 999)}`,
        timestamp,
      };
    }
    if (kind === "education") {
      return {
        event_type: "education_module_completed",
        event_id: eventId,
        user_id: userId,
        module_id: "finance_safety_01",
        score: 92,
        timestamp,
      };
    }
    return {
      event_type: "txn_posted",
      event_id: eventId,
      user_id: userId,
      amount: kind === "risky" ? 800 : kind === "partner" ? 120 : 65,
      merchant_id: kind === "partner" ? "merchant_partner_01" : "merchant_open_01",
      category: kind === "risky" ? "electronics" : "food",
      is_partner: kind !== "nonPartner",
      is_target_category: kind === "partner" || kind === "risky",
      device_mismatch: kind === "risky",
      multi_account_signal: kind === "risky",
      timestamp,
    };
  },
};
