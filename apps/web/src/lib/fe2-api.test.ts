import { describe, expect, it } from "vitest";
import type { PlanetCode } from "@mtb/contracts";
import {
  buildMockPlanetProgress,
  buildMockPlanetsList,
  buildMockPlanetLeaderboard,
  createMockGameRunResult,
} from "@/lib/fe2-api";

describe("fe2-api mock adapter", () => {
  it("builds the planets map with cashback and progress for every configured planet", () => {
    const planets = buildMockPlanetsList();

    expect(planets.map((planet) => planet.id)).toEqual(["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"]);
    expect(planets.every((planet) => planet.name.length > 0)).toBe(true);
    expect(planets.every((planet) => planet.progress_percent >= 0 && planet.progress_percent <= 100)).toBe(true);
  });

  it("builds a detailed planet progress object with constellation and game attempts", () => {
    const progress = buildMockPlanetProgress("CREDIT_SHIELD");

    expect(progress.id).toBe("CREDIT_SHIELD");
    expect(progress.constellation.big_stars.length).toBe(progress.constellation.big_stars_total);
    expect(progress.constellation.small_stars.length).toBe(progress.constellation.small_stars_per_segment);
    expect(progress.game.remaining_attempts_today).toBe(
      progress.game.daily_attempts_limit - progress.game.daily_attempts_used,
    );
  });

  it("creates a game result that awards a star and decrements remaining attempts", () => {
    const before = buildMockPlanetProgress("SOCIAL_RING");
    const result = createMockGameRunResult("social_ring_signal", "SOCIAL_RING", 42, before);

    expect(result.small_star_awarded).toBe(true);
    expect(result.remaining_attempts_today).toBe(before.game.remaining_attempts_today - 1);
    expect(result.planet_progress.period_small_stars).toBe(before.period_small_stars + 1);
  });

  it("sorts planet leaderboard entries by weekly stars and marks the current user", () => {
    const leaderboard = buildMockPlanetLeaderboard("ORBIT_COMMERCE" as PlanetCode, "u_demo");

    expect(leaderboard.entries).toHaveLength(50);
    expect(leaderboard.entries[0]!.period_small_stars).toBeGreaterThanOrEqual(
      leaderboard.entries[1]!.period_small_stars,
    );
    expect(leaderboard.entries.some((entry) => entry.is_current_user)).toBe(true);
  });
});
