import { PLANET_META, type GameCode, type PlanetCode } from "@mtb/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fe2Api } from "@/lib/fe2-api";
import { useGameStore } from "@/lib/game-store";
import { MINI_GAME_BY_CODE } from "@/lib/mini-games";

const PLANET_CODES: PlanetCode[] = ["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"];
const GAME_CODES: GameCode[] = [
  "halva_snake",
  "credit_shield_reactor",
  "social_ring_signal",
  "moby_bird",
  "cashback_tetris",
  "moby_jump",
  "fintech_match3",
  "super_moby_bros",
];

function isPlanetCode(value: string | undefined): value is PlanetCode {
  return PLANET_CODES.includes(value as PlanetCode);
}

function isGameCode(value: string | undefined): value is GameCode {
  return GAME_CODES.includes(value as GameCode);
}

function scoreStep(gameCode: GameCode) {
  if (gameCode === "credit_shield_reactor") {
    return 3;
  }
  if (gameCode === "social_ring_signal") {
    return 4;
  }
  return 5;
}

function GamePlaySurface({
  gameCode,
  score,
  disabled,
  onScore,
  onFinish,
}: {
  gameCode: GameCode;
  score: number;
  disabled: boolean;
  onScore: () => void;
  onFinish: () => void;
}) {
  if (gameCode === "credit_shield_reactor") {
    return (
      <div className="fe2-game-surface fe2-game-surface--reactor">
        <div className="fe2-reactor-track">
          <span style={{ left: `${Math.min(92, 8 + score * 2)}%` }} />
        </div>
        <button className="primary-button" type="button" disabled={disabled} onClick={onScore}>
          Зафиксировать импульс
        </button>
        <button className="secondary-button" type="button" disabled={disabled || score === 0} onClick={onFinish}>
          Завершить раунд
        </button>
      </div>
    );
  }

  if (gameCode === "social_ring_signal") {
    return (
      <div className="fe2-game-surface fe2-game-surface--signal">
        {["Нова", "Пульс", "Мята", "Глоу"].map((label, index) => (
          <button key={label} className="fe2-signal-pad" type="button" disabled={disabled} onClick={onScore}>
            <span>{label}</span>
            <strong>{score > index * 4 ? "Активен" : "Ждет"}</strong>
          </button>
        ))}
        <button className="primary-button fe2-game-surface__wide" type="button" disabled={disabled || score === 0} onClick={onFinish}>
          Завершить раунд
        </button>
      </div>
    );
  }

  return (
    <div className="fe2-game-surface fe2-game-surface--snake">
      {Array.from({ length: 24 }, (_, index) => (
        <button
          key={index}
          className={index < Math.min(24, Math.ceil(score / 5) + 2) ? "fe2-snake-cell fe2-snake-cell--active" : "fe2-snake-cell"}
          type="button"
          disabled={disabled}
          onClick={onScore}
          aria-label="Собрать звезду"
        />
      ))}
      <button className="primary-button fe2-game-surface__wide" type="button" disabled={disabled || score === 0} onClick={onFinish}>
        Завершить раунд
      </button>
    </div>
  );
}

export function GameScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const recordMiniGameRun = useGameStore((state) => state.recordMiniGameRun);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [starAwarded, setStarAwarded] = useState(false);
  const [status, setStatus] = useState("Раунд готов к запуску");
  const planetId = isPlanetCode(params.planetId) ? params.planetId : undefined;
  const gameCode = isGameCode(params.gameCode) ? params.gameCode : undefined;
  const game = gameCode ? MINI_GAME_BY_CODE[gameCode] : undefined;
  const validRoute = Boolean(planetId && gameCode && game && game.planetCode === planetId);

  const progressQuery = useQuery({
    queryKey: ["fe2-planet-progress", planetId],
    queryFn: () => fe2Api.getPlanetProgress(planetId!),
    enabled: Boolean(planetId),
  });
  const progress = progressQuery.data;
  const remainingAttempts = progress?.game.remaining_attempts_today ?? 0;
  const canPlay = validRoute && remainingAttempts > 0 && !isComplete;
  const baseReward = useMemo(() => Math.max(6, Math.floor(score * 1.4)), [score]);

  const runMutation = useMutation({
    mutationFn: () =>
      fe2Api.submitGameRun({
        gameCode: gameCode!,
        planetId: planetId!,
        score,
        currentProgress: progress,
      }),
    onSuccess: (result) => {
      recordMiniGameRun({
        gameCode: gameCode!,
        score,
        baseReward,
        title: `Получена малая звезда: ${game!.title}`,
        detail: `${PLANET_META[planetId!].title}: счет ${score}`,
      });
      setStarAwarded(result.small_star_awarded);
      setStatus(
        result.small_star_awarded
          ? `Малая звезда начислена Осталось попыток: ${result.remaining_attempts_today}`
          : `Раунд сохранен Осталось попыток: ${result.remaining_attempts_today}`,
      );
      queryClient.setQueryData(["fe2-planet-progress", planetId], result.planet_progress);
      queryClient.invalidateQueries({ queryKey: ["fe2-planets-list"] });
      queryClient.invalidateQueries({ queryKey: ["fe2-leaderboard", planetId] });
    },
    onError: () => {
      setStatus("Не удалось сохранить раунд Попробуйте отправить результат еще раз");
    },
  });

  if (!validRoute || !planetId || !gameCode || !game) {
    return (
      <section className="surface-panel">
        <p className="eyebrow">Игра</p>
        <h2 className="mt-3 text-3xl font-semibold">Связка игры и планеты не найдена</h2>
        <Link className="primary-button mt-5 inline-flex" to="/app/planets">
          Вернуться к карте
        </Link>
      </section>
    );
  }

  const activePlanetId = planetId;
  const activeGameCode = gameCode;
  const activeGame = game;

  function addScore() {
    setScore((value) => value + scoreStep(activeGameCode));
    setStatus("Счет растет Завершите раунд, когда результат готов");
  }

  function finishRound() {
    setIsComplete(true);
    setStatus("Раунд завершен Отправьте результат в прогресс планеты");
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">{PLANET_META[activePlanetId].title}</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">{activeGame.title}</h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">{activeGame.detail}</p>
            <p className="text-sm text-white/62">{status}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Счет</span>
              <strong>{score}</strong>
            </div>
            <div className="metric-chip">
              <span>Попытки</span>
              <strong>{progressQuery.isLoading ? "Загрузка" : remainingAttempts}</strong>
            </div>
            <div className="metric-chip">
              <span>Награда</span>
              <strong>{baseReward}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={`surface-panel fe2-game-panel ${starAwarded ? "fe2-game-panel--awarded" : ""}`}>
        {remainingAttempts <= 0 ? (
          <div className="list-row">
            <div>
              <p className="text-lg font-medium">Лимит попыток исчерпан</p>
              <p className="text-sm text-white/55">Раунд можно будет запустить после обновления дневного лимита</p>
            </div>
            <Link className="secondary-button" to={`/app/planets/${planetId}`}>
              Назад к планете
            </Link>
          </div>
        ) : (
          <>
            <GamePlaySurface gameCode={activeGameCode} score={score} disabled={!canPlay} onScore={addScore} onFinish={finishRound} />
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="primary-button"
                type="button"
                disabled={!isComplete || score === 0 || runMutation.isPending || starAwarded}
                onClick={() => runMutation.mutate()}
              >
                {runMutation.isPending ? "Отправляем" : starAwarded ? "Малая звезда начислена" : "Отправить результат"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate(`/app/planets/${activePlanetId}`, { state: { smallStarAwarded: starAwarded } })}
              >
                Назад к планете
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
