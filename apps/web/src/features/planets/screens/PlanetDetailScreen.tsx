import { PLANET_META, type PlanetCode } from "@mtb/contracts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ConstellationCanvas } from "@/features/planets/components/ConstellationCanvas";
import { fe2Api } from "@/lib/fe2-api";

const PLANET_CODES: PlanetCode[] = ["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"];

function isPlanetCode(value: string | undefined): value is PlanetCode {
  return PLANET_CODES.includes(value as PlanetCode);
}

export function PlanetDetailScreen() {
  const params = useParams();
  const location = useLocation();
  const [shareStatus, setShareStatus] = useState("");
  const [burst, setBurst] = useState(Boolean((location.state as { smallStarAwarded?: boolean } | null)?.smallStarAwarded));
  const planetId = isPlanetCode(params.planetId) ? params.planetId : undefined;

  const progressQuery = useQuery({
    queryKey: ["fe2-planet-progress", planetId],
    queryFn: () => fe2Api.getPlanetProgress(planetId!),
    enabled: Boolean(planetId),
  });
  const progress = progressQuery.data;
  const bigStarsLeftLabel = useMemo(() => {
    if (!progress) {
      return "...";
    }
    return `${progress.big_stars_until_increase} из ${progress.constellation.big_stars_total}`;
  }, [progress]);

  useEffect(() => {
    if (!burst) {
      return;
    }
    const timer = window.setTimeout(() => setBurst(false), 1600);
    return () => window.clearTimeout(timer);
  }, [burst]);

  async function sharePlanet() {
    if (!progress) {
      return;
    }
    const text = `${progress.name}: ${progress.cashback_percent.toFixed(1)}% усиления, созвездие ${progress.constellation.name}.`;
    if (navigator.share) {
      await navigator.share({ title: progress.name, text, url: window.location.href });
      setShareStatus("Карточка отправлена в системный шеринг.");
      return;
    }
    await navigator.clipboard.writeText(`${text} ${window.location.href}`);
    setShareStatus("Ссылка на карточку скопирована.");
  }

  if (!planetId) {
    return (
      <section className="surface-panel">
        <p className="eyebrow">Планета</p>
        <h2 className="mt-3 text-3xl font-semibold">Планета не найдена</h2>
        <Link className="primary-button mt-5 inline-flex" to="/app/planets">
          Вернуться к карте
        </Link>
      </section>
    );
  }

  if (progressQuery.isLoading || !progress) {
    return (
      <section className="surface-panel">
        <p className="eyebrow">Планета</p>
        <h2 className="mt-3 text-3xl font-semibold">Загружаем прогресс...</h2>
      </section>
    );
  }

  const canPlay = progress.game.remaining_attempts_today > 0;

  return (
    <div className="space-y-6">
      <section className="planet-detail-hero">
        <div className="planet-detail-hero__copy">
          <p className="eyebrow">{PLANET_META[planetId].summary}</p>
          <h2>{progress.name}</h2>
          <p>{progress.constellation.name}</p>
          <div className="flex flex-wrap gap-3">
            <button className="secondary-button" type="button" onClick={sharePlanet}>
              Поделиться
            </button>
            <Link className="secondary-button" to={`/app/leaderboard?planet=${planetId}`}>
              Топ-10 планеты
            </Link>
          </div>
          {shareStatus ? <p className="planet-detail-hero__status">{shareStatus}</p> : null}
        </div>
        <div className="planet-detail-hero__cashback">
          <span>Текущее усиление</span>
          <strong>{progress.cashback_percent.toFixed(1)}%</strong>
          {progress.max_cashback_reached ? <em>Максимум достигнут</em> : <em>Созвездие усиливает ритм</em>}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Созвездие</p>
              <h3 className="mt-3 text-3xl font-semibold">{progress.constellation.name}</h3>
            </div>
            <div className="planet-detail-meter">
              <span>До +0.5%</span>
              <strong>{bigStarsLeftLabel}</strong>
            </div>
          </div>
          <ConstellationCanvas constellation={progress.constellation} burst={burst} />
        </article>

        <aside className="surface-panel space-y-4">
          <div className="metric-chip">
            <span>Малые звезды периода</span>
            <strong>{progress.period_small_stars}</strong>
          </div>
          <div className="metric-chip">
            <span>Попытки сегодня</span>
            <strong>
              {progress.game.remaining_attempts_today}/{progress.game.daily_attempts_limit}
            </strong>
          </div>
          <div className="metric-chip">
            <span>Игра планеты</span>
            <strong>{progress.game.name}</strong>
          </div>
          <Link
            className={`primary-button planet-detail-play ${canPlay ? "" : "planet-detail-play--disabled"}`}
            aria-disabled={!canPlay}
            to={canPlay ? `/app/planets/${planetId}/game/${progress.game.code}` : "#"}
          >
            {canPlay ? "Играть" : "Лимит попыток исчерпан"}
          </Link>
          {!canPlay ? <p className="text-sm text-white/58">Новые попытки появятся завтра.</p> : null}
        </aside>
      </section>
    </div>
  );
}
