import type { PlanetCode } from "@mtb/contracts";

export interface BonusSnapshot {
  bonusStreak: number;
  vaultCharge: number;
  selectedPlanet: PlanetCode;
  structures: Record<PlanetCode, string[]>;
  planetMastery: Record<PlanetCode, number>;
}

export interface BonusInput {
  planetCode: PlanetCode;
  baseReward: number;
  performanceScore?: number;
  category: "planet_action" | "quest" | "mini_game";
}

export interface BonusOutcome {
  baseReward: number;
  streakBonus: number;
  masteryBonus: number;
  performanceBonus: number;
  focusBonus: number;
  totalReward: number;
  chargeGain: number;
  cratesEarned: number;
  nextVaultCharge: number;
  nextStreak: number;
  nextMastery: number;
}

export function calculateBonusOutcome(snapshot: BonusSnapshot, input: BonusInput): BonusOutcome {
  const nextStreak = Math.min(snapshot.bonusStreak + 1, 7);
  const currentMastery = snapshot.planetMastery[input.planetCode] ?? 0;
  const structureCount = snapshot.structures[input.planetCode]?.length ?? 0;
  const streakBonus = Math.round(input.baseReward * Math.min((nextStreak - 1) * 0.06, 0.36));
  const masteryBonus = Math.round(input.baseReward * Math.min(currentMastery * 0.04 + structureCount * 0.03, 0.42));
  const performanceBonus =
    input.category === "mini_game" ? Math.min(12, Math.floor((input.performanceScore ?? 0) / 4)) : 0;
  const focusBonus = snapshot.selectedPlanet === input.planetCode ? 2 : 0;
  const totalReward = input.baseReward + streakBonus + masteryBonus + performanceBonus + focusBonus;
  const chargeGain = Math.max(8, Math.round(totalReward * 2.4));
  const nextChargeValue = snapshot.vaultCharge + chargeGain;
  const cratesEarned = Math.floor(nextChargeValue / 100);

  return {
    baseReward: input.baseReward,
    streakBonus,
    masteryBonus,
    performanceBonus,
    focusBonus,
    totalReward,
    chargeGain,
    cratesEarned,
    nextVaultCharge: nextChargeValue % 100,
    nextStreak,
    nextMastery: Math.min(currentMastery + 1, 12),
  };
}
