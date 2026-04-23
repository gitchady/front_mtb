import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes, type RouteObject } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ShellLayout, appLinks, appRoutes, isShellLinkActive, mobileBottomNavItems, mobileOverflowLinks } from "@/app/router";

function collectPaths(routes: RouteObject[]): string[] {
  return routes.flatMap((route) => [
    ...(route.path ? [route.path] : []),
    ...collectPaths(route.children ?? []),
  ]);
}

function renderShell(pathname: string) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [pathname] },
      createElement(
        Routes,
        null,
        createElement(
          Route,
          { path: "/", element: createElement(ShellLayout) },
          createElement(Route, { path: "*", element: createElement("div", null, "Маршрут") }),
        ),
      ),
    ),
  );
}

describe("router", () => {
  it("registers the contacts hub and keeps legacy friends and qr paths", () => {
    const paths = collectPaths(appRoutes);

    expect(paths).toContain("/app/live-links");
    expect(paths).toContain("/app/contacts");
    expect(paths).toContain("/app/friends");
    expect(paths).toContain("/app/qr");
    expect(paths).toContain("/app/ai");
  });

  it("exposes contacts as the main social entry in top navigation", () => {
    const labels = appLinks.map((link) => link.label);

    expect(labels).toContain("Контакты");
    expect(labels).not.toContain("Друзья");
    expect(labels).not.toContain("QR");
    expect(labels).toContain("AI");
  });

  it("keeps quests reachable through overflow instead of the top navigation rail", () => {
    const html = renderShell("/app/quests");

    expect(html).toContain('aria-label="Основная навигация"');
    expect(html).toContain(">Еще<");
    expect(html).not.toContain('href="/app/quests" aria-current="page" class="nav-link nav-link-active"');
  });

  it("exposes a compact mobile bottom nav with overflow destinations", () => {
    expect(mobileBottomNavItems.map((item) => item.label)).toEqual(["Обзор", "Контакты", "AI", "Еще"]);
    expect(mobileOverflowLinks.map((item) => item.label)).toEqual([
      "Планеты",
      "Игры",
      "Лидерборд",
      "Квесты",
      "Награды",
      "Живые связи",
      "Социальное кольцо",
    ]);
  });

  it("treats direct friends and qr routes as part of contacts", () => {
    const contactsLink = appLinks.find((link) => link.to === "/app/contacts");

    expect(contactsLink).toBeDefined();
    expect(isShellLinkActive("/app/friends", contactsLink!)).toBe(true);
    expect(isShellLinkActive("/app/qr", contactsLink!)).toBe(true);
  });

  it("treats nested game and planet routes as active shell destinations", () => {
    const gamesLink = appLinks.find((link) => link.to === "/app/games");
    const planetsLink = appLinks.find((link) => link.to === "/app/planets");

    expect(gamesLink).toBeDefined();
    expect(planetsLink).toBeDefined();
    expect(isShellLinkActive("/app/game/moby-bird", gamesLink!)).toBe(true);
    expect(isShellLinkActive("/app/planets/mars", planetsLink!)).toBe(true);
  });

  it("renders the mobile shell header, bottom nav, and overflow panel", () => {
    const html = renderShell("/app/planets/mars");

    expect(html).toContain("mobile-shell-header");
    expect(html).toContain('aria-label="Мобильная навигация"');
    expect(html).toContain("mobile-overflow-panel");
    expect(html).toContain('aria-label="Закрыть разделы Еще"');
    expect(html).toContain("Планеты");
    expect(html).toContain("Живые связи");
    expect(html).toContain("Социальное кольцо");
    expect(html).toContain('data-mobile-overflow-active="true"');
  });
});
