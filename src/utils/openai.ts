import type { GamePlayPayload } from "@/src/types/game";
import { localCoachTip } from "@/src/utils/localCoach";

const SYSTEM_PROMPT = `당신은 취업 준비생의 AI 역량검사(잡다 신역검) 전략게임을 코칭하는 따뜻한 멘토입니다.
- 반말, 친근하고 응원하는 말투
- 반드시 3줄
- 각 줄은 실제 플레이 데이터(정답률, 반응속도, 오답 패턴, 4역량 점수, extra)를 근거로 구체적인 팁
- 역검은 정답률뿐 아니라 성과·전략·관계·적응 4역량과 응답 패턴(학습 곡선, 반응 일관성, 메타인지)을 본다는 점을 반영
- 추상적인 격려만 하지 말고 다음 세트에서 바로 쓸 행동을 제안
- 한국어로만 답변`;

function buildUserPrompt(payload: GamePlayPayload): string {
  const comp = payload.competencies
    ? `4역량 점수: 성과 ${payload.competencies.performance} / 전략 ${payload.competencies.strategy} / 관계 ${payload.competencies.relation} / 적응 ${payload.competencies.adapt}`
    : "4역량 점수: 없음";
  return `게임: ${payload.gameTitle} (${payload.gameId})
정답률: ${payload.accuracy}%
맞춘 문항: ${payload.correctCount}/${payload.totalTrials}
평균 반응속도: ${payload.avgReactionMs}ms
시간 초과: ${payload.timeoutCount}회
오답 패턴: ${payload.errorPatterns.join(", ") || "없음"}
${comp}
전·후반 학습 변화: ${payload.extra.firstHalfAccuracy}% → ${payload.extra.secondHalfAccuracy}%
추가 데이터 JSON: ${JSON.stringify(payload.extra)}
소요 시간: ${Math.round((payload.finishedAt - payload.startedAt) / 1000)}초

이 사용자에게 친근한 말투로 어떤 부분을 보완하면 좋을지 구체적인 팁과 피드백을 3줄로 작성해줘.`;
}

export async function fetchAiFeedback(
  payload: GamePlayPayload,
  apiKey: string,
  model = "gpt-4o-mini"
): Promise<{ text: string; source: "openai" | "local"; error?: string }> {
  if (!apiKey.trim()) {
    return { text: localCoachTip(payload), source: "local" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 350,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(payload) },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return {
        text: localCoachTip(payload),
        source: "local",
        error: `OpenAI ${res.status}: ${errText.slice(0, 180)}`,
      };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { text: localCoachTip(payload), source: "local", error: "empty" };
    }
    return { text, source: "openai" };
  } catch (e) {
    return {
      text: localCoachTip(payload),
      source: "local",
      error: e instanceof Error ? e.message : "network",
    };
  }
}
