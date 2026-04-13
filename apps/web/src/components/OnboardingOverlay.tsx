import { useState } from "react";
import type { PlanetCode } from "@mtb/contracts";
import { PLANET_META } from "@mtb/contracts";

const SEGMENTS = [
  {
    id: "student",
    title: "Студент",
    detail: "Быстрый рост, простые циклы и кэшбэк за повседневные партнерские покупки.",
  },
  {
    id: "first-jobber",
    title: "Первый доход",
    detail: "Сбалансированный прогресс с акцентом на рост лимита и контроль бюджета.",
  },
  {
    id: "freelancer",
    title: "Фрилансер",
    detail: "Гибкий прогресс с упором на автономность, запас прочности и социальные связи.",
  },
] as const;

export function OnboardingOverlay({
  onComplete,
}: {
  onComplete: (payload: {
    playerAlias: string;
    playerSegment: "student" | "first-jobber" | "freelancer";
    starterPlanet: PlanetCode;
  }) => void;
}) {
  const [playerAlias, setPlayerAlias] = useState("Пилот Моби");
  const [playerSegment, setPlayerSegment] = useState<"student" | "first-jobber" | "freelancer">("student");
  const [starterPlanet, setStarterPlanet] = useState<PlanetCode>("ORBIT_COMMERCE");

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-panel">
        <div className="space-y-3">
          <p className="eyebrow">Старт в Галактике</p>
          <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
            Соберите профиль пилота перед первым витком.
          </h2>
          <p className="max-w-2xl text-base text-white/68">
            Выберите роль, стартовую планету и первый бонус прогресса. Онбординг работает на фронтенде,
            поэтому игровой сценарий можно быстро проверять без ожидания серверной логики профиля.
          </p>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">Позывной пилота</span>
              <input
                className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-white outline-none"
                name="pilotAlias"
                autoComplete="nickname"
                value={playerAlias}
                maxLength={24}
                onChange={(event) => setPlayerAlias(event.target.value || "Пилот Моби")}
              />
            </label>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-white/45">Роль</p>
              {SEGMENTS.map((segment) => (
                <button
                  key={segment.id}
                  className={`action-card ${playerSegment === segment.id ? "action-card-built" : ""}`}
                  onClick={() => setPlayerSegment(segment.id)}
                >
                  <div>
                    <p className="text-lg font-medium">{segment.title}</p>
                    <p className="mt-2 text-sm text-white/58">{segment.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-white/45">Стартовая планета</p>
            {(["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"] as PlanetCode[]).map((planetCode) => (
              <button
                key={planetCode}
                className={`action-card ${starterPlanet === planetCode ? "action-card-built" : ""}`}
                onClick={() => setStarterPlanet(planetCode)}
              >
                <div>
                  <p className="text-lg font-medium">{PLANET_META[planetCode].title}</p>
                  <p className="mt-2 text-sm text-white/58">{PLANET_META[planetCode].summary}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/42">Стартовый бонус</span>
                  <strong className="block text-xl text-[var(--accent-cyan)]">+10</strong>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/55">
            Бонус первой сессии: 10 единиц звездной пыли и выбранная линия фокуса для главной сцены.
          </p>
          <button
            className="primary-button"
            onClick={() =>
              onComplete({
                playerAlias,
                playerSegment,
                starterPlanet,
              })
            }
          >
            Войти в Галактику
          </button>
        </div>
      </div>
    </div>
  );
}
