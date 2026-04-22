import type { GameCode, PlanetCode } from "@mtb/contracts";
import type { GameActionKind } from "@/lib/game-config";

export const SEGMENT_LABELS: Record<"student" | "first-jobber" | "freelancer", string> = {
  student: "Студент",
  "first-jobber": "Первый доход",
  freelancer: "Фрилансер",
};

export const PLANET_CODE_LABELS: Record<PlanetCode, string> = {
  ORBIT_COMMERCE: "Орбита покупок",
  CREDIT_SHIELD: "Кредитный щит",
  SOCIAL_RING: "Социальное кольцо",
};

export const GAME_CODE_LABELS: Record<GameCode, string> = {
  halva_snake: "Змейка Халва",
  credit_shield_reactor: "Реактор щита",
  social_ring_signal: "Сигнальный ринг",
  moby_bird: "Moby Bird",
  cashback_tetris: "Cashback Tetris",
  moby_jump: "Moby Jump",
  fintech_match3: "Fintech Match-3",
  super_moby_bros: "Super Moby Bros",
};

const STATUS_LABELS: Record<string, string> = {
  active: "активно",
  activated: "активировано",
  claimed: "получено",
  completed: "готово",
  confirmed: "подтверждено",
  flagged: "на проверке",
  invited: "приглашен",
  pending: "на проверке",
  processed: "обработано",
  queued: "в очереди",
  received: "получено",
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  cashback_booster: "кэшбэк-бустер",
  credit_shield_xp: "опыт Кредитного щита",
  education_hook: "образовательный бонус",
  mini_game_stardust: "звездная пыль за игру",
  quest_booster: "квестовый бустер",
  quest_cashback: "кэшбэк за квест",
  quest_limit_boost: "рост лимита за квест",
  quest_tournament_pass: "турнирный пропуск",
  social_ring_reward: "награда Социального кольца",
};

const REWARD_KIND_LABELS: Record<string, string> = {
  booster: "бустер",
  cashback: "кэшбэк",
  limit_boost: "рост лимита",
  tournament_pass: "турнирный пропуск",
};

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "электроника",
  food: "еда",
};

const EVENT_KIND_LABELS: Record<GameActionKind, string> = {
  partner: "партнерская покупка",
  nonPartner: "обычная покупка",
  credit: "платеж рассрочки",
  referral: "активация реферала",
  education: "финансовый урок",
  risky: "антифрод-проверка",
};

const RISK_FLAG_LABELS: Record<string, string> = {
  device_mismatch: "смена устройства",
  large_amount: "крупная операция",
  multi_account: "мультиаккаунт",
  velocity_excess: "частые операции",
};

function fallbackLabel(value: string) {
  return value.replace(/_/g, " ").trim();
}

export function formatStatus(value: string) {
  return STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function formatRewardType(value: string) {
  return REWARD_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function formatRewardKind(value: string) {
  return REWARD_KIND_LABELS[value] ?? fallbackLabel(value);
}

export function formatCategory(value: string) {
  return CATEGORY_LABELS[value] ?? fallbackLabel(value);
}

export function formatEventKind(value: GameActionKind) {
  return EVENT_KIND_LABELS[value] ?? fallbackLabel(value);
}

export function formatRiskFlag(value: string) {
  return RISK_FLAG_LABELS[value] ?? fallbackLabel(value);
}
