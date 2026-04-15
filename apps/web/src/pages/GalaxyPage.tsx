import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PLANET_META, type PlanetCode, type PlanetProgress } from "@mtb/contracts";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { GalaxyStage } from "@/components/GalaxyStage";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { PlanetInspector } from "@/components/PlanetInspector";
import { api } from "@/lib/api";
import { PLANET_ACTIONS, PLANET_STRUCTURES } from "@/lib/game-config";
import { useGameStore } from "@/lib/game-store";
import { formatCategory, formatRewardType, formatStatus, SEGMENT_LABELS } from "@/lib/labels";
import { isPlanetUnlocked, PLANET_UNLOCK_REQUIREMENTS } from "@/lib/planet-unlocks";
import { useSessionStore } from "@/lib/session-store";

const EMPTY_PLANETS: PlanetProgress[] = [
  { planet_code: "ORBIT_COMMERCE", xp: 0, level: 1 },
  { planet_code: "CREDIT_SHIELD", xp: 0, level: 1 },
  { planet_code: "SOCIAL_RING", xp: 0, level: 1 },
];

const SPEND_EVENT_KIND: Record<PlanetCode, "partner" | "credit" | "referral"> = {
  ORBIT_COMMERCE: "partner",
  CREDIT_SHIELD: "credit",
  SOCIAL_RING: "referral",
};

function formatWindowEnd(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function GalaxyPage() {
  const { userId, syncProfile } = useSessionStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<string | null>(null);
  const onboardingComplete = useGameStore((state) => state.onboardingComplete);
  const playerAlias = useGameStore((state) => state.playerAlias);
  const playerSegment = useGameStore((state) => state.playerSegment);
  const selectedPlanet = useGameStore((state) => state.selectedPlanet);
  const stardust = useGameStore((state) => state.stardust);
  const structures = useGameStore((state) => state.structures);
  const actionLog = useGameStore((state) => state.actionLog);
  const totalRuns = useGameStore((state) => state.totalRuns);
  const bestShieldScore = useGameStore((state) => state.bestShieldScore);
  const bestSocialScore = useGameStore((state) => state.bestSocialScore);
  const bestSnakeScore = useGameStore((state) => state.bestSnakeScore);
  const bonusStreak = useGameStore((state) => state.bonusStreak);
  const vaultCharge = useGameStore((state) => state.vaultCharge);
  const vaultCrates = useGameStore((state) => state.vaultCrates);
  const planetMastery = useGameStore((state) => state.planetMastery);
  const unlockedPlanets = useGameStore((state) => state.unlockedPlanets);
  const completeOnboarding = useGameStore((state) => state.completeOnboarding);
  const selectPlanet = useGameStore((state) => state.selectPlanet);
  const buildStructure = useGameStore((state) => state.buildStructure);
  const claimPlanetAction = useGameStore((state) => state.claimPlanetAction);

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => api.getProfile(userId),
  });
  const ledgerQuery = useQuery({
    queryKey: ["ledger", userId],
    queryFn: () => api.getRewardLedger(userId),
  });
  const deferredProfile = useDeferredValue(profileQuery.data);
  const planets = deferredProfile?.planets ?? EMPTY_PLANETS;
  const liveBoosters = deferredProfile?.active_boosters ?? [];
  const liveLedger = ledgerQuery.data ?? [];
  const selectedPlanetState = useMemo(
    () => planets.find((planet) => planet.planet_code === selectedPlanet) ?? planets[0],
    [planets, selectedPlanet],
  );

  const playerActionMutation = useMutation({
    mutationFn: ({ planetCode, actionId }: { planetCode: PlanetCode; actionId: string }) => {
      const action = PLANET_ACTIONS[planetCode].find((item) => item.id === actionId);
      if (!action) {
        throw new Error("Неизвестное действие");
      }
      return api.ingest(api.buildEvent(userId, action.eventKind)).then((result) => ({ result, action, planetCode }));
    },
    onSuccess: ({ result, action, planetCode }) => {
      const outcome = claimPlanetAction({
        title: action.title,
        detail: action.detail,
        baseReward: action.stardustReward,
        planetCode,
      });
      setFeedback(
        `${action.title}: +${outcome.totalReward} звездной пыли${
          outcome.cratesEarned ? ` и ${outcome.cratesEarned} контейнер хранилища` : ""
        }. Событие ${result.event_id} обработано живым ядром наград.`,
      );
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["profile", userId] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["quests", userId] });
        queryClient.invalidateQueries({ queryKey: ["ledger", userId] });
        queryClient.invalidateQueries({ queryKey: ["admin-kpi"] });
        queryClient.invalidateQueries({ queryKey: ["admin-risk"] });
      });
    },
    onError: () => {
      setFeedback("Команду не удалось синхронизировать. Попробуйте еще раз, локальный прогресс сохранен.");
    },
  });

  const planetSpendMutation = useMutation({
    mutationFn: ({ planetCode, amount }: { planetCode: PlanetCode; amount: number }) =>
      api.ingest(api.buildEvent(userId, SPEND_EVENT_KIND[planetCode])).then((result) => ({ result, planetCode, amount })),
    onSuccess: ({ result, planetCode, amount }) => {
      const reward = 4 + Math.min(8, Math.floor(amount / 50));
      const outcome = claimPlanetAction({
        title: "Статистика трат записана",
        detail: `Внесено ${amount.toFixed(2)} BYN в сектор ${PLANET_META[planetCode].title}.`,
        baseReward: reward,
        planetCode,
      });
      setFeedback(
        `Статистика ${PLANET_META[planetCode].title}: +${outcome.totalReward} звездной пыли. Событие ${result.event_id} обработано.`,
      );
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["profile", userId] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["quests", userId] });
        queryClient.invalidateQueries({ queryKey: ["ledger", userId] });
        queryClient.invalidateQueries({ queryKey: ["admin-kpi"] });
        queryClient.invalidateQueries({ queryKey: ["admin-risk"] });
      });
    },
    onError: () => {
      setFeedback("Статистику не удалось синхронизировать. Попробуйте еще раз.");
    },
  });

  const builtStructures = structures[selectedPlanet];
  const selectedPlanetLocked = !isPlanetUnlocked(unlockedPlanets, selectedPlanet);
  const showLockedFeedback = (planetCode: PlanetCode) => {
    setFeedback(`${PLANET_META[planetCode].title} закрыта. ${PLANET_UNLOCK_REQUIREMENTS[planetCode]}`);
  };

  return (
    <div className="space-y-8">
      <section className="hero-panel">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-end">
          <div className="space-y-6">
            <p className="eyebrow">Игровой клиент</p>
            <h2 className="max-w-4xl text-5xl font-semibold leading-[0.92] md:text-7xl">
              Галактика стала командной панелью: выбирайте планеты, запускайте миссии и прокачивайте живой банковский прогресс.
            </h2>
            <p className="max-w-2xl text-base text-white/72 md:text-lg">
              Орбита покупок, Кредитный щит и Социальное кольцо имеют свои миссии, постройки, живые события и мини-игры.
            </p>
            <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-white/4 px-4 py-3 text-sm text-white/72">
              <span className="font-semibold text-white">{playerAlias}</span>
              <span className="uppercase tracking-[0.24em] text-white/38">{SEGMENT_LABELS[playerSegment]}</span>
              <span>Фокус: {PLANET_META[selectedPlanet].title}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="primary-button" to="/app/games">
                Открыть вкладку Игры
              </Link>
              <Link className="secondary-button" to="/app/quests">
                Перейти к квестам
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Уровень орбиты</span>
              <strong>{deferredProfile?.orbit_level ?? "…"}</strong>
            </div>
            <div className="metric-chip">
              <span>Звездная пыль</span>
              <strong>{stardust}</strong>
            </div>
            <div className="metric-chip">
              <span>Рекорд змейки</span>
              <strong>{bestSnakeScore}</strong>
            </div>
            <div className="metric-chip">
              <span>Рекорд щита</span>
              <strong>{bestShieldScore}</strong>
            </div>
            <div className="metric-chip">
              <span>Рекорд кольца</span>
              <strong>{bestSocialScore}</strong>
            </div>
            <div className="metric-chip">
              <span>Всего забегов</span>
              <strong>{totalRuns}</strong>
            </div>
            <div className="metric-chip">
              <span>Серия бонусов</span>
              <strong>{bonusStreak}x</strong>
            </div>
            <div className="metric-chip">
              <span>Хранилище</span>
              <strong>{vaultCharge}%</strong>
            </div>
            <div className="metric-chip">
              <span>Контейнеры</span>
              <strong>{vaultCrates}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="galaxy-map-panel">
        <GalaxyStage
          planets={planets}
          selectedPlanet={selectedPlanet}
          planetMastery={planetMastery}
          unlockedPlanets={unlockedPlanets}
          quests={deferredProfile?.quests ?? []}
          spendPending={planetSpendMutation.isPending}
          onSelect={selectPlanet}
          onLockedSelect={showLockedFeedback}
          onRunSpend={(planetCode, amount) =>
            isPlanetUnlocked(unlockedPlanets, planetCode)
              ? planetSpendMutation.mutate({ planetCode, amount })
              : showLockedFeedback(planetCode)
          }
          onOpenQuest={(questId) => navigate(`/app/quests?quest=${questId}`)}
          onOpenGame={(route) => navigate(route)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="surface-panel">
          <p className="eyebrow">Мастерство планет</p>
          <div className="mt-3 space-y-3">
            {(["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"] as PlanetCode[]).map((planetCode) => (
              <div key={planetCode} className="list-row">
                <div>
                  <p className="text-lg font-medium">{PLANET_META[planetCode].title}</p>
                  <p className="text-sm text-white/55">
                    {isPlanetUnlocked(unlockedPlanets, planetCode)
                      ? `${planetMastery[planetCode]}/12 мастерства`
                      : PLANET_UNLOCK_REQUIREMENTS[planetCode]}
                  </p>
                </div>
                <strong className="text-2xl">
                  {isPlanetUnlocked(unlockedPlanets, planetCode) ? `построено: ${structures[planetCode].length}` : "закрыта"}
                </strong>
              </div>
            ))}
          </div>
        </article>
        <PlanetInspector
          planet={selectedPlanetState}
          selectedPlanet={selectedPlanet}
          stardust={stardust}
          builtStructures={builtStructures}
          isLocked={selectedPlanetLocked}
          unlockRequirement={PLANET_UNLOCK_REQUIREMENTS[selectedPlanet]}
          isPending={playerActionMutation.isPending}
          onRunAction={(planetCode, actionId) =>
            isPlanetUnlocked(unlockedPlanets, planetCode)
              ? playerActionMutation.mutate({ planetCode, actionId })
              : showLockedFeedback(planetCode)
          }
          onBuild={(planetCode, structureId) => {
            if (!isPlanetUnlocked(unlockedPlanets, planetCode)) {
              showLockedFeedback(planetCode);
              return;
            }
            const structure = PLANET_STRUCTURES[planetCode].find((item) => item.id === structureId);
            if (!structure) {
              return;
            }
            const success = buildStructure(planetCode, structureId, structure.cost, structure.title);
            setFeedback(
              success
                ? `${structure.title} построен на планете ${PLANET_META[planetCode].title}.`
                : `Недостаточно звездной пыли или постройка уже есть на планете ${PLANET_META[planetCode].title}.`,
            );
          }}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="surface-panel">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Лента миссий</p>
              <h3 className="text-2xl font-semibold">Последние действия пилота</h3>
            </div>
            {feedback ? <span className="text-sm text-white/55">{feedback}</span> : null}
          </div>
          <div className="space-y-3">
            {actionLog.length ? (
              actionLog.slice(0, 6).map((item) => (
                <motion.div key={item.id} layout className="list-row">
                  <div>
                    <p className="text-lg font-medium">{item.title}</p>
                    <p className="text-sm text-white/55">{item.detail}</p>
                  </div>
                  <div className="text-right">
                    {item.planetCode ? (
                      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{PLANET_META[item.planetCode].title}</p>
                    ) : null}
                    <strong className={item.reward >= 0 ? "text-2xl text-[var(--accent-cyan)]" : "text-2xl text-white/85"}>
                      {item.reward >= 0 ? `+${item.reward}` : item.reward}
                    </strong>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-white/60">Запустите первое действие на сцене, чтобы заполнить ленту миссий.</p>
            )}
          </div>
        </article>

        <article className="surface-panel">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="eyebrow">Живые связи</p>
              <h3 className="text-2xl font-semibold">Бустеры и журнал наград</h3>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="space-y-3">
                <p className="eyebrow">Активные окна бустеров</p>
                {liveBoosters.slice(0, 3).map((booster) => (
                  <div key={booster.booster_id} className="list-row">
                    <div>
                      <p className="text-lg font-medium">{formatCategory(booster.category)}</p>
                      <p className="text-sm text-white/55">До {formatWindowEnd(booster.end_at)}</p>
                    </div>
                    <strong className="text-2xl text-[var(--accent-cyan)]">+{booster.boost_rate}%</strong>
                  </div>
                ))}
                {!liveBoosters.length ? (
                  <p className="text-sm text-white/60">Проведите партнерскую операцию, чтобы открыть первое окно бустера.</p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="space-y-3">
                <p className="eyebrow">Последние награды</p>
                {liveLedger.slice(0, 4).map((entry) => (
                  <div key={entry.ledger_id} className="list-row">
                    <div>
                      <p className="text-lg font-medium">{formatRewardType(entry.reward_type)}</p>
                      <p className="text-sm text-white/55">{new Date(entry.created_at).toLocaleString("ru-RU")}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs uppercase tracking-[0.18em] ${entry.status === "pending" ? "text-amber-300" : "text-emerald-300"}`}>
                        {formatStatus(entry.status)}
                      </p>
                      <strong className="text-2xl">{entry.amount.toFixed(2)} BYN</strong>
                    </div>
                  </div>
                ))}
                {!liveLedger.length ? <p className="text-sm text-white/60">Журнал обновится после первого события с наградой.</p> : null}
              </div>
            </div>
          </div>
        </article>
      </section>

      {!onboardingComplete ? (
        <OnboardingOverlay
          onComplete={(payload) => {
            completeOnboarding(payload);
            syncProfile({
              displayName: payload.playerAlias,
              segment: payload.playerSegment,
            });
            setFeedback(`${payload.playerAlias} стартовал с планеты ${PLANET_META[payload.starterPlanet].title}.`);
            startTransition(() => {
              queryClient.invalidateQueries({ queryKey: ["profile", userId] });
              queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
            });
          }}
        />
      ) : null}
    </div>
  );
}
