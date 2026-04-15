import type { PlanetCode, PlanetProgress } from "@mtb/contracts";
import { PLANET_META } from "@mtb/contracts";
import { useEffect, useMemo, useState } from "react";
import { PLANET_ACTIONS, PLANET_STRUCTURES } from "@/lib/game-config";

const EVENT_KIND_LABELS: Record<string, string> = {
  partner: "партнерская покупка",
  nonPartner: "обычная покупка",
  credit: "платеж рассрочки",
  referral: "активация реферала",
  education: "финансовый урок",
  risky: "антифрод-проверка",
};

export function PlanetInspector({
  planet,
  selectedPlanet,
  stardust,
  builtStructures,
  isLocked,
  unlockRequirement,
  isPending,
  onRunAction,
  onBuild,
}: {
  planet?: PlanetProgress;
  selectedPlanet: PlanetCode;
  stardust: number;
  builtStructures: string[];
  isLocked: boolean;
  unlockRequirement: string;
  isPending: boolean;
  onRunAction: (planetCode: PlanetCode, actionId: string) => void;
  onBuild: (planetCode: PlanetCode, structureId: string) => void;
}) {
  const meta = PLANET_META[selectedPlanet];
  const actions = PLANET_ACTIONS[selectedPlanet];
  const structures = PLANET_STRUCTURES[selectedPlanet];
  const [selectedActionId, setSelectedActionId] = useState(actions[0]?.id);
  const selectedAction = useMemo(
    () => actions.find((action) => action.id === selectedActionId) ?? actions[0],
    [actions, selectedActionId],
  );

  useEffect(() => {
    setSelectedActionId(actions[0]?.id);
  }, [actions]);

  if (isLocked) {
    return (
      <article className="surface-panel h-full planet-panel--locked">
        <div className="mb-6 space-y-2">
          <p className="eyebrow">Планета закрыта</p>
          <h3 className="text-3xl font-semibold">{meta.title}</h3>
          <p className="max-w-lg text-sm text-white/65">{meta.summary}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="metric-chip">
            <span>Статус</span>
            <strong>Закрыта</strong>
          </div>
          <div className="metric-chip">
            <span>Опыт планеты</span>
            <strong>{planet?.xp ?? 0}</strong>
          </div>
          <div className="metric-chip">
            <span>Звездная пыль</span>
            <strong>{stardust}</strong>
          </div>
        </div>

        <div className="locked-callout mt-8">
          <p className="eyebrow">Условие открытия</p>
          <h4>Сначала откройте сектор</h4>
          <p>{unlockRequirement}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="surface-panel h-full">
      <div className="mb-6 space-y-2">
        <p className="eyebrow">Выбранная планета</p>
        <h3 className="text-3xl font-semibold">{meta.title}</h3>
        <p className="max-w-lg text-sm text-white/65">{meta.summary}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric-chip">
          <span>Уровень планеты</span>
          <strong>{planet?.level ?? 1}</strong>
        </div>
        <div className="metric-chip">
          <span>Опыт планеты</span>
          <strong>{planet?.xp ?? 0}</strong>
        </div>
        <div className="metric-chip">
          <span>Звездная пыль</span>
          <strong>{stardust}</strong>
        </div>
      </div>

      <div className="mt-8 grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <p className="eyebrow">Действия миссии</p>
          {actions.map((action) => (
            <button
              key={action.id}
              className={`action-card ${selectedAction?.id === action.id ? "action-card-selected" : ""}`}
              onClick={() => setSelectedActionId(action.id)}
              type="button"
            >
              <div>
                <p className="text-lg font-medium">{action.title}</p>
                <p className="mt-2 text-sm text-white/58">{action.detail}</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-[0.2em] text-white/42">Награда</span>
                <strong className="block text-xl text-[var(--accent-cyan)]">+{action.stardustReward}</strong>
              </div>
            </button>
          ))}
          <div className="mission-confirm">
            <p className="eyebrow">Подготовка события</p>
            <h4 className="mt-2 text-xl font-semibold">{selectedAction?.title}</h4>
            <p className="mt-2 text-sm text-white/58">
              Будет отправлено банковское событие: {selectedAction ? EVENT_KIND_LABELS[selectedAction.eventKind] : "не выбрано"}.
              Награда появится только после синхронизации события с ядром.
            </p>
            <button
              className="primary-button mt-4"
              disabled={!selectedAction || isPending}
              onClick={() => selectedAction && onRunAction(selectedPlanet, selectedAction.id)}
              type="button"
            >
              {isPending ? "Синхронизация…" : "Подтвердить событие"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="eyebrow">Линия строительства</p>
          {structures.map((structure) => {
            const built = builtStructures.includes(structure.id);
            const blocked = stardust < structure.cost;
            return (
              <button
                key={structure.id}
                className={`action-card ${built ? "action-card-built" : ""}`}
                onClick={() => onBuild(selectedPlanet, structure.id)}
                disabled={built || blocked}
              >
                <div>
                  <p className="text-lg font-medium">{structure.title}</p>
                  <p className="mt-2 text-sm text-white/58">{structure.detail}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/42">{built ? "Построено" : "Цена"}</span>
                  <strong className="block text-xl">{built ? "Готово" : `${structure.cost}`}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
