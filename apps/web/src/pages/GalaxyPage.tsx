import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PLANET_META, type PlanetCode, type PlanetProgress } from "@mtb/contracts";
import { Link, useNavigate } from "react-router-dom";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { GalaxyStage } from "@/components/GalaxyStage";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { PlanetInspector } from "@/components/PlanetInspector";
import { api } from "@/lib/api";
import { PLANET_ACTIONS, PLANET_STRUCTURES } from "@/lib/game-config";
import { useGameStore } from "@/lib/game-store";
import { formatStatus, SEGMENT_LABELS } from "@/lib/labels";
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

function getMissionHeadline(status: string) {
  if (status === "completed") {
    return "Готова к выдаче";
  }
  if (status === "claimed") {
    return "Завершена";
  }
  return "В работе";
}

export function GalaxyPage() {
  const { userId, syncProfile } = useSessionStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState(PLANET_ACTIONS.ORBIT_COMMERCE[0]?.id);
  const onboardingComplete = useGameStore((state) => state.onboardingComplete);
  const playerAlias = useGameStore((state) => state.playerAlias);
  const playerSegment = useGameStore((state) => state.playerSegment);
  const selectedPlanet = useGameStore((state) => state.selectedPlanet);
  const stardust = useGameStore((state) => state.stardust);
  const structures = useGameStore((state) => state.structures);
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
  const deferredProfile = useDeferredValue(profileQuery.data);
  const planets = deferredProfile?.planets ?? EMPTY_PLANETS;
  const selectedPlanetState = useMemo(
    () => planets.find((planet) => planet.planet_code === selectedPlanet) ?? planets[0],
    [planets, selectedPlanet],
  );
  const selectedPlanetQuests = useMemo(
    () =>
      (deferredProfile?.quests ?? [])
        .filter((quest) => quest.planet_code === selectedPlanet)
        .sort((left, right) => {
          const statusWeight = (status: string) => {
            if (status === "completed") {
              return 0;
            }
            if (status === "active") {
              return 1;
            }
            if (status === "claimed") {
              return 2;
            }
            return 3;
          };

          return statusWeight(left.status) - statusWeight(right.status);
        }),
    [deferredProfile?.quests, selectedPlanet],
  );

  const planetSpendMutation = useMutation({
    mutationFn: ({ planetCode, amount }: { planetCode: PlanetCode; amount: number }) =>
      api.ingest(api.buildEvent(userId, SPEND_EVENT_KIND[planetCode])).then((result) => ({ result, planetCode, amount })),
    onSuccess: ({ result, planetCode, amount }) => {
      const reward = 4 + Math.min(8, Math.floor(amount / 50));
      const outcome = claimPlanetAction({
        title: "Сигнал записан",
        detail: `Зафиксирован импульс ${Math.round(amount)} в секторе ${PLANET_META[planetCode].title}`,
        baseReward: reward,
        planetCode,
      });
      setFeedback(
        `Активность ${PLANET_META[planetCode].title}: +${outcome.totalReward} звездной пыли Событие ${result.event_id} синхронизировано`,
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
      setFeedback("Статистику не удалось синхронизировать Попробуйте еще раз");
    },
  });

  const builtStructures = structures[selectedPlanet];
  const selectedPlanetLocked = !isPlanetUnlocked(unlockedPlanets, selectedPlanet);

  useEffect(() => {
    setSelectedActionId(PLANET_ACTIONS[selectedPlanet][0]?.id);
  }, [selectedPlanet]);

  const showLockedFeedback = (planetCode: PlanetCode) => {
    setFeedback(`${PLANET_META[planetCode].title} закрыта ${PLANET_UNLOCK_REQUIREMENTS[planetCode]}`);
  };

  return (
    <div className="space-y-8">
      <section className="hero-panel">
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div className="space-y-4 md:space-y-6">
            <p className="eyebrow">Игровой клиент</p>
            <h2 className="max-w-3xl text-3xl font-semibold leading-[0.96] sm:text-4xl md:text-6xl">
              Выбирайте планеты, запускайте миссии и прокачивайте игровой прогресс.
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link className="primary-button primary-button--hero" to="/app/games">
                Перейти к играм
              </Link>
              <Link className="secondary-button" to="/app/quests">
                Перейти к квестам
              </Link>
            </div>
            <div className="inline-flex flex-wrap items-center gap-3 rounded-[28px] border border-white/10 bg-white/4 px-4 py-3 text-sm text-white/72">
              <span className="font-semibold text-white">{playerAlias}</span>
              <span className="uppercase tracking-[0.24em] text-white/38">{SEGMENT_LABELS[playerSegment]}</span>
              <span>Фокус: {PLANET_META[selectedPlanet].title}</span>
            </div>
            <p className="max-w-2xl text-sm text-white/72 md:text-lg">
              Орбита покупок, Кредитный щит и Социальное кольцо имеют свои миссии, постройки, живые события и мини-игры.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-3 xl:grid-cols-2">
            <div className="metric-chip">
              <span>Уровень орбиты</span>
              <strong>{deferredProfile?.orbit_level ?? "Загрузка"}</strong>
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
        <article className="order-2 surface-panel xl:order-1">
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
                <strong className="status-pill">
                  {isPlanetUnlocked(unlockedPlanets, planetCode) ? `Построено: ${structures[planetCode].length}` : "Закрыта"}
                </strong>
              </div>
            ))}
          </div>

          <div className="mission-confirm mission-confirm--left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Актуальные миссии</p>
                <h4 className="mt-2 text-xl font-semibold">
                  {selectedPlanetLocked ? "Сначала откройте планету" : `Миссии ${PLANET_META[selectedPlanet].title}`}
                </h4>
              </div>
              {!selectedPlanetLocked ? (
                <Link className="secondary-button" to="/app/quests">
                  Квесты
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-white/58">
              {selectedPlanetLocked
                ? PLANET_UNLOCK_REQUIREMENTS[selectedPlanet]
                : "Эти миссии берутся из списка квестов и обновляются вместе с прогрессом планеты."}
            </p>
            <div className="mt-4 space-y-3">
              {selectedPlanetLocked ? null : selectedPlanetQuests.length ? (
                selectedPlanetQuests.slice(0, 3).map((quest) => {
                  const progressPercent = quest.threshold > 0 ? Math.min(100, (quest.current_value / quest.threshold) * 100) : 0;

                  return (
                    <div key={quest.quest_id} className="list-row">
                      <div className="min-w-0">
                        <p className="text-lg font-medium">{quest.title}</p>
                        <p className="mt-1 text-sm text-white/55">{quest.description}</p>
                        <div className="mt-3 h-2 rounded-full bg-white/8">
                          <div
                            className="h-2 rounded-full bg-[linear-gradient(90deg,#ff4da0,#526bff)]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/42">
                          {quest.current_value}/{quest.threshold} • {formatStatus(quest.status)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/42">{getMissionHeadline(quest.status)}</p>
                        <strong className="status-pill">{quest.reward_value}</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="list-row list-row--empty">
                  <div>
                    <p className="text-lg font-medium">Миссии скоро появятся</p>
                    <p className="text-sm text-white/55">Для этой планеты пока нет активных квестов.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        <div className="order-1 xl:order-2">
          <PlanetInspector
            planet={selectedPlanetState}
            selectedPlanet={selectedPlanet}
            stardust={stardust}
            builtStructures={builtStructures}
            isLocked={selectedPlanetLocked}
            unlockRequirement={PLANET_UNLOCK_REQUIREMENTS[selectedPlanet]}
            selectedActionId={selectedActionId}
            onSelectAction={setSelectedActionId}
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
                  ? `${structure.title} построен на планете ${PLANET_META[planetCode].title}`
                  : `Недостаточно звездной пыли или постройка уже есть на планете ${PLANET_META[planetCode].title}`,
              );
            }}
          />
        </div>
      </section>

      {!onboardingComplete ? (
        <OnboardingOverlay
          onComplete={(payload) => {
            completeOnboarding(payload);
            syncProfile({
              displayName: payload.playerAlias,
              segment: payload.playerSegment,
            });
            setFeedback(`${payload.playerAlias} стартовал с планеты ${PLANET_META[payload.starterPlanet].title}`);
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
