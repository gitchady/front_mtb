export function formatGameRewardStatus({
  totalReward,
  cratesEarned,
  syncLabel,
}: {
  totalReward: number;
  cratesEarned: number;
  syncLabel: string;
}) {
  return `Забег завершен: +${totalReward} звездной пыли${
    cratesEarned ? ` и ${cratesEarned} контейнер хранилища` : ""
  }. Прогресс синхронизирован с ${syncLabel}.`;
}
