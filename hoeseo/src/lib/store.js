import { DEFAULT_RESUME, KIA_MASTERY, isKiaResume } from "../data/resume.js";
import { QUESTION_BANK, findBankById, findBankByQuestion, pickUnansweredQuestion } from "../data/questions.js";
import { addDays, dateKey } from "./dates.js";
import { buildDemoRecords } from "./demoRecords.js";

export const KEYS = {
  RESUME: "mock-interview:resume",
  RECORDS: "mock-interview:records",
  API_KEY: "mock-interview:api-key",
  SESSION: "mock-interview:session",
  SEEDED: "mock-interview:seeded-v8",
  INSTALL_TIP: "mock-interview:install-tip-dismissed",
  WORK_MODE: "mock-interview:work-mode",
  REPORT_EMAIL: "mock-interview:report-email",
  REPORT_SENT: "mock-interview:report-sent",
};

export const FIXED_TRACKS = [
  { key: "intro", label: "1분 자기소개", question: "1분 자기소개" },
  {
    key: "strength",
    label: "장점·단점",
    question: "본인의 장점 한 가지와 단점 한 가지를 말해주세요.",
  },
  {
    key: "motivation",
    label: "왜 기아인가",
    question: "다른 회사가 아닌 기아여야 하는 이유는 무엇입니까?",
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function trackKeyOf(record = {}) {
  if (record.trackKey && record.trackKey !== "open" && record.trackKey !== "bank") {
    return record.trackKey;
  }
  const question = record.question || "";
  if (/1분\s*자기소개/.test(question)) return "intro";
  if (/장점 한 가지와 단점|자신의 장점|장단점/.test(question) || /자신의 단점/.test(question)) {
    return "strength";
  }
  if (/기아여야 하는 이유/.test(question)) return "motivation";
  if (record.questionType === "followup") return "followup";
  return record.trackKey || "bank";
}

export function trackLabel(key) {
  if (key === "followup") return "꼬리질문";
  if (key === "bank") return "기본 질문";
  return FIXED_TRACKS.find((item) => item.key === key)?.label || "";
}

export function trackGroupKey(record = {}) {
  const key = trackKeyOf(record);
  return key === "open" ? `q:${record.question || ""}` : `track:${key}`;
}

export function extractMastery(content = "") {
  if (isKiaResume(content)) {
    return { ...KIA_MASTERY, updatedAt: new Date().toISOString() };
  }
  const collapsed = content.replace(/\s+/g, " ").trim();
  const sentences = content
    .split(/[\n.!?。]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
  const stop = new Set([
    "그리고",
    "그래서",
    "하지만",
    "입니다",
    "있습니다",
    "했습니다",
    "제가",
    "것은",
    "있는",
    "하는",
    "대한",
    "위해",
    "통해",
    "관련",
  ]);
  const words = collapsed.match(/[가-힣A-Za-z]{2,12}/g) || [];
  const counts = {};
  words.forEach((word) => {
    if (!stop.has(word)) counts[word] = (counts[word] || 0) + 1;
  });
  const keywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 12);
  return {
    mustKnow: sentences.slice(0, 8),
    keywords,
    flow: sentences.map((text, index) => ({ step: index + 1, text })),
    updatedAt: new Date().toISOString(),
  };
}

export function getResume() {
  return readJson(KEYS.RESUME, null);
}

export function ensureResume() {
  const current = getResume();
  if (current?.content && isKiaResume(current.content) && !current.isDemo) return current;
  const next = {
    content: DEFAULT_RESUME,
    updatedAt: new Date().toISOString(),
    mastery: extractMastery(DEFAULT_RESUME),
    isDemo: false,
  };
  writeJson(KEYS.RESUME, next);
  return next;
}

export function getMastery() {
  const resume = getResume();
  return resume?.content ? resume.mastery || extractMastery(resume.content) : null;
}

export function saveResume(content) {
  const trimmed = content.trim();
  const next = {
    content: trimmed,
    updatedAt: new Date().toISOString(),
    mastery: extractMastery(trimmed),
  };
  writeJson(KEYS.RESUME, next);
  return next;
}

export function getRecords() {
  return readJson(KEYS.RECORDS, []);
}

export function saveRecord(record) {
  const records = [{ ...record, trackKey: trackKeyOf(record) }, ...getRecords().filter((item) => item.id !== record.id)];
  writeJson(KEYS.RECORDS, records);
  return records;
}

export function recordsForDate(key) {
  return getRecords()
    .filter((item) => item.date === key)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function markedDates() {
  return new Set(getRecords().map((item) => item.date));
}

export function getApiKey() {
  return localStorage.getItem(KEYS.API_KEY) || "";
}

export function setApiKey(value) {
  localStorage.setItem(KEYS.API_KEY, value.trim());
}

export function getReportEmail() {
  return (localStorage.getItem(KEYS.REPORT_EMAIL) || "").trim();
}

export function setReportEmail(value) {
  localStorage.setItem(KEYS.REPORT_EMAIL, String(value || "").trim());
}

export function getReportSent(key) {
  return readJson(KEYS.REPORT_SENT, {})[key] || "";
}

export function setReportSent(key, status = "sent") {
  const map = readJson(KEYS.REPORT_SENT, {});
  map[key] = status;
  writeJson(KEYS.REPORT_SENT, map);
}

export function getSession() {
  return readJson(KEYS.SESSION, null);
}

export function setSession(session) {
  writeJson(KEYS.SESSION, session);
}

export function clearSession() {
  localStorage.removeItem(KEYS.SESSION);
}

export function isInstallTipDismissed() {
  return localStorage.getItem(KEYS.INSTALL_TIP) === "1";
}

export function dismissInstallTip() {
  localStorage.setItem(KEYS.INSTALL_TIP, "1");
}

export function getWorkMode() {
  const value = localStorage.getItem(KEYS.WORK_MODE);
  return value === "work" || value === "free" ? value : "";
}

export function setWorkMode(value) {
  if (value === "work" || value === "free") localStorage.setItem(KEYS.WORK_MODE, value);
}

export function timeLimitSec({ trackKey, workMode, speechSupported }) {
  if (trackKey === "intro" && speechSupported) return 60;
  if (workMode === "free") return 240;
  return 0;
}

export function todayBankProgress() {
  const today = dateKey();
  const answeredIds = [];
  const answeredQuestions = [];
  getRecords().forEach((record) => {
    if (
      record.date !== today ||
      record.isDemo ||
      record.questionType === "followup" ||
      record.trackKey === "followup"
    ) {
      return;
    }
    const item = (record.bankId && findBankById(record.bankId)) || findBankByQuestion(record.question);
    if (item) {
      answeredIds.push(item.id);
      answeredQuestions.push(item.question);
    }
  });
  return pickUnansweredQuestion({ answeredIds, answeredQuestions });
}

export function historyForRecord(record = {}) {
  const group = trackGroupKey(record);
  if (!group || group === "q:") return [];
  return getRecords()
    .filter((item) => trackGroupKey(item) === group)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function historyForTrack(key) {
  return getRecords()
    .filter((item) => trackKeyOf(item) === key)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((item) => ({
      id: item.id,
      date: item.date,
      score: item.score || 0,
      createdAt: item.createdAt,
      question: item.question,
    }));
}

export function growthSeries() {
  const groups = {};
  getRecords().forEach((record) => {
    const key = trackGroupKey(record);
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  });
  return Object.values(groups)
    .map((items) => {
      const sorted = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const first = sorted[0].score || 0;
      const last = sorted[sorted.length - 1].score || 0;
      const key = trackKeyOf(sorted[0]);
      return {
        question: sorted[0].question,
        trackKey: key,
        label: trackLabel(key) || sorted[0].question,
        count: sorted.length,
        scores: sorted.map((item) => item.score || 0),
        delta: last - first,
      };
    })
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count);
}

export function normalizeFeedback(data = {}) {
  return {
    score: data.score ?? 0,
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    deduction_details: data.deduction_details || [],
    feedback_habits: data.feedback_habits || "",
    feedback_content: data.feedback_content || data.summary || "",
    model_answer: data.model_answer || "",
    missing_points: data.missing_points || [],
    sentence_rewrites: data.sentence_rewrites || [],
    keywords: data.keywords || [],
    mindmap: data.mindmap || null,
    trackKey: trackKeyOf(data),
    durationSec: data.durationSec ?? null,
    timeLimitSec: data.timeLimitSec ?? null,
    timedOut: !!data.timedOut,
    withinTime: data.withinTime,
    workMode: data.workMode || "",
    source: data.source,
    apiError: data.apiError || "",
  };
}

function textOf(value) {
  return typeof value === "string" ? value : value?.text || "";
}

export function buildBriefing(key = dateKey(), options = {}) {
  const records = recordsForDate(key).filter((item) => !options.liveOnly || !item.isDemo);
  if (!records.length) return null;
  const avgScore = Math.round(records.reduce((sum, item) => sum + (item.score || 0), 0) / records.length);
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const strengths = unique(records.flatMap((item) => (item.strengths || []).map(textOf)));
  const weaknesses = unique(records.flatMap((item) => (item.weaknesses || []).map(textOf)));
  const missing = unique(records.flatMap((item) => item.missing_points || []));
  const tracks = FIXED_TRACKS.map((track) => {
    const history = historyForTrack(track.key);
    const todayItems = records.filter((item) => trackKeyOf(item) === track.key);
    const scores = history.map((item) => item.score);
    const delta = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;
    return {
      ...track,
      doneToday: todayItems.length > 0,
      todayCount: todayItems.length,
      todayLatest: todayItems[0] || null,
      history,
      scores,
      delta,
      trend: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    };
  });
  const grouped = {};
  records.forEach((record) => {
    const keyName = trackKeyOf(record);
    const group = keyName === "open" ? record.question : keyName;
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(record);
  });
  const duplicates = Object.values(grouped)
    .filter((items) => items.length > 1)
    .map((items) => {
      const sorted = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return {
        question: sorted[0].question,
        trackKey: trackKeyOf(sorted[0]),
        count: sorted.length,
        scores: sorted.map((item) => item.score || 0),
        delta: (sorted[sorted.length - 1].score || 0) - (sorted[0].score || 0),
      };
    });
  return {
    dateKey: key,
    count: records.length,
    avgScore,
    bestScore: Math.max(...records.map((item) => item.score || 0)),
    strengths: strengths.slice(0, 8),
    weaknesses: weaknesses.slice(0, 8),
    missing: missing.slice(0, 8),
    focus: (weaknesses.length ? weaknesses : missing).slice(0, 3),
    tracks,
    duplicates,
    growth: growthSeries(),
    records,
  };
}

export function serializeBriefing(briefing) {
  if (!briefing) return null;
  return {
    dateKey: briefing.dateKey,
    count: briefing.count,
    avgScore: briefing.avgScore,
    bestScore: briefing.bestScore,
    strengths: briefing.strengths || [],
    weaknesses: briefing.weaknesses || [],
    missing: briefing.missing || [],
    focus: briefing.focus || [],
    tracks: (briefing.tracks || []).map((track) => ({
      key: track.key,
      label: track.label,
      doneToday: track.doneToday,
      todayCount: track.todayCount,
      scores: track.scores || [],
      delta: track.delta || 0,
    })),
    duplicates: (briefing.duplicates || []).map((item) => ({
      question: item.question,
      trackKey: item.trackKey,
      count: item.count,
      scores: item.scores || [],
      delta: item.delta || 0,
    })),
    growth: (briefing.growth || []).slice(0, 6).map((item) => ({
      label: item.label,
      count: item.count,
      scores: item.scores || [],
      delta: item.delta || 0,
    })),
    sessions: (briefing.records || []).map((item) => ({
      time: item.createdAt,
      trackKey: trackKeyOf(item),
      trackLabel: trackLabel(trackKeyOf(item)) || "기본 질문",
      question: item.question,
      score: item.score || 0,
      durationSec: item.durationSec ?? null,
      habits: item.feedback_habits || "",
      content: item.feedback_content || "",
      missing: (item.missing_points || []).slice(0, 3),
    })),
  };
}

export function seedApp() {
  if (localStorage.getItem(KEYS.SEEDED) === "v8") {
    ensureResume();
    return getRecords();
  }
  const records = getRecords();
  if (records.length === 0 || records.every((item) => item.isDemo)) {
    writeJson(KEYS.RECORDS, buildDemoRecords());
  }
  ensureResume();
  localStorage.setItem(KEYS.SEEDED, "v8");
  return getRecords();
}

export function clearDemoRecords() {
  const live = getRecords().filter((item) => !item.isDemo);
  writeJson(KEYS.RECORDS, live);
  return live;
}

export async function requestReportEmail(payload) {
  const response = await fetch("/api/report-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "메일 요청에 실패했습니다.");
  return data;
}

export async function sendDayReport(key, options = {}) {
  const email = String(options.email || getReportEmail()).trim();
  if (!email) throw new Error("설정에서 리포트 받을 이메일을 먼저 저장해 주세요.");
  const briefing = serializeBriefing(buildBriefing(key, { liveOnly: true }));
  if (!briefing) {
    if (options.markEmpty) setReportSent(key, "empty");
    return { ok: true, skipped: true, reason: "empty" };
  }
  const result = await requestReportEmail({ action: "send", dateKey: key, email, briefing });
  if (options.markSent !== false && (result.ok || result.already)) {
    setReportSent(key, result.skipped ? "empty" : "sent");
  }
  return result;
}

export async function sendTestEmail(email = getReportEmail()) {
  const value = String(email || "").trim();
  if (!value) throw new Error("이메일 주소를 입력해 주세요.");
  return requestReportEmail({ action: "send", email: value, test: true });
}

export async function saveReportEmailRemote(email) {
  return requestReportEmail({ action: "settings", email: String(email || "").trim() });
}

export async function sendYesterdayIfNeeded() {
  const email = getReportEmail();
  if (!email) return { skipped: true, reason: "no-email" };
  const yesterday = dateKey(addDays(new Date(), -1));
  if (getReportSent(yesterday)) return { skipped: true, reason: "already" };
  try {
    return await sendDayReport(yesterday, { email, markEmpty: true, markSent: true });
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function syncTodayBriefing() {
  const email = getReportEmail();
  if (!email) return;
  const today = dateKey();
  const briefing = serializeBriefing(buildBriefing(today, { liveOnly: true }));
  if (briefing) {
    await requestReportEmail({ action: "sync", dateKey: today, email, briefing }).catch(() => {});
  }
}

export function bankQuestionPayload(item, extras = {}) {
  const fixed = FIXED_TRACKS.find((track) => track.question === item.question);
  return {
    question: item.question,
    source: "bank",
    questionType: fixed ? "fixed" : extras.questionType || "bank",
    trackKey: fixed?.key || extras.trackKey || "bank",
    category: item.category,
    modelAnswer: item.answer,
    keywords: item.keywords,
    bankId: item.id,
    bankDoneToday: extras.bankDoneToday,
    bankTotal: extras.bankTotal ?? QUESTION_BANK.length,
    bankRemainingToday: extras.bankRemainingToday,
    cycled: !!extras.cycled,
  };
}

export { QUESTION_BANK };
