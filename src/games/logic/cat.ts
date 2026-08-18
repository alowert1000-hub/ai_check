import { randInt, sample } from "@/src/utils/random";

export type CatColor = "red" | "blue" | "plain";
export type CatRound = {
  mice: number[];
  cats: { color: CatColor; cell: number }[];
};

export const GRID = 6;
export const CELL_COUNT = GRID * GRID;

export function makeCatRound(level: number): CatRound {
  const mouseCount = randInt(3 + level, 5 + level);
  const cells = Array.from({ length: CELL_COUNT }, (_, i) => i);
  const mice = sample(cells, mouseCount);
  const mouseSet = new Set(mice);
  const rest = cells.filter((c) => !mouseSet.has(c));

  const redHit = Math.random() < 0.5;
  const blueHit = Math.random() < 0.5;
  const red = redHit ? sample(mice, 1)[0] : sample(rest, 1)[0];
  const bluePool = (blueHit ? mice : rest).filter((c) => c !== red);
  const blue = bluePool.length
    ? sample(bluePool, 1)[0]
    : sample(rest.filter((c) => c !== red), 1)[0];

  const plainPool = cells.filter((c) => c !== red && c !== blue);
  const plains = sample(plainPool, Math.min(2 + level, plainPool.length));

  return {
    mice,
    cats: [
      { color: "red", cell: red },
      { color: "blue", cell: blue },
      ...plains.map((cell) => ({ color: "plain" as CatColor, cell })),
    ],
  };
}

export function makeCatSet(count = 9): CatRound[] {
  return Array.from({ length: count }, (_, i) => makeCatRound(Math.min(2, Math.floor(i / 3))));
}

export function rc(index: number): { r: number; c: number } {
  return { r: Math.floor(index / GRID), c: index % GRID };
}
