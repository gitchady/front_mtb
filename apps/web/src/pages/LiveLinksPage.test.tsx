import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "profile") {
      return {
        data: {
          active_boosters: [],
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    if (queryKey[0] === "ledger") {
      return {
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

vi.mock("@/lib/api", () => ({
  api: {
    getProfile: vi.fn(),
    getRewardLedger: vi.fn(),
  },
}));

vi.mock("@/lib/session-store", () => ({
  useSessionStore: () => ({
    userId: "u_demo",
    displayName: "Пилот Моби",
  }),
}));

import { LiveLinksPage } from "@/pages/LiveLinksPage";

function renderLiveLinksPage() {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/app/live-links"] }, createElement(LiveLinksPage)));
}

describe("LiveLinksPage", () => {
  it("renders the separate live-links screen with concise hero copy", () => {
    const html = renderLiveLinksPage();

    expect(html).toContain("Живые связи");
    expect(html).toContain("Бустеры и активность.");
    expect(html).not.toContain("Бустеры и журнал активности");
  });
});
