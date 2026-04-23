import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const gameStoreState = {
  stardust: 0,
  bonusStreak: 1,
  vaultCharge: 0,
  vaultCrates: 2,
  bonusHistory: [],
  openVaultCrate: vi.fn(),
  planetMastery: {},
};

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "ledger") {
      return { data: [], isLoading: false };
    }
    if (queryKey[0] === "games-summary") {
      return { data: { games: [] }, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  },
}));

vi.mock("@/lib/api", () => ({
  api: {
    claimVaultCrate: vi.fn(),
    getBonusHistory: vi.fn(),
    getRewardLedger: vi.fn(),
    getGameSummary: vi.fn(),
  },
}));

vi.mock("@/lib/game-store", () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(gameStoreState),
}));

vi.mock("@/lib/session-store", () => ({
  useSessionStore: () => ({
    userId: "u_demo",
  }),
}));

import { RewardsPage } from "@/pages/RewardsPage";

function renderRewardsPage() {
  return renderToStaticMarkup(createElement(RewardsPage));
}

describe("RewardsPage", () => {
  it("does not render the ready containers metric card", () => {
    const html = renderRewardsPage();

    expect(html).not.toContain("Готовые контейнеры");
  });

  it("does not render the backend mini-games eyebrow", () => {
    const html = renderRewardsPage();

    expect(html).not.toContain("Бэкенд мини-игр");
  });

  it("does not render the sync journal for regular users", () => {
    const html = renderRewardsPage();

    expect(html).not.toContain("Журнал синхронизации");
    expect(html).not.toContain("Синхронизированная активность");
  });

  it("renders a shorter rewards hero copy", () => {
    const html = renderRewardsPage();

    expect(html).toContain("Награды, пыль и контейнеры.");
    expect(html).not.toContain("Хранилище наград превращает каждый забег в звездную пыль, серию бонусов, мастерство и контейнеры.");
  });

  it("does not render the local bonus history card", () => {
    gameStoreState.bonusHistory = [
      {
        id: "orbit-1",
        title: "Получена награда Змейки Халва",
        detail: "Собрано орбитальных токенов в Змейке Халва: 12",
        planetCode: "ORBIT_COMMERCE",
        totalReward: 24,
        baseReward: 18,
        streakBonus: 2,
        masteryBonus: 2,
        performanceBonus: 1,
        focusBonus: 1,
        chargeGain: 58,
        cratesEarned: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    const html = renderRewardsPage();

    expect(html).not.toContain("История локальных бонусов");
    expect(html).not.toContain("Каждый запуск прозрачен");
    expect(html).not.toContain("Получена награда Змейки Халва");

    gameStoreState.bonusHistory = [];
  });
});
