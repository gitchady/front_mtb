import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GameCode } from "@mtb/contracts";
import { startTransition, useMemo } from "react";
import { api } from "@/lib/api";
import { calculateBonusOutcome } from "@/lib/bonus-engine";
import { useGameStore } from "@/lib/game-store";
import { MINI_GAME_BY_CODE } from "@/lib/mini-games";
import { useSessionStore } from "@/lib/session-store";

export function useMiniGameClaim(gameCode: GameCode, score: number, baseReward: number, setStatus: (status: string) => void) {
  const { userId } = useSessionStore();
  const queryClient = useQueryClient();
  const meta = MINI_GAME_BY_CODE[gameCode];
  const recordMiniGameRun = useGameStore((state) => state.recordMiniGameRun);
  const bonusStreak = useGameStore((state) => state.bonusStreak);
  const vaultCharge = useGameStore((state) => state.vaultCharge);
  const vaultCrates = useGameStore((state) => state.vaultCrates);
  const selectedPlanet = useGameStore((state) => state.selectedPlanet);
  const structures = useGameStore((state) => state.structures);
  const planetMastery = useGameStore((state) => state.planetMastery);
  const stardust = useGameStore((state) => state.stardust);
  const bestGameScores = useGameStore((state) => state.bestGameScores);
  const rewardPreview = useMemo(
    () =>
      calculateBonusOutcome(
        {
          bonusStreak,
          vaultCharge,
          selectedPlanet,
          structures,
          planetMastery,
        },
        {
          planetCode: meta.planetCode,
          baseReward,
          performanceScore: score,
          category: "mini_game",
        },
      ),
    [baseReward, bonusStreak, meta.planetCode, planetMastery, score, selectedPlanet, structures, vaultCharge],
  );
  const claimMutation = useMutation({
    mutationFn: async () => {
      const event = await api.ingest(api.buildEvent(userId, meta.eventKind));
      const run = await api.submitGameRun({
        user_id: userId,
        game_code: gameCode,
        planet_code: meta.planetCode,
        score,
        base_reward: baseReward,
        total_reward: rewardPreview.totalReward,
        source_event_id: event.event_id,
        bonus_breakdown: {
          streak_bonus: rewardPreview.streakBonus,
          mastery_bonus: rewardPreview.masteryBonus,
          performance_bonus: rewardPreview.performanceBonus,
          focus_bonus: rewardPreview.focusBonus,
          charge_gain: rewardPreview.chargeGain,
          crates_earned: rewardPreview.cratesEarned,
        },
      });
      return { event, run };
    },
    onSuccess: ({ event, run }) => {
      const outcome = recordMiniGameRun({
        gameCode,
        score,
        baseReward,
        title: `Получена награда ${meta.title}`,
        detail: `${meta.title}: счет ${score}.`,
      });
      setStatus(
        `Забег ${run.run_id}: +${outcome.totalReward} звездной пыли${
          outcome.cratesEarned ? ` и ${outcome.cratesEarned} контейнер хранилища` : ""
        }. Событие ${event.event_id} синхронизировано.`,
      );
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["profile", userId] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["ledger", userId] });
        queryClient.invalidateQueries({ queryKey: ["quests", userId] });
        queryClient.invalidateQueries({ queryKey: ["games-summary", userId] });
      });
    },
    onError: () => {
      setStatus(`${meta.title} завершена локально, но синхронизация не прошла. Попробуйте забрать награду еще раз.`);
    },
  });

  return {
    meta,
    rewardPreview,
    claimMutation,
    stardust,
    bonusStreak,
    vaultCrates,
    bestScore: bestGameScores[gameCode] ?? 0,
  };
}
