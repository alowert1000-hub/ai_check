import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { dateKey, formatKoreanDate, formatKoreanTime } from "../lib/dates.js";
import { dismissInstallTip, isInstallTipDismissed, normalizeFeedback, trackKeyOf, trackLabel } from "../lib/store.js";
import { BackIcon, BankIcon, Chevron, HomeIcon, MasteryIcon, MicIcon, ReportIcon, SettingsIcon, StopIcon } from "./icons.jsx";

export function PhoneShell({ children, className = "" }) {
  return (
    <div className="min-h-dvh bg-[#E5E8EB]">
      <div className={`relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-toss-bg shadow-[0_0_0_1px_rgba(25,31,40,0.04)] ${className}`}>
        {children}
      </div>
    </div>
  );
}

const TABS = [
  { to: "/", label: "홈", icon: HomeIcon, end: true },
  { to: "/report", label: "리포트", icon: ReportIcon },
  { to: "/bank", label: "답변", icon: BankIcon, match: (path) => path === "/bank" || path.startsWith("/bank/") },
  { to: "/mastery", label: "숙지", icon: MasteryIcon, match: (path) => path === "/mastery" || path === "/resume" },
  { to: "/settings", label: "설정", icon: SettingsIcon },
];

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-toss-200 bg-white/95 px-1.5 pt-2 backdrop-blur-md pb-[max(12px,env(safe-area-inset-bottom))]">
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={() => {
                const active = tab.match ? tab.match(pathname) : pathname === tab.to || (tab.end && pathname === "/");
                return `flex flex-col items-center gap-1 py-1 text-[11px] font-semibold ${
                  active ? "text-toss-blue" : "text-toss-500"
                }`;
              }}
            >
              {() => {
                const active = tab.match ? tab.match(pathname) : pathname === tab.to || (tab.end && pathname === "/");
                return (
                  <>
                    <tab.icon active={active} />
                    {tab.label}
                  </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "lg",
  className = "",
  disabled,
  type = "button",
  ...props
}) {
  const variants = {
    primary: "bg-toss-blue text-white shadow-[0_8px_20px_rgba(49,130,246,0.28)] active:bg-toss-blue-press",
    secondary: "bg-white text-toss-text shadow-[0_6px_18px_rgba(25,31,40,0.06)]",
    ghost: "bg-transparent text-toss-600",
    danger: "bg-[#FFF1F1] text-toss-red",
  };
  const sizes = {
    lg: "h-14 px-5 text-[17px]",
    md: "h-12 px-4 text-[16px]",
    sm: "h-10 px-3 text-[14px]",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center rounded-2xl font-semibold tracking-[-0.2px] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function calendarDays(date) {
  const start = monthStart(date);
  const cursor = new Date(start);
  cursor.setDate(1 - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + index);
    return next;
  });
}

export function Calendar({ value, onChange, markedDates = new Set() }) {
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const days = useMemo(() => calendarDays(month), [month]);
  const today = dateKey(new Date());
  const selected = dateKey(value);
  const shift = (delta) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
      <div className="mb-4 flex items-center justify-between px-1">
        <button type="button" aria-label="이전 달" onClick={() => shift(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-toss-bg">
          <Chevron dir="left" />
        </button>
        <h2 className="text-[18px] font-bold tracking-[-0.4px] text-toss-text">
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </h2>
        <button type="button" aria-label="다음 달" onClick={() => shift(1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-toss-bg">
          <Chevron dir="right" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((day, index) => (
          <div key={day} className={`py-2 text-center text-[12px] font-semibold ${index === 0 ? "text-toss-red/70" : "text-toss-500"}`}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const outside = day.getMonth() !== month.getMonth();
          const isSelected = key === selected;
          const isToday = key === today;
          const marked = markedDates.has(key);
          return (
            <button key={key + String(outside)} type="button" onClick={() => onChange(day)} className="relative flex h-12 flex-col items-center justify-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-semibold tracking-[-0.3px] ${
                  isSelected ? "bg-toss-blue text-white" : isToday ? "text-toss-blue" : outside ? "text-toss-400" : "text-toss-text"
                }`}
              >
                {day.getDate()}
              </span>
              {marked && <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-toss-blue"}`} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function InstallTip() {
  const [hidden, setHidden] = useState(() => isInstallTipDismissed() || !isIos() || isStandalone());
  if (hidden) return null;
  return (
    <div className="mb-4 rounded-2xl bg-toss-blue-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-toss-text">홈 화면에 추가하면 앱처럼 쓸 수 있어요</p>
          <p className="mt-1 text-[13px] leading-relaxed text-toss-600">
            Safari 공유 버튼에서 <strong className="font-semibold">홈 화면에 추가</strong>를 눌러 주세요.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-[13px] font-semibold text-toss-blue"
          onClick={() => {
            dismissInstallTip();
            setHidden(true);
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export function ScoreRing({ score = 0 }) {
  const [shown, setShown] = useState(0);
  const circumference = 2 * Math.PI * 58;
  const offset = (shown / 100) * circumference;
  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / 1100);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="animate-score-pop relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg className="-rotate-90" width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="58" stroke="#E8F3FF" strokeWidth="14" fill="none" />
        <circle
          cx="80"
          cy="80"
          r="58"
          stroke="#3182F6"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - offset}
        />
      </svg>
      <div className="absolute text-center">
        <strong className="block text-[44px] font-extrabold leading-none tracking-[-1.5px] text-toss-text">{shown}</strong>
        <span className="text-[13px] font-semibold text-toss-500">점</span>
      </div>
    </div>
  );
}

function asList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [String(value)];
}

function itemText(value) {
  return typeof value === "string" ? value : value?.text || "";
}

export function Mindmap({ data, keywords = [] }) {
  const center = data?.center || "모범 답안";
  const branches =
    Array.isArray(data?.branches) && data.branches.length
      ? data.branches.map((item) => ({ label: item.label || "키워드", children: asList(item.children) }))
      : keywords.length
        ? [{ label: "기억할 단어", children: keywords }]
        : [];
  if (!branches.length) return null;
  return (
    <div className="rounded-2xl bg-toss-bg px-3 py-4">
      <p className="mb-3 text-center text-[12px] font-bold text-toss-500">모범 답안 키워드 마인드맵</p>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-toss-blue px-4 py-2 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgba(49,130,246,0.28)]">{center}</div>
        <div className="h-4 w-px bg-toss-300" />
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
          {branches.map((branch) => (
            <div key={branch.label} className="rounded-2xl bg-white px-3 py-3 shadow-[0_4px_12px_rgba(25,31,40,0.05)]">
              <p className="text-center text-[12px] font-bold text-toss-blue">{branch.label}</p>
              <ul className="mt-2 flex flex-col items-center gap-1.5">
                {branch.children.map((child) => (
                  <li key={`${branch.label}-${child}`} className="rounded-full bg-toss-blue-soft px-2.5 py-1 text-[11px] font-semibold text-toss-text">
                    {child}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEEDBACK_TABS = [
  { id: "habits", label: "말하기 습관" },
  { id: "content", label: "답변 내용" },
  { id: "compare", label: "답안 비교" },
  { id: "keywords", label: "키워드" },
];

export function FeedbackCard({
  score = 0,
  strengths = [],
  weaknesses = [],
  deduction_details = [],
  feedback_habits = "",
  feedback_content = "",
  model_answer = "",
  missing_points = [],
  sentence_rewrites = [],
  keywords = [],
  mindmap = null,
  question = "",
  answer = "",
  source,
  apiError = "",
  compact = false,
  fromQuestionBank = false,
}) {
  const [tab, setTab] = useState("compare");
  const plusItems = strengths.length ? strengths : deduction_details;
  return (
    <div className={compact ? "" : "animate-fade-up"}>
      <section className="rounded-2xl bg-white px-5 py-6 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
        <ScoreRing score={score} />
        <p className="mt-1 text-center text-[13px] font-semibold text-toss-500">
          {source === "mock" ? "체험 분석 · 이번 답변 가점" : "실무 채점 · 이번 답변 가점"}
        </p>
        {source === "mock" && (
          <div className="mt-4 rounded-2xl bg-[#FFF6E6] px-4 py-3">
            <p className="text-[14px] font-bold text-[#C27A00]">OpenAI가 연결되지 않아 템플릿 분석입니다</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#8A5A00]">
              {apiError || "설정에서 API 키를 저장하면 비교·문장 다듬기가 답변마다 달라집니다."}
            </p>
          </div>
        )}
        <div className="mt-5 border-t border-toss-200 pt-4">
          <p className="text-[13px] font-bold text-toss-500">잘한 점 · 이번 답변</p>
          <ul className="mt-3 space-y-2">
            {(plusItems.length ? plusItems : [{ text: "기본 전달은 되었습니다.", points: score }]).map((item, index) => (
              <li key={`s-${index}`} className="flex items-start gap-3 rounded-2xl bg-toss-blue-soft px-4 py-3">
                <span className="mt-0.5 flex h-5 shrink-0 items-center justify-center rounded-full bg-toss-blue px-1.5 text-[11px] font-bold text-white">
                  +{item.points || 0}
                </span>
                <p className="text-[14px] font-semibold leading-relaxed text-toss-text">{itemText(item)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5">
          <p className="text-[13px] font-bold text-toss-500">못한 점 · 이번 답변</p>
          <ul className="mt-3 space-y-2">
            {(weaknesses.length ? weaknesses : [{ text: "보완할 점을 더 구체화해 보세요." }]).map((item, index) => (
              <li key={`w-${index}`} className="flex items-start gap-3 rounded-2xl bg-[#FFF6F6] px-4 py-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-toss-red text-[11px] font-bold text-white">!</span>
                <p className="text-[14px] font-semibold leading-relaxed text-toss-text">{itemText(item)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {(question || answer) && (
        <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
          {question && (
            <>
              <p className="text-[12px] font-bold text-toss-500">면접관 질문</p>
              <p className="mt-1 text-[16px] font-bold leading-snug tracking-[-0.3px] text-toss-text">{question}</p>
            </>
          )}
          {answer && (
            <>
              <p className="mt-4 text-[12px] font-bold text-toss-500">내 답변</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-toss-700">{answer}</p>
            </>
          )}
        </section>
      )}
      <section className="mt-4 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-toss-bg p-1">
          {FEEDBACK_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-2xl px-1 py-2.5 text-[11px] font-bold tracking-[-0.2px] transition-all ${
                tab === item.id ? "bg-white text-toss-blue shadow-[0_4px_12px_rgba(25,31,40,0.08)]" : "text-toss-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === "compare" ? (
          <div className="px-2 py-4">
            <p className="text-[13px] font-bold text-toss-text">모범 답안에 있는데 빠진 내용</p>
            <ul className="mt-2 space-y-2">
              {(missing_points || []).length === 0 ? (
                <li className="text-[14px] text-toss-600">빠진 핵심이 거의 없습니다. 수치만 보강하면 됩니다.</li>
              ) : (
                missing_points.map((item, index) => (
                  <li key={`m-${index}`} className="rounded-2xl bg-toss-bg px-3 py-2 text-[14px] leading-relaxed text-toss-700">
                    {itemText(item)}
                  </li>
                ))
              )}
            </ul>
            <p className="mt-5 text-[13px] font-bold text-toss-text">문장 다듬기 · 모범 답안 기준</p>
            <ul className="mt-2 space-y-3">
              {(sentence_rewrites || []).length === 0 ? (
                <li className="text-[14px] text-toss-600">다듬을 문장이 충분히 잡히지 않았습니다.</li>
              ) : (
                sentence_rewrites.map((item, index) => (
                  <li key={`r-${index}`} className="rounded-2xl border border-toss-200 p-3">
                    {item.original && <p className="text-[13px] leading-relaxed text-toss-500">기존 · {item.original}</p>}
                    <p className="mt-2 text-[14px] font-semibold leading-relaxed text-toss-text">다듬기 · {item.improved}</p>
                    {item.reason && <p className="mt-1 text-[12px] text-toss-500">{item.reason}</p>}
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : tab === "keywords" ? (
          <div className="px-2 py-4">
            <Mindmap data={mindmap} keywords={keywords} />
            {(keywords || []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {keywords.map((word) => (
                  <span key={word} className="rounded-full bg-toss-blue-soft px-3 py-1.5 text-[13px] font-bold text-toss-blue">
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap px-2 py-4 text-[15px] leading-relaxed text-toss-700">
            {(tab === "habits" ? feedback_habits : feedback_content) || "해당 항목의 피드백이 없습니다."}
          </p>
        )}
      </section>
      {model_answer && (
        <section className="mt-4 rounded-2xl bg-toss-blue p-5 shadow-[0_12px_28px_rgba(49,130,246,0.28)]">
          <p className="text-[13px] font-bold text-white/80">{fromQuestionBank ? "준비된 모범 답안" : "자소서 스펙 기반 모범 답안"}</p>
          <p className="mt-1 text-[16px] font-extrabold tracking-[-0.3px] text-white">면접장에서 이렇게 말해 보세요</p>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-white/95">{model_answer}</p>
          {(keywords || []).length > 0 && (
            <div className="mt-4">
              <p className="text-[12px] font-bold text-white/80">이 답안에서 기억할 핵심 키워드</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {keywords.map((word) => (
                  <span key={word} className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-bold text-white">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function RecordCard({ record, onOpen }) {
  const weaknesses = (normalizeFeedback(record).weaknesses || []).slice(0, 2).map((item) => (typeof item === "string" ? item : item.text));
  const key = trackKeyOf(record);
  const label = key === "followup" ? "꼬리질문" : trackLabel(key) || record.category || "";
  return (
    <button
      type="button"
      onClick={() => onOpen?.(record)}
      className="w-full rounded-2xl bg-white p-5 text-left shadow-[0_8px_24px_rgba(25,31,40,0.05)] transition-transform active:scale-[0.99]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-toss-blue-soft px-2.5 py-1 text-[12px] font-bold text-toss-blue">{record.score}점</span>
          {label && <span className="rounded-full bg-toss-bg px-2.5 py-1 text-[11px] font-bold text-toss-600">{label}</span>}
        </div>
        <span className="text-[12px] font-medium text-toss-500">
          {formatKoreanTime(record.createdAt)}
          {record.isDemo ? " · 예시" : ""}
        </span>
      </div>
      <p className="line-clamp-2 text-[16px] font-bold leading-snug tracking-[-0.3px] text-toss-text">{record.question}</p>
      <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-toss-600">{record.answer}</p>
      {weaknesses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {weaknesses.map((item, index) => (
            <span key={`${item}-${index}`} className="max-w-full truncate rounded-full bg-toss-bg px-2 py-1 text-[11px] font-semibold text-toss-600">
              {item}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export function BriefingCard({ briefing, title, actionLabel, onAction }) {
  if (!briefing) return null;
  return (
    <section className="mb-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
      <p className="text-[12px] font-bold text-toss-blue">{title || "하루 리포트"}</p>
      <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.4px] text-toss-text">
        {formatKoreanDate(briefing.dateKey)} · {briefing.count}회 연습
      </h2>
      <p className="mt-1 text-[14px] text-toss-600">
        평균 {briefing.avgScore}점 · 최고 {briefing.bestScore}점
      </p>
      {briefing.focus?.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] font-bold text-toss-text">오늘 답변 vs 모범 답안</p>
          <ul className="mt-2 space-y-2">
            {briefing.focus.map((item) => (
              <li key={item} className="rounded-2xl bg-toss-blue-soft px-3 py-2 text-[14px] font-semibold leading-relaxed text-toss-blue">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {onAction && (
        <button type="button" onClick={onAction} className="mt-4 w-full text-left text-[14px] font-bold text-toss-blue">
          {actionLabel || "리포트 자세히 보기"}
        </button>
      )}
    </section>
  );
}

export function MicButton({ listening, onToggle, disabled }) {
  return (
    <div className="relative flex flex-col items-center">
      {listening && (
        <>
          <span className="mic-ring absolute inset-0 m-auto h-[88px] w-[88px] rounded-full bg-toss-blue" />
          <span className="mic-ring absolute inset-0 m-auto h-[88px] w-[88px] rounded-full bg-toss-blue [animation-delay:0.45s]" />
        </>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        aria-pressed={listening}
        className={`relative z-10 flex h-[88px] w-[88px] items-center justify-center rounded-full shadow-[0_12px_28px_rgba(49,130,246,0.35)] transition-transform active:scale-95 disabled:opacity-40 ${
          listening ? "bg-toss-red" : "bg-toss-blue"
        }`}
      >
        {listening ? <StopIcon /> : <MicIcon />}
      </button>
      <p className="mt-4 text-[15px] font-semibold text-toss-text">{listening ? "답변 종료" : "답변 시작"}</p>
      <p className="mt-1 text-[13px] text-toss-500">{listening ? "말하고 있는 내용을 받아적고 있어요" : "버튼을 누르고 편하게 말해 보세요"}</p>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-toss-200/80 ${className}`} />;
}

export function FeedbackSkeleton() {
  return (
    <div className="animate-fade-up">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="mt-3 h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-5 rounded-2xl bg-white px-5 py-6 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
        <Skeleton className="mx-auto h-40 w-40 rounded-full" />
        <Skeleton className="mt-5 h-4 w-24" />
        <Skeleton className="mt-3 h-12 w-full" />
        <Skeleton className="mt-2 h-12 w-full" />
      </div>
      <p className="mt-6 text-center text-[14px] font-semibold text-toss-500">답변을 분석하고 모범 답안을 쓰고 있어요</p>
    </div>
  );
}

export function QuestionSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-6 w-full" />
        <Skeleton className="mt-2 h-6 w-4/5" />
      </div>
      <p className="mt-6 text-center text-[14px] font-semibold text-toss-500">질문을 준비하는 중</p>
    </div>
  );
}

export function ScoreChart({ scores = [], height = 92 }) {
  if (!scores.length) return null;
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const span = Math.max(max - min, 8);
  const last = scores.length - 1;
  const point = (score, index) => ({
    x: 14 + (last === 0 ? 146 : (index / last) * 292),
    y: height - 16 - ((score - min) / span) * (height - 32),
  });
  const points = scores.map((score, index) => point(score, index));
  const line = points.map((item) => `${item.x},${item.y}`).join(" ");
  const area = `14,${height - 16} ${line} ${points[points.length - 1].x},${height - 16}`;
  return (
    <svg viewBox={`0 0 320 ${height}`} className="h-[92px] w-full" role="img" aria-label="점수 성장 곡선">
      <polyline fill="rgba(49,130,246,0.12)" stroke="none" points={area} />
      <polyline fill="none" stroke="#3182F6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={line} />
      {points.map((item, index) => (
        <g key={`${item.x}-${index}`}>
          <circle cx={item.x} cy={item.y} r={index === last ? 5 : 3.5} fill={index === last ? "#3182F6" : "#ffffff"} stroke="#3182F6" strokeWidth="2" />
          <text x={item.x} y={item.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#191F28">
            {scores[index]}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BackButton({ onClick }) {
  return (
    <button
      type="button"
      aria-label="뒤로"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(25,31,40,0.06)]"
    >
      <BackIcon />
    </button>
  );
}
