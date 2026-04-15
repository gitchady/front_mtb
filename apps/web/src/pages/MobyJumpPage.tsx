import { useEffect, useRef, useState } from "react";
import { GameHero, gameReward } from "@/pages/game-page-shared";

type Platform = {
  id: number;
  x: number;
  y: number;
  boost?: boolean;
};

function makePlatforms(): Platform[] {
  return Array.from({ length: 8 }, (_, index) => ({
    id: index,
    x: 12 + Math.floor(Math.random() * 64),
    y: 320 - index * 48,
    boost: index % 3 === 1,
  }));
}

export function MobyJumpPage() {
  const [player, setPlayer] = useState({ x: 48, y: 280, vy: -260 });
  const [platforms, setPlatforms] = useState<Platform[]>(makePlatforms);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [status, setStatus] = useState("Прыгайте по целям, ловите платформы Халвы и не падайте ниже экрана.");
  const directionRef = useRef(0);
  const platformsRef = useRef(platforms);
  const baseReward = gameReward(score, 1.1, 6);

  useEffect(() => {
    platformsRef.current = platforms;
  }, [platforms]);

  function resetRun() {
    setPlayer({ x: 48, y: 280, vy: -260 });
    setPlatforms(makePlatforms());
    setScore(0);
    setIsRunning(false);
    setIsComplete(false);
    setRewardClaimed(false);
    setStatus("Прыгайте по целям, ловите платформы Халвы и не падайте ниже экрана.");
  }

  function move(direction: number) {
    directionRef.current = direction;
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(-1);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(1);
    };
    const onKeyUp = () => move(0);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isRunning || isComplete) return;
    let frame = 0;
    let previous: number | null = null;
    const animate = (time: number) => {
      if (previous === null) previous = time;
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      setPlayer((current) => {
        let next = {
          x: (current.x + directionRef.current * 52 * delta + 100) % 100,
          y: current.y + current.vy * delta,
          vy: current.vy + 620 * delta,
        };
        const landing = platformsRef.current.find(
          (platform) =>
            current.vy > 0 &&
            current.y + 34 <= platform.y &&
            next.y + 34 >= platform.y &&
            next.x + 8 >= platform.x &&
            next.x <= platform.x + 24,
        );
        if (landing) {
          next = { ...next, y: landing.y - 34, vy: landing.boost ? -470 : -355 };
          setScore((value) => value + (landing.boost ? 8 : 4));
          setStatus(landing.boost ? "Платформа Халвы дала мощный импульс вверх." : "Финансовая цель закреплена.");
        }
        if (next.y < 150) {
          const lift = 150 - next.y;
          next.y = 150;
          setPlatforms((items) =>
            items
              .map((platform) => ({ ...platform, y: platform.y + lift }))
              .map((platform) =>
                platform.y > 360
                  ? {
                      id: platform.id,
                      x: 8 + Math.floor(Math.random() * 70),
                      y: 0,
                      boost: Math.random() > 0.66,
                    }
                  : platform,
              ),
          );
          setScore((value) => value + Math.floor(lift / 8));
        }
        if (next.y > 370) {
          setIsRunning(false);
          setIsComplete(true);
          setStatus("Прыжок завершен. Заберите награду за высоту и цели.");
        }
        return next;
      });
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [isComplete, isRunning]);

  return (
    <div className="space-y-6">
      <GameHero
        code="moby_jump"
        kicker="Мини-игра из документа"
        title="Moby Jump поднимает пользователя по платформам финансовых целей."
        description="Двигайтесь влево и вправо, ловите обычные цели и усилители Халвы, чтобы поднять Кредитный щит выше."
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
            <p className="eyebrow">Прыжок</p>
            <h3 className="text-4xl font-semibold">{isRunning ? "Высота растет" : isComplete ? "Прыжок завершен" : "Готов к прыжку"}</h3>
            <div className="flex flex-wrap gap-3">
              <button className="primary-button" onClick={() => setIsRunning(true)} disabled={isRunning || isComplete}>
                Старт
              </button>
              <button className="secondary-button" onClick={resetRun}>
                Сбросить
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
          <div className="jump-stage">
            <div className="jump-player" style={{ left: `${player.x}%`, top: player.y }}>
              M
            </div>
            {platforms.map((platform) => (
              <span
                key={`${platform.id}-${platform.y}`}
                className={`jump-platform ${platform.boost ? "jump-platform--boost" : ""}`}
                style={{ left: `${platform.x}%`, top: platform.y }}
              />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
