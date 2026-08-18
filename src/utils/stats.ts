import { scoreCompetencies } from "@/src/utils/competency";
import type { GamePlayPayload, TrialLog } from "@/src/types/game";

export function summarizeTrials(trials: TrialLog[]) {
  const totalTrials = trials.length;
  const correctCount = trials.filter((t) => t.correct).length;
  const timeoutCount = trials.filter((t) => t.timeout).length;
  const reactions = trials.filter((t) => t.reactionMs > 0).map((t) => t.reactionMs);
  const avgReactionMs = reactions.length
    ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length)
    : 0;
  const accuracy = totalTrials ? Math.round((correctCount / totalTrials) * 1000) / 10 : 0;

  const errorCounts = new Map<string, number>();
  trials
    .filter((t) => !t.correct)
    .forEach((t) => {
      const key = t.timeout ? "시간 초과" : t.detail || "오답";
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

  const errorPatterns = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => `${k} (${n}회)`);

  return { totalTrials, correctCount, accuracy, avgReactionMs, timeoutCount, errorPatterns };
}

function accOf(xs: TrialLog[]) {
  if (!xs.length) return 0;
  return Math.round((xs.filter((t) => t.correct).length / xs.length) * 1000) / 10;
}

function mean(xs: number[]) {
  if (!xs.length) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

export function patternExtras(trials: TrialLog[]): Record<string, unknown> {
  const mid = Math.ceil(trials.length / 2);
  const first = trials.slice(0, mid);
  const second = trials.slice(mid);
  const rts = trials.filter((t) => t.reactionMs > 0).map((t) => t.reactionMs);
  const rtMean = mean(rts);
  const rtVar = rts.length
    ? Math.round(rts.reduce((s, n) => s + (n - rtMean) ** 2, 0) / rts.length)
    : 0;
  return {
    firstHalfAccuracy: accOf(first),
    secondHalfAccuracy: accOf(second),
    learningDelta: Math.round((accOf(second) - accOf(first)) * 10) / 10,
    rtVariability: rtVar,
  };
}

export function buildPayload(
  base: Pick<GamePlayPayload, "gameId" | "gameTitle" | "startedAt" | "trials" | "extra">
): GamePlayPayload {
  const stats = summarizeTrials(base.trials);
  const payload: GamePlayPayload = {
    ...base,
    ...stats,
    extra: { ...patternExtras(base.trials), ...base.extra },
    finishedAt: Date.now(),
  };
  payload.competencies = scoreCompetencies(payload);
  return payload;
}
