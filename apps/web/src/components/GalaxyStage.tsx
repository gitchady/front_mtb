import type { PlanetCode, PlanetProgress } from "@mtb/contracts";
import { motion } from "framer-motion";
import { PLANET_META } from "@mtb/contracts";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { PLANET_STAGE } from "@/lib/game-config";
import { PlanetVisual } from "@/components/PlanetVisual";

type PlanetLayout = Record<PlanetCode, { left: number; top: number }>;

const PLANET_LAYOUT_STORAGE_KEY = "mtb-galaxy-planet-layout-v1";
const PLANET_STAGE_PAD = 48;
const DRAG_CLICK_THRESHOLD = 4;
const DRAG_BOUNDARY_GUTTER = 16;
const ORBIT_TICK_MS = 80;
const ORBIT_MOTION: Record<PlanetCode, { radiusX: number; radiusY: number; duration: number; phase: number }> = {
  ORBIT_COMMERCE: { radiusX: 2.1, radiusY: 1.25, duration: 76000, phase: 0.2 },
  CREDIT_SHIELD: { radiusX: 1.65, radiusY: 1.8, duration: 88000, phase: 2.4 },
  SOCIAL_RING: { radiusX: 1.95, radiusY: 1.35, duration: 94000, phase: 4.1 },
};

const DEFAULT_PLANET_LAYOUT = Object.entries(PLANET_STAGE).reduce((acc, [planetCode, stage]) => {
  acc[planetCode as PlanetCode] = {
    left: Number.parseFloat(stage.left),
    top: Number.parseFloat(stage.top),
  };
  return acc;
}, {} as PlanetLayout);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isSavedPlanetPosition(value: unknown): value is { left: number; top: number } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const position = value as { left?: unknown; top?: unknown };
  return (
    typeof position.left === "number" &&
    Number.isFinite(position.left) &&
    typeof position.top === "number" &&
    Number.isFinite(position.top)
  );
}

function readSavedPlanetPosition(parsed: Partial<Record<PlanetCode, unknown>>, planetCode: PlanetCode) {
  const savedPosition = parsed[planetCode];
  return isSavedPlanetPosition(savedPosition) ? savedPosition : DEFAULT_PLANET_LAYOUT[planetCode];
}

function readSavedLayout(): PlanetLayout {
  if (typeof window === "undefined") {
    return DEFAULT_PLANET_LAYOUT;
  }

  try {
    const raw = window.localStorage.getItem(PLANET_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PLANET_LAYOUT;
    }

    const parsed = JSON.parse(raw) as Partial<Record<PlanetCode, unknown>>;
    return {
      ORBIT_COMMERCE: readSavedPlanetPosition(parsed, "ORBIT_COMMERCE"),
      CREDIT_SHIELD: readSavedPlanetPosition(parsed, "CREDIT_SHIELD"),
      SOCIAL_RING: readSavedPlanetPosition(parsed, "SOCIAL_RING"),
    };
  } catch {
    return DEFAULT_PLANET_LAYOUT;
  }
}

function getOrbitOffset(planetCode: PlanetCode, orbitTime: number | null) {
  if (orbitTime === null) {
    return { left: 0, top: 0 };
  }

  const motion = ORBIT_MOTION[planetCode];
  const angle = (orbitTime / motion.duration) * Math.PI * 2 + motion.phase;
  return {
    left: Math.cos(angle) * motion.radiusX,
    top: Math.sin(angle) * motion.radiusY,
  };
}

function getOrbitingPosition(planetCode: PlanetCode, position: { left: number; top: number }, orbitTime: number | null) {
  const offset = getOrbitOffset(planetCode, orbitTime);
  return {
    left: clamp(position.left + offset.left, 2, 98),
    top: clamp(position.top + offset.top, 2, 98),
  };
}

export function GalaxyStage({
  planets,
  selectedPlanet,
  onSelect,
}: {
  planets: PlanetProgress[];
  selectedPlanet: PlanetCode;
  onSelect: (planetCode: PlanetCode) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    planetCode: PlanetCode;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
    minLeft: number;
    maxLeft: number;
    minTop: number;
    maxTop: number;
  } | null>(null);
  const skipClickRef = useRef(false);
  const [layout, setLayout] = useState<PlanetLayout>(() => readSavedLayout());
  const [draggingPlanet, setDraggingPlanet] = useState<PlanetCode | null>(null);
  const [orbitTime, setOrbitTime] = useState<number | null>(null);
  const orderedPlanets = useMemo(() => planets, [planets]);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotionQuery.matches) {
      return;
    }

    let animationFrame = 0;
    let lastTick = 0;

    const animate = (time: number) => {
      if (time - lastTick >= ORBIT_TICK_MS) {
        setOrbitTime(time);
        lastTick = time;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PLANET_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // Planet dragging still works for the current session if browser storage is unavailable.
    }
  }, [layout]);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, planetCode: PlanetCode) {
    if (event.button !== 0) {
      return;
    }

    const stageElement = stageRef.current;
    if (!stageElement) {
      return;
    }

    const stageRect = stageElement.getBoundingClientRect();
    const planetRect = event.currentTarget.getBoundingClientRect();
    const currentLayout = layout[planetCode];
    const currentPosition = getOrbitingPosition(planetCode, currentLayout, orbitTime);
    const anchorX = stageRect.left + (currentPosition.left / 100) * stageRect.width;
    const anchorY = stageRect.top + (currentPosition.top / 100) * stageRect.height;

    setLayout((current) => ({
      ...current,
      [planetCode]: currentPosition,
    }));

    dragRef.current = {
      planetCode,
      pointerId: event.pointerId,
      offsetX: event.clientX - anchorX,
      offsetY: event.clientY - anchorY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      minLeft: (DRAG_BOUNDARY_GUTTER / stageRect.width) * 100,
      maxLeft: ((stageRect.width - DRAG_BOUNDARY_GUTTER - (planetRect.width - PLANET_STAGE_PAD * 2)) / stageRect.width) * 100,
      minTop: (DRAG_BOUNDARY_GUTTER / stageRect.height) * 100,
      maxTop: ((stageRect.height - DRAG_BOUNDARY_GUTTER - (planetRect.height - PLANET_STAGE_PAD * 2)) / stageRect.height) * 100,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingPlanet(planetCode);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const stageElement = stageRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !stageElement) {
      return;
    }

    const stageRect = stageElement.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance > DRAG_CLICK_THRESHOLD) {
      drag.moved = true;
    }

    const left = ((event.clientX - drag.offsetX - stageRect.left) / stageRect.width) * 100;
    const top = ((event.clientY - drag.offsetY - stageRect.top) / stageRect.height) * 100;
    setLayout((current) => ({
      ...current,
      [drag.planetCode]: {
        left: clamp(left, drag.minLeft, drag.maxLeft),
        top: clamp(top, drag.minTop, drag.maxTop),
      },
    }));
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (drag.moved) {
      skipClickRef.current = true;
      window.setTimeout(() => {
        skipClickRef.current = false;
      }, 0);
    }

    const offset = getOrbitOffset(drag.planetCode, orbitTime);
    setLayout((current) => {
      const finalPosition = current[drag.planetCode];
      return {
        ...current,
        [drag.planetCode]: {
          left: clamp(finalPosition.left - offset.left, drag.minLeft, drag.maxLeft),
          top: clamp(finalPosition.top - offset.top, drag.minTop, drag.maxTop),
        },
      };
    });
    dragRef.current = null;
    setDraggingPlanet(null);
  }

  function handleSelect(planetCode: PlanetCode) {
    if (skipClickRef.current) {
      return;
    }
    onSelect(planetCode);
  }

  return (
    <div className="galaxy-stage" ref={stageRef}>
      <div className="galaxy-stage__orbits">
        <div className="galaxy-stage__orbit galaxy-stage__orbit--one" />
        <div className="galaxy-stage__orbit galaxy-stage__orbit--two" />
        <div className="galaxy-stage__orbit galaxy-stage__orbit--three" />
      </div>
      {orderedPlanets.map((planet) => {
        const stage = PLANET_STAGE[planet.planet_code];
        const active = selectedPlanet === planet.planet_code;
        const dragging = draggingPlanet === planet.planet_code;
        const planetPosition = dragging
          ? layout[planet.planet_code]
          : getOrbitingPosition(planet.planet_code, layout[planet.planet_code], orbitTime);
        return (
          <motion.button
            key={planet.planet_code}
            whileHover={dragging ? undefined : { scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onPointerDown={(event) => handlePointerDown(event, planet.planet_code)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={() => handleSelect(planet.planet_code)}
            className={`galaxy-stage__planet galaxy-stage__planet--${planet.planet_code.toLowerCase().replace("_", "-")} ${
              active ? "galaxy-stage__planet--active" : ""
            } ${dragging ? "galaxy-stage__planet--dragging" : ""}`}
            style={{
              top: `calc(${planetPosition.top}% - ${PLANET_STAGE_PAD}px)`,
              left: `calc(${planetPosition.left}% - ${PLANET_STAGE_PAD}px)`,
              width: stage.size + PLANET_STAGE_PAD * 2,
              height: stage.size + PLANET_STAGE_PAD * 2,
            }}
          >
            <PlanetVisual hue={stage.hue} size={stage.size} glow={active ? 0.4 : 0.25} />
            <div className="galaxy-stage__label">
              <span>{PLANET_META[planet.planet_code].title}</span>
              <strong>Ур. {planet.level}</strong>
            </div>
          </motion.button>
        );
      })}
      <div className="galaxy-stage__core">
        <span>MTB</span>
        <strong>Ядро</strong>
      </div>
    </div>
  );
}
