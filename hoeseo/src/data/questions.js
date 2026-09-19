import questions from "./questions.json";

export const QUESTION_BANK = questions;

export const CATEGORY_META = [
  { key: "1. 지원동기 및 기아 관련 질문", short: "지원동기" },
  { key: "2. 직무 정의, 역량 및 필살기", short: "직무역량" },
  { key: "3. 현장 상황 대응", short: "현장대응" },
  { key: "4. 조직 생활, 협업 및 갈등", short: "협업갈등" },
  { key: "5. 근무 환경, 체력 및 인성", short: "근무환경" },
  { key: "7. 인성 및 본인 성향", short: "인성" },
];

export function categoryShort(category = "") {
  return CATEGORY_META.find((item) => item.key === category)?.short || category.replace(/^\d+\.\s*/, "");
}

export function questionSummary(item) {
  if (item?.summary) return String(item.summary).trim();
  const sentences = String(item?.answer || "")
    .split(/(?<=다\.|요\.|니다\.|까\?)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return sentences.slice(0, 2).join("\n");
}

export function groupedQuestionBank() {
  const byCategory = new Map();
  for (const item of QUESTION_BANK) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }
  const known = CATEGORY_META.map((meta) => ({
    ...meta,
    items: byCategory.get(meta.key) || [],
  })).filter((group) => group.items.length);
  const extras = [...byCategory.entries()]
    .filter(([key]) => !CATEGORY_META.some((meta) => meta.key === key))
    .map(([key, items]) => ({ key, short: categoryShort(key), items }));
  return [...known, ...extras];
}

export function bankNeighbors(id) {
  const index = QUESTION_BANK.findIndex((item) => item.id === id);
  return {
    item: index >= 0 ? QUESTION_BANK[index] : null,
    index,
    prev: index > 0 ? QUESTION_BANK[index - 1] : null,
    next: index >= 0 && index < QUESTION_BANK.length - 1 ? QUESTION_BANK[index + 1] : null,
    total: QUESTION_BANK.length,
  };
}

export function findBankByQuestion(question = "") {
  const text = String(question).trim();
  if (!text) return null;
  return (
    QUESTION_BANK.find((item) => item.question === text) ||
    QUESTION_BANK.find((item) => text.includes(item.question) || item.question.includes(text)) ||
    null
  );
}

export function findBankById(id) {
  return QUESTION_BANK.find((item) => item.id === id) || null;
}

export function pickUnansweredQuestion({ answeredIds = [], answeredQuestions = [] } = {}) {
  const idSet = new Set(answeredIds.filter(Boolean));
  const questionSet = new Set(answeredQuestions.filter(Boolean));
  const remainingItems = QUESTION_BANK.filter(
    (item) => !idSet.has(item.id) && !questionSet.has(item.question),
  );
  const remaining = remainingItems.length;
  const pool = remaining ? remainingItems : QUESTION_BANK;
  return {
    item: pool[Math.floor(Math.random() * pool.length)],
    remaining,
    done: QUESTION_BANK.length - remaining,
    total: QUESTION_BANK.length,
    cycled: remaining === 0,
  };
}
