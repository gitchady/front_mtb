import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("features", () => {
  it("enables Halva Snake by default", async () => {
    const module = await import("./features");
    expect(module.features.halvaSnakeEnabled).toBe(true);
  });

  it("disables Halva Snake when the flag is false", async () => {
    vi.stubEnv("VITE_FEATURE_HALVA_SNAKE", "false");
    const module = await import("./features");
    expect(module.features.halvaSnakeEnabled).toBe(false);
  });
});
