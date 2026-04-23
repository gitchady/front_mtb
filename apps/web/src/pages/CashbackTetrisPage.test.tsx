import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/pages/game-page-shared", () => ({
  GameHero: ({ title }: { title: string }) => <div data-game-hero>{title}</div>,
  gameReward: () => 15,
}));

import { CashbackTetrisPage } from "@/pages/CashbackTetrisPage";

function renderCashbackTetrisPage() {
  return renderToStaticMarkup(createElement(CashbackTetrisPage));
}

describe("CashbackTetrisPage", () => {
  it("keeps arrow controls but moves the mobile layout below the tetris field", () => {
    const html = renderCashbackTetrisPage();
    const stageIndex = html.indexOf("tetris-grid");
    const mobileControlsIndex = html.indexOf("tetris-mobile-controls md:hidden");

    expect(html).toContain("tetris-desktop-controls hidden md:grid");
    expect(html).toContain("tetris-mobile-controls md:hidden");
    expect(stageIndex).toBeGreaterThan(-1);
    expect(mobileControlsIndex).toBeGreaterThan(stageIndex);
    expect(html).toContain("←");
    expect(html).toContain("→");
    expect(html).toContain("↓");
    expect(html).toContain("↻");
    expect(html).not.toContain("Влево");
    expect(html).not.toContain("Вправо");
    expect(html).not.toContain("Вниз");
    expect(html).not.toContain("Поворот");
  });

  it("keeps a mobile hint that refers to arrows instead of text buttons", () => {
    const html = renderCashbackTetrisPage();
    const hintIndex = html.indexOf("tetris-mobile-hint text-sm text-white/58 md:hidden");
    const mobileControlsIndex = html.indexOf("tetris-mobile-controls md:hidden");

    expect(html).toContain("tetris-mobile-hint text-sm text-white/58 md:hidden");
    expect(html).toContain("Собирайте линии кнопками под полем");
    expect(hintIndex).toBeGreaterThan(mobileControlsIndex);
  });
});
