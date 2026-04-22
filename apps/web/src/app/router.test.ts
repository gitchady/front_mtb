import { describe, expect, it } from "vitest";
import { appLinks, router } from "@/app/router";

function collectPaths(routes: { path?: string; children?: { path?: string; children?: unknown[] }[] }[]): string[] {
  return routes.flatMap((route) => [
    ...(route.path ? [route.path] : []),
    ...collectPaths((route.children ?? []) as { path?: string; children?: { path?: string; children?: unknown[] }[] }[]),
  ]);
}

describe("router", () => {
  it("registers the social-ai-qr routes", () => {
    const paths = collectPaths(router.routes);

    expect(paths).toContain("/app/friends");
    expect(paths).toContain("/app/qr");
    expect(paths).toContain("/app/ai");
  });

  it("exposes top-level navigation links for the new modules", () => {
    const labels = appLinks.map((link) => link.label);

    expect(labels).toContain("Друзья");
    expect(labels).toContain("QR");
    expect(labels).toContain("AI");
  });
});
