import type { FriendActivityEntry, FriendEntry, FriendsResponse } from "@mtb/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useSessionStore } from "@/lib/session-store";

const EMPTY_FRIENDS: FriendsResponse = {
  accepted: [],
  pending_incoming: [],
  pending_outgoing: [],
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Ожидает подтверждения";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось получить данные. Попробуйте еще раз.";
}

function formatSourceLabel(source: string) {
  if (source === "manual") {
    return "вручную";
  }
  if (source === "qr") {
    return "через QR";
  }
  if (source === "referral") {
    return "из рефералки";
  }
  return source;
}

function formatStatusLabel(status: string) {
  if (status === "accepted") {
    return "активно";
  }
  if (status === "pending") {
    return "ожидает";
  }
  return status;
}

function formatActivityKind(kind: string) {
  if (kind === "invite_sent") {
    return "инвайт";
  }
  if (kind === "invite_accepted") {
    return "принят";
  }
  if (kind === "game_reward") {
    return "награда";
  }
  if (kind === "quest_completed") {
    return "квест";
  }
  return kind;
}

function FriendConnectionRow({
  entry,
  action,
  actionDisabled,
}: {
  entry: FriendEntry;
  action?: ReactNode;
  actionDisabled?: boolean;
}) {
  return (
    <div className={`list-row ${actionDisabled ? "opacity-80" : ""}`}>
      <div>
        <p className="text-lg font-medium">{entry.display_name}</p>
        <p className="text-sm text-white/55">
          ID: {entry.user_id} - {formatSourceLabel(entry.source)}
        </p>
      </div>
      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/42">{formatStatusLabel(entry.status)}</p>
          <p className="text-sm text-white/55">{formatDateTime(entry.accepted_at ?? entry.created_at)}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: FriendActivityEntry }) {
  return (
    <div className="list-row">
      <div>
        <p className="text-lg font-medium">{item.title}</p>
        <p className="text-sm text-white/55">{item.detail}</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-[0.22em] text-white/42">{formatActivityKind(item.kind)}</p>
        <p className="text-sm text-white/55">{item.actor_display_name}</p>
        <p className="text-xs text-white/42">{formatDateTime(item.created_at)}</p>
      </div>
    </div>
  );
}

export function FriendsPage() {
  const { userId, displayName } = useSessionStore();
  const queryClient = useQueryClient();
  const [inviteeId, setInviteeId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const trimmedInviteeId = inviteeId.trim();

  const friendsQuery = useQuery({
    queryKey: ["friends", userId],
    queryFn: () => api.getFriends(userId),
    enabled: Boolean(userId),
  });
  const activityQuery = useQuery({
    queryKey: ["friend-activity", userId],
    queryFn: () => api.getFriendActivity(userId),
    enabled: Boolean(userId),
  });

  const inviteMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      api.inviteToFriends({
        user_id: userId,
        target_user_id: targetUserId,
        source: "manual",
      }),
    onSuccess: (entry, targetUserId) => {
      setFeedback(`Инвайт отправлен для ${entry.display_name || targetUserId}. Теперь ждём подтверждения.`);
      setInviteeId("");
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      queryClient.invalidateQueries({ queryKey: ["friend-activity", userId] });
    },
    onError: (error) => {
      setFeedback(getErrorMessage(error));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (friendshipId: string) =>
      api.acceptFriendInvite({
        user_id: userId,
        friendship_id: friendshipId,
      }),
    onSuccess: (entry) => {
      setFeedback(`Связь с ${entry.display_name} подтверждена. Можно продолжать в QR или AI.`);
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      queryClient.invalidateQueries({ queryKey: ["friend-activity", userId] });
      queryClient.invalidateQueries({ queryKey: ["assistant-context", userId] });
    },
    onError: (error) => {
      setFeedback(getErrorMessage(error));
    },
  });

  const friends = friendsQuery.data ?? EMPTY_FRIENDS;
  const acceptedCount = friends.accepted.length;
  const incomingCount = friends.pending_incoming.length;
  const outgoingCount = friends.pending_outgoing.length;
  const activityCount = activityQuery.data?.length ?? 0;
  const totalOpenInvites = incomingCount + outgoingCount;
  const canInvite = Boolean(trimmedInviteeId) && trimmedInviteeId !== userId && !inviteMutation.isPending;
  const inviteValidationMessage =
    trimmedInviteeId === userId ? "Нельзя пригласить собственный user_id." : "Используйте user_id клиента или пилота из QR.";
  const showInitialLoading = (friendsQuery.isLoading && !friendsQuery.data) || (activityQuery.isLoading && !activityQuery.data);
  const hasNetworkError = friendsQuery.isError || activityQuery.isError;

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">Friends MVP</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">
              Собирайте круг доверия, принимайте инвайты и держите живую социальную ленту под рукой.
            </h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">
              {displayName} может добавлять друзей вручную, подтверждать входящие запросы и быстро переходить в QR или AI,
              чтобы расширять сетку контактов без лишних экранов.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="primary-button inline-flex" to="/app/qr">
                Открыть QR
              </Link>
              <Link className="secondary-button inline-flex" to="/app/ai">
                Открыть AI
              </Link>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setFeedback(null);
                  void friendsQuery.refetch();
                  void activityQuery.refetch();
                }}
              >
                Обновить
              </button>
            </div>
            <div className="min-h-[1.5rem] text-sm text-white/64" aria-live="polite">
              {feedback}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Активные друзья</span>
              <strong>{friendsQuery.isLoading && !friendsQuery.data ? "…" : acceptedCount}</strong>
            </div>
            <div className="metric-chip">
              <span>Открытые инвайты</span>
              <strong>{friendsQuery.isLoading && !friendsQuery.data ? "…" : totalOpenInvites}</strong>
            </div>
            <div className="metric-chip">
              <span>Входящие</span>
              <strong>{friendsQuery.isLoading && !friendsQuery.data ? "…" : incomingCount}</strong>
            </div>
            <div className="metric-chip">
              <span>Активность</span>
              <strong>{activityQuery.isLoading && !activityQuery.data ? "…" : activityCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <article className="surface-panel">
          <p className="eyebrow">Ручной инвайт</p>
          <h3 className="mt-2 text-3xl font-semibold">Добавить друга по user_id</h3>
          <p className="mt-3 text-sm text-white/62">
            Базовый MVP-канал: вручную введите идентификатор, отправьте запрос и используйте QR, когда нужен быстрый офлайн
            обмен.
          </p>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">ID пользователя</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none transition focus:border-white/25"
              name="targetUserId"
              autoComplete="off"
              placeholder="например, u_demo_friend"
              value={inviteeId}
              onChange={(event) => setInviteeId(event.target.value)}
            />
          </label>
          <div className="mt-3 text-sm text-white/58">{inviteValidationMessage}</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="primary-button"
              disabled={!canInvite}
              type="button"
              onClick={() => inviteMutation.mutate(trimmedInviteeId)}
            >
              {inviteMutation.isPending ? "Отправляем…" : "Отправить инвайт"}
            </button>
            <Link className="secondary-button inline-flex" to="/app/qr">
              Поделиться через QR
            </Link>
          </div>
          <div className="mt-4 min-h-[1.25rem] text-sm text-white/58" aria-live="polite">
            {inviteMutation.isError ? getErrorMessage(inviteMutation.error) : inviteMutation.isSuccess ? "Инвайт ушел в обработку." : null}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Исходящие</span>
              <strong>{friendsQuery.isLoading && !friendsQuery.data ? "…" : outgoingCount}</strong>
            </div>
            <div className="metric-chip">
              <span>Принятые связи</span>
              <strong>{friendsQuery.isLoading && !friendsQuery.data ? "…" : acceptedCount}</strong>
            </div>
          </div>

          <div className="mt-7 border-t border-white/8 pt-5">
            <p className="eyebrow">Следующий шаг</p>
            <p className="mt-2 text-sm text-white/62">
              Если нужен быстрый сценарий знакомства, ведите пользователя в QR. Если нужны подсказки по контакту, переводите в AI.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="primary-button inline-flex" to="/app/qr">
                Сценарий QR
              </Link>
              <Link className="secondary-button inline-flex" to="/app/ai">
                Спросить AI
              </Link>
            </div>
          </div>
        </article>

        <article className="surface-panel">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Входящие подтверждения</p>
              <h3 className="text-2xl font-semibold">Запросы, которые ждут решения</h3>
            </div>
            <span className="text-sm text-white/55">запросов: {friendsQuery.isLoading && !friendsQuery.data ? "…" : incomingCount}</span>
          </div>

          {showInitialLoading ? <p className="text-sm text-white/60">Подтягиваем социальный граф и последнюю активность…</p> : null}
          {friendsQuery.isError ? (
            <div className="rounded-3xl border border-rose-300/20 bg-rose-300/10 px-4 py-4 text-sm text-rose-100">
              {getErrorMessage(friendsQuery.error)}
            </div>
          ) : null}

          {!friendsQuery.isError && !incomingCount ? (
            <div className="space-y-3">
              <div className="list-row list-row--empty">
                <div>
                  <p className="text-lg font-medium">Пока нет входящих инвайтов</p>
                  <p className="text-sm text-white/55">Отправьте свой QR или предложите другу открыть AI-ассистента для следующего шага.</p>
                </div>
                <strong className="status-pill">пусто</strong>
              </div>
              {friends.pending_outgoing.slice(0, 3).map((entry) => (
                <FriendConnectionRow key={entry.friendship_id} entry={entry} />
              ))}
            </div>
          ) : null}

          {!friendsQuery.isError && incomingCount ? (
            <div className="space-y-3">
              {friends.pending_incoming.map((entry) => {
                const acceptPending = acceptMutation.isPending && acceptMutation.variables === entry.friendship_id;

                return (
                  <FriendConnectionRow
                    key={entry.friendship_id}
                    entry={entry}
                    actionDisabled={acceptPending}
                    action={
                      <button
                        className="primary-button"
                        disabled={acceptPending}
                        type="button"
                        onClick={() => acceptMutation.mutate(entry.friendship_id)}
                      >
                        {acceptPending ? "Принимаем…" : "Принять"}
                      </button>
                    }
                  />
                );
              })}
            </div>
          ) : null}

          <div className="mt-6 border-t border-white/8 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Исходящие инвайты</p>
                <h4 className="text-xl font-semibold">Ожидают ответа</h4>
              </div>
              <span className="text-sm text-white/55">{friendsQuery.isLoading && !friendsQuery.data ? "…" : outgoingCount}</span>
            </div>
            <div className="space-y-3">
              {friends.pending_outgoing.length ? (
                friends.pending_outgoing.map((entry) => <FriendConnectionRow key={entry.friendship_id} entry={entry} />)
              ) : (
                <div className="list-row list-row--empty">
                  <div>
                    <p className="text-lg font-medium">Нет исходящих запросов</p>
                    <p className="text-sm text-white/55">Отправьте первый инвайт вручную или через QR-код.</p>
                  </div>
                  <strong className="status-pill">готово</strong>
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="surface-panel">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Активные друзья</p>
              <h3 className="text-2xl font-semibold">Текущий круг доверия</h3>
            </div>
            <span className="text-sm text-white/55">в сети: {friendsQuery.isLoading && !friendsQuery.data ? "…" : acceptedCount}</span>
          </div>

          {friendsQuery.isError ? (
            <div className="rounded-3xl border border-rose-300/20 bg-rose-300/10 px-4 py-4 text-sm text-rose-100">
              {getErrorMessage(friendsQuery.error)}
            </div>
          ) : acceptedCount ? (
            <div className="space-y-3">
              {friends.accepted.map((entry) => (
                <FriendConnectionRow key={entry.friendship_id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="list-row list-row--empty">
                <div>
                  <p className="text-lg font-medium">Список друзей еще пуст</p>
                  <p className="text-sm text-white/55">Первое подтверждение сразу превратит этот экран в рабочую контактную панель.</p>
                </div>
                <strong className="status-pill">старт</strong>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link className="primary-button inline-flex justify-center" to="/app/qr">
                  Найти через QR
                </Link>
                <Link className="secondary-button inline-flex justify-center" to="/app/ai">
                  Подсказка от AI
                </Link>
              </div>
            </div>
          )}
        </article>

        <article className="surface-panel">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Социальная активность</p>
              <h3 className="text-2xl font-semibold">Последние события по друзьям</h3>
            </div>
            <span className="text-sm text-white/55">событий: {activityQuery.isLoading && !activityQuery.data ? "…" : activityCount}</span>
          </div>

          {activityQuery.isError ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-rose-300/20 bg-rose-300/10 px-4 py-4 text-sm text-rose-100">
                {getErrorMessage(activityQuery.error)}
              </div>
              {!friendsQuery.isError && acceptedCount ? (
                <p className="text-sm text-white/58">
                  Список друзей загружен, но лента активности пока недоступна. Можно продолжать работу с инвайтами.
                </p>
              ) : null}
            </div>
          ) : activityQuery.isLoading && !activityQuery.data ? (
            <p className="text-sm text-white/60">Собираем события по инвайтам и действиям друзей…</p>
          ) : activityQuery.data?.length ? (
            <div className="space-y-3">
              {activityQuery.data.map((item) => (
                <ActivityRow key={item.activity_id} item={item} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="list-row list-row--empty">
                <div>
                  <p className="text-lg font-medium">Лента пока пустая</p>
                  <p className="text-sm text-white/55">После первого инвайта или подтверждения здесь появятся новые сигналы.</p>
                </div>
                <strong className="status-pill">ожидает</strong>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-4 text-sm text-white/60">
                Для ускорения сценария откройте <Link className="text-white underline decoration-white/30 underline-offset-4" to="/app/qr">QR</Link> или{" "}
                <Link className="text-white underline decoration-white/30 underline-offset-4" to="/app/ai">
                  AI-ассистента
                </Link>
                .
              </div>
            </div>
          )}
        </article>
      </section>

      {hasNetworkError ? (
        <section className="surface-panel">
          <p className="eyebrow">Состояние сети</p>
          <h3 className="mt-2 text-2xl font-semibold">Часть данных не синхронизировалась</h3>
          <p className="mt-3 max-w-2xl text-sm text-white/60">
            Друзья и активность загружаются отдельно, поэтому экран остается рабочим даже при частичном сбое. Нажмите обновить, чтобы
            повторить запросы.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                void friendsQuery.refetch();
                void activityQuery.refetch();
              }}
            >
              Повторить загрузку
            </button>
            <Link className="secondary-button inline-flex" to="/app/qr">
              Перейти в QR
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
