import type { GameCode, PlanetCode } from "@mtb/contracts";

export type GameEventKind = "partner" | "nonPartner" | "credit" | "referral" | "education" | "risky";

export interface MiniGameMeta {
  code: GameCode;
  title: string;
  navTitle: string;
  route: string;
  planetCode: PlanetCode;
  eventKind: GameEventKind;
  detail: string;
}

export const MINI_GAMES: MiniGameMeta[] = [
  {
    code: "halva_snake",
    title: "Змейка Халва",
    navTitle: "Змейка Халва",
    route: "/app/game/halva-snake",
    planetCode: "ORBIT_COMMERCE",
    eventKind: "partner",
    detail: "Забег Орбиты покупок с ростом скорости и синхронизацией наград.",
  },
  {
    code: "credit_shield_reactor",
    title: "Реактор щита",
    navTitle: "Реактор щита",
    route: "/app/game/credit-shield-reactor",
    planetCode: "CREDIT_SHIELD",
    eventKind: "credit",
    detail: "Тайминг-цикл Кредитного щита с прогрессией на 12 раундов.",
  },
  {
    code: "social_ring_signal",
    title: "Сигнальный ринг",
    navTitle: "Сигнальный ринг",
    route: "/app/game/social-ring-signal",
    planetCode: "SOCIAL_RING",
    eventKind: "referral",
    detail: "Игра на память, которая питает Социальное кольцо живым реферальным импульсом.",
  },
  {
    code: "moby_bird",
    title: "Moby Bird",
    navTitle: "Moby Bird",
    route: "/app/game/moby-bird",
    planetCode: "CREDIT_SHIELD",
    eventKind: "education",
    detail: "Полет маскота через графики расходов с очками за зоны экономии.",
  },
  {
    code: "cashback_tetris",
    title: "Cashback Tetris",
    navTitle: "Cashback Tetris",
    route: "/app/game/cashback-tetris",
    planetCode: "ORBIT_COMMERCE",
    eventKind: "partner",
    detail: "Сборка категорий кэшбэка в линии для кратких бонусных окон.",
  },
  {
    code: "moby_jump",
    title: "Moby Jump",
    navTitle: "Moby Jump",
    route: "/app/game/moby-jump",
    planetCode: "CREDIT_SHIELD",
    eventKind: "education",
    detail: "Прыжки по финансовым целям с усилителями Халвы.",
  },
  {
    code: "fintech_match3",
    title: "Fintech Match-3",
    navTitle: "Fintech Match-3",
    route: "/app/game/fintech-match3",
    planetCode: "ORBIT_COMMERCE",
    eventKind: "partner",
    detail: "Три в ряд с банковскими продуктами и ежедневными финансовыми комбо.",
  },
  {
    code: "super_moby_bros",
    title: "Super Moby Bros",
    navTitle: "Super Moby Bros",
    route: "/app/game/super-moby-bros",
    planetCode: "SOCIAL_RING",
    eventKind: "referral",
    detail: "Платформер про бонусные монеты, препятствия и финансовую грамотность.",
  },
];

export const MINI_GAME_BY_CODE = MINI_GAMES.reduce(
  (acc, game) => {
    acc[game.code] = game;
    return acc;
  },
  {} as Record<GameCode, MiniGameMeta>,
);
