import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/pages/game-page-shared", () => ({
  GameHero: ({ title }: { title: string }) => <div data-game-hero>{title}</div>,
  gameReward: () => 10,
}));

import { SuperMobyBrosPage } from "@/pages/SuperMobyBrosPage";

function renderSuperMobyBrosPage() {
  return renderToStaticMarkup(createElement(SuperMobyBrosPage));
}

describe("SuperMobyBrosPage", () => {
  it("keeps start near the stage but moves jump below the mobile directions", () => {
    const html = renderSuperMobyBrosPage();
    const startIndex = html.indexOf("super-bros-mobile-actions md:hidden");
    const directionsIndex = html.indexOf("super-bros-mobile-directions md:hidden");
    const jumpIndex = html.indexOf("super-bros-mobile-jump md:hidden");

    expect(startIndex).toBeGreaterThan(-1);
    expect(directionsIndex).toBeGreaterThan(startIndex);
    expect(jumpIndex).toBeGreaterThan(directionsIndex);
    expect(html).toContain("Старт");
    expect(html).toContain("Прыжок");
  });

  it("replaces mobile arrow keycaps with dedicated touch directions", () => {
    const html = renderSuperMobyBrosPage();

    expect(html).toContain("super-bros-desktop-controls hidden md:flex");
    expect(html).toContain("super-bros-mobile-directions md:hidden");
    expect(html).toContain("Влево");
    expect(html).toContain("Вправо");
  });
});
