import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanetCode } from "@mtb/contracts";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useGameStore } from "@/lib/game-store";
import { formatRewardKind, formatStatus, PLANET_CODE_LABELS } from "@/lib/labels";
import { useSessionStore } from "@/lib/session-store";

export function QuestsPage() {
  const { userId } = useSessionStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const focusedQuestId = searchParams.get("quest");
  const claimQuestReward = useGameStore((state) => state.claimQuestReward);
  const questsQuery = useQuery({
    queryKey: ["quests", userId],
    queryFn: () => api.getQuests(userId),
  });
  const claimMutation = useMutation({
    mutationFn: (questId: string) => api.claimQuest(questId, userId),
    onSuccess: (_, questId) => {
      const quest = questsQuery.data?.find((item) => item.quest_id === questId);
      claimQuestReward({
        planetCode: (quest?.planet_code as PlanetCode | undefined) ?? "ORBIT_COMMERCE",
        questId,
        title: `Получена награда: ${quest?.title ?? "Квест"}`,
        detail: "Награда квеста добавлена в локальное бонусное хранилище",
        baseReward: Math.max(5, Math.round(quest?.reward_value ?? 5)),
      });
      queryClient.invalidateQueries({ queryKey: ["quests", userId] });
      queryClient.invalidateQueries({ queryKey: ["ledger", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <p className="eyebrow">Слой миссий</p>
        <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">Ежедневные квесты связывают игровой эффект с измеримым ритмом действий</h2>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {questsQuery.data?.map((quest) => {
          const isReady = quest.status === "completed";
          const isClaimed = quest.status === "claimed";
          const isClaimingThisQuest = claimMutation.isPending && claimMutation.variables === quest.quest_id;
          const claimButtonText = isClaimed ? "Получено" : isClaimingThisQuest ? "Получаем" : isReady ? "Забрать" : "Не готово";
          const progressPercent = quest.threshold > 0 ? Math.min(100, (quest.current_value / quest.threshold) * 100) : 0;

          return (
            <article key={quest.quest_id} className={`surface-panel ${focusedQuestId === quest.quest_id ? "quest-card-focused" : ""}`}>
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">
                {PLANET_CODE_LABELS[quest.planet_code as PlanetCode]}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{quest.title}</h3>
              <p className="mt-3 max-w-xl text-sm text-white/68">{quest.description}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/62">
                <span>Прогресс: {quest.current_value}/{quest.threshold}</span>
                <span>Награда: {quest.reward_value} {formatRewardKind(quest.reward_kind)}</span>
                <span>Статус: {formatStatus(quest.status)}</span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="h-2 flex-1 rounded-full bg-white/8">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#ff4da0,#526bff)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <button
                  className="primary-button min-w-[8.5rem]"
                  disabled={!isReady || claimMutation.isPending}
                  onClick={() => claimMutation.mutate(quest.quest_id)}
                >
                  {claimButtonText}
                </button>
              </div>
              {claimMutation.isError && claimMutation.variables === quest.quest_id ? (
                <p className="mt-3 text-sm text-rose-200">Не удалось получить награду Обновите квесты и попробуйте еще раз</p>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
