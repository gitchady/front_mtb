import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatRewardType, formatRiskFlag } from "@/lib/labels";
import { useAdminStream } from "@/lib/use-admin-stream";

export function AdminRiskPage() {
  const streamPayload = useAdminStream();
  const riskQuery = useQuery({
    queryKey: ["admin-risk"],
    queryFn: api.getAdminRisk,
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <p className="eyebrow">Риски и антифрод</p>
        <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">Журнал наград может остановить подозрительную активность, не ломая демо-сценарий.</h2>
        {streamPayload ? (
          <p className="mt-4 text-sm text-white/58">Живой поток: награды/выручка {streamPayload.reward_to_revenue_ratio} | активные пользователи {streamPayload.active_users}</p>
        ) : null}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface-panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Активные флаги</h3>
            <span className="text-sm text-white/55">{riskQuery.data?.active_flags.length ?? 0}</span>
          </div>
          <div className="space-y-3">
            {riskQuery.data?.active_flags.map((flag) => (
              <div key={flag.risk_flag_id} className="list-row">
                <div>
                  <p className="text-lg font-medium">{formatRiskFlag(flag.flag_type)}</p>
                  <p className="text-sm text-white/55">{flag.detail}</p>
                </div>
                <strong className="text-2xl text-amber-300">Ур. {flag.severity}</strong>
              </div>
            ))}
            {!riskQuery.data?.active_flags.length ? <p className="text-sm text-white/60">Активных риск-флагов сейчас нет.</p> : null}
          </div>
        </article>
        <article className="surface-panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Награды на проверке</h3>
            <span className="text-sm text-white/55">{riskQuery.data?.pending_rewards.length ?? 0}</span>
          </div>
          <div className="space-y-3">
            {riskQuery.data?.pending_rewards.map((reward) => (
              <div key={reward.ledger_id} className="list-row">
                <div>
                  <p className="text-lg font-medium">{formatRewardType(reward.reward_type)}</p>
                  <p className="text-sm text-white/55">{new Date(reward.created_at).toLocaleString("ru-RU")}</p>
                </div>
                <strong className="text-2xl text-amber-300">{reward.amount.toFixed(2)} BYN</strong>
              </div>
            ))}
            {!riskQuery.data?.pending_rewards.length ? <p className="text-sm text-white/60">Наград на проверке сейчас нет.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
