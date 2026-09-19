import { addDays, dateKey } from "./dates.js";

function mindmap(center, branches) {
  return { center, branches };
}

export function buildDemoRecords() {
  const now = new Date();
  const intro = "1분 자기소개";
  const strength = "본인의 장점 한 가지와 단점 한 가지를 말해주세요.";
  const motivation = "다른 회사가 아닌 기아여야 하는 이유는 무엇입니까?";
  return [
    {
      id: "demo-1",
      isDemo: true,
      trackKey: "open",
      date: dateKey(addDays(now, -1)),
      createdAt: addDays(now, -1).toISOString(),
      question:
        "1-1-1 루틴을 적용했다고 하셨는데, 바쁜 생산 라인에서 1분씩 시간을 쪼개는 것이 오히려 병목 현상을 만들지는 않았나요?",
      answer:
        "음... 팀 프로젝트에서 일정이 밀렸을 때 어... 제가 회의를 열어서 역할을 다시 나눴습니다. 그래서 결국 기한 안에 끝냈어요.",
      score: 48,
      strengths: [
        { text: "이번 답변에서 일정 밀림이라는 상황을 바로 꺼냈습니다.", points: 10 },
        { text: "이번 답변에 회의로 역할을 나눈 행동이 있습니다.", points: 12 },
        { text: "이번 답변에 기한 안에 끝냈다는 결과가 있습니다.", points: 10 },
        { text: "이번 답변에서 팀 갈등을 회피하지 않았습니다.", points: 8 },
        { text: "이번 답변을 끝까지 닫았습니다.", points: 8 },
      ],
      weaknesses: [
        { text: "이번 답변에서 병목 여부를 첫 문장에서 받지 못했습니다." },
        { text: "이번 답변에 전후 지표가 없습니다." },
        { text: "이번 답변에서 본인 기여와 팀 기여가 분리되지 않았습니다." },
        { text: "이번 답변에 반대 의견 처리가 없습니다." },
        { text: "이번 답변 초반에 독립된 음/어가 있습니다." },
      ],
      missing_points: ["모범 답안의 병목 여부 직접 답", "모범 답안의 전후 수치", "모범 답안의 본인 역할 한 줄"],
      sentence_rewrites: [
        {
          original:
            "음... 팀 프로젝트에서 일정이 밀렸을 때 어... 제가 회의를 열어서 역할을 다시 나눴습니다.",
          improved: "병목이 되지 않았습니다. 일정이 밀렸을 때 점검 회의를 역할 재배분 한 가지로만 한정했습니다.",
          reason: "모범 답안의 결론 문장으로 바꿨습니다.",
        },
      ],
      keywords: ["병목", "우선순위", "역할 재배분", "핵심 화면", "기한"],
      mindmap: mindmap("모범 답안", [
        { label: "상황", children: ["일정 밀림", "기능 요청"] },
        { label: "행동", children: ["우선순위 1개", "역할 재배분"] },
        { label: "결과", children: ["핵심 화면", "기한"] },
      ]),
      feedback_habits: '이번 답변 초반에 "음", "어"가 연속됩니다. 첫 문장을 내기 전 결론을 정하세요.',
      feedback_content: "이번 답변은 일정 문제는 말했지만, 모범 답안의 병목 여부와 전후 지표가 빠졌습니다.",
      model_answer:
        "해커톤에서 기능 요청이 몰려 일정이 흔들렸습니다. 짧은 점검이 병목이 되지 않게, 점검 시간을 의사결정 용도로만 쓰는 것이 제 역할이었습니다. 점검은 우선순위 1개만 고르는 회의로 한정하고, 실행은 바로 화면 단위로 쪼갰습니다. 핵심 화면을 기한 안에 데모했고, 부가 기능은 다음 스프린트로 미뤘습니다.",
      source: "mock",
    },
    {
      id: "demo-2",
      isDemo: true,
      trackKey: "intro",
      date: dateKey(addDays(now, -5)),
      createdAt: addDays(now, -5).toISOString(),
      question: intro,
      answer:
        "어 저는 평소에 서비스를 쓰는 걸 좋아해서 이 직무에 지원했습니다. 그냥 사용자가 편했으면 좋겠다는 생각이 들었어요.",
      score: 32,
      strengths: [
        { text: "이번 답변에서 직무 지원 의사를 분명히 했습니다.", points: 8 },
        { text: "이번 답변에 사용자 관점이 있습니다.", points: 6 },
        { text: "이번 답변을 짧은 결론으로 닫았습니다.", points: 6 },
        { text: "이번 답변에서 지원 이유를 말하려 했습니다.", points: 6 },
        { text: "이번 답변이 완전히 비어 있지는 않습니다.", points: 6 },
      ],
      weaknesses: [
        { text: "이번 답변에 현재-경험-직무 골격이 없습니다." },
        { text: "이번 답변에서 해커톤 팩트가 빠졌습니다." },
        { text: "이번 답변에 직무 선택 기준이 없습니다." },
        { text: "이번 답변에 숫자나 결과가 없습니다." },
        { text: "이번 답변이 선호 표현에 머뭅니다." },
      ],
      missing_points: ["모범 답안의 1분 골격", "모범 답안의 해커톤 경험", "모범 답안의 직무 선택 기준"],
      sentence_rewrites: [
        {
          original: "어 저는 평소에 서비스를 쓰는 걸 좋아해서 이 직무에 지원했습니다.",
          improved:
            "프론트엔드에 지원한 이유는, 복잡한 흐름을 첫 화면에서 결정하게 만드는 일을 해커톤에서 직접 해봤기 때문입니다.",
          reason: "모범 답안의 경험-직무 연결로 다듬었습니다.",
        },
      ],
      keywords: ["해커톤", "프론트엔드", "우선순위", "핵심 화면", "3일"],
      mindmap: mindmap("1분 자기소개", [
        { label: "현재", children: ["프론트엔드"] },
        { label: "경험", children: ["해커톤", "우선순위"] },
        { label: "직무", children: ["핵심 화면", "3일"] },
      ]),
      feedback_habits: '이번 답변의 "어", "그냥"이 근거를 흐립니다.',
      feedback_content: "이번 답변은 관심만 있고, 모범 답안의 직무 고유 경험이 없습니다.",
      model_answer:
        "교내 해커톤에서 면접 준비 앱의 사용 흐름이 복잡하다는 피드백을 받았습니다. 정보를 덜어 첫 화면에서 다음 행동을 결정하게 만드는 일이 프론트엔드 과제라고 봤습니다. 기능을 줄이는 대신 우선순위를 다시 정해 핵심 화면만 출시했습니다. 3일 만에 데모가 가능했고, 그 판단 방식이 제가 이 직무를 고른 이유입니다.",
      source: "mock",
    },
    {
      id: "demo-intro-1",
      isDemo: true,
      trackKey: "intro",
      date: dateKey(now),
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 10).toISOString(),
      question: intro,
      answer: "저는 서비스를 좋아해서 지원했습니다. 사용자가 편했으면 좋겠습니다.",
      score: 32,
      strengths: [
        { text: "이번 답변에서 지원 의사를 말했습니다.", points: 8 },
        { text: "이번 답변에 사용자 관점이 있습니다.", points: 6 },
        { text: "이번 답변을 짧게 닫았습니다.", points: 6 },
        { text: "이번 답변에서 직무를 언급하려 했습니다.", points: 6 },
        { text: "이번 답변이 침묵은 아닙니다.", points: 6 },
      ],
      weaknesses: [
        { text: "이번 답변에 경험 팩트가 없습니다." },
        { text: "이번 답변에 1분 골격이 없습니다." },
        { text: "이번 답변에 숫자가 없습니다." },
        { text: "이번 답변에서 역할을 말하지 않았습니다." },
        { text: "이번 답변이 선호로 끝납니다." },
      ],
      missing_points: ["모범 답안의 해커톤", "모범 답안의 3일 데모", "모범 답안의 우선순위 판단"],
      sentence_rewrites: [
        {
          original: "저는 서비스를 좋아해서 지원했습니다.",
          improved: "교내 해커톤에서 핵심 화면만 남겨 3일 만에 데모한 경험이 이 직무를 고른 이유입니다.",
          reason: "모범 답안의 경험 문장으로 바꿨습니다.",
        },
      ],
      keywords: ["해커톤", "핵심 화면", "우선순위", "3일", "프론트엔드"],
      mindmap: mindmap("1분 자기소개", [
        { label: "경험", children: ["해커톤"] },
        { label: "행동", children: ["우선순위", "핵심 화면"] },
        { label: "결과", children: ["3일"] },
      ]),
      feedback_habits: "이번 답변은 습관어보다 내용이 비어 있습니다.",
      feedback_content: "이번 답변과 모범 답안을 비교하면 경험·숫자·역할이 모두 빠졌습니다.",
      model_answer:
        "교내 해커톤에서 복잡한 흐름을 핵심 화면으로 줄여 3일 만에 데모했습니다. 그 우선순위 판단이 제가 프론트엔드를 고른 이유입니다.",
      source: "mock",
    },
    {
      id: "demo-intro-2",
      isDemo: true,
      trackKey: "intro",
      date: dateKey(now),
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 40).toISOString(),
      question: intro,
      answer:
        "호서대 컴퓨터공학과에서 웹을 만들었습니다. 해커톤에서 면접 앱을 팀장으로 진행했고, 기능을 줄여 핵심 화면만 먼저 냈습니다.",
      score: 48,
      strengths: [
        { text: "이번 답변에서 학교와 직무를 연결했습니다.", points: 10 },
        { text: "이번 답변에 해커톤 경험이 있습니다.", points: 12 },
        { text: "이번 답변에서 팀장 역할을 말했습니다.", points: 10 },
        { text: "이번 답변에 기능을 줄인 판단이 있습니다.", points: 8 },
        { text: "이번 답변이 이전보다 구체적입니다.", points: 8 },
      ],
      weaknesses: [
        { text: "이번 답변에 3일 데모 숫자가 없습니다." },
        { text: "이번 답변에서 왜 이 직무인지가 한 줄로 안 닫힙니다." },
        { text: "이번 답변에 결과 지표가 없습니다." },
        { text: "이번 답변의 현재-경험-직무 순서가 흔들립니다." },
        { text: "이번 답변에 입사 후 포부가 없습니다." },
      ],
      missing_points: ["모범 답안의 3일 데모", "모범 답안의 직무 선택 한 줄", "모범 답안의 결과 지표"],
      sentence_rewrites: [
        {
          original: "기능을 줄여 핵심 화면만 먼저 냈습니다.",
          improved: "기능을 줄여 핵심 화면만 먼저 냈고, 3일 만에 데모가 가능해 이 직무를 고르게 됐습니다.",
          reason: "모범 답안의 결과 문장을 붙였습니다.",
        },
      ],
      keywords: ["해커톤", "팀장", "핵심 화면", "3일", "프론트엔드"],
      mindmap: mindmap("1분 자기소개", [
        { label: "현재", children: ["호서대", "웹"] },
        { label: "경험", children: ["해커톤", "팀장"] },
        { label: "결과", children: ["핵심 화면", "3일"] },
      ]),
      feedback_habits: "이번 답변은 문장이 단정합니다.",
      feedback_content: "이번 답변은 이전 32점에서 경험이 들어왔습니다. 모범 답안의 3일·직무 한 줄만 더하면 됩니다.",
      model_answer:
        "호서대에서 웹을 만들며, 해커톤에서 팀장으로 핵심 화면만 남겨 3일 만에 데모했습니다. 복잡한 정보를 덜어 첫 화면에서 결정하게 만드는 일이 제가 이 직무를 고른 이유입니다.",
      source: "mock",
    },
    {
      id: "demo-strength",
      isDemo: true,
      trackKey: "strength",
      date: dateKey(now),
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 5).toISOString(),
      question: strength,
      answer: "제 장점은 책임감입니다. 맡은 일은 끝까지 하려고 합니다.",
      score: 36,
      strengths: [
        { text: "이번 답변에서 장점을 한 가지로 골랐습니다.", points: 8 },
        { text: "이번 답변에 끝까지 하려는 태도가 있습니다.", points: 8 },
        { text: "이번 답변을 바로 결론으로 시작했습니다.", points: 8 },
        { text: "이번 답변이 장황하지 않습니다.", points: 6 },
        { text: "이번 답변에서 질문을 피하지 않았습니다.", points: 6 },
      ],
      weaknesses: [
        { text: "이번 답변에 자소서 경험이 없습니다." },
        { text: "이번 답변에서 책임감을 증명하는 장면이 없습니다." },
        { text: "이번 답변에 전후 결과가 없습니다." },
        { text: "이번 답변이 추상어로 끝납니다." },
        { text: "이번 답변에 면접관이 재현할 행동이 없습니다." },
      ],
      missing_points: ["모범 답안의 해커톤 장면", "모범 답안의 우선순위 판단", "모범 답안의 3일 결과"],
      sentence_rewrites: [
        {
          original: "제 장점은 책임감입니다.",
          improved:
            "제 장점은 우선순위를 한 가지로 고정하고 기한까지 책임지는 것입니다. 해커톤에서 핵심 화면만 남겨 3일 만에 데모했습니다.",
          reason: "모범 답안의 증명 장면으로 다듬었습니다.",
        },
      ],
      keywords: ["책임감", "우선순위", "해커톤", "핵심 화면", "3일"],
      mindmap: mindmap("장점", [
        { label: "한 줄", children: ["책임감"] },
        { label: "증명", children: ["해커톤", "우선순위"] },
        { label: "결과", children: ["3일"] },
      ]),
      feedback_habits: "이번 답변은 짧고 습관어가 없습니다.",
      feedback_content: "이번 답변의 장점 단어는 있으나 모범 답안의 증명 경험이 없습니다.",
      model_answer:
        "제 장점은 우선순위를 한 가지로 고정하고 기한까지 책임지는 것입니다. 해커톤에서 기능을 줄여 핵심 화면만 남겼고, 3일 만에 데모했습니다.",
      source: "mock",
    },
    {
      id: "demo-motivation",
      isDemo: true,
      trackKey: "motivation",
      date: dateKey(now),
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 20).toISOString(),
      question: motivation,
      answer: "고등학교 때부터 기아 차를 좋아해서 지원했습니다. 다른 회사는 잘 모르겠습니다.",
      score: 41,
      strengths: [
        { text: "이번 답변에서 기아를 선택한 이유를 바로 말했습니다.", points: 9 },
        { text: "이번 답변에 고등학교 때부터라는 시점이 있습니다.", points: 10 },
        { text: "이번 답변을 변명으로 돌리지 않았습니다.", points: 8 },
        { text: "이번 답변이 한 회사로 좁혀져 있습니다.", points: 8 },
        { text: "이번 답변이 질문을 받았습니다.", points: 6 },
      ],
      weaknesses: [
        { text: "이번 답변에 스팅어·광주 공장 같은 구체 장면이 없습니다." },
        { text: "이번 답변에서 다른 회사와 비교한 근거가 없습니다." },
        { text: "이번 답변이 취향 고백에서 멈춥니다." },
        { text: "이번 답변에 직무·현장 연결이 없습니다." },
        { text: "이번 답변이 한 문장으로 너무 짧습니다." },
      ],
      missing_points: ["모범 답안의 스팅어 3.3 터보", "모범 답안의 광주 공장 견학", "모범 답안의 기아만 목표로 삼은 이유"],
      sentence_rewrites: [
        {
          original: "고등학교 때부터 기아 차를 좋아해서 지원했습니다.",
          improved: "고등학교 때부터 스팅어 3.3 터보가 드림카였고, 광주 공장 견학 이후 다른 회사는 생각하지 않았습니다.",
          reason: "모범 답안의 구체 장면으로 바꿨습니다.",
        },
      ],
      keywords: ["스팅어", "광주 공장", "드림카", "기아"],
      mindmap: mindmap("왜 기아인가", [
        { label: "계기", children: ["스팅어"] },
        { label: "장면", children: ["광주 공장"] },
        { label: "결론", children: ["기아만"] },
      ]),
      feedback_habits: "이번 답변은 문장이 짧습니다.",
      feedback_content: "이번 답변은 기아를 고른 마음은 있으나 모범 답안의 구체 장면이 빠졌습니다.",
      model_answer:
        "고등학교 시절부터 기아의 스팅어 3.3 터보가 제 드림카였습니다. 광주 공장 견학 당시 차가 만들어지는 과정에 감명을 받았고, 그때부터 다른 곳은 생각하지 않고 기아만을 목표로 삼았습니다.",
      source: "mock",
    },
    {
      id: "demo-3",
      isDemo: true,
      trackKey: "open",
      date: dateKey(now),
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 12).toISOString(),
      question: "데이터가 맞지 않는 문제를 로그로 좁혔다고 했는데, 로그가 오히려 노이즈였다면 어떤 기준으로 원인을 버렸습니까?",
      answer:
        "가장 어려웠던 건 데이터가 맞지 않는 문제였습니다. 원인을 로그와 재현 경로로 좁힌 뒤, 영향이 큰 부분부터 고쳤습니다.",
      score: 58,
      strengths: [
        { text: "이번 답변에서 문제를 데이터 불일치로 정의했습니다.", points: 12 },
        { text: "이번 답변에 로그와 재현 경로가 있습니다.", points: 14 },
        { text: "이번 답변에 영향이 큰 것부터 고친 순서가 있습니다.", points: 12 },
        { text: "이번 답변에 습관어가 없습니다.", points: 10 },
        { text: "이번 답변이 질문 상황에 바로 들어갔습니다.", points: 10 },
      ],
      weaknesses: [
        { text: "이번 답변에 빈도×금액 기준이 없습니다." },
        { text: "이번 답변에서 버린 로그의 근거가 없습니다." },
        { text: "이번 답변에 전후 숫자가 없습니다." },
        { text: "이번 답변에서 혼자 한 일과 팀 일이 섞여 있습니다." },
        { text: "이번 답변에 재발 방지가 없습니다." },
      ],
      missing_points: ["모범 답안의 노이즈를 버린 기준", "모범 답안의 전후 지표", "모범 답안의 재발 방지"],
      sentence_rewrites: [
        {
          original: "원인을 로그와 재현 경로로 좁힌 뒤, 영향이 큰 부분부터 고쳤습니다.",
          improved: "로그 전체가 아니라 재현 가능한 경로만 남겼고, 발생 빈도×금액으로 상위 1건부터 고쳤습니다.",
          reason: "모범 답안의 기준 문장으로 다듬었습니다.",
        },
      ],
      keywords: ["재현 경로", "빈도", "금액", "상위 1건", "체크리스트"],
      mindmap: mindmap("모범 답안", [
        { label: "상황", children: ["데이터 불일치"] },
        { label: "행동", children: ["재현 경로", "빈도×금액"] },
        { label: "결과", children: ["상위 1건", "체크리스트"] },
      ]),
      feedback_habits: "이번 답변은 습관어가 거의 없습니다.",
      feedback_content: '이번 답변은 문제 정의는 분명하지만, 모범 답안의 "영향이 크다" 기준이 빠졌습니다.',
      model_answer:
        "화면 수치와 원장 데이터가 어긋나 데모 신뢰가 떨어졌습니다. 로그 전체가 아니라 재현 가능한 경로만 남기는 것이 과제였습니다. 발생 빈도×금액 영향으로 이슈를 정렬하고, 상위 1건의 재현 경로만 남긴 뒤 나머진 가설로 표시했습니다. 핵심 불일치를 먼저 고쳤고, 같은 기준을 이후 디버깅 체크리스트로 남겼습니다.",
      source: "mock",
    },
  ];
}
