import { chance, pick, randInt } from "@/src/utils/random";

export type Transform = {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
};

export type RotateKind = "letter" | "shape";

export const SHAPE_CELLS: Array<[number, number]> = [
  [1, 0],
  [2, 0],
  [1, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [2, 3],
];

const SAMPLE_POINTS: Array<[number, number]> = [
  [1, 0],
  [2, 0],
  [0, 2],
  [2, 3],
  [1, 1],
];

export const LETTERS = ["F", "L", "P", "R", "J", "G"];

export const identity: Transform = { rotation: 0, flipX: false, flipY: false };

export type RotateOp = "ccw45" | "cw45" | "flipH" | "flipV";

export const OP_LABEL: Record<RotateOp, string> = {
  ccw45: "왼쪽 45° 회전",
  cw45: "오른쪽 45° 회전",
  flipH: "좌우반전",
  flipV: "상하반전",
};

export const OP_SHORT: Record<RotateOp, string> = {
  ccw45: "↺45",
  cw45: "↻45",
  flipH: "↔",
  flipV: "↕",
};

export function applyOp(t: Transform, op: RotateOp): Transform {
  if (op === "cw45") return { ...t, rotation: (t.rotation + 45) % 360 };
  if (op === "ccw45") return { ...t, rotation: (t.rotation + 315) % 360 };
  if (op === "flipH") return { ...t, flipX: !t.flipX };
  return { ...t, flipY: !t.flipY };
}

export function applySteps(steps: RotateOp[]): Transform {
  return steps.reduce((acc, op) => applyOp(acc, op), { ...identity });
}

function applyToPoint(x: number, y: number, t: Transform): [number, number] {
  const nx = t.flipX ? -x : x;
  const ny = t.flipY ? -y : y;
  const rad = (t.rotation * Math.PI) / 180;
  const rx = nx * Math.cos(rad) - ny * Math.sin(rad);
  const ry = nx * Math.sin(rad) + ny * Math.cos(rad);
  return [Math.round(rx * 100) / 100, Math.round(ry * 100) / 100];
}

export function signature(t: Transform): string {
  return SAMPLE_POINTS.map(([x, y]) => applyToPoint(x, y, t).join(","))
    .sort()
    .join("|");
}

export function visuallyEqual(a: Transform, b: Transform): boolean {
  return signature(a) === signature(b);
}

export type RotatePuzzle = {
  kind: RotateKind;
  letter: string;
  target: Transform;
  minSteps: number;
};

function randomTarget(maxSteps: number): { target: Transform; steps: number } {
  const ops: RotateOp[] = ["ccw45", "cw45", "flipH", "flipV"];
  let t = { ...identity };
  const steps = randInt(2, maxSteps);
  for (let i = 0; i < steps; i += 1) t = applyOp(t, pick(ops));
  if (visuallyEqual(t, identity)) t = applyOp(t, chance(0.5) ? "cw45" : "flipH");
  return { target: t, steps };
}

export function makeRotateSet(perRound = 4): RotatePuzzle[] {
  const puzzles: RotatePuzzle[] = [];
  for (let i = 0; i < perRound; i += 1) {
    const { target, steps } = randomTarget(3 + Math.floor(i / 2));
    puzzles.push({ kind: "letter", letter: pick(LETTERS), target, minSteps: steps });
  }
  for (let i = 0; i < perRound; i += 1) {
    const { target, steps } = randomTarget(4);
    puzzles.push({ kind: "shape", letter: "", target, minSteps: steps });
  }
  return puzzles;
}
