import type { GameCode } from "@mtb/contracts";
import { useMiniGameClaim } from "@/lib/use-mini-game-claim";

export type Metric = {
  label: string;
  value: string | number;
};

export function gameReward(score: number, multiplier: number, minimum: number) {
  return Math.max(minimum, Math.floor(score * multiplier));
}

export function GameHero({
  code,
  kicker,
  title,
  description,
  score,
  baseReward,
  status,
  setStatus,
  rewardClaimed,
  canClaim,
  onClaimed,
  metrics,
}: {
  code: GameCode;
  kicker: string;
  title: string;
  description: string;
  score: number;
  baseReward: number;
  status: string;
  setStatus: (status: string) => void;
  rewardClaimed: boolean;
  canClaim: boolean;
  onClaimed: () => void;
  metrics?: Metric[];
}) {
  const { meta, rewardPreview, claimMutation, stardust, bonusStreak, vaultCrates, bestScore } = useMiniGameClaim(
    code,
    score,
    baseReward,
    setStatus,
  );
  const allMetrics: Metric[] = [
    { label: "Счет", value: score },
    { label: "Рекорд", value: bestScore },
    { label: "Награда", value: rewardPreview.totalReward },
    { label: "Звездная пыль", value: stardust },
    { label: "Серия бонусов", value: `${bonusStreak}x` },
    { label: "Контейнеры", value: vaultCrates },
    ...(metrics ?? []),
  ];

  function claimReward() {
    claimMutation.mutate(undefined, {
      onSuccess: onClaimed,
    });
  }

  return (
    <>
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">{kicker}</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">{title}</h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">{description}</p>
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">{meta.title}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {allMetrics.map((metric) => (
              <div key={metric.label} className="metric-chip">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel">
        <div className="list-row">
          <div>
            <p className="text-lg font-medium">Награда забега</p>
            <p className="text-sm text-white/55">
              База {baseReward}, серия +{rewardPreview.streakBonus}, мастерство +{rewardPreview.masteryBonus}, результат +
              {rewardPreview.performanceBonus}.
            </p>
            <p className="mt-2 text-sm text-white/62">{status}</p>
          </div>
          <button className="primary-button" disabled={!canClaim || rewardClaimed || claimMutation.isPending} onClick={claimReward}>
            {rewardClaimed ? "Получено" : claimMutation.isPending ? "Синхронизация..." : `Забрать +${rewardPreview.totalReward}`}
          </button>
        </div>
      </section>
    </>
  );
}
