import type { GamePlayPayload } from "@/src/types/game";

export function localCoachTip(payload: GamePlayPayload): string {
  const { accuracy, avgReactionMs, timeoutCount, errorPatterns, extra, gameTitle } = payload;
  const lines: string[] = [];

  if (accuracy >= 90) {
    lines.push(`${gameTitle} 정답률 ${accuracy}%면 규칙은 몸에 붙었어. 이제 반응 속도와 후반 집중이 변별 포인트야.`);
  } else if (accuracy >= 70) {
    lines.push(`정답률 ${accuracy}%면 규칙은 이해한 상태야. 남은 건 실수 패턴을 줄이는 반복이야.`);
  } else {
    lines.push(`정답률 ${accuracy}%는 아직 룰이 몸에 안 붙은 단계야. 점수보다 한 문제의 판단 과정을 복기해보자.`);
  }

  const learning = Number(extra.learningDelta ?? 0);
  if (avgReactionMs > 1800) {
    lines.push(`평균 반응 ${avgReactionMs}ms로 신중한 편이야. 확신이 없어도 2초 안에 손을 움직이는 연습을 해보자.`);
  } else if (avgReactionMs > 0 && avgReactionMs < 500 && accuracy < 80) {
    lines.push(`손이 너무 빨라서(${avgReactionMs}ms) 조건을 놓치는 실수가 보여. 한 박자 읽고 누르자.`);
  } else if (timeoutCount > 0) {
    lines.push(`시간 초과가 ${timeoutCount}회 있었어. 모르겠으면 찍고 다음 문항 리듬을 지키는 게 더 이득이야.`);
  } else if (learning < -8) {
    lines.push(`후반에 정답률이 ${learning}%p 떨어졌어. 초반 집중을 세트 끝까지 가져가는 게 핵심이야.`);
  } else {
    lines.push(
      errorPatterns[0]
        ? `가장 잦은 실수는 '${errorPatterns[0]}'야. 다음 세트는 이 패턴만 의식하고 풀어보자.`
        : `실수가 거의 없어서 좋아. 다음엔 속도를 10%만 더 올려보자.`
    );
  }

  lines.push(extraNoteForGame(payload));
  return lines.slice(0, 3).join("\n");
}

function extraNoteForGame(payload: GamePlayPayload): string {
  const extra = payload.extra;
  switch (payload.gameId) {
    case "rps":
      return extra.perspectiveSwitchErrors
        ? "상대 관점에서 실수가 많았어. 물음표가 왼쪽이면 이기게, 오른쪽이면 지게라고 외워두자."
        : "가위 ← / 바위 ↓ / 보 → 방향키에 손을 익혀두면 관점이 바뀌어도 안 흔들려.";
    case "nback":
      return Number(extra.n3Accuracy ?? 100) < Number(extra.n2Accuracy ?? 100)
        ? "세 번째 전 판단이 더 약해. 도형에 이름을 붙여 소리 내 카운팅해보자."
        : "도형마다 이름을 붙이며 최근 세 개를 밀어내면 2라운드가 훨씬 편해져.";
    case "rotate":
      return "회전은 한 번에 45°씩이야. 8단계 기록을 보면서 최소 클릭 경로를 찾자.";
    case "appointment":
      return extra.busMiss
        ? "버스 라운드는 '안 나온 번호'야. 등장할 때마다 지우는 소거법이 좋아."
        : "정보가 스스로 사라지니까 1~3라운드는 소거법, 4라운드는 쌓아가는 방식으로 가자.";
    case "path":
      return "정답 울타리 수부터 보고 위치를 정하자. 마주 보면 2개, 90°면 1개가 기본이야.";
    case "potion":
      return extra.novelErrors
        ? "처음 보는 조합은 찍는 게 정상이야. 대신 빨간약이 나온 조합만 기억해두자."
        : "조합은 서로 독립이야. 파란약은 외우지 말고 빨간약만 기억하면 부담이 줄어.";
    case "numbers":
      return extra.skipMiss
        ? "건너뛰기 숫자를 먼저 외우고 시작하자. 반응 억제가 이 게임의 핵심이야."
        : "1라운드는 속도, 2라운드는 건너뛰기 우선. 실수는 되돌릴 수 없다는 걸 기억해.";
    case "cat":
      return extra.overconfidence
        ? "틀린 문항에서 확신이 높았어. 모르면 확신을 낮추는 게 메타인지 점수에 유리해."
        : "빨강부터 응답하고, 쥐 위치는 행·열로 짧게 외워두자.";
    case "compare":
      return "계산하지 말고 밀도로 보자. 1초 보고 3초 안에 직관으로 고르는 연습이야.";
    default:
      return "오늘 한 세트 더 하면 규칙이 손에 붙을 거야.";
  }
}
