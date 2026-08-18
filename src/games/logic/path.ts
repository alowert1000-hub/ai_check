import { randInt, shuffle } from "@/src/utils/random";

export type Dir = 0 | 1 | 2 | 3;
export type Fence = "/" | "\\";
export type CellPos = { r: number; c: number };

export type Vehicle = {
  emoji: string;
  customer: string;
  start: CellPos & { dir: Dir };
  goal: CellPos;
};

export type PathPuzzle = {
  rows: number;
  cols: number;
  vehicles: Vehicle[];
  solution: Record<string, Fence>;
  budget: number;
  clickBudget: number;
};

export const DR = [-1, 0, 1, 0] as const;
export const DC = [0, 1, 0, -1] as const;
export const DIR_ARROW = ["↑", "→", "↓", "←"] as const;
const CARS = ["🚗", "🚕", "🚙", "🚌"];
const CUSTOMERS = ["🧍", "🧑", "👩", "🧔"];

export function keyOf(r: number, c: number): string {
  return `${r},${c}`;
}

export function bounce(dir: Dir, fence: Fence): Dir {
  if (fence === "/") return ([1, 0, 3, 2] as Dir[])[dir];
  return ([3, 2, 1, 0] as Dir[])[dir];
}

function inBounds(r: number, c: number, rows: number, cols: number) {
  return r >= 0 && c >= 0 && r < rows && c < cols;
}

function dirBetween(a: CellPos, b: CellPos): Dir {
  if (b.r < a.r) return 0;
  if (b.c > a.c) return 1;
  if (b.r > a.r) return 2;
  return 3;
}

function fenceFor(from: Dir, to: Dir): Fence | null {
  if (bounce(from, "/") === to) return "/";
  if (bounce(from, "\\") === to) return "\\";
  return null;
}

export function driveOne(
  puzzle: Pick<PathPuzzle, "rows" | "cols">,
  vehicle: Vehicle,
  fences: Record<string, Fence>
): { ok: boolean; path: CellPos[] } {
  const path: CellPos[] = [];
  let r = vehicle.start.r;
  let c = vehicle.start.c;
  let dir: Dir = vehicle.start.dir;
  const seen = new Set<string>();

  for (let step = 0; step < puzzle.rows * puzzle.cols * 3; step += 1) {
    path.push({ r, c });
    if (r === vehicle.goal.r && c === vehicle.goal.c) return { ok: true, path };
    const stamp = `${r},${c},${dir}`;
    if (seen.has(stamp)) return { ok: false, path };
    seen.add(stamp);
    const f = fences[keyOf(r, c)];
    if (f) dir = bounce(dir, f);
    const nr = r + DR[dir];
    const nc = c + DC[dir];
    if (!inBounds(nr, nc, puzzle.rows, puzzle.cols)) return { ok: false, path };
    r = nr;
    c = nc;
  }
  return { ok: false, path };
}

export function driveAll(
  puzzle: PathPuzzle,
  fences: Record<string, Fence>
): { ok: boolean; paths: CellPos[][]; arrived: number } {
  const results = puzzle.vehicles.map((v) => driveOne(puzzle, v, fences));
  return {
    ok: results.every((x) => x.ok),
    paths: results.map((x) => x.path),
    arrived: results.filter((x) => x.ok).length,
  };
}

function routeFor(
  rows: number,
  cols: number,
  used: Set<string>,
  turns: number
): { cells: CellPos[]; fences: Record<string, Fence> } | null {
  const fromLeft = Math.random() < 0.5;
  let r = randInt(0, rows - 1);
  let c = fromLeft ? 0 : cols - 1;
  let dir: Dir = fromLeft ? 1 : 3;
  if (used.has(keyOf(r, c))) return null;
  const cells: CellPos[] = [{ r, c }];
  const visited = new Set([keyOf(r, c)]);

  for (let t = 0; t <= turns; t += 1) {
    const len = randInt(2, 4);
    for (let i = 0; i < len; i += 1) {
      const nr = r + DR[dir];
      const nc = c + DC[dir];
      const k = keyOf(nr, nc);
      if (!inBounds(nr, nc, rows, cols) || visited.has(k) || used.has(k)) break;
      r = nr;
      c = nc;
      cells.push({ r, c });
      visited.add(k);
    }
    if (t === turns) break;
    const options = shuffle([(dir + 1) % 4, (dir + 3) % 4]) as Dir[];
    let turned = false;
    for (const nd of options) {
      const nr = r + DR[nd];
      const nc = c + DC[nd];
      if (inBounds(nr, nc, rows, cols) && !visited.has(keyOf(nr, nc)) && !used.has(keyOf(nr, nc))) {
        dir = nd;
        turned = true;
        break;
      }
    }
    if (!turned) return null;
  }

  if (cells.length < 4) return null;

  const fences: Record<string, Fence> = {};
  for (let i = 1; i < cells.length - 1; i += 1) {
    const incoming = dirBetween(cells[i - 1], cells[i]);
    const outgoing = dirBetween(cells[i], cells[i + 1]);
    if (incoming === outgoing) continue;
    const f = fenceFor(incoming, outgoing);
    if (!f) return null;
    fences[keyOf(cells[i].r, cells[i].c)] = f;
  }
  if (!Object.keys(fences).length) return null;
  return { cells, fences };
}

function tryGenerate(rows: number, cols: number, cars: number, turns: number): PathPuzzle | null {
  const used = new Set<string>();
  const vehicles: Vehicle[] = [];
  const solution: Record<string, Fence> = {};

  for (let i = 0; i < cars; i += 1) {
    let route: ReturnType<typeof routeFor> = null;
    for (let attempt = 0; attempt < 40 && !route; attempt += 1) {
      route = routeFor(rows, cols, used, turns);
    }
    if (!route) return null;
    route.cells.forEach((p) => used.add(keyOf(p.r, p.c)));
    Object.entries(route.fences).forEach(([k, v]) => {
      solution[k] = v;
    });
    vehicles.push({
      emoji: CARS[i % CARS.length],
      customer: CUSTOMERS[i % CUSTOMERS.length],
      start: {
        r: route.cells[0].r,
        c: route.cells[0].c,
        dir: dirBetween(route.cells[0], route.cells[1]),
      },
      goal: route.cells[route.cells.length - 1],
    });
  }

  const budget = Object.keys(solution).length;
  const puzzle: PathPuzzle = {
    rows,
    cols,
    vehicles,
    solution,
    budget,
    clickBudget: budget * 6,
  };
  if (!driveAll(puzzle, solution).ok) return null;
  return puzzle;
}

function fallbackPuzzle(): PathPuzzle {
  return {
    rows: 6,
    cols: 6,
    vehicles: [{ emoji: "🚗", customer: "🧍", start: { r: 2, c: 0, dir: 1 }, goal: { r: 4, c: 5 } }],
    solution: { [keyOf(2, 3)]: "/", [keyOf(4, 3)]: "\\" },
    budget: 2,
    clickBudget: 12,
  };
}

export function makePathPuzzle(level: number): PathPuzzle {
  const rows = level >= 2 ? 7 : 6;
  const cols = rows;
  const cars = level >= 3 ? 3 : level >= 1 ? 2 : 1;
  const turns = 1 + Math.min(2, level);
  for (let i = 0; i < 60; i += 1) {
    const p = tryGenerate(rows, cols, cars, turns);
    if (p) return p;
  }
  for (let i = 0; i < 40; i += 1) {
    const p = tryGenerate(rows, cols, Math.max(1, cars - 1), turns);
    if (p) return p;
  }
  return fallbackPuzzle();
}

/** 빈 칸 → / → \ → 빈 칸 순환. 장애물은 존재하지 않는다. */
export function cycleFence(current: Fence | undefined): Fence | undefined {
  if (!current) return "/";
  if (current === "/") return "\\";
  return undefined;
}
