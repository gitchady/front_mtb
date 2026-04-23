import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/pages/game-page-shared", () => ({
  GameHero: ({ title }: { title: string }) => <div data-game-hero>{title}</div>,
  gameReward: () => 6,
}));

import { MobyJumpPage } from "@/pages/MobyJumpPage";

function renderMobyJumpPage() {
  return renderToStaticMarkup(createElement(MobyJumpPage));
}

describe("MobyJumpPage", () => {
  it("moves mobile direction buttons below the jump stage", () => {
    const html = renderMobyJumpPage();
    const stageIndex = html.indexOf("jump-stage");
    const mobileControlsIndex = html.indexOf("moby-jump-mobile-controls md:hidden");

    expect(stageIndex).toBeGreaterThan(-1);
    expect(mobileControlsIndex).toBeGreaterThan(stageIndex);
    expect(html).toContain("moby-jump-desktop-controls hidden md:flex");
    expect(html).toContain("Влево");
    expect(html).toContain("Вправо");
  });
});
