import { useCallback, useEffect, useRef, useState } from "react";
import { GameHero, gameReward } from "@/pages/game-page-shared";

const STAGE_HEIGHT = 360;
const BIRD_X = 86;

type BirdObstacle = {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
};

function makeObstacles(): BirdObstacle[] {
  return [0, 1, 2].map((index) => ({
    id: index,
    x: 360 + index * 210,
    gapY: 80 + Math.floor(Math.random() * 150),
    scored: false,
  }));
}

export function MobyBirdPage() {
  const [birdY, setBirdY] = useState(150);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<BirdObstacle[]>(makeObstacles);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [status, setStatus] = useState("Нажмите старт, затем удерживайте высоту через Space или игровую зону.");
  const yRef = useRef(birdY);
  const velocityRef = useRef(velocity);
  const obstaclesRef = useRef(obstacles);
  const baseReward = gameReward(score, 4, 6);

  useEffect(() => {
    yRef.current = birdY;
  }, [birdY]);

  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  function resetRun() {
    setBirdY(150);
    setVelocity(0);
    setObstacles(makeObstacles());
    setScore(0);
    setIsRunning(false);
    setIsComplete(false);
    setRewardClaimed(false);
    setStatus("Нажмите старт, затем удерживайте высоту через Space или игровую зону.");
  }

  function launchRun() {
    resetRun();
    setIsRunning(true);
    setStatus("Полет активен. Держите Moby между графиками расходов.");
  }

  function lift() {
    if (!isRunning || isComplete) {
      return;
    }
    setVelocity(-330);
  }

  const finishRun = useCallback((message: string) => {
    setIsRunning(false);
    setIsComplete(true);
    setStatus(message);
  }, []);

  useEffect(() => {
    if (!isRunning || isComplete) {
      return;
    }

    let frame = 0;
    let previous: number | null = null;
    const animate = (time: number) => {
      if (previous === null) {
        previous = time;
      }
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      const nextVelocity = velocityRef.current + 740 * delta;
      const nextY = yRef.current + nextVelocity * delta;
      setVelocity(nextVelocity);
      setBirdY(nextY);

      if (nextY < 0 || nextY > STAGE_HEIGHT - 34) {
        finishRun("Полет завершен. График расходов поймал Moby за пределами коридора.");
        return;
      }

      setObstacles((current) => {
        const next = current.map((obstacle) => {
          let nextX = obstacle.x - 155 * delta;
          let gapY = obstacle.gapY;
          let scored = obstacle.scored;
          if (nextX < -80) {
            nextX += 630;
            gapY = 70 + Math.floor(Math.random() * 170);
            scored = false;
          }
          if (!scored && nextX + 58 < BIRD_X) {
            scored = true;
            setScore((value) => value + 1);
            setStatus("Зона экономии пройдена. Бонусный маршрут стал длиннее.");
          }
          return { ...obstacle, x: nextX, gapY, scored };
        });
        obstaclesRef.current = next;
        return next;
      });

      const hit = obstaclesRef.current.some((obstacle) => {
        const overlapsX = obstacle.x < BIRD_X + 34 && obstacle.x + 58 > BIRD_X;
        const inGap = nextY > obstacle.gapY && nextY + 34 < obstacle.gapY + 118;
        return overlapsX && !inGap;
      });
      if (hit) {
        finishRun("Полет завершен. График расходов перекрыл траекторию.");
        return;
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [finishRun, isComplete, isRunning]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (!isRunning && !isComplete) {
          launchRun();
        } else {
          lift();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isComplete, isRunning]);

  return (
    <div className="space-y-6">
      <GameHero
        code="moby_bird"
        kicker="Мини-игра из документа"
        title="Moby Bird ведет маскота через графики расходов и зоны экономии."
        description="Удерживайте высоту, проходите чистые коридоры и конвертируйте пролет в ресурс для Кредитного щита."
        score={score}
        baseReward={baseReward}
        status={status}
        setStatus={setStatus}
        rewardClaimed={rewardClaimed}
        canClaim={isComplete && score > 0}
        onClaimed={() => setRewardClaimed(true)}
      />
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="surface-panel">
          <div className="space-y-4">
            <p className="eyebrow">Полет</p>
            <h3 className="text-4xl font-semibold">{isRunning ? "Коридор активен" : isComplete ? "Полет завершен" : "Готов к старту"}</h3>
            <div className="flex flex-wrap gap-3">
              <button className="primary-button" onClick={launchRun} disabled={isRunning}>
                {isComplete ? "Запустить снова" : "Старт"}
              </button>
              <button className="secondary-button" onClick={resetRun}>
                Сбросить
              </button>
            </div>
            <p className="text-sm text-white/58">Space запускает полет и поддерживает высоту. Очки начисляются за каждый пройденный коридор.</p>
          </div>
        </article>
        <article className="surface-panel">
          <div
            className="bird-stage"
            onClick={lift}
            onKeyDown={(event) => {
              if (event.code === "Space" || event.key === "Enter") {
                event.preventDefault();
                lift();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="bird-avatar" style={{ transform: `translate(${BIRD_X}px, ${birdY}px)` }}>
              M
            </div>
            {obstacles.map((obstacle) => (
              <div key={obstacle.id} className="bird-obstacle" style={{ left: obstacle.x }}>
                <span style={{ height: obstacle.gapY }} />
                <span style={{ top: obstacle.gapY + 118, bottom: 0 }} />
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
