import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    ingest: vi.fn(),
    buildEvent: vi.fn(),
    submitGameRun: vi.fn(),
  },
}));

vi.mock("@/lib/bonus-engine", () => ({
  calculateBonusOutcome: () => ({
    totalReward: 4,
    streakBonus: 0,
    masteryBonus: 0,
    performanceBonus: 0,
    focusBonus: 0,
    chargeGain: 0,
    cratesEarned: 0,
  }),
}));

vi.mock("@/lib/game-store", () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      recordSnakeRun: vi.fn(),
      bestSnakeScore: 0,
      stardust: 0,
      bonusStreak: 1,
      vaultCharge: 0,
      vaultCrates: 0,
      selectedPlanet: "ORBIT_COMMERCE",
      structures: {},
      planetMastery: {},
    }),
}));

vi.mock("@/lib/session-store", () => ({
  useSessionStore: () => ({
    userId: "u_demo",
  }),
}));

import { SnakePage } from "@/pages/SnakePage";

function renderSnakePage() {
  return renderToStaticMarkup(createElement(SnakePage));
}

describe("SnakePage", () => {
  it("marks the on-screen controls panel as hidden on mobile", () => {
    const html = renderSnakePage();

    expect(html).toContain("snake-controls-panel snake-controls-panel--desktop");
  });

  it("uses compact hero metrics and omits the tick-rate card", () => {
    const html = renderSnakePage();

    expect(html).toContain("snake-hero-metrics");
    expect(html).toContain("metric-chip metric-chip--compact");
    expect(html).not.toContain("Темп обновления");
  });

  it("keeps the long hero instructions desktop-only", () => {
    const html = renderSnakePage();

    expect(html).toContain("snake-hero-description");
    expect(html).toContain("snake-hero-description hidden");
  });

  it("moves mobile run actions below the reward card", () => {
    const html = renderSnakePage();
    const rewardIndex = html.indexOf("Забрать награду");
    const mobileActionsIndex = html.indexOf("snake-mobile-actions md:hidden");

    expect(mobileActionsIndex).toBeGreaterThan(-1);
    expect(rewardIndex).toBeGreaterThan(-1);
    expect(mobileActionsIndex).toBeGreaterThan(rewardIndex);
    expect(html).toContain("snake-run-actions hidden md:flex");
  });
});
