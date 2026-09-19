import questions from "./questions.json";

export const QUESTION_BANK = questions;

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
