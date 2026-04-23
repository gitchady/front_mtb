import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { PlanetInspector } from "@/components/PlanetInspector";
import { PLANET_ACTIONS } from "@/lib/game-config";

function renderOverviewCopy() {
  return renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(OnboardingOverlay, {
        onComplete: vi.fn(),
      }),
      createElement(PlanetInspector, {
        selectedPlanet: "ORBIT_COMMERCE",
        stardust: 10,
        builtStructures: [],
        isLocked: false,
        unlockRequirement: "",
        selectedActionId: undefined,
        onSelectAction: vi.fn(),
        onBuild: vi.fn(),
      }),
    ),
  );
}

describe("overview copy", () => {
  it("does not mention missions or quests in onboarding and planet controls", () => {
    const html = renderOverviewCopy().toLowerCase();

    expect(html).not.toContain("мисси");
    expect(html).not.toContain("квест");
  });

  it("uses concrete bank actions for the planet controls", () => {
    const html = renderOverviewCopy();

    expect(html).toContain("Оплатить покупку у партнера");
    expect(html).toContain("Оплатить обычную покупку картой");
    expect(html).not.toContain("Запустить партнерский сигнал");
    expect(html).not.toContain("Запустить свободный сигнал");
  });

  it("defines bank-action copy for all planets", () => {
    expect(PLANET_ACTIONS.ORBIT_COMMERCE.map((action) => action.title)).toEqual([
      "Оплатить покупку у партнера",
      "Оплатить обычную покупку картой",
    ]);
    expect(PLANET_ACTIONS.CREDIT_SHIELD.map((action) => action.title)).toEqual([
      "Внести платеж вовремя",
      "Проверить кредитный лимит",
    ]);
    expect(PLANET_ACTIONS.SOCIAL_RING.map((action) => action.title)).toEqual([
      "Пригласить друга",
      "Отправить перевод по номеру",
    ]);
  });
});
