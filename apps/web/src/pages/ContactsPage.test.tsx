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
        isPending: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    if (queryKey[0] === "my-qr") {
      return {
        data: {
          valid: true,
          resolved_type: "friend_invite",
          title: "Добавить контакт",
          description: "Покажите этот QR, чтобы вас добавили в контакты.",
          cta_kind: "add_friend",
          cta_target: "u_demo",
          raw_payload: "mtb://qr?action=add_friend&target=u_demo",
        },
        isLoading: false,
        isPending: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    return {
      data: undefined,
      isLoading: false,
      isPending: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useMutation: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    variables: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

import { ContactsPage } from "@/pages/ContactsPage";

function renderContactsPage() {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/app/contacts"] }, createElement(ContactsPage)));
}

describe("ContactsPage", () => {
  it("combines QR and friends on one screen", () => {
    const html = renderContactsPage();

    expect(html).toContain("Контакты");
    expect(html).toContain("QR и друзья");
    expect(html).toContain("Мой QR");
    expect(html).toContain("Сканер QR");
    expect(html).toContain("По user_id");
    expect(html).toContain("Мои друзья");
  });

  it("renders the camera scanner controls and preview container", () => {
    const html = renderContactsPage();

    expect(html).toContain("Старт сканера");
    expect(html).toContain('aria-label="Превью камеры для сканирования QR"');
    expect(html).toContain("Камера выключена");
  });

  it("renders the own QR payload as a visible QR image without raw payload text", () => {
    const html = renderContactsPage();

    expect(html).toContain('aria-label="QR для добавления контакта"');
    expect(html).toContain("<svg");
    expect(html).not.toContain("mtb://qr?action=add_friend");
  });
});
