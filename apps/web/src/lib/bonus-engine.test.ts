import { describe, expect, it } from "vitest";
import { calculateBonusOutcome } from "@/lib/bonus-engine";

const structures = {
  ORBIT_COMMERCE: ["merchant-relay"],
  CREDIT_SHIELD: [],
  SOCIAL_RING: [],
};

const planetMastery = {
  ORBIT_COMMERCE: 3,
  CREDIT_SHIELD: 0,
  SOCIAL_RING: 0,
};

describe("bonus engine", () => {
  it("adds streak, mastery, performance and focus bonuses to a mini-game payout", () => {
    const outcome = calculateBonusOutcome(
      {
        bonusStreak: 2,
        vaultCharge: 20,
        selectedPlanet: "ORBIT_COMMERCE",
        structures,
        planetMastery,
      },
      {
        planetCode: "ORBIT_COMMERCE",
        baseReward: 10,
        performanceScore: 17,
        category: "mini_game",
      },
    );

    expect(outcome.totalReward).toBeGreaterThan(10);
    expect(outcome.performanceBonus).toBe(4);
    expect(outcome.focusBonus).toBe(2);
    expect(outcome.nextStreak).toBe(3);
    expect(outcome.nextMastery).toBe(4);
  });

  it("turns high vault charge into crates and keeps the remaining charge", () => {
    const outcome = calculateBonusOutcome(
      {
        bonusStreak: 6,
        vaultCharge: 92,
        selectedPlanet: "CREDIT_SHIELD",
        structures,
        planetMastery,
      },
      {
        planetCode: "CREDIT_SHIELD",
        baseReward: 8,
        category: "quest",
      },
    );

    expect(outcome.cratesEarned).toBeGreaterThanOrEqual(1);
    expect(outcome.nextVaultCharge).toBeLessThan(100);
  });
});
