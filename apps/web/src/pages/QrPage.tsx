import { useMutation, useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api, getQrActionLabel } from "@/lib/api";
import { useSessionStore } from "@/lib/session-store";

type QrPayload = Awaited<ReturnType<typeof api.getMyQr>>;
type ActionRoute = "/app/friends" | "/app/ai";
type ResultState = "idle" | "loading" | "error" | "invalid" | "success";

const CTA_ROUTE_BY_KIND: Record<string, ActionRoute> = {
  add_friend: "/app/friends",
  open_referral: "/app/friends",
  navigate: "/app/friends",
  ask_assistant: "/app/ai",
};

const PANEL_TONE_CLASS: Record<ResultState, string> = {
  idle: "border-white/8 bg-white/[0.02]",
  loading: "border-cyan-300/18 bg-cyan-300/[0.05]",
  error: "border-rose-300/18 bg-rose-300/[0.05]",
  invalid: "border-amber-300/18 bg-amber-300/[0.05]",
  success: "border-emerald-300/18 bg-emerald-300/[0.05]",
};

function getRouteForKind(ctaKind: string): ActionRoute | null {
  return CTA_ROUTE_BY_KIND[ctaKind] ?? null;
}

function getRouteCopy(route: ActionRoute) {
  if (route === "/app/ai") {
    return {
      eyebrow: "AI-сценарий",
      label: "Открыть AI",
    };
  }

  return {
    eyebrow: "Социальный сценарий",
    label: "Открыть друзей",
  };
}

function getResolverState(result: QrPayload | undefined, isPending: boolean, isError: boolean): ResultState {
  if (isPending) {
    return "loading";
  }

  if (isError) {
    return "error";
  }

  if (!result) {
    return "idle";
  }

  return result.valid ? "success" : "invalid";
}

function getResolverHeading(state: ResultState, result: QrPayload | undefined) {
  if (state === "loading") {
    return "Разбираем QR payload";
  }

  if (state === "error") {
    return "Разбор не завершился";
  }

  if (state === "invalid") {
    return result?.title || "QR payload не прошел валидацию";
  }

  if (state === "success") {
    return result?.title || "QR payload подтвержден";
  }

  return "Панель результата готова";
}

function getResolverDescription(state: ResultState, result: QrPayload | undefined, errorMessage: string) {
  if (state === "loading") {
    return "Проверяем полезную нагрузку, тип действия и маршрут перехода для текущего пользователя.";
  }

  if (state === "error") {
    return errorMessage;
  }

  if (state === "invalid" || state === "success") {
    return result?.description ?? "Ответ получен, но описание сценария отсутствует.";
  }

  return "Вставьте строку из QR-кода, запустите resolve и проверьте, куда должен вести CTA.";
}

export function QrPage() {
  const { userId, displayName } = useSessionStore();
  const [payloadInput, setPayloadInput] = useState("");

  const myQrQuery = useQuery({
    queryKey: ["my-qr", userId],
    queryFn: () => api.getMyQr(userId),
  });

  const resolveMutation = useMutation({
    mutationFn: (payload: string) => api.resolveQr(userId, payload),
  });

  const trimmedPayload = payloadInput.trim();
  const resultState = getResolverState(resolveMutation.data, resolveMutation.isPending, resolveMutation.isError);
  const resultHeading = getResolverHeading(resultState, resolveMutation.data);
  const resultDescription = getResolverDescription(
    resultState,
    resolveMutation.data,
    resolveMutation.error instanceof Error ? resolveMutation.error.message : "Не удалось получить ответ от QR resolver.",
  );
  const primaryRoute = getRouteForKind(resolveMutation.data?.cta_kind ?? "");
  const secondaryRoute: ActionRoute = primaryRoute === "/app/ai" ? "/app/friends" : "/app/ai";
  const myQrPayload = myQrQuery.data?.raw_payload ?? "";
  const myQrActionLabel = myQrQuery.data ? getQrActionLabel(myQrQuery.data.cta_kind) : "Определяется";
  const payloadPreview = resolveMutation.data?.raw_payload || resolveMutation.variables || trimmedPayload;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedPayload || resolveMutation.isPending) {
      return;
    }
    resolveMutation.mutate(trimmedPayload);
  }

  function handlePayloadChange(nextValue: string) {
    setPayloadInput(nextValue);
    if (resolveMutation.data || resolveMutation.isError) {
      resolveMutation.reset();
    }
  }

  function handleUseMyQr() {
    if (!myQrPayload) {
      return;
    }
    setPayloadInput(myQrPayload);
    resolveMutation.reset();
  }

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="space-y-4">
            <p className="eyebrow">QR MVP</p>
            <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">
              Один экран для собственного QR, ручной проверки payload и перехода в следующий пользовательский сценарий.
            </h2>
            <p className="max-w-2xl text-base text-white/68 md:text-lg">
              Страница показывает ваш QR-контекст, принимает любой вставленный payload и сразу говорит, валиден ли он, что означает и куда должен вести CTA.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="secondary-button" to="/app/friends">
                Открыть друзей
              </Link>
              <Link className="secondary-button" to="/app/ai">
                Открыть AI
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="metric-chip">
              <span>Пользователь</span>
              <strong>{displayName}</strong>
            </div>
            <div className="metric-chip">
              <span>Мой QR</span>
              <strong>{myQrQuery.isPending ? "..." : myQrQuery.data?.valid ? "Готов" : "Проверить"}</strong>
            </div>
            <div className="metric-chip">
              <span>Базовый CTA</span>
              <strong>{myQrActionLabel}</strong>
            </div>
            <div className="metric-chip">
              <span>Resolver</span>
              <strong>
                {resultState === "idle" ? "Ожидает" : resultState === "loading" ? "Проверяет" : resultState === "success" ? "Успех" : "Внимание"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="surface-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Мой QR</p>
              <h3 className="mt-2 text-3xl font-semibold">Поделиться своим payload</h3>
            </div>
            <button className="secondary-button" type="button" onClick={() => void myQrQuery.refetch()} disabled={myQrQuery.isFetching}>
              {myQrQuery.isFetching ? "Обновляем…" : "Обновить"}
            </button>
          </div>

          {myQrQuery.isPending ? (
            <div className="mt-6 space-y-3" aria-live="polite">
              <div className="list-row animate-pulse">
                <div>
                  <p className="text-lg font-medium">Готовим персональный QR</p>
                  <p className="text-sm text-white/55">Запрашиваем текущий payload и дефолтный CTA.</p>
                </div>
              </div>
            </div>
          ) : null}

          {myQrQuery.isError ? (
            <div className="mt-6 rounded-[24px] border border-rose-300/18 bg-rose-300/[0.05] p-4 text-sm text-white/70" aria-live="polite">
              Не удалось загрузить ваш QR-контекст. Проверьте API и повторите запрос.
            </div>
          ) : null}

          {myQrQuery.data ? (
            <>
              <div className="mt-6 rounded-[28px] border border-white/8 bg-white/[0.02] p-5">
                <p className="eyebrow">{myQrQuery.data.resolved_type || "QR payload"}</p>
                <h4 className="mt-2 text-2xl font-semibold">{myQrQuery.data.title}</h4>
                <p className="mt-3 text-sm text-white/62">{myQrQuery.data.description}</p>
                <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/42">RAW payload</p>
                  <p className="mt-3 break-all font-mono text-sm leading-6 text-white/86">{myQrQuery.data.raw_payload}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="metric-chip">
                  <span>Статус</span>
                  <strong>{myQrQuery.data.valid ? "valid" : "invalid"}</strong>
                </div>
                <div className="metric-chip">
                  <span>CTA</span>
                  <strong>{getQrActionLabel(myQrQuery.data.cta_kind)}</strong>
                </div>
                <div className="metric-chip">
                  <span>Маршрут</span>
                  <strong>{getRouteForKind(myQrQuery.data.cta_kind) ?? "Вне app"}</strong>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="primary-button" type="button" onClick={handleUseMyQr}>
                  Использовать в resolver
                </button>
                <Link className="secondary-button" to="/app/friends">
                  Друзья
                </Link>
                <Link className="secondary-button" to="/app/ai">
                  AI
                </Link>
              </div>
            </>
          ) : null}
        </article>

        <article className="surface-panel">
          <p className="eyebrow">QR resolver</p>
          <h3 className="mt-2 text-3xl font-semibold">Проверить вставленный payload</h3>
          <p className="mt-3 max-w-2xl text-sm text-white/62">
            Вставьте строку из QR-кода вручную. Страница вызовет `resolveQr`, покажет валидность ответа и предложит следующий маршрут.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">Payload</span>
              <textarea
                className="min-h-[220px] w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white outline-none"
                name="payload"
                rows={8}
                autoComplete="off"
                placeholder="Например: mtb://qr?action=add_friend&target=u_demo"
                value={payloadInput}
                onChange={(event) => handlePayloadChange(event.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button className="primary-button" type="submit" disabled={!trimmedPayload || resolveMutation.isPending}>
                {resolveMutation.isPending ? "Проверяем…" : "Resolve QR"}
              </button>
              <button className="secondary-button" type="button" onClick={() => handlePayloadChange("")} disabled={!payloadInput && !resolveMutation.data}>
                Очистить
              </button>
              <button className="secondary-button" type="button" onClick={handleUseMyQr} disabled={!myQrPayload}>
                Подставить мой QR
              </button>
            </div>
          </form>

          <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
            <div className="list-row">
              <div>
                <p className="text-lg font-medium">Как читать результат</p>
                <p className="text-sm text-white/55">`valid` показывает, прошел ли payload проверку, а CTA определяет, какой экран нужен дальше.</p>
              </div>
              <strong className="text-2xl">{trimmedPayload.length}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-panel">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Результат</p>
            <h3 className="text-2xl font-semibold">Состояние resolver</h3>
          </div>
          <span className="text-sm uppercase tracking-[0.24em] text-white/42">{resultState}</span>
        </div>

        <div className={`rounded-[28px] border p-5 ${PANEL_TONE_CLASS[resultState]}`} aria-live="polite">
          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <div>
                <p className="eyebrow">
                  {resultState === "success"
                    ? "Успешное распознавание"
                    : resultState === "invalid"
                      ? "Невалидный payload"
                      : resultState === "error"
                        ? "Ошибка resolver"
                        : resultState === "loading"
                          ? "Идет проверка"
                          : "Ожидаем payload"}
                </p>
                <h4 className="mt-2 text-3xl font-semibold">{resultHeading}</h4>
                <p className="mt-3 text-sm text-white/70">{resultDescription}</p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/42">Последний payload</p>
                <p className="mt-3 break-all font-mono text-sm leading-6 text-white/86">
                  {payloadPreview || "Пока пусто. Вставьте строку в форму выше, чтобы увидеть разбор."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className={primaryRoute === "/app/friends" ? "primary-button" : "secondary-button"} to="/app/friends">
                  {primaryRoute === "/app/friends" ? getQrActionLabel(resolveMutation.data?.cta_kind ?? "add_friend") : "Открыть друзей"}
                </Link>
                <Link className={primaryRoute === "/app/ai" ? "primary-button" : "secondary-button"} to="/app/ai">
                  {primaryRoute === "/app/ai" ? getQrActionLabel(resolveMutation.data?.cta_kind ?? "ask_assistant") : "Открыть AI"}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="metric-chip">
                <span>resolved_type</span>
                <strong>{resolveMutation.data?.resolved_type || "Ожидание"}</strong>
              </div>
              <div className="metric-chip">
                <span>CTA label</span>
                <strong>{resolveMutation.data ? getQrActionLabel(resolveMutation.data.cta_kind) : "Не определен"}</strong>
              </div>
              <div className="metric-chip">
                <span>CTA route</span>
                <strong>{primaryRoute ?? "Выберите вручную"}</strong>
              </div>
              <div className="metric-chip">
                <span>CTA target</span>
                <strong>{resolveMutation.data?.cta_target || "Не передан"}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[primaryRoute ?? "/app/friends", secondaryRoute].map((route) => {
            const copy = getRouteCopy(route);
            const isPrimary = route === primaryRoute;

            return (
              <Link
                key={route}
                className={`${isPrimary ? "primary-button" : "secondary-button"} !flex min-h-[84px] items-start justify-between rounded-[24px] !px-5 !py-4`}
                to={route}
              >
                <span className="text-left">
                  <span className="block text-xs uppercase tracking-[0.22em] text-white/55">{copy.eyebrow}</span>
                  <span className="mt-2 block text-lg font-semibold text-white">{copy.label}</span>
                </span>
                <span className="text-sm text-white/72">{route}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
