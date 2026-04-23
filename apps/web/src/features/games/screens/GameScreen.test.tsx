import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      game: {
        remaining_attempts_today: 3,
      },
    },
    isLoading: false,
  }),
  useMutation: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }),
}));

vi.mock("@/lib/game-store", () => ({
  useGameStore: (selector: (state: { recordMiniGameRun: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({
      recordMiniGameRun: vi.fn(),
    }),
}));

import { GameScreen } from "@/features/games/screens/GameScreen";

function renderGameScreen() {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ["/app/planets/ORBIT_COMMERCE/game/halva_snake"] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/app/planets/:planetId/game/:gameCode",
          element: createElement(GameScreen),
        }),
      ),
    ),
  );
}

describe("GameScreen", () => {
  it("does not render the status metric card in the hero panel", () => {
    const html = renderGameScreen();

    expect(html).not.toContain("<span>Статус</span>");
    expect(html).not.toContain("<strong>раунд</strong>");
  });
});
