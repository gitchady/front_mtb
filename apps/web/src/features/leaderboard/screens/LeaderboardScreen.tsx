import { PLANET_META, type PlanetCode } from "@mtb/contracts";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fe2Api } from "@/lib/fe2-api";
import { useSessionStore } from "@/lib/session-store";

const PLANET_CODES: PlanetCode[] = ["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"];

function isPlanetCode(value: string | null): value is PlanetCode {
  return PLANET_CODES.includes(value as PlanetCode);
}

function formatPeriodEnd(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LeaderboardScreen() {
  const { userId } = useSessionStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prizesOpen, setPrizesOpen] = useState(false);
  const planetParam = searchParams.get("planet");
  const selectedPlanet: PlanetCode = isPlanetCode(planetParam) ? planetParam : "ORBIT_COMMERCE";
  const planetsQuery = useQuery({
    queryKey: ["fe2-planets-list"],
    queryFn: fe2Api.getPlanetsList,
  });
  const leaderboardQuery = useQuery({
    queryKey: ["fe2-leaderboard", selectedPlanet, userId],
    queryFn: () => fe2Api.getPlanetLeaderboard(selectedPlanet, userId),
  });
  const topTen = useMemo(() => leaderboardQuery.data?.entries.slice(0, 10) ?? [], [leaderboardQuery.data]);
  const topFifty = leaderboardQuery.data?.entries ?? [];

  function selectPlanet(planetId: PlanetCode) {
    setSearchParams({ planet: planetId });
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">Лидерборд</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">Топ планеты за неделю</h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">
              Недельный период собирает лучших пилотов планеты и открывает призовые позиции.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Планета</span>
              <strong>{PLANET_META[selectedPlanet].title}</strong>
            </div>
            <div className="metric-chip">
              <span>Мой ранг</span>
              <strong>{leaderboardQuery.data?.current_user_rank ?? "..."}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel">
        <div className="leaderboard-toolbar">
          <div className="leaderboard-tabs" role="tablist" aria-label="Планеты">
            {(planetsQuery.data ?? []).map((planet) => (
              <button
                key={planet.id}
                className={planet.id === selectedPlanet ? "leaderboard-tab leaderboard-tab--active" : "leaderboard-tab"}
                type="button"
                role="tab"
                aria-selected={planet.id === selectedPlanet}
                onClick={() => selectPlanet(planet.id)}
              >
                {planet.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="secondary-button" type="button" onClick={() => leaderboardQuery.refetch()}>
              Обновить
            </button>
            <button className="primary-button" type="button" onClick={() => setPrizesOpen(true)}>
              Призы периода
            </button>
          </div>
        </div>

        <div className="leaderboard-podium" aria-label="Топ-10 планеты">
          {topTen.slice(0, 3).map((entry) => (
            <article key={entry.user_id} className={entry.is_current_user ? "leaderboard-podium__card is-current" : "leaderboard-podium__card"}>
              <span>#{entry.rank}</span>
              <strong>{entry.name}</strong>
              <em>{entry.period_small_stars} звезд</em>
            </article>
          ))}
        </div>

        <div className="leaderboard-table" aria-label="Топ-50 планеты">
          {topFifty.map((entry) => (
            <div key={entry.user_id} className={entry.is_current_user ? "leaderboard-row leaderboard-row--current" : "leaderboard-row"}>
              <span className="leaderboard-row__rank">#{entry.rank}</span>
              <span className="leaderboard-row__avatar" aria-hidden="true">
                {entry.avatar}
              </span>
              <span className="leaderboard-row__name">{entry.name}</span>
              <strong>{entry.period_small_stars}</strong>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-white/50">
          Период завершается: {leaderboardQuery.data ? formatPeriodEnd(leaderboardQuery.data.period_ends_at) : "..."}.
        </p>
      </section>

      {prizesOpen ? (
        <div className="fe2-modal" role="dialog" aria-modal="true" aria-labelledby="period-prizes-title">
          <div className="fe2-modal__panel">
            <p className="eyebrow">Призы периода</p>
            <h3 id="period-prizes-title">Награды топ-10</h3>
            <div className="space-y-3">
              <div className="list-row">
                <span>1 место</span>
                <strong>Промокод 5% + статус недели</strong>
              </div>
              <div className="list-row">
                <span>2-3 место</span>
                <strong>Промокод 3%</strong>
              </div>
              <div className="list-row">
                <span>4-10 место</span>
                <strong>Промокод 1%</strong>
              </div>
            </div>
            <button className="primary-button mt-5" type="button" onClick={() => setPrizesOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
