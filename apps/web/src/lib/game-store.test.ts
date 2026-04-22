import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "@/lib/game-store";

function resetGameStore() {
  useGameStore.setState(useGameStore.getInitialState(), true);
}

describe("planet unlock progression", () => {
  beforeEach(() => {
    resetGameStore();
  });

  it("starts with only Orbit Commerce unlocked", () => {
    expect(useGameStore.getState().unlockedPlanets).toEqual({
      ORBIT_COMMERCE: true,
      CREDIT_SHIELD: false,
      SOCIAL_RING: false,
    });
  });

  it("unlocks Credit Shield after claiming quest_orbit_001", () => {
    useGameStore.getState().claimQuestReward({
      planetCode: "ORBIT_COMMERCE",
      questId: "quest_orbit_001",
      title: "Квест Орбиты",
      detail: "Награда получена.",
      baseReward: 5,
    });

    expect(useGameStore.getState().unlockedPlanets.CREDIT_SHIELD).toBe(true);
  });

  it("unlocks Social Ring after claiming quest_credit_001", () => {
    useGameStore.getState().claimQuestReward({
      planetCode: "CREDIT_SHIELD",
      questId: "quest_credit_001",
      title: "Квест щита",
      detail: "Награда получена.",
      baseReward: 5,
    });

    expect(useGameStore.getState().unlockedPlanets.SOCIAL_RING).toBe(true);
  });

  it("unlocks Credit Shield after a successful Orbit Commerce game run", () => {
    useGameStore.getState().recordMiniGameRun({
      gameCode: "cashback_tetris",
      score: 1,
      baseReward: 4,
    });

    expect(useGameStore.getState().unlockedPlanets.CREDIT_SHIELD).toBe(true);
  });

  it("unlocks Social Ring after a successful Credit Shield game run", () => {
    useGameStore.getState().recordMiniGameRun({
      gameCode: "moby_bird",
      score: 1,
      baseReward: 4,
    });

    expect(useGameStore.getState().unlockedPlanets.SOCIAL_RING).toBe(true);
  });
});
