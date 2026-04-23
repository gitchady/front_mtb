import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startTransition, useState } from "react";
import { api } from "@/lib/api";
import { formatStatus } from "@/lib/labels";
import { useSessionStore } from "@/lib/session-store";

const actions = [
  { key: "partner", label: "Сымитировать партнерский сигнал" },
  { key: "nonPartner", label: "Сымитировать свободный сигнал" },
  { key: "credit", label: "Сымитировать ритм щита" },
  { key: "referral", label: "Сымитировать активацию реферала" },
  { key: "risky", label: "Сымитировать рискованный сигнал" },
] as const;

export function AdminSimulatorPage() {
  const queryClient = useQueryClient();
  const { userId } = useSessionStore();
  const [lastEvent, setLastEvent] = useState<{ eventId: string; status: string } | null>(null);
  const simulateMutation = useMutation({
    mutationFn: (kind: (typeof actions)[number]["key"]) => api.simulate(api.buildEvent(userId, kind)),
    onSuccess: (result) => {
      setLastEvent({ eventId: result.event_id, status: result.status });
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["profile", userId] });
        queryClient.invalidateQueries({ queryKey: ["admin-kpi"] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["quests", userId] });
        queryClient.invalidateQueries({ queryKey: ["ledger", userId] });
        queryClient.invalidateQueries({ queryKey: ["admin-risk"] });
      });
    },
  });

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <p className="eyebrow">Симулятор событий</p>
        <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">Админка отправляет продуктовые события через тот же контур синхронизации, что использует клиент</h2>
        {lastEvent ? (
          <p className="mt-4 text-sm text-white/58">
            Последнее событие: {lastEvent.eventId} | статус пайплайна: {formatStatus(lastEvent.status)}
          </p>
        ) : null}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.key}
            className="surface-panel text-left transition hover:-translate-y-1"
            onClick={() => simulateMutation.mutate(action.key)}
          >
            <p className="eyebrow">Действие симулятора</p>
            <h3 className="mt-3 text-2xl font-semibold">{action.label}</h3>
            <p className="mt-3 text-sm text-white/62">
              Отправляет типизированное событие в `/admin/simulate`, затем обновляет профиль, квесты, активность и KPI-витрины.
            </p>
          </button>
        ))}
      </section>
    </div>
  );
}
