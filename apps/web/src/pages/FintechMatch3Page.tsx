import { useState } from "react";
import { GameHero, gameReward } from "@/pages/game-page-shared";

const SIZE = 7;
const TILES = ["card", "deposit", "shield", "cashback", "loan"] as const;
type Tile = (typeof TILES)[number];
type Point = { row: number; column: number };

function randomTile(): Tile {
  return TILES[Math.floor(Math.random() * TILES.length)];
}

function makeBoard(): Tile[][] {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, randomTile));
}

function findMatches(board: Tile[][]) {
  const matched = new Set<string>();
  for (let row = 0; row < SIZE; row += 1) {
    let run = 1;
    for (let column = 1; column <= SIZE; column += 1) {
      if (column < SIZE && board[row][column] === board[row][column - 1]) {
        run += 1;
      } else {
        if (run >= 3) {
          for (let offset = 0; offset < run; offset += 1) matched.add(`${row}:${column - 1 - offset}`);
        }
        run = 1;
      }
    }
  }
  for (let column = 0; column < SIZE; column += 1) {
    let run = 1;
    for (let row = 1; row <= SIZE; row += 1) {
      if (row < SIZE && board[row][column] === board[row - 1][column]) {
        run += 1;
      } else {
        if (run >= 3) {
          for (let offset = 0; offset < run; offset += 1) matched.add(`${row - 1 - offset}:${column}`);
        }
        run = 1;
      }
    }
  }
  return matched;
}

function collapseBoard(board: Tile[][], matched: Set<string>) {
  const next = board.map((row) => [...row]);
  for (let column = 0; column < SIZE; column += 1) {
    const kept: Tile[] = [];
    for (let row = SIZE - 1; row >= 0; row -= 1) {
      if (!matched.has(`${row}:${column}`)) kept.push(next[row][column]);
    }
    for (let row = SIZE - 1; row >= 0; row -= 1) {
      next[row][column] = kept[SIZE - 1 - row] ?? randomTile();
    }
  }
  return next;
}

export function FintechMatch3Page() {
  const [board, setBoard] = useState<Tile[][]>(makeBoard);
  const [selected, setSelected] = useState<Point | null>(null);
  const [moves, setMoves] = useState(18);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [status, setStatus] = useState("Меняйте соседние символы местами и собирайте три одинаковых в ряд");
  const baseReward = gameReward(score, 0.7, 6);

  function resetRun() {
    setBoard(makeBoard());
    setSelected(null);
    setMoves(18);
    setScore(0);
    setIsComplete(false);
    setRewardClaimed(false);
    setStatus("Меняйте соседние символы местами и собирайте три одинаковых в ряд");
  }

  function clickTile(point: Point) {
    if (isComplete) return;
    if (!selected) {
      setSelected(point);
      return;
    }
    const isNeighbor = Math.abs(selected.row - point.row) + Math.abs(selected.column - point.column) === 1;
    if (!isNeighbor) {
      setSelected(point);
      return;
    }
    const swapped = board.map((row) => [...row]);
    [swapped[selected.row][selected.column], swapped[point.row][point.column]] = [
      swapped[point.row][point.column],
      swapped[selected.row][selected.column],
    ];
    const matched = findMatches(swapped);
    const nextMoves = moves - 1;
    if (!matched.size) {
      setSelected(null);
      setMoves(nextMoves);
      setStatus("Комбо не сложилось Попробуйте другую связку символов");
      if (nextMoves <= 0) setIsComplete(true);
      return;
    }
    setBoard(collapseBoard(swapped, matched));
    setSelected(null);
    setMoves(nextMoves);
    setScore((value) => value + matched.size * 3);
    setStatus(`Комбо собрано: ${matched.size} элементов`);
    if (nextMoves <= 0) setIsComplete(true);
  }

  return (
    <div className="space-y-6">
      <GameHero
        code="fintech_match3"
        kicker="Мини-игра из документа"
        title="Fintech Match-3 собирает модульные символы в ежедневные квестовые комбо"
        description="Сопоставляйте элементы сетки, чтобы закрывать цепочки и питать Орбиту покупок"
        score={score}
        baseReward={baseReward}
        status={status}
        setStatus={setStatus}
        rewardClaimed={rewardClaimed}
        canClaim={isComplete && score > 0}
        onClaimed={() => setRewardClaimed(true)}
        metrics={[{ label: "Ходы", value: moves }]}
      />
      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <article className="surface-panel">
          <div className="space-y-4">
            <p className="eyebrow">Комбо</p>
            <h3 className="text-4xl font-semibold">{isComplete ? "Квест завершен" : "Соберите цепочку"}</h3>
            <div className="flex flex-wrap gap-3">
              <button className="primary-button" onClick={() => setIsComplete(true)} disabled={isComplete}>
                Завершить квест
              </button>
              <button className="secondary-button" onClick={resetRun}>
                Сбросить
              </button>
            </div>
          </div>
        </article>
        <article className="surface-panel">
          <div className="match-grid">
            {board.map((row, rowIndex) =>
              row.map((tile, columnIndex) => {
                const active = selected?.row === rowIndex && selected.column === columnIndex;
                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    className={`match-tile match-tile--${tile} ${active ? "match-tile--active" : ""}`}
                    onClick={() => clickTile({ row: rowIndex, column: columnIndex })}
                    disabled={isComplete}
                  >
                    {tile.slice(0, 2).toUpperCase()}
                  </button>
                );
              }),
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
