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
    totalReward: 10,
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
      recordSocialRun: vi.fn(),
      bestSocialScore: 0,
      stardust: 0,
      bonusStreak: 1,
      vaultCharge: 0,
      vaultCrates: 0,
      selectedPlanet: "SOCIAL_RING",
      structures: {},
      planetMastery: {},
    }),
}));

vi.mock("@/lib/session-store", () => ({
  useSessionStore: () => ({
    userId: "u_demo",
  }),
}));

import { SocialRingGamePage } from "@/pages/SocialRingGamePage";

function renderSocialRingGamePage() {
  return renderToStaticMarkup(createElement(SocialRingGamePage));
}

describe("SocialRingGamePage", () => {
  it("uses compact hero metrics for the social ring header", () => {
    const html = renderSocialRingGamePage();

    expect(html).toContain("game-hero-metrics grid grid-cols-2 gap-2");
    expect(html).toContain("metric-chip metric-chip--compact game-hero-metrics__chip");
  });

  it("keeps the start button next to the ring stage", () => {
    const html = renderSocialRingGamePage();
    const stageIndex = html.indexOf("signal-stage");
    const mobileActionsIndex = html.indexOf("social-ring-stage-actions");

    expect(stageIndex).toBeGreaterThan(-1);
    expect(mobileActionsIndex).toBeGreaterThan(stageIndex);
    expect(html).toContain("Старт ринга");
  });

  it("renders the ring as four matching signal pads without the central core", () => {
    const html = renderSocialRingGamePage();

    expect(html).not.toContain("signal-stage__ring");
    expect(html).not.toContain("signal-stage__core");
    expect(html).toContain("signal-stage__pads signal-stage__pads--flat");
    expect(html).toContain("Нова");
    expect(html).toContain("Сияние");
    expect(html).toContain("Мята");
    expect(html).toContain("Пульс");
  });
});
