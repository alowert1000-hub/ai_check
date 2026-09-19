import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefingCard, Button, Calendar, FeedbackCard, InstallTip, PhoneShell, RecordCard, TabBar } from "../components/ui.jsx";
import { useInterview } from "../context/InterviewContext.jsx";
import { dateKey, formatKoreanDate } from "../lib/dates.js";
import { buildBriefing, getResume, markedDates, normalizeFeedback, recordsForDate, todayBankProgress } from "../lib/store.js";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "오늘 면접, 한 번 더 연습해 볼까요?";
  return "저녁에도 짧게 연습하면 좋아요";
}

export function HomePage() {
  const navigate = useNavigate();
  const { resetSession } = useInterview();
  const [selected, setSelected] = useState(new Date());
  const [opened, setOpened] = useState(null);
  const key = dateKey(selected);
  const dates = markedDates();
  const records = recordsForDate(key);
  const resume = getResume();
  const briefing = buildBriefing(dateKey(new Date()));
  const bank = todayBankProgress();

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-6">
        <header className="mb-5">
          <p className="text-[14px] font-semibold text-toss-blue">모의면접</p>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.7px] text-toss-text">{greeting()}</h1>
          <p className="mt-2 text-[14px] text-toss-600">
            오늘 질문 은행 {bank.done}/{bank.total}문항을 풀었어요. 꼬리질문 1개 다음에 은행 3개가 순환됩니다.
          </p>
        </header>
        <InstallTip />
        {briefing && (
          <BriefingCard
            briefing={briefing}
            title="오늘 리포트"
            actionLabel="오늘 종합 자세히 보기"
            onAction={() => navigate("/report")}
          />
        )}
        <Calendar value={selected} onChange={setSelected} markedDates={dates} />
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[17px] font-bold tracking-[-0.3px] text-toss-text">{formatKoreanDate(key)}</h2>
            <span className="text-[13px] font-semibold text-toss-500">{records.length}건</span>
          </div>
          {records.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
              <p className="text-[16px] font-bold text-toss-text">아직 기록이 없어요</p>
              <p className="mt-1 text-[14px] text-toss-500">이 날 면접 연습을 하면 여기에 쌓여요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record, index) => (
                <div key={record.id} className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
                  <RecordCard record={record} onOpen={setOpened} />
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="sticky bottom-3 z-10 mt-8">
          <Button
            onClick={() => {
              resetSession();
              if (!resume?.content) {
                navigate("/resume", { state: { next: "/interview" } });
                return;
              }
              navigate("/interview");
            }}
          >
            {resume?.content ? "면접 시작하기" : "자소서 먼저 작성하기"}
          </Button>
        </div>
      </main>
      <TabBar />
      {opened && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 px-0 sm:items-center">
          <div className="max-h-[86dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-toss-bg p-5 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-toss-blue-soft px-2.5 py-1 text-[12px] font-bold text-toss-blue">{opened.score}점</span>
              <button type="button" className="text-[14px] font-semibold text-toss-600" onClick={() => setOpened(null)}>
                닫기
              </button>
            </div>
            <FeedbackCard
              compact
              {...normalizeFeedback(opened)}
              question={opened.question}
              answer={opened.answer}
              fromQuestionBank={!!opened.bankId || opened.questionSource === "bank"}
            />
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
