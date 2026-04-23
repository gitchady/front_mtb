import { describe, expect, it } from "vitest";
import { formatGameRewardStatus } from "@/lib/game-status";

describe("game-status", () => {
  it("formats reward sync text without technical ids", () => {
    const text = formatGameRewardStatus({
      totalReward: 82,
      cratesEarned: 1,
      syncLabel: "Кредитным щитом",
    });

    expect(text).toBe("Забег завершен: +82 звездной пыли и 1 контейнер хранилища. Прогресс синхронизирован с Кредитным щитом.");
    expect(text).not.toMatch(/run_|evt_|run_id|event_id/i);
  });
});
