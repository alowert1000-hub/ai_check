import { chance, randInt, sample, shuffle } from "@/src/utils/random";

export type Side = "left" | "right";
export type CompareMode = "word" | "dot";
export type Mark = { x: number; y: number; rot: number };

export type CompareTrial = {
  mode: CompareMode;
  leftWord: string;
  rightWord: string;
  left: number;
  right: number;
  answer: Side;
  leftMarks: Mark[];
  rightMarks: Mark[];
};

const POSITIVE = ["자유", "행복", "희망", "칭찬", "성공", "사랑", "여유", "설렘"];
const NEGATIVE = ["억압", "불안", "포기", "비난", "실패", "미움", "조급", "권태"];

function scatter(count: number, wide: boolean): Mark[] {
  const marks: Mark[] = [];
  const minX = wide ? 16 : 9;
  const minY = wide ? 11 : 9;
  let guard = 0;
  while (marks.length < count && guard < 800) {
    guard += 1;
    const x = 6 + Math.random() * (wide ? 74 : 84);
    const y = 6 + Math.random() * 82;
    if (marks.some((d) => Math.abs(d.x - x) < minX && Math.abs(d.y - y) < minY)) continue;
    marks.push({ x, y, rot: wide ? randInt(-12, 12) : 0 });
  }
  while (marks.length < count) {
    marks.push({ x: 6 + ((marks.length * 19) % 72), y: 6 + ((marks.length * 23) % 78), rot: 0 });
  }
  return marks;
}

export function makeCompareTrial(level: number): CompareTrial {
  const mode: CompareMode = chance(0.75) ? "word" : "dot";
  const [leftWord, rightWord] = shuffle([sample(POSITIVE, 1)[0], sample(NEGATIVE, 1)[0]]);
  const base = 8 + level * 2;
  const gap = Math.max(1, 5 - level);
  const left = randInt(base, base + 6);
  const rawRight = left + randInt(1, gap) * (chance(0.5) ? 1 : -1);
  const right = rawRight === left ? rawRight + 1 : rawRight;
  const wide = mode === "word";
  return {
    mode,
    leftWord,
    rightWord,
    left,
    right,
    answer: left > right ? "left" : "right",
    leftMarks: scatter(left, wide),
    rightMarks: scatter(right, wide),
  };
}

export function makeCompareSet(count = 16): CompareTrial[] {
  return Array.from({ length: count }, (_, i) => makeCompareTrial(Math.floor(i / 5)));
}
