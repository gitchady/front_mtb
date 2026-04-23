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
    totalReward: 5,
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
      recordShieldRun: vi.fn(),
      bestShieldScore: 0,
      stardust: 0,
      bonusStreak: 1,
      vaultCharge: 0,
      vaultCrates: 0,
      selectedPlanet: "CREDIT_SHIELD",
      structures: {},
      planetMastery: {},
    }),
}));

vi.mock("@/lib/session-store", () => ({
  useSessionStore: () => ({
    userId: "u_demo",
  }),
}));

import { CreditShieldGamePage } from "@/pages/CreditShieldGamePage";

function renderCreditShieldGamePage() {
  return renderToStaticMarkup(createElement(CreditShieldGamePage));
}

describe("CreditShieldGamePage", () => {
  it("renders the start and lock controls next to the reactor instead of the control panel", () => {
    const html = renderCreditShieldGamePage();
    const startButtonIndex = html.indexOf("Старт реактора");
    const buttonIndex = html.indexOf("Зафиксировать импульс");
    const reactorLabelsIndex = html.indexOf("shield-reactor__labels");
    const meterIndex = html.indexOf("shield-reactor__meter");

    expect(startButtonIndex).toBeGreaterThan(-1);
    expect(buttonIndex).toBeGreaterThan(-1);
    expect(reactorLabelsIndex).toBeGreaterThan(-1);
    expect(meterIndex).toBeGreaterThan(-1);
    expect(meterIndex).toBeLessThan(reactorLabelsIndex);
    expect(startButtonIndex).toBeGreaterThan(reactorLabelsIndex);
    expect(buttonIndex).toBeGreaterThan(reactorLabelsIndex);
  });

  it("does not render the containers metric card", () => {
    const html = renderCreditShieldGamePage();

    expect(html).not.toContain("Контейнеры");
  });

  it("renders shield hero metrics in the compact mobile grid", () => {
    const html = renderCreditShieldGamePage();

    expect(html).toContain("game-hero-metrics grid grid-cols-2 gap-2");
    expect(html).toContain("metric-chip metric-chip--compact game-hero-metrics__chip");
    expect(html).not.toContain("grid gap-3 sm:grid-cols-2");
  });
});
