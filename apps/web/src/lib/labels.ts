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
  cashback_tetris: "Орбитальный тетрис",
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
  cashback_booster: "орбитальный бустер",
  credit_shield_xp: "опыт Кредитного щита",
  education_hook: "образовательный импульс",
  mini_game_stardust: "звездная пыль за игру",
  quest_booster: "квестовый бустер",
  quest_cashback: "усиление за квест",
  quest_limit_boost: "рост доступа за квест",
  quest_tournament_pass: "турнирный пропуск",
  social_ring_reward: "импульс Социального кольца",
};

const REWARD_KIND_LABELS: Record<string, string> = {
  booster: "бустер",
  cashback: "усиление",
  limit_boost: "рост доступа",
  tournament_pass: "турнирный пропуск",
};

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "электроника",
  food: "еда",
};

const EVENT_KIND_LABELS: Record<GameActionKind, string> = {
  partner: "партнерский сигнал",
  nonPartner: "свободный сигнал",
  credit: "сигнал щита",
  referral: "активация реферала",
  education: "обучающий модуль",
  risky: "антифрод-сигнал",
};

const RISK_FLAG_LABELS: Record<string, string> = {
  device_mismatch: "смена устройства",
  large_amount: "высокая интенсивность",
  multi_account: "мультиаккаунт",
  velocity_excess: "частый поток",
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
