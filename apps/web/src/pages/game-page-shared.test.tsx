import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/use-mini-game-claim", () => ({
  useMiniGameClaim: () => ({
    meta: { title: "Moby Jump" },
    rewardPreview: {
      totalReward: 12,
      streakBonus: 2,
      masteryBonus: 1,
      performanceBonus: 3,
    },
    claimMutation: {
      isPending: false,
      mutate: vi.fn(),
    },
    stardust: 101,
    bonusStreak: 7,
    vaultCrates: 0,
    bestScore: 0,
  }),
}));

import { GameHero } from "@/pages/game-page-shared";

function renderGameHero() {
  return renderToStaticMarkup(
    createElement(GameHero, {
      code: "moby_jump",
      kicker: "Мини-игра из документа",
      title: "Moby Jump поднимает пользователя по платформам маршрутных целей",
      description: "Двигайтесь влево и вправо, ловите обычные цели и ускорители, чтобы поднять Кредитный щит выше",
      score: 0,
      baseReward: 6,
      status: "Прыжок готов",
      setStatus: vi.fn(),
      rewardClaimed: false,
      canClaim: false,
      onClaimed: vi.fn(),
    }),
  );
}

describe("GameHero", () => {
  it("renders hero metrics as a compact two-column grid", () => {
    const html = renderGameHero();

    expect(html).toContain("game-hero-metrics grid grid-cols-2 gap-2");
    expect(html).toContain("metric-chip metric-chip--compact game-hero-metrics__chip");
    expect(html).not.toContain("grid gap-3 sm:grid-cols-2");
  });
});
