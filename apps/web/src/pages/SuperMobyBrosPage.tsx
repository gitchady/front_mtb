import { useEffect, useRef, useState } from "react";
import { GameHero, gameReward } from "@/pages/game-page-shared";

type Coin = {
  x: number;
  y: number;
  taken: boolean;
};

const START_COINS: Coin[] = [
  { x: 18, y: 236, taken: false },
  { x: 34, y: 188, taken: false },
  { x: 52, y: 238, taken: false },
  { x: 70, y: 170, taken: false },
  { x: 88, y: 236, taken: false },
];
const OBSTACLES = [
  { x: 28, y: 260 },
  { x: 58, y: 260 },
  { x: 78, y: 260 },
];

export function SuperMobyBrosPage() {
  const [player, setPlayer] = useState({ x: 6, y: 250, vy: 0, grounded: true });
  const [coins, setCoins] = useState<Coin[]>(START_COINS);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [status, setStatus] = useState("Бегите вправо, прыгайте через барьеры и собирайте световые жетоны");
  const directionRef = useRef(0);
  const playerRef = useRef(player);
  const baseReward = gameReward(score, 2.2, 7);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  function resetRun() {
    setPlayer({ x: 6, y: 250, vy: 0, grounded: true });
    setCoins(START_COINS);
    setScore(0);
    setIsRunning(false);
    setIsComplete(false);
    setRewardClaimed(false);
    setStatus("Бегите вправо, прыгайте через барьеры и собирайте световые жетоны");
  }

  function jump() {
    setPlayer((current) => (current.grounded && isRunning ? { ...current, vy: -420, grounded: false } : current));
  }

  function move(direction: number) {
    directionRef.current = direction;
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(1);
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(-1);
      if (event.code === "Space") {
        event.preventDefault();
        jump();
      }
    };
    const onKeyUp = () => move(0);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || isComplete) return;
    let frame = 0;
    let previous: number | null = null;
    const animate = (time: number) => {
      if (previous === null) previous = time;
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      let nextPlayer = playerRef.current;
      setPlayer((current) => {
        const nextX = Math.max(0, Math.min(96, current.x + directionRef.current * 34 * delta));
        let nextY = current.y + current.vy * delta;
        let nextVy = current.vy + 760 * delta;
        let grounded = false;
        if (nextY >= 250) {
          nextY = 250;
          nextVy = 0;
          grounded = true;
        }
        const hitObstacle = OBSTACLES.some((obstacle) => Math.abs(obstacle.x - nextX) < 4.2 && nextY > 232);
        if (hitObstacle) {
          setIsRunning(false);
          setIsComplete(true);
          setStatus("Забег завершен Барьер внимания остановил Moby");
        }
        if (nextX >= 94) {
          setIsRunning(false);
          setIsComplete(true);
          setScore((value) => value + 10);
          setStatus("Финиш достигнут Бонусный маршрут закрыт");
        }
        nextPlayer = { x: nextX, y: nextY, vy: nextVy, grounded };
        playerRef.current = nextPlayer;
        return nextPlayer;
      });
      setCoins((current) =>
        current.map((coin) => {
          if (!coin.taken && Math.abs(coin.x - nextPlayer.x) < 5 && Math.abs(coin.y - nextPlayer.y) < 34) {
            setScore((value) => value + 5);
            setStatus("Световой жетон собран");
            return { ...coin, taken: true };
          }
          return coin;
        }),
      );
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [isComplete, isRunning]);

  return (
    <div className="space-y-6">
      <GameHero
        code="super_moby_bros"
        kicker="Мини-игра из документа"
        title="Super Moby Bros превращает тренировку внимания в короткий платформер"
        description="Пробегите маршрут, соберите световые жетоны и перепрыгните барьеры, чтобы усилить социальный игровой слой"
        score={score}
        baseReward={baseReward}
        status={status}
        setStatus={setStatus}
        rewardClaimed={rewardClaimed}
        canClaim={isComplete && score > 0}
        onClaimed={() => setRewardClaimed(true)}
      />
      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <article className="surface-panel">
          <div className="space-y-4">
            <p className="eyebrow">Маршрут</p>
            <h3 className="text-4xl font-semibold">{isRunning ? "Забег идет" : isComplete ? "Маршрут завершен" : "Готов к старту"}</h3>
            <div className="flex flex-wrap gap-3">
              <button className="primary-button" onClick={() => setIsRunning(true)} disabled={isRunning || isComplete}>
                Старт
              </button>
              <button className="secondary-button" onClick={resetRun}>
                Сбросить
              </button>
              <button className="secondary-button" onClick={jump} disabled={!isRunning}>
                Прыжок
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="control-button h-[72px] w-[72px]" onPointerDown={() => move(-1)} onPointerLeave={() => move(0)} onPointerUp={() => move(0)}>
                ←
              </button>
              <button className="control-button h-[72px] w-[72px]" onPointerDown={() => move(1)} onPointerLeave={() => move(0)} onPointerUp={() => move(0)}>
                →
              </button>
            </div>
          </div>
        </article>
        <article className="surface-panel">
          <div className="bros-stage">
            <div className="bros-player" style={{ left: `${player.x}%`, top: player.y }}>
              M
            </div>
            {coins.map((coin, index) =>
              coin.taken ? null : <span key={index} className="bros-coin" style={{ left: `${coin.x}%`, top: coin.y }} />,
            )}
            {OBSTACLES.map((obstacle) => (
              <span key={obstacle.x} className="bros-obstacle" style={{ left: `${obstacle.x}%`, top: obstacle.y }} />
            ))}
            <span className="bros-finish" />
          </div>
        </article>
      </section>
    </div>
  );
}
