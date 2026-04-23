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

export interface Fe2Constellation {
  name: string;
  index: number;
  big_stars_total: number;
  current_big_star: number;
  small_stars_per_segment: number;
  big_stars: ConstellationStar[];
  small_stars: ConstellationStar[];
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

const PLANET_BASE: Record<PlanetCode, { cashback: number; constellation: string; gameCode: GameCode }> = {
  ORBIT_COMMERCE: {
    cashback: 2.5,
    constellation: "Контур Андромеды",
    gameCode: "halva_snake",
  },
  CREDIT_SHIELD: {
    cashback: 1.5,
    constellation: "Щит Кассиопеи",
    gameCode: "credit_shield_reactor",
  },
  SOCIAL_RING: {
    cashback: 2,
    constellation: "Кольцо Лиры",
    gameCode: "social_ring_signal",
  },
};

const BIG_STAR_COORDS = [
  { x: 14, y: 72 },
  { x: 30, y: 34 },
  { x: 52, y: 58 },
  { x: 68, y: 20 },
  { x: 86, y: 48 },
];

const SMALL_STAR_COORDS = [
  { x: 18, y: 58 },
  { x: 24, y: 46 },
  { x: 36, y: 42 },
  { x: 43, y: 52 },
  { x: 58, y: 48 },
  { x: 64, y: 34 },
];

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
    const currentBigStar = Math.min(BIG_STARS_TOTAL - 1, index + 1);
    const smallStars = index + 2;
    const progress = Math.round(((currentBigStar * SMALL_STARS_PER_SEGMENT + smallStars) / (BIG_STARS_TOTAL * SMALL_STARS_PER_SEGMENT)) * 100);

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
  const planetIndex = stablePlanetIndex(planetId);
  const currentBigStar = Math.min(BIG_STARS_TOTAL - 1, planetIndex + 1);
  const smallStarsCurrent = Math.min(SMALL_STARS_PER_SEGMENT - 1, planetIndex + 2);
  const dailyAttemptsUsed = Math.min(DAILY_ATTEMPT_LIMIT - 1, planetIndex);
  const game = MINI_GAME_BY_CODE[base.gameCode];

  return {
    id: planetId,
    name: PLANET_META[planetId].title,
    cashback_percent: base.cashback,
    max_cashback_reached: base.cashback >= 5,
    constellation: {
      name: base.constellation,
      index: planetIndex,
      big_stars_total: BIG_STARS_TOTAL,
      current_big_star: currentBigStar,
      small_stars_per_segment: SMALL_STARS_PER_SEGMENT,
      big_stars: BIG_STAR_COORDS.map((coords, index) => ({
        id: `big-${index}`,
        ...coords,
        lit: index < currentBigStar,
      })),
      small_stars: SMALL_STAR_COORDS.map((coords, index) => ({
        id: `small-${index}`,
        ...coords,
        lit: index < smallStarsCurrent,
      })),
    },
    period_small_stars: 18 + planetIndex * 7,
    big_stars_until_increase: Math.max(0, BIG_STARS_TOTAL - currentBigStar),
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
