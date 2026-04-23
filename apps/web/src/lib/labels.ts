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
  active: "Активно",
  activated: "Активировано",
  claimed: "Получено",
  completed: "Готово",
  confirmed: "Подтверждено",
  flagged: "На проверке",
  invited: "Приглашен",
  pending: "На проверке",
  processed: "Обработано",
  queued: "В очереди",
  received: "Получено",
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  cashback_booster: "Орбитальный бустер",
  credit_shield_xp: "Опыт Кредитного щита",
  education_hook: "Образовательный импульс",
  mini_game_stardust: "Звездная пыль за игру",
  quest_booster: "Квестовый бустер",
  quest_cashback: "Усиление за квест",
  quest_limit_boost: "Рост доступа за квест",
  quest_tournament_pass: "Турнирный пропуск",
  social_ring_reward: "Импульс Социального кольца",
};

const REWARD_KIND_LABELS: Record<string, string> = {
  booster: "Бустер",
  cashback: "Усиление",
  limit_boost: "Рост доступа",
  tournament_pass: "Турнирный пропуск",
};

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Электроника",
  food: "Еда",
};

const EVENT_KIND_LABELS: Record<GameActionKind, string> = {
  partner: "Партнерский сигнал",
  nonPartner: "Свободный сигнал",
  credit: "Сигнал щита",
  referral: "Активация реферала",
  education: "Обучающий модуль",
  risky: "Антифрод-сигнал",
};

const RISK_FLAG_LABELS: Record<string, string> = {
  device_mismatch: "Смена устройства",
  large_amount: "Высокая интенсивность",
  multi_account: "Мультиаккаунт",
  velocity_excess: "Частый поток",
};

function fallbackLabel(value: string) {
  return value.replace(/_/g, " ").trim().replace(/^./, (char) => char.toUpperCase());
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
