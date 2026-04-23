import { PLANET_META, type GameCode, type PlanetCode } from "@mtb/contracts";
import { MINI_GAME_BY_CODE } from "@/lib/mini-games";

const FE2_API_URL = import.meta.env.VITE_FE2_API_URL as string | undefined;
const PLANET_ORDER: PlanetCode[] = ["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"];
const SMALL_STARS_PER_SEGMENT = 6;
const BIG_STARS_TOTAL = 5;
const DAILY_ATTEMPT_LIMIT = 5;

export interface Fe2PlanetListItem {
  id: PlanetCode;
  name: string;
  cashback_percent: number;
  progress_percent: number;
}

export interface ConstellationStar {
  id: string;
  x: number;
  y: number;
  lit: boolean;
}

export type ConstellationConnection = readonly [string, string];

export interface Fe2Constellation {
  name: string;
  index: number;
  big_stars_total: number;
  current_big_star: number;
  small_stars_per_segment: number;
  big_stars: ConstellationStar[];
  small_stars: ConstellationStar[];
  connections: ConstellationConnection[];
}

export interface Fe2PlanetGame {
  code: GameCode;
  name: string;
  daily_attempts_used: number;
  daily_attempts_limit: number;
  remaining_attempts_today: number;
}

export interface Fe2PlanetProgress {
  id: PlanetCode;
  name: string;
  cashback_percent: number;
  max_cashback_reached: boolean;
  constellation: Fe2Constellation;
  period_small_stars: number;
  big_stars_until_increase: number;
  game: Fe2PlanetGame;
}

export interface Fe2GameRunResult {
  small_star_awarded: boolean;
  remaining_attempts_today: number;
  planet_progress: Fe2PlanetProgress;
}

export interface Fe2LeaderboardEntry {
  user_id: string;
  name: string;
  avatar: string;
  period_small_stars: number;
  rank: number;
  is_current_user: boolean;
}

export interface Fe2PlanetLeaderboard {
  planet_id: PlanetCode;
  period: "week";
  entries: Fe2LeaderboardEntry[];
  current_user_rank: number;
  period_ends_at: string;
}

interface ConstellationTemplate {
  name: string;
  bigStars: Array<{ x: number; y: number }>;
  smallStars: Array<{ x: number; y: number }>;
  connections: ConstellationConnection[];
}

const CONSTELLATION_TEMPLATES: Record<PlanetCode, ConstellationTemplate> = {
  ORBIT_COMMERCE: {
    name: "Близнецы",
    bigStars: [
      { x: 23, y: 14 },
      { x: 43, y: 18 },
      { x: 31, y: 34 },
      { x: 40, y: 44 },
      { x: 24, y: 72 },
      { x: 55, y: 60 },
      { x: 63, y: 76 },
    ],
    smallStars: [
      { x: 19, y: 26 },
      { x: 48, y: 31 },
      { x: 28, y: 51 },
      { x: 47, y: 50 },
      { x: 59, y: 69 },
    ],
    connections: [
      ["big-0", "small-0"],
      ["small-0", "big-2"],
      ["big-1", "small-1"],
      ["small-1", "big-3"],
      ["big-2", "big-3"],
      ["big-2", "small-2"],
      ["small-2", "big-4"],
      ["big-3", "small-3"],
      ["small-3", "big-5"],
      ["big-5", "small-4"],
      ["small-4", "big-6"],
    ],
  },
  CREDIT_SHIELD: {
    name: "Весы",
    bigStars: [
      { x: 24, y: 18 },
      { x: 48, y: 18 },
      { x: 68, y: 34 },
      { x: 28, y: 46 },
      { x: 50, y: 58 },
      { x: 56, y: 76 },
    ],
    smallStars: [
      { x: 23, y: 31 },
      { x: 58, y: 26 },
      { x: 52, y: 67 },
    ],
    connections: [
      ["big-0", "big-1"],
      ["big-1", "small-1"],
      ["small-1", "big-2"],
      ["big-0", "small-0"],
      ["small-0", "big-3"],
      ["big-3", "big-2"],
      ["big-3", "big-4"],
      ["big-4", "small-2"],
      ["small-2", "big-5"],
    ],
  },
  SOCIAL_RING: {
    name: "Водолей",
    bigStars: [
      { x: 70, y: 16 },
      { x: 50, y: 24 },
      { x: 30, y: 38 },
      { x: 38, y: 58 },
      { x: 52, y: 72 },
      { x: 58, y: 88 },
    ],
    smallStars: [
      { x: 61, y: 18 },
      { x: 40, y: 30 },
      { x: 27, y: 49 },
      { x: 45, y: 65 },
    ],
    connections: [
      ["big-0", "small-0"],
      ["small-0", "big-1"],
      ["big-1", "small-1"],
      ["small-1", "big-2"],
      ["big-2", "small-2"],
      ["small-2", "big-3"],
      ["big-3", "small-3"],
      ["small-3", "big-4"],
      ["big-4", "big-5"],
    ],
  },
};

const PLANET_BASE: Record<PlanetCode, { cashback: number; gameCode: GameCode }> = {
  ORBIT_COMMERCE: {
    cashback: 2.5,
    gameCode: "halva_snake",
  },
  CREDIT_SHIELD: {
    cashback: 1.5,
    gameCode: "credit_shield_reactor",
  },
  SOCIAL_RING: {
    cashback: 2,
    gameCode: "social_ring_signal",
  },
};

function stablePlanetIndex(planetId: PlanetCode) {
  return PLANET_ORDER.indexOf(planetId) + 1;
}

function weekEndIso() {
  const end = new Date();
  const day = end.getDay() || 7;
  end.setDate(end.getDate() + (7 - day));
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

async function requestV1<T>(path: string, init?: RequestInit): Promise<T> {
  if (!FE2_API_URL) {
    throw new Error("FE2 API URL is not configured");
  }

  const response = await fetch(`${FE2_API_URL}/v1${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Ошибка FE2 API ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await request();
  } catch {
    return fallback();
  }
}

export function buildMockPlanetsList(): Fe2PlanetListItem[] {
  return PLANET_ORDER.map((planetId) => {
    const index = stablePlanetIndex(planetId);
    const template = CONSTELLATION_TEMPLATES[planetId];
    const currentBigStar = Math.min(template.bigStars.length, index + 2);
    const smallStars = Math.min(template.smallStars.length, index + 2);
    const totalStars = template.bigStars.length + template.smallStars.length;
    const progress = Math.round(((currentBigStar + smallStars) / totalStars) * 100);

    return {
      id: planetId,
      name: PLANET_META[planetId].title,
      cashback_percent: PLANET_BASE[planetId].cashback,
      progress_percent: Math.min(100, progress),
    };
  });
}

export function buildMockPlanetProgress(planetId: PlanetCode): Fe2PlanetProgress {
  const base = PLANET_BASE[planetId];
  const template = CONSTELLATION_TEMPLATES[planetId];
  const planetIndex = stablePlanetIndex(planetId);
  const currentBigStar = Math.min(template.bigStars.length, planetIndex + 2);
  const smallStarsCurrent = Math.min(template.smallStars.length, planetIndex + 2);
  const dailyAttemptsUsed = Math.min(DAILY_ATTEMPT_LIMIT - 1, planetIndex);
  const game = MINI_GAME_BY_CODE[base.gameCode];

  return {
    id: planetId,
    name: PLANET_META[planetId].title,
    cashback_percent: base.cashback,
    max_cashback_reached: base.cashback >= 5,
    constellation: {
      name: template.name,
      index: planetIndex,
      big_stars_total: template.bigStars.length,
      current_big_star: currentBigStar,
      small_stars_per_segment: template.smallStars.length,
      big_stars: template.bigStars.map((coords, index) => ({
        id: `big-${index}`,
        ...coords,
        lit: index < currentBigStar,
      })),
      small_stars: template.smallStars.map((coords, index) => ({
        id: `small-${index}`,
        ...coords,
        lit: index < smallStarsCurrent,
      })),
      connections: template.connections,
    },
    period_small_stars: 18 + planetIndex * 7,
    big_stars_until_increase: Math.max(0, template.bigStars.length - currentBigStar),
    game: {
      code: base.gameCode,
      name: game.title,
      daily_attempts_used: dailyAttemptsUsed,
      daily_attempts_limit: DAILY_ATTEMPT_LIMIT,
      remaining_attempts_today: DAILY_ATTEMPT_LIMIT - dailyAttemptsUsed,
    },
  };
}

export function createMockGameRunResult(
  gameCode: GameCode,
  planetId: PlanetCode,
  _score: number,
  currentProgress = buildMockPlanetProgress(planetId),
): Fe2GameRunResult {
  const nextProgress: Fe2PlanetProgress = {
    ...currentProgress,
    period_small_stars: currentProgress.period_small_stars + 1,
    game: {
      ...currentProgress.game,
      code: gameCode,
      daily_attempts_used: Math.min(currentProgress.game.daily_attempts_limit, currentProgress.game.daily_attempts_used + 1),
      remaining_attempts_today: Math.max(0, currentProgress.game.remaining_attempts_today - 1),
    },
    constellation: {
      ...currentProgress.constellation,
      small_stars: currentProgress.constellation.small_stars.map((star, index) =>
        index === currentProgress.constellation.small_stars.findIndex((item) => !item.lit)
          ? { ...star, lit: true }
          : star,
      ),
    },
  };

  return {
    small_star_awarded: true,
    remaining_attempts_today: nextProgress.game.remaining_attempts_today,
    planet_progress: nextProgress,
  };
}

export function buildMockPlanetLeaderboard(planetId: PlanetCode, currentUserId: string): Fe2PlanetLeaderboard {
  const planetSeed = stablePlanetIndex(planetId);
  const entries = Array.from({ length: 50 }, (_, index) => {
    const rank = index + 1;
    const isCurrentUser = rank === 8;
    return {
      user_id: isCurrentUser ? currentUserId : `pilot_${planetSeed}_${rank}`,
      name: isCurrentUser ? "Пилот Моби" : `Пилот ${rank.toString().padStart(2, "0")}`,
      avatar: String.fromCharCode(1040 + ((rank + planetSeed) % 32)),
      period_small_stars: Math.max(3, 96 - rank * 2 + planetSeed),
      rank,
      is_current_user: isCurrentUser,
    };
  }).sort((left, right) => right.period_small_stars - left.period_small_stars);

  const rankedEntries = entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
  const currentUser = rankedEntries.find((entry) => entry.is_current_user);

  return {
    planet_id: planetId,
    period: "week",
    entries: rankedEntries,
    current_user_rank: currentUser?.rank ?? 0,
    period_ends_at: weekEndIso(),
  };
}

export const fe2Api = {
  getPlanetsList: () => withMockFallback(() => requestV1<Fe2PlanetListItem[]>("/planets/list"), buildMockPlanetsList),
  getPlanetProgress: (planetId: PlanetCode) =>
    withMockFallback(() => requestV1<Fe2PlanetProgress>(`/planets/${planetId}/progress`), () => buildMockPlanetProgress(planetId)),
  submitGameRun: (payload: { gameCode: GameCode; planetId: PlanetCode; score: number; currentProgress?: Fe2PlanetProgress }) =>
    withMockFallback(
      () =>
        requestV1<Fe2GameRunResult>(`/games/${payload.gameCode}/runs`, {
          method: "POST",
          body: JSON.stringify({ score: payload.score, planet_id: payload.planetId }),
        }),
      () => createMockGameRunResult(payload.gameCode, payload.planetId, payload.score, payload.currentProgress),
    ),
  getPlanetLeaderboard: (planetId: PlanetCode, currentUserId: string) =>
    withMockFallback(
      () => requestV1<Fe2PlanetLeaderboard>(`/leaderboard/planet/${planetId}?period=week`),
      () => buildMockPlanetLeaderboard(planetId, currentUserId),
    ),
};
