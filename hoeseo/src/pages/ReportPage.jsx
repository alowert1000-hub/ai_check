import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, PhoneShell, ScoreChart, TabBar } from "../components/ui.jsx";
import { dateKey, formatKoreanDate } from "../lib/dates.js";
import { buildBriefing, growthSeries, sendDayReport, trackLabel } from "../lib/store.js";

function scorePath(scores) {
  return scores.map((score) => `${score}점`).join(" → ");
}

function deltaLabel(delta) {
  if (delta > 0) return `+${delta}점 상승`;
  if (delta < 0) return `${delta}점 하락`;
  return "점수 유지";
}

export function ReportPage() {
  const navigate = useNavigate();
  const today = dateKey(new Date());
  const briefing = useMemo(() => buildBriefing(today), [today]);
  const growth = useMemo(() => briefing?.growth || growthSeries(), [briefing]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <PhoneShell>
      <main className="flex-1 px-5 pt-[max(28px,env(safe-area-inset-top))] pb-6">
        <p className="text-[14px] font-semibold text-toss-blue">하루 리포트</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.7px] text-toss-text">
          오늘 답변을
          <br />
          모범 답안과 비교
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-toss-600">
          당일에 한 답변과 그날의 모범 답안을 모아 잘한 점·못한 점을 종합했습니다. 같은 질문이 반복되면 점수 변화로 성장을 봐요.
        </p>
        {briefing ? (
          <div className="mt-5 space-y-4">
            <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
              <p className="text-[12px] font-bold text-toss-blue">{formatKoreanDate(briefing.dateKey)}</p>
              <p className="mt-2 text-[32px] font-extrabold tracking-[-1px] text-toss-text">{briefing.count}회</p>
              <p className="text-[14px] text-toss-600">
                평균 {briefing.avgScore}점 · 최고 {briefing.bestScore}점
              </p>
            </section>
            <section className="rounded-2xl bg-toss-blue p-5 shadow-[0_12px_28px_rgba(49,130,246,0.28)]">
              <p className="text-[13px] font-bold text-white/80">오늘 종합 · 모범 답안 대비</p>
              <ul className="mt-3 space-y-2">
                {(briefing.focus.length ? briefing.focus : ["오늘 빠진 핵심을 다음 답변 첫 문장에 넣으세요."]).map((item) => (
                  <li key={item} className="text-[15px] font-semibold leading-relaxed text-white">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
              <p className="text-[13px] font-bold text-toss-500">고정 질문 트래킹</p>
              <p className="mt-1 text-[13px] text-toss-600">1분 자기소개 / 장점·단점 / 왜 기아인가는 매일 한 번씩 나오고, 여기서 일관성을 확인합니다.</p>
              <ul className="mt-3 space-y-3">
                {briefing.tracks.map((track) => (
                  <li key={track.key} className="rounded-2xl bg-toss-bg px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-bold text-toss-text">{track.label}</p>
                      {track.doneToday ? (
                        <span className="text-[12px] font-bold text-toss-blue">오늘 {track.todayCount}회</span>
                      ) : (
                        <span className="text-[12px] font-bold text-toss-500">오늘 아직 없음</span>
                      )}
                    </div>
                    {track.scores.length > 0 ? (
                      <>
                        <p className="mt-1 text-[13px] font-semibold text-toss-700">{scorePath(track.scores)}</p>
                        <p className="mt-0.5 text-[12px] text-toss-500">
                          {deltaLabel(track.delta)}
                          {track.todayLatest ? ` · 오늘 최신 ${track.todayLatest.score}점` : ""}
                        </p>
                        {track.scores.length >= 2 && (
                          <div className="mt-2">
                            <ScoreChart scores={track.scores} />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-[13px] text-toss-500">기록이 쌓이면 성장 곡선이 보여요.</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            {growth.length > 0 && (
              <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
                <p className="text-[13px] font-bold text-toss-500">질문별 성장 곡선</p>
                <p className="mt-1 text-[13px] text-toss-600">같은 질문을 여러 번 연습하면 점수가 단계적으로 오르는지 여기서 봅니다.</p>
                <ul className="mt-3 space-y-4">
                  {growth.map((item) => (
                    <li key={`${item.trackKey}-${item.question}`} className="rounded-2xl border border-toss-200 px-4 py-3">
                      <p className="text-[14px] font-bold leading-snug text-toss-text">{item.label}</p>
                      <p className="mt-1 text-[13px] font-semibold text-toss-blue">
                        {item.count}회 · {scorePath(item.scores)} · {deltaLabel(item.delta)}
                      </p>
                      <div className="mt-2">
                        <ScoreChart scores={item.scores} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {briefing.duplicates.length > 0 && (
              <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
                <p className="text-[13px] font-bold text-toss-500">오늘 중복 연습</p>
                <p className="mt-1 text-[13px] text-toss-600">오늘 같은 질문을 다시 푼 기록입니다.</p>
                <ul className="mt-3 space-y-3">
                  {briefing.duplicates.map((item) => (
                    <li key={`today-${item.question}`} className="rounded-2xl bg-toss-bg px-4 py-3">
                      <p className="text-[14px] font-bold leading-snug text-toss-text">{trackLabel(item.trackKey) || item.question}</p>
                      <p className="mt-1 text-[13px] font-semibold text-toss-blue">
                        {item.count}회 · {scorePath(item.scores)} · {deltaLabel(item.delta)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
              <p className="text-[13px] font-bold text-toss-500">오늘 잘한 점</p>
              <ul className="mt-2 space-y-2">
                {(briefing.strengths.length ? briefing.strengths : ["오늘 연습을 시작해 기록이 쌓이기 시작했습니다."]).map((item) => (
                  <li key={item} className="rounded-2xl bg-toss-blue-soft px-3 py-2 text-[14px] leading-relaxed text-toss-text">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[13px] font-bold text-toss-500">오늘 못한 점</p>
              <ul className="mt-2 space-y-2">
                {(briefing.weaknesses.length ? briefing.weaknesses : ["기록이 더 쌓이면 패턴이 보입니다."]).map((item) => (
                  <li key={item} className="rounded-2xl bg-[#FFF6F6] px-3 py-2 text-[14px] leading-relaxed text-toss-text">
                    {item}
                  </li>
                ))}
              </ul>
              {briefing.missing.length > 0 && (
                <>
                  <p className="mt-5 text-[13px] font-bold text-toss-500">모범 답안 대비 빠진 내용</p>
                  <ul className="mt-2 space-y-2">
                    {briefing.missing.map((item) => (
                      <li key={item} className="rounded-2xl bg-toss-bg px-3 py-2 text-[14px] leading-relaxed text-toss-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white px-5 py-10 text-center shadow-[0_8px_24px_rgba(25,31,40,0.05)]">
            <p className="text-[16px] font-bold text-toss-text">오늘 아직 연습이 없어요</p>
            <p className="mt-1 text-[14px] text-toss-500">한 번 답하면 이 화면에 오늘 종합이 쌓입니다.</p>
          </div>
        )}
        <div className="mt-8 space-y-2">
          {briefing && (
            <Button
              variant="secondary"
              disabled={sending}
              onClick={async () => {
                setSending(true);
                setMessage("");
                try {
                  const result = await sendDayReport(today, { markSent: false });
                  setMessage(
                    result.skipped
                      ? "오늘 실제 연습 기록이 없어 메일을 보내지 않았어요. 예시 기록은 제외됩니다."
                      : "오늘 리포트를 메일로 보냈어요.",
                  );
                } catch (error) {
                  setMessage(error.message || "메일 발송에 실패했습니다.");
                } finally {
                  setSending(false);
                }
              }}
            >
              {sending ? "보내는 중..." : "오늘 리포트 메일로 받기"}
            </Button>
          )}
          <Button onClick={() => navigate("/interview")}>이어서 면접 연습</Button>
          {message && <p className="pt-1 text-[13px] font-semibold leading-relaxed text-toss-blue">{message}</p>}
        </div>
      </main>
      <TabBar />
    </PhoneShell>
  );
}
