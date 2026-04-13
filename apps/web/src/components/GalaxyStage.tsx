import type { PlanetCode, PlanetProgress } from "@mtb/contracts";
import { motion } from "framer-motion";
import { PLANET_META } from "@mtb/contracts";
import { PLANET_STAGE } from "@/lib/game-config";
import { PlanetVisual } from "@/components/PlanetVisual";

export function GalaxyStage({
  planets,
  selectedPlanet,
  onSelect,
}: {
  planets: PlanetProgress[];
  selectedPlanet: PlanetCode;
  onSelect: (planetCode: PlanetCode) => void;
}) {
  return (
    <div className="galaxy-stage">
      <div className="galaxy-stage__orbits">
        <div className="galaxy-stage__orbit galaxy-stage__orbit--one" />
        <div className="galaxy-stage__orbit galaxy-stage__orbit--two" />
        <div className="galaxy-stage__orbit galaxy-stage__orbit--three" />
      </div>
      {planets.map((planet) => {
        const stage = PLANET_STAGE[planet.planet_code];
        const active = selectedPlanet === planet.planet_code;
        const stagePad = 56;
        return (
          <motion.button
            key={planet.planet_code}
            layout
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(planet.planet_code)}
            className={`galaxy-stage__planet galaxy-stage__planet--${planet.planet_code.toLowerCase().replace("_", "-")} ${
              active ? "galaxy-stage__planet--active" : ""
            }`}
            style={{
              top: `calc(${stage.top} - ${stagePad}px)`,
              left: `calc(${stage.left} - ${stagePad}px)`,
              width: stage.size + stagePad * 2,
              height: stage.size + stagePad * 2,
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
