import { pick, randInt, sample, shuffle } from "@/src/utils/random";

export type NumberCondition = {
  label: string;
  skip: number[];
  double: number[];
  expected: number[];
};

function expectedTaps(skip: number[], double: number[]): number[] {
  const skipSet = new Set(skip);
  const doubleSet = new Set(double);
  const taps: number[] = [];
  for (let n = 1; n <= 9; n += 1) {
    if (skipSet.has(n)) continue;
    taps.push(n);
    if (doubleSet.has(n)) taps.push(n);
  }
  return taps;
}

const TEMPLATES: Array<() => { label: string; skip: number[]; double: number[] }> = [
  () => ({
    label: "짝수는 두 번 누르고, 3의 배수는 건너뛰세요",
    skip: [3, 6, 9],
    double: [2, 4, 8],
  }),
  () => ({
    label: "3과 5는 두 번 누르고, 4와 7은 건너뛰세요",
    skip: [4, 7],
    double: [3, 5],
  }),
  () => ({
    label: "1·5·7은 두 번 누르고, 6과 9는 건너뛰세요",
    skip: [6, 9],
    double: [1, 5, 7],
  }),
  () => {
    const skip = sample([2, 3, 4, 6, 8, 9], 2).sort((a, b) => a - b);
    const remain = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !skip.includes(n));
    const double = sample(remain, 2).sort((a, b) => a - b);
    return {
      label: `${double.join("·")}은 두 번 누르고, ${skip.join("·")}은 건너뛰세요`,
      skip,
      double,
    };
  },
];

export function makeNumberCondition(): NumberCondition {
  const t = pick(TEMPLATES)();
  return { ...t, expected: expectedTaps(t.skip, t.double) };
}

export function makeFlashSequence(count = 16): number[] {
  return Array.from({ length: count }, () => randInt(1, 9));
}

/** 1라운드는 버튼 배열이 매번 섞인다. */
export function makeKeypadLayout(): number[] {
  return shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
}
