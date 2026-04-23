import type { Fe2Constellation } from "@/lib/fe2-api";

export function ConstellationCanvas({
  constellation,
  burst,
}: {
  constellation: Fe2Constellation;
  burst?: boolean;
}) {
  const activeBigStars = constellation.big_stars.filter((star) => star.lit).length;
  const activeSmallStars = constellation.small_stars.filter((star) => star.lit).length;
  const starById = new Map([...constellation.big_stars, ...constellation.small_stars].map((star) => [star.id, star]));

  return (
    <div className={`constellation-canvas ${burst ? "constellation-canvas--burst" : ""}`}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Созвездие ${constellation.name}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id={`constellation-glow-${constellation.index}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {constellation.connections.map(([fromId, toId]) => {
          const fromStar = starById.get(fromId);
          const toStar = starById.get(toId);
          if (!fromStar || !toStar) {
            return null;
          }

          const isActive = fromStar.lit && toStar.lit;
          return (
            <line
              key={`${fromId}-${toId}`}
              x1={fromStar.x}
              y1={fromStar.y}
              x2={toStar.x}
              y2={toStar.y}
              stroke={isActive ? "rgba(255,212,79,0.44)" : "rgba(255,255,255,0.2)"}
              strokeDasharray={isActive ? undefined : "3 4"}
              strokeWidth={isActive ? 1.15 : 0.75}
            />
          );
        })}
        {constellation.big_stars.map((star) => (
          <g key={star.id} filter={star.lit ? `url(#constellation-glow-${constellation.index})` : undefined}>
            <circle cx={star.x} cy={star.y} r={star.lit ? 4.8 : 4.2} fill={star.lit ? "#ffd44f" : "rgba(255,255,255,0.22)"} />
            <path
              d={`M ${star.x} ${star.y - 7} L ${star.x + 1.7} ${star.y - 1.9} L ${star.x + 7} ${star.y} L ${star.x + 1.7} ${star.y + 1.9} L ${star.x} ${star.y + 7} L ${star.x - 1.7} ${star.y + 1.9} L ${star.x - 7} ${star.y} L ${star.x - 1.7} ${star.y - 1.9} Z`}
              fill={star.lit ? "rgba(255,212,79,0.82)" : "rgba(255,255,255,0.12)"}
            />
          </g>
        ))}
        {constellation.small_stars.map((star) => (
          <circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.lit ? 1.7 : 1.25}
            fill={star.lit ? "#6df2ff" : "rgba(255,255,255,0.18)"}
          />
        ))}
      </svg>
      <div className="constellation-canvas__stats">
        <span>
          Большие звезды: {activeBigStars}/{constellation.big_stars_total}
        </span>
        <span>
          Малые звезды: {activeSmallStars}/{constellation.small_stars_per_segment}
        </span>
      </div>
    </div>
  );
}
