import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdminStream } from "@/lib/use-admin-stream";

const KPI_LABELS: [keyof Awaited<ReturnType<typeof api.getAdminKpi>>, string][] = [
  ["active_users", "Активные пользователи"],
  ["activation_rate", "Активация карт"],
  ["partner_share", "Доля партнеров"],
  ["average_tx_frequency", "Средняя частота операций"],
  ["on_time_payment_rate", "Платежи в срок"],
  ["referral_activation_rate", "Активация рефералов"],
  ["reward_to_revenue_ratio", "Награды / выручка"],
  ["k_factor", "K-фактор"],
  ["total_rewards", "Всего наград"],
  ["total_revenue", "Всего выручки"],
  ["guardrail_headroom", "Запас бюджетного лимита"],
];

export function AdminKpiPage() {
  const streamPayload = useAdminStream();
  const kpiQuery = useQuery({
    queryKey: ["admin-kpi"],
    queryFn: api.getAdminKpi,
    refetchInterval: 4000,
  });

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <p className="eyebrow">Админская витрина</p>
        <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">Демо остается банковским: у каждой награды есть KPI-след и бюджетный лимит.</h2>
        {streamPayload ? (
          <p className="mt-4 text-sm text-white/58">
            Живой поток: активные пользователи {streamPayload.active_users} | награды / выручка {streamPayload.reward_to_revenue_ratio}
          </p>
        ) : null}
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {KPI_LABELS.map(([key, label]) => (
          <article key={key} className="surface-panel">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">{label}</p>
            <strong className="mt-3 block text-4xl font-semibold">{kpiQuery.data?.[key] ?? "…"}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
