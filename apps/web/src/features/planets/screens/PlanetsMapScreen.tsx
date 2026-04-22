import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fe2Api } from "@/lib/fe2-api";

export function PlanetsMapScreen() {
  const planetsQuery = useQuery({
    queryKey: ["fe2-planets-list"],
    queryFn: fe2Api.getPlanetsList,
  });
  const planets = planetsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">Планетарная карта</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">
              Выберите планету и откройте ее созвездие, кэшбэк и недельную гонку.
            </h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">
              Орбиты держат прогресс по большим и малым звездам, а каждая планета ведет к своей игре.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Планет</span>
              <strong>{planetsQuery.isLoading ? "..." : planets.length}</strong>
            </div>
            <div className="metric-chip">
              <span>Секторов</span>
              <strong>10</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="planet-map-grid" aria-label="Карта планет">
        {planets.map((planet) => (
          <Link key={planet.id} className="planet-map-card" to={`/app/planets/${planet.id}`}>
            <div>
              <p className="eyebrow">Планета</p>
              <h3>{planet.name}</h3>
            </div>
            <div className="planet-map-card__orbit" aria-hidden="true">
              <span style={{ width: `${planet.progress_percent}%` }} />
            </div>
            <div className="planet-map-card__footer">
              <span>Кэшбэк</span>
              <strong>{planet.cashback_percent.toFixed(1)}%</strong>
            </div>
            <p className="planet-map-card__progress">{planet.progress_percent}% текущего созвездия</p>
          </Link>
        ))}
        {Array.from({ length: Math.max(0, 10 - planets.length) }, (_, index) => (
          <article key={`empty-${index}`} className="planet-map-card planet-map-card--empty" aria-hidden="true">
            <p className="eyebrow">Слот</p>
            <h3>Ожидает планету</h3>
            <div className="planet-map-card__orbit">
              <span style={{ width: "0%" }} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
