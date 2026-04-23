import type { GameCode, PlanetCode } from "@mtb/contracts";
import { MINI_GAME_BY_CODE } from "@/lib/mini-games";

export type PlanetUnlockMap = Record<PlanetCode, boolean>;

export const INITIAL_UNLOCKED_PLANETS: PlanetUnlockMap = {
  ORBIT_COMMERCE: true,
  CREDIT_SHIELD: false,
  SOCIAL_RING: false,
};

export const PLANET_UNLOCK_REQUIREMENTS: Record<PlanetCode, string> = {
  ORBIT_COMMERCE: "Открыта с начала",
  CREDIT_SHIELD:
    "Наберите первый прогресс в Орбите покупок или завершите любую игру Орбиты покупок со счетом больше 0",
  SOCIAL_RING:
    "Наберите первый прогресс в Кредитном щите или завершите любую игру Кредитного щита со счетом больше 0",
};

const QUEST_UNLOCKS: Partial<Record<string, PlanetCode>> = {
  quest_orbit_001: "CREDIT_SHIELD",
  quest_credit_001: "SOCIAL_RING",
};

export function getQuestUnlockTarget(questId?: string) {
  return questId ? QUEST_UNLOCKS[questId] : undefined;
}

export function getGameUnlockTarget(gameCode: GameCode, score: number) {
  if (score <= 0) {
    return undefined;
  }

  const planetCode = MINI_GAME_BY_CODE[gameCode].planetCode;
  if (planetCode === "ORBIT_COMMERCE") {
    return "CREDIT_SHIELD";
  }
  if (planetCode === "CREDIT_SHIELD") {
    return "SOCIAL_RING";
  }
  return undefined;
}

export function getPlanetRunUnlockTarget(planetCode: PlanetCode, score: number) {
  if (score <= 0) {
    return undefined;
  }
  if (planetCode === "ORBIT_COMMERCE") {
    return "CREDIT_SHIELD";
  }
  if (planetCode === "CREDIT_SHIELD") {
    return "SOCIAL_RING";
  }
  return undefined;
}

export function isPlanetUnlocked(unlockedPlanets: Partial<PlanetUnlockMap> | undefined, planetCode: PlanetCode) {
  return Boolean(unlockedPlanets?.[planetCode]);
}
