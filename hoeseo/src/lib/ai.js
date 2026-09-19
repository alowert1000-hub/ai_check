import { findBankById, findBankByQuestion, pickUnansweredQuestion } from "../data/questions.js";
import { dateKey } from "./dates.js";
import { bankQuestionPayload, getApiKey, getRecords, getResume } from "./store.js";

const MODEL = "gpt-4o";
const FILLER_RE =
  /(^|[\s,.\u2026])((?:음{1,3}|어{1,3})(?=[\s,.\u2026!?]|$)|그니까|그러니까|(?:그냥|약간)(?=[\s,.\u2026!?]|$))/g;

const FOLLOWUP_PROMPT = `당신은 기아 생산·품질 실무 면접관입니다.
자기소개서에 적힌 구체 경험만으로 꼬리질문 1개를 만듭니다. 질문 은행 문항을 다시 묻지 마세요.

자기소개서에서 검증 가능한 사실만 쓰세요. 이 세 경험 밖을 만들지 마세요.
1) 블루핸즈 엔진오일 교환 중 경유 냄새 → 엔진커버 탈거·라이트 추적 → 연료 리턴호스 누유, 화재 위험, 보증수리, 렌터카 수배. 고객이 운전해가겠다고 해도 설득해 운행 금지
2) 고교 기능반 쏘나타 스마트키 회로 실패 → 야간대학 회로 기초 → 시동 불량, 배터리 약 12V, 전원 공급 회로 의심 → 멀티테스터·전구테스터 통전시험 → 계기판 커넥터 통전 불량, 계기판 교체. 모든 원인을 배제했다고 과장하지 말 것
3) 산학인턴 부동액 보조탱크 서열 실수 → 1-1-1 루틴(서열 1분, 공구 1분, 인수인계 1분). 품질 우선, 특근 참여율 90% 이상, 피로는 선임 공유. 브레이크 파이프 토크 미체결·머드가드 이종 누락을 선제 발견

매번 다른 시선에서 물으세요. 아래 각도를 돌아가며 고르세요.
- 원인: 그때 왜 그 판단을 했는가
- 대안: 다른 선택을 했다면
- 수치·근거: 전후 지표, 시간, 재고, 참여율
- 기여 분리: 본인 역할과 팀·선임 역할
- 재발 방지: 다음엔 무엇을 바꿨는가
- 안전 vs 출고·생산성 트레이드오프
- 실패 인정: 과장하지 말고 못 한 지점
- 선배·고객 설득: 반대 의견을 어떻게 받았는가
- 현장 제약: 재고 없음, 속도 압박, 교대 피로

규칙:
- 이미 나온 꼬리질문과 같은 각도·같은 사실을 반복하지 마세요.
- 자소서에 없는 회사, 프로젝트, 수치를 가정하지 마세요.
- 한 문장 또는 짧은 두 문장, 존댓말, 실제 면접관 말투.
- 반드시 JSON만 반환하세요.
{"question": "꼬리질문", "angle": "사용한 시선", "type": "followup"}`;

const SCORE_PROMPT = `당신은 10년 차 대기업 취업 컨설턴트입니다.
기아, 현대차, 삼성, SK 등 제조·엔지니어링 직무 면접을 코칭합니다.
점수는 후하게 주지 마세요. 잘한 점만 가점하고, 0점에서 시작합니다.

[채점 규칙]
- 100점에서 깎지 마세요. score는 잘한 점(strengths)의 points 합입니다. 0~100 정수.
- strengths를 최소 5개, weaknesses를 최소 5개 뽑으세요. 각 항목은 한 줄로 구체적으로.
- 잘한 점 1개당 points는 4~16. 평범한 답은 합 35~55, 우수한 답만 70 이상, 거의 완벽할 때만 85 이상.
- 못한 점은 점수에서 빼지 말고 weaknesses에만 적습니다.
- 한국어 활용형(했어요, 했습니다, 어떻게, 어려운, 역할을) 안의 '어/음/아'는 습관어가 아닙니다. 절대 지적하지 마세요.
- input_mode가 text이면 키보드로 쓴 글입니다. '음...', '어...'처럼 독립된 군더더기가 문장에 실제로 있을 때만 말하기 습관을 지적하세요. 없으면 습관어 지적을 만들지 마세요.

[작성 원칙]
- strengths / weaknesses: 지금 제출된 이 답변 자체만 평가하세요. 자소서를 읽었다고 점수를 주지 마세요.
- model_answer: 준비된 모범 답안이 주어지면 그 문장을 그대로 쓰세요. 다시 지어내지 마세요. 없을 때만 자기소개서 스펙으로 작성합니다.
- keywords: model_answer에서 면접관이 들어야 할 핵심 단어 6~10개. 고유명사, 역할, 성과, 숫자, 도구를 우선합니다.
- missing_points: 방금 만든 model_answer와 사용자 답변을 비교하세요. 모범 답안에 있는 스펙·키워드가 사용자 답변에 없으면 적습니다.
- sentence_rewrites: 사용자 원문을 모범 답안의 말투·스펙에 가깝게 다듬습니다. improved도 사람이 말하는 문장이어야 합니다.
- mindmap: 모범 답안 키워드 구조. {"center":"모범 답안","branches":[{"label":"스펙","children":["키워드"]},{"label":"경험","children":["키워드"]}]}

[모범 답안 작성 순서]
1) 사용자 답변은 덮어 두고, 자기소개서만 읽습니다.
2) 그 스펙으로 질문에 답하는 구어 모범 답안을 만듭니다. 사용자가 말한 문장·순서를 베끼지 마세요.
3) 자소서에 없는 성과는 만들지 마세요. 자소서에 있는데 사용자가 안 말한 내용은 모범 답안에 넣으세요.
4) keywords를 모범 답안에서만 뽑습니다.
5) 그다음에야 사용자 답변을 보고 잘한 점/못한 점/빠진 내용을 적습니다.

[모범 답안 말투 — 꼭 지키세요]
- 컨설턴트 보고서, 자소서 문장, 발표 대본처럼 쓰지 마세요. 면접장에서 지금 말하는 구어체입니다.
- 상황(S), 과제(T), 행동(A), 결과(R), STAR 같은 라벨을 절대 넣지 마세요. 순서는 지키되 티가 나면 안 됩니다.
- 금지 표현: "결론부터 말씀드리면", "이를 통해", "해당 경험을 바탕으로", "시너지", "임팩트", "레버리지", "기여하고자 합니다", "역량을 함양", "최적화했습니다", "인사이트를 얻었습니다".
- 짧은 문장과 조금 긴 문장을 섞으세요. "그때", "그래서", "제가 맡은 건", "솔직히 말하면"처럼 사람이 생각하며 말하는 연결을 쓰세요.
- 없는 성과를 만들지 마세요. 자소서에 있는 사실만, 기억해서 말하는 것처럼.
- 1분 자기소개면 입으로 읽었을 때 50~70초(대략 420~650자). 다른 질문은 35~50초 분량.
- 존댓말로 면접관에게 말하되, 너무 매끈하게 다듬지 마세요.

반드시 아래 JSON만 반환하세요.
{
  "score": 0,
  "strengths": [{"text":"이번 답변에서 잘한 점","points":8}],
  "weaknesses": [{"text":"이번 답변에서 못한 점"}],
  "feedback_habits": "말하기 습관 피드백",
  "feedback_content": "이번 답변 내용 피드백",
  "model_answer": "자기소개서 스펙으로 처음부터 쓴, 사람이 면접장에서 말하는 모범 답안",
  "missing_points": ["모범 답안에는 있으나 이번 답변에 없는 내용"],
  "sentence_rewrites": [{"original":"사용자 원문","improved":"모범 답안 톤으로 다듬은 문장","reason":"이유"}],
  "keywords": ["자소서에서 나온 핵심 키워드"],
  "mindmap": {"center":"모범 답안","branches":[{"label":"상황","children":["키워드"]}]}
}`;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function resumeFacts(text) {
  const collapsed = (text || "").replace(/\s+/g, " ").trim();
  if (!collapsed) return ["해당 경험"];
  const sentences = collapsed
    .split(/[\n.!?。]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 12 && item.length <= 80);
  const matches =
    collapsed.match(
      /[가-힣A-Za-z0-9%]{2,16}(?=을|를|에|에서|으로|하며|경험|프로젝트|활동|담당|적용|개선|감소|증가)/g,
    ) || [];
  const facts = [];
  [...matches, ...sentences].forEach((item) => {
    const value = item.trim();
    if (value && !facts.includes(value)) facts.push(value);
  });
  return facts.slice(0, 6).length ? facts.slice(0, 6) : ["자기소개서에 적은 현장 경험"];
}

function fillerCount(text) {
  return ((text || "").match(FILLER_RE) || []).length;
}

function asPoints(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === "string") return { text: item.trim(), points: 0 };
      if (!item || typeof item !== "object") return null;
      const text = String(item.text || item.label || item.reason || "").trim();
      if (!text) return null;
      const points = Number.parseInt(item.points, 10);
      return { text, points: Number.isNaN(points) ? 0 : points };
    })
    .filter(Boolean);
}

function asRewrites(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const original = String(item.original || "").trim();
      const improved = String(item.improved || item.rewrite || "").trim();
      if (!original && !improved) return null;
      return { original, improved, reason: String(item.reason || "").trim() };
    })
    .filter(Boolean);
}

function padList(list, min, factory) {
  const next = [...list];
  let index = 0;
  while (next.length < min) {
    next.push(factory(index));
    index += 1;
  }
  return next;
}

function clampScore(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
}

function asStrings(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) =>
      typeof item === "string"
        ? item.trim()
        : item && typeof item === "object"
          ? String(item.label || item.detail || item.reason || item.text || "").trim()
          : "",
    )
    .filter(Boolean);
}

function parseJson(payload) {
  if (payload && typeof payload === "object") return payload;
  if (typeof payload !== "string" || !payload.trim()) throw new Error("AI 응답이 비어 있습니다.");
  try {
    return JSON.parse(payload);
  } catch {
    const fenced = payload.match(/```json\s*([\s\S]*?)```/i);
    const raw = fenced ? fenced[1] : payload;
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("JSON 형식을 읽지 못했습니다.");
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      throw new Error("JSON 파싱에 실패했습니다.");
    }
  }
}

function fallbackFollowup(resume, kind) {
  const fact = pick(resumeFacts(resume));
  return pick(
    kind === "general"
      ? [
          `1분 자기소개를 해주세요. ${fact} 경험이 왜 이 직무와 맞는지가 드러나게 말씀해 주세요.`,
          `지원 동기를 본인 경험과 연결해 설명해 주세요. 왜 다른 직무가 아니라 이 직무여야 합니까?`,
          `본인의 장점과 단점을 각각 하나씩, 직무 수행과 연결해 말씀해 주세요.`,
          `팀에서 의견이 갈렸을 때 본인은 어떻게 설득하거나 타협했나요?`,
          `실패하거나 아쉬웠던 경험을 하나 골라, 이후에 무엇을 바꿨는지 말해 주세요.`,
          `입사 후 3년 뒤 어떤 실무자가 되어 있기를 바라나요?`,
          `${fact}를 바탕으로, 최근 관심 있게 본 산업 이슈 하나를 본인 생각과 함께 말해 주세요.`,
        ]
      : [
          `${fact}를 적용했다고 하셨는데, 바쁜 생산·실무 일정 속에서 그 방식이 오히려 병목을 만들지는 않았나요? 당시 전후 지표로 반박해 주세요.`,
          `${fact}의 성과가 본인 기여인지, 팀·환경 변화 덕분인지 어떻게 분리해서 증명할 수 있습니까?`,
          `${fact}를 추진할 때 반대한 사람이 있었다면, 어떤 근거로 설득했고 설득이 실패하면 무엇을 포기했습니까?`,
          `${fact}에서 말한 수치를 재현하라고 하면, 지금 이 자리에서 계산 과정과 전제 조건을 설명해 주시겠습니까?`,
          `자기소개서의 "${fact}" 부분, 현장 제약이 지금보다 두 배였다면 같은 결정을 그대로 유지했겠습니까? 트레이드오프를 말해 주세요.`,
        ],
  );
}

function sentences(text) {
  return (text || "")
    .split(/[\n.!?。]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
}

function keywordsFrom(text) {
  const stop = new Set(["그리고", "그래서", "하지만", "입니다", "있습니다", "했습니다", "제가", "것은", "있는", "하는", "대한", "상황", "과제", "행동", "결과"]);
  const words = (text || "").match(/[가-힣A-Za-z]{2,12}/g) || [];
  const counts = {};
  words.forEach((word) => {
    if (!stop.has(word)) counts[word] = (counts[word] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 8);
}

function keywordMindmap(keywords) {
  return {
    center: "모범 답안",
    branches: [
      { label: "상황", children: keywords.slice(0, 2) },
      { label: "행동", children: keywords.slice(2, 4) },
      { label: "결과", children: keywords.slice(4, 6) },
      { label: "기억", children: keywords.slice(6, 8) },
    ].filter((item) => item.children.length),
  };
}

function fallbackModelAnswer(question, resume) {
  const parts = sentences(resume);
  const fact = resumeFacts(resume)[0];
  return [
    parts[0] || `${fact} 경험이 있습니다.`,
    parts[1] || `그때 제가 맡은 건 ${fact}이었습니다.`,
    parts[2] || "",
    parts[3] || "그 경험을 기준으로 이 질문에 답하겠습니다.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function mockScore(question, answer, resume, inputMode = "text", extras = {}) {
  const text = (answer || "").trim();
  const fillers = fillerCount(text);
  const short = text.length < 60;
  const hasNumber = /\d/.test(text);
  const hasLink = /(그래서|결과|역할|기준|때문에)/.test(text);
  const userSentences = sentences(text);
  const modelAnswer = extras.modelAnswer || fallbackModelAnswer(question, resume);
  const keywords = (extras.keywords || []).length ? extras.keywords : keywordsFrom(`${resume} ${modelAnswer}`).slice(0, 8);
  const missing = keywords
    .filter((word) => !text.includes(word))
    .slice(0, 5)
    .map((word) => `모범 답안의 "${word}"가 이번 답변에 없습니다.`);
  if (missing.length < 3) {
    ["역할 한 줄 정의", "우선순위 1가지", "전후 지표"].forEach((item) => {
      if (!text.includes(item.slice(0, 2))) missing.push(`모범 답안의 "${item}"이 이번 답변에 없습니다.`);
    });
  }
  const overlap = keywords.filter((word) => text.includes(word)).length;
  const strengths = [
    {
      text: overlap > 0 ? `이번 답변에서 모범 답안 키워드 ${overlap}개를 언급했습니다.` : "질문에 답을 제출한 것 자체가 출발점입니다.",
      points: Math.min(16, 4 + overlap * 3),
    },
    {
      text: short ? "짧게 말해서 군더더기는 적습니다." : "이번 답변에 경험을 펼칠 분량이 있습니다.",
      points: short ? 5 : 9,
    },
    {
      text: hasLink ? "이번 답변에 결과·이유 연결이 있습니다." : "이번 답변은 상황 설명까지는 들어갔습니다.",
      points: hasLink ? 10 : 6,
    },
    {
      text: hasNumber ? "이번 답변에 숫자가 있어 구체적입니다." : "이번 답변은 서사 중심으로 흘렀습니다.",
      points: hasNumber ? 12 : 5,
    },
    {
      text: fillers === 0 ? "이번 답변에 독립된 습관어가 없습니다." : "이번 답변은 끝까지 닫았습니다.",
      points: fillers === 0 ? 8 : 5,
    },
  ];
  const weaknesses = [
    {
      text: missing[0]
        ? `이번 답변에서 ${missing[0].replace("모범 답안의 ", "").replace("가 이번 답변에 없습니다.", "")} 요소가 빠졌습니다.`
        : "모범 답안의 결론 문장이 이번 답변에 없습니다.",
    },
    {
      text: short ? "이번 답변은 STAR 네 칸을 채우기엔 짧습니다." : "이번 답변의 판단 기준이 한 줄로 고정되지 않았습니다.",
    },
    {
      text: hasNumber ? "이번 답변의 숫자에 전후 비교가 없습니다." : "이번 답변을 숫자로 닫지 않았습니다.",
    },
    { text: "이번 답변에서 본인 역할과 팀 역할이 나뉘지 않았습니다." },
    {
      text:
        inputMode === "speech" && fillers > 0
          ? "이번 답변의 첫 문장이 습관어로 흐려졌습니다."
          : "이번 답변을 모범 답안처럼 결론-근거 순으로 바꾸면 좋습니다.",
    },
  ];
  const modelSentences = sentences(modelAnswer);
  const originals = userSentences.slice(0, 3).length ? userSentences.slice(0, 3) : [text.slice(0, 80) || "답변이 짧습니다."];
  return {
    score: clampScore(strengths.reduce((sum, item) => sum + item.points, 0)),
    strengths,
    weaknesses,
    deduction_details: [],
    feedback_habits:
      fillers > 0
        ? `이번 답변에서 독립된 "음/어"가 ${fillers}회 있습니다.`
        : "이번 답변은 습관어 오탐 없이 문장으로 제출되었습니다.",
    feedback_content: `이번 답변과 모범 답안을 비교하면 키워드 ${overlap}/${keywords.length}개가 겹칩니다. 빠진 표현을 다음 연습에서 그대로 넣어 보세요.`,
    model_answer: modelAnswer,
    missing_points: missing.slice(0, 5),
    sentence_rewrites: originals.map((original, index) => ({
      original,
      improved: modelSentences[index] || modelSentences[0] || modelAnswer.slice(0, 80),
      reason: "이번 문장을 모범 답안처럼 사람이 말하는 순서로 바꿨습니다.",
    })),
    keywords,
    mindmap: keywordMindmap(keywords),
    source: "mock",
  };
}

function normalizeAiScore(data, extras = {}) {
  const strengths = padList(asPoints(data?.strengths), 5, (index) => ({
    text: `경험의 일부가 전달된 지점 ${index + 1}`,
    points: 4,
  })).map((item) => ({ ...item, points: Math.max(0, Math.min(20, item.points || 4)) }));
  const weaknesses = padList(asPoints(data?.weaknesses), 5, (index) => ({
    text: `STAR 구간 ${index + 1}을 더 구체화해야 합니다.`,
    points: 0,
  }));
  const points = strengths.reduce((sum, item) => sum + (item.points || 0), 0);
  const prepared = String(extras.preparedAnswer || data?.model_answer || "").trim();
  const keywords =
    Array.isArray(extras.preparedKeywords) && extras.preparedKeywords.length
      ? extras.preparedKeywords.map(String).filter(Boolean).slice(0, 10)
      : Array.isArray(data?.keywords) && data.keywords.length
        ? data.keywords.map(String).filter(Boolean).slice(0, 10)
        : keywordsFrom(prepared);
  const mindmap =
    data?.mindmap && typeof data.mindmap === "object" && data.mindmap.center
      ? data.mindmap
      : keywordMindmap(keywords);
  return {
    score: clampScore(points),
    strengths,
    weaknesses,
    deduction_details: asStrings(data?.deduction_details),
    feedback_habits: String(data?.feedback_habits || "").trim(),
    feedback_content: String(data?.feedback_content || "").trim(),
    model_answer: prepared,
    missing_points: asStrings(data?.missing_points),
    sentence_rewrites: asRewrites(data?.sentence_rewrites),
    keywords,
    mindmap,
    source: extras.source || "openai",
  };
}

export async function keyStatus() {
  try {
    const data = await (await fetch("/api/status")).json().catch(() => ({}));
    return { serverKey: !!data.serverKey, clientKey: !!getApiKey() };
  } catch {
    return { serverKey: false, clientKey: !!getApiKey() };
  }
}

function errorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (data.error?.message) return data.error.message;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

async function chatOnce(messages, options = {}) {
  const key = getApiKey() || "";
  const payload = {
    model: options.model || MODEL,
    temperature: options.temperature ?? 0.4,
    messages,
    response_format: options.responseFormat ?? { type: "json_object" },
  };
  const headers = { "Content-Type": "application/json" };
  if (key) headers.Authorization = `Bearer ${key}`;
  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("AI 서버가 JSON이 아닌 응답을 보냈습니다. 개발 서버 프록시가 꺼져 있을 수 있어요.");
  }
  if (!response.ok) throw new Error(errorMessage(data, `AI 요청 실패 (${response.status})`));
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 응답이 비어 있습니다.");
  return content;
}

async function chat(messages, options = {}) {
  const model = options.model || MODEL;
  try {
    return await chatOnce(messages, { ...options, model });
  } catch (error) {
    if (!(model === "gpt-4o" && /model|does not exist|not found|access|권한/i.test(error.message || ""))) {
      throw error;
    }
    return chatOnce(messages, { ...options, model: "gpt-4o-mini" });
  }
}

export async function testConnection() {
  return parseJson(
    await chat(
      [
        { role: "system", content: '반드시 {"ok":true,"model":"연결된 모델명"} JSON만 반환하세요.' },
        { role: "user", content: "연결 테스트" },
      ],
      { model: "gpt-4o-mini", temperature: 0 },
    ),
  );
}

export async function nextQuestion(resumeText) {
  const resume = resumeText || getResume()?.content || "";
  const records = getRecords();
  const today = dateKey();
  const todayRecords = records.filter((item) => item.date === today && !item.isDemo);
  const latest = todayRecords[0];
  const answeredIds = [];
  const answeredQuestions = [];
  todayRecords.forEach((record) => {
    if (record.questionType === "followup" || record.trackKey === "followup") return;
    const item = (record.bankId && findBankById(record.bankId)) || findBankByQuestion(record.question);
    if (item) {
      answeredIds.push(item.id);
      answeredQuestions.push(item.question);
    }
  });
  const bank = pickUnansweredQuestion({ answeredIds, answeredQuestions });
  if (todayRecords.length % 4 === 0 && resume) {
    const previousFollowups = todayRecords
      .filter((item) => item.questionType === "followup" || item.trackKey === "followup")
      .map((item) => item.question)
      .filter(Boolean);
    const lastBank =
      latest && latest.questionType !== "followup" && latest.trackKey !== "followup" ? latest : null;
    try {
      const data = parseJson(
        await chat(
          [
            { role: "system", content: FOLLOWUP_PROMPT },
            {
              role: "user",
              content: `이미 나온 꼬리질문:\n${
                previousFollowups.length
                  ? previousFollowups.map((item, index) => `${index + 1}. ${item}`).join("\n")
                  : "(없음)"
              }\n\n최근 기본 질문(참고만, 같은 내용을 다시 묻지 말 것):\n${lastBank?.question || "(없음)"}\n\n최근 지원자 답변:\n${lastBank?.answer || "(없음)"}\n\n자기소개서:\n${resume}\n\n위 자소서 경험만으로, 아직 안 쓴 시선의 꼬리질문 1개를 JSON으로 반환하세요.`,
            },
          ],
          { temperature: 0.85 },
        ),
      );
      const question = String(data.question || "").trim();
      if (!question) throw new Error("꼬리질문이 비어 있습니다.");
      if (previousFollowups.some((item) => item === question)) throw new Error("이미 나온 꼬리질문입니다.");
      return {
        question,
        source: "followup",
        questionType: "followup",
        trackKey: "followup",
        category: "꼬리질문",
        bankDoneToday: bank.done,
        bankTotal: bank.total,
        bankRemainingToday: bank.remaining,
      };
    } catch (error) {
      return {
        question: fallbackFollowup(resume, "deep"),
        source: "mock",
        questionType: "followup",
        trackKey: "followup",
        category: "꼬리질문",
        apiError: error.message,
        bankDoneToday: bank.done,
        bankTotal: bank.total,
        bankRemainingToday: bank.remaining,
      };
    }
  }
  return bankQuestionPayload(bank.item, {
    bankDoneToday: bank.done,
    bankTotal: bank.total,
    bankRemainingToday: bank.remaining,
    cycled: bank.cycled,
  });
}

export async function scoreAnswer({
  question,
  answer,
  resumeText,
  inputMode = "text",
  durationSec = null,
  timeLimitSec = null,
  timedOut = false,
  preparedAnswer = "",
  preparedKeywords = [],
}) {
  const resume = resumeText || getResume()?.content || "";
  const mode = inputMode === "speech" ? "speech" : "text";
  const bank = preparedAnswer ? null : findBankByQuestion(question);
  const modelAnswer = preparedAnswer || bank?.answer || "";
  const keywords = preparedKeywords.length ? preparedKeywords : bank?.keywords || [];
  const fallback = () => mockScore(question, answer, resume, mode, { modelAnswer, keywords });
  try {
    const preparedBlock = modelAnswer
      ? `[준비된 모범 답안 — 이 문장을 model_answer에 그대로 넣으세요. 고쳐 쓰지 마세요.]\n${modelAnswer}\n\n[준비된 핵심 키워드]\n${keywords.join(", ")}`
      : "[준비된 모범 답안 없음 — 자기소개서 스펙으로만 모범 답안을 쓰세요.]";
    const result = normalizeAiScore(
      parseJson(
        await chat(
          [
            { role: "system", content: SCORE_PROMPT },
            {
              role: "user",
              content: `input_mode: ${mode}
answer_seconds: ${durationSec ?? "unknown"}
time_limit_seconds: ${timeLimitSec ?? "none"}
timed_out: ${timedOut ? "yes" : "no"}

잘한 점/못한 점은 이번 사용자 답변만 보세요.
빠진 내용·문장 다듬기는 모범 답안과 이번 답변을 비교하세요.
keywords는 준비된 키워드가 있으면 그것을 쓰세요.

${preparedBlock}

[자기소개서]
${resume}

[면접관 질문]
${question}

[지원자 이번 답변 — 채점용]
${answer}`,
            },
          ],
          { temperature: 0.35 },
        ),
      ),
      { source: "openai", preparedAnswer: modelAnswer, preparedKeywords: keywords },
    );
    if (!result.feedback_habits && !result.feedback_content && !result.model_answer) {
      throw new Error("피드백 필드가 비어 있습니다.");
    }
    return result;
  } catch (error) {
    return { ...fallback(), apiError: error.message };
  }
}
