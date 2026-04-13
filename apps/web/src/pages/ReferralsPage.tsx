import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useGameStore } from "@/lib/game-store";
import { useSessionStore } from "@/lib/session-store";

export function ReferralsPage() {
  const { userId } = useSessionStore();
  const queryClient = useQueryClient();
  const bestSocialScore = useGameStore((state) => state.bestSocialScore);
  const stardust = useGameStore((state) => state.stardust);
  const leaderboardQuery = useQuery({ queryKey: ["leaderboard"], queryFn: api.getLeaderboard });
  const [inviteeId, setInviteeId] = useState("drug_start");
  const [lastInviteeId, setLastInviteeId] = useState<string | null>(null);
  const inviteMutation = useMutation({
    mutationFn: () => api.inviteFriend(userId, inviteeId),
    onSuccess: () => {
      setLastInviteeId(inviteeId);
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <p className="eyebrow">Социальное кольцо</p>
        <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">Рефералы работают как система роста, а не как разовая промо-механика.</h2>
      </section>
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="surface-panel">
          <p className="eyebrow">Приглашения</p>
          <h3 className="mt-2 text-2xl font-semibold">Создать реферальную запись</h3>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">ID приглашенного</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none"
              name="inviteeId"
              autoComplete="off"
              value={inviteeId}
              onChange={(event) => setInviteeId(event.target.value)}
            />
          </label>
          <button className="primary-button mt-4" disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
            {inviteMutation.isPending ? "Отправляем…" : "Отправить приглашение"}
          </button>
          <div className="mt-3 text-sm text-white/60" aria-live="polite">
            {lastInviteeId ? `Приглашение отправлено: ${lastInviteeId}` : null}
            {inviteMutation.isError ? "Не удалось отправить приглашение. Проверьте API и попробуйте снова." : null}
          </div>
          <div className="mt-6 space-y-3">
            <div className="metric-chip">
              <span>Лучший сигнал</span>
              <strong>{bestSocialScore}</strong>
            </div>
            <div className="metric-chip">
              <span>Звездная пыль</span>
              <strong>{stardust}</strong>
            </div>
            <Link className="secondary-button inline-flex" to="/app/game/social-ring-signal">
              Запустить Сигнальный ринг
            </Link>
          </div>
        </article>

        <article className="surface-panel">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="eyebrow">Рейтинг сообщества</p>
              <h3 className="text-2xl font-semibold">Сила команды</h3>
            </div>
          </div>
          <div className="space-y-3">
            {leaderboardQuery.data?.map((entry, index) => (
              <div key={entry.user_id} className="list-row">
                <div>
                  <p className="text-lg font-medium">{index + 1}. {entry.display_name}</p>
                  <p className="text-sm text-white/55">Уровень орбиты {entry.orbit_level}</p>
                </div>
                <strong className="text-2xl">{entry.total_xp} XP</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
