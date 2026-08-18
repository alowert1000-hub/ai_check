import { pick, chance } from "@/src/utils/random";

export type GlyphId = "circle" | "triangle" | "square" | "diamond" | "star" | "hex";

export const GLYPHS: GlyphId[] = [
  "circle",
  "triangle",
  "square",
  "diamond",
  "star",
  "hex",
];

export const GLYPH_NAME: Record<GlyphId, string> = {
  circle: "원",
  triangle: "세모",
  square: "네모",
  diamond: "다이아",
  star: "별",
  hex: "육각",
};

export type NbackTrial = {
  glyph: GlyphId;
  n: number;
  comparable: boolean;
  match: boolean;
};

export function makeNbackRound(
  length: number,
  nMode: number | "mix",
  matchRate = 0.34
): NbackTrial[] {
  const trials: NbackTrial[] = [];
  for (let i = 0; i < length; i += 1) {
    const n = nMode === "mix" ? (chance(0.5) ? 2 : 3) : nMode;
    const comparable = i >= n;
    let glyph: GlyphId;
    let match = false;
    if (comparable && chance(matchRate)) {
      glyph = trials[i - n].glyph;
      match = true;
    } else {
      glyph = pick(GLYPHS);
      if (comparable) {
        let guard = 0;
        while (glyph === trials[i - n].glyph && guard < 10) {
          glyph = pick(GLYPHS);
          guard += 1;
        }
        match = glyph === trials[i - n].glyph;
      }
    }
    trials.push({ glyph, n, comparable, match });
  }
  return trials;
}

export function makeNbackSet() {
  return {
    round1: makeNbackRound(18, 2, 0.36),
    round2: makeNbackRound(18, "mix", 0.32),
  };
}
