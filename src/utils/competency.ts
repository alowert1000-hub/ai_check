import type { CompetencyKey, GameId, GamePlayPayload } from "@/src/types/game";

export const COMPETENCY_META: Record<
  CompetencyKey,
  { label: string; desc: string; color: string }
> = {
  performance: {
    label: "성과 역량",
    desc: "목표를 향해 빠르고 정확하게 실행하는 힘",
    color: "#0F766E",
  },
  strategy: {
    label: "전략 역량",
    desc: "비교·분석·인과를 보고 길을 설계하는 힘",
    color: "#1D4ED8",
  },
  relation: {
    label: "관계 역량",
    desc: "상대 관점을 읽고 맞춰 움직이는 힘",
    color: "#7C3AED",
  },
  adapt: {
    label: "적응 역량",
    desc: "규칙을 학습하고 조건이 바뀌어도 유지하는 힘",
    color: "#C2410C",
  },
};

const GAME_COMPETENCIES: Record<GameId, CompetencyKey[]> = {
  rps: ["relation", "adapt", "performance"],
  rotate: ["strategy", "performance"],
  appointment: ["adapt", "relation"],
  path: ["strategy", "performance"],
  potion: ["adapt", "strategy"],
  numbers: ["performance", "adapt"],
  nback: ["adapt", "strategy"],
  cat: ["adapt", "relation"],
  compare: ["performance", "strategy"],
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreCompetencies(payload: GamePlayPayload): Record<CompetencyKey, number> {
  const acc = payload.accuracy;
  const speedPenalty =
    payload.avgReactionMs > 0 ? Math.max(0, (payload.avgReactionMs - 1400) / 40) : 0;
  const timeoutPenalty = payload.timeoutCount * 4;
  const base = clamp(acc - speedPenalty * 0.3 - timeoutPenalty);

  const learningDelta = Number(payload.extra.learningDelta ?? 0);
  const learning = clamp(50 + learningDelta);
  const rtVar = Number(payload.extra.rtVariability ?? 0);
  const stability = clamp(100 - Math.min(40, rtVar / 8000));

  const keys = GAME_COMPETENCIES[payload.gameId] ?? ["performance"];
  const out: Record<CompetencyKey, number> = {
    performance: 0,
    strategy: 0,
    relation: 0,
    adapt: 0,
  };

  keys.forEach((k, i) => {
    if (k === "adapt") out[k] = clamp(base * 0.5 + learning * 0.5);
    else if (k === "performance") out[k] = clamp(base - speedPenalty * 0.2);
    else if (k === "strategy") out[k] = clamp(base * 0.7 + stability * 0.3 - i);
    else out[k] = clamp(base - i * 2);
  });

  if (payload.gameId === "cat" && payload.extra.overconfidence) {
    out.relation = clamp(out.relation - 12);
    out.adapt = clamp(out.adapt - 6);
  }
  if (payload.gameId === "rps") {
    const switchErr = Number(payload.extra.perspectiveSwitchErrors ?? 0);
    out.relation = clamp(out.relation - switchErr * 4);
    out.adapt = clamp(out.adapt - switchErr * 3);
  }

  return out;
}
