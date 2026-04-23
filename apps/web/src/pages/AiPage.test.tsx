import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[]; select?: (value: unknown) => unknown }) => {
    if (queryKey[0] === "assistant-context") {
      return {
        data: {
          user_id: "u_demo",
          recommended_focus: "Соберите следующий шаг из друзей и контекста",
          quick_prompts: ["С чего начать?"],
          summary_chips: ["AI-навигация"],
          friend_count: 0,
          pending_invites_count: 0,
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      };
    }

    return {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };
  },
  useMutation: () => ({
    isPending: false,
    error: null,
    variables: undefined,
    mutate: vi.fn(),
  }),
}));

import { AiPage } from "@/pages/AiPage";

function renderAiPage() {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/app/ai"] }, createElement(AiPage)));
}

describe("AiPage", () => {
  it("does not render the hero QR shortcut button", () => {
    const html = renderAiPage();

    expect(html).not.toContain("Проверить QR");
  });

  it("does not render the hero metric cards", () => {
    const html = renderAiPage();

    expect(html).not.toContain("Быстрые подсказки");
    expect(html).not.toContain("Локальная история");
    expect(html).not.toContain("Друзья в контексте");
    expect(html).not.toContain("Новые инвайты");
  });

  it("does not render the AI summary context panel", () => {
    const html = renderAiPage();

    expect(html).not.toContain("Контекст");
    expect(html).not.toContain("Сводка для AI");
    expect(html).not.toContain("Рекомендуемый фокус");
    expect(html).not.toContain("Социальный слой");
    expect(html).not.toContain("Ожидают внимания");
  });

  it("does not render the CTA panel with friends and QR links", () => {
    const html = renderAiPage();

    expect(html).not.toContain("CTA");
    expect(html).not.toContain("Подключить внешние сигналы");
    expect(html).not.toContain("QR-модуль");
  });

  it("does not render the AI hero summary chips or focus line", () => {
    const html = renderAiPage();

    expect(html).not.toContain("AI-навигация");
    expect(html).not.toContain("Соберите следующий шаг из друзей и контекста");
  });

  it("does not render the quick prompts ready counter", () => {
    const html = renderAiPage();

    expect(html).not.toContain("1 ready");
    expect(html).not.toContain("READY");
  });

  it("does not render the profile badge in the dialogue header", () => {
    const html = renderAiPage();

    expect(html).not.toContain("Student profile");
    expect(html).not.toContain("PROFILE");
  });

  it("does not render the removed friends shortcut and helper cards", () => {
    const html = renderAiPage();

    expect(html).not.toContain("Открыть друзей");
    expect(html).not.toContain("Активный ответ");
    expect(html).not.toContain("Что сейчас держать в фокусе");
    expect(html).not.toContain("Ответ возвращает текст");
    expect(html).not.toContain("Спросите ассистента о следующем действии");
  });
});
