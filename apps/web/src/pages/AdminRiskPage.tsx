import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";
import { formatRewardType, formatRiskFlag, formatStatus } from "@/lib/labels";
import { useAdminStream } from "@/lib/use-admin-stream";

export function AdminRiskPage() {
  const streamPayload = useAdminStream();
  const riskQuery = useQuery({
    queryKey: ["admin-risk"],
    queryFn: api.getAdminRisk,
    refetchInterval: 5000,
  });
  const activeFlags = riskQuery.data?.active_flags ?? [];
  const riskSignalGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        flagType: string;
        count: number;
        maxSeverity: number;
        latestDetail: string;
        latestAt: string;
      }
    >();

    for (const flag of activeFlags) {
      const existing = groups.get(flag.flag_type);
      if (!existing) {
        groups.set(flag.flag_type, {
          flagType: flag.flag_type,
          count: 1,
          maxSeverity: flag.severity,
          latestDetail: flag.detail,
          latestAt: flag.created_at,
        });
        continue;
      }

      existing.count += 1;
      existing.maxSeverity = Math.max(existing.maxSeverity, flag.severity);
      if (new Date(flag.created_at).getTime() > new Date(existing.latestAt).getTime()) {
        existing.latestDetail = flag.detail;
        existing.latestAt = flag.created_at;
      }
    }

    return [...groups.values()].sort(
      (left, right) =>
        right.maxSeverity - left.maxSeverity || new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime(),
    );
  }, [activeFlags]);

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <p className="eyebrow">Риски и антифрод</p>
        <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">Журнал активности помогает остановить подозрительные сигналы, не ломая игровой сценарий</h2>
        {streamPayload ? (
          <p className="mt-4 text-sm text-white/58">Живой поток: награды/активность {streamPayload.reward_to_revenue_ratio} | активные пользователи {streamPayload.active_users}</p>
        ) : null}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Риск-сигналы</h3>
            <span className="text-sm text-white/55">
              {riskSignalGroups.length} групп / {activeFlags.length} сигналов
            </span>
          </div>
          <div className="space-y-3">
            {riskSignalGroups.map((group) => (
              <div key={group.flagType} className="risk-signal-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold">{formatRiskFlag(group.flagType)}</p>
                    {group.count > 1 ? <span className="risk-signal-count">{group.count} похожих</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-white/55">{group.latestDetail}</p>
                </div>
                <strong className="text-xl text-amber-300">Риск {group.maxSeverity}</strong>
              </div>
            ))}
            {!activeFlags.length ? <p className="text-sm text-white/60">Активных риск-сигналов сейчас нет</p> : null}
          </div>
        </article>
        <article className="surface-panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Записи на проверке</h3>
            <span className="text-sm text-white/55">{riskQuery.data?.pending_rewards.length ?? 0}</span>
          </div>
          <div className="space-y-3">
            {riskQuery.data?.pending_rewards.map((reward) => (
              <div key={reward.ledger_id} className="list-row">
                <div>
                  <p className="text-lg font-medium">{formatRewardType(reward.reward_type)}</p>
                  <p className="text-sm text-white/55">{new Date(reward.created_at).toLocaleString("ru-RU")}</p>
                </div>
                <strong className="text-2xl text-amber-300">{formatStatus(reward.status)}</strong>
              </div>
            ))}
            {!riskQuery.data?.pending_rewards.length ? <p className="text-sm text-white/60">Записей на проверке сейчас нет</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
