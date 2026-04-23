import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "friends") {
      return {
        data: {
          accepted: [],
          pending_incoming: [],
          pending_outgoing: [],
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    if (queryKey[0] === "friend-activity") {
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
  useMutation: () => ({
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    variables: undefined,
    mutate: vi.fn(),
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

import { FriendsPage } from "@/pages/FriendsPage";

function renderFriendsPage() {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/app/friends"] }, createElement(FriendsPage)));
}

describe("FriendsPage", () => {
  it("does not render the hero shortcut buttons for AI and refresh", () => {
    const html = renderFriendsPage();

    expect(html).not.toContain("Открыть AI");
    expect(html).not.toContain("Обновить");
  });
});
