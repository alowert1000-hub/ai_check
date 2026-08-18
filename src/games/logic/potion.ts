import { chance, shuffle } from "@/src/utils/random";

export type IngredientId = "star" | "petal" | "dew" | "moon";

export type Ingredient = {
  id: IngredientId;
  name: string;
  emoji: string;
};

export const INGREDIENTS: Ingredient[] = [
  { id: "star", name: "별가루", emoji: "✨" },
  { id: "petal", name: "꽃잎", emoji: "🌸" },
  { id: "dew", name: "이슬", emoji: "💧" },
  { id: "moon", name: "달빛", emoji: "🌙" },
];

export type PotionColor = "red" | "blue";

export type PotionCombo = {
  key: string;
  cards: IngredientId[];
  pRed: number;
};

export function comboKey(ids: IngredientId[]): string {
  return [...ids].sort().join("+");
}

export function ingredientById(id: IngredientId): Ingredient {
  return INGREDIENTS.find((i) => i.id === id)!;
}

/** 재료 4종에서 나올 수 있는 조합: 1장 4개 + 2장 6개 + 3장 4개 = 14가지 */
function allFourteen(): IngredientId[][] {
  const ids = INGREDIENTS.map((i) => i.id);
  const singles = ids.map((a) => [a]);
  const pairs: IngredientId[][] = [];
  const triples: IngredientId[][] = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      pairs.push([ids[i], ids[j]]);
      for (let k = j + 1; k < ids.length; k += 1) {
        triples.push([ids[i], ids[j], ids[k]]);
      }
    }
  }
  return [...singles, ...pairs, ...triples];
}

export function makePotionWorld(): PotionCombo[] {
  return allFourteen().map((cards) => ({
    key: comboKey(cards),
    cards,
    pRed: chance(0.5) ? 0.72 + Math.random() * 0.16 : 0.12 + Math.random() * 0.16,
  }));
}

export function sampleColor(combo: PotionCombo): PotionColor {
  return Math.random() < combo.pRed ? "red" : "blue";
}

export function majorityColor(combo: PotionCombo): PotionColor {
  return combo.pRed >= 0.5 ? "red" : "blue";
}

export function makePotionSequence(world: PotionCombo[], length = 28): PotionCombo[] {
  const seq = shuffle(world);
  while (seq.length < length) {
    seq.push(...shuffle(world));
  }
  return seq.slice(0, length);
}
