import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "profile") {
      return {
        data: {
          orbit_level: 1,
          planets: [
            { planet_code: "ORBIT_COMMERCE", xp: 0, level: 1 },
            { planet_code: "CREDIT_SHIELD", xp: 0, level: 1 },
            { planet_code: "SOCIAL_RING", xp: 0, level: 1 },
          ],
          active_boosters: [],
          quests: [
            {
              quest_id: "quest_orbit_001",
              title: "Партнерский импульс",
              description: "Сделайте первую партнерскую покупку",
              planet_code: "ORBIT_COMMERCE",
              condition_type: "partner",
              threshold: 3,
              reward_kind: "stardust",
              reward_value: 12,
              status: "active",
              current_value: 1,
            },
          ],
        },
        isLoading: false,
        isFetching: false,
      };
    }

    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
    };
  },
  useMutation: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) =>
      createElement("div", props, children),
  },
}));

vi.mock("@/components/GalaxyStage", () => ({
  GalaxyStage: () => createElement("div", null, "GalaxyStage"),
}));

vi.mock("@/components/OnboardingOverlay", () => ({
  OnboardingOverlay: () => null,
}));

vi.mock("@/components/PlanetInspector", () => ({
  PlanetInspector: () => createElement("div", null, "PlanetInspector"),
}));

vi.mock("@/lib/api", () => ({
  api: {
    getProfile: vi.fn(),
    getRewardLedger: vi.fn(),
    ingest: vi.fn(),
    buildEvent: vi.fn(),
  },
}));

vi.mock("@/lib/game-store", () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      onboardingComplete: true,
      playerAlias: "Пилот Моби",
      playerSegment: "student",
      selectedPlanet: "ORBIT_COMMERCE",
      stardust: 12,
      structures: {
        ORBIT_COMMERCE: [],
        CREDIT_SHIELD: [],
        SOCIAL_RING: [],
      },
      actionLog: [],
      totalRuns: 0,
      bestShieldScore: 0,
      bestSocialScore: 0,
      bestSnakeScore: 0,
      bonusStreak: 1,
      vaultCharge: 0,
      vaultCrates: 0,
      planetMastery: {
        ORBIT_COMMERCE: 0,
        CREDIT_SHIELD: 0,
        SOCIAL_RING: 0,
      },
      unlockedPlanets: {
        ORBIT_COMMERCE: true,
        CREDIT_SHIELD: true,
        SOCIAL_RING: true,
      },
      completeOnboarding: vi.fn(),
      selectPlanet: vi.fn(),
      buildStructure: vi.fn(),
      claimPlanetAction: vi.fn(() => ({ totalReward: 1, cratesEarned: 0 })),
    }),
}));

vi.mock("@/lib/session-store", () => ({
  useSessionStore: () => ({
    userId: "u_demo",
    syncProfile: vi.fn(),
  }),
}));

import { GalaxyPage } from "@/pages/GalaxyPage";

function renderGalaxyPage() {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/app/galaxy"] }, createElement(GalaxyPage)));
}

describe("GalaxyPage", () => {
  it("renders quest-driven missions and removes old activity blocks", () => {
    const html = renderGalaxyPage();

    expect(html).toContain("Актуальные миссии");
    expect(html).toContain("Партнерский импульс");
    expect(html).not.toContain("Лента миссий");
    expect(html).not.toContain("Последние действия пилота");
    expect(html).not.toContain("Бустеры и активность");
    expect(html).not.toContain("Подтвердить событие");
  });
});
