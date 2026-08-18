import { pick, randInt } from "@/src/utils/random";

export type Hand = "rock" | "paper" | "scissors";
export type Perspective = "me" | "opponent";

export const HANDS: Hand[] = ["rock", "paper", "scissors"];
/** 화면·키보드 배치 순서는 항상 좌측부터 가위 → 바위 → 보로 고정한다. */
export const HAND_ORDER: readonly Hand[] = ["scissors", "rock", "paper"] as const;
export const HAND_KEY: Record<Hand, string> = {
  scissors: "←",
  rock: "↓",
  paper: "→",
};
export const HAND_EMOJI: Record<Hand, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};
export const HAND_LABEL: Record<Hand, string> = {
  rock: "바위",
  paper: "보",
  scissors: "가위",
};

export type RpsTurn = {
  perspective: Perspective;
  shown: Hand;
  answer: Hand;
};

function beats(a: Hand, b: Hand): boolean {
  return (
    (a === "rock" && b === "scissors") ||
    (a === "paper" && b === "rock") ||
    (a === "scissors" && b === "paper")
  );
}

function winningVs(shown: Hand): Hand {
  return HANDS.find((h) => beats(h, shown)) as Hand;
}

function losingVs(shown: Hand): Hand {
  return HANDS.find((h) => beats(shown, h)) as Hand;
}

/**
 * me      : 상대 손이 보이고 '나'(왼쪽)가 물음표 → 이기는 손을 고른다.
 * opponent: 내 손이 보이고 '상대'(오른쪽)가 물음표 → 상대가 지는 손을 고른다.
 */
export function makeTurn(perspective: Perspective): RpsTurn {
  const shown = pick(HANDS);
  const answer = perspective === "me" ? winningVs(shown) : losingVs(shown);
  return { perspective, shown, answer };
}

export const ROUND1_LEN = 8;
export const ROUND2_LEN = 6;
export const ROUND3_LEN = 8;

export function makeRpsSet(): RpsTurn[] {
  const turns: RpsTurn[] = [];
  for (let i = 0; i < ROUND1_LEN; i += 1) turns.push(makeTurn("me"));
  for (let i = 0; i < ROUND2_LEN; i += 1) turns.push(makeTurn("opponent"));
  for (let i = 0; i < ROUND3_LEN; i += 1) {
    turns.push(makeTurn(randInt(0, 1) === 0 ? "me" : "opponent"));
  }
  return turns;
}
