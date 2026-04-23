import { PLANET_META, type GameCode } from "@mtb/contracts";
import { Link } from "react-router-dom";
import { useGameStore } from "@/lib/game-store";
import { MINI_GAMES } from "@/lib/mini-games";
import { isPlanetUnlocked, PLANET_UNLOCK_REQUIREMENTS } from "@/lib/planet-unlocks";

export function GamesPage() {
  const totalRuns = useGameStore((state) => state.totalRuns);
  const stardust = useGameStore((state) => state.stardust);
  const bestSnakeScore = useGameStore((state) => state.bestSnakeScore);
  const bestShieldScore = useGameStore((state) => state.bestShieldScore);
  const bestSocialScore = useGameStore((state) => state.bestSocialScore);
  const bestGameScores = useGameStore((state) => state.bestGameScores);
  const unlockedPlanets = useGameStore((state) => state.unlockedPlanets);
  const legacyBestScores: Partial<Record<GameCode, number>> = {
    halva_snake: bestSnakeScore,
    credit_shield_reactor: bestShieldScore,
    social_ring_signal: bestSocialScore,
  };
  const getBestGameScore = (gameCode: GameCode) => bestGameScores[gameCode] ?? legacyBestScores[gameCode] ?? 0;

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">Игры</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">
              Все мини-игры собраны в одной вкладке.
            </h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">
              Запускайте аркады, головоломки и платформеры из каталога, а результаты будут попадать в общие награды и историю забегов.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="metric-chip metric-chip--compact">
              <span>Игр в каталоге</span>
              <strong>{MINI_GAMES.length}</strong>
            </div>
            <div className="metric-chip metric-chip--compact">
              <span>Всего забегов</span>
              <strong>{totalRuns}</strong>
            </div>
            <div className="metric-chip metric-chip--compact">
              <span>Звездная пыль</span>
              <strong>{stardust}</strong>
            </div>
            <div className="metric-chip metric-chip--compact">
              <span>Планет</span>
              <strong>3</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {MINI_GAMES.map((game) => {
          const locked = !isPlanetUnlocked(unlockedPlanets, game.planetCode);
          const cardContent = (
            <>
              <div>
                <p className="eyebrow">{PLANET_META[game.planetCode].title}</p>
                <h3>{game.title}</h3>
                <p>{locked ? PLANET_UNLOCK_REQUIREMENTS[game.planetCode] : game.detail}</p>
              </div>
              <div className="game-catalog-card__footer">
                <span>{locked ? "Статус" : "Рекорд"}</span>
                <strong>{locked ? "Закрыта" : getBestGameScore(game.code)}</strong>
              </div>
            </>
          );

          return locked ? (
            <article key={game.code} className="game-catalog-card game-catalog-card--locked" aria-disabled="true">
              {cardContent}
            </article>
          ) : (
            <Link key={game.code} className="game-catalog-card" to={game.route}>
              {cardContent}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
