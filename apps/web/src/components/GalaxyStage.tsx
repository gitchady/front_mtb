import type { GameCode, PlanetCode, PlanetProgress, QuestItem } from "@mtb/contracts";
import { PLANET_META } from "@mtb/contracts";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { PlanetVisual } from "@/components/PlanetVisual";
import { PLANET_STAGE } from "@/lib/game-config";
import { MINI_GAMES, type MiniGameMeta } from "@/lib/mini-games";
import { isPlanetUnlocked, PLANET_UNLOCK_REQUIREMENTS, type PlanetUnlockMap } from "@/lib/planet-unlocks";

type PlanetMasteryMap = Record<PlanetCode, number>;
type Position = { left: number; top: number };
type HubKind = "spend" | "quests" | "games";
type GalaxyNodeId = `planet:${PlanetCode}` | `hub:${PlanetCode}:${HubKind}` | `quest:${string}` | `game:${GameCode}`;
type GalaxyLayout = Partial<Record<GalaxyNodeId, Position>>;

const HUB_META: Record<HubKind, { title: string; detail: string; short: string }> = {
  spend: {
    title: "Траты",
    detail: "Запишите статистику операции, чтобы усилить большую планету категории.",
    short: "BYN",
  },
  quests: {
    title: "Квесты",
    detail: "Откройте квестовые спутники и перейдите к выполнению условия.",
    short: "Q",
  },
  games: {
    title: "Игры",
    detail: "Выберите мини-игру, запуск которой прокачает эту категорию.",
    short: "G",
  },
};

const HUB_OFFSETS: Record<HubKind, Position> = {
  spend: { left: -22, top: 14 },
  quests: { left: 0, top: -23 },
  games: { left: 22, top: 14 },
};

const QUEST_OFFSETS: Position[] = [
  { left: -15, top: -13 },
  { left: 16, top: -8 },
  { left: -1, top: 18 },
];

const GAME_OFFSETS: Position[] = [
  { left: -14, top: -12 },
  { left: 15, top: -9 },
  { left: 0, top: 18 },
];

const PLANET_CODES: PlanetCode[] = ["ORBIT_COMMERCE", "CREDIT_SHIELD", "SOCIAL_RING"];
const PLANET_ACTION_KIND: Record<PlanetCode, string> = {
  ORBIT_COMMERCE: "покупки",
  CREDIT_SHIELD: "платежа",
  SOCIAL_RING: "социальной активности",
};
const PLANET_DRAG_CLICK_THRESHOLD = 5;
const PLANET_LAYOUT_STORAGE_KEY = "mtb-galaxy-node-layout-v2";
const LOCAL_OFFSET_LIMIT = 32;

function planetNodeId(planetCode: PlanetCode): GalaxyNodeId {
  return `planet:${planetCode}`;
}

function hubNodeId(planetCode: PlanetCode, kind: HubKind): GalaxyNodeId {
  return `hub:${planetCode}:${kind}`;
}

function questNodeId(questId: string): GalaxyNodeId {
  return `quest:${questId}`;
}

function gameNodeId(gameCode: GameCode): GalaxyNodeId {
  return `game:${gameCode}`;
}

function getPlanetCodeFromNodeId(nodeId: GalaxyNodeId): PlanetCode | null {
  if (!nodeId.startsWith("planet:")) {
    return null;
  }

  const planetCode = nodeId.slice("planet:".length) as PlanetCode;
  return PLANET_CODES.includes(planetCode) ? planetCode : null;
}

function isGalaxyNodeId(value: string): value is GalaxyNodeId {
  return (
    value.startsWith("planet:") ||
    value.startsWith("hub:") ||
    value.startsWith("quest:") ||
    value.startsWith("game:")
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampStagePosition(position: Position): Position {
  return {
    left: clamp(position.left, 8, 92),
    top: clamp(position.top, 8, 90),
  };
}

function clampLocalOffset(position: Position): Position {
  return {
    left: clamp(position.left, -LOCAL_OFFSET_LIMIT, LOCAL_OFFSET_LIMIT),
    top: clamp(position.top, -LOCAL_OFFSET_LIMIT, LOCAL_OFFSET_LIMIT),
  };
}

function canDragPlanetLayout(pointerType: string) {
  return pointerType === "mouse" || pointerType === "pen" || pointerType === "touch";
}

function addOffset(position: Position, offset: Position): Position {
  return clampStagePosition({
    left: position.left + offset.left,
    top: position.top + offset.top,
  });
}

function subtractOffset(position: Position, anchor: Position): Position {
  return clampLocalOffset({
    left: position.left - anchor.left,
    top: position.top - anchor.top,
  });
}

function getPlanetPosition(planetCode: PlanetCode): Position {
  const stage = PLANET_STAGE[planetCode];
  return {
    left: clamp(Number.parseFloat(stage.left), 8, 90),
    top: clamp(Number.parseFloat(stage.top), 8, 86),
  };
}

function getDefaultGalaxyLayout(): GalaxyLayout {
  return PLANET_CODES.reduce((acc, planetCode) => {
    return {
      ...acc,
      [planetNodeId(planetCode)]: getPlanetPosition(planetCode),
    };
  }, {} as GalaxyLayout);
}

function isSavedPlanetPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") {
    return false;
  }

  const position = value as Partial<Position>;
  return (
    typeof position.left === "number" &&
    Number.isFinite(position.left) &&
    typeof position.top === "number" &&
    Number.isFinite(position.top)
  );
}

function readSavedLayout(): GalaxyLayout {
  const defaultLayout = getDefaultGalaxyLayout();

  if (typeof window === "undefined") {
    return defaultLayout;
  }

  try {
    const rawLayout = window.localStorage.getItem(PLANET_LAYOUT_STORAGE_KEY);
    if (!rawLayout) {
      return defaultLayout;
    }

    const parsed = JSON.parse(rawLayout) as Record<string, unknown>;
    return Object.entries(parsed).reduce((acc, [nodeId, savedPosition]) => {
      if (isGalaxyNodeId(nodeId) && isSavedPlanetPosition(savedPosition)) {
        acc[nodeId] = nodeId.startsWith("planet:")
          ? clampStagePosition(savedPosition)
          : clampLocalOffset(savedPosition);
      }
      return acc;
    }, { ...defaultLayout });
  } catch {
    return defaultLayout;
  }
}

function writeSavedLayout(layout: GalaxyLayout) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PLANET_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Dragging still works for the current session if browser storage is unavailable.
  }
}

function getLayoutPosition(layout: GalaxyLayout, nodeId: GalaxyNodeId, fallback: Position): Position {
  return layout[nodeId] ?? fallback;
}

function rotatePosition(position: Position, angle: number): Position {
  const x = position.left - 50;
  const y = position.top - 50;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    left: clamp(50 + x * cos - y * sin, 8, 92),
    top: clamp(50 + x * sin + y * cos, 8, 90),
  };
}

function getOrbitPosition(position: Position, orbitAngle: number): Position {
  return rotatePosition(position, orbitAngle);
}

function parseSelectedHub(selectedNode: GalaxyNodeId, selectedPlanet: PlanetCode): HubKind | null {
  if (selectedNode.startsWith(`hub:${selectedPlanet}:`)) {
    return selectedNode.split(":")[2] as HubKind;
  }
  if (selectedNode.startsWith("quest:")) {
    return "quests";
  }
  if (selectedNode.startsWith("game:")) {
    return "games";
  }
  return null;
}

function shouldLightNode(nodeId: GalaxyNodeId, selectedNode: GalaxyNodeId, selectedPlanet: PlanetCode) {
  if (nodeId === planetNodeId(selectedPlanet)) {
    return true;
  }

  if (selectedNode === planetNodeId(selectedPlanet)) {
    return nodeId.startsWith(`hub:${selectedPlanet}:`);
  }

  const selectedHub = parseSelectedHub(selectedNode, selectedPlanet);
  if (!selectedHub) {
    return false;
  }

  if (nodeId === hubNodeId(selectedPlanet, selectedHub)) {
    return true;
  }

  if (selectedHub === "quests" && selectedNode === hubNodeId(selectedPlanet, "quests")) {
    return nodeId.startsWith("quest:");
  }

  if (selectedHub === "games" && selectedNode === hubNodeId(selectedPlanet, "games")) {
    return nodeId.startsWith("game:");
  }

  return nodeId === selectedNode;
}

function getPlanetSize(planet: PlanetProgress | undefined, planetCode: PlanetCode, planetMastery: PlanetMasteryMap) {
  const stage = PLANET_STAGE[planetCode];
  const levelGrowth = Math.min(Math.max((planet?.level ?? 1) - 1, 0) * 1.5, 26);
  const xpGrowth = Math.min(Math.floor((planet?.xp ?? 0) / 1200), 12);
  const masteryGrowth = Math.min((planetMastery[planetCode] ?? 0) * 1.7, 20);
  return stage.size + levelGrowth + xpGrowth + masteryGrowth;
}

function getQuestProgress(quest: QuestItem) {
  if (quest.threshold <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((quest.current_value / quest.threshold) * 100));
}

export function GalaxyStage({
  planets,
  selectedPlanet,
  planetMastery,
  unlockedPlanets,
  quests = [],
  spendPending = false,
  onSelect,
  onLockedSelect,
  onRunSpend,
  onOpenQuest,
  onOpenGame,
}: {
  planets: PlanetProgress[];
  selectedPlanet: PlanetCode;
  planetMastery: PlanetMasteryMap;
  unlockedPlanets: PlanetUnlockMap;
  quests?: QuestItem[];
  spendPending?: boolean;
  onSelect: (planetCode: PlanetCode) => void;
  onLockedSelect?: (planetCode: PlanetCode) => void;
  onRunSpend: (planetCode: PlanetCode, amount: number) => void;
  onOpenQuest: (questId: string) => void;
  onOpenGame: (route: string) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GalaxyNodeId>(() => planetNodeId(selectedPlanet));
  const [expandedPlanet, setExpandedPlanet] = useState<PlanetCode | null>(null);
  const [nodeLayout, setNodeLayout] = useState<GalaxyLayout>(() => readSavedLayout());
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState<GalaxyNodeId | null>(null);
  const [manualLayoutMode, setManualLayoutMode] = useState(false);
  const [spendAmount, setSpendAmount] = useState("120");
  const orbitAngle = 0;
  const nodeLayoutRef = useRef(nodeLayout);
  const lastSelectedPlanetRef = useRef(selectedPlanet);
  const skipNodeClickRef = useRef(false);
  const nodeDragRef = useRef<{
    nodeId: GalaxyNodeId;
    pointerId: number;
    startX: number;
    startY: number;
    anchorPosition: Position | null;
    pendingPosition: Position | null;
    animationFrame: number | null;
    stageRect: DOMRect;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (lastSelectedPlanetRef.current !== selectedPlanet) {
      setSelectedNode(planetNodeId(selectedPlanet));
      setExpandedPlanet(null);
      setPanOffset({ x: 0, y: 0 });
      setManualLayoutMode(false);
      lastSelectedPlanetRef.current = selectedPlanet;
    }
  }, [selectedPlanet]);

  useEffect(() => {
    nodeLayoutRef.current = nodeLayout;
  }, [nodeLayout]);

  const planetByCode = useMemo(
    () =>
      planets.reduce(
        (acc, planet) => {
          acc[planet.planet_code] = planet;
          return acc;
        },
        {} as Partial<Record<PlanetCode, PlanetProgress>>,
      ),
    [planets],
  );

  const selectedPlanetNodeId = planetNodeId(selectedPlanet);
  const selectedPlanetBasePosition = getLayoutPosition(
    nodeLayout,
    selectedPlanetNodeId,
    getPlanetPosition(selectedPlanet),
  );
  const selectedPlanetPosition = getOrbitPosition(selectedPlanetBasePosition, orbitAngle);
  const isPlanetExpanded = expandedPlanet === selectedPlanet;
  const selectedHub = isPlanetExpanded ? parseSelectedHub(selectedNode, selectedPlanet) : null;
  const hubOffsets = useMemo(
    () =>
      ({
        spend: getLayoutPosition(nodeLayout, hubNodeId(selectedPlanet, "spend"), HUB_OFFSETS.spend),
        quests: getLayoutPosition(nodeLayout, hubNodeId(selectedPlanet, "quests"), HUB_OFFSETS.quests),
        games: getLayoutPosition(nodeLayout, hubNodeId(selectedPlanet, "games"), HUB_OFFSETS.games),
      }) satisfies Record<HubKind, Position>,
    [nodeLayout, selectedPlanet],
  );
  const hubBasePositions = useMemo(
    () =>
      ({
        spend: addOffset(selectedPlanetBasePosition, hubOffsets.spend),
        quests: addOffset(selectedPlanetBasePosition, hubOffsets.quests),
        games: addOffset(selectedPlanetBasePosition, hubOffsets.games),
      }) satisfies Record<HubKind, Position>,
    [hubOffsets, selectedPlanetBasePosition.left, selectedPlanetBasePosition.top],
  );
  const hubPositions = useMemo(
    () =>
      ({
        spend: getOrbitPosition(hubBasePositions.spend, orbitAngle),
        quests: getOrbitPosition(hubBasePositions.quests, orbitAngle),
        games: getOrbitPosition(hubBasePositions.games, orbitAngle),
      }) satisfies Record<HubKind, Position>,
    [hubBasePositions, orbitAngle],
  );
  const selectedQuests = useMemo(
    () => quests.filter((quest) => quest.planet_code === selectedPlanet).slice(0, 3),
    [quests, selectedPlanet],
  );
  const selectedGames = useMemo(
    () => MINI_GAMES.filter((game) => game.planetCode === selectedPlanet).slice(0, 3),
    [selectedPlanet],
  );
  const questPositions = useMemo(
    () =>
      selectedQuests.map((quest, index) => ({
        quest,
        position: addOffset(
          hubPositions.quests,
          getLayoutPosition(nodeLayout, questNodeId(quest.quest_id), QUEST_OFFSETS[index] ?? QUEST_OFFSETS[0]),
        ),
      })),
    [hubPositions.quests, nodeLayout, selectedQuests],
  );
  const gamePositions = useMemo(
    () =>
      selectedGames.map((game, index) => ({
        game,
        position: addOffset(
          hubPositions.games,
          getLayoutPosition(nodeLayout, gameNodeId(game.code), GAME_OFFSETS[index] ?? GAME_OFFSETS[0]),
        ),
      })),
    [hubPositions.games, nodeLayout, selectedGames],
  );
  const selectedQuest = isPlanetExpanded && selectedNode.startsWith("quest:")
    ? selectedQuests.find((quest) => questNodeId(quest.quest_id) === selectedNode)
    : undefined;
  const selectedGame = isPlanetExpanded && selectedNode.startsWith("game:")
    ? selectedGames.find((game) => gameNodeId(game.code) === selectedNode)
    : undefined;
  const selectedDetailPosition =
    selectedQuest
      ? questPositions.find((item) => item.quest.quest_id === selectedQuest.quest_id)?.position
      : selectedGame
        ? gamePositions.find((item) => item.game.code === selectedGame.code)?.position
        : selectedHub
          ? hubPositions[selectedHub]
          : undefined;
  const focusPosition = selectedDetailPosition ?? selectedPlanetPosition;
  const hasFocusedNode = Boolean(selectedHub || selectedQuest || selectedGame);
  const shouldFocusSelectedNode = isPlanetExpanded && !manualLayoutMode && hasFocusedNode;
  const zoom = manualLayoutMode
    ? 1
    : selectedQuest || selectedGame
      ? 1.48
      : selectedHub
        ? 1.3
        : isPlanetExpanded
          ? 1.08
          : 1;
  const focusX = shouldFocusSelectedNode ? `calc(${50 - focusPosition.left}% + ${panOffset.x}px)` : `${panOffset.x}px`;
  const focusY = shouldFocusSelectedNode ? `calc(${50 - focusPosition.top}% + ${panOffset.y}px)` : `${panOffset.y}px`;

  function getFocusedNodeOpacity(lit: boolean, active: boolean) {
    if (active) {
      return 1;
    }
    if (lit) {
      return hasFocusedNode ? 0.76 : 1;
    }
    return hasFocusedNode ? 0.1 : 0.26;
  }

  function resetPan() {
    setPanOffset({ x: 0, y: 0 });
  }

  function selectPlanetNode(planetCode: PlanetCode) {
    if (skipNodeClickRef.current) {
      return;
    }
    if (!isPlanetUnlocked(unlockedPlanets, planetCode)) {
      setSelectedNode(planetNodeId(planetCode));
      setExpandedPlanet(null);
      setManualLayoutMode(false);
      resetPan();
      onLockedSelect?.(planetCode);
      return;
    }

    lastSelectedPlanetRef.current = planetCode;
    setSelectedNode(planetNodeId(planetCode));
    setExpandedPlanet(planetCode);
    setManualLayoutMode(false);
    resetPan();
    onSelect(planetCode);
  }

  function selectHubNode(kind: HubKind) {
    if (skipNodeClickRef.current) {
      return;
    }

    setSelectedNode(hubNodeId(selectedPlanet, kind));
    setManualLayoutMode(false);
    resetPan();
  }

  function selectDetailNode(nodeId: GalaxyNodeId) {
    if (skipNodeClickRef.current) {
      return;
    }

    setSelectedNode(nodeId);
    setManualLayoutMode(false);
    resetPan();
  }

  function getNodeAnchorPosition(nodeId: GalaxyNodeId): Position | null {
    if (nodeId.startsWith("planet:")) {
      return null;
    }

    if (nodeId.startsWith(`hub:${selectedPlanet}:`)) {
      return selectedPlanetBasePosition;
    }

    if (nodeId.startsWith("quest:")) {
      return hubBasePositions.quests;
    }

    if (nodeId.startsWith("game:")) {
      return hubBasePositions.games;
    }

    return null;
  }

  function applyDraggedNodePosition(
    drag: NonNullable<typeof nodeDragRef.current>,
    basePosition: Position,
  ) {
    const nextLayout: GalaxyLayout = {
      ...nodeLayoutRef.current,
      [drag.nodeId]: drag.anchorPosition ? subtractOffset(basePosition, drag.anchorPosition) : clampStagePosition(basePosition),
    };
    nodeLayoutRef.current = nextLayout;
    setNodeLayout(nextLayout);
  }

  function flushPendingDragPosition(drag: NonNullable<typeof nodeDragRef.current>) {
    if (drag.animationFrame !== null) {
      window.cancelAnimationFrame(drag.animationFrame);
      drag.animationFrame = null;
    }

    if (!drag.pendingPosition) {
      return;
    }

    const nextPosition = drag.pendingPosition;
    drag.pendingPosition = null;
    applyDraggedNodePosition(drag, nextPosition);
  }

  function scheduleDragFrame(drag: NonNullable<typeof nodeDragRef.current>) {
    if (drag.animationFrame !== null) {
      return;
    }

    drag.animationFrame = window.requestAnimationFrame(() => {
      const currentDrag = nodeDragRef.current;
      if (!currentDrag) {
        return;
      }

      currentDrag.animationFrame = null;
      if (!currentDrag.pendingPosition) {
        return;
      }

      const nextPosition = currentDrag.pendingPosition;
      currentDrag.pendingPosition = null;
      applyDraggedNodePosition(currentDrag, nextPosition);
    });
  }

  function handleNodePointerDown(event: PointerEvent<HTMLButtonElement>, nodeId: GalaxyNodeId, position: Position) {
    if (event.button !== 0 || !canDragPlanetLayout(event.pointerType)) {
      return;
    }
    const draggedPlanet = getPlanetCodeFromNodeId(nodeId);
    if (draggedPlanet && !isPlanetUnlocked(unlockedPlanets, draggedPlanet)) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    const stageElement = stageRef.current;
    if (!stageElement) {
      return;
    }

    nodeDragRef.current = {
      nodeId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      anchorPosition: getNodeAnchorPosition(nodeId),
      pendingPosition: null,
      animationFrame: null,
      stageRect: stageElement.getBoundingClientRect(),
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingNode(nodeId);
  }

  function handleNodePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance <= PLANET_DRAG_CLICK_THRESHOLD && !drag.moved) {
      return;
    }

    if (!drag.moved) {
      drag.moved = true;
      setManualLayoutMode(true);
      const draggedPlanet = getPlanetCodeFromNodeId(drag.nodeId);
      if (draggedPlanet) {
        lastSelectedPlanetRef.current = draggedPlanet;
        setExpandedPlanet(draggedPlanet);
        onSelect(draggedPlanet);
      }
    }

    const worldRect = drag.stageRect;
    const visualPosition = {
      left: clamp(((event.clientX - worldRect.left) / worldRect.width) * 100, 8, 92),
      top: clamp(((event.clientY - worldRect.top) / worldRect.height) * 100, 8, 90),
    };
    const basePosition = clampStagePosition(rotatePosition(visualPosition, -orbitAngle));
    drag.pendingPosition = basePosition;
    scheduleDragFrame(drag);
  }

  function handleNodePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    flushPendingDragPosition(drag);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      skipNodeClickRef.current = true;
      window.setTimeout(() => {
        skipNodeClickRef.current = false;
      }, 0);
    }
    writeSavedLayout(nodeLayoutRef.current);
    nodeDragRef.current = null;
    setDraggingNode(null);
  }

  function submitSpend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number.parseFloat(spendAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    onRunSpend(selectedPlanet, amount);
  }

  function renderStatusText(quest: QuestItem) {
    if (quest.status === "completed") {
      return "Готово";
    }
    if (quest.status === "claimed") {
      return "Получено";
    }
    return `${quest.current_value}/${quest.threshold}`;
  }

  return (
    <div
      ref={stageRef}
      className={`galaxy-stage ${hasFocusedNode ? "galaxy-stage--focused" : ""}`}
      aria-label="Интерактивная карта галактики. Перетаскивайте большие планеты, чтобы менять их положение."
    >
      <div className="galaxy-stage__orbits">
        <div className="galaxy-stage__orbit galaxy-stage__orbit--one" />
        <div className="galaxy-stage__orbit galaxy-stage__orbit--two" />
        <div className="galaxy-stage__orbit galaxy-stage__orbit--three" />
      </div>

      <motion.div
        ref={worldRef}
        className="galaxy-stage__world"
        animate={{ x: focusX, y: focusY, scale: zoom }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {isPlanetExpanded ? (
          <div
            className="galaxy-stage__satellite-orbit galaxy-stage__satellite-orbit--planet"
            style={{ top: `${selectedPlanetPosition.top}%`, left: `${selectedPlanetPosition.left}%` }}
            aria-hidden="true"
          />
        ) : null}
        {isPlanetExpanded && selectedHub === "quests" ? (
          <div
            className="galaxy-stage__satellite-orbit galaxy-stage__satellite-orbit--detail"
            style={{ top: `${hubPositions.quests.top}%`, left: `${hubPositions.quests.left}%` }}
            aria-hidden="true"
          />
        ) : null}
        {isPlanetExpanded && selectedHub === "games" ? (
          <div
            className="galaxy-stage__satellite-orbit galaxy-stage__satellite-orbit--detail"
            style={{ top: `${hubPositions.games.top}%`, left: `${hubPositions.games.left}%` }}
            aria-hidden="true"
          />
        ) : null}

        {isPlanetExpanded ? (
          <svg className="galaxy-stage__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {(["spend", "quests", "games"] as HubKind[]).map((kind) => (
              <line
                key={kind}
                className="galaxy-stage__link"
                x1={selectedPlanetPosition.left}
                y1={selectedPlanetPosition.top}
                x2={hubPositions[kind].left}
                y2={hubPositions[kind].top}
              />
            ))}
            {selectedHub === "quests"
              ? questPositions.map(({ quest, position }) => (
                  <line
                    key={quest.quest_id}
                    className="galaxy-stage__link galaxy-stage__link--branch"
                    x1={hubPositions.quests.left}
                    y1={hubPositions.quests.top}
                    x2={position.left}
                    y2={position.top}
                  />
                ))
              : null}
            {selectedHub === "games"
              ? gamePositions.map(({ game, position }) => (
                  <line
                    key={game.code}
                    className="galaxy-stage__link galaxy-stage__link--branch"
                    x1={hubPositions.games.left}
                    y1={hubPositions.games.top}
                    x2={position.left}
                    y2={position.top}
                  />
                ))
              : null}
          </svg>
        ) : null}

        {PLANET_CODES.map((planetCode) => {
          const planet = planetByCode[planetCode];
          const nodeId = planetNodeId(planetCode);
          const position = getOrbitPosition(
            getLayoutPosition(nodeLayout, nodeId, getPlanetPosition(planetCode)),
            orbitAngle,
          );
          const locked = !isPlanetUnlocked(unlockedPlanets, planetCode);
          const active = selectedPlanet === planetCode && !locked;
          const nodeActive = selectedNode === nodeId;
          const lit = shouldLightNode(nodeId, selectedNode, selectedPlanet);
          const planetSize = getPlanetSize(planet, planetCode, planetMastery);

          return (
            <motion.button
              key={planetCode}
              aria-label={locked ? `${PLANET_META[planetCode].title}: планета закрыта` : PLANET_META[planetCode].title}
              whileHover={locked ? undefined : { scale: active ? 1.02 : 1.04 }}
              whileTap={locked ? undefined : { scale: 0.98 }}
              onClick={() => selectPlanetNode(planetCode)}
              onPointerCancel={handleNodePointerUp}
              onPointerDown={(event) => handleNodePointerDown(event, nodeId, position)}
              onPointerMove={handleNodePointerMove}
              onPointerUp={handleNodePointerUp}
              className={`galaxy-stage__planet ${active ? "galaxy-stage__planet--active" : ""} ${
                locked ? "galaxy-stage__planet--locked" : ""
              } ${
                nodeActive ? "galaxy-stage__node--active" : ""
              } ${
                draggingNode === nodeId ? "galaxy-stage__planet--dragging galaxy-stage__node--dragging" : ""
              } ${
                lit ? "galaxy-stage__node--lit" : "galaxy-stage__node--muted"
              }`}
              style={{
                top: `${position.top}%`,
                left: `${position.left}%`,
              }}
              type="button"
            >
              <PlanetVisual
                hue={locked ? "linear-gradient(135deg, #6f7684, #323844)" : PLANET_STAGE[planetCode].hue}
                size={planetSize}
                glow={locked ? 0.06 : active ? 0.55 : 0.16}
              />
              <div className="galaxy-stage__label">
                <span>{PLANET_META[planetCode].title}</span>
                <strong>{locked ? "Закрыта" : `Ур. ${planet?.level ?? 1} · ${planetMastery[planetCode] ?? 0}/12`}</strong>
              </div>
              {locked ? <em className="galaxy-stage__lock-hint">{PLANET_UNLOCK_REQUIREMENTS[planetCode]}</em> : null}
            </motion.button>
          );
        })}

        <AnimatePresence>
          {isPlanetExpanded
            ? (["spend", "quests", "games"] as HubKind[]).map((kind) => {
                const nodeId = hubNodeId(selectedPlanet, kind);
                const position = hubPositions[kind];
                const lit = shouldLightNode(nodeId, selectedNode, selectedPlanet);
                const active = selectedNode === nodeId;

                return (
                  <motion.button
                    key={kind}
                    initial={{ opacity: 0, scale: 0.72 }}
                    animate={{ opacity: getFocusedNodeOpacity(lit, active), scale: active ? 1.06 : 1 }}
                    exit={{ opacity: 0, scale: 0.66 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectHubNode(kind)}
                    onPointerCancel={handleNodePointerUp}
                    onPointerDown={(event) => handleNodePointerDown(event, nodeId, position)}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    className={`galaxy-stage__moon galaxy-stage__moon--${kind} ${active ? "galaxy-stage__moon--active" : ""} ${
                      active ? "galaxy-stage__node--active" : ""
                    } ${
                      draggingNode === nodeId ? "galaxy-stage__node--dragging" : ""
                    } ${
                      lit ? "galaxy-stage__node--lit" : "galaxy-stage__node--muted"
                    }`}
                    style={{ top: `${position.top}%`, left: `${position.left}%` }}
                    type="button"
                  >
                    <span>{HUB_META[kind].short}</span>
                    <strong>{HUB_META[kind].title}</strong>
                  </motion.button>
                );
              })
            : null}
        </AnimatePresence>

        <AnimatePresence>
          {isPlanetExpanded && selectedHub === "quests"
            ? questPositions.map(({ quest, position }) => {
                const nodeId = questNodeId(quest.quest_id);
                const lit = shouldLightNode(nodeId, selectedNode, selectedPlanet);
                const active = selectedNode === nodeId;

                return (
                  <motion.button
                    key={quest.quest_id}
                    initial={{ opacity: 0, scale: 0.56 }}
                    animate={{ opacity: getFocusedNodeOpacity(lit, active), scale: active ? 1.08 : 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectDetailNode(nodeId)}
                    onPointerCancel={handleNodePointerUp}
                    onPointerDown={(event) => handleNodePointerDown(event, nodeId, position)}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    className={`galaxy-stage__micro galaxy-stage__micro--quest ${active ? "galaxy-stage__micro--active" : ""} ${
                      active ? "galaxy-stage__node--active" : ""
                    } ${
                      draggingNode === nodeId ? "galaxy-stage__node--dragging" : ""
                    } ${
                      lit ? "galaxy-stage__node--lit" : "galaxy-stage__node--muted"
                    }`}
                    style={{ top: `${position.top}%`, left: `${position.left}%` }}
                    type="button"
                  >
                    <span>{getQuestProgress(quest)}%</span>
                    <strong>{quest.title}</strong>
                  </motion.button>
                );
              })
            : null}

          {isPlanetExpanded && selectedHub === "games"
            ? gamePositions.map(({ game, position }) => {
                const nodeId = gameNodeId(game.code);
                const lit = shouldLightNode(nodeId, selectedNode, selectedPlanet);
                const active = selectedNode === nodeId;

                return (
                  <motion.button
                    key={game.code}
                    initial={{ opacity: 0, scale: 0.56 }}
                    animate={{ opacity: getFocusedNodeOpacity(lit, active), scale: active ? 1.08 : 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectDetailNode(nodeId)}
                    onPointerCancel={handleNodePointerUp}
                    onPointerDown={(event) => handleNodePointerDown(event, nodeId, position)}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    className={`galaxy-stage__micro galaxy-stage__micro--game ${active ? "galaxy-stage__micro--active" : ""} ${
                      active ? "galaxy-stage__node--active" : ""
                    } ${
                      draggingNode === nodeId ? "galaxy-stage__node--dragging" : ""
                    } ${
                      lit ? "galaxy-stage__node--lit" : "galaxy-stage__node--muted"
                    }`}
                    style={{ top: `${position.top}%`, left: `${position.left}%` }}
                    type="button"
                  >
                    <span>Играть</span>
                    <strong>{game.title}</strong>
                  </motion.button>
                );
              })
            : null}
        </AnimatePresence>

      </motion.div>

      <AnimatePresence mode="wait">
        {selectedHub || selectedQuest || selectedGame ? (
          <motion.div
            key={selectedNode}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className="galaxy-stage__node-panel"
          >
            {selectedHub === "spend" && !selectedQuest && !selectedGame ? (
              <form onSubmit={submitSpend}>
                <p className="eyebrow">Статистика {PLANET_ACTION_KIND[selectedPlanet]}</p>
                <h4>{HUB_META.spend.title}</h4>
                <p>{HUB_META.spend.detail}</p>
                <label className="galaxy-stage__field">
                  Сумма
                  <input
                    inputMode="decimal"
                    min="1"
                    onChange={(event) => setSpendAmount(event.target.value)}
                    type="number"
                    value={spendAmount}
                  />
                </label>
                <button className="primary-button" disabled={spendPending} type="submit">
                  {spendPending ? "Записываем..." : "Записать траты"}
                </button>
              </form>
            ) : null}

            {selectedHub === "quests" && !selectedQuest ? (
              <>
                <p className="eyebrow">Квестовые спутники</p>
                <h4>{HUB_META.quests.title}</h4>
                <p>
                  {selectedQuests.length
                    ? "Выберите маленькую планету квеста, чтобы приблизиться к ней и открыть действие."
                    : "Для этой планеты пока нет активных квестов."}
                </p>
              </>
            ) : null}

            {selectedQuest ? (
              <>
                <p className="eyebrow">Квест · {renderStatusText(selectedQuest)}</p>
                <h4>{selectedQuest.title}</h4>
                <p>{selectedQuest.description}</p>
                <button className="primary-button" onClick={() => onOpenQuest(selectedQuest.quest_id)} type="button">
                  Начать квест
                </button>
              </>
            ) : null}

            {selectedHub === "games" && !selectedGame ? (
              <>
                <p className="eyebrow">Игровые спутники</p>
                <h4>{HUB_META.games.title}</h4>
                <p>Выберите маленькую планету игры, чтобы приблизиться к ней и открыть запуск.</p>
              </>
            ) : null}

            {selectedGame ? (
              <GamePanel game={selectedGame} onOpenGame={onOpenGame} />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GamePanel({ game, onOpenGame }: { game: MiniGameMeta; onOpenGame: (route: string) => void }) {
  return (
    <>
      <p className="eyebrow">Игра</p>
      <h4>{game.title}</h4>
      <p>{game.detail}</p>
      <button className="primary-button" onClick={() => onOpenGame(game.route)} type="button">
        Начать игру
      </button>
    </>
  );
}
