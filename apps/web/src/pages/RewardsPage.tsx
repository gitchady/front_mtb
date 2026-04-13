import { useQuery } from "@tanstack/react-query";
import { PLANET_META, type PlanetCode } from "@mtb/contracts";
import { useState } from "react";
import { api } from "@/lib/api";
import { useGameStore } from "@/lib/game-store";
import { formatRewardType, formatStatus, GAME_CODE_LABELS } from "@/lib/labels";
import { useSessionStore } from "@/lib/session-store";

const PLANETS: PlanetCode[] = ["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"];

export function RewardsPage() {
  const { userId } = useSessionStore();
  const stardust = useGameStore((state) => state.stardust);
  const bonusStreak = useGameStore((state) => state.bonusStreak);
  const vaultCharge = useGameStore((state) => state.vaultCharge);
  const vaultCrates = useGameStore((state) => state.vaultCrates);
  const planetMastery = useGameStore((state) => state.planetMastery);
  const bonusHistory = useGameStore((state) => state.bonusHistory);
  const openBonusCrate = useGameStore((state) => state.openBonusCrate);
  const [lastCrateReward, setLastCrateReward] = useState<number | null>(null);
  const ledgerQuery = useQuery({
    queryKey: ["ledger", userId],
    queryFn: () => api.getRewardLedger(userId),
  });
  const gameSummaryQuery = useQuery({
    queryKey: ["games-summary", userId],
    queryFn: () => api.getGameSummary(userId),
  });

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">Бонусная система</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">
              Хранилище наград превращает каждый забег в звездную пыль, серию бонусов, мастерство и контейнеры.
            </h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">
              Бонусы считаются локально: базовая награда, серия, мастерство планеты, результат и множитель фокуса.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Звездная пыль</span>
              <strong>{stardust}</strong>
            </div>
            <div className="metric-chip">
              <span>Серия бонусов</span>
              <strong>{bonusStreak}x</strong>
            </div>
            <div className="metric-chip">
              <span>Заряд хранилища</span>
              <strong>{vaultCharge}%</strong>
            </div>
            <div className="metric-chip">
              <span>Готовые контейнеры</span>
              <strong>{vaultCrates}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="surface-panel">
          <p className="eyebrow">Хранилище наград</p>
          <h3 className="mt-2 text-3xl font-semibold">Заряжайте, открывайте, повторяйте</h3>
          <p className="mt-3 text-sm text-white/62">
            Награды из трех мини-игр заряжают хранилище. Полный заряд создает контейнер с мгновенным бонусом звездной пыли.
          </p>
          <div className="vault-track mt-6">
            <div className="vault-track__fill" style={{ width: `${vaultCharge}%` }} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              className="primary-button"
              disabled={vaultCrates <= 0}
              onClick={() => {
                const reward = openBonusCrate();
                setLastCrateReward(reward);
              }}
            >
              Открыть контейнер
            </button>
            <span className="text-sm text-white/58">
              {lastCrateReward ? `Последний контейнер: +${lastCrateReward} звездной пыли` : "В этой сессии контейнер еще не открывался."}
            </span>
          </div>

          <div className="mt-7 space-y-3">
            <p className="eyebrow">Мастерство планет</p>
            {PLANETS.map((planetCode) => (
              <div key={planetCode} className="list-row">
                <div>
                  <p className="text-lg font-medium">{PLANET_META[planetCode].title}</p>
                  <p className="text-sm text-white/55">{PLANET_META[planetCode].summary}</p>
                </div>
                <strong className="text-2xl">{planetMastery[planetCode]}/12</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="eyebrow">История локальных бонусов</p>
              <h3 className="text-2xl font-semibold">Каждая выплата прозрачна</h3>
            </div>
            <span className="text-sm text-white/55">получено: {bonusHistory.length}</span>
          </div>
          <div className="space-y-3">
            {bonusHistory.length ? (
              bonusHistory.map((entry) => (
                <div key={entry.id} className="list-row">
                  <div>
                    <p className="text-lg font-medium">{entry.title}</p>
                    <p className="text-sm text-white/55">
                      База {entry.baseReward} - серия +{entry.streakBonus} - мастерство +{entry.masteryBonus} - результат +{entry.performanceBonus} - фокус +{entry.focusBonus}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/36">{PLANET_META[entry.planetCode].title}</p>
                  </div>
                  <div className="text-right">
                    <strong className="text-2xl text-[var(--accent-cyan)]">+{entry.totalReward}</strong>
                    <p className="text-xs text-white/42">Хранилище +{entry.chargeGain}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">Заберите награду мини-игры или квеста, чтобы заполнить историю бонусов.</p>
            )}
          </div>
        </article>
      </section>

      <section className="surface-panel">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">Бэкенд мини-игр</p>
            <h3 className="text-2xl font-semibold">Сохраненные забеги</h3>
          </div>
          <span className="text-sm text-white/55">
            забегов: {gameSummaryQuery.data?.total_runs ?? 0} - награда: {gameSummaryQuery.data?.total_reward ?? 0}
          </span>
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          {gameSummaryQuery.data?.games.map((game) => (
            <div key={game.game_code} className="list-row">
              <div>
                <p className="text-lg font-medium">{GAME_CODE_LABELS[game.game_code]}</p>
                <p className="text-sm text-white/55">{PLANET_META[game.planet_code].title}</p>
              </div>
              <div className="text-right">
                <strong className="text-2xl">{game.best_score}</strong>
                <p className="text-xs text-white/42">забегов: {game.runs}</p>
              </div>
            </div>
          ))}
          {!gameSummaryQuery.data?.games.length ? (
            <p className="text-sm text-white/60">Сводки мини-игр появятся после первой полученной награды.</p>
          ) : null}
        </div>
      </section>

      <section className="surface-panel">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">Банковский журнал</p>
            <h3 className="text-2xl font-semibold">Синхронизированные награды</h3>
          </div>
          <span className="text-sm text-white/55">записей: {ledgerQuery.data?.length ?? 0}</span>
        </div>
        <div className="space-y-3">
          {ledgerQuery.data?.map((entry) => (
            <div key={entry.ledger_id} className="list-row">
              <div>
                <p className="text-lg font-medium">{formatRewardType(entry.reward_type)}</p>
                <p className="text-sm text-white/55">{new Date(entry.created_at).toLocaleString("ru-RU")}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm uppercase tracking-[0.25em] ${entry.status === "pending" ? "text-amber-300" : "text-emerald-300"}`}>
                  {formatStatus(entry.status)}
                </p>
                <strong className="text-2xl">{entry.amount.toFixed(2)} BYN</strong>
              </div>
            </div>
          ))}
          {!ledgerQuery.data?.length ? <p className="text-sm text-white/60">Синхронизированные награды появятся после получения живых событий.</p> : null}
        </div>
      </section>
    </div>
  );
}
